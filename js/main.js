/* =============================================
   MIGUEL MELLE — PORTFOLIO
   GSAP + Lenis Animation Engine
   Brutalist × Retro × Contemporary
   ============================================= */

// ==========================================
// 1. LENIS SMOOTH SCROLL
// ==========================================
const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    smoothTouch: false,
    touchMultiplier: 2,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);


// ==========================================
// 2. CUSTOM CURSOR (brutalist square)
// ==========================================
const cursorEl = document.getElementById('cursor');
if (cursorEl) {
    const cursorLabel = cursorEl.querySelector('.cursor-label');
    let cX = window.innerWidth / 2, cY = window.innerHeight / 2;
    let tX = cX, tY = cY;

    document.addEventListener('mousemove', (e) => {
        tX = e.clientX;
        tY = e.clientY;
    });

    gsap.ticker.add(() => {
        const dt = 1 - Math.pow(0.78, gsap.ticker.deltaRatio());
        cX += (tX - cX) * dt;
        cY += (tY - cY) * dt;
        gsap.set(cursorEl, { x: cX, y: cY });
    });

    // Hover effects
    document.querySelectorAll('a, button, .work-card, .service-item').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorEl.classList.add('hovering');
            if (el.dataset.cursorLabel) {
                cursorEl.classList.add('show-label');
                cursorLabel.textContent = el.dataset.cursorLabel;
            }
        });
        el.addEventListener('mouseleave', () => {
            cursorEl.classList.remove('hovering', 'show-label');
        });
    });
}


// ==========================================
// 3. MAGNETIC BUTTONS
// ==========================================
document.querySelectorAll('.magnetic-btn').forEach(btn => {
    const strength = parseInt(btn.dataset.strength) || 20;

    btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(btn, {
            x: x * (strength / 100),
            y: y * (strength / 100),
            duration: 0.4,
            ease: 'power2.out'
        });
    });

    btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    });
});


// ==========================================
// 4. LIVE CLOCK
// ==========================================
function updateClock() {
    const el = document.getElementById('nav-clock');
    if (!el) return;
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();


// ==========================================
// 5. PRELOADER
// ==========================================
function initLoader() {
    const tl = gsap.timeline({
        onComplete: () => revealPage()
    });

    const counterEl = document.getElementById('loader-counter');
    const barFill = document.getElementById('loader-bar-fill');
    const counter = { val: 0 };

    // Show tag
    tl.to('.loader-tag', {
        opacity: 1,
        duration: 0.4,
    }, 0);

    // Show counter with glow
    tl.to('.loader-counter', {
        opacity: 1,
        textShadow: '0 0 15px rgba(255, 20, 24, 0.5), 0 0 30px rgba(255, 20, 24, 0.3), 0 0 45px rgba(255, 20, 24, 0.2)',
        duration: 0.3,
    }, 0.1);

    // Animate name lines
    tl.to('.loader-name-line', {
        y: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power4.out',
    }, 0.2);

    // Count up
    tl.to(counter, {
        val: 100,
        duration: 2.2,
        ease: 'power2.inOut',
        onUpdate: () => {
            const v = Math.round(counter.val);
            counterEl.textContent = String(v).padStart(3, '0');
            barFill.style.width = v + '%';
        }
    }, 0.3);

    // Pause
    tl.to({}, { duration: 0.4 });

    // Fade inner
    tl.to('.loader-inner', {
        opacity: 0,
        y: -30,
        duration: 0.5,
        ease: 'power3.in'
    });

    // Wipe 1
    tl.to('.loader-wipe-1', {
        yPercent: -100,
        duration: 0.9,
        ease: 'power4.inOut'
    }, '-=0.2');

    // Wipe 2 (red flash)
    tl.to('.loader-wipe-2', {
        yPercent: -100,
        duration: 0.9,
        ease: 'power4.inOut'
    }, '-=0.6');

    // Kill
    tl.set('.loader', { display: 'none' });
}


// ==========================================
// 6. PAGE REVEAL
// ==========================================
function revealPage() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // Hero name
    tl.to('.hero-name-word', {
        y: 0,
        duration: 1.4,
        stagger: 0.15,
    });

    // Tags
    tl.to('.hero-top', {
        opacity: 1,
        y: 0,
        duration: 0.7,
    }, '-=1');

    // Stripe
    tl.to('.hero-stripe', {
        opacity: 1,
        duration: 0.6,
    }, '-=0.6');

    // Bio
    tl.to('.hero-bio', {
        opacity: 1,
        y: 0,
        duration: 0.7,
    }, '-=0.4');

    // CTA
    tl.to('.hero-cta-wrap', {
        opacity: 1,
        y: 0,
        duration: 0.7,
    }, '-=0.5');

    // Scroll indicator
    tl.to('.hero-scroll', {
        opacity: 1,
        duration: 0.6,
    }, '-=0.4');

    // Corners
    tl.to('.hero-corner', {
        opacity: 0.5,
        duration: 0.6,
        stagger: 0.1,
    }, '-=0.5');

    // Grid overlay
    tl.to('.hero-grid-overlay', {
        opacity: 1,
        duration: 1,
    }, '-=0.8');

    // Go
    initScrollAnimations();
}


