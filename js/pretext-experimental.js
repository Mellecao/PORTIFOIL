const PRETEXT_ESM_URL = 'https://esm.sh/@chenglou/pretext@0.0.3';

function sameCursor(a, b) {
  return a.segmentIndex === b.segmentIndex && a.graphemeIndex === b.graphemeIndex;
}

function parseLength(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function computeFontShorthand(el) {
  const cs = window.getComputedStyle(el);
  if (cs.font && cs.font !== 'normal normal normal normal 16px / normal serif') {
    return cs.font;
  }

  const style = cs.fontStyle || 'normal';
  const variant = cs.fontVariant || 'normal';
  const weight = cs.fontWeight || '400';
  const size = cs.fontSize || '16px';
  const family = cs.fontFamily || 'serif';
  return `${style} ${variant} ${weight} ${size} ${family}`;
}

function computeLineHeight(el) {
  const cs = window.getComputedStyle(el);
  const lineHeight = parseLength(cs.lineHeight, Number.NaN);
  if (!Number.isNaN(lineHeight)) return lineHeight;
  return parseLength(cs.fontSize, 16) * 1.35;
}

class ForceFieldBlock {
  constructor(el, pretext) {
    this.el = el;
    this.pretext = pretext;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.prepared = null;
    this.active = false;
    this.rafId = 0;
    this.dpr = window.devicePixelRatio || 1;

    this.metrics = {
      width: 0,
      height: 0,
      padLeft: 0,
      padRight: 0,
      padTop: 0,
      padBottom: 0,
      lineHeight: 24,
      color: '#111',
      font: '16px serif',
    };

    const radius = parseLength(el.getAttribute('data-force-radius'), 84);
    this.bubble = {
      radius,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    };

    this.text = (el.textContent || '').replace(/\s+/g, ' ').trim();

    this.onPointerEnter = this.onPointerEnter.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.animate = this.animate.bind(this);

    this.canvas.setAttribute('aria-hidden', 'true');
    this.el.appendChild(this.canvas);

    this.readMetrics();
    this.rebuildPrepared();

    this.el.addEventListener('pointerenter', this.onPointerEnter);
    this.el.addEventListener('pointermove', this.onPointerMove);
    this.el.addEventListener('pointerleave', this.onPointerLeave);
  }

  readMetrics() {
    const rect = this.el.getBoundingClientRect();
    const cs = window.getComputedStyle(this.el);
    this.dpr = window.devicePixelRatio || 1;

    this.metrics.width = rect.width;
    this.metrics.height = rect.height;
    this.metrics.padLeft = parseLength(cs.paddingLeft);
    this.metrics.padRight = parseLength(cs.paddingRight);
    this.metrics.padTop = parseLength(cs.paddingTop);
    this.metrics.padBottom = parseLength(cs.paddingBottom);
    this.metrics.lineHeight = computeLineHeight(this.el);
    this.metrics.color = cs.color || '#111';
    this.metrics.font = computeFontShorthand(this.el);

    this.canvas.width = Math.max(1, Math.round(rect.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * this.dpr));
    this.canvas.style.width = `${Math.max(1, rect.width)}px`;
    this.canvas.style.height = `${Math.max(1, rect.height)}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  rebuildPrepared() {
    if (!this.text) {
      this.prepared = null;
      return;
    }
    this.prepared = this.pretext.prepareWithSegments(this.text, this.metrics.font);
  }

  onPointerEnter(event) {
    this.active = true;
    this.el.classList.add('active');
    this.readMetrics();
    this.rebuildPrepared();

    const rect = this.el.getBoundingClientRect();
    this.bubble.x = rect.width * 0.5;
    this.bubble.y = rect.height * 0.5;
    this.onPointerMove(event);

    if (!this.rafId) {
      this.rafId = window.requestAnimationFrame(this.animate);
    }
  }

  onPointerMove(event) {
    if (!this.active) return;
    const rect = this.el.getBoundingClientRect();
    this.bubble.targetX = event.clientX - rect.left;
    this.bubble.targetY = event.clientY - rect.top;
  }

  onPointerLeave() {
    this.active = false;
    this.el.classList.remove('active');
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.clear();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.metrics.width, this.metrics.height);
  }

  drawBubble() {
    const ctx = this.ctx;
    const r = this.bubble.radius;

    const glow = ctx.createRadialGradient(this.bubble.x, this.bubble.y, r * 0.2, this.bubble.x, this.bubble.y, r);
    glow.addColorStop(0, 'rgba(255, 77, 41, 0.28)');
    glow.addColorStop(0.72, 'rgba(255, 77, 41, 0.09)');
    glow.addColorStop(1, 'rgba(255, 77, 41, 0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.bubble.x, this.bubble.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  renderText() {
    if (!this.prepared) return;

    const ctx = this.ctx;
    const {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      lineHeight,
      color,
      font,
    } = this.metrics;

    const contentLeft = padLeft;
    const contentTop = padTop;
    const contentWidth = Math.max(1, width - padLeft - padRight);
    const contentHeight = Math.max(1, height - padTop - padBottom);

    ctx.clearRect(0, 0, width, height);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';

    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = contentTop;
    let guard = 0;

    while (guard < 1400) {
      guard += 1;
      const lineStartCursor = {
        segmentIndex: cursor.segmentIndex,
        graphemeIndex: cursor.graphemeIndex,
      };

      const rowCenterY = y + lineHeight * 0.5;
      const dy = Math.abs(rowCenterY - this.bubble.y);

      if (dy >= this.bubble.radius) {
        const line = this.pretext.layoutNextLine(this.prepared, cursor, contentWidth);
        if (line === null) break;

        if (line.text) {
          ctx.fillText(line.text, contentLeft, y);
        }

        cursor = line.end;
        if (sameCursor(cursor, lineStartCursor)) break;
        y += lineHeight;
        if (y > contentTop + contentHeight + lineHeight) break;
        continue;
      }

      const halfChord = Math.sqrt(Math.max(0, this.bubble.radius * this.bubble.radius - dy * dy));
      const leftCut = this.bubble.x - halfChord;
      const rightCut = this.bubble.x + halfChord;
      const gutter = 8;

      const leftWidth = Math.max(26, Math.min(contentWidth, leftCut - contentLeft - gutter));
      const rightStart = Math.max(contentLeft, Math.min(contentLeft + contentWidth, rightCut + gutter));
      const rightWidth = Math.max(0, contentLeft + contentWidth - rightStart);

      const leftLine = this.pretext.layoutNextLine(this.prepared, cursor, leftWidth);
      if (leftLine === null) break;
      if (leftLine.text) {
        ctx.fillText(leftLine.text, contentLeft, y);
      }

      cursor = leftLine.end;
      if (!sameCursor(cursor, lineStartCursor) && rightWidth > 24) {
        const rightStartCursor = {
          segmentIndex: cursor.segmentIndex,
          graphemeIndex: cursor.graphemeIndex,
        };
        const rightLine = this.pretext.layoutNextLine(this.prepared, cursor, rightWidth);
        if (rightLine !== null && !sameCursor(rightLine.end, rightStartCursor)) {
          if (rightLine.text) {
            ctx.fillText(rightLine.text, rightStart, y);
          }
          cursor = rightLine.end;
        }
      }

      if (sameCursor(cursor, lineStartCursor)) break;
      y += lineHeight;
      if (y > contentTop + contentHeight + lineHeight) break;
    }

    this.drawBubble();
  }

  animate() {
    if (!this.active) return;

    this.bubble.x += (this.bubble.targetX - this.bubble.x) * 0.22;
    this.bubble.y += (this.bubble.targetY - this.bubble.y) * 0.22;

    this.renderText();
    this.rafId = window.requestAnimationFrame(this.animate);
  }

  refreshLayout() {
    this.readMetrics();
    this.rebuildPrepared();
    if (this.active) {
      this.renderText();
    }
  }
}

async function initPretextExperimentalPage() {
  const blocks = Array.from(document.querySelectorAll('.force-text'));
  if (!blocks.length) return;

  let pretext;
  try {
    pretext = await import(PRETEXT_ESM_URL);
  } catch (error) {
    console.error('Nao foi possivel carregar o Pretext no experimento.', error);
    return;
  }

  await document.fonts.ready;

  const instances = blocks
    .map((el) => new ForceFieldBlock(el, pretext))
    .filter(Boolean);

  if (!instances.length) return;

  window.addEventListener('resize', () => {
    for (const instance of instances) {
      instance.refreshLayout();
    }
  });
}

initPretextExperimentalPage();
