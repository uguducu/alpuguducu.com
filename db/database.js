const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'portfolio.db');
let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}

function init() {
    const conn = getDb();

    // Create tables
    conn.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT DEFAULT '',
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT (datetime('now', 'localtime'))
        );

        CREATE TABLE IF NOT EXISTS content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            section TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL DEFAULT '',
            updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
            UNIQUE(section, key)
        );

        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT (datetime('now', 'localtime'))
        );
    `);

    // Seed default admin if none exists
    const adminCount = conn.prepare('SELECT COUNT(*) as count FROM admins').get();
    if (adminCount.count === 0) {
        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        const hashed = bcrypt.hashSync(password, 10);
        conn.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run(username, hashed);
    }

    // Seed default content if none exists
    const contentCount = conn.prepare('SELECT COUNT(*) as count FROM content').get();
    if (contentCount.count === 0) {
        seedContent(conn);
    }
}

function seedContent(conn) {
    const insert = conn.prepare('INSERT OR IGNORE INTO content (section, key, value) VALUES (?, ?, ?)');

    const defaults = [
        // Hero
        ['hero', 'greeting', 'Merhaba, ben'],
        ['hero', 'name_first', 'ALP'],
        ['hero', 'name_last', 'UĞUDUCU'],
        ['hero', 'roles', 'Full Stack Developer,UI/UX Designer,Creative Coder,Problem Solver'],

        // About
        ['about', 'title', 'Kod yazıyorum,\ndeneyim tasarlıyorum.'],
        ['about', 'description', 'Dijital dünyada sıradan olmayı reddeden bir geliştirici. Her projede kullanıcı deneyimini ön planda tutarak, performans ve estetik arasında mükemmel dengeyi kuruyorum.\n\nModern web teknolojileri, yaratıcı kodlama ve minimalist tasarım anlayışıyla projelerinizi hayata geçiriyorum. Amacım sadece çalışan değil, hissettiren ürünler yaratmak.'],
        ['about', 'stats', '5:Yıl Deneyim,50:Proje,30:Mutlu Müşteri'],
        ['about', 'tech_stack', 'React,Next.js,TypeScript,Node.js,Python,PostgreSQL,Docker,AWS,Figma,Three.js'],

        // Experience
        ['experience', 'items', JSON.stringify([
            { date: '2024 — Şimdi', title: 'Senior Full Stack Developer', company: 'Freelance & Danışmanlık', desc: 'End-to-end web çözümleri, startup danışmanlığı ve teknik liderlik.' },
            { date: '2022 — 2024', title: 'Full Stack Developer', company: 'Tech Startup', desc: 'React & Node.js ile ölçeklenebilir web uygulamaları geliştirme.' },
            { date: '2020 — 2022', title: 'Frontend Developer', company: 'Dijital Ajans', desc: 'Kurumsal web siteleri ve e-ticaret platformları.' },
            { date: '2019 — 2020', title: 'Junior Developer', company: 'Yazılım Şirketi', desc: 'Web geliştirme temelleri ve profesyonel yazılım süreçleri.' }
        ])],

        // Projects
        ['projects', 'items', JSON.stringify([
            { category: 'Web Uygulama', title: 'E-Ticaret Platformu', desc: 'Next.js & Stripe entegrasyonlu modern e-ticaret deneyimi.', tech: 'Next.js,Stripe,PostgreSQL', link: '#' },
            { category: 'SaaS', title: 'Dashboard Analytics', desc: 'Real-time veri görselleştirme ve raporlama paneli.', tech: 'React,D3.js,Node.js', link: '#' },
            { category: 'Mobil Uygulama', title: 'Fitness Tracker', desc: 'React Native ile cross-platform sağlık takip uygulaması.', tech: 'React Native,Firebase,Redux', link: '#' },
            { category: 'Creative', title: 'Interactive Portfolio', desc: 'WebGL ve Three.js ile interaktif 3D portfolyo deneyimi.', tech: 'Three.js,GLSL,GSAP', link: '#' }
        ])],

        // Services
        ['services', 'items', JSON.stringify([
            { title: 'Web Geliştirme', desc: 'Modern ve performanslı web uygulamaları. React, Next.js, Vue.js ile SPA/SSR çözümleri. REST & GraphQL API geliştirme.' },
            { title: 'UI/UX Tasarım', desc: 'Kullanıcı odaklı arayüz tasarımı. Wireframe, prototip ve design system oluşturma. Figma ile pixel-perfect tasarımlar.' },
            { title: 'Mobil Uygulama', desc: 'React Native ile iOS ve Android uygulamaları. Cross-platform geliştirme, native performans. App Store & Play Store yayınlama.' },
            { title: 'Danışmanlık', desc: 'Teknik danışmanlık ve code review. Mimari kararlar, teknoloji seçimi ve ekip mentörlüğü. Startup MVP danışmanlığı.' }
        ])],

        // Contact
        ['contact', 'title', 'Birlikte\nçalışalım'],
        ['contact', 'subtitle', 'Bir sonraki projeniz için hazırım. Hadi konuşalım.'],
        ['contact', 'email', 'hello@alpuguducu.com'],
        ['contact', 'linkedin', 'https://linkedin.com/in/alpuguducu'],
        ['contact', 'github', 'https://github.com/alpuguducu'],
        ['contact', 'twitter', 'https://twitter.com/alpuguducu'],
        ['contact', 'location', 'Istanbul, Turkey'],
    ];

    const insertMany = conn.transaction((items) => {
        for (const [section, key, value] of items) {
            insert.run(section, key, value);
        }
    });
    insertMany(defaults);
}

// === CRUD Helpers ===

const messages = {
    getAll() {
        return getDb().prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
    },
    getById(id) {
        return getDb().prepare('SELECT * FROM messages WHERE id = ?').get(id);
    },
    create({ name, email, subject, message }) {
        return getDb().prepare(
            'INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)'
        ).run(name, email, subject || '', message);
    },
    markRead(id) {
        return getDb().prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(id);
    },
    markUnread(id) {
        return getDb().prepare('UPDATE messages SET is_read = 0 WHERE id = ?').run(id);
    },
    delete(id) {
        return getDb().prepare('DELETE FROM messages WHERE id = ?').run(id);
    },
    getUnreadCount() {
        return getDb().prepare('SELECT COUNT(*) as count FROM messages WHERE is_read = 0').get().count;
    },
    getCount() {
        return getDb().prepare('SELECT COUNT(*) as count FROM messages').get().count;
    }
};

const content = {
    getAll() {
        return getDb().prepare('SELECT * FROM content ORDER BY section, key').all();
    },
    getBySection(section) {
        const rows = getDb().prepare('SELECT key, value FROM content WHERE section = ?').all(section);
        const result = {};
        for (const row of rows) {
            result[row.key] = row.value;
        }
        return result;
    },
    getAllGrouped() {
        const rows = getDb().prepare('SELECT section, key, value FROM content ORDER BY section').all();
        const result = {};
        for (const row of rows) {
            if (!result[row.section]) result[row.section] = {};
            result[row.section][row.key] = row.value;
        }
        return result;
    },
    update(section, key, value) {
        return getDb().prepare(
            `INSERT INTO content (section, key, value, updated_at) VALUES (?, ?, ?, datetime('now', 'localtime'))
             ON CONFLICT(section, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
        ).run(section, key, value);
    }
};

const admins = {
    getByUsername(username) {
        return getDb().prepare('SELECT * FROM admins WHERE username = ?').get(username);
    },
    updatePassword(id, hashedPassword) {
        return getDb().prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashedPassword, id);
    }
};

module.exports = { init, getDb, messages, content, admins };
