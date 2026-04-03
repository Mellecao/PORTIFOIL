"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Lang = "pt" | "en";

const translations: Record<string, string> = {
  // Nav
  "nav.work": "[WORK]",
  "nav.about": "[ABOUT]",
  "nav.services": "[SERVICES]",
  "nav.contact": "[CONTACT]",
  // Mobile menu
  "mob.work": "WORK",
  "mob.about": "ABOUT",
  "mob.services": "SERVICES",
  "mob.contact": "CONTACT",
  // Hero
  "hero.bio":
    "Multidisciplinary designer with 6 years of experience creating brands, packaging and disruptive digital experiences.",
  "hero.cta": "SEE WORK",
  // Marquee
  "mq.title": "[MY SKILLS]",
  // Work
  "work.tag": "SELECTED WORK",
  "work.title": "Recent<br><em>projects</em>",
  "card.gui.desc": "Brand manual for a rising startup.",
  "card.up.desc":
    "Complete visual identity for a food industry startup — modern and versatile brand.",
  "card.renderizai.desc":
    "Visual identity for an artificial intelligence rendering platform.",
  // About
  "about.tag": "WHO AM I",
  "about.title": "About<br><em>Miguel</em>",
  "about.bigtext":
    'Designer from <em>São Paulo—SP</em>, 25 years old, with 6 years of experience turning ideas into visual systems that <em>work</em> and <em>make an impact</em>.',
  "about.p1":
    "I have worked with big names in the market, such as Pedro Sobral, Priscilla Zillo and Prieto Alimentos. My work lives at the intersection of brutalist aesthetics, functionality and the unexpected.",
  "about.p2":
    "I believe in design as a behavioral tool. Every project is an opportunity to challenge the conventional and build something that doesn't just communicate, but transforms perception.",
  "about.p3":
    "My process starts with deep immersion — understanding the business, the audience, the context. From there I strip away what's unnecessary until only the essence remains. I don't design to decorate; I design to solve. Typography is my primary instrument: type selection, spacing and hierarchy can carry an entire brand without a single illustration.",
  "about.p4":
    "Over the years I've developed a particular obsession with the food industry. Packaging that sits on a shelf has roughly two seconds to convince someone to pick it up. That constraint sharpens everything — color, contrast, legibility at scale, regulatory compliance. It taught me that great design lives within limits, not despite them.",
  "about.strengths": "STRENGTHS",
  "about.tools": "TOOLS",
  "skill.typo": "Typography",
  "skill.pack": "Packaging",
  "skill.comp": "Composition",
  "skill.hier": "Hierarchy",
  "skill.behav": "Behavioral Design",
  "skill.sites": "Websites & Landing Pages",
  // Stats
  "stat.years": "YEARS",
  "stat.exp": "OF DESIGN<br>EXPERIENCE",
  "stat.pack": "PACKAGES ON<br>SHELVES IN BRAZIL",
  "stat.proj": "PROJECTS<br>COMPLETED",
  "stat.ded": "DEDICATION<br>PER PROJECT",
  // Services
  "svc.tag": "WHAT I DO",
  "svc.title": "Services &<br><em>expertise</em>",
  "svc1.name": "Brand Design",
  "svc1.desc":
    "Complete visual identity — logo, typography, palette, applications. Brand systems that communicate with personality and consistency.",
  "svc2.name": "Web Design & Dev",
  "svc2.desc":
    "Websites, landing pages and e-commerces focused on immersive experiences and disruptive design. Front-end in HTML, CSS and JavaScript with GSAP.",
  "svc3.name": "Packaging Design",
  "svc3.desc":
    "Packaging for the food industry with mastery of regulatory requirements, especially in the meat segment. From concept to shelf.",
  // Contact
  "contact.tag": "CONTACT",
  "contact.title": "Have a project<br>in mind<em>?</em>",
  "contact.sub":
    "Let's talk. I'm open to freelance projects, consulting and creative collaborations.",
  // Footer
  "footer.work": "Work",
  "footer.about": "About",
  "footer.services": "Services",
  "footer.contact": "Contact",
  "footer.avail": "Available for projects",
  "footer.copy": "© 2026 MIGUEL MELLE. ALL RIGHTS RESERVED.",
  "footer.credits": "DESIGN & CODE BY MM",
};

