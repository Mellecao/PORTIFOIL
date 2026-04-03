"use client";

import { useEffect, useRef } from "react";
import type { PreparedTextWithSegments, LayoutCursor } from "@chenglou/pretext";

// ─── Types ───────────────────────────────────────────────────────────────────

type PretextMod = {
  prepareWithSegments: (
    text: string,
    font: string,
    options?: { whiteSpace?: "normal" | "pre-wrap" }
  ) => PreparedTextWithSegments;
  layoutNextLine: (
    prepared: PreparedTextWithSegments,
    start: LayoutCursor,
    maxWidth: number
  ) => { text: string; width: number; start: LayoutCursor; end: LayoutCursor } | null;
  walkLineRanges: (
    prepared: PreparedTextWithSegments,
    maxWidth: number,
    onLine: (line: { width: number; start: LayoutCursor; end: LayoutCursor }) => void
  ) => number;
};

type Circle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  targetX: number;
  targetY: number;
  label: string;
  color: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const BODY_TEXT = `Pretext is a pure JavaScript library for multiline text measurement and layout. It side-steps DOM reflow entirely — no getBoundingClientRect, no offsetHeight, no layout thrashing. Instead it implements its own line-breaking logic, using the browser's own font engine as ground truth.

Layout happens in two stages. First, prepare() does the heavy work: it normalises whitespace, segments the text into grapheme clusters, applies per-language glue rules, and measures each segment with a hidden canvas. The result is an opaque handle you keep around. Then layout() and layoutNextLine() are pure arithmetic over those cached widths — no DOM, no reflow, no surprise.

The real unlock is layoutNextLine(): an iterator that lets you route each line through a different available width. That single function is what powers this page. Every time you move the mouse, the circles announce their geometry, and the paragraph reflows live around them — real text, real wrapping, zero DOM mutations.

Accurate across the full spectrum of human writing: Arabic, Hebrew, Japanese, Korean, Hindi, Thai, Khmer, Myanmar, Chinese, and mixed bidirectional content with emoji. The line-breaking rules for each script — from Arabic kashida to CJK line-break opportunities — are handled correctly so every reflow is trustworthy, not approximate.

This is the missing primitive for proper web layout: virtualization without guesstimates, masonry without hacks, scroll-position anchoring without jank, AI-generated UIs you can actually verify at build time.`;

const FONT = '17px/1 "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';
const FONT_FAMILY = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';
const FONT_SIZE = 17;
const LINE_HEIGHT = 28;
const PAGE_PADDING = 56;
const GUTTER = 14;