// ==========================================
// 7. SCROLL-DRIVEN ANIMATIONS
// ==========================================
function initScrollAnimations() {

    // --- Nav scroll ---
    const nav = document.getElementById('nav');
    ScrollTrigger.create({
        start: 'top -60',
        end: 99999,
        onUpdate: (self) => {
            if (self.direction === 1 && self.scroll() > 60) {
                nav.classList.add('scrolled');
            }
            if (self.scroll() < 60) {
                nav.classList.remove('scrolled');
            }
        }
    });

    // --- Hero text zoom and rotation on scroll ---
    const heroName = document.querySelector('.hero-name');
    const heroSection = document.querySelector('.hero');
    
    // Pin the hero-name and animate it
    ScrollTrigger.create({
        trigger: heroSection,
        start: 'top top',
        end: '+=100vh',
        pin: heroName,
        pinSpacing: false,
        scrub: 1,
        onUpdate: (self) => {
            const progress = self.progress;
            const scale = 1 + (progress * 25); // Scale from 1x to 26x based on scroll progress
            const rotation = progress * 5; // Rotate from 0 to 5 degrees
            
            gsap.set(heroName, {
                scale: scale,
                rotation: rotation,
            });
        }
    });

    // --- Fade in marquee section after hero text fills screen ---
    ScrollTrigger.create({
        trigger: heroSection,
        start: 'top top',
        end: '+=100vh',
        scrub: 1,
        onUpdate: (self) => {
            const progress = self.progress;
            // Start fading in marquee when progress > 0.7
            if (progress > 0.7) {
                const fadeProgress = (progress - 0.7) / 0.3; // Map 0.7-1.0 to 0-1
                gsap.set('.marquee', { opacity: fadeProgress });
            } else {
                gsap.set('.marquee', { opacity: 0 });
            }
        }
    });

    // --- Hide other hero elements on scroll ---
    gsap.to('.hero-top, .hero-stripe, .hero-bio, .hero-cta-wrap, .hero-scroll, .hero-corner, .hero-grid-overlay', {
        opacity: 0,
        scrollTrigger: {
            trigger: heroSection,
            start: 'top top',
            end: '+=50vh',
            scrub: 1,
        }
    });

    // --- Marquee animations with different speeds ---
    document.querySelectorAll('.marquee-content').forEach((content) => {
        const speed = content.dataset.speed || 25;
        const isRight = content.classList.contains('to-right');
        
        // Update animation duration based on speed
        content.style.animationDuration = `${speed}s`;
        
        // Add skew effect on scroll
        gsap.to(content, {
            skewX: isRight ? -2 : 2,
            scrollTrigger: {
                trigger: '.marquee',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 2,
            }
        });
    });


    // --- Section labels ---
    document.querySelectorAll('.section-label').forEach(label => {
        gsap.from(label.children, {
            y: 20,
            opacity: 0,
            stagger: 0.08,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: label, start: 'top 88%' }
        });
    });

    // --- Section titles ---
    document.querySelectorAll('.section-title').forEach(title => {
        gsap.from(title, {
            y: 60,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: title, start: 'top 85%' }
        });
    });


    // --- reveal-text ---
    document.querySelectorAll('.reveal-text').forEach(el => {
        gsap.from(el, {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%' }
        });
    });

    // --- reveal-fade ---
    document.querySelectorAll('.reveal-fade').forEach(el => {
        gsap.from(el, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%' }
        });
    });

    // --- reveal-up ---
    document.querySelectorAll('.reveal-up').forEach((el, i) => {
        gsap.from(el, {
            y: 50,
            opacity: 0,
            duration: 0.7,
            delay: i * 0.08,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%' }
        });
    });


    // --- Work cards stagger ---
    const workCards = gsap.utils.toArray('.work-card');
    workCards.forEach((card, i) => {
        gsap.from(card, {
            y: 80,
            opacity: 0,
            duration: 0.9,
            delay: i * 0.1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 88%'
            }
        });

        // Parallax on card image
        gsap.to(card.querySelector('.work-card-placeholder'), {
            yPercent: -8,
            scrollTrigger: {
                trigger: card,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5,
            }
        });
    });


    // --- About photo ---
    gsap.from('.about-photo', {
        x: -60,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.about-grid', start: 'top 75%' }
    });

    gsap.from('.about-col-right', {
        x: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.about-grid', start: 'top 75%' }
    });


    // --- Stat blocks and counters combined ---
    const statBlocks = gsap.utils.toArray('.stat-block');
    if (statBlocks.length > 0) {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.about-stats',
                start: 'top 80%',
                once: true
            }
        });

        // Animate blocks appearance
        tl.from('.stat-block', {
            y: 60,
            opacity: 0,
            stagger: 0.12,
            duration: 0.8,
            ease: 'power3.out'
        });

        // Animate counters
        statBlocks.forEach((block, index) => {
            const statVal = block.querySelector('.stat-val');
            if (statVal) {
                const target = parseInt(statVal.dataset.count);
                const obj = { val: 0 };
                
                tl.to(obj, {
                    val: target,
                    duration: 2,
                    ease: 'power2.out',
                    onUpdate: () => {
                        statVal.textContent = Math.round(obj.val);
                    }
                }, '-=1.8'); // Start shortly after blocks appear
            }
        });
    }


    // --- Service items ---
    document.querySelectorAll('.service-item').forEach((item) => {
        gsap.from(item, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: item, start: 'top 88%' }
        });
    });


    // --- Manifesto text word reveal ---
    const manifestoEl = document.getElementById('manifesto-text');
    if (manifestoEl) {
        const raw = manifestoEl.textContent.trim();
        const words = raw.split(/\s+/);
        manifestoEl.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');

        const wordEls = manifestoEl.querySelectorAll('.word');

        gsap.to(wordEls, {
            opacity: 1,
            stagger: 0.04,
            ease: 'none',
            scrollTrigger: {
                trigger: '.manifesto',
                start: 'top 65%',
                end: 'bottom 45%',
                scrub: 1,
            }
        });
    }


    // --- Contact ---
    gsap.from('.contact-title', {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.contact', start: 'top 70%' }
    });

    gsap.from('.contact-sub', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.contact-sub', start: 'top 88%' }
    });

    gsap.from('.contact-link', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.contact-links', start: 'top 85%' }
    });


    // --- Footer ---
    gsap.from('.footer-top > *', {
        y: 40,
        opacity: 0,
        stagger: 0.15,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.footer', start: 'top 90%' }
    });
}


