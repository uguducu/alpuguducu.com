/* ═══════════════════════════════════════════
   ADMIN PANEL — JAVASCRIPT
   ═══════════════════════════════════════════ */

const API = '/api/admin';
let currentContent = {};

// ── Helpers ──────────────────────────────────

async function api(path, options = {}) {
    const res = await fetch(API + path, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Bir hata oluştu');
    return data;
}

function toast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
}

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return Math.floor(diff / 60) + ' dk önce';
    if (diff < 86400) return Math.floor(diff / 3600) + ' saat önce';
    if (diff < 604800) return Math.floor(diff / 86400) + ' gün önce';
    return date.toLocaleDateString('tr-TR');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ── Auth ─────────────────────────────────────

async function checkAuth() {
    try {
        const data = await api('/me');
        showPanel(data.admin);
    } catch {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showPanel(admin) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    document.getElementById('adminName').textContent = admin.username;
    loadDashboard();
}

// Login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const error = document.getElementById('loginError');
    btn.disabled = true;
    error.textContent = '';

    try {
        const data = await api('/login', {
            method: 'POST',
            body: JSON.stringify({
                username: document.getElementById('loginUsername').value,
                password: document.getElementById('loginPassword').value
            })
        });
        showPanel(data.admin);
    } catch (err) {
        error.textContent = err.message;
    } finally {
        btn.disabled = false;
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch(API + '/logout', { method: 'POST' });
    showLogin();
});

// ── Navigation ───────────────────────────────

const pageTitles = {
    dashboard: 'Dashboard',
    messages: 'Mesajlar',
    content: 'İçerik Yönetimi',
    settings: 'Ayarlar'
};

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        navigateTo(page);
    });
});

function navigateTo(page) {
    // Update nav
    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');

    // Update title
    document.getElementById('pageTitle').textContent = pageTitles[page] || page;

    // Load page data
    if (page === 'dashboard') loadDashboard();
    if (page === 'messages') loadMessages();
    if (page === 'content') loadContentEditor();

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
}

// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ── Dashboard ────────────────────────────────

async function loadDashboard() {
    try {
        const stats = await api('/stats');
        document.getElementById('statTotal').textContent = stats.totalMessages;
        document.getElementById('statUnread').textContent = stats.unreadMessages;

        // Update badge
        const badge = document.getElementById('unreadBadge');
        if (stats.unreadMessages > 0) {
            badge.style.display = 'inline';
            badge.textContent = stats.unreadMessages;
        } else {
            badge.style.display = 'none';
        }

        // Recent messages
        const container = document.getElementById('recentMessages');
        if (stats.recentMessages.length === 0) {
            container.innerHTML = '<div class="empty-state">Henüz mesaj yok.</div>';
            return;
        }

        container.innerHTML = stats.recentMessages.map(msg => `
            <div class="message-row ${msg.is_read ? '' : 'unread'}" data-id="${msg.id}">
                <div class="message-dot"></div>
                <div class="message-info">
                    <div class="message-sender">${escapeHtml(msg.name)}</div>
                    <div class="message-preview">${escapeHtml(msg.subject || msg.message).substring(0, 80)}</div>
                </div>
                <div class="message-time">${timeAgo(msg.created_at)}</div>
            </div>
        `).join('');

        container.querySelectorAll('.message-row').forEach(row => {
            row.addEventListener('click', () => openMessage(row.dataset.id));
        });
    } catch (err) {
        toast(err.message, 'error');
    }
}

// ── Messages ─────────────────────────────────