const CIRCLES_INIT: Omit<Circle, "targetX" | "targetY">[] = [
  { x: 0, y: 0, vx: 0.4, vy: 0.3, r: 80, label: "prepare()", color: "rgba(229,12,61,1)" },
  { x: 0, y: 0, vx: -0.5, vy: 0.4, r: 60, label: "layout()", color: "rgba(229,12,61,0.75)" },
  { x: 0, y: 0, vx: 0.3, vy: -0.5, r: 50, label: "layoutNextLine()", color: "rgba(229,12,61,0.9)" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sameCursor(a: LayoutCursor, b: LayoutCursor) {
  return a.segmentIndex === b.segmentIndex && a.graphemeIndex === b.graphemeIndex;
}

function circleIntervalAtY(cx: number, cy: number, r: number, lineY: number, lh: number): [number, number] | null {
  // The line band spans [lineY, lineY + lh]. Check if circle overlaps it.
  const topDist = lineY - cy;
  const botDist = lineY + lh - cy;
  // Pick the y inside the band closest to cy
  const clampedDy = topDist > 0 ? topDist : botDist < 0 ? botDist : 0;
  if (Math.abs(clampedDy) >= r) return null;
  const halfChord = Math.sqrt(Math.max(0, r * r - clampedDy * clampedDy));
  return [cx - halfChord - GUTTER, cx + halfChord + GUTTER];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExperimentalPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    circles: Circle[];
    prepared: PreparedTextWithSegments | null;
    mod: PretextMod | null;
    mouse: { x: number; y: number; active: boolean };
    rafId: number;
    width: number;
    height: number;
    dpr: number;
  }>({
    circles: CIRCLES_INIT.map((c) => ({ ...c, targetX: 0, targetY: 0 })),
    prepared: null,
    mod: null,
    mouse: { x: -9999, y: -9999, active: false },
    rafId: 0,
    width: 0,
    height: 0,
    dpr: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const st = stateRef.current;

    // ── Resize handler ──────────────────────────────────────────────────────
    function resize() {
      st.dpr = window.devicePixelRatio || 1;
      st.width = window.innerWidth;
      st.height = window.innerHeight;
      canvas!.width = Math.round(st.width * st.dpr);
      canvas!.height = Math.round(st.height * st.dpr);
      canvas!.style.width = `${st.width}px`;
      canvas!.style.height = `${st.height}px`;
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);

      // Spread circles across canvas on init
      const seed = st.circles;
      seed[0].x = st.width * 0.15; seed[0].y = st.height * 0.25;
      seed[1].x = st.width * 0.75; seed[1].y = st.height * 0.50;
      seed[2].x = st.width * 0.50; seed[2].y = st.height * 0.75;
      seed.forEach(c => { c.targetX = c.x; c.targetY = c.y; });
    }

    // ── Load Pretext ────────────────────────────────────────────────────────
    async function boot() {
      const mod = await import("@chenglou/pretext") as unknown as PretextMod;
      st.mod = mod;
      st.prepared = mod.prepareWithSegments(
        BODY_TEXT,
        `${FONT_SIZE}px ${FONT_FAMILY}`
      );
    }

    // ── Per-frame draw ──────────────────────────────────────────────────────
    function draw() {
      const { width, height, circles, prepared, mod, mouse } = st;
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, width, height);

      // Move circles (bounce off walls, glide to mouse)
      for (const c of circles) {
        if (mouse.active) {
          c.targetX += (mouse.x - c.targetX) * 0.02 * (c.r / 80);
          c.targetY += (mouse.y - c.targetY) * 0.02 * (c.r / 80);
          c.x += (c.targetX - c.x) * 0.06;
          c.y += (c.targetY - c.y) * 0.06;
        } else {
          c.x += c.vx;
          c.y += c.vy;
          if (c.x - c.r < 0 || c.x + c.r > width) c.vx *= -1;
          if (c.y - c.r < 0 || c.y + c.r > height) c.vy *= -1;
          c.x = Math.max(c.r, Math.min(width - c.r, c.x));
          c.y = Math.max(c.r, Math.min(height - c.r, c.y));
        }
      }

      // Draw circles (glow + label)
      for (const c of circles) {
        // Outer glow
        const glow = ctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r * 1.4);
        glow.addColorStop(0, c.color.replace(/[\d.]+\)$/, "0.35)"));
        glow.addColorStop(1, c.color.replace(/[\d.]+\)$/, "0)"));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Core disc
        const core = ctx.createRadialGradient(c.x - c.r * 0.25, c.y - c.r * 0.25, 2, c.x, c.y, c.r);
        core.addColorStop(0, c.color.replace(/[\d.]+\)$/, "0.55)"));
        core.addColorStop(1, c.color.replace(/[\d.]+\)$/, "0.18)"));
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = c.color.replace(/[\d.]+\)$/, "0.45)");
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.font = `500 12px ${FONT_FAMILY}`;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.label, c.x, c.y);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
      }

      // ── Text layout via Pretext ─────────────────────────────────────────
      if (!prepared || !mod) {
        // Fallback: plain text while loading
        ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillText("Loading Pretext…", PAGE_PADDING, PAGE_PADDING);
        return;
      }

      const contentLeft = PAGE_PADDING;
      const contentWidth = Math.max(80, width - PAGE_PADDING * 2);

      ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.textBaseline = "top";

      let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
      let y = PAGE_PADDING;
      const maxY = height + LINE_HEIGHT;
      let guard = 0;

      while (guard++ < 8000) {
        const rowStart = { ...cursor };
        const lineY = y;

        // Collect circle intervals for this row band
        const obstacles: [number, number][] = [];
        for (const c of circles) {
          const iv = circleIntervalAtY(c.x, c.y, c.r, lineY, LINE_HEIGHT);
          if (iv) obstacles.push(iv);
        }

        if (obstacles.length === 0) {
          // No obstacle — full-width line
          const line = mod.layoutNextLine(prepared, cursor, contentWidth);
          if (!line) break;
          if (line.text) ctx.fillText(line.text, contentLeft, y);
          cursor = line.end;
        } else {
          // Merge and sort obstacles into exclusion zones
          obstacles.sort((a, b) => a[0] - b[0]);
          // Build free slots
          const slots: Array<{ x: number; w: number }> = [];
          let left = contentLeft;
          for (const [lo, hi] of obstacles) {
            const slotW = Math.min(lo, contentLeft + contentWidth) - left;
            if (slotW >= 20) slots.push({ x: left, w: slotW });
            left = Math.max(left, hi);
          }
          const lastW = contentLeft + contentWidth - left;
          if (lastW >= 20) slots.push({ x: left, w: lastW });

          if (slots.length === 0) {
            // Fully blocked row — advance without consuming text
            y += LINE_HEIGHT;
            if (y > maxY) break;
            continue;
          }

          // Flow text through the slots sequentially
          let advanced = false;
          for (const slot of slots) {
            const slotStart = { ...cursor };
            const line = mod.layoutNextLine(prepared, cursor, slot.w);
            if (!line) { advanced = true; break; }
            if (!sameCursor(line.end, slotStart)) {
              if (line.text) ctx.fillText(line.text, slot.x, y);
              cursor = line.end;
              advanced = true;
            }
          }

          if (!advanced) {
            // Safety: advance cursor past any stall
            const fallback = mod.layoutNextLine(prepared, cursor, 1);
            if (!fallback || sameCursor(fallback.end, cursor)) break;
            cursor = fallback.end;
          }
        }

        if (sameCursor(cursor, rowStart) && obstacles.length === 0) break;
        y += LINE_HEIGHT;
        if (y > maxY) break;
      }

      // ── HUD ──────────────────────────────────────────────────────────────
      ctx.font = `500 11px ${FONT_FAMILY}`;
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.textBaseline = "bottom";
      ctx.fillText("Pretext · layoutNextLine() demo — move mouse to guide the circles", PAGE_PADDING, height - 24);
      ctx.textBaseline = "top";
    }

    // ── Render loop ─────────────────────────────────────────────────────────
    function loop() {
      draw();
      st.rafId = requestAnimationFrame(loop);
    }

    // ── Mouse ────────────────────────────────────────────────────────────────
    function onMouseMove(e: MouseEvent) {
      st.mouse.x = e.clientX;
      st.mouse.y = e.clientY;
      st.mouse.active = true;
    }
    function onMouseLeave() {
      st.mouse.active = false;
    }

    // ── Init ─────────────────────────────────────────────────────────────────
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    boot().then(() => {
      // prepared is now set; the loop will pick it up automatically
    });

    loop();

    return () => {
      cancelAnimationFrame(st.rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        background: "#080808",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </main>
  );
}
