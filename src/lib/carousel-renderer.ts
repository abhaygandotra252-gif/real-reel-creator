export type SlideData = {
  headline: string;
  body: string;
  tagline: string;
  emoji?: string;
};

export type CarouselFormat = "instagram" | "story" | "linkedin";

const FORMAT_SIZES: Record<CarouselFormat, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  linkedin: { width: 1200, height: 627 },
};

const PALETTES = [
  { bg: ["#6C3CE1", "#9B59E8"], text: "#FFFFFF", accent: "#FFD93D", sub: "#E0D4FA" },
  { bg: ["#0F172A", "#1E293B"], text: "#F8FAFC", accent: "#38BDF8", sub: "#94A3B8" },
  { bg: ["#1A1A2E", "#16213E"], text: "#EAEAEA", accent: "#E94560", sub: "#A0A0B0" },
  { bg: ["#0D1117", "#161B22"], text: "#F0F6FC", accent: "#58A6FF", sub: "#8B949E" },
  { bg: ["#2D1B69", "#11001C"], text: "#FFFFFF", accent: "#FF6B9D", sub: "#C4B5FD" },
  { bg: ["#064E3B", "#022C22"], text: "#ECFDF5", accent: "#34D399", sub: "#6EE7B7" },
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, colors: string[]) {
  const grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle grid pattern
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  const step = 60;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Bokeh circles
  for (let i = 0; i < 6; i++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    const r = 80 + Math.random() * 200;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(255,255,255,0.06)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export type CustomPalette = {
  bg: string[];
  text: string;
  accent: string;
  sub: string;
};

export function renderSlide(
  slide: SlideData,
  slideIndex: number,
  totalSlides: number,
  format: CarouselFormat = "instagram",
  paletteIndex: number = 0,
  customPalette?: CustomPalette,
): string {
  const { width, height } = FORMAT_SIZES[format];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const palette = customPalette || PALETTES[paletteIndex % PALETTES.length];
  const pad = width * 0.08;
  const contentWidth = width - pad * 2;

  // Background
  drawBackground(ctx, width, height, palette.bg);

  // Slide number indicator
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  roundRect(ctx, pad, pad, 80, 40, 20);
  ctx.fill();
  ctx.fillStyle = palette.text;
  ctx.font = `bold ${16}px 'Space Grotesk', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(`${slideIndex + 1}/${totalSlides}`, pad + 40, pad + 26);

  // Emoji
  if (slide.emoji) {
    ctx.font = `${width * 0.08}px serif`;
    ctx.textAlign = "center";
    ctx.fillText(slide.emoji, width / 2, height * 0.28);
  }

  // Headline
  ctx.textAlign = "center";
  ctx.fillStyle = palette.text;
  const headlineSize = Math.min(width * 0.07, 72);
  ctx.font = `bold ${headlineSize}px 'Space Grotesk', sans-serif`;
  const headlineLines = wrapText(ctx, slide.headline, contentWidth);
  const headlineY = height * (slide.emoji ? 0.38 : 0.32);
  headlineLines.forEach((line, i) => {
    ctx.fillText(line, width / 2, headlineY + i * (headlineSize * 1.2));
  });

  // Accent bar
  const barY = headlineY + headlineLines.length * (headlineSize * 1.2) + 20;
  ctx.fillStyle = palette.accent;
  roundRect(ctx, width / 2 - 40, barY, 80, 4, 2);
  ctx.fill();

  // Body
  const bodySize = Math.min(width * 0.035, 32);
  ctx.font = `${bodySize}px 'Inter', sans-serif`;
  ctx.fillStyle = palette.sub;
  const bodyLines = wrapText(ctx, slide.body, contentWidth * 0.85);
  const bodyY = barY + 40;
  bodyLines.forEach((line, i) => {
    ctx.fillText(line, width / 2, bodyY + i * (bodySize * 1.5));
  });

  // Tagline / CTA  
  const tagY = height * 0.85;
  ctx.fillStyle = palette.accent;
  const tagW = Math.min(ctx.measureText(slide.tagline).width + 60, contentWidth);
  roundRect(ctx, width / 2 - tagW / 2, tagY - 24, tagW, 48, 24);
  ctx.fill();
  ctx.fillStyle = palette.bg[0];
  ctx.font = `bold ${Math.min(width * 0.03, 24)}px 'Space Grotesk', sans-serif`;
  ctx.fillText(slide.tagline, width / 2, tagY + 6);

  // Dots indicator at bottom
  const dotY = height - pad;
  const dotR = 5;
  const dotGap = 18;
  const dotsWidth = totalSlides * dotGap;
  for (let i = 0; i < totalSlides; i++) {
    ctx.beginPath();
    ctx.arc(width / 2 - dotsWidth / 2 + i * dotGap + dotR, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i === slideIndex ? palette.accent : "rgba(255,255,255,0.2)";
    ctx.fill();
  }

  return canvas.toDataURL("image/png");
}

export function renderAllSlides(
  slides: SlideData[],
  format: CarouselFormat = "instagram",
  paletteIndex: number = 0,
): string[] {
  return slides.map((slide, i) => renderSlide(slide, i, slides.length, format, paletteIndex));
}
