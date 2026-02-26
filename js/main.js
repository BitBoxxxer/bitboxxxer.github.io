// Mobile Navigation Toggle
function toggleNav() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('nav__links--active');
}

// Updats
function toggleUpdates() {
    const updatesPanel = document.getElementById('updatesPanel');
    const updatesOverlay = document.getElementById('updatesOverlay');
    
    if (updatesPanel && updatesOverlay) {
        updatesPanel.classList.toggle('updates-panel--active');
        updatesOverlay.classList.toggle('updates-overlay--active');
        
        document.body.style.overflow = updatesPanel.classList.contains('updates-panel--active') ? 'hidden' : '';
    }
}

// Close
document.addEventListener('click', function(event) {
    const updatesPanel = document.getElementById('updatesPanel');
    const updatesOverlay = document.getElementById('updatesOverlay');
    const updatesButton = document.querySelector('.nav__updates');
    
    if (updatesPanel && updatesOverlay && updatesButton) {
        const isClickInsidePanel = updatesPanel.contains(event.target);
        const isClickOnButton = updatesButton.contains(event.target);
        
        if (!isClickInsidePanel && !isClickOnButton && updatesPanel.classList.contains('updates-panel--active')) {
            toggleUpdates();
        }
    }
});

// Close mobile nav when clicking outside
document.addEventListener('click', function(event) {
    const nav = document.querySelector('.nav');
    const navLinks = document.getElementById('navLinks');
    const navToggle = document.querySelector('.nav__toggle');
    
    if (!nav.contains(event.target) && navLinks.classList.contains('nav__links--active')) {
        navLinks.classList.remove('nav__links--active');
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add fade-in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.card').forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
});

// Typing effect for hero title (optional)
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Copy code to clipboard
function copyCode(button) {
    const codeBlock = button.closest('.code-block').querySelector('code');
    const text = codeBlock.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '[ COPIED! ]';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });
}

// Add copy buttons to code blocks
document.querySelectorAll('.code-block').forEach(block => {
    const button = document.createElement('button');
    button.className = 'btn';
    button.style.cssText = 'position: absolute; top: 0.5rem; right: 3rem; font-size: 0.75rem; padding: 0.25rem 0.5rem;';
    button.textContent = '[ COPY ]';
    button.onclick = () => copyCode(button);
    
    block.style.position = 'relative';
    block.appendChild(button);
});

// Console Easter Egg
// anyway its fun :)))
console.log('%c> DevGuides v1.9', 'color: #00ff41; font-family: monospace; font-size: 16px;');
console.log('%c> Welcome, Developer!', 'color: #00ff41; font-family: monospace;');
console.log('%c> Made with code and passion', 'color: #00cc33; font-family: monospace;');
console.log('%c> Mb DevGuides just simple name for site - think abt it', 'color: #00cc33; font-family: monospace;');

// Matrix rain effect in background (optional - can be enabled)
function createMatrixRain() {
    const canvas = document.createElement('canvas');
    canvas.id = 'matrix-canvas';
    canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; opacity: 0.5;';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);
    
    function draw() {
        ctx.fillStyle = 'rgba(13, 13, 13, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0066ff';
        ctx.font = `${fontSize}px monospace`;
        
        for (let i = 0; i < drops.length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(char, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    setInterval(draw, 50);
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Call the function to create the matrix rain effect
createMatrixRain();

// typing hero title - style 2
document.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.querySelector('.hero__title');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        typeWriter(heroTitle, originalText, 100);
    }
});

function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav__link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const linkPage = href.split('/').pop();
        
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html') ||
            (currentPage.includes('guide') && linkPage === 'guides.html')) {
            link.classList.add('nav__link--active');
        } else {
            link.classList.remove('nav__link--active');
        }
    });
}

// Actualiza el logo de navegación con el título de la guía
function updateNavLogo() {
    const body = document.body;
    const guideTitle = body.dataset.guideTitle;
    const guideId = body.dataset.guideId;
    const navLogo = document.querySelector('.nav__logo');
    
    if (guideTitle && navLogo) {
        const idPart = guideId ? ` (${guideId})` : '';
        navLogo.innerHTML = `DevGuides <span class="nav__logo-guide">'${guideTitle}${idPart}'</span>`;
    }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
    updateNavLogo();
});

document.querySelectorAll('.glitch').forEach(element => {
    element.addEventListener('mouseenter', () => {
        element.style.animation = 'glitch 0.3s ease infinite';
    });
    
    element.addEventListener('mouseleave', () => {
        element.style.animation = 'none';
    });
});

//(TOC)

let tocHeadings = [];
let tocLinks = [];

function initToc() {
    const tocContent = document.getElementById('tocContent');
    const guideContent = document.querySelector('.guide__content');
    
    if (!tocContent || !guideContent) return;
    
    tocHeadings = Array.from(guideContent.querySelectorAll('h2, h3, h4'));
    
    if (tocHeadings.length === 0) return;
    
    const list = document.createElement('ul');
    list.className = 'toc__list';
    
    tocHeadings.forEach((heading, index) => {
        if (!heading.id) {
            heading.id = 'section-' + index;
        }
        
        const item = document.createElement('li');
        const level = parseInt(heading.tagName.charAt(1));
        item.className = 'toc__item toc__item--level-' + level;
        
        const link = document.createElement('a');
        link.href = '#' + heading.id;
        link.className = 'toc__link';
        link.textContent = heading.textContent.replace(/^#+\s/, '');
        
        // Обработчик клика
        link.addEventListener('click', (e) => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        
        item.appendChild(link);
        list.appendChild(item);
    });
    
    tocContent.appendChild(list);
    
    tocLinks = Array.from(document.querySelectorAll('.toc__link'));
    
    initTocScrollSpy();
}

function toggleToc() {
    const toc = document.querySelector('.toc');
    if (!toc) return;
    
    toc.classList.toggle('toc--collapsed');
    
    const toggleBtn = document.querySelector('.toc__toggle');
    if (toc.classList.contains('toc--collapsed')) {
        toggleBtn.textContent = '[ + ]';
    } else {
        toggleBtn.textContent = '[ − ]';
    }
}

function initTocScrollSpy() {
    const tocCurrentTitle = document.getElementById('tocCurrentTitle');
    const tocCurrent = document.querySelector('.toc__current');
    
    function updateActiveSection() {
        let currentSection = null;
        
        tocHeadings.forEach(heading => {
            const rect = heading.getBoundingClientRect();
            if (rect.top <= 150) {
                currentSection = heading;
            }
        });
        
        if (currentSection) {
            tocLinks.forEach(link => {
                link.classList.remove('toc__link--active');
                if (link.getAttribute('href') === '#' + currentSection.id) {
                    link.classList.add('toc__link--active');
                }
            });
            
            if (tocCurrentTitle) {
                tocCurrentTitle.textContent = currentSection.textContent.replace(/^#+\s/, '');
            }
        }
    }
    
    if (tocCurrent) {
        tocCurrent.addEventListener('click', () => {
            const toc = document.querySelector('.toc');
            if (toc && toc.classList.contains('toc--collapsed')) {
                toggleToc();
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveSection);
    updateActiveSection();
}

// Инициализация TOC
document.addEventListener('DOMContentLoaded', () => {
    initToc();
});
