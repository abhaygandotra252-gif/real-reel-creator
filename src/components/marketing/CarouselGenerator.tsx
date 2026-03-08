import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Download, RefreshCw, Image } from "lucide-react";
import { renderAllSlides, type SlideData, type CarouselFormat } from "@/lib/carousel-renderer";

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

export function CarouselGenerator() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [theme, setTheme] = useState("product-benefits");
  const [format, setFormat] = useState<CarouselFormat>("instagram");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [renderedImages, setRenderedImages] = useState<string[]>([]);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const handleGenerate = async () => {
    const product = products?.find((p) => p.id === productId);
    if (!product) {
      toast({ title: "Select a product first", variant: "destructive" });
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
      const images = renderAllSlides(slideData, format, paletteIndex);
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
      setRenderedImages(renderAllSlides(slides, format, paletteIndex));
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

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !productId}
              className="w-full gradient-primary border-0 gap-2 h-12"
            >
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Generate Carousel</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
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
