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

// Optimize ScrollTrigger performance
ScrollTrigger.config({
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
    ignoreMobileResize: true
});

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
        force3D: true,
        ease: 'power4.out'
    });

    // Tags
    tl.to('.hero-top', {
        opacity: 1,
        y: 0,
        duration: 0.7,
        force3D: true,
        ease: 'power4.out'
    }, '-=1');

    // Stripe
    tl.to('.hero-stripe', {
        opacity: 1,
        duration: 0.6,
        force3D: true,
        ease: 'power4.out'
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

    // --- Hero Scroll Zoom → Red Fill → Marquee Reveal ---
    // Skip zoom animation on mobile
    if (window.innerWidth > 768) {
    // Set initial explicit values so scrub reversal restores them
    gsap.set(['.hero-top'], { opacity: 1, y: 0, force3D: true });
    gsap.set(['.hero-bio'], { opacity: 1, y: 0, force3D: true });
    gsap.set(['.hero-cta-wrap'], { opacity: 1, y: 0, force3D: true });
    gsap.set(['.hero-scroll'], { opacity: 1, y: 0, force3D: true });
    gsap.set(['.hero-corner'], { opacity: 0.5, force3D: true });
    gsap.set(['.hero-stripe'], { opacity: 1, force3D: true });
    gsap.set(['.hero-grid-overlay'], { opacity: 1, force3D: true });
    gsap.set(['.hero-noise'], { opacity: 1, force3D: true });
    gsap.set(['.hero-name-accent'], { opacity: 1, force3D: true });
    gsap.set(['.hero-name'], { scale: 1, rotation: 0, xPercent: 0, yPercent: 0, x: -4, force3D: true });
    gsap.set(['#hero-red-fill'], { opacity: 0, force3D: true });
    gsap.set(['#marquee-overlay'], { opacity: 0, force3D: true });
    gsap.set(['.work-track'], { x: 0, force3D: true });
    gsap.set(['.work-card'], { opacity: 1, y: 0, force3D: true });

    const heroZoomTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: '+=400%',
            pin: true,
            scrub: 0.8,
            pinSpacing: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                const overlay = document.getElementById('marquee-overlay');
                if (self.progress > 0.35) {
                    overlay.style.pointerEvents = 'auto';
                } else {
                    overlay.style.pointerEvents = 'none';
                }
            }
        }
    });

    // Fade out secondary hero elements (fast)
    heroZoomTl.to('.hero-top', { opacity: 0, y: -10, duration: 0.04 }, 0);
    heroZoomTl.to('.hero-bio', { opacity: 0, y: -10, duration: 0.04 }, 0);
    heroZoomTl.to('.hero-cta-wrap', { opacity: 0, y: -10, duration: 0.04 }, 0);
    heroZoomTl.to('.hero-scroll', { opacity: 0, duration: 0.04 }, 0);
    heroZoomTl.to('.hero-corner', { opacity: 0, duration: 0.04 }, 0);
    heroZoomTl.to('.hero-stripe', { opacity: 0, duration: 0.04 }, 0);
    heroZoomTl.to('.hero-grid-overlay', { opacity: 0, duration: 0.04 }, 0);
    heroZoomTl.to('.hero-noise', { opacity: 0, duration: 0.04 }, 0);
    heroZoomTl.to('.hero-name-accent', { opacity: 0, duration: 0.03 }, 0);

    // Scale & rotate the name (red text fills screen) — limited scale to prevent pixelation
    heroZoomTl.to('.hero-name', {
        scale: 18,
        rotation: 4,
        xPercent: 0,
        yPercent: 0,
        duration: 0.35,
        force3D: true,
    }, 0.03);

    // Solid red overlay fades in early to cover any text artifacts
    heroZoomTl.to('#hero-red-fill', {
        opacity: 1,
        duration: 0.08,
    }, 0.08);

    // 5 marquees fade in over the red
    heroZoomTl.to('#marquee-overlay', {
        opacity: 1,
        duration: 0.12,
    }, 0.18);
    } // end mobile check


    // --- Section labels ---
    document.querySelectorAll('.section-label').forEach(label => {
        gsap.fromTo(label.children, 
            { y: 20, opacity: 0 },
            {
                y: 0, opacity: 1,
                stagger: 0.08,
                duration: 0.7,
                ease: 'power3.out',
                scrollTrigger: { trigger: label, start: 'top 88%', toggleActions: 'play none none reverse' }
            }
        );
    });

    // --- Section titles ---
    document.querySelectorAll('.section-title').forEach(title => {
        gsap.fromTo(title,
            { y: 60, opacity: 0 },
            {
                y: 0, opacity: 1,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: { trigger: title, start: 'top 85%', toggleActions: 'play none none reverse' }
            }
        );
    });


    // --- reveal-text ---
    document.querySelectorAll('.reveal-text').forEach(el => {
        gsap.fromTo(el,
            { y: 50, opacity: 0 },
            {
                y: 0, opacity: 1,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
            }
        );
    });

    // --- reveal-fade ---
    document.querySelectorAll('.reveal-fade').forEach(el => {
        gsap.fromTo(el,
            { y: 30, opacity: 0 },
            {
                y: 0, opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
            }
        );
    });

    // --- reveal-up ---
    document.querySelectorAll('.reveal-up').forEach((el, i) => {
        gsap.fromTo(el,
            { y: 50, opacity: 0 },
            {
                y: 0, opacity: 1,
                duration: 0.7,
                delay: i * 0.08,
                ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' }
            }
        );
    });


    // --- Work horizontal scroll ---
    const workSection = document.querySelector('.work');
    const workTrack = document.querySelector('.work-track');
    const workCards = gsap.utils.toArray('.work-card');

    if (workTrack && workCards.length > 0) {
        // Calculate total scroll width
        const getScrollWidth = () => workTrack.scrollWidth - window.innerWidth;

        // Only enable horizontal scroll if content overflows
        if (getScrollWidth() > 0) {
            // Horizontal scroll
            const workScrollTl = gsap.to(workTrack, {
                x: () => -getScrollWidth(),
                ease: 'none',
                scrollTrigger: {
                    trigger: workSection,
                    start: 'top top',
                    end: () => `+=${getScrollWidth()}`,
                    scrub: 1.5,
                    pin: true,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                }
            });

            // Card entrance with container animation
            workCards.forEach((card, i) => {
                gsap.from(card, {
                    opacity: 0,
                    y: 40,
                    duration: 0.6,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: card,
                        containerAnimation: workScrollTl,
                        start: 'left 85%',
                        toggleActions: 'play none none reverse',
                    }
                });
            });
        } else {
            // Not enough cards to scroll — simple fade-in entrance
            workCards.forEach((card, i) => {
                gsap.from(card, {
                    opacity: 0,
                    y: 40,
                    duration: 0.6,
                    delay: i * 0.15,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: workSection,
                        start: 'top 75%',
                        toggleActions: 'play none none reverse',
                    }
                });
            });
        }
    }


    // --- About photo ---
    gsap.fromTo('.about-photo',
        { x: -60, opacity: 0 },
        {
            x: 0, opacity: 1,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.about-grid', start: 'top 75%', toggleActions: 'play none none reverse' }
        }
    );

    gsap.fromTo('.about-col-right',
        { x: 60, opacity: 0 },
        {
            x: 0, opacity: 1,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.about-grid', start: 'top 75%', toggleActions: 'play none none reverse' }
        }
    );


    // --- Stat blocks and counters combined ---
    const statBlocks = gsap.utils.toArray('.stat-block');
    if (statBlocks.length > 0) {
        // Set counters to their final values by default (visible state)
        statBlocks.forEach(block => {
            const statVal = block.querySelector('.stat-val');
            if (statVal) {
                statVal.dataset.animated = 'false';
            }
        });

        // Animate blocks appearance
        gsap.fromTo('.stat-block',
            { y: 60, opacity: 0 },
            {
                y: 0, opacity: 1,
                stagger: 0.12,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.about-stats',
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                }
            }
        );

        // Animate counters separately with once: true
        ScrollTrigger.create({
            trigger: '.about-stats',
            start: 'top 80%',
            once: true,
            onEnter: () => {
                statBlocks.forEach((block) => {
                    const statVal = block.querySelector('.stat-val');
                    if (statVal && statVal.dataset.animated === 'false') {
                        statVal.dataset.animated = 'true';
                        const target = parseInt(statVal.dataset.count);
                        const obj = { val: 0 };
                        gsap.to(obj, {
                            val: target,
                            duration: 2,
                            ease: 'power2.out',
                            onUpdate: () => {
                                statVal.textContent = Math.round(obj.val);
                            }
                        });
                    }
                });
            }
        });
    }


    // --- Service items ---
    document.querySelectorAll('.service-item').forEach((item) => {
        gsap.fromTo(item,
            { y: 40, opacity: 0 },
            {
                y: 0, opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none reverse' }
            }
        );
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
    gsap.fromTo('.contact-title',
        { y: 80, opacity: 0 },
        {
            y: 0, opacity: 1,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.contact', start: 'top 70%', toggleActions: 'play none none reverse' }
        }
    );

    gsap.fromTo('.contact-sub',
        { y: 40, opacity: 0 },
        {
            y: 0, opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.contact-sub', start: 'top 88%', toggleActions: 'play none none reverse' }
        }
    );

    gsap.fromTo('.contact-link',
        { y: 40, opacity: 0 },
        {
            y: 0, opacity: 1,
            stagger: 0.1,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.contact-links', start: 'top 85%', toggleActions: 'play none none reverse' }
        }
    );


    // --- Footer ---
    gsap.fromTo('.footer-top > *',
        { y: 40, opacity: 0 },
        {
            y: 0, opacity: 1,
            stagger: 0.15,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.footer', start: 'top 90%', toggleActions: 'play none none reverse' }
        }
    );
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
    document.querySelector('.nav-brand').classList.add('menu-open');
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
    document.querySelector('.nav-brand').classList.remove('menu-open');
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
    // Set initial states with optimized rendering
    gsap.set('.hero-name-word', { y: '110%', force3D: true });
    gsap.set('.hero-top', { opacity: 0, y: 15, force3D: true });
    gsap.set('.hero-stripe', { opacity: 0, force3D: true });
    gsap.set('.hero-bio', { opacity: 0, y: 20, force3D: true });
    gsap.set('.hero-cta-wrap', { opacity: 0, y: 20, force3D: true });
    gsap.set('.hero-scroll', { opacity: 0, force3D: true });
    gsap.set('.hero-corner', { opacity: 0, force3D: true });
    gsap.set('.hero-grid-overlay', { opacity: 0, force3D: true });
    gsap.set('.mob-link span', { y: '120%', force3D: true });
    gsap.set('.mob-menu-bg', { y: '-100%', force3D: true });

    initLoader();
});


// ==========================================
// 12. RESIZE
// ==========================================
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
    }, 250);
});
