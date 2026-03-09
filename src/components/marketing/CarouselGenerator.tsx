import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Download, RefreshCw, Image, Palette, Globe, Check, X } from "lucide-react";
import { renderAllSlides, type SlideData, type CarouselFormat, type CustomPalette } from "@/lib/carousel-renderer";

const THEMES = [
  { value: "product-benefits", label: "Product Benefits" },
  { value: "educational-tips", label: "Educational Tips" },
  { value: "testimonial", label: "Testimonial Style" },
  { value: "before-after", label: "Before & After" },
];

const FORMATS: { value: CarouselFormat; label: string }[] = [
  { value: "instagram", label: "Instagram (1080×1080)" },
  { value: "story", label: "Stories (1080×1920)" },
  { value: "linkedin", label: "LinkedIn (1200×627)" },
];

const PALETTES = [
  { label: "Purple Glow", index: 0 },
  { label: "Midnight Blue", index: 1 },
  { label: "Dark Rose", index: 2 },
  { label: "GitHub Dark", index: 3 },
  { label: "Neon Pink", index: 4 },
  { label: "Emerald", index: 5 },
];

type ExtractedColor = { hex: string; role: string };

export function CarouselGenerator() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [theme, setTheme] = useState("product-benefits");
  const [format, setFormat] = useState<CarouselFormat>("instagram");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [renderedImages, setRenderedImages] = useState<string[]>([]);

  // Brand colors state
  const [useBrandColors, setUseBrandColors] = useState(false);
  const [brandUrl, setBrandUrl] = useState("");
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [colorsConfirmed, setColorsConfirmed] = useState(false);
  const [manualColors, setManualColors] = useState<string[]>(["#6C3CE1", "#FFFFFF", "#FFD93D", "#E0D4FA"]);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const buildCustomPalette = (): CustomPalette | undefined => {
    if (!useBrandColors || !colorsConfirmed) return undefined;
    const colors = extractedColors.length > 0
      ? extractedColors.map(c => c.hex)
      : manualColors;
    if (colors.length < 2) return undefined;
    return {
      bg: [colors[0], colors[1] || colors[0]],
      text: colors.find((_, i) => extractedColors[i]?.role === "text") || "#FFFFFF",
      accent: colors[2] || colors[0],
      sub: colors[3] || "#CCCCCC",
    };
  };

  const handleExtractColors = async () => {
    if (!brandUrl.trim()) {
      toast({ title: "Enter a website URL", variant: "destructive" });
      return;
    }
    setIsExtracting(true);
    setColorsConfirmed(false);
    try {
      const { data, error } = await supabase.functions.invoke("extract-brand-colors", {
        body: { url: brandUrl },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setExtractedColors(data.colors || []);
      toast({ title: "Colors extracted — confirm before generating" });
    } catch (err: any) {
      toast({ title: "Extraction failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async () => {
    const product = products?.find((p) => p.id === productId);
    if (!product) {
      toast({ title: "Select a product first", variant: "destructive" });
      return;
    }
    if (useBrandColors && !colorsConfirmed) {
      toast({ title: "Please confirm your color palette first", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-carousel", {
        body: {
          product_name: product.name,
          product_description: product.description,
          key_features: product.key_features,
          benefits: product.benefits,
          theme,
          slide_count: 5,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const slideData: SlideData[] = data.slides;
      setSlides(slideData);
      const customPalette = buildCustomPalette();
      const images = renderAllSlides(slideData, format, paletteIndex, customPalette);
      setRenderedImages(images);
      toast({ title: "Carousel generated" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const rerender = () => {
    if (slides.length) {
      const customPalette = buildCustomPalette();
      setRenderedImages(renderAllSlides(slides, format, paletteIndex, customPalette));
    }
  };

  const downloadSlide = (dataUrl: string, index: number) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `carousel-slide-${index + 1}.png`;
    a.click();
  };

  const downloadAll = () => {
    renderedImages.forEach((img, i) => downloadSlide(img, i));
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
      <div className="space-y-4 md:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Carousel Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>
                  {products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {THEMES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => { setFormat(v as CarouselFormat); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Colors Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <Label className="cursor-pointer" htmlFor="brand-colors-toggle">Use Brand Colors</Label>
              </div>
              <Switch
                id="brand-colors-toggle"
                checked={useBrandColors}
                onCheckedChange={(checked) => {
                  setUseBrandColors(checked);
                  if (!checked) {
                    setColorsConfirmed(false);
                    setExtractedColors([]);
                  }
                }}
              />
            </div>

            {useBrandColors && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Enter your website URL to extract brand colors</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://yoursite.com"
                      value={brandUrl}
                      onChange={(e) => setBrandUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExtractColors}
                      disabled={isExtracting}
                      className="gap-1 shrink-0"
                    >
                      {isExtracting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                      Extract
                    </Button>
                  </div>
                </div>

                {/* Manual color inputs */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Or enter colors manually</Label>
                  <div className="flex gap-2 flex-wrap">
                    {manualColors.map((color, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const updated = [...manualColors];
                            updated[i] = e.target.value;
                            setManualColors(updated);
                            setExtractedColors([]);
                            setColorsConfirmed(false);
                          }}
                          className="h-8 w-8 cursor-pointer rounded border border-border"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color confirmation */}
                {(extractedColors.length > 0 || manualColors.length > 0) && !colorsConfirmed && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">Confirm this palette:</Label>
                    <div className="flex items-center gap-2">
                      {(extractedColors.length > 0 ? extractedColors.map(c => c.hex) : manualColors).map((hex, i) => (
                        <div key={i} className="text-center">
                          <div className="h-10 w-10 rounded-lg border border-border shadow-sm" style={{ backgroundColor: hex }} />
                          <span className="text-[10px] text-muted-foreground mt-1 block">{hex}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" className="gap-1" onClick={() => { setColorsConfirmed(true); toast({ title: "Colors confirmed" }); }}>
                        <Check className="h-3 w-3" /> Use these colors
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setExtractedColors([]); setColorsConfirmed(false); }}>
                        <X className="h-3 w-3" /> Reset
                      </Button>
                    </div>
                  </div>
                )}

                {colorsConfirmed && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Check className="h-3 w-3" /> Brand colors confirmed
                  </div>
                )}
              </div>
            )}

            {!useBrandColors && (
              <div>
                <Label>Color Palette</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {PALETTES.map((p) => (
                    <button
                      key={p.index}
                      onClick={() => { setPaletteIndex(p.index); if (slides.length) rerender(); }}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        paletteIndex === p.index
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !productId || (useBrandColors && !colorsConfirmed)}
              className="w-full gradient-primary border-0 gap-2 h-12"
            >
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Generate Carousel</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-3">
        {renderedImages.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Create stunning carousels</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Select a product and theme, then let AI generate professional carousel slides ready for social media.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Generated Slides</h2>
              <Button variant="outline" size="sm" className="gap-1" onClick={downloadAll}>
                <Download className="h-3 w-3" /> Download All
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {renderedImages.map((img, i) => (
                <Card key={i} className="border-border bg-card overflow-hidden">
                  <img src={img} alt={`Slide ${i + 1}`} className="w-full" />
                  <CardContent className="p-2">
                    <Button variant="ghost" size="sm" className="w-full gap-1 text-xs" onClick={() => downloadSlide(img, i)}>
                      <Download className="h-3 w-3" /> Slide {i + 1}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
