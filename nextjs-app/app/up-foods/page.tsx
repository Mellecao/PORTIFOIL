"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import "./up-foods.css";

/* ─── Constants ─── */
const S =
  "https://rpczwepbpuayxfkxphdm.supabase.co/storage/v1/object/public/up/";

const COLORS = [
  {
    hex: "#EC6336",
    name: "LARANJA UP",
    role: "PRIMÁRIA",
    meaning: ["Energia", "Entusiasmo", "Criatividade"],
    use: "Transmite dinamismo e proximidade, reforçando o espírito vibrante e acolhedor da marca. Estimula o apetite e a interação, ideal para destacar elementos principais.",
    lightText: true,
    border: false,
  },
  {
    hex: "#FDF6E7",
    name: "BEGE CLARO",
    role: "BASE",
    meaning: ["Leveza", "Conforto", "Naturalidade"],
    use: "Fundo neutro e acolhedor, equilibrando as cores mais intensas da paleta. Cria sensação de calor e harmonia.",
    lightText: false,
    border: true,
  },
  {
    hex: "#3F1700",
    name: "MARROM ESCURO",
    role: "TEXTO",
    meaning: ["Solidez", "Tradição", "Confiança"],
    use: "Reforça o caráter artesanal e autêntico da marca. Ideal para textos, ícones e detalhes refinados.",
    lightText: true,
    border: false,
  },
  {
    hex: "#F8FCFF",
    name: "BRANCO",
    role: "RESPIRO",
    meaning: ["Pureza", "Transparência", "Equilíbrio"],
    use: "Garante respiro visual e clareza na composição, destacando os demais elementos gráficos.",
    lightText: false,
    border: true,
  },
] as const;

const PRODUCTS = [
  { img: "mockup%20produto%20ALHO%20SACO%201.png", name: "Amendoim Alho" },
  { img: "mockup%20produto%20CEBOLA%20SACO%202.png", name: "Amendoim Cebola" },
  {
    img: "mockup%20produto%20COM%20CASCA%20SACO%203.png",
    name: "Amendoim Com Casca",
  },
  {
    img: "mockup%20produto%20SEM%20CASCA%20SACO%204.png",
    name: "Amendoim Sem Casca",
  },
  {
    img: "mockup%20produto%20TIPO%20JAPONES%20SACO%205.png",
    name: "Amendoim Tipo Japonês",
  },
  {
    img: "mockup%20produto%20GERGILIM%20SACO%206.png",
    name: "Amendoim Gergelim",
  },
];

const VOICE = [
  {
    attr: "POSITIVA",
    quote:
      "\u201CSua energia começa aqui. Cada manhã é uma nova chance de ir UP!\u201D",
  },
  {
    attr: "DIRETA",
    quote:
      "\u201CSem enrolação. Qualidade de verdade, do campo pra sua mão.\u201D",
  },
  {
    attr: "INSPIRADORA",
    quote:
      "\u201CUm snack pra quem não para. Quem é UP, já sabe.\u201D",
  },
  {
    attr: "CONFIÁVEL",
    quote:
      "\u201COrigem rastreada, qualidade garantida. A UP cuida do que você come.\u201D",
  },
];

const DELIVERABLES = [
  "LOGOTIPO",
  "PALETA DE CORES",
  "TIPOGRAFIA",
  "MANUAL DE MARCA",
  "EMBALAGENS",
  "MOCKUPS",
  "IDENTIDADE VISUAL",
  "DIREÇÃO DE ARTE",
  "FOTOGRAFIA",
  "NAMING",
];

