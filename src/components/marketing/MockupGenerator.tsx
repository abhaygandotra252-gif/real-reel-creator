import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Download, RefreshCw, ImageIcon } from "lucide-react";

const TEMPLATES = [
  { value: "lifestyle-flatlay", label: "Lifestyle Flat Lay", desc: "Product styled with accessories" },
  { value: "minimal-product", label: "Minimal Product Shot", desc: "Clean, premium studio look" },
  { value: "social-ad-banner", label: "Social Ad Banner", desc: "Bold promotional graphic" },
  { value: "custom", label: "Custom Prompt", desc: "Describe your own scene" },
];

export function MockupGenerator() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [template, setTemplate] = useState("lifestyle-flatlay");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");

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
      const { data, error } = await supabase.functions.invoke("generate-mockup", {
        body: {
          product_name: product.name,
          product_description: product.description,
          template,
          custom_prompt: template === "custom" ? customPrompt : undefined,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGeneratedImage(data.image_url);
      toast({ title: "Mockup generated" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = "product-mockup.png";
    a.click();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Mockup Settings</CardTitle>
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
              <Label>Template</Label>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTemplate(t.value)}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                      template === t.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <span className="text-sm font-medium">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {template === "custom" && (
              <div>
                <Label>Custom Scene Description</Label>
                <Textarea
                  className="mt-1 min-h-[80px]"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe your ideal product mockup scene..."
                />
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !productId}
              className="w-full gradient-primary border-0 gap-2 h-12"
            >
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating (~15s)...</> : <><Sparkles className="h-5 w-5" /> Generate Mockup</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        {!generatedImage ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">AI product mockups</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Generate stunning promotional images for your product using AI. Choose a template or describe your own scene.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Generated Mockup</h2>
              <Button variant="outline" size="sm" className="gap-1" onClick={downloadImage}>
                <Download className="h-3 w-3" /> Download PNG
              </Button>
            </div>
            <Card className="border-border bg-card overflow-hidden">
              <img src={generatedImage} alt="Product mockup" className="w-full rounded-lg" />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
