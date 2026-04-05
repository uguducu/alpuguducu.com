const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// Load environment variables
try { require('dotenv').config(); } catch {}
const PORT = process.env.PORT || 3000;

// Initialize database
const db = require('./db/database');
db.init();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api', require('./routes/api'));
app.use('/api/admin', require('./routes/admin'));

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Serve public portfolio
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n  ⚡ alpuguducu.com running at http://localhost:${PORT}`);
    console.log(`  📋 Admin panel at http://localhost:${PORT}/admin`);
    console.log(`  🔑 Default login: admin / admin123\n`);
});
