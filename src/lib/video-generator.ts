// ── Types ──────────────────────────────────────────────────────────────────
type VideoConfig = {
  prompt: string;
  videoType: "product-promo" | "motion-graphics";
  aspectRatio: string;
  duration: 5 | 10;
  onProgress?: (progress: number) => void;
};

const ASPECT_DIMS: Record<string, [number, number]> = {
  "16:9": [1280, 720],
  "9:16": [720, 1280],
  "1:1": [720, 720],
  "4:3": [960, 720],
};

// ── Easing ─────────────────────────────────────────────────────────────────
function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t: number): number { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
}
function easeOutBack(t: number): number {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }

// ── Color ──────────────────────────────────────────────────────────────────
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function rgb(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return `rgb(${r},${g},${b})`;
}

function rgba(h: number, s: number, l: number, a: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Palettes (12 cinematic themes) ─────────────────────────────────────────
type Palette = {
  bg1: [number, number, number]; bg2: [number, number, number];
  accent: [number, number, number]; accent2: [number, number, number];
  text: [number, number, number];
};

const PALETTES: Palette[] = [
  // Deep space purple + cyan
  { bg1: [260, 40, 8], bg2: [280, 50, 14], accent: [180, 90, 55], accent2: [260, 80, 65], text: [0, 0, 97] },
  // Midnight blue + neon cyan
  { bg1: [220, 60, 8], bg2: [230, 50, 15], accent: [175, 95, 50], accent2: [200, 85, 60], text: [0, 0, 97] },
  // Black + gold luxury
  { bg1: [40, 10, 6], bg2: [35, 15, 10], accent: [42, 90, 55], accent2: [30, 85, 45], text: [45, 20, 95] },
  // Dark cherry + hot pink
  { bg1: [340, 40, 8], bg2: [350, 50, 14], accent: [330, 90, 60], accent2: [350, 85, 65], text: [0, 0, 97] },
  // Forest dark + emerald glow
  { bg1: [150, 40, 6], bg2: [160, 50, 12], accent: [145, 80, 50], accent2: [120, 70, 55], text: [0, 0, 97] },
  // Charcoal + electric blue
  { bg1: [220, 15, 8], bg2: [225, 20, 14], accent: [210, 95, 55], accent2: [230, 80, 65], text: [0, 0, 97] },
  // Deep wine + rose gold
  { bg1: [350, 50, 8], bg2: [340, 40, 14], accent: [15, 60, 65], accent2: [350, 70, 55], text: [0, 0, 97] },
  // Obsidian + flame orange
  { bg1: [20, 20, 6], bg2: [15, 25, 10], accent: [25, 95, 55], accent2: [10, 90, 50], text: [0, 0, 97] },
  // Cosmic indigo + violet
  { bg1: [250, 50, 8], bg2: [265, 55, 14], accent: [270, 80, 65], accent2: [290, 75, 60], text: [0, 0, 97] },
  // Arctic dark + ice blue
  { bg1: [200, 30, 6], bg2: [210, 35, 12], accent: [195, 70, 60], accent2: [185, 60, 50], text: [195, 10, 97] },
  // Noir + magenta
  { bg1: [300, 10, 5], bg2: [310, 15, 10], accent: [310, 90, 55], accent2: [330, 80, 60], text: [0, 0, 97] },
  // Dark teal + coral
  { bg1: [180, 40, 6], bg2: [185, 45, 12], accent: [5, 80, 60], accent2: [170, 70, 45], text: [0, 0, 97] },
];

// ── Utilities ──────────────────────────────────────────────────────────────
function extractKeywords(prompt: string): string[] {
  const stopWords = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","can","shall","it","its","this","that","these","those","i","you","he","she","we","they","my","your","his","her","our","their","from","into","through","during","before","after","above","below","between","about","against","not","no","nor","so","very","just","then","than","too","also","only","make","create","show","video","featuring","scene","cinematic","dramatic","visual","stunning"]);
  return prompt
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
    .slice(0, 12);
}

function hashPrompt(prompt: string): number {
  return Math.abs(prompt.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
}

// ── Bokeh / Light Orbs ─────────────────────────────────────────────────────
type Orb = { x: number; y: number; vx: number; vy: number; radius: number; hueOff: number; alpha: number; phase: number };

function createOrbs(w: number, h: number, count: number): Orb[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.4,
    radius: Math.random() * 60 + 20,
    hueOff: Math.random() * 40 - 20,
    alpha: Math.random() * 0.15 + 0.05,
    phase: Math.random() * Math.PI * 2,
  }));
}

