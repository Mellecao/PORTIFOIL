"use client";

import { useEffect, useRef } from "react";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";
import StatueHead from "@/components/StatueHead";

// ─── Inner page that consumes i18n ───────────────────────────────────────────
function HomeInner() {
  const { lang, t, tHtml, toggle } = useI18n();
  const initialized = useRef(false);

  // ─── GSAP + Lenis animation engine ────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Detect back/forward navigation — skip loader if returning to the page
    const isBackNav =
      (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type === "back_forward" ||
      sessionStorage.getItem("mm-visited") === "1";
    sessionStorage.setItem("mm-visited", "1");

    // Lock body scroll until animations are ready
    document.body.style.overflow = "hidden";

    // eslint-disable-next-line prefer-const
    let rafId: number;
    // Store references for cleanup
    let lenisInstance: InstanceType<typeof import("lenis").default> | null = null;
    let ScrollTriggerRef: typeof import("gsap/all").ScrollTrigger | null = null;
    let gsapRef: typeof import("gsap").gsap | null = null;

    async function bootAnimations() {
      const [gsapMod, lenisMod, gsapAllMod] = await Promise.all([
        import("gsap"),
        import("lenis"),
        import("gsap/all"),
      ]);

      const gsap = gsapMod.gsap ?? (gsapMod as unknown as { default: typeof gsapMod.gsap }).default;
      const { ScrollTrigger, ScrollToPlugin } = gsapAllMod;
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
      gsapRef = gsap;
      ScrollTriggerRef = ScrollTrigger;

      ScrollTrigger.config({
        autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
        ignoreMobileResize: true,
      });

      const lenis = new lenisMod.default({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical" as const,
        gestureOrientation: "vertical" as const,
        smoothWheel: true,
        touchMultiplier: 2,
      } as ConstructorParameters<typeof lenisMod.default>[0]);
      lenisInstance = lenis;

      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time: number) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      // ─── Cursor ───────────────────────────────────────────────────────────
      const cursorEl = document.getElementById("cursor");
      if (cursorEl) {
        const cursorLabel = cursorEl.querySelector<HTMLElement>(".cursor-label");
        let cX = window.innerWidth / 2, cY = window.innerHeight / 2;
        let tX = cX, tY = cY;
        document.addEventListener("mousemove", (e) => { tX = e.clientX; tY = e.clientY; });
        gsap.ticker.add(() => {
          const dt = 1 - Math.pow(0.78, gsap.ticker.deltaRatio());
          cX += (tX - cX) * dt; cY += (tY - cY) * dt;
          gsap.set(cursorEl, { x: cX, y: cY });
        });
        document.querySelectorAll("a, button, .work-card, .service-item").forEach((el) => {
          el.addEventListener("mouseenter", () => {
            cursorEl.classList.add("hovering");
            const lbl = (el as HTMLElement).dataset.cursorLabel;
            if (lbl && cursorLabel) { cursorEl.classList.add("show-label"); cursorLabel.textContent = lbl; }
          });
          el.addEventListener("mouseleave", () => cursorEl.classList.remove("hovering", "show-label"));
        });
      }

      // ─── Magnetic buttons ─────────────────────────────────────────────────
      document.querySelectorAll<HTMLElement>(".magnetic-btn").forEach((btn) => {
        const str = parseInt(btn.dataset.strength ?? "20");
        btn.addEventListener("mousemove", (e) => {
          const r = btn.getBoundingClientRect();
          gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * (str / 100), y: (e.clientY - r.top - r.height / 2) * (str / 100), duration: 0.4, ease: "power2.out" });
        });
        btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.5)" }));
      });

      // ─── Clock ────────────────────────────────────────────────────────────
      const updateClock = () => {
        const el = document.getElementById("nav-clock");
        if (!el) return;
        const now = new Date();
        el.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
      };
      setInterval(updateClock, 1000);
      updateClock();

      // ─── Smooth anchor links ──────────────────────────────────────────────
      document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          const target = document.querySelector(a.getAttribute("href")!);
          if (target) lenis.scrollTo(target as HTMLElement, { offset: -60, duration: 1.4 });
        });
      });

      // ─── Mobile menu ──────────────────────────────────────────────────────
      const hamburger = document.getElementById("nav-hamburger");
      const mobMenu = document.getElementById("mob-menu");
      let menuOpen = false;

      const openMobMenu = () => {
        menuOpen = true;
        hamburger?.classList.add("active");
        mobMenu?.classList.add("active");
        document.querySelector(".nav-brand")?.classList.add("menu-open");
        lenis.stop();
        const tl = gsap.timeline();
        tl.to(".mob-menu-bg", { y: 0, duration: 0.7, ease: "power4.inOut" });
        tl.to(".mob-menu-inner", { opacity: 1, duration: 0.3 }, "-=0.3");
        tl.to(".mob-link span", { y: 0, stagger: 0.08, duration: 0.6, ease: "power3.out" }, "-=0.2");
      };

      const closeMobMenu = () => {
        menuOpen = false;
        hamburger?.classList.remove("active");
        document.querySelector(".nav-brand")?.classList.remove("menu-open");
        lenis.start();
        const tl = gsap.timeline({
          onComplete: () => {
            mobMenu?.classList.remove("active");
            gsap.set(".mob-link span", { y: "120%" });
            gsap.set(".mob-menu-inner", { opacity: 0 });
          },
        });
        tl.to(".mob-menu-inner", { opacity: 0, duration: 0.25 });
        tl.to(".mob-menu-bg", { y: "-100%", duration: 0.6, ease: "power4.inOut" }, "-=0.1");
      };

      hamburger?.addEventListener("click", () => (menuOpen ? closeMobMenu() : openMobMenu()));
      document.querySelectorAll(".mob-link").forEach((a) => a.addEventListener("click", closeMobMenu));

      // ─── Initial GSAP states ──────────────────────────────────────────────
      gsap.set(".hero-name-word", { y: "110%", force3D: true });
      gsap.set(".hero-top", { opacity: 0, y: 15, force3D: true });
      gsap.set(".hero-stripe", { opacity: 0, force3D: true });
      gsap.set(".hero-bio", { opacity: 0, y: 20, force3D: true });
      gsap.set(".hero-cta-wrap", { opacity: 0, y: 20, force3D: true });
      gsap.set(".hero-scroll", { opacity: 0, force3D: true });
      gsap.set(".hero-corner", { opacity: 0, force3D: true });
      gsap.set(".hero-grid-overlay", { opacity: 0, force3D: true });
      gsap.set(".mob-link span", { y: "120%", force3D: true });
      gsap.set(".mob-menu-bg", { y: "-100%", force3D: true });

      // ─── Loader ───────────────────────────────────────────────────────────
      const counterEl = document.getElementById("loader-counter");
      const barFill = document.getElementById("loader-bar-fill");
      const counter = { val: 0 };

      function revealPage() {
        // Unlock body scroll
        document.body.style.overflow = "";
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        tl.to(".hero-name-word", { y: 0, duration: 1.4, stagger: 0.15, force3D: true });
        tl.to(".hero-top", { opacity: 1, y: 0, duration: 0.7, force3D: true }, "-=1");
        tl.to(".hero-stripe", { opacity: 1, duration: 0.6, force3D: true }, "-=0.6");
        tl.to(".hero-bio", { opacity: 1, y: 0, duration: 0.7 }, "-=0.4");
        tl.to(".hero-cta-wrap", { opacity: 1, y: 0, duration: 0.7 }, "-=0.5");
        tl.to(".hero-scroll", { opacity: 1, duration: 0.6 }, "-=0.4");
        tl.to(".hero-corner", { opacity: 0.5, duration: 0.6, stagger: 0.1 }, "-=0.5");
        tl.to(".hero-grid-overlay", { opacity: 1, duration: 1 }, "-=0.8");
        tl.add(() => initScrollAnimations());
      }

      // If returning via back navigation, skip the loader entirely
      if (isBackNav) {
        const loaderEl = document.getElementById("loader");
        if (loaderEl) loaderEl.style.display = "none";
        // Show hero elements immediately
        gsap.set(".hero-name-word", { y: 0 });
        gsap.set(".hero-top", { opacity: 1, y: 0 });
        gsap.set(".hero-stripe", { opacity: 1 });
        gsap.set(".hero-bio", { opacity: 1, y: 0 });
        gsap.set(".hero-cta-wrap", { opacity: 1, y: 0 });
        gsap.set(".hero-scroll", { opacity: 1 });
        gsap.set(".hero-corner", { opacity: 0.5 });
        gsap.set(".hero-grid-overlay", { opacity: 1 });
        document.body.style.overflow = "";
        initScrollAnimations();
      } else {
        const loaderTl = gsap.timeline({ onComplete: revealPage });
      loaderTl.to(".loader-tag", { opacity: 1, duration: 0.4 }, 0);
      loaderTl.to(".loader-counter", { opacity: 1, textShadow: "0 0 15px rgba(255,20,24,.5)", duration: 0.3 }, 0.1);
      loaderTl.to(".loader-name-line", { y: 0, stagger: 0.12, duration: 0.8, ease: "power4.out" }, 0.2);
      loaderTl.to(counter, {
        val: 100, duration: 2.2, ease: "power2.inOut",
        onUpdate: () => {
          if (counterEl) counterEl.textContent = String(Math.round(counter.val)).padStart(3, "0");
          if (barFill) barFill.style.width = Math.round(counter.val) + "%";
        },
      }, 0.3);
      loaderTl.to({}, { duration: 0.4 });
      loaderTl.to(".loader-inner", { opacity: 0, y: -30, duration: 0.5, ease: "power3.in" });
      loaderTl.to(".loader-wipe-1", { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "-=0.2");
      loaderTl.to(".loader-wipe-2", { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "-=0.6");
      loaderTl.set(".loader", { display: "none" });
      }

      function initScrollAnimations() {
        // Nav scroll
        const nav = document.getElementById("nav");
        ScrollTrigger.create({
          start: "top -60", end: 99999,
          onUpdate: (self) => {
            if (self.direction === 1 && self.scroll() > 60) nav?.classList.add("scrolled");
            if (self.scroll() < 60) nav?.classList.remove("scrolled");
          },
        });

        // Hero zoom
        if (window.innerWidth > 768) {
          gsap.set(".hero-name", { scale: 1, rotation: 0, x: -4, force3D: true });
          gsap.set("#hero-red-fill", { opacity: 0, force3D: true });
          gsap.set("#marquee-overlay", { opacity: 0, force3D: true });
          const heroZoomTl = gsap.timeline({
            scrollTrigger: {
              trigger: ".hero", start: "top top", end: "+=400%", pin: true, scrub: 0.8, pinSpacing: true, invalidateOnRefresh: true,
              onUpdate: (self) => {
                const ov = document.getElementById("marquee-overlay");
                if (ov) ov.style.pointerEvents = self.progress > 0.35 ? "auto" : "none";
              },
            },
          });
          [".hero-top",".hero-bio",".hero-cta-wrap",".hero-scroll",".hero-corner",".hero-stripe",".hero-grid-overlay",".hero-noise",".hero-name-accent",".statue-head"].forEach((s) =>
            heroZoomTl.to(s, { opacity: 0, y: -10, duration: 0.04 }, 0)
          );
          heroZoomTl.to(".hero-name", { scale: 18, rotation: 4, duration: 0.35, force3D: true }, 0.03);
          heroZoomTl.to("#hero-red-fill", { opacity: 1, duration: 0.08 }, 0.08);
          heroZoomTl.to("#marquee-overlay", { opacity: 1, duration: 0.12 }, 0.18);
        }

        // Section labels
        document.querySelectorAll(".section-label").forEach((label) => {
          gsap.fromTo(Array.from(label.children), { y: 20, opacity: 0 }, {
            y: 0, opacity: 1, stagger: 0.08, duration: 0.7, ease: "power3.out",
            scrollTrigger: { trigger: label, start: "top 88%", toggleActions: "play none none reverse" },
          });
        });

        // Section titles
        document.querySelectorAll(".section-title").forEach((t) => {
          gsap.fromTo(t, { y: 60, opacity: 0 }, {
            y: 0, opacity: 1, duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: t, start: "top 85%", toggleActions: "play none none reverse" },
          });
        });

        [".reveal-text", ".reveal-fade", ".reveal-up"].forEach((cls, idx) => {
          document.querySelectorAll(cls).forEach((el, i) => {
            gsap.fromTo(el, { y: idx === 0 ? 50 : idx === 1 ? 30 : 50, opacity: 0 }, {
              y: 0, opacity: 1, duration: idx === 2 ? 0.7 : idx === 0 ? 1 : 0.8,
              delay: idx === 2 ? i * 0.08 : 0, ease: "power3.out",
              scrollTrigger: { trigger: el, start: `top ${idx === 2 ? 90 : 88}%`, toggleActions: "play none none reverse" },
            });
          });
        });

        // Work horizontal scroll
        const workSection = document.querySelector(".work");
        const workTrack = document.querySelector<HTMLElement>(".work-track");
        const workCards = gsap.utils.toArray<HTMLElement>(".work-card");
        if (workTrack && workCards.length > 0) {
          const getScrollWidth = () => workTrack.scrollWidth - window.innerWidth;
          if (getScrollWidth() > 0) {
            const wTl = gsap.to(workTrack, {
              x: () => -getScrollWidth(), ease: "none",
              scrollTrigger: { trigger: workSection, start: "top top", end: () => `+=${getScrollWidth()}`, scrub: 1.5, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
            });
            workCards.forEach((card) => {
              gsap.from(card, {
                opacity: 0, y: 40, duration: 0.6, ease: "power2.out",
                scrollTrigger: { trigger: card, containerAnimation: wTl, start: "left 85%", toggleActions: "play none none reverse" },
              });
            });
          } else {
            workCards.forEach((card, i) => {
              gsap.from(card, {
                opacity: 0, y: 40, duration: 0.6, delay: i * 0.15, ease: "power2.out",
                scrollTrigger: { trigger: workSection, start: "top 75%", toggleActions: "play none none reverse" },
              });
            });
          }
        }

        // About
        gsap.fromTo(".about-photo", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".about-grid", start: "top 75%", toggleActions: "play none none reverse" } });
        gsap.fromTo(".about-col-right", { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".about-grid", start: "top 75%", toggleActions: "play none none reverse" } });

        // Stats
        const statBlocks = gsap.utils.toArray<HTMLElement>(".stat-block");
        if (statBlocks.length) {
          statBlocks.forEach((b) => { const sv = b.querySelector<HTMLElement>(".stat-val"); if (sv) sv.dataset.animated = "false"; });
          gsap.fromTo(".stat-block", { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".about-stats", start: "top 80%", toggleActions: "play none none reverse" } });
          ScrollTrigger.create({
            trigger: ".about-stats", start: "top 80%", once: true,
            onEnter: () => {
              statBlocks.forEach((b) => {
                const sv = b.querySelector<HTMLElement>(".stat-val");
                if (!sv || sv.dataset.animated !== "false") return;
                sv.dataset.animated = "true";
                const obj = { val: 0 };
                gsap.to(obj, { val: parseInt(sv.dataset.count ?? "0"), duration: 2, ease: "power2.out", onUpdate: () => { sv.textContent = String(Math.round(obj.val)); } });
              });
            },
          });
        }

        // Services
        document.querySelectorAll(".service-item").forEach((item) => {
          gsap.fromTo(item, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: item, start: "top 88%", toggleActions: "play none none reverse" } });
        });

        // Contact
        gsap.fromTo(".contact-title", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".contact", start: "top 70%", toggleActions: "play none none reverse" } });
        gsap.fromTo(".contact-sub", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".contact-sub", start: "top 88%", toggleActions: "play none none reverse" } });
        gsap.fromTo(".contact-link", { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: ".contact-links", start: "top 85%", toggleActions: "play none none reverse" } });

        // Footer
        gsap.fromTo(".footer-top > *", { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.15, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: ".footer", start: "top 90%", toggleActions: "play none none reverse" } });

        // Resize
        let resizeTm: ReturnType<typeof setTimeout>;
        window.addEventListener("resize", () => { clearTimeout(resizeTm); resizeTm = setTimeout(() => ScrollTrigger.refresh(), 250); });
      }
    }

    bootAnimations().catch(console.error);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      // Kill all ScrollTrigger instances and GSAP tweens
      if (ScrollTriggerRef) {
        ScrollTriggerRef.getAll().forEach((st: { kill: () => void }) => st.kill());
      }
      if (gsapRef) {
        gsapRef.killTweensOf("*");
      }
      if (lenisInstance) {
        lenisInstance.destroy();
      }
      document.body.style.overflow = "";
      initialized.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* CURSOR */}
      <div className="cursor" id="cursor">
        <div className="cursor-dot"></div>
        <div className="cursor-ring"></div>
        <span className="cursor-label"></span>
      </div>

      {/* LOADER */}
      <div className="loader" id="loader">
        <div className="loader-inner">
          <div className="loader-col loader-col-left">
            <span className="loader-tag">[LOADING]</span>
            <div className="loader-name">
              <span className="loader-name-line">MIGUEL</span>
              <span className="loader-name-line">MELLE</span>
            </div>
          </div>
          <div className="loader-col loader-col-right">
            <div className="loader-counter" id="loader-counter">000</div>
            <div className="loader-bar">
              <div className="loader-bar-fill" id="loader-bar-fill"></div>
            </div>
          </div>
        </div>
        <div className="loader-wipe loader-wipe-1"></div>
        <div className="loader-wipe loader-wipe-2"></div>
      </div>

      {/* NAV */}
      <nav className="nav" id="nav">
        <div className="nav-inner">
          <a href="#" className="nav-brand">
            <span className="nav-brand-name">MM</span>
            <span className="nav-brand-dot">●</span>
          </a>
          <div className="nav-links">
            <a href="#work" className="nav-link">{t("nav.work")}</a>
            <a href="#about" className="nav-link">{t("nav.about")}</a>
            <a href="#services" className="nav-link">{t("nav.services")}</a>
            <a href="#contact" className="nav-link">{t("nav.contact")}</a>
          </div>
          <button className="lang-toggle" onClick={toggle} aria-label="Toggle language">
            <span className="lang-toggle-active">{lang === "pt" ? "PT" : "EN"}</span>
            <span className="lang-toggle-sep">/</span>
            <span className="lang-toggle-inactive">{lang === "pt" ? "EN" : "PT"}</span>
          </button>
          <div className="nav-time">
            <span id="nav-clock">00:00:00</span>
            <span className="nav-location">SÃO PAULO—SP</span>
          </div>
          <button className="nav-hamburger" id="nav-hamburger" aria-label="Menu">
            <span></span><span></span>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className="mob-menu" id="mob-menu">
        <div className="mob-menu-bg"></div>
        <div className="mob-menu-inner">
          <div className="mob-menu-links">
            <a href="#work" className="mob-link"><span>{t("mob.work")}</span></a>
            <a href="#about" className="mob-link"><span>{t("mob.about")}</span></a>
            <a href="#services" className="mob-link"><span>{t("mob.services")}</span></a>
            <a href="#contact" className="mob-link"><span>{t("mob.contact")}</span></a>
          </div>
          <div className="mob-menu-footer"></div>
        </div>
      </div>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-noise"></div>
        <div className="container">
          <div className="hero-top">
            <div className="hero-tag-group">
              <span className="hero-tag">DESIGNER</span>
              <span className="hero-tag">SÃO PAULO—SP</span>
              <span className="hero-tag">SINCE 2020</span>
            </div>
          </div>
          <div className="hero-center">
            <h1 className="hero-name">
              <span className="hero-name-line"><span className="hero-name-word">MIGUEL</span></span>
              <span className="hero-name-line"><span className="hero-name-word">MELLE<span className="hero-name-accent">®</span></span></span>
            </h1>
            <StatueHead />
            <div className="hero-stripe">
              <div className="hero-stripe-inner">
                <span>BRAND DESIGN ✦ WEB DESIGN ✦ PACKAGING ✦ BRAND DESIGN ✦ WEB DESIGN ✦ PACKAGING ✦ BRAND DESIGN ✦ WEB DESIGN ✦ PACKAGING ✦ BRAND DESIGN ✦ WEB DESIGN ✦ PACKAGING ✦</span>
              </div>
            </div>
          </div>
          <div className="hero-bottom">
            <div className="hero-bio">
              <p>{t("hero.bio")}</p>
            </div>
            <div className="hero-cta-wrap">
              <a href="#work" className="hero-cta magnetic-btn" data-strength="30">
                <span className="hero-cta-text">{t("hero.cta")}</span>
                <span className="hero-cta-arrow">↗</span>
              </a>
            </div>
            <div className="hero-scroll">
              <div className="hero-scroll-line"></div>
              <span>SCROLL</span>
            </div>
          </div>
        </div>
        <div className="hero-grid-overlay"></div>
        <div className="hero-corner hero-corner-tl">[*]</div>
        <div className="hero-corner hero-corner-tr">2026</div>
        <div className="hero-corner hero-corner-br">PORTFOLIO—V3</div>
        <div className="hero-red-fill" id="hero-red-fill"></div>
        <div className="marquee-overlay" id="marquee-overlay">
          <div className="mq-skills-title">{t("mq.title")}</div>
          {(["mq-row-1","mq-row-2","mq-row-3","mq-row-4","mq-row-5"] as const).map((cls, i) => (
            <div key={cls} className={`mq-row ${cls}`}>
              <div className={`mq-row-track${i % 2 === 1 ? " mq-reverse" : ""}`}>
                {(["TIPOGRAFIA","EMBALAGENS","BRANDING","WEB DESIGN","COMPOSIÇÃO","HIERARQUIA"] as const).map((w, j) => (
                  <span key={j}><span className="mq-word">{w}</span><span className="mq-dot">●</span></span>
                ))}
                {(["TIPOGRAFIA","EMBALAGENS","BRANDING","WEB DESIGN","COMPOSIÇÃO","HIERARQUIA"] as const).map((w, j) => (
                  <span key={j + 6}><span className="mq-word">{w}</span><span className="mq-dot">●</span></span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WORK */}
      <section className="work" id="work">
        <div className="container">
          <div className="section-head">
            <div className="section-label">
              <span className="section-idx">(01)</span>
              <span className="section-dash">————</span>
              <span className="section-tag">{t("work.tag")}</span>
            </div>
            <h2 className="section-title" dangerouslySetInnerHTML={{ __html: tHtml("work.title") }} />
          </div>
        </div>
        <div className="work-horizontal" id="work-horizontal">
          <div className="work-track">
            <a href="https://guibrand.netlify.app" target="_blank" className="work-card" data-cursor-label="VER">
              <div className="work-card-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://rpczwepbpuayxfkxphdm.supabase.co/storage/v1/object/public/portfoil/gui%20capa.png" alt="GUI" className="work-card-placeholder" />
                <div className="work-card-overlay"><span className="work-card-num">01</span></div>
              </div>
              <div className="work-card-info">
                <div className="work-card-tags"><span>IDENTIDADE VISUAL</span><span>BRANDING</span></div>
                <h3 className="work-card-title">GUI.</h3>
                <p className="work-card-desc">{t("card.gui.desc")}</p>
                <span className="work-card-year">2025</span>
              </div>
            </a>
            <a href="/up-foods" className="work-card" data-cursor-label="VER">
              <div className="work-card-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://rpczwepbpuayxfkxphdm.supabase.co/storage/v1/object/public/portfoil/capa%20up.png" alt="UP" className="work-card-placeholder" />
                <div className="work-card-overlay"><span className="work-card-num">02</span></div>
              </div>
              <div className="work-card-info">
                <div className="work-card-tags"><span>IDENTIDADE VISUAL</span></div>
                <h3 className="work-card-title">UP</h3>
                <p className="work-card-desc">{t("card.up.desc")}</p>
                <span className="work-card-year">2024</span>
              </div>
            </a>
            <a href="/renderizai" className="work-card" data-cursor-label="VER">
              <div className="work-card-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://rpczwepbpuayxfkxphdm.supabase.co/storage/v1/object/public/portfoil/fundorenderiz.png" alt="RENDERIZAI" className="work-card-placeholder" />
                <div className="work-card-overlay"><span className="work-card-num">03</span></div>
              </div>
              <div className="work-card-info">
                <div className="work-card-tags"><span>IDENTIDADE VISUAL</span><span>BRANDING</span><span>I.A</span></div>
                <h3 className="work-card-title">RENDERIZ<span style={{color:"#E50C3D"}}>AI</span></h3>
                <p className="work-card-desc">{t("card.renderizai.desc")}</p>
                <span className="work-card-year">2026</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about" id="about">
        <div className="container">
          <div className="section-head">
            <div className="section-label">
              <span className="section-idx">(02)</span>
              <span className="section-dash">————</span>
              <span className="section-tag">{t("about.tag")}</span>
            </div>
            <h2 className="section-title" dangerouslySetInnerHTML={{ __html: tHtml("about.title") }} />
          </div>
          <div className="about-grid">
            <div className="about-col-left">
              <div className="about-photo">
                <video src="/src/videobio.mp4" autoPlay muted loop playsInline className="about-photo-placeholder" />
                <div className="about-photo-frame"></div>
                <span className="about-photo-tag">[RETRATO]</span>
              </div>
            </div>
            <div className="about-col-right">
              <div className="about-intro">
                <p className="about-big-text reveal-text" dangerouslySetInnerHTML={{ __html: tHtml("about.bigtext") }} />
              </div>
              <div className="about-body about-magazine">
                <p className="about-mag-col reveal-fade">{t("about.p1")}</p>
                <p className="about-mag-col reveal-fade">{t("about.p2")}</p>
                <p className="about-mag-col reveal-fade">{t("about.p3")}</p>
                <p className="about-mag-col reveal-fade">{t("about.p4")}</p>
              </div>
              <div className="about-skills">
                <div className="skill-row reveal-up">
                  <span className="skill-label">{t("about.strengths")}</span>
                  <div className="skill-items">
                    <span className="skill-tag">{t("skill.typo")}</span>
                    <span className="skill-tag">{t("skill.pack")}</span>
                    <span className="skill-tag">{t("skill.comp")}</span>
                    <span className="skill-tag">{t("skill.hier")}</span>
                    <span className="skill-tag">{t("skill.behav")}</span>
                    <span className="skill-tag">{t("skill.sites")}</span>
                  </div>
                </div>
                <div className="skill-row reveal-up">
                  <span className="skill-label">{t("about.tools")}</span>
                  <div className="skill-items">
                    {["Figma","Illustrator","Photoshop","HTML/CSS/JS","GSAP"].map((s) => (
                      <span key={s} className="skill-tag">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="about-stats">
            {([{count:6,unit:t("stat.years"),descKey:"stat.exp"},{count:15,unit:"+",descKey:"stat.pack"},{count:50,unit:"+",descKey:"stat.proj"},{count:100,unit:"%",descKey:"stat.ded"}] as const).map(({count,unit,descKey}) => (
              <div key={descKey} className="stat-block reveal-up">
                <span className="stat-val" data-count={String(count)}>0</span>
                <span className="stat-unit">{unit}</span>
                <span className="stat-desc" dangerouslySetInnerHTML={{ __html: tHtml(descKey) }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="services" id="services">
        <div className="container">
          <div className="section-head">
            <div className="section-label light">
              <span className="section-idx">(03)</span>
              <span className="section-dash">————</span>
              <span className="section-tag">{t("svc.tag")}</span>
            </div>
            <h2 className="section-title light" dangerouslySetInnerHTML={{ __html: tHtml("svc.title") }} />
          </div>
          <div className="services-list">
            {([
              {num:"01",nameKey:"svc1.name",descKey:"svc1.desc",tags:["Branding","Visual Identity","Brand System"]},
              {num:"02",nameKey:"svc2.name",descKey:"svc2.desc",tags:["Sites","Landing Pages","E-commerce"]},
              {num:"03",nameKey:"svc3.name",descKey:"svc3.desc",tags:["Packaging","Food Industry","Regulatório"]},
            ] as const).map(({num,nameKey,descKey,tags}) => (
              <div key={num} className="service-item">
                <div className="service-item-inner">
                  <span className="service-num">{num}</span>
                  <div className="service-content">
                    <h3 className="service-name">{t(nameKey)}</h3>
                    <p className="service-desc">{t(descKey)}</p>
                  </div>
                  <div className="service-tags-col">
                    {tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <div className="service-arrow">↗</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="section-head">
            <div className="section-label">
              <span className="section-idx">(04)</span>
              <span className="section-dash">————</span>
              <span className="section-tag">{t("contact.tag")}</span>
            </div>
          </div>
          <div className="contact-content">
            <h2 className="contact-title reveal-text" dangerouslySetInnerHTML={{ __html: tHtml("contact.title") }} />
            <p className="contact-sub reveal-fade">{t("contact.sub")}</p>
            <div className="contact-links">
              <button
                onClick={() => {
                  navigator.clipboard.writeText("melle.miguel1@gmail.com").then(() => {
                    const arrow = document.querySelector<HTMLElement>(".contact-email .contact-link-arrow");
                    if (arrow) { arrow.textContent = "COPIADO!"; setTimeout(() => { arrow.textContent = "↗"; }, 2000); }
                  });
                }}
                className="contact-link contact-email magnetic-btn reveal-up"
                data-strength="20"
              >
                <span className="contact-link-label">EMAIL</span>
                <span className="contact-link-value">melle.miguel1@gmail.com</span>
                <span className="contact-link-arrow">↗</span>
              </button>
              <a href="https://linkedin.com/in/migmelle" target="_blank" rel="noopener noreferrer" className="contact-link magnetic-btn reveal-up" data-strength="20">
                <span className="contact-link-label">LINKEDIN</span>
                <span className="contact-link-value">in/migmelle</span>
                <span className="contact-link-arrow">↗</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="footer-logo">MIGUEL<br />MELLE</span>
              <span className="footer-badge">®</span>
            </div>
            <div className="footer-nav">
              <div className="footer-col">
                <span className="footer-col-title">[NAV]</span>
                <a href="#work">{t("footer.work")}</a>
                <a href="#about">{t("footer.about")}</a>
                <a href="#services">{t("footer.services")}</a>
                <a href="#contact">{t("footer.contact")}</a>
              </div>
              <div className="footer-col">
                <span className="footer-col-title">[SOCIAL]</span>
                <a href="#">LinkedIn</a>
                <a href="#">Dribbble</a>
              </div>
              <div className="footer-col">
                <span className="footer-col-title">[INFO]</span>
                <span>São Paulo—SP, Brasil</span>
                <span>melle.miguel1@gmail.com</span>
                <span>{t("footer.avail")}</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">{t("footer.copy")}</span>
            <span className="footer-credits">{t("footer.credits")}</span>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <HomeInner />
    </I18nProvider>
  );
}