/* ─── Copy SVG Icon ─── */
function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/* ─── Page Component ─── */
export default function UpFoodsPage() {
  const [activeColor, setActiveColor] = useState(0);
  const [toast, setToast] = useState({ visible: false, text: "" });
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const initialized = useRef(false);
  const activeC = COLORS[activeColor];

  /* ── Body class ── */
  useEffect(() => {
    document.body.classList.add("up-body");
    return () => {
      document.body.classList.remove("up-body");
    };
  }, []);

  /* ── Load model-viewer script ── */
  useEffect(() => {
    if (document.querySelector('script[src*="model-viewer"]')) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src =
      "https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js";
    document.head.appendChild(s);
  }, []);

  /* ── Main interactive boot ── */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function boot() {
      const gsapMod = await import("gsap");
      const gsap =
        gsapMod.gsap ??
        (gsapMod as unknown as { default: typeof gsapMod.gsap }).default;

      /* ── Custom Cursor (GSAP-smoothed) ── */
      const cursorEl = document.getElementById("cursor");
      if (cursorEl && window.matchMedia("(pointer: fine)").matches) {
        let cX = window.innerWidth / 2;
        let cY = window.innerHeight / 2;
        let tX = cX;
        let tY = cY;

        document.addEventListener("mousemove", (e) => {
          tX = e.clientX;
          tY = e.clientY;
        });

        gsap.ticker.add(() => {
          const dt = 1 - Math.pow(0.78, gsap.ticker.deltaRatio());
          cX += (tX - cX) * dt;
          cY += (tY - cY) * dt;
          gsap.set(cursorEl, { x: cX, y: cY });
        });

        document
          .querySelectorAll(
            "a, button, .up-swatch-item, .up-product-card, .up-glass-nav-link, .up-glass-nav-back, .up-deliverable, .up-keyword"
          )
          .forEach((el) => {
            el.addEventListener("mouseenter", () =>
              cursorEl.classList.add("hovering")
            );
            el.addEventListener("mouseleave", () =>
              cursorEl.classList.remove("hovering", "show-label")
            );
          });
      }

      /* ── Hero 3D — mouse-follow rotation, no zoom, no auto-rotate ── */
      const heroMV = document.getElementById("up-hero-model");
      if (heroMV) {
        const BASE_THETA = 45;
        const BASE_PHI = 70;
        const RANGE = 25;
        let targetTheta = BASE_THETA;
        let targetPhi = BASE_PHI;
        let currentTheta = BASE_THETA;
        let currentPhi = BASE_PHI;

        // Block scroll-zoom on the model
        heroMV.addEventListener(
          "wheel",
          (e) => e.preventDefault(),
          { passive: false }
        );

        document.addEventListener("mousemove", (e) => {
          const nx = (e.clientX / window.innerWidth) * 2 - 1;
          const ny = (e.clientY / window.innerHeight) * 2 - 1;
          targetTheta = BASE_THETA + nx * RANGE;
          targetPhi = BASE_PHI + ny * RANGE * 0.5;
        });

        // Smooth interpolation via GSAP ticker
        gsap.ticker.add(() => {
          const dt = 1 - Math.pow(0.85, gsap.ticker.deltaRatio());
          currentTheta += (targetTheta - currentTheta) * dt;
          currentPhi += (targetPhi - currentPhi) * dt;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (heroMV as any).cameraOrbit = `${currentTheta}deg ${currentPhi}deg 2.5m`;
        });
      }

      /* ── Fix 3D materials ── */
      function fixMaterials(mv: Element) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const model = (mv as any).model;
        if (!model) return;
        for (const mat of model.materials) {
          const name: string = (mat.name || "").toLowerCase();
          if (name.includes("amarelo")) {
            mat.pbrMetallicRoughness.setBaseColorFactor([
              0xfb / 255,
              0xb0 / 255,
              0x3b / 255,
              1,
            ]);
          } else {
            mat.pbrMetallicRoughness.setBaseColorFactor([
              0xf8 / 255,
              0xfc / 255,
              0xff / 255,
              1,
            ]);
          }
        }
      }

      customElements.whenDefined("model-viewer").then(() => {
        document.querySelectorAll("model-viewer").forEach((mv) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((mv as any).loaded) fixMaterials(mv);
          mv.addEventListener("load", () => fixMaterials(mv));
        });
      });

      /* ── Scroll progress ── */
      const progressFill = document.getElementById("up-progress");
      window.addEventListener(
        "scroll",
        () => {
          const scrollTop = window.scrollY;
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          const progress =
            docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          if (progressFill) progressFill.style.width = progress + "%";
        },
        { passive: true }
      );

      /* ── Products drag scroll ── */
      const track = document.getElementById("up-products-track");
      if (track) {
        const wrapper = track.parentElement!;
        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;

        track.addEventListener("mousedown", (e) => {
          isDown = true;
          track.style.cursor = "grabbing";
          startX = e.pageX - wrapper.offsetLeft;
          scrollLeft = wrapper.scrollLeft;
        });
        document.addEventListener("mouseup", () => {
          isDown = false;
          track.style.cursor = "grab";
        });
        document.addEventListener("mousemove", (e) => {
          if (!isDown) return;
          e.preventDefault();
          const x = e.pageX - wrapper.offsetLeft;
          wrapper.scrollLeft = scrollLeft - (x - startX) * 2;
        });
      }

      /* ── Active nav on scroll ── */
      const sections = document.querySelectorAll(".up-section, .up-hero");
      const navLinks = document.querySelectorAll(".up-glass-nav-link");
      const mobileItems = document.querySelectorAll(".up-mobile-nav-item");

      function updateActiveNav() {
        let current = "";
        sections.forEach((section) => {
          if (window.scrollY >= (section as HTMLElement).offsetTop - 200)
            current = section.id || "";
        });
        navLinks.forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === "#" + current
          );
        });
        mobileItems.forEach((item) => {
          item.classList.toggle(
            "active",
            (item as HTMLElement).dataset.section === current
          );
        });
      }
      window.addEventListener("scroll", updateActiveNav, { passive: true });

      /* ── Smooth scroll for nav ── */
      document
        .querySelectorAll(".up-glass-nav-link, .up-mobile-nav-item")
        .forEach((link) => {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            const href = link.getAttribute("href");
            if (href) {
              document
                .querySelector(href)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          });
        });

      /* ── Scroll reveal (respects reduced-motion) ── */
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const el = entry.target as HTMLElement;
                el.style.opacity = "1";
                el.style.transform = "translateY(0)";
              }
            });
          },
          { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );

        document
          .querySelectorAll(
            ".up-bento-item, .up-type-card, .up-voice-item, .up-app-card, .up-product-card, .up-logo-version"
          )
          .forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.opacity = "0";
            htmlEl.style.transform = "translateY(30px)";
            htmlEl.style.transition =
              "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)";
            observer.observe(el);
          });
      }
    }

    boot().catch(console.error);
  }, []);

  /* ── Handlers ── */
  const copyHex = useCallback(
    (hex: string, idx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(hex);
      setCopiedIdx(idx);
      setToast({ visible: true, text: `${hex} copiado!` });
      setTimeout(() => {
        setCopiedIdx(null);
        setToast((t) => ({ ...t, visible: false }));
      }, 1800);
    },
    []
  );

  /* ── JSX ── */
  return (
    <>
      {/* ── Scroll Progress ── */}
      <div className="up-progress-bar">
        <div className="up-progress-fill" id="up-progress" />
      </div>

      {/* ── Copy Toast ── */}
      <div className={`up-copy-toast ${toast.visible ? "show" : ""}`}>
        {toast.text}
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="up-mobile-nav" aria-label="Navegação mobile">
        <div className="up-mobile-nav-inner">
          <a
            href="#up-hero"
            className="up-mobile-nav-item active"
            data-section="up-hero"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Início</span>
          </a>
          <a
            href="#up-logo"
            className="up-mobile-nav-item"
            data-section="up-logo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Logo</span>
          </a>
          <a
            href="#up-colors"
            className="up-mobile-nav-item"
            data-section="up-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 0 20" />
            </svg>
            <span>Cores</span>
          </a>
          <a
            href="#up-products"
            className="up-mobile-nav-item"
            data-section="up-products"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span>Produtos</span>
          </a>
        </div>
      </nav>

      {/* ── Custom Cursor ── */}
      <div className="cursor" id="cursor">
        <div className="cursor-dot" />
        <div className="cursor-ring" />
        <span className="cursor-label" />
      </div>

      {/* ── Glass Navbar ── */}
      <nav className="up-glass-nav" aria-label="Navegação principal">
        <div className="up-glass-nav-logo">
          <img
            src={`${S}Logo%20colorida.svg`}
            alt="UP"
            width={24}
            height={24}
          />
        </div>
        <div className="up-glass-nav-links">
          <a href="#up-concept" className="up-glass-nav-link">
            Propósito
          </a>
          <a href="#up-logo" className="up-glass-nav-link">
            Logo
          </a>
          <a href="#up-colors" className="up-glass-nav-link">
            Cores
          </a>
          <a href="#up-type" className="up-glass-nav-link">
            Tipo
          </a>
          <a href="#up-products" className="up-glass-nav-link">
            Produtos
          </a>
          <a href="#up-voice" className="up-glass-nav-link">
            Tom
          </a>
        </div>
        <Link href="/" className="up-glass-nav-back">
          ← Portfólio
        </Link>
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="up-hero" id="up-hero">
        <div className="up-blob up-blob-1" />
        <div className="up-blob up-blob-2" />

        <div className="up-hero-left">
          <div className="up-hero-badge">IDENTIDADE VISUAL</div>
          <h1 className="up-hero-title">
            <em>Eleve</em>
            <br />
            seus
            <br />
            momentos
          </h1>
          <p className="up-hero-desc">
            UP é uma marca brasileira de alimentos e bebidas com o propósito de
            elevar momentos cotidianos, oferecendo qualidade e exclusividade em
            cada item. Moderna, dinâmica e alto-astral.
          </p>
          <div className="up-hero-tags">
            <span className="up-hero-tag">ALIMENTOS</span>
            <span className="up-hero-tag">BEBIDAS</span>
            <span className="up-hero-tag">ENERGIA</span>
            <span className="up-hero-tag">BEM-ESTAR</span>
          </div>
        </div>

        <div className="up-hero-right">
          <div className="up-hero-3d">
            <model-viewer
              id="up-hero-model"
              src={`${S}logo%203d.glb`}
              alt="UP Logo 3D"
              interaction-prompt="none"
              shadow-intensity="0.4"
              exposure="1.2"
              camera-orbit="45deg 70deg 2.5m"
              touch-action="pan-y"
              style={{ background: "transparent" }}
            />
          </div>
        </div>

        <div className="up-hero-scroll" aria-hidden="true">
          <span className="up-hero-scroll-text">Scroll</span>
          <div className="up-hero-scroll-line" />
        </div>
      </section>

      {/* ═══════════════════ MARQUEE ═══════════════════ */}
      <div className="up-marquee" aria-hidden="true">
        <div className="up-marquee-track">
          {["CAFÉ", "AMENDOIM", "ENERGIA", "ALTO ASTRAL", "BEM-ESTAR", "QUALIDADE"].flatMap(
            (word, i) => [
              <span className="up-marquee-word" key={`a${i}`}>
                {word}
              </span>,
              <span className="up-marquee-dot" key={`ad${i}`}>
                ●
              </span>,
            ]
          )}
          {["CAFÉ", "AMENDOIM", "ENERGIA", "ALTO ASTRAL", "BEM-ESTAR", "QUALIDADE"].flatMap(
            (word, i) => [
              <span className="up-marquee-word" key={`b${i}`}>
                {word}
              </span>,
              <span className="up-marquee-dot" key={`bd${i}`}>
                ●
              </span>,
            ]
          )}
        </div>
      </div>

      {/* ═══════════════════ (01) PROPÓSITO ═══════════════════ */}
      <section className="up-section up-section-cream" id="up-concept">
        <div className="container">
          <div className="up-section-label">
            <span className="up-section-idx">(01)</span>
            <span className="up-section-dash" aria-hidden="true">
              ————
            </span>
            <span className="up-section-tag">PROPÓSITO</span>
          </div>
          <h2 className="up-section-title">
            Do campo à <em>cidade</em>
          </h2>

          <div className="up-bento">
            <div className="up-bento-item up-bento-text">
              <p>
                A UP nasce com o propósito de{" "}
                <strong>elevar os momentos cotidianos</strong>, oferecendo
                qualidade e exclusividade em cada item. Isso significa que a
                marca busca transformar pequenos instantes — como a pausa para o
                café ou o lanche rápido — em experiências revigorantes e
                especiais.
              </p>
              <p>
                Cada produto é desenvolvido com rigoroso padrão de qualidade e
                um toque de exclusividade, refletindo a crença de que mesmo
                atividades rotineiras podem se tornar mais{" "}
                <strong>agradáveis e motivadoras</strong>.
              </p>
              <p>
                Ao entregar produtos saborosos e estimulantes, a UP visa
                inspirar <strong>energia e alto astral</strong> nas pessoas,
                contribuindo para um dia a dia mais positivo.
              </p>
            </div>

            <div className="up-bento-item up-bento-img-1">
              <img
                src={`${S}Amigos%20compartilhaando%20amendoim%20(foto%20aaesthetic).jpg`}
                alt="Amigos compartilhando amendoim"
                loading="lazy"
              />
            </div>

            <div className="up-bento-item up-bento-img-2">
              <img
                src={`${S}Foto%20mao%20pegando%20amendoim.png`}
                alt="Mão pegando amendoim"
                loading="lazy"
              />
            </div>

            <div className="up-bento-item up-bento-keywords">
              <h3>PALAVRAS-CHAVE</h3>
              <div className="up-keyword-cloud">
                {[
                  "ENERGIA",
                  "ALTO ASTRAL",
                  "QUALIDADE",
                  "MODERNIDADE",
                  "JOVEM",
                  "VIBRANTE",
                  "CONFIÁVEL",
                  "EXCLUSIVIDADE",
                  "CAMPO & CIDADE",
                ].map((kw) => (
                  <span className="up-keyword" key={kw}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="up-bento-item up-bento-purpose">
              <h3>
                Elevar momentos cotidianos com sabor e energia :)
              </h3>
              <p>
                Moderna e dinâmica, a UP faz a ponte entre antigos produtores e
                os novos consumidores, trazendo o sabor do campo para a cidade
                sem perder a modernidade. Produtos orgânicos de boa procedência
                com preços atrativos.
              </p>
            </div>

            <div className="up-bento-item up-bento-img-3">
              <img
                src={`${S}Foto%20menina%20segurando%20pote%20de%20amendoim.png`}
                alt="Menina segurando pote de amendoim"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FULL-WIDTH IMAGE BREAK ═══════════════════ */}
      <div className="up-full-image">
        <img
          src={`${S}foto%20mesa%20de%20bar%20com%20pote%20de%20amendoim.png`}
          alt="Mesa de bar com amendoim UP"
          loading="lazy"
        />
        <div className="up-full-image-overlay">
          <span className="up-full-image-caption">
            Sabor que{" "}
            <em
              style={{
                fontFamily: "var(--f-serif)",
                fontStyle: "italic",
                color: "var(--up-amber)",
              }}
            >
              conecta
            </em>
          </span>
        </div>
      </div>

      {/* ═══════════════════ (02) LOGO ═══════════════════ */}
      <section className="up-section up-section-white" id="up-logo">
        <div className="container">
          <div className="up-section-label">
            <span className="up-section-idx">(02)</span>
            <span className="up-section-dash" aria-hidden="true">
              ————
            </span>
            <span className="up-section-tag">LOGOTIPO</span>
          </div>
          <h2 className="up-section-title">
            Marca com <em>personalidade</em>
          </h2>

          {/* Flat Logo */}
          <div className="up-logo-flat">
            <img
              src={`${S}Logo%20colorida.svg`}
              alt="UP Logo colorida"
            />
          </div>

          {/* 3D Logo viewer (interactive, camera-controls enabled) */}
          <div className="up-logo-display">
            <model-viewer
              id="up-logo-model"
              src={`${S}logo%203d.glb`}
              alt="UP Logo 3D interativo"
              auto-rotate
              camera-controls
              rotation-per-second="20deg"
              shadow-intensity="0.5"
              exposure="1.1"
              camera-orbit="0deg 75deg 3m"
              style={{ background: "transparent" }}
            />
          </div>
          <div className="up-logo-hint">
            <span>[ARRASTE PARA GIRAR • SCROLL PARA ZOOM]</span>
          </div>

          {/* Logo version cards */}
          <div className="up-logo-versions">
            <div className="up-logo-version">
              <img
                src={`${S}Logo%20colorida.svg`}
                alt="Logo colorida"
              />
              <span className="up-logo-version-label">COLORIDA</span>
            </div>
            <div className="up-logo-version up-logo-version-dark">
              <img
                src={`${S}Logo%20colorida.svg`}
                alt="Logo monocromática"
                style={{ filter: "brightness(10)" }}
              />
              <span className="up-logo-version-label">MONOCROMÁTICA</span>
            </div>
            <div
              className="up-logo-version"
              style={{ background: "var(--up-orange)" }}
            >
              <img
                src={`${S}Logo%20colorida.svg`}
                alt="Logo sobre cor"
                style={{ filter: "brightness(10)" }}
              />
              <span
                className="up-logo-version-label"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                SOBRE COR
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ (03) CORES ═══════════════════ */}
      <section className="up-section up-section-cream" id="up-colors">
        <div className="container">
          <div className="up-section-label">
            <span className="up-section-idx">(03)</span>
            <span className="up-section-dash" aria-hidden="true">
              ————
            </span>
            <span className="up-section-tag">PALETA DE CORES</span>
          </div>
          <h2 className="up-section-title">
            Cor com <em>calor</em>
          </h2>

          {/* Swatches */}
          <div className="up-color-swatches">
            {COLORS.map((c, i) => (
              <div
                key={c.hex}
                className={`up-swatch-item${i === activeColor ? " active" : ""}`}
                onClick={() => setActiveColor(i)}
                role="button"
                tabIndex={0}
                aria-label={`Selecionar cor ${c.name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveColor(i);
                  }
                }}
              >
                <button
                  className={`up-swatch-copy${copiedIdx === i ? " copied" : ""}`}
                  title={`Copiar ${c.hex}`}
                  onClick={(e) => copyHex(c.hex, i, e)}
                  aria-label={`Copiar código ${c.hex}`}
                >
                  <CopyIcon />
                </button>
                <div
                  className="up-swatch-fill"
                  style={{
                    background: c.hex,
                    border: c.border
                      ? "1px solid rgba(63,23,0,0.08)"
                      : undefined,
                  }}
                />
                <div className="up-swatch-label">
                  <span
                    className="up-swatch-hex"
                    style={{
                      color: c.lightText ? "#fff" : "var(--up-brown)",
                    }}
                  >
                    {c.hex}
                  </span>
                  <span
                    className="up-swatch-name"
                    style={{
                      color: c.lightText ? "#fff" : "var(--up-brown)",
                    }}
                  >
                    {c.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Color detail panel */}
          <div className="up-color-detail">
            <div className="up-detail-left">
              <div
                className="up-detail-color-preview"
                style={{ background: activeC.hex }}
              />
              <div className="up-detail-meta">
                <span className="up-detail-name">{activeC.name}</span>
                <span className="up-detail-role">{activeC.role}</span>
              </div>
            </div>
            <div className="up-detail-content">
              <div>
                <span className="up-detail-label">SIGNIFICADO</span>
                <div className="up-detail-tags">
                  {activeC.meaning.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="up-detail-label">USO ESTRATÉGICO</span>
                <p className="up-detail-use">{activeC.use}</p>
              </div>
            </div>
          </div>

          {/* Color ratio */}
          <div className="up-color-ratio">
            <div className="up-ratio-title">
              PROPORÇÃO DE USO RECOMENDADA
            </div>
            <div className="up-ratio-bar">
              <div
                className="up-ratio-segment"
                style={{ flex: 3, background: "#EC6336" }}
              >
                <span style={{ color: "#fff" }}>30%</span>
              </div>
              <div
                className="up-ratio-segment"
                style={{ flex: 4, background: "#FDF6E7" }}
              >
                <span style={{ color: "#3F1700" }}>40%</span>
              </div>
              <div
                className="up-ratio-segment"
                style={{ flex: 1.5, background: "#3F1700" }}
              >
                <span style={{ color: "#FDF6E7" }}>15%</span>
              </div>
              <div
                className="up-ratio-segment"
                style={{
                  flex: 1.5,
                  background: "#F8FCFF",
                  border: "1px solid rgba(63,23,0,0.08)",
                }}
              >
                <span style={{ color: "#3F1700" }}>15%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ (04) TIPOGRAFIA ═══════════════════ */}
      <section className="up-section up-section-white" id="up-type">
        <div className="container">
          <div className="up-section-label">
            <span className="up-section-idx">(04)</span>
            <span className="up-section-dash" aria-hidden="true">
              ————
            </span>
            <span className="up-section-tag">TIPOGRAFIA</span>
          </div>
          <h2 className="up-section-title">
            Tipo que <em>comunica</em>
          </h2>

          <div className="up-type-showcase">
            {/* Big card */}
            <div className="up-type-card up-type-card-big">
              <div
                className="up-type-specimen"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Aa Bb Cc
                <br />
                <span style={{ fontWeight: 300 }}>1234567890</span>
              </div>
              <div className="up-type-meta">
                <span className="up-type-tag">DISPLAY</span>
                <span className="up-type-font">Outfit — Google Fonts</span>
              </div>
            </div>

            {/* Heading card */}
            <div className="up-type-card">
              <div
                className="up-type-specimen-sm"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  textTransform: "uppercase" as const,
                }}
              >
                UP FOODS
              </div>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "rgba(63,23,0,0.45)",
                  marginBottom: 16,
                }}
              >
                Títulos e chamadas utilizam Outfit Black para máximo impacto
                visual.
              </p>
              <div className="up-type-meta">
                <span className="up-type-tag">HEADINGS</span>
                <span className="up-type-font">800 — Black</span>
              </div>
            </div>

            {/* Mono card */}
            <div className="up-type-card">
              <div
                className="up-type-specimen-sm"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 400,
                }}
              >
                ABCDEfghij
                <br />
                0123456789
              </div>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "rgba(63,23,0,0.45)",
                  marginBottom: 16,
                }}
              >
                Space Mono para detalhes técnicos, labels e códigos de cor.
              </p>
              <div className="up-type-meta">
                <span className="up-type-tag">MONOSPACE</span>
                <span className="up-type-font">Space Mono — 400</span>
              </div>
            </div>
          </div>

          {/* Type scale */}
          <div className="up-type-scale">
            <div className="up-scale-title">ESCALA TIPOGRÁFICA</div>
            <div>
              {[
                {
                  text: "Elevar momentos",
                  size: 48,
                  weight: 900,
                  spacing: -2,
                  label: "48px / Black",
                  font: "'Outfit', sans-serif",
                },
                {
                  text: "Qualidade e sabor",
                  size: 32,
                  weight: 700,
                  spacing: -1,
                  label: "32px / Bold",
                  font: "'Outfit', sans-serif",
                },
                {
                  text: "Energia pra todo dia",
                  size: 24,
                  weight: 600,
                  spacing: 0,
                  label: "24px / SemiBold",
                  font: "'Outfit', sans-serif",
                },
                {
                  text: "Produtos saborosos e estimulantes para um dia a dia mais positivo",
                  size: 16,
                  weight: 400,
                  spacing: 0,
                  label: "16px / Regular",
                  font: "'Outfit', sans-serif",
                },
                {
                  text: "AMENDOIM • CAFÉ • ENERGY DRINK",
                  size: 12,
                  weight: 400,
                  spacing: 0,
                  label: "12px / Mono",
                  font: "'Space Mono', monospace",
                },
              ].map((item) => (
                <div
                  className="up-scale-item"
                  key={item.label}
                  style={{
                    fontFamily: item.font,
                    fontSize: item.size,
                    fontWeight: item.weight,
                    letterSpacing: item.spacing || undefined,
                  }}
                >
                  {item.text} <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ (05) PRODUTOS ═══════════════════ */}
      <section className="up-section up-section-cream" id="up-products">
        <div className="container">
          <div className="up-section-label">
            <span className="up-section-idx">(05)</span>
            <span className="up-section-dash" aria-hidden="true">
              ————
            </span>
            <span className="up-section-tag">PRODUTOS</span>
          </div>
          <h2 className="up-section-title">
            Linha <em>completa</em>
          </h2>
        </div>

        <div className="up-products-wrapper">
          <div className="up-products-track" id="up-products-track">
            {PRODUCTS.map((p) => (
              <div className="up-product-card" key={p.img}>
                <div className="up-product-img">
                  <img src={`${S}${p.img}`} alt={p.name} loading="lazy" />
                </div>
                <div className="up-product-name">{p.name}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="up-drag-hint" aria-hidden="true">
          <span>[ARRASTE PARA VER MAIS →]</span>
        </div>
      </section>

      {/* ═══════════════════ (06) TOM DE VOZ ═══════════════════ */}
      <section className="up-section up-section-dark" id="up-voice">
        <div className="container">
          <div className="up-section-label">
            <span className="up-section-idx">(06)</span>
            <span className="up-section-dash" aria-hidden="true">
              ————
            </span>
            <span className="up-section-tag">TOM DE VOZ</span>
          </div>
          <h2 className="up-section-title">
            Voz <em>vibrante</em>
          </h2>

          <div
            className="up-concept-text"
            style={{ maxWidth: 700, marginBottom: 48 }}
          >
            <p>
              A personalidade da UP é{" "}
              <strong>jovem, vibrante e confiável</strong>. Energética e
              alto-astral, sempre enxergando oportunidades de animar o
              cotidiano. A comunicação é positiva, direta e inspiradora, com
              linguagem clara e objetiva — direta ao ponto para um público que
              valoriza eficiência.
            </p>
          </div>

          <div className="up-voice-grid">
            {VOICE.map((v) => (
              <div
                key={v.attr}
                className="up-voice-item"
                style={{
                  background: "rgba(253,246,231,0.04)",
                  borderColor: "rgba(253,246,231,0.08)",
                }}
              >
                <span
                  className="up-voice-attr"
                  style={{ color: "var(--up-amber)" }}
                >
                  {v.attr}
                </span>
                <span
                  className="up-voice-quote"
                  style={{ color: "var(--up-cream)" }}
                >
                  {v.quote}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ (07) APLICAÇÕES ═══════════════════ */}
      <section className="up-section up-section-white" id="up-apps">
        <div className="container">
          <div className="up-section-label">
            <span className="up-section-idx">(07)</span>
            <span className="up-section-dash" aria-hidden="true">
              ————
            </span>
            <span className="up-section-tag">APLICAÇÕES</span>
          </div>
          <h2 className="up-section-title">
            Marca em <em>ação</em>
          </h2>

          <div className="up-apps-mosaic">
            <div className="up-app-card up-app-card-1">
              <img
                src={`${S}Foto%20amigos%20jogando%20videogame%20com%20amendoim%20ao%20lado.png`}
                alt="Amigos jogando videogame com amendoim"
                loading="lazy"
              />
              <div className="up-app-label">LIFESTYLE — GAMING</div>
            </div>
            <div className="up-app-card up-app-card-2">
              <img
                src={`${S}Foto%20menina%20segurando%20pote%20de%20amendoim.png`}
                alt="Menina segurando pote de amendoim"
                loading="lazy"
              />
              <div className="up-app-label">LIFESTYLE — SNACK</div>
            </div>
            <div className="up-app-card up-app-card-3">
              <img
                src={`${S}mockup%20produto%20COM%20CASCA%20SACO%203.png`}
                alt="Embalagem Amendoim Com Casca"
                loading="lazy"
              />
              <div className="up-app-label">EMBALAGEM</div>
            </div>
            <div className="up-app-card up-app-card-4">
              <img
                src={`${S}foto%20mesa%20de%20bar%20com%20pote%20de%20amendoim.png`}
                alt="Mesa de bar com amendoim UP"
                loading="lazy"
              />
              <div className="up-app-label">PONTO DE VENDA</div>
            </div>
            <div className="up-app-card up-app-card-5">
              <img
                src={`${S}Foto%20mao%20pegando%20amendoim.png`}
                alt="Close-up mão pegando amendoim"
                loading="lazy"
              />
              <div className="up-app-label">FOTOGRAFIA</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ (08) ENTREGÁVEIS ═══════════════════ */}
      <section className="up-section up-section-cream" id="up-deliverables">
        <div className="container">
          <div className="up-section-label">
            <span className="up-section-idx">(08)</span>
            <span className="up-section-dash" aria-hidden="true">
              ————
            </span>
            <span className="up-section-tag">ENTREGÁVEIS</span>
          </div>
          <h2 className="up-section-title">
            O que foi <em>entregue</em>
          </h2>

          <div className="up-deliverables">
            {DELIVERABLES.map((d) => (
              <span className="up-deliverable" key={d}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA FOOTER ═══════════════════ */}
      <section className="up-cta-section">
        <div className="container">
          <h2 className="up-cta-title">
            GO <span>UP</span>
          </h2>
          <p className="up-cta-desc">
            Projeto completo de identidade visual — do conceito ao produto
            final. Uma marca feita para elevar momentos e conectar pessoas.
          </p>
          <Link
            href="/"
            className="up-glass-nav-back"
            style={{ fontSize: 14, padding: "14px 32px", display: "inline-block" }}
          >
            ← Voltar ao Portfólio
          </Link>
        </div>
      </section>
    </>
  );
}