async function loadMessages() {
    try {
        const messages = await api('/messages');
        const container = document.getElementById('messagesList');

        if (messages.length === 0) {
            container.innerHTML = '<div class="empty-state">Henüz mesaj yok.</div>';
            return;
        }

        container.innerHTML = messages.map(msg => `
            <div class="message-row ${msg.is_read ? '' : 'unread'}" data-id="${msg.id}">
                <div class="message-dot"></div>
                <div class="message-info">
                    <div class="message-sender">${escapeHtml(msg.name)} &middot; ${escapeHtml(msg.email)}</div>
                    <div class="message-preview">${escapeHtml(msg.subject ? msg.subject + ' — ' : '')}${escapeHtml(msg.message).substring(0, 100)}</div>
                </div>
                <div class="message-time">${timeAgo(msg.created_at)}</div>
            </div>
        `).join('');

        container.querySelectorAll('.message-row').forEach(row => {
            row.addEventListener('click', () => openMessage(row.dataset.id));
        });
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function openMessage(id) {
    try {
        const msg = await api(`/messages/${id}`);

        // Mark as read
        if (!msg.is_read) {
            await api(`/messages/${id}/read`, { method: 'PATCH' });
        }

        const detail = document.getElementById('messageDetail');
        detail.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">Gönderen</div>
                <div class="detail-value">${escapeHtml(msg.name)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">E-posta</div>
                <div class="detail-value"><a href="mailto:${escapeHtml(msg.email)}" style="color:var(--accent)">${escapeHtml(msg.email)}</a></div>
            </div>
            ${msg.subject ? `<div class="detail-row"><div class="detail-label">Konu</div><div class="detail-value">${escapeHtml(msg.subject)}</div></div>` : ''}
            <div class="detail-row">
                <div class="detail-label">Mesaj</div>
                <div class="detail-value">${escapeHtml(msg.message).replace(/\n/g, '<br>')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Tarih</div>
                <div class="detail-value">${new Date(msg.created_at).toLocaleString('tr-TR')}</div>
            </div>
        `;

        const actions = document.getElementById('messageActions');
        actions.innerHTML = `
            <button class="btn btn-sm" onclick="toggleRead(${msg.id}, ${msg.is_read})">${msg.is_read ? 'Okunmadı İşaretle' : 'Okundu İşaretle'}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteMessage(${msg.id})">Sil</button>
        `;

        document.getElementById('messageModal').classList.add('active');
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function toggleRead(id, isRead) {
    try {
        await api(`/messages/${id}/${isRead ? 'unread' : 'read'}`, { method: 'PATCH' });
        document.getElementById('messageModal').classList.remove('active');
        loadMessages();
        loadDashboard();
        toast(isRead ? 'Okunmadı olarak işaretlendi' : 'Okundu olarak işaretlendi');
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function deleteMessage(id) {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    try {
        await api(`/messages/${id}`, { method: 'DELETE' });
        document.getElementById('messageModal').classList.remove('active');
        loadMessages();
        loadDashboard();
        toast('Mesaj silindi');
    } catch (err) {
        toast(err.message, 'error');
    }
}

// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('messageModal').classList.remove('active');
});

document.getElementById('messageModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('messageModal').classList.remove('active');
    }
});

// ── Content Editor ───────────────────────────

async function loadContentEditor() {
    try {
        currentContent = await api('/content');

        // Fill simple inputs
        document.querySelectorAll('.content-input').forEach(input => {
            const section = input.dataset.section;
            const key = input.dataset.key;
            if (currentContent[section] && currentContent[section][key] !== undefined) {
                input.value = currentContent[section][key];
            }
        });

        // Fill list editors
        renderExperienceList();
        renderProjectsList();
        renderServicesList();
    } catch (err) {
        toast(err.message, 'error');
    }
}

function renderExperienceList() {
    const container = document.getElementById('experienceList');
    let items = [];
    try { items = JSON.parse(currentContent.experience?.items || '[]'); } catch {}

    container.innerHTML = items.map((item, i) => `
        <div class="list-item" data-index="${i}">
            <button class="list-item-remove" onclick="removeExperience(${i})">&times;</button>
            <div class="form-row two-col">
                <div class="input-group">
                    <label>Tarih</label>
                    <input type="text" class="exp-date" value="${escapeHtml(item.date)}" placeholder="2024 — Şimdi">
                </div>
                <div class="input-group">
                    <label>Şirket</label>
                    <input type="text" class="exp-company" value="${escapeHtml(item.company)}" placeholder="Şirket adı">
                </div>
            </div>
            <div class="input-group">
                <label>Pozisyon</label>
                <input type="text" class="exp-title" value="${escapeHtml(item.title)}" placeholder="Full Stack Developer">
            </div>
            <div class="input-group">
                <label>Açıklama</label>
                <input type="text" class="exp-desc" value="${escapeHtml(item.desc)}" placeholder="Kısa açıklama">
            </div>
        </div>
    `).join('');
}

function renderProjectsList() {
    const container = document.getElementById('projectsList');
    let items = [];
    try { items = JSON.parse(currentContent.projects?.items || '[]'); } catch {}

    container.innerHTML = items.map((item, i) => `
        <div class="list-item" data-index="${i}">
            <button class="list-item-remove" onclick="removeProject(${i})">&times;</button>
            <div class="form-row two-col">
                <div class="input-group">
                    <label>Kategori</label>
                    <input type="text" class="proj-category" value="${escapeHtml(item.category)}" placeholder="Web Uygulama">
                </div>
                <div class="input-group">
                    <label>Başlık</label>
                    <input type="text" class="proj-title" value="${escapeHtml(item.title)}" placeholder="Proje adı">
                </div>
            </div>
            <div class="input-group">
                <label>Açıklama</label>
                <input type="text" class="proj-desc" value="${escapeHtml(item.desc)}" placeholder="Kısa açıklama">
            </div>
            <div class="form-row two-col">
                <div class="input-group">
                    <label>Teknolojiler (virgülle)</label>
                    <input type="text" class="proj-tech" value="${escapeHtml(item.tech)}" placeholder="React,Node.js">
                </div>
                <div class="input-group">
                    <label>Link</label>
                    <input type="text" class="proj-link" value="${escapeHtml(item.link || '#')}" placeholder="https://...">
                </div>
            </div>
        </div>
    `).join('');
}

function renderServicesList() {
    const container = document.getElementById('servicesList');
    let items = [];
    try { items = JSON.parse(currentContent.services?.items || '[]'); } catch {}

    container.innerHTML = items.map((item, i) => `
        <div class="list-item" data-index="${i}">
            <button class="list-item-remove" onclick="removeService(${i})">&times;</button>
            <div class="input-group">
                <label>Başlık</label>
                <input type="text" class="svc-title" value="${escapeHtml(item.title)}" placeholder="Hizmet adı">
            </div>
            <div class="input-group">
                <label>Açıklama</label>
                <textarea class="svc-desc" rows="2" placeholder="Hizmet açıklaması">${escapeHtml(item.desc)}</textarea>
            </div>
        </div>
    `).join('');
}

// Add buttons
document.getElementById('addExperience').addEventListener('click', () => {
    let items = [];
    try { items = JSON.parse(currentContent.experience?.items || '[]'); } catch {}
    items.push({ date: '', title: '', company: '', desc: '' });
    if (!currentContent.experience) currentContent.experience = {};
    currentContent.experience.items = JSON.stringify(items);
    renderExperienceList();
});

document.getElementById('addProject').addEventListener('click', () => {
    let items = [];
    try { items = JSON.parse(currentContent.projects?.items || '[]'); } catch {}
    items.push({ category: '', title: '', desc: '', tech: '', link: '#' });
    if (!currentContent.projects) currentContent.projects = {};
    currentContent.projects.items = JSON.stringify(items);
    renderProjectsList();
});

document.getElementById('addService').addEventListener('click', () => {
    let items = [];
    try { items = JSON.parse(currentContent.services?.items || '[]'); } catch {}
    items.push({ title: '', desc: '' });
    if (!currentContent.services) currentContent.services = {};
    currentContent.services.items = JSON.stringify(items);
    renderServicesList();
});

// Remove functions (global for onclick)
window.removeExperience = function(index) {
    let items = [];
    try { items = JSON.parse(currentContent.experience?.items || '[]'); } catch {}
    items.splice(index, 1);
    currentContent.experience.items = JSON.stringify(items);
    renderExperienceList();
};

window.removeProject = function(index) {
    let items = [];
    try { items = JSON.parse(currentContent.projects?.items || '[]'); } catch {}
    items.splice(index, 1);
    currentContent.projects.items = JSON.stringify(items);
    renderProjectsList();
};

window.removeService = function(index) {
    let items = [];
    try { items = JSON.parse(currentContent.services?.items || '[]'); } catch {}
    items.splice(index, 1);
    currentContent.services.items = JSON.stringify(items);
    renderServicesList();
};

// Save content
document.getElementById('saveContent').addEventListener('click', async () => {
    const status = document.getElementById('saveStatus');
    status.textContent = 'Kaydediliyor...';

    try {
        const updates = [];

        // Simple inputs
        document.querySelectorAll('.content-input').forEach(input => {
            updates.push({
                section: input.dataset.section,
                key: input.dataset.key,
                value: input.value
            });
        });

        // Experience list
        const expItems = [];
        document.querySelectorAll('#experienceList .list-item').forEach(item => {
            expItems.push({
                date: item.querySelector('.exp-date').value,
                title: item.querySelector('.exp-title').value,
                company: item.querySelector('.exp-company').value,
                desc: item.querySelector('.exp-desc').value
            });
        });
        updates.push({ section: 'experience', key: 'items', value: JSON.stringify(expItems) });

        // Projects list
        const projItems = [];
        document.querySelectorAll('#projectsList .list-item').forEach(item => {
            projItems.push({
                category: item.querySelector('.proj-category').value,
                title: item.querySelector('.proj-title').value,
                desc: item.querySelector('.proj-desc').value,
                tech: item.querySelector('.proj-tech').value,
                link: item.querySelector('.proj-link').value
            });
        });
        updates.push({ section: 'projects', key: 'items', value: JSON.stringify(projItems) });

        // Services list
        const svcItems = [];
        document.querySelectorAll('#servicesList .list-item').forEach(item => {
            svcItems.push({
                title: item.querySelector('.svc-title').value,
                desc: item.querySelector('.svc-desc').value
            });
        });
        updates.push({ section: 'services', key: 'items', value: JSON.stringify(svcItems) });

        await api('/content/bulk', {
            method: 'PUT',
            body: JSON.stringify({ updates })
        });

        status.textContent = 'Kaydedildi!';
        toast('İçerik başarıyla güncellendi');
        setTimeout(() => { status.textContent = ''; }, 3000);
    } catch (err) {
        status.textContent = 'Hata!';
        toast(err.message, 'error');
    }
});

// Content tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
    });
});

// ── Settings ─────────────────────────────────

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('passwordMessage');
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass !== confirmPass) {
        msg.textContent = 'Şifreler eşleşmiyor!';
        msg.className = 'form-message error';
        return;
    }

    try {
        await api('/password', {
            method: 'PUT',
            body: JSON.stringify({
                currentPassword: document.getElementById('currentPassword').value,
                newPassword: newPass
            })
        });
        msg.textContent = 'Şifre başarıyla güncellendi!';
        msg.className = 'form-message success';
        e.target.reset();
        toast('Şifre güncellendi');
    } catch (err) {
        msg.textContent = err.message;
        msg.className = 'form-message error';
    }
});

// ── Init ─────────────────────────────────────

checkAuth();
