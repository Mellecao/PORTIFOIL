"use client";

import { useEffect, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
const ROWS = 28;
const FONT_SIZE = 14;
const LINE_HEIGHT = 16;
const CHAR_WIDTH = 8; // approximate avg char width in Georgia 14px
const PROP_FAMILY = 'Georgia, Palatino, "Times New Roman", serif';
const FIELD_OVERSAMPLE = 2;
const PARTICLE_DENSITY = 0.08; // particles per column
const SPRITE_R = 14;
const CURSOR_STAMP_R = 64;
const ATTRACTOR_FORCE = 0.45;
const FIELD_DECAY = 0.88;
const MIGUEL_CHARS = ['M', 'I', 'G', 'U', 'E', 'L'];
const CHARSET =
  " .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const WEIGHTS = [300, 500, 800] as const;
const STYLES = ["normal", "italic"] as const;
const MONO_RAMP = " .`-_:,;^=+/|)\\!?0oOQ#%@";

type FontStyleVariant = (typeof STYLES)[number];

type PaletteEntry = {
  char: string;
  weight: number;
  style: FontStyleVariant;
  width: number;
  brightness: number;
};

type FieldStamp = {
  radiusX: number;
  radiusY: number;
  sizeX: number;
  sizeY: number;
  values: Float32Array;
};

type Particle = { x: number; y: number; vx: number; vy: number };

export default function AsciiCursorField() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const fieldEl = fieldRef.current;
    if (!fieldEl) return;

    let cancelled = false;

    async function init(el: HTMLDivElement) {
      // ── Compute dynamic grid from container width ───────────────────────
      const containerW = el.offsetWidth || window.innerWidth;
      const COLS = Math.max(40, Math.floor(containerW / CHAR_WIDTH));
      const TARGET_ROW_W = COLS * CHAR_WIDTH;
      const FIELD_COLS = COLS * FIELD_OVERSAMPLE;
      const FIELD_ROWS = ROWS * FIELD_OVERSAMPLE;
      const CANVAS_W = TARGET_ROW_W;
      const CANVAS_H = Math.round(CANVAS_W * ((ROWS * LINE_HEIGHT) / TARGET_ROW_W));
      const FIELD_SCALE_X = FIELD_COLS / CANVAS_W;
      const FIELD_SCALE_Y = FIELD_ROWS / CANVAS_H;
      const PARTICLE_N = Math.max(80, Math.round(COLS * PARTICLE_DENSITY * ROWS));

      // ── Dynamic import keeps SSR clean ──────────────────────────────────
      const { prepareWithSegments } = await import("@chenglou/pretext");
      if (cancelled) return;

      // ── Brightness measurement via offscreen canvas ──────────────────────
      const bCanvas = document.createElement("canvas");
      bCanvas.width = 28;
      bCanvas.height = 28;
      const bCtx = bCanvas.getContext("2d", { willReadFrequently: true })!;

      function estimateBrightness(ch: string, font: string): number {
        const s = 28;
        bCtx.clearRect(0, 0, s, s);
        bCtx.font = font;
        bCtx.fillStyle = "#fff";
        bCtx.textBaseline = "middle";
        bCtx.fillText(ch, 1, s / 2);
        const data = bCtx.getImageData(0, 0, s, s).data;
        let sum = 0;
        for (let i = 3; i < data.length; i += 4) sum += data[i]!;
        return sum / (255 * s * s);
      }

      function measureWidth(ch: string, font: string): number {
        const prepared = prepareWithSegments(ch, font);
        return prepared.widths.length > 0 ? prepared.widths[0]! : 0;
      }

      // ── Build palette: every char × weight × style ───────────────────────
      const palette: PaletteEntry[] = [];
      for (const style of STYLES) {
        for (const weight of WEIGHTS) {
          const font = `${style === "italic" ? "italic " : ""}${weight} ${FONT_SIZE}px ${PROP_FAMILY}`;
          for (const ch of CHARSET) {
            if (ch === " ") continue;
            const width = measureWidth(ch, font);
            if (width <= 0) continue;
            const brightness = estimateBrightness(ch, font);
            palette.push({ char: ch, weight, style, width, brightness });
          }
        }
      }

      const maxB = Math.max(...palette.map((e) => e.brightness));
      if (maxB > 0) {
        for (const e of palette) e.brightness /= maxB;
      }
      palette.sort((a, b) => a.brightness - b.brightness);
      if (cancelled) return;

      const targetCellW = TARGET_ROW_W / COLS;

      function esc(ch: string): string {
        if (ch === "<") return "&lt;";
        if (ch === ">") return "&gt;";
        if (ch === "&") return "&amp;";
        if (ch === '"') return "&quot;";
        return ch;
      }

      function wCls(weight: number, style: FontStyleVariant): string {
        const wc = weight === 300 ? "w3" : weight === 500 ? "w5" : "w8";
        return style === "italic" ? `${wc} it` : wc;
      }

      function findBest(targetBrightness: number): PaletteEntry {
        let lo = 0,
          hi = palette.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (palette[mid]!.brightness < targetBrightness) lo = mid + 1;
          else hi = mid;
        }
        let bestScore = Infinity;
        let best = palette[lo]!;
        const start = Math.max(0, lo - 15);
        const end = Math.min(palette.length, lo + 15);
        for (let i = start; i < end; i++) {
          const e = palette[i]!;
          const bErr = Math.abs(e.brightness - targetBrightness) * 2.5;
          const wErr = Math.abs(e.width - targetCellW) / targetCellW;
          const score = bErr + wErr;
          if (score < bestScore) {
            bestScore = score;
            best = e;
          }
        }
        return best;
      }

      // ── Brightness lookup table (0–255 → HTML span) ──────────────────────
      const cellW = (containerW / COLS).toFixed(2);
      const brightnessLookup: { monoChar: string; propHtml: string }[] = [];
      for (let b = 0; b < 256; b++) {
        const brightness = b / 255;
        const monoChar =
          MONO_RAMP[
            Math.min(MONO_RAMP.length - 1, (brightness * MONO_RAMP.length) | 0)
          ]!;
        if (brightness < 0.03) {
          brightnessLookup.push({ monoChar, propHtml: `<span class="ac">&nbsp;</span>` });
          continue;
        }
        const alphaIndex = Math.max(1, Math.min(10, Math.round(brightness * 10)));
        brightnessLookup.push({
          monoChar,
          propHtml: `<span class="w8 a${alphaIndex} ac">MIGUEL_PLACEHOLDER</span>`,
        });
      }

      // ── Brightness field ─────────────────────────────────────────────────
      const brightnessField = new Float32Array(FIELD_COLS * FIELD_ROWS);

      // ── Field stamp helpers ───────────────────────────────────────────────
      function spriteAlphaAt(nd: number): number {
        if (nd >= 1) return 0;
        if (nd <= 0.35) return 0.45 + (0.15 - 0.45) * (nd / 0.35);
        return 0.15 * (1 - (nd - 0.35) / 0.65);
      }

      function createFieldStamp(radiusPx: number): FieldStamp {
        const frX = radiusPx * FIELD_SCALE_X;
        const frY = radiusPx * FIELD_SCALE_Y;
        const rx = Math.ceil(frX);
        const ry = Math.ceil(frY);
        const sx = rx * 2 + 1;
        const sy = ry * 2 + 1;
        const values = new Float32Array(sx * sy);
        for (let y = -ry; y <= ry; y++) {
          for (let x = -rx; x <= rx; x++) {
            const nd = Math.sqrt((x / frX) ** 2 + (y / frY) ** 2);
            values[(y + ry) * sx + x + rx] = spriteAlphaAt(nd);
          }
        }
        return { radiusX: rx, radiusY: ry, sizeX: sx, sizeY: sy, values };
      }

      function splatFieldStamp(
        cx: number,
        cy: number,
        stamp: FieldStamp
      ): void {
        const gcx = Math.round(cx * FIELD_SCALE_X);
        const gcy = Math.round(cy * FIELD_SCALE_Y);
        for (let y = -stamp.radiusY; y <= stamp.radiusY; y++) {
          const gy = gcy + y;
          if (gy < 0 || gy >= FIELD_ROWS) continue;
          const fro = gy * FIELD_COLS;
          const sro = (y + stamp.radiusY) * stamp.sizeX;
          for (let x = -stamp.radiusX; x <= stamp.radiusX; x++) {
            const gx = gcx + x;
            if (gx < 0 || gx >= FIELD_COLS) continue;
            const sv = stamp.values[sro + x + stamp.radiusX]!;
            if (sv === 0) continue;
            const fi = fro + gx;
            brightnessField[fi] = Math.min(1, brightnessField[fi]! + sv);
          }
        }
      }

      // ── Particles ─────────────────────────────────────────────────────────
      const particles: Particle[] = [];
      for (let i = 0; i < PARTICLE_N; i++) {
        particles.push({
          x: Math.random() * CANVAS_W,
          y: Math.random() * CANVAS_H,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
        });
      }

      const particleStamp = createFieldStamp(SPRITE_R);
      const cursorStamp = createFieldStamp(CURSOR_STAMP_R);

      // ── DOM rows ───────────────────────────────────────────────────────────
      // Inject cell width as CSS custom property
      el.style.setProperty('--cell-w', `${cellW}px`);
      const rowNodes: HTMLDivElement[] = [];
      for (let row = 0; row < ROWS; row++) {
        const div = document.createElement("div");
        div.className = "ascii-art-row";
        div.style.height = div.style.lineHeight = `${LINE_HEIGHT}px`;
        el.appendChild(div);
        rowNodes.push(div);
      }

      // ── Mouse state ────────────────────────────────────────────────────────
      let mouseX = CANVAS_W / 2;
      let mouseY = CANVAS_H / 2;
      let inside = false;

      function onMouseMove(e: MouseEvent) {
        const rect = el.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
        mouseY = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
      }
      function onMouseEnter() {
        inside = true;
      }
      function onMouseLeave() {
        inside = false;
      }

      el.addEventListener("mousemove", onMouseMove);
      el.addEventListener("mouseenter", onMouseEnter);
      el.addEventListener("mouseleave", onMouseLeave);

      // ── Render loop ────────────────────────────────────────────────────────
      let rafId = 0;

      function render() {
        // Field decay
        for (let i = 0; i < brightnessField.length; i++) {
          brightnessField[i] = brightnessField[i]! * FIELD_DECAY;
        }

        // Particles: attracted to cursor when inside container
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]!;
          if (inside) {
            const dx = mouseX - p.x;
            const dy = mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            p.vx += (dx / dist) * ATTRACTOR_FORCE;
            p.vy += (dy / dist) * ATTRACTOR_FORCE;
          }
          p.vx += (Math.random() - 0.5) * 0.08;
          p.vy += (Math.random() - 0.5) * 0.08;
          p.vx *= 0.985;
          p.vy *= 0.985;
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -SPRITE_R) p.x += CANVAS_W + SPRITE_R * 2;
          if (p.x > CANVAS_W + SPRITE_R) p.x -= CANVAS_W + SPRITE_R * 2;
          if (p.y < -SPRITE_R) p.y += CANVAS_H + SPRITE_R * 2;
          if (p.y > CANVAS_H + SPRITE_R) p.y -= CANVAS_H + SPRITE_R * 2;
        }

        // Splat particles into field
        for (let i = 0; i < particles.length; i++) {
          splatFieldStamp(particles[i]!.x, particles[i]!.y, particleStamp);
        }
        // Splat cursor stamp (strong halo at mouse position)
        if (inside) {
          splatFieldStamp(mouseX, mouseY, cursorStamp);
        }

        // Render rows
        for (let row = 0; row < ROWS; row++) {
          let html = "";
          const fieldRowStart = row * FIELD_OVERSAMPLE * FIELD_COLS;
          for (let col = 0; col < COLS; col++) {
            const fieldColStart = col * FIELD_OVERSAMPLE;
            let brightness = 0;
            for (let sy = 0; sy < FIELD_OVERSAMPLE; sy++) {
              const sro = fieldRowStart + sy * FIELD_COLS + fieldColStart;
              for (let sx = 0; sx < FIELD_OVERSAMPLE; sx++) {
                brightness += brightnessField[sro + sx]!;
              }
            }
            const bb = Math.min(
              255,
              ((brightness / (FIELD_OVERSAMPLE * FIELD_OVERSAMPLE)) * 255) | 0
            );
            const lookup = brightnessLookup[bb]!.propHtml;
            const miguelChar = MIGUEL_CHARS[(row * COLS + col) % MIGUEL_CHARS.length]!;
            html += lookup.replace('MIGUEL_PLACEHOLDER', miguelChar);
          }
          rowNodes[row]!.innerHTML = html;
        }

        rafId = requestAnimationFrame(render);
      }

      rafId = requestAnimationFrame(render);

      // Store cleanup
      cleanupRef.current = () => {
        cancelAnimationFrame(rafId);
        el.removeEventListener("mousemove", onMouseMove);
        el.removeEventListener("mouseenter", onMouseEnter);
        el.removeEventListener("mouseleave", onMouseLeave);
        el.innerHTML = "";
      };
    }

    init(fieldEl);

    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
  }, []);

  return (
    <section className="ascii-section">
      <div className="ascii-section-header">
        <span className="ascii-section-label">PRETEXT × CURSOR FIELD</span>
        <span className="ascii-section-hint">Move your cursor</span>
      </div>
      <div ref={fieldRef} className="ascii-cursor-field" />
    </section>
  );
}