function drawOrbs(ctx: CanvasRenderingContext2D, orbs: Orb[], w: number, h: number, palette: Palette, t: number) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const o of orbs) {
    o.x += o.vx;
    o.y += o.vy;
    if (o.x < -o.radius) o.x = w + o.radius;
    if (o.x > w + o.radius) o.x = -o.radius;
    if (o.y < -o.radius) o.y = h + o.radius;
    if (o.y > h + o.radius) o.y = -o.radius;

    const pulse = Math.sin(t * 1.5 + o.phase) * 0.3 + 0.7;
    const r = o.radius * pulse;
    const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
    grad.addColorStop(0, rgba(palette.accent[0] + o.hueOff, palette.accent[1], palette.accent[2], o.alpha * pulse));
    grad.addColorStop(0.5, rgba(palette.accent[0] + o.hueOff, palette.accent[1], palette.accent[2], o.alpha * pulse * 0.4));
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(o.x - r, o.y - r, r * 2, r * 2);
  }
  ctx.restore();
}

// ── Film Grain ─────────────────────────────────────────────────────────────
function drawFilmGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity = 0.03) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const amount = intensity * 255;
  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const noise = (Math.random() - 0.5) * amount;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
}

// ── Light Streak / Flare ───────────────────────────────────────────────────
function drawLightStreak(ctx: CanvasRenderingContext2D, w: number, h: number, palette: Palette, t: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const streakY = h * 0.3 + Math.sin(t * 0.8) * h * 0.15;
  const streakX = (t * 120) % (w * 1.5) - w * 0.25;
  const grad = ctx.createLinearGradient(streakX - w * 0.4, streakY, streakX + w * 0.4, streakY);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.3, rgba(palette.accent[0], 60, 80, 0.06));
  grad.addColorStop(0.5, rgba(palette.accent[0], 50, 90, 0.12));
  grad.addColorStop(0.7, rgba(palette.accent[0], 60, 80, 0.06));
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(streakX - w * 0.4, streakY - 30, w * 0.8, 60);
  ctx.restore();
}

// ── Spotlight ──────────────────────────────────────────────────────────────
function drawSpotlight(ctx: CanvasRenderingContext2D, w: number, h: number, palette: Palette, t: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const cx = w * 0.5 + Math.sin(t * 0.4) * w * 0.25;
  const cy = h * 0.4 + Math.cos(t * 0.3) * h * 0.15;
  const radius = Math.min(w, h) * 0.5;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, rgba(palette.accent2[0], palette.accent2[1], palette.accent2[2], 0.08));
  grad.addColorStop(0.5, rgba(palette.accent[0], palette.accent[1], palette.accent[2], 0.03));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// ── Background ─────────────────────────────────────────────────────────────
function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, palette: Palette, t: number, zoom: number) {
  ctx.save();
  // Zoom drift
  const scale = 1 + zoom * 0.05;
  ctx.translate(w / 2, h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);

  const shift = Math.sin(t * 0.3) * 15;
  const grad = ctx.createRadialGradient(
    w * 0.3 + Math.sin(t * 0.2) * w * 0.1, h * 0.3 + Math.cos(t * 0.15) * h * 0.1, 0,
    w * 0.5, h * 0.5, Math.max(w, h)
  );
  grad.addColorStop(0, rgb(palette.bg2[0] + shift, palette.bg2[1], palette.bg2[2] + 4));
  grad.addColorStop(0.5, rgb(palette.bg1[0], palette.bg1[1], palette.bg1[2] + 2));
  grad.addColorStop(1, rgb(palette.bg1[0] - 5, palette.bg1[1], Math.max(palette.bg1[2] - 2, 2)));
  ctx.fillStyle = grad;
  ctx.fillRect(-50, -50, w + 100, h + 100);

  // Vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(-50, -50, w + 100, h + 100);
  ctx.restore();
}

