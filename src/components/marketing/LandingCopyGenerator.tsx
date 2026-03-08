import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, RefreshCw, Layout, HelpCircle, Star, MousePointer } from "lucide-react";

type Feature = { title: string; description: string; emoji: string };
type FAQ = { question: string; answer: string };
type LandingData = {
  hero_headline: string; hero_subheadline: string; features: Feature[];
  social_proof_suggestions: string[]; faqs: FAQ[]; cta_variations: string[];
};

export function LandingCopyGenerator() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [landingData, setLandingData] = useState<LandingData | null>(null);

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
      const { data, error } = await supabase.functions.invoke("generate-landing-copy", {
        body: { product_name: product.name, product_description: product.description, key_features: product.key_features, benefits: product.benefits },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setLandingData(data);
      toast({ title: "Landing copy ready" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const copyAll = () => {
    if (!landingData) return;
    const all = [
      `# ${landingData.hero_headline}`,
      landingData.hero_subheadline,
      "",
      "## Features",
      ...landingData.features.map(f => `${f.emoji} ${f.title}: ${f.description}`),
      "",
      "## Social Proof Ideas",
      ...landingData.social_proof_suggestions.map(s => `- ${s}`),
      "",
      "## FAQ",
      ...landingData.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`),
      "",
      "## CTA Options",
      ...landingData.cta_variations.map((c, i) => `${i + 1}. ${c}`),
    ].join("\n");
    navigator.clipboard.writeText(all);
    toast({ title: "All copy copied" });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Landing Page Copy</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !productId} className="w-full gradient-primary border-0 gap-2 h-12">
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Generate Landing Copy</>}
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        {!landingData ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary"><Layout className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Landing page copy</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Generate conversion-focused copy: hero, features, FAQs, social proof, and CTAs.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Landing Page Copy</h2>
              <Button variant="outline" size="sm" className="gap-1" onClick={copyAll}><Copy className="h-3 w-3" /> Copy All</Button>
            </div>

            {/* Hero */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-3">
                <span className="font-display text-sm font-semibold text-foreground">Hero Section</span>
                <div className="rounded-lg bg-secondary/50 p-4 text-center space-y-2">
                  <h3 className="text-xl font-bold text-foreground">{landingData.hero_headline}</h3>
                  <p className="text-sm text-muted-foreground">{landingData.hero_subheadline}</p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => copyToClipboard(`${landingData.hero_headline}\n${landingData.hero_subheadline}`)}><Copy className="h-3 w-3" /> Copy Hero</Button>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /><span className="font-display text-sm font-semibold text-foreground">Features</span></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {landingData.features.map((f, i) => (
                    <div key={i} className="rounded-lg bg-secondary/50 p-3 space-y-1">
                      <p className="text-sm font-medium text-foreground">{f.emoji} {f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Social Proof */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-3">
                <span className="font-display text-sm font-semibold text-foreground">💬 Social Proof Ideas</span>
                {landingData.social_proof_suggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                    <p className="text-sm text-foreground flex-1">{s}</p>
                    <Button variant="ghost" size="sm" className="h-6 ml-2" onClick={() => copyToClipboard(s)}><Copy className="h-3 w-3" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* FAQs */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary" /><span className="font-display text-sm font-semibold text-foreground">FAQ</span></div>
                {landingData.faqs.map((faq, i) => (
                  <div key={i} className="rounded-lg bg-secondary/50 p-3 space-y-1">
                    <p className="text-sm font-medium text-foreground">Q: {faq.question}</p>
                    <p className="text-xs text-muted-foreground">A: {faq.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* CTAs */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2"><MousePointer className="h-4 w-4 text-primary" /><span className="font-display text-sm font-semibold text-foreground">CTA Variations</span></div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {landingData.cta_variations.map((cta, i) => (
                    <button key={i} onClick={() => copyToClipboard(cta)} className="rounded-lg bg-primary/10 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">{cta}</button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
