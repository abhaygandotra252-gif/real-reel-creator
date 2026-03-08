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

function extractKeywords(prompt: string): string[] {
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "shall", "it", "its", "this", "that", "these", "those", "i", "you", "he", "she", "we", "they", "my", "your", "his", "her", "our", "their", "from", "into", "through", "during", "before", "after", "above", "below", "between", "about", "against", "not", "no", "nor", "so", "very", "just", "then", "than", "too", "also", "only"]);
  return prompt
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
    .slice(0, 12);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

const PALETTES = [
  { bg1: [15, 80, 50], bg2: [280, 70, 40], accent: [45, 90, 60], text: [0, 0, 100] },
  { bg1: [200, 80, 20], bg2: [220, 90, 35], accent: [170, 80, 55], text: [0, 0, 100] },
  { bg1: [330, 70, 45], bg2: [280, 60, 35], accent: [350, 90, 65], text: [0, 0, 100] },
  { bg1: [140, 60, 25], bg2: [160, 70, 35], accent: [80, 80, 55], text: [0, 0, 100] },
  { bg1: [250, 50, 15], bg2: [270, 60, 25], accent: [30, 90, 60], text: [0, 0, 95] },
];

type Particle = { x: number; y: number; vx: number; vy: number; size: number; hue: number; life: number; maxLife: number };

function createParticles(w: number, h: number, count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    size: Math.random() * 4 + 1,
    hue: Math.random() * 60,
    life: 0,
    maxLife: Math.random() * 200 + 100,
  }));
}

function drawGradientBg(ctx: CanvasRenderingContext2D, w: number, h: number, palette: typeof PALETTES[0], t: number) {
  const shift = Math.sin(t * 0.5) * 20;
  const [r1, g1, b1] = hslToRgb(palette.bg1[0] + shift, palette.bg1[1], palette.bg1[2]);
  const [r2, g2, b2] = hslToRgb(palette.bg2[0] - shift, palette.bg2[1], palette.bg2[2]);
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, `rgb(${r1},${g1},${b1})`);
  grad.addColorStop(1, `rgb(${r2},${g2},${b2})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], w: number, h: number, accentHue: number) {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life++;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;
    if (p.life > p.maxLife) { p.life = 0; p.x = Math.random() * w; p.y = Math.random() * h; }
    const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.6;
    const [r, g, b] = hslToRgb(accentHue + p.hue, 80, 60);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fill();
  }
}

function renderProductPromo(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  keywords: string[], palette: typeof PALETTES[0],
  particles: Particle[], frame: number, totalFrames: number
) {
  const t = frame / 60;
  const progress = frame / totalFrames;

  drawGradientBg(ctx, w, h, palette, t);
  drawParticles(ctx, particles, w, h, palette.accent[0]);

  // Vignette
  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.8);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  const [tr, tg, tb] = hslToRgb(palette.text[0], palette.text[1], palette.text[2]);
  const textColor = `rgb(${tr},${tg},${tb})`;
  const [ar, ag, ab] = hslToRgb(palette.accent[0], palette.accent[1], palette.accent[2]);

  // Title animation
  if (keywords.length > 0) {
    const titleWord = keywords[0].toUpperCase();
    const titleSize = Math.min(w * 0.12, 100);
    const titleEnter = Math.min(progress * 5, 1);
    const titleAlpha = titleEnter * (progress < 0.85 ? 1 : Math.max(0, (1 - progress) / 0.15));

    ctx.save();
    ctx.globalAlpha = titleAlpha;
    ctx.font = `bold ${titleSize}px 'Arial', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Shadow
    ctx.shadowColor = `rgba(${ar},${ag},${ab},0.5)`;
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const yOffset = (1 - titleEnter) * 50;
    ctx.fillStyle = textColor;
    ctx.fillText(titleWord, w / 2, h * 0.35 + yOffset);
    ctx.restore();
  }

  // Subtitle words cycling
  if (keywords.length > 1) {
    const cycleIdx = Math.floor(t * 0.8) % (keywords.length - 1) + 1;
    const word = keywords[cycleIdx];
    const subSize = Math.min(w * 0.06, 50);
    const wordProgress = (t * 0.8) % 1;
    const wordAlpha = Math.sin(wordProgress * Math.PI);

    ctx.save();
    ctx.globalAlpha = wordAlpha * (progress < 0.9 ? 1 : Math.max(0, (1 - progress) / 0.1));
    ctx.font = `${subSize}px 'Arial', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = `rgb(${ar},${ag},${ab})`;
    ctx.fillText(word, w / 2, h * 0.55);
    ctx.restore();
  }

  // Bottom line
  const lineWidth = w * 0.4 * Math.min(progress * 3, 1);
  ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.6)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - lineWidth / 2, h * 0.65);
  ctx.lineTo(w / 2 + lineWidth / 2, h * 0.65);
  ctx.stroke();

  // Tagline
  if (keywords.length > 2 && progress > 0.2) {
    const tagAlpha = Math.min((progress - 0.2) * 4, 1) * (progress < 0.9 ? 1 : Math.max(0, (1 - progress) / 0.1));
    const tagText = keywords.slice(1, 5).join(" · ");
    ctx.save();
    ctx.globalAlpha = tagAlpha;
    ctx.font = `${Math.min(w * 0.03, 24)}px 'Arial', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = `rgba(${tr},${tg},${tb},0.7)`;
    ctx.fillText(tagText.toUpperCase(), w / 2, h * 0.75);
    ctx.restore();
  }
}

