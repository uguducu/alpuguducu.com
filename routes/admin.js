const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { generateToken, verifyAuth } = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
    }

    const admin = db.admins.getByUsername(username);
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
        return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
    }

    const token = generateToken(admin);
    res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict'
    });

    res.json({ success: true, token, admin: { id: admin.id, username: admin.username } });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// GET /api/admin/me — check auth status
router.get('/me', verifyAuth, (req, res) => {
    res.json({ admin: req.admin });
});

// === MESSAGES ===

// GET /api/admin/messages
router.get('/messages', verifyAuth, (req, res) => {
    try {
        const messages = db.messages.getAll();
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Mesajlar yüklenemedi.' });
    }
});

// GET /api/admin/messages/:id
router.get('/messages/:id', verifyAuth, (req, res) => {
    try {
        const message = db.messages.getById(req.params.id);
        if (!message) return res.status(404).json({ error: 'Mesaj bulunamadı.' });
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: 'Mesaj yüklenemedi.' });
    }
});

// PATCH /api/admin/messages/:id/read
router.patch('/messages/:id/read', verifyAuth, (req, res) => {
    try {
        db.messages.markRead(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'İşlem başarısız.' });
    }
});

// PATCH /api/admin/messages/:id/unread
router.patch('/messages/:id/unread', verifyAuth, (req, res) => {
    try {
        db.messages.markUnread(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'İşlem başarısız.' });
    }
});

// DELETE /api/admin/messages/:id
router.delete('/messages/:id', verifyAuth, (req, res) => {
    try {
        db.messages.delete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Silme işlemi başarısız.' });
    }
});

// === CONTENT ===

// GET /api/admin/content
router.get('/content', verifyAuth, (req, res) => {
    try {
        const content = db.content.getAllGrouped();
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'İçerik yüklenemedi.' });
    }
});

// PUT /api/admin/content
router.put('/content', verifyAuth, (req, res) => {
    const { section, key, value } = req.body;

    if (!section || !key || value === undefined) {
        return res.status(400).json({ error: 'Section, key ve value gerekli.' });
    }

    try {
        db.content.update(section, key, value);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'İçerik güncellenemedi.' });
    }
});

// PUT /api/admin/content/bulk
router.put('/content/bulk', verifyAuth, (req, res) => {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
        return res.status(400).json({ error: 'Updates array gerekli.' });
    }

    try {
        for (const { section, key, value } of updates) {
            if (section && key && value !== undefined) {
                db.content.update(section, key, value);
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'İçerik güncellenemedi.' });
    }
});

// === DASHBOARD STATS ===

// GET /api/admin/stats
router.get('/stats', verifyAuth, (req, res) => {
    try {
        const totalMessages = db.messages.getCount();
        const unreadMessages = db.messages.getUnreadCount();
        const recentMessages = db.getDb().prepare(
            `SELECT * FROM messages ORDER BY created_at DESC LIMIT 5`
        ).all();

        res.json({ totalMessages, unreadMessages, recentMessages });
    } catch (err) {
        res.status(500).json({ error: 'İstatistikler yüklenemedi.' });
    }
});

// === CHANGE PASSWORD ===

router.put('/password', verifyAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gerekli.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalı.' });
    }

    const admin = db.admins.getByUsername(req.admin.username);
    if (!bcrypt.compareSync(currentPassword, admin.password)) {
        return res.status(401).json({ error: 'Mevcut şifre hatalı.' });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.admins.updatePassword(admin.id, hashed);
    res.json({ success: true, message: 'Şifre başarıyla güncellendi.' });
});

module.exports = router;