// ── Perspective Grid (motion graphics) ─────────────────────────────────────
function drawPerspectiveGrid(ctx: CanvasRenderingContext2D, w: number, h: number, palette: Palette, t: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.15;
  ctx.strokeStyle = rgba(palette.accent[0], palette.accent[1], palette.accent[2], 0.4);
  ctx.lineWidth = 1;

  const vanishY = h * 0.35;
  const vanishX = w * 0.5;
  const gridOffset = (t * 40) % 80;

  // Horizontal lines receding
  for (let i = 0; i < 15; i++) {
    const yFrac = (i * 80 + gridOffset) / (h * 1.5);
    const y = vanishY + (h - vanishY) * easeInOutCubic(Math.min(yFrac, 1));
    const spread = (y - vanishY) / (h - vanishY);
    const x1 = vanishX - w * 0.8 * spread;
    const x2 = vanishX + w * 0.8 * spread;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }

  // Vertical lines converging
  for (let i = -6; i <= 6; i++) {
    const bottomX = vanishX + i * 100;
    ctx.beginPath();
    ctx.moveTo(vanishX, vanishY);
    ctx.lineTo(bottomX, h + 50);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Glassmorphism Panel ────────────────────────────────────────────────────
function drawGlassPanel(ctx: CanvasRenderingContext2D, x: number, y: number, pw: number, ph: number, radius: number, palette: Palette, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.roundRect(x, y, pw, ph, radius);

  // Fill with translucent bg
  ctx.fillStyle = rgba(palette.bg2[0], palette.bg2[1], palette.bg2[2] + 8, 0.5);
  ctx.fill();

  // Border glow
  ctx.strokeStyle = rgba(palette.accent[0], palette.accent[1], palette.accent[2], 0.25);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// ── Text Rendering Helpers ─────────────────────────────────────────────────
function drawGlowText(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  font: string, color: string, glowColor: string, glowSize: number, alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Glow layers
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowSize;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  // Second pass for stronger glow
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawStrokeText(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  font: string, strokeColor: string, lineWidth: number, alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.strokeText(text, x, y);
  ctx.restore();
}

// Character-by-character reveal
function drawRevealText(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  font: string, color: string, glowColor: string, revealProgress: number, alpha: number
) {
  const chars = text.split("");
  const visibleCount = Math.floor(revealProgress * chars.length);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  const totalWidth = ctx.measureText(text).width;
  let currentX = x - totalWidth / 2;

  for (let i = 0; i < chars.length; i++) {
    const charWidth = ctx.measureText(chars[i]).width;
    if (i < visibleCount) {
      const charAge = clamp01((revealProgress * chars.length - i) / 2);
      const charAlpha = easeOutCubic(charAge);
      const charScale = 0.5 + easeOutBack(charAge) * 0.5;
      
      ctx.save();
      ctx.globalAlpha = alpha * charAlpha;
      ctx.translate(currentX + charWidth / 2, y);
      ctx.scale(charScale, charScale);
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.fillText(chars[i], -charWidth / 2, 0);
      ctx.restore();
    }
    currentX += charWidth;
  }
  ctx.restore();
}

// ── Scene System ───────────────────────────────────────────────────────────
type SceneTimings = { start: number; end: number; fadeIn: number; fadeOut: number };

function getSceneAlpha(progress: number, scene: SceneTimings): number {
  if (progress < scene.start || progress > scene.end) return 0;
  const sceneProgress = (progress - scene.start) / (scene.end - scene.start);
  const fadeInAlpha = scene.fadeIn > 0 ? clamp01(sceneProgress / scene.fadeIn) : 1;
  const fadeOutAlpha = scene.fadeOut > 0 ? clamp01((1 - sceneProgress) / scene.fadeOut) : 1;
  return easeInOutCubic(fadeInAlpha) * easeInOutCubic(fadeOutAlpha);
}

function getSceneProgress(progress: number, scene: SceneTimings): number {
  if (progress < scene.start) return 0;
  if (progress > scene.end) return 1;
  return (progress - scene.start) / (scene.end - scene.start);
}

// ── Product Promo Renderer ─────────────────────────────────────────────────
function renderProductPromo(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  keywords: string[], palette: Palette, orbs: Orb[],
  frame: number, totalFrames: number
) {
  const t = frame / 30;
  const progress = frame / totalFrames;
  const zoom = progress;

  // Background
  drawBackground(ctx, w, h, palette, t, zoom);
  drawOrbs(ctx, orbs, w, h, palette, t);
  drawSpotlight(ctx, w, h, palette, t);

  const textCol = rgb(palette.text[0], palette.text[1], palette.text[2]);
  const accentCol = rgb(palette.accent[0], palette.accent[1], palette.accent[2]);
  const accentGlow = rgba(palette.accent[0], palette.accent[1], palette.accent[2], 0.6);
  const accent2Col = rgb(palette.accent2[0], palette.accent2[1], palette.accent2[2]);

  // Scene 1: Brand reveal with light burst (0-30%)
  const s1: SceneTimings = { start: 0, end: 0.35, fadeIn: 0.15, fadeOut: 0.2 };
  const s1Alpha = getSceneAlpha(progress, s1);
  if (s1Alpha > 0 && keywords.length > 0) {
    const s1p = getSceneProgress(progress, s1);
    const title = keywords[0].toUpperCase();
    const titleSize = Math.min(w * 0.14, 120);

    // Light burst effect
    if (s1p < 0.4) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const burstAlpha = (1 - s1p / 0.4) * 0.3 * s1Alpha;
      const burstR = Math.min(w, h) * s1p * 2;
      const grad = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, burstR);
      grad.addColorStop(0, rgba(palette.accent[0], 80, 85, burstAlpha));
      grad.addColorStop(0.5, rgba(palette.accent[0], 60, 70, burstAlpha * 0.3));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Title with char reveal
    const revealP = clamp01(s1p * 2.5);
    drawRevealText(
      ctx, title, w / 2, h * 0.42,
      `800 ${titleSize}px 'Arial Black', 'Helvetica Neue', sans-serif`,
      textCol, accentGlow, revealP, s1Alpha
    );

    // Accent underline
    const lineP = clamp01((s1p - 0.3) * 3);
    if (lineP > 0) {
      const lineW = w * 0.3 * easeOutCubic(lineP);
      ctx.save();
      ctx.globalAlpha = s1Alpha * lineP;
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 3;
      ctx.shadowColor = accentGlow;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(w / 2 - lineW / 2, h * 0.42 + titleSize * 0.6);
      ctx.lineTo(w / 2 + lineW / 2, h * 0.42 + titleSize * 0.6);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Scene 2: Keywords stagger (25-60%)
  const s2: SceneTimings = { start: 0.22, end: 0.62, fadeIn: 0.12, fadeOut: 0.15 };
  const s2Alpha = getSceneAlpha(progress, s2);
  if (s2Alpha > 0 && keywords.length > 1) {
    const s2p = getSceneProgress(progress, s2);
    const displayWords = keywords.slice(1, 6);
    const wordSize = Math.min(w * 0.055, 44);
    const startY = h * 0.3;
    const spacing = wordSize * 2;

    // Glass panel behind keywords
    const panelH = displayWords.length * spacing + wordSize;
    const panelW = w * 0.55;
    const panelAlpha = clamp01(s2p * 4) * s2Alpha;
    drawGlassPanel(ctx, w / 2 - panelW / 2, startY - wordSize, panelW, panelH, 16, palette, panelAlpha * 0.6);

    for (let i = 0; i < displayWords.length; i++) {
      const wordDelay = i * 0.12;
      const wordP = clamp01((s2p - wordDelay) * 3);
      if (wordP <= 0) continue;

      const word = displayWords[i].toUpperCase();
      const yPos = startY + i * spacing;
      const xSlide = (1 - easeOutCubic(wordP)) * w * 0.3 * (i % 2 === 0 ? -1 : 1);

      drawGlowText(
        ctx, word, w / 2 + xSlide, yPos,
        `700 ${wordSize}px 'Arial Black', sans-serif`,
        textCol, accentGlow, 12, s2Alpha * easeOutCubic(wordP)
      );

      // Dot accent
      ctx.save();
      ctx.globalAlpha = s2Alpha * easeOutCubic(wordP) * 0.6;
      ctx.fillStyle = accentCol;
      ctx.beginPath();
      ctx.arc(w / 2 - panelW / 2 + 20, yPos, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Scene 3: Tagline with CTA (55-85%)
  const s3: SceneTimings = { start: 0.52, end: 0.88, fadeIn: 0.15, fadeOut: 0.15 };
  const s3Alpha = getSceneAlpha(progress, s3);
  if (s3Alpha > 0) {
    const s3p = getSceneProgress(progress, s3);
    const tagline = keywords.length > 2 ? keywords.slice(1, 4).join(" · ").toUpperCase() : "DISCOVER MORE";
    const tagSize = Math.min(w * 0.04, 32);

    // Tagline
    const tagReveal = clamp01(s3p * 2.5);
    drawRevealText(
      ctx, tagline, w / 2, h * 0.45,
      `600 ${tagSize}px 'Helvetica Neue', Arial, sans-serif`,
      accent2Col, accentGlow, tagReveal, s3Alpha
    );

    // Big accent word
    if (keywords.length > 0) {
      const bigWord = keywords[0].toUpperCase();
      const bigSize = Math.min(w * 0.18, 160);
      const bigAlpha = clamp01((s3p - 0.2) * 2);
      const bigScale = 0.8 + easeOutElastic(clamp01((s3p - 0.2) * 2)) * 0.2;

      ctx.save();
      ctx.globalAlpha = s3Alpha * bigAlpha * 0.15;
      ctx.translate(w / 2, h * 0.55);
      ctx.scale(bigScale, bigScale);
      ctx.font = `900 ${bigSize}px 'Arial Black', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = rgba(palette.accent[0], palette.accent[1], palette.accent[2], 0.3);
      ctx.lineWidth = 2;
      ctx.strokeText(bigWord, 0, 0);
      ctx.restore();
    }

    // Animated underline
    const underP = clamp01((s3p - 0.3) * 2.5);
    if (underP > 0) {
      const underW = w * 0.25 * easeOutCubic(underP);
      ctx.save();
      ctx.globalAlpha = s3Alpha;
      const grad = ctx.createLinearGradient(w / 2 - underW, 0, w / 2 + underW, 0);
      grad.addColorStop(0, rgba(palette.accent[0], palette.accent[1], palette.accent[2], 0));
      grad.addColorStop(0.5, accentCol);
      grad.addColorStop(1, rgba(palette.accent2[0], palette.accent2[1], palette.accent2[2], 0));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - underW, h * 0.45 + tagSize);
      ctx.lineTo(w / 2 + underW, h * 0.45 + tagSize);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Scene 4: Outro - all elements fade (80-100%)
  const s4: SceneTimings = { start: 0.82, end: 1, fadeIn: 0.15, fadeOut: 0.4 };
  const s4Alpha = getSceneAlpha(progress, s4);
  if (s4Alpha > 0 && keywords.length > 0) {
    const title = keywords[0].toUpperCase();
    const outroSize = Math.min(w * 0.08, 64);
    drawGlowText(
      ctx, title, w / 2, h * 0.5,
      `700 ${outroSize}px 'Arial Black', sans-serif`,
      textCol, accentGlow, 25, s4Alpha
    );

    // Small tagline below
    if (keywords.length > 1) {
      const sub = keywords.slice(1, 3).join(" ").toUpperCase();
      drawStrokeText(
        ctx, sub, w / 2, h * 0.5 + outroSize * 1.2,
        `500 ${outroSize * 0.4}px 'Helvetica Neue', sans-serif`,
        rgba(palette.accent[0], palette.accent[1], palette.accent[2], 0.6), 1, s4Alpha * 0.7
      );
    }
  }

  // Light streak overlay
  drawLightStreak(ctx, w, h, palette, t);

  // Film grain
  drawFilmGrain(ctx, w, h, 0.025);
}

// ── Motion Graphics Renderer ───────────────────────────────────────────────
type MgShape = { x: number; y: number; size: number; rot: number; type: number; hueOff: number; speed: number; phase: number };

function createMgShapes(w: number, h: number): MgShape[] {
  return Array.from({ length: 12 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 80 + 30,
    rot: Math.random() * Math.PI * 2,
    type: Math.floor(Math.random() * 4),
    hueOff: Math.random() * 50 - 25,
    speed: Math.random() * 1.5 + 0.5,
    phase: Math.random() * Math.PI * 2,
  }));
}

function drawMgShapes(ctx: CanvasRenderingContext2D, shapes: MgShape[], w: number, h: number, palette: Palette, t: number, alpha: number) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const s of shapes) {
    const sx = s.x + Math.sin(t * s.speed + s.phase) * 100;
    const sy = s.y + Math.cos(t * s.speed * 0.7 + s.phase) * 80;
    const rot = s.rot + t * s.speed * 0.2;
    const pulse = s.size + Math.sin(t * 2 + s.phase) * 15;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha * 0.12;

    const col = rgba(palette.accent[0] + s.hueOff, 70, 55, 1);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;

    if (s.type === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.stroke();
    } else if (s.type === 1) {
      ctx.strokeRect(-pulse / 2, -pulse / 2, pulse, pulse);
    } else if (s.type === 2) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * pulse;
        const py = Math.sin(angle) * pulse;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      // Diamond
      ctx.beginPath();
      ctx.moveTo(0, -pulse);
      ctx.lineTo(pulse * 0.6, 0);
      ctx.lineTo(0, pulse);
      ctx.lineTo(-pulse * 0.6, 0);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function renderMotionGraphics(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  keywords: string[], palette: Palette, orbs: Orb[], shapes: MgShape[],
  frame: number, totalFrames: number
) {
  const t = frame / 30;
  const progress = frame / totalFrames;
  const zoom = progress;

  drawBackground(ctx, w, h, palette, t, zoom);
  drawPerspectiveGrid(ctx, w, h, palette, t, clamp01(progress * 3));
  drawOrbs(ctx, orbs, w, h, palette, t);
  drawMgShapes(ctx, shapes, w, h, palette, t, 1);

  const textCol = rgb(palette.text[0], palette.text[1], palette.text[2]);
  const accentCol = rgb(palette.accent[0], palette.accent[1], palette.accent[2]);
  const accentGlow = rgba(palette.accent[0], palette.accent[1], palette.accent[2], 0.7);

  // Scene 1: Title slam with shake (0-30%)
  const s1: SceneTimings = { start: 0, end: 0.32, fadeIn: 0.05, fadeOut: 0.2 };
  const s1Alpha = getSceneAlpha(progress, s1);
  if (s1Alpha > 0 && keywords.length > 0) {
    const s1p = getSceneProgress(progress, s1);
    const title = keywords[0].toUpperCase();
    const titleSize = Math.min(w * 0.16, 140);

    // Screen shake on slam
    const shakeIntensity = Math.max(0, 1 - s1p * 5) * 8;
    const shakeX = Math.sin(s1p * 200) * shakeIntensity;
    const shakeY = Math.cos(s1p * 170) * shakeIntensity;

    // Scale slam
    const slamScale = s1p < 0.1 ? easeOutElastic(s1p * 10) : 1;

    ctx.save();
    ctx.translate(w / 2 + shakeX, h * 0.45 + shakeY);
    ctx.scale(slamScale, slamScale);
    ctx.globalAlpha = s1Alpha;
    ctx.font = `900 ${titleSize}px 'Arial Black', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = accentGlow;
    ctx.shadowBlur = 40;
    ctx.fillStyle = textCol;
    ctx.fillText(title, 0, 0);
    ctx.fillText(title, 0, 0); // double for glow
    ctx.restore();

    // Impact flash
    if (s1p < 0.08) {
      ctx.save();
      ctx.globalAlpha = (1 - s1p / 0.08) * 0.4 * s1Alpha;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // Scene 2: Words fly in from edges (25-60%)
  const s2: SceneTimings = { start: 0.22, end: 0.62, fadeIn: 0.1, fadeOut: 0.15 };
  const s2Alpha = getSceneAlpha(progress, s2);
  if (s2Alpha > 0 && keywords.length > 1) {
    const s2p = getSceneProgress(progress, s2);
    const words = keywords.slice(1, 7);
    const fontSize = Math.min(w * 0.08, 65);

    for (let i = 0; i < words.length; i++) {
      const wordDelay = i * 0.1;
      const wordP = clamp01((s2p - wordDelay) * 2.5);
      if (wordP <= 0) continue;

      const word = words[i].toUpperCase();
      const row = i % 3;
      const yPos = h * 0.28 + row * (fontSize * 1.6);

      // Fly in from alternating sides with rotation
      const fromRight = i % 2 === 0;
      const xStart = fromRight ? w + 200 : -200;
      const xEnd = w / 2;
      const x = xStart + (xEnd - xStart) * easeOutCubic(wordP);
      const rotation = (1 - easeOutCubic(wordP)) * (fromRight ? -0.15 : 0.15);

      ctx.save();
      ctx.translate(x, yPos);
      ctx.rotate(rotation);
      ctx.globalAlpha = s2Alpha * easeOutCubic(wordP);
      ctx.font = `800 ${fontSize}px 'Arial Black', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = accentGlow;
      ctx.shadowBlur = 20;
      ctx.fillStyle = i % 3 === 0 ? accentCol : textCol;
      ctx.fillText(word, 0, 0);
      ctx.restore();
    }
  }

  // Scene 3: Abstract shapes + text overlay (55-85%)
  const s3: SceneTimings = { start: 0.52, end: 0.88, fadeIn: 0.12, fadeOut: 0.15 };
  const s3Alpha = getSceneAlpha(progress, s3);
  if (s3Alpha > 0) {
    const s3p = getSceneProgress(progress, s3);

    // Morphing central shape
    const shapeSize = Math.min(w, h) * 0.25;
    const morph = Math.sin(t * 2) * 0.5 + 0.5;
    ctx.save();
    ctx.translate(w / 2, h * 0.48);
    ctx.rotate(t * 0.3);
    ctx.globalAlpha = s3Alpha * 0.15;
    ctx.strokeStyle = accentCol;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += 0.02) {
      const r = shapeSize * (0.8 + morph * 0.2 * Math.sin(a * 4 + t * 3));
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Overlay text
    if (keywords.length > 0) {
      const overlayWord = keywords[Math.floor(s3p * 2) % keywords.length].toUpperCase();
      const overlaySize = Math.min(w * 0.1, 80);
      const revealP = clamp01((s3p % 0.5) * 4);

      drawGlowText(
        ctx, overlayWord, w / 2, h * 0.48,
        `900 ${overlaySize}px 'Arial Black', sans-serif`,
        textCol, accentGlow, 30, s3Alpha * easeOutCubic(revealP)
      );
    }
  }

  // Scene 4: Keywords burst outward (80-100%)
  const s4: SceneTimings = { start: 0.82, end: 1, fadeIn: 0.1, fadeOut: 0.5 };
  const s4Alpha = getSceneAlpha(progress, s4);
  if (s4Alpha > 0) {
    const s4p = getSceneProgress(progress, s4);

    for (let i = 0; i < Math.min(keywords.length, 8); i++) {
      const angle = (i / Math.min(keywords.length, 8)) * Math.PI * 2;
      const burstDist = easeOutCubic(s4p) * Math.min(w, h) * 0.35;
      const bx = w / 2 + Math.cos(angle) * burstDist;
      const by = h / 2 + Math.sin(angle) * burstDist;
      const wordSize = Math.min(w * 0.04, 30);

      drawGlowText(
        ctx, keywords[i].toUpperCase(), bx, by,
        `700 ${wordSize}px 'Arial Black', sans-serif`,
        textCol, accentGlow, 15, s4Alpha * (1 - s4p * 0.5)
      );
    }
  }

  // Light streak
  drawLightStreak(ctx, w, h, palette, t);

  // Progress bar
  const barY = h - 6;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = rgba(palette.accent[0], palette.accent[1], palette.accent[2], 0.2);
  ctx.fillRect(0, barY, w, 4);
  ctx.globalAlpha = 0.8;
  const barGrad = ctx.createLinearGradient(0, 0, w * progress, 0);
  barGrad.addColorStop(0, accentCol);
  barGrad.addColorStop(1, rgb(palette.accent2[0], palette.accent2[1], palette.accent2[2]));
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, barY, w * progress, 4);
  ctx.restore();

  // Film grain
  drawFilmGrain(ctx, w, h, 0.02);
}

// ── Main Export ─────────────────────────────────────────────────────────────
export async function generateVideo(config: VideoConfig): Promise<string> {
  const { prompt, videoType, aspectRatio, duration, onProgress } = config;
  const [w, h] = ASPECT_DIMS[aspectRatio] || ASPECT_DIMS["16:9"];
  const fps = 30;
  const totalFrames = duration * fps;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const keywords = extractKeywords(prompt);
  if (keywords.length === 0) keywords.push("Video", "Promo");

  const palette = PALETTES[hashPrompt(prompt) % PALETTES.length];
  const orbs = createOrbs(w, h, 80);
  const mgShapes = createMgShapes(w, h);

  const stream = canvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve(URL.createObjectURL(blob));
    };
    mediaRecorder.onerror = () => reject(new Error("Recording failed"));
    mediaRecorder.start();

    let frame = 0;
    const renderFrame = () => {
      if (frame >= totalFrames) {
        mediaRecorder.stop();
        return;
      }

      if (videoType === "motion-graphics") {
        renderMotionGraphics(ctx, w, h, keywords, palette, orbs, mgShapes, frame, totalFrames);
      } else {
        renderProductPromo(ctx, w, h, keywords, palette, orbs, frame, totalFrames);
      }

      frame++;
      onProgress?.(Math.round((frame / totalFrames) * 100));
      requestAnimationFrame(renderFrame);
    };
    renderFrame();
  });
}