type Shape = { x: number; y: number; size: number; rotation: number; type: "circle" | "rect" | "triangle"; hueOff: number; speed: number };

function createShapes(w: number, h: number): Shape[] {
  const types: Shape["type"][] = ["circle", "rect", "triangle"];
  return Array.from({ length: 8 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 60 + 20,
    rotation: Math.random() * Math.PI * 2,
    type: types[Math.floor(Math.random() * types.length)],
    hueOff: Math.random() * 60,
    speed: Math.random() * 2 + 0.5,
  }));
}

function renderMotionGraphics(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  keywords: string[], palette: typeof PALETTES[0],
  particles: Particle[], shapes: Shape[],
  frame: number, totalFrames: number
) {
  const t = frame / 60;
  const progress = frame / totalFrames;

  drawGradientBg(ctx, w, h, palette, t);

  // Animated shapes
  const [ar, ag, ab] = hslToRgb(palette.accent[0], palette.accent[1], palette.accent[2]);
  for (const shape of shapes) {
    const sx = shape.x + Math.sin(t * shape.speed) * 80;
    const sy = shape.y + Math.cos(t * shape.speed * 0.7) * 60;
    const rot = shape.rotation + t * shape.speed * 0.3;
    const pulseSize = shape.size + Math.sin(t * 2 + shape.hueOff) * 10;
    const [sr, sg, sb] = hslToRgb(palette.accent[0] + shape.hueOff, 70, 55);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = `rgb(${sr},${sg},${sb})`;

    if (shape.type === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape.type === "rect") {
      ctx.fillRect(-pulseSize / 2, -pulseSize / 2, pulseSize, pulseSize);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -pulseSize);
      ctx.lineTo(pulseSize * 0.87, pulseSize * 0.5);
      ctx.lineTo(-pulseSize * 0.87, pulseSize * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawParticles(ctx, particles, w, h, palette.accent[0]);

  const [tr, tg, tb] = hslToRgb(palette.text[0], palette.text[1], palette.text[2]);

  // Kinetic typography — words fly in one by one
  const wordsPerSec = 1.2;
  for (let i = 0; i < keywords.length; i++) {
    const wordStart = i / wordsPerSec;
    const wordEnd = wordStart + 1.5;
    if (t < wordStart || t > wordEnd + 0.5) continue;

    const localProgress = (t - wordStart) / (wordEnd - wordStart);
    const enterEase = Math.min(localProgress * 3, 1);
    const exitEase = localProgress > 0.8 ? Math.max(0, 1 - (localProgress - 0.8) / 0.4) : 1;
    const alpha = enterEase * exitEase;

    const fontSize = Math.min(w * 0.1, 80);
    const yBase = h * 0.3 + (i % 3) * (fontSize * 1.4);
    const xSlide = (1 - enterEase) * (i % 2 === 0 ? -w * 0.3 : w * 0.3);
    const scale = 0.8 + enterEase * 0.2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(w / 2 + xSlide, yBase);
    ctx.scale(scale, scale);
    ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Glow
    ctx.shadowColor = `rgba(${ar},${ag},${ab},${alpha * 0.8})`;
    ctx.shadowBlur = 20;
    ctx.fillStyle = `rgb(${tr},${tg},${tb})`;
    ctx.fillText(keywords[i].toUpperCase(), 0, 0);
    ctx.restore();
  }

  // Progress bar at bottom
  const barY = h - 8;
  ctx.fillStyle = `rgba(${ar},${ag},${ab},0.4)`;
  ctx.fillRect(0, barY, w, 4);
  ctx.fillStyle = `rgb(${ar},${ag},${ab})`;
  ctx.fillRect(0, barY, w * progress, 4);
}

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

  const palette = PALETTES[Math.abs(prompt.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % PALETTES.length];
  const particles = createParticles(w, h, 60);
  const shapes = createShapes(w, h);

  const stream = canvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9",
    videoBitsPerSecond: 4_000_000,
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
        renderMotionGraphics(ctx, w, h, keywords, palette, particles, shapes, frame, totalFrames);
      } else {
        renderProductPromo(ctx, w, h, keywords, palette, particles, frame, totalFrames);
      }

      frame++;
      onProgress?.(Math.round((frame / totalFrames) * 100));
      requestAnimationFrame(renderFrame);
    };
    renderFrame();
  });
}
