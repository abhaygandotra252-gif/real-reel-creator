import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, RefreshCw, Rocket, Lightbulb } from "lucide-react";

type Section = { label: string; content: string; char_count: number; tip: string };

const PLATFORMS = [
  { value: "producthunt", label: "Product Hunt" },
  { value: "reddit", label: "Reddit" },
  { value: "hackernews", label: "Hacker News" },
  { value: "indiehackers", label: "Indie Hackers" },
];

export function LaunchCopyGenerator() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [platform, setPlatform] = useState("producthunt");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);

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
      const { data, error } = await supabase.functions.invoke("generate-launch-copy", {
        body: { product_name: product.name, product_description: product.description, key_features: product.key_features, benefits: product.benefits, platform },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setSections(data.sections);
      toast({ title: "Launch copy ready" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const copyAll = () => {
    const all = sections.map(s => `## ${s.label}\n${s.content}`).join("\n\n");
    navigator.clipboard.writeText(all);
    toast({ title: "All sections copied" });
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
      <div className="space-y-4 md:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Launch Platform</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Platform</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p.value} onClick={() => setPlatform(p.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${platform === p.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"}`}>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !productId} className="w-full gradient-primary border-0 gap-2 h-12">
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Generate Launch Copy</>}
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        {sections.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary"><Rocket className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Launch everywhere</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Generate ready-to-post copy for Product Hunt, Reddit, Hacker News, and Indie Hackers.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Launch Copy</h2>
              <Button variant="outline" size="sm" className="gap-1" onClick={copyAll}><Copy className="h-3 w-3" /> Copy All</Button>
            </div>
            {sections.map((s, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-foreground">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{s.char_count} chars</span>
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => copyToClipboard(s.content)}><Copy className="h-3 w-3" /> Copy</Button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-line">{s.content}</p>
                  <div className="flex items-start gap-1.5 rounded-lg bg-secondary/50 p-2.5 text-xs text-muted-foreground">
                    <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>{s.tip}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
