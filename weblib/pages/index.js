import { useState, useEffect } from 'react';

export default function Home() {
    const [links, setLinks] = useState([]);

    useEffect(() => {
        fetch('/api/links')
            .then((res) => res.json())
            .then((data) => setLinks(data.links));
    }, []);

    return (
        <div>
            <h1>Links</h1>
            <ul>
                {links.map((link) => (
                    <li key={link.id}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <img
                                src={link.icon_url}
                                alt={`${link.url} icon`}
                                style={{ width: '16px', height: '16px', marginRight: '8px' }}
                            />
                            {link.description || link.url}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
export default function Home() {
    const [links, setLinks] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch(`/api/links?q=${search}`)
            .then((res) => res.json())
            .then((data) => setLinks(data.links));
    }, [search]);

    return (
        <div>
            <h1>Links</h1>
            <input
                type="text"
                placeholder="Search links..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: '16px', padding: '8px', width: '100%' }}
            />
            <ul>
                {links.map((link) => (
                    <li key={link.id}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <img
                                src={link.icon_url}
                                alt={`${link.url} icon`}
                                style={{ width: '16px', height: '16px', marginRight: '8px' }}
                            />
                            {link.description || link.url}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
export async function getServerSideProps() {
    const res = await fetch('http://localhost:3000/api/links');
    const data = await res.json();

    return {
        props: { links: data.links },
    };
}

export default function Home({ links }) {
    return (
        <div>
            <h1>Links</h1>
            <ul>
                {links.map((link) => (
                    <li key={link.id}>{link.url}</li>
                ))}
            </ul>
        </div>
    );
}
