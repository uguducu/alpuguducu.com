/* ═══════════════════════════════════════════
   CUSTOM CURSOR
   ═══════════════════════════════════════════ */

const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursor-follower');
let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
});

function animateFollower() {
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;
    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';
    requestAnimationFrame(animateFollower);
}
animateFollower();

// Hover effects for interactive elements
const hoverElements = document.querySelectorAll('a, button, .nav-dot, .project-card, .service-header, .tech-tag');
hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
        follower.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
        follower.classList.remove('hover');
    });
});

/* ═══════════════════════════════════════════
   HERO CANVAS - PARTICLE NETWORK
   ═══════════════════════════════════════════ */

const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
const PARTICLE_COUNT = 80;
const CONNECTION_DISTANCE = 150;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Mouse interaction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
            const force = (200 - dist) / 200;
            this.vx -= (dx / dist) * force * 0.02;
            this.vy -= (dy / dist) * force * 0.02;
        }

        // Speed limit
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 1) {
            this.vx = (this.vx / speed) * 1;
            this.vy = (this.vy / speed) * 1;
        }

        // Boundary wrap
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${this.opacity})`;
        ctx.fill();
    }
}

// Initialize particles
for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
}

function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONNECTION_DISTANCE) {
                const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.15;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function animateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    drawConnections();
    requestAnimationFrame(animateCanvas);
}
animateCanvas();

/* ═══════════════════════════════════════════
   ROLE CAROUSEL
   ═══════════════════════════════════════════ */

const roles = document.querySelectorAll('.role');
let currentRole = 0;

setInterval(() => {
    roles[currentRole].classList.remove('active');
    roles[currentRole].classList.add('exit');

    setTimeout(() => {
        roles[currentRole].classList.remove('exit');
        currentRole = (currentRole + 1) % roles.length;
        roles[currentRole].classList.add('active');
    }, 300);
}, 2500);

/* ═══════════════════════════════════════════
   SCROLL SNAP & SECTION TRACKING
   ═══════════════════════════════════════════ */

const scrollContainer = document.getElementById('scrollContainer');
const sections = document.querySelectorAll('.section');
const navDots = document.querySelectorAll('.nav-dot');
const counterCurrent = document.querySelector('.section-counter .current');
const counterLine = document.querySelector('.counter-line::after');
let currentSection = 0;

function updateActiveSection() {
    const scrollTop = scrollContainer.scrollTop;
    const viewHeight = window.innerHeight;
    const newSection = Math.round(scrollTop / viewHeight);

    if (newSection !== currentSection && newSection >= 0 && newSection < sections.length) {
        currentSection = newSection;

        // Update nav dots
        navDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSection);
        });

        // Update counter
        counterCurrent.textContent = String(currentSection + 1).padStart(2, '0');

        // Update counter line
        const progress = ((currentSection + 1) / sections.length) * 100;
        document.querySelector('.counter-line').style.setProperty('--progress', progress + '%');

        // Trigger section animations
        triggerSectionAnimations(currentSection);
    }
}

// Counter line progress via CSS custom property
const style = document.createElement('style');
document.head.appendChild(style);

scrollContainer.addEventListener('scroll', () => {
    updateActiveSection();

    const progress = ((currentSection + 1) / sections.length) * 100;
    style.textContent = `.counter-line::after { width: ${progress}% !important; }`;
});

// Nav dot click navigation
navDots.forEach(dot => {
    dot.addEventListener('click', () => {
        const target = parseInt(dot.dataset.section);
        sections[target].scrollIntoView({ behavior: 'smooth' });
    });
});

/* ═══════════════════════════════════════════
   REVEAL ANIMATIONS ON SCROLL
   ═══════════════════════════════════════════ */

function triggerSectionAnimations(sectionIndex) {
    const section = sections[sectionIndex];
    const reveals = section.querySelectorAll('.reveal-text');
    reveals.forEach((el, i) => {
        setTimeout(() => {
            el.classList.add('visible');
        }, i * 100);
    });

    // Trigger stat counter animation for about section
    if (sectionIndex === 1) {
        animateStats();
    }
}

// Intersection Observer for reveal animations
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const reveals = entry.target.querySelectorAll('.reveal-text');
            reveals.forEach((el, i) => {
                setTimeout(() => {
                    el.classList.add('visible');
                }, i * 100);
            });
        }
    });
}, { threshold: 0.3 });

sections.forEach(section => revealObserver.observe(section));

/* ═══════════════════════════════════════════
   STAT COUNTER ANIMATION
   ═══════════════════════════════════════════ */

let statsAnimated = false;

function animateStats() {
    if (statsAnimated) return;
    statsAnimated = true;

    document.querySelectorAll('.stat-num').forEach(stat => {
        const target = parseInt(stat.dataset.target);
        let current = 0;
        const increment = target / 40;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.textContent = Math.round(current) + '+';
        }, 40);
    });
}

/* ═══════════════════════════════════════════
   SERVICE ACCORDION
   ═══════════════════════════════════════════ */

document.querySelectorAll('.service-header').forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const isOpen = item.classList.contains('open');

        // Close all
        document.querySelectorAll('.service-item').forEach(si => si.classList.remove('open'));

        // Open clicked (if it wasn't already open)
        if (!isOpen) {
            item.classList.add('open');
        }
    });
});

/* ═══════════════════════════════════════════
   MAGNETIC BUTTONS
   ═══════════════════════════════════════════ */

document.querySelectorAll('.magnetic').forEach(el => {
    const strength = parseInt(el.dataset.strength) || 25;

    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
    });
});

/* ═══════════════════════════════════════════
   PROJECT CARD TILT EFFECT
   ═══════════════════════════════════════════ */

document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        card.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateY(0)';
    });
});

/* ═══════════════════════════════════════════
   KEYBOARD NAVIGATION
   ═══════════════════════════════════════════ */

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const next = Math.min(currentSection + 1, sections.length - 1);
        sections[next].scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const prev = Math.max(currentSection - 1, 0);
        sections[prev].scrollIntoView({ behavior: 'smooth' });
    }
});

/* ═══════════════════════════════════════════
   CONTACT FORM
   ═══════════════════════════════════════════ */

const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('.form-submit');
        const btnText = btn.querySelector('.submit-text');
        const originalText = btnText.textContent;

        btn.disabled = true;
        btnText.textContent = 'Gönderiliyor...';
        formStatus.textContent = '';
        formStatus.className = 'form-status';

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('formName').value.trim(),
                    email: document.getElementById('formEmail').value.trim(),
                    subject: document.getElementById('formSubject').value.trim(),
                    message: document.getElementById('formMessage').value.trim()
                })
            });

            const data = await res.json();

            if (res.ok) {
                formStatus.textContent = data.message || 'Mesajiniz gonderildi!';
                formStatus.classList.add('success');
                contactForm.reset();
            } else {
                formStatus.textContent = data.error || 'Bir hata olustu.';
                formStatus.classList.add('error');
            }
        } catch {
            formStatus.textContent = 'Baglanti hatasi. Lutfen tekrar deneyin.';
            formStatus.classList.add('error');
        } finally {
            btn.disabled = false;
            btnText.textContent = originalText;
        }
    });
}

/* ═══════════════════════════════════════════
   DYNAMIC CONTENT LOADER
   ═══════════════════════════════════════════ */

async function loadContent() {
    try {
        const res = await fetch('/api/content');
        if (!res.ok) return;
        const content = await res.json();

        // Hero
        if (content.hero) {
            const greeting = document.querySelector('.greeting-text');
            if (greeting && content.hero.greeting) greeting.textContent = content.hero.greeting;

            const nameFirst = document.querySelector('.name-line:first-child .name-word');
            if (nameFirst && content.hero.name_first) {
                nameFirst.textContent = content.hero.name_first;
                nameFirst.dataset.text = content.hero.name_first;
            }

            const nameLast = document.querySelector('.name-line:nth-child(2) .name-word');
            if (nameLast && content.hero.name_last) {
                nameLast.textContent = content.hero.name_last;
                nameLast.dataset.text = content.hero.name_last;
            }

            if (content.hero.roles) {
                const carousel = document.getElementById('roleCarousel');
                if (carousel) {
                    const roleList = content.hero.roles.split(',');
                    carousel.innerHTML = roleList.map((r, i) =>
                        `<span class="role${i === 0 ? ' active' : ''}">${r.trim()}</span>`
                    ).join('');
                }
            }
        }

        // About
        if (content.about) {
            if (content.about.title) {
                const aboutTitle = document.querySelector('.about-right .section-title');
                if (aboutTitle) {
                    const lines = content.about.title.split('\n');
                    aboutTitle.innerHTML = lines[0] + '<br><span class="accent">' + (lines[1] || '') + '</span>';
                }
            }

            if (content.about.description) {
                const desc = document.querySelector('.about-description');
                if (desc) {
                    desc.innerHTML = content.about.description.split('\n\n').map(p => `<p>${p}</p>`).join('');
                }
            }

            if (content.about.tech_stack) {
                const stack = document.querySelector('.tech-stack');
                if (stack) {
                    stack.innerHTML = content.about.tech_stack.split(',').map(t =>
                        `<span class="tech-tag">${t.trim()}</span>`
                    ).join('');
                }
            }

            if (content.about.stats) {
                const statsContainer = document.querySelector('.about-stats');
                if (statsContainer) {
                    const stats = content.about.stats.split(',');
                    statsContainer.innerHTML = stats.map(s => {
                        const [num, label] = s.split(':');
                        return `<div class="stat"><span class="stat-num" data-target="${num.trim()}">0</span><span class="stat-label">${label.trim()}</span></div>`;
                    }).join('');
                }
            }
        }

        // Experience
        if (content.experience && content.experience.items) {
            try {
                const items = JSON.parse(content.experience.items);
                const timeline = document.querySelector('.timeline');
                if (timeline) {
                    timeline.innerHTML = items.map(item => `
                        <div class="timeline-item reveal-text">
                            <div class="timeline-marker">
                                <div class="marker-dot"></div>
                                <div class="marker-line"></div>
                            </div>
                            <div class="timeline-content">
                                <span class="timeline-date">${item.date}</span>
                                <h3>${item.title}</h3>
                                <p class="timeline-company">${item.company}</p>
                                <p>${item.desc}</p>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (e) { /* keep static */ }
        }

        // Projects
        if (content.projects && content.projects.items) {
            try {
                const items = JSON.parse(content.projects.items);
                const grid = document.querySelector('.projects-grid');
                if (grid) {
                    grid.innerHTML = items.map((item, i) => `
                        <div class="project-card reveal-text" data-tilt>
                            <div class="project-card-inner">
                                <div class="project-number">${String(i + 1).padStart(2, '0')}</div>
                                <div class="project-info">
                                    <span class="project-category">${item.category}</span>
                                    <h3>${item.title}</h3>
                                    <p>${item.desc}</p>
                                    <div class="project-tech">
                                        ${item.tech.split(',').map(t => `<span>${t.trim()}</span>`).join('')}
                                    </div>
                                </div>
                                <div class="project-arrow">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    `).join('');
                    initTiltEffects();
                }
            } catch (e) { /* keep static */ }
        }

        // Services
        if (content.services && content.services.items) {
            try {
                const items = JSON.parse(content.services.items);
                const list = document.querySelector('.services-list');
                if (list) {
                    list.innerHTML = items.map((item, i) => `
                        <div class="service-item reveal-text">
                            <div class="service-header">
                                <span class="service-num">${String(i + 1).padStart(2, '0')}</span>
                                <h3>${item.title}</h3>
                                <div class="service-toggle">+</div>
                            </div>
                            <div class="service-detail">
                                <p>${item.desc}</p>
                            </div>
                        </div>
                    `).join('');
                    initServiceAccordion();
                }
            } catch (e) { /* keep static */ }
        }

        initHoverEffects();
        initMagnetic();
    } catch (e) {
        // Fallback: static HTML content is already in place
    }
}

function initTiltEffects() {
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateY(0)';
        });
    });
}

function initServiceAccordion() {
    document.querySelectorAll('.service-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.service-item').forEach(si => si.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });
}

function initHoverEffects() {
    document.querySelectorAll('a, button, .nav-dot, .project-card, .service-header, .tech-tag, .social-icon').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            follower.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            follower.classList.remove('hover');
        });
    });
}

function initMagnetic() {
    document.querySelectorAll('.magnetic').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0, 0)';
        });
    });
}

/* ═══════════════════════════════════════════
   INITIAL LOAD
   ═══════════════════════════════════════════ */

window.addEventListener('load', () => {
    triggerSectionAnimations(0);
    style.textContent = `.counter-line::after { width: 16.66% !important; }`;
    loadContent();
});
