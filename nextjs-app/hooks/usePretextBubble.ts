"use client";

import { useEffect, useRef } from "react";
import type { PreparedTextWithSegments, LayoutCursor } from "@chenglou/pretext";

// Type-safe dynamic import wrapper
type PretextModule = {
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
};

let cachedModule: PretextModule | null = null;
let loadPromise: Promise<PretextModule | null> | null = null;

async function loadPretext(): Promise<PretextModule | null> {
  if (cachedModule) return cachedModule;
  if (!loadPromise) {
    loadPromise = import("@chenglou/pretext")
      .then((mod) => {
        cachedModule = mod as unknown as PretextModule;
        return cachedModule;
      })
      .catch((err) => {
        console.warn("[Pretext] Failed to load:", err);
        loadPromise = null;
        return null;
      });
  }
  return loadPromise;
}

function sameCursor(a: LayoutCursor, b: LayoutCursor) {
  return a.segmentIndex === b.segmentIndex && a.graphemeIndex === b.graphemeIndex;
}

function readFont(el: HTMLElement): string {
  const cs = window.getComputedStyle(el);
  if (cs.font && cs.font.trim()) return cs.font;
  return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

function readLineHeight(el: HTMLElement): number {
  const cs = window.getComputedStyle(el);
  const lh = parseFloat(cs.lineHeight);
  if (Number.isFinite(lh)) return lh;
  return parseFloat(cs.fontSize) * 1.4;
}

export type BubbleOptions = {
  size?: number;
  color?: string;
  gutter?: number;
};

/**
 * Attach the Pretext "force field / bubble" reflow effect to an element ref.
 * On mouse hover, a glowing bubble follows the cursor and text reflows around it
 * using Pretext's layoutNextLine so NO DOM nodes are mutated.
 */
export function usePretextBubble<T extends HTMLElement>(
  options: BubbleOptions = {}
) {
  const ref = useRef<T | null>(null);
  const { size = 50, color = "rgba(255,255,255,0.06)", gutter = 8 } = options;
  const half = size / 2;

  useEffect(() => {
    const el = ref.current;
    if (el === null || typeof window === "undefined") return;
    const safeEl: HTMLElement = el;

    // --- Canvas overlay ---
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;inset:0;pointer-events:none;z-index:2;";
    safeEl.style.position = "relative";
    safeEl.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    let prepared: PreparedTextWithSegments | null = null;
    let mod: PretextModule | null = null;
    let active = false;
    let rafId = 0;
    const bubble = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // Metrics
    let contentLeft = 0,
      contentTop = 0,
      contentWidth = 0;
    let savedTextColor = "";

    function syncMetrics() {
      const rect = safeEl.getBoundingClientRect();
      const cs = window.getComputedStyle(safeEl);
      const pl = parseFloat(cs.paddingLeft) || 0;
      const pr = parseFloat(cs.paddingRight) || 0;
      const pt = parseFloat(cs.paddingTop) || 0;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      contentLeft = pl;
      contentTop = pt;
      contentWidth = Math.max(8, rect.width - pl - pr);
    }

    function rebuildPrepared() {
      if (!mod) return;
      const text = (safeEl.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!text) { prepared = null; return; }
      prepared = mod.prepareWithSegments(text, readFont(safeEl));
    }

    function drawBubbleSquare(x: number, y: number) {
      ctx.fillStyle = color;
      ctx.fillRect(x - half, y - half, size, size);
    }

    function drawLayout() {
      if (!active || !prepared || !mod) return;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const lh = readLineHeight(safeEl);
      ctx.font = readFont(safeEl);
      ctx.fillStyle = savedTextColor || "#fff";
      ctx.textBaseline = "top";

      let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
      let y = contentTop;
      const maxY = contentTop + canvas.height / dpr + lh;
      let guard = 0;

      // Square bubble bounds
      const bTop = bubble.y - half;
      const bBottom = bubble.y + half;
      const bLeft = bubble.x - half;
      const bRight = bubble.x + half;

      while (guard++ < 2000) {
        const rowStart = { ...cursor };
        const rowBottom = y + lh;

        // Check if this row overlaps the square vertically
        const overlaps = rowBottom > bTop && y < bBottom;

        if (!overlaps) {
          // Normal line — full width
          const line = mod.layoutNextLine(prepared, cursor, contentWidth);
          if (!line) break;
          if (line.text) ctx.fillText(line.text, contentLeft, y);
          cursor = line.end;
        } else {
          // Square intersects this row — split into left + right columns
          const leftW = Math.max(0, bLeft - contentLeft - gutter);
          const rightX = Math.min(
            contentLeft + contentWidth,
            bRight + gutter
          );
          const rightW = Math.max(0, contentLeft + contentWidth - rightX);

          if (leftW >= 20) {
            const left = mod.layoutNextLine(prepared, cursor, leftW);
            if (!left) break;
            if (left.text) ctx.fillText(left.text, contentLeft, y);
            cursor = left.end;
          }

          if (rightW >= 20 && !sameCursor(cursor, rowStart)) {
            const rightStart = { ...cursor };
            const right = mod.layoutNextLine(prepared, cursor, rightW);
            if (right && !sameCursor(right.end, rightStart)) {
              if (right.text) ctx.fillText(right.text, rightX, y);
              cursor = right.end;
            }
          }
        }

        if (sameCursor(cursor, rowStart)) break;
        y += lh;
        if (y > maxY) break;
      }

      drawBubbleSquare(bubble.x, bubble.y);
    }

    function animate() {
      if (!active) return;
      bubble.x += (bubble.targetX - bubble.x) * 0.18;
      bubble.y += (bubble.targetY - bubble.y) * 0.18;
      drawLayout();
      rafId = requestAnimationFrame(animate);
    }

    function onMove(e: MouseEvent) {
      const rect = safeEl.getBoundingClientRect();
      bubble.targetX = e.clientX - rect.left;
      bubble.targetY = e.clientY - rect.top;
    }

    async function onEnter(e: MouseEvent) {
      if (!mod) {
        mod = await loadPretext();
        if (!mod) return;
      }
      syncMetrics();
      rebuildPrepared();
      if (!prepared) return;

      // Capture text color BEFORE hiding — .pretext-active sets color:transparent
      savedTextColor = window.getComputedStyle(safeEl).color;
      active = true;
      safeEl.classList.add("pretext-active");
      const rect = safeEl.getBoundingClientRect();
      bubble.x = e.clientX - rect.left;
      bubble.y = e.clientY - rect.top;
      bubble.targetX = bubble.x;
      bubble.targetY = bubble.y;
      rafId = requestAnimationFrame(animate);
    }

    function onLeave() {
      active = false;
      safeEl.classList.remove("pretext-active");
      cancelAnimationFrame(rafId);
      rafId = 0;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }

    safeEl.addEventListener("mouseenter", onEnter);
    safeEl.addEventListener("mousemove", onMove);
    safeEl.addEventListener("mouseleave", onLeave);

    // Prefetch the module eagerly
    loadPretext().then((m) => {
      mod = m;
      if (m) rebuildPrepared();
    });

    return () => {
      safeEl.removeEventListener("mouseenter", onEnter);
      safeEl.removeEventListener("mousemove", onMove);
      safeEl.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
      canvas.remove();
      safeEl.style.position = "";
    };
  }, [size, color, gutter, half]);

  return ref;
}
