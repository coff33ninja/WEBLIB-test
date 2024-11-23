import sqlite3 from 'sqlite3';

export default async function handler(req, res) {
    // Connect to the SQLite database
    const db = new sqlite3.Database('./links_database.db');

    // Query to fetch categories with their links
    db.all(`
        SELECT categories.id AS category_id, categories.name, links.id AS link_id, links.title, links.url, links.description, links.icon_url
        FROM categories
        LEFT JOIN links ON categories.id = links.category_id
    `, [], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        // Organize the data into categories and links
        const categories = rows.reduce((acc, row) => {
            if (!acc[row.category_id]) {
                acc[row.category_id] = {
                    id: row.category_id,
                    name: row.name,
                    links: [],
                };
            }
            acc[row.category_id].links.push({
                id: row.link_id,
                title: row.title,
                url: row.url,
                description: row.description,
                icon_url: row.icon_url,
            });
            return acc;
        }, {});

        res.status(200).json(Object.values(categories));
    });
}
import { query } from '../../lib/db';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const links = await query('SELECT id, url, description, icon_url FROM links');
            res.status(200).json({ links });
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
export default async function handler(req, res) {
    const { q } = req.query; // Get the query parameter

    if (req.method === 'GET') {
        try {
            const sql = q
                ? 'SELECT id, url, description, icon_url FROM links WHERE description LIKE ? OR url LIKE ?'
                : 'SELECT id, url, description, icon_url FROM links';

            const params = q ? [`%${q}%`, `%${q}%`] : [];

            const links = await query(sql, params);
            res.status(200).json({ links });
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
