// Sticky Nav (Show on Scroll Up, Hide on Scroll Down)
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        navbar.classList.add('hidden');
    } else {
        navbar.classList.remove('hidden');
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// Hamburger Menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', !isExpanded);
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Light/Dark Mode Toggle
const themeToggle = document.querySelector('#theme-toggle');
const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
};

// Initialize theme based on system preference or stored value
const savedTheme = localStorage.getItem('theme');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
setTheme(savedTheme || systemTheme);

// Toggle theme on button click
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// Update theme on system preference change
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// Keyboard Navigation
document.querySelectorAll('.nav-links a, .nav-links button, .hamburger').forEach((el) => {
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
        }
    });
});

// Falling Leaves Canvas
const canvas = document.getElementById('leaves-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const leaves = [];
    class Leaf {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * -canvas.height;
            this.size = Math.random() * 10 + 10;
            this.speed = Math.random() * 2 + 1;
            this.angle = Math.random() * Math.PI * 2;
            this.spin = Math.random() * 0.05 - 0.025;
        }

        update() {
            this.y += this.speed;
            this.x += Math.sin(this.angle) * 0.5;
            this.angle += this.spin;
            if (this.y > canvas.height + this.size) {
                this.y = -this.size;
                this.x = Math.random() * canvas.width;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#6B5B95' : '#2A4B2F';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size / 2, this.size / 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function initLeaves() {
        for (let i = 0; i < 20; i++) {
            leaves.push(new Leaf());
        }
    }

    function animateLeaves() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        leaves.forEach((leaf) => {
            leaf.update();
            leaf.draw();
        });
        requestAnimationFrame(animateLeaves);
    }

    initLeaves();
    animateLeaves();

// Update leaf colors on theme change
    themeToggle.addEventListener('click', () => {
        leaves.forEach((leaf) => {
            leaf.draw();
        });
    });
} else {
    console.log('No leaves-canvas found, skipping animation');
}

function updateUtterancesTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    const utterances = document.querySelector('.utterances iframe');
    if (utterances) {
        utterances.contentWindow.postMessage(
            { type: 'set-theme', theme: theme === 'dark' ? 'github-dark' : 'github-light' },
            'https://utteranc.es'
        );
    }
}

// Call on theme change
themeToggle.addEventListener('click', updateUtterancesTheme);
document.addEventListener('DOMContentLoaded', updateUtterancesTheme);