// ==========================================
// 8. SMOOTH ANCHOR LINKS
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            lenis.scrollTo(target, { offset: -60, duration: 1.4 });
            // Close mobile menu
            if (document.getElementById('mob-menu').classList.contains('active')) {
                closeMobMenu();
            }
        }
    });
});


// ==========================================
// 9. MOBILE MENU
// ==========================================
const hamburger = document.getElementById('nav-hamburger');
const mobMenu = document.getElementById('mob-menu');
let menuOpen = false;

hamburger.addEventListener('click', () => {
    menuOpen ? closeMobMenu() : openMobMenu();
});

function openMobMenu() {
    menuOpen = true;
    hamburger.classList.add('active');
    mobMenu.classList.add('active');
    lenis.stop();

    const tl = gsap.timeline();
    tl.to('.mob-menu-bg', { y: 0, duration: 0.7, ease: 'power4.inOut' });
    tl.to('.mob-menu-inner', { opacity: 1, duration: 0.3 }, '-=0.3');
    tl.to('.mob-link span', {
        y: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out'
    }, '-=0.2');
    tl.from('.mob-menu-footer a', {
        y: 15, opacity: 0, stagger: 0.05, duration: 0.4, ease: 'power3.out'
    }, '-=0.3');
}

function closeMobMenu() {
    menuOpen = false;
    hamburger.classList.remove('active');
    lenis.start();

    const tl = gsap.timeline({
        onComplete: () => {
            mobMenu.classList.remove('active');
            gsap.set('.mob-link span', { y: '120%' });
            gsap.set('.mob-menu-inner', { opacity: 0 });
        }
    });
    tl.to('.mob-menu-inner', { opacity: 0, duration: 0.25 });
    tl.to('.mob-menu-bg', { y: '-100%', duration: 0.6, ease: 'power4.inOut' }, '-=0.1');
}


