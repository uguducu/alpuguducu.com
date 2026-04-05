const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/content — public content for portfolio
router.get('/content', (req, res) => {
    try {
        const content = db.content.getAllGrouped();
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'İçerik yüklenemedi.' });
    }
});

// GET /api/content/:section — single section content
router.get('/content/:section', (req, res) => {
    try {
        const content = db.content.getBySection(req.params.section);
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'İçerik yüklenemedi.' });
    }
});

// POST /api/messages — contact form submission
router.post('/messages', (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'İsim, email ve mesaj alanları zorunludur.' });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Geçerli bir email adresi girin.' });
    }

    // Rate limiting check (simple: max 5 messages per email per hour)
    try {
        const recent = db.getDb().prepare(
            `SELECT COUNT(*) as count FROM messages
             WHERE email = ? AND created_at > datetime('now', '-1 hour', 'localtime')`
        ).get(email);

        if (recent.count >= 5) {
            return res.status(429).json({ error: 'Çok fazla mesaj gönderdiniz. Lütfen biraz bekleyin.' });
        }

        db.messages.create({ name, email, subject, message });
        res.json({ success: true, message: 'Mesajınız başarıyla gönderildi!' });
    } catch (err) {
        res.status(500).json({ error: 'Mesaj gönderilemedi, lütfen tekrar deneyin.' });
    }
});

module.exports = router;
