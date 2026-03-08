import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, RefreshCw, Megaphone, Lightbulb } from "lucide-react";

type AdVariation = { angle: string; headline: string; description: string; primary_text: string; cta: string };
type AdData = { variations: AdVariation[]; ab_test_tips: string[] };

const AD_PLATFORMS = [
  { value: "google", label: "Google Ads" },
  { value: "meta", label: "Meta (FB/IG)" },
];

export function AdCopyGenerator() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [adPlatform, setAdPlatform] = useState("google");
  const [isGenerating, setIsGenerating] = useState(false);
  const [adData, setAdData] = useState<AdData | null>(null);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const handleGenerate = async () => {
    const product = products?.find((p) => p.id === productId);
    if (!product) { toast({ title: "Select a product first", variant: "destructive" }); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ad-copy", {
        body: { product_name: product.name, product_description: product.description, key_features: product.key_features, benefits: product.benefits, ad_platform: adPlatform },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setAdData(data);
      toast({ title: "Ad copy generated" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Ad Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ad Platform</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {AD_PLATFORMS.map((p) => (
                  <button key={p.value} onClick={() => setAdPlatform(p.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${adPlatform === p.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"}`}>
                    <span>{p.icon}</span><span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !productId} className="w-full gradient-primary border-0 gap-2 h-12">
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Generate Ad Copy</>}
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        {!adData ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary"><Megaphone className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Ad copy generator</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Generate high-converting ad copy for Google & Meta with A/B test variations.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Ad Variations</h2>
            {adData.variations.map((v, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">{v.angle}</span>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => copyToClipboard(`Headline: ${v.headline}\nDescription: ${v.description}\nPrimary Text: ${v.primary_text}\nCTA: ${v.cta}`)}><Copy className="h-3 w-3" /> Copy</Button>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-secondary/50 p-2.5">
                      <span className="text-xs text-muted-foreground">Headline</span>
                      <p className="text-sm font-medium text-foreground">{v.headline}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-2.5">
                      <span className="text-xs text-muted-foreground">Primary Text</span>
                      <p className="text-sm text-foreground">{v.primary_text}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-2.5">
                      <span className="text-xs text-muted-foreground">Description</span>
                      <p className="text-sm text-foreground">{v.description}</p>
                    </div>
                    <div className="rounded-lg bg-primary/5 p-2.5">
                      <span className="text-xs text-muted-foreground">CTA</span>
                      <p className="text-sm font-medium text-primary">{v.cta}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {adData.ab_test_tips.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /><span className="font-display text-sm font-semibold text-foreground">A/B Testing Tips</span></div>
                  <ul className="space-y-1.5">
                    {adData.ab_test_tips.map((tip, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span>•</span><span>{tip}</span></li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