const ptDefaults: Record<string, string> = {
  "nav.work": "[TRABALHO]",
  "nav.about": "[SOBRE]",
  "nav.services": "[SERVIÇOS]",
  "nav.contact": "[CONTATO]",
  "mob.work": "TRABALHO",
  "mob.about": "SOBRE",
  "mob.services": "SERVIÇOS",
  "mob.contact": "CONTATO",
  "hero.bio":
    "Designer multidisciplinar com 6 anos de experiência criando marcas, embalagens e experiências digitais disruptivas.",
  "hero.cta": "VER TRABALHOS",
  "mq.title": "[MINHAS HABILIDADES]",
  "work.tag": "TRABALHO SELECIONADO",
  "work.title": "Projetos<br><em>recentes</em>",
  "card.gui.desc": "Manual de marca para uma startup em ascensão.",
  "card.up.desc":
    "Identidade visual completa para startup no ramo de alimentícios — marca moderna e versátil.",
  "card.renderizai.desc":
    "Identidade visual para plataforma de renderização com inteligência artificial.",
  "about.tag": "QUEM SOU EU",
  "about.title": "Sobre<br><em>Miguel</em>",
  "about.bigtext":
    'Designer de <em>São Paulo—SP</em>, 25 anos, com 6 anos de experiência transformando ideias em sistemas visuais que <em>funcionam</em> e <em>impactam</em>.',
  "about.p1":
    "Já trabalhei com grandes nomes do mercado, como Pedro Sobral, Priscilla Zillo e Prieto Alimentos. Meu trabalho vive na interseção entre estética brutalista, funcionalidade e o inesperado.",
  "about.p2":
    "Acredito no design como ferramenta de comportamento. Cada projeto é uma oportunidade de desafiar o convencional e construir algo que não apenas comunica, mas transforma a percepção.",
  "about.p3":
    "Meu processo começa com imersão profunda — entender o negócio, o público, o contexto. A partir daí, elimino o que é desnecessário até restar apenas a essência. Não faço design para decorar; faço para resolver. Tipografia é meu instrumento principal: escolha de fonte, espaçamento e hierarquia podem carregar uma marca inteira sem uma única ilustração.",
  "about.p4":
    "Ao longo dos anos desenvolvi uma obsessão particular pela indústria alimentícia. Uma embalagem na gôndola tem cerca de dois segundos para convencer alguém a pegá-la. Essa restrição aguça tudo — cor, contraste, legibilidade em escala, conformidade regulatória. Me ensinou que o grande design vive dentro dos limites, não apesar deles.",
  "about.strengths": "FORÇAS",
  "about.tools": "FERRAMENTAS",
  "skill.typo": "Tipografia",
  "skill.pack": "Embalagens",
  "skill.comp": "Composição",
  "skill.hier": "Hierarquia",
  "skill.behav": "Design Comportamental",
  "skill.sites": "Sites & Landing Pages",
  "stat.years": "ANOS",
  "stat.exp": "DE EXPERIÊNCIA<br>EM DESIGN",
  "stat.pack": "EMBALAGENS NAS<br>PRATELEIRAS DO BR",
  "stat.proj": "PROJETOS<br>REALIZADOS",
  "stat.ded": "DEDICAÇÃO<br>POR PROJETO",
  "svc.tag": "O QUE EU FAÇO",
  "svc.title": "Serviços &<br><em>expertises</em>",
  "svc1.name": "Design de Marca",
  "svc1.desc":
    "Identidade visual completa — logo, tipografia, paleta, aplicações. Sistemas de marca que comunicam com personalidade e consistência.",
  "svc2.name": "Web Design & Dev",
  "svc2.desc":
    "Sites, landing pages e e-commerces com foco em experiências imersivas e design disruptivo. Front-end em HTML, CSS e JavaScript com GSAP.",
  "svc3.name": "Design de Embalagens",
  "svc3.desc":
    "Embalagens para a indústria alimentícia com domínio de regras regulatórias, especialmente no segmento de carnes. Do conceito à gôndola.",
  "contact.tag": "CONTATO",
  "contact.title": "Tem um projeto<br>em mente<em>?</em>",
  "contact.sub":
    "Vamos conversar. Estou aberto a projetos freelance, consultoria e colaborações criativas.",
  "footer.work": "Trabalho",
  "footer.about": "Sobre",
  "footer.services": "Serviços",
  "footer.contact": "Contato",
  "footer.avail": "Disponível para projetos",
  "footer.copy": "© 2026 MIGUEL MELLE. TODOS OS DIREITOS RESERVADOS.",
  "footer.credits": "DESIGN & CODE POR MM",
};

interface I18nContextValue {
  lang: Lang;
  t: (key: string) => string;
  tHtml: (key: string) => string;
  toggle: () => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "pt",
  t: (k) => k,
  tHtml: (k) => k,
  toggle: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("pt");

  useEffect(() => {
    const saved = localStorage.getItem("mm-lang") as Lang | null;
    if (saved === "en" || saved === "pt") setLang(saved);
  }, []);

  const t = useCallback(
    (key: string): string => {
      if (lang === "en") return translations[key] ?? ptDefaults[key] ?? key;
      return ptDefaults[key] ?? key;
    },
    [lang]
  );

  const tHtml = useCallback(
    (key: string): string => {
      if (lang === "en") return translations[key] ?? ptDefaults[key] ?? key;
      return ptDefaults[key] ?? key;
    },
    [lang]
  );

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next = prev === "pt" ? "en" : "pt";
      localStorage.setItem("mm-lang", next);
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ lang, t, tHtml, toggle }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
