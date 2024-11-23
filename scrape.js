const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

// Function to download and save the icon
async function downloadIcon(iconUrl, url) {
    if (!iconUrl) return null;

    const iconHash = crypto.createHash('md5').update(iconUrl).digest('hex'); // Create a unique hash for the icon
    const iconPath = path.join(__dirname, 'websites', 'icons', `${iconHash}.ico`);

    // Check if the icon already exists
    if (fs.existsSync(iconPath)) {
        console.log(`Icon already exists for ${url}. Skipping download.`);
        return iconPath; // Return the existing icon path
    }

    try {
        const response = await axios.get(iconUrl, { responseType: 'stream' });

        // Ensure the icons folder exists
        const iconsFolder = path.join(__dirname, 'websites', 'icons');
        if (!fs.existsSync(iconsFolder)) {
            fs.mkdirSync(iconsFolder, { recursive: true });
        }

        // Save the icon to the icons folder
        const writer = fs.createWriteStream(iconPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(iconPath)); // Resolve with the saved icon path
            writer.on('error', (err) => reject(err)); // Reject on error
        });
    } catch (error) {
        console.error(`Error downloading icon for ${url}:`, error);
        return null; // Return null if download fails
    }
}

// Backup method to check and restore the icon if missing
async function restoreIcon(iconUrl, url) {
    if (!iconUrl) return null;

    const iconHash = crypto.createHash('md5').update(iconUrl).digest('hex'); // Create a unique hash for the icon
    const iconPath = path.join(__dirname, 'websites', 'icons', `${iconHash}.ico`);

    // If the icon file exists, return the path
    if (fs.existsSync(iconPath)) {
        console.log(`Icon found for ${url} at ${iconPath}`);
        return iconPath;
    }

    // If the icon file is missing, attempt to re-download it
    console.log(`Icon missing for ${url}. Re-downloading...`);
    return await downloadIcon(iconUrl, url);
}

// Function to scrape website's metadata
async function scrapeMetadata(browser, url) {
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Scrape icon (favicon)
        const iconUrl = await page.$eval('link[rel="icon"], link[rel="shortcut icon"]', (el) => el.href).catch(() => null);

        // Scrape description
        const description = await page.$eval('meta[name="description"]', (el) => el.content).catch(() => null);

        await page.close();

        // Attempt to restore the icon if it's missing
        const iconPath = await restoreIcon(iconUrl, url);

        return { iconPath, description, iconUrl };
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return { iconPath: null, description: null, iconUrl: null };
    }
}

// Function to update the database with the scraped data
function updateDatabase(linkId, iconPath, description, iconUrl) {
    const db = new sqlite3.Database('./links_database.db');

    db.run(`
        UPDATE links 
        SET icon_url = ?, description = ?, icon_backup_url = ?
        WHERE id = ?
    `, [iconPath, description, iconUrl, linkId], function (err) {
        if (err) {
            console.error(`Failed to update link ${linkId}:`, err);
        } else {
            console.log(`Updated link ${linkId}`);
        }
    });

    db.close();
}

// Cronjob: Scrape and update links in the database
async function scrapeAndUpdateLinks(browser) {
    const db = new sqlite3.Database('./links_database.db');

    db.all('SELECT id, url FROM links', [], async (err, rows) => {
        if (err) {
            console.error('Error fetching links:', err);
            return;
        }

        for (let row of rows) {
            const { id, url } = row;
            console.log(`Scraping ${url}...`);
            const { iconPath, description, iconUrl } = await scrapeMetadata(browser, url);
            updateDatabase(id, iconPath, description, iconUrl);
        }

        db.close();
    });
}

// Function to initialize Puppeteer and run the scraping
async function initScraping() {
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

    // Run the cronjob every 24 hours
    setInterval(() => scrapeAndUpdateLinks(browser), 24 * 60 * 60 * 1000);  // 24 hours
    scrapeAndUpdateLinks(browser);  // Initial run
}

// Start the scraping process
initScraping();