// ==========================================
// 10. INIT
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // Set initial states
    gsap.set('.hero-name-word', { y: '110%' });
    gsap.set('.hero-name', { scale: 1, rotation: 0, opacity: 1 });
    gsap.set('.hero-top', { opacity: 0, y: 15 });
    gsap.set('.hero-stripe', { opacity: 0 });
    gsap.set('.hero-bio', { opacity: 0, y: 20 });
    gsap.set('.hero-cta-wrap', { opacity: 0, y: 20 });
    gsap.set('.hero-scroll', { opacity: 0 });
    gsap.set('.hero-corner', { opacity: 0 });
    gsap.set('.hero-grid-overlay', { opacity: 0 });
    gsap.set('.mob-link span', { y: '120%' });
    gsap.set('.mob-menu-bg', { y: '-100%' });
    gsap.set('.marquee', { opacity: 0 });

    initLoader();
});


// ==========================================
// 11. MATTER.JS FOOTER (Desktop only)
// ==========================================
function initFooterMatter() {
    // Only run on desktop
    if (window.innerWidth <= 768) return;
    
    const canvas = document.getElementById('footer-matter');
    if (!canvas || typeof Matter === 'undefined') return;

    const { Engine, Render, Runner, World, Bodies, Events, Body } = Matter;

    // Create engine with lower gravity
    const engine = Engine.create({
        gravity: { x: 0, y: 0.2 }
    });

    // Get canvas dimensions
    const footer = document.querySelector('.footer');
    const canvasWidth = window.innerWidth;
    const canvasHeight = footer.offsetHeight;

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Create renderer
    const render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: canvasWidth,
            height: canvasHeight,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio
        }
    });

    // Create boundaries (walls)
    const wallThickness = 50;
    const walls = [
        // Bottom
        Bodies.rectangle(canvasWidth / 2, canvasHeight + wallThickness / 2, canvasWidth, wallThickness, {
            isStatic: true,
            render: { fillStyle: 'transparent' }
        }),
        // Left
        Bodies.rectangle(-wallThickness / 2, canvasHeight / 2, wallThickness, canvasHeight, {
            isStatic: true,
            render: { fillStyle: 'transparent' }
        }),
        // Right
        Bodies.rectangle(canvasWidth + wallThickness / 2, canvasHeight / 2, wallThickness, canvasHeight, {
            isStatic: true,
            render: { fillStyle: 'transparent' }
        })
    ];

    // Create boxes (enough to fill 30% of height)
    const boxes = [];
    const boxSize = 40;
    const colors = ['#ff1418', '#ffffff'];
    const targetHeight = canvasHeight * 0.3;
    const boxesPerRow = Math.floor(canvasWidth / (boxSize + 10));
    const rows = Math.ceil(targetHeight / (boxSize + 10));
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < boxesPerRow; col++) {
            const x = col * (boxSize + 10) + boxSize + Math.random() * 20;
            const finalY = canvasHeight - (row * (boxSize + 10)) - boxSize;
            const startY = -100 - (row * 80) - (Math.random() * 100);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const rotation = (Math.random() - 0.5) * 0.3;
            
            const box = Bodies.rectangle(x, startY, boxSize, boxSize, {
                restitution: 0.3,
                friction: 0.1,
                angle: rotation,
                isStatic: true,
                render: {
                    fillStyle: color,
                    strokeStyle: color === '#ffffff' ? '#121212' : color,
                    lineWidth: 2
                }
            });
            boxes.push(box);
        }
    }

    // Add all bodies to world
    World.add(engine.world, [...walls, ...boxes]);

    // Run the engine and renderer
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);
    
    // Animate boxes falling into place when footer enters viewport
    ScrollTrigger.create({
        trigger: '.footer',
        start: 'top bottom-=100',
        once: true,
        onEnter: () => {
            boxes.forEach((box, index) => {
                setTimeout(() => {
                    Body.setStatic(box, false);
                }, index * 8);
            });
        }
    });

    // Mouse tracking variables
    let mousePosition = { x: -1000, y: -1000 };
    const pushRadius = 150;
    const pushForce = 0.0022;

    // Track real mouse position
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mousePosition.x = e.clientX - rect.left;
        mousePosition.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
        mousePosition = { x: -1000, y: -1000 };
    });

    // Wave animation variables
    let time = 0;
    const waveSpeed = 0.02;
    const waveForce = 0.00008;

    // Before each engine update
    Events.on(engine, 'beforeUpdate', () => {
        time += waveSpeed;
        
        boxes.forEach((box, index) => {
            // Mouse push effect
            const dx = box.position.x - mousePosition.x;
            const dy = box.position.y - mousePosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < pushRadius && distance > 1) {
                const force = pushForce * (1 - distance / pushRadius);
                const angle = Math.atan2(dy, dx);
                
                Body.applyForce(box, box.position, {
                    x: Math.cos(angle) * force,
                    y: Math.sin(angle) * force
                });
            }

            // Wave motion (ambient animation)
            const waveOffset = (box.position.x / 100) + (index * 0.1);
            const waveX = Math.sin(time + waveOffset) * waveForce;
            const waveY = Math.cos(time * 0.7 + waveOffset) * waveForce * 0.5;
            
            Body.applyForce(box, box.position, {
                x: waveX,
                y: waveY
            });
        });
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth <= 768) {
                Render.stop(render);
                Runner.stop(runner);
                World.clear(engine.world);
                Engine.clear(engine);
                canvas.style.display = 'none';
            } else {
                canvas.style.display = 'block';
                const newWidth = window.innerWidth;
                const newHeight = footer.offsetHeight;
                canvas.width = newWidth;
                canvas.height = newHeight;
                render.canvas.width = newWidth;
                render.canvas.height = newHeight;
                render.options.width = newWidth;
                render.options.height = newHeight;
                Render.setPixelRatio(render, window.devicePixelRatio);
            }
        }, 250);
    });
}

// Initialize Matter.js when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooterMatter);
} else {
    initFooterMatter();
}


// ==========================================
// 12. RESIZE
// ==========================================
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 250);
});
