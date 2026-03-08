import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, RefreshCw, Search, FileText, Image as ImageIcon, Globe } from "lucide-react";

type BlogIdea = { title: string; target_keyword: string; outline: string[] };
type SEOData = {
  meta_title: string; meta_description: string; og_title: string; og_description: string;
  alt_texts: string[]; blog_ideas: BlogIdea[];
};

export function SEOGenerator() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [seoData, setSeoData] = useState<SEOData | null>(null);

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
      const { data, error } = await supabase.functions.invoke("generate-seo", {
        body: { product_name: product.name, product_description: product.description, key_features: product.key_features, benefits: product.benefits },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setSeoData(data);
      toast({ title: "SEO content generated" });
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
          <CardHeader className="pb-3"><CardTitle className="font-display text-lg">SEO Generator</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !productId} className="w-full gradient-primary border-0 gap-2 h-12">
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Generate SEO Content</>}
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        {!seoData ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary"><Search className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">SEO content suite</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Generate meta tags, blog ideas, OG text, and image alt text — everything for organic growth.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">SEO Assets</h2>

            {/* Meta Tags */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /><span className="font-display text-sm font-semibold text-foreground">Meta Tags</span></div>
                <div className="space-y-2">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center justify-between mb-1"><span className="text-xs text-muted-foreground">Title ({seoData.meta_title.length} chars)</span>
                      <Button variant="ghost" size="sm" className="h-6 gap-1" onClick={() => copyToClipboard(seoData.meta_title)}><Copy className="h-3 w-3" /></Button>
                    </div>
                    <p className="text-sm font-medium text-foreground">{seoData.meta_title}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center justify-between mb-1"><span className="text-xs text-muted-foreground">Description ({seoData.meta_description.length} chars)</span>
                      <Button variant="ghost" size="sm" className="h-6 gap-1" onClick={() => copyToClipboard(seoData.meta_description)}><Copy className="h-3 w-3" /></Button>
                    </div>
                    <p className="text-sm text-foreground">{seoData.meta_description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* OG Tags */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /><span className="font-display text-sm font-semibold text-foreground">Open Graph</span></div>
                <div className="space-y-2">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center justify-between mb-1"><span className="text-xs text-muted-foreground">OG Title</span>
                      <Button variant="ghost" size="sm" className="h-6 gap-1" onClick={() => copyToClipboard(seoData.og_title)}><Copy className="h-3 w-3" /></Button>
                    </div>
                    <p className="text-sm font-medium text-foreground">{seoData.og_title}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center justify-between mb-1"><span className="text-xs text-muted-foreground">OG Description</span>
                      <Button variant="ghost" size="sm" className="h-6 gap-1" onClick={() => copyToClipboard(seoData.og_description)}><Copy className="h-3 w-3" /></Button>
                    </div>
                    <p className="text-sm text-foreground">{seoData.og_description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alt Texts */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /><span className="font-display text-sm font-semibold text-foreground">Image Alt Text</span></div>
                {seoData.alt_texts.map((alt, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                    <p className="text-sm text-foreground flex-1">{alt}</p>
                    <Button variant="ghost" size="sm" className="h-6 gap-1 ml-2" onClick={() => copyToClipboard(alt)}><Copy className="h-3 w-3" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Blog Ideas */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="font-display text-sm font-semibold text-foreground">Blog Post Ideas</span></div>
                {seoData.blog_ideas.map((blog, i) => (
                  <div key={i} className="rounded-lg bg-secondary/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{blog.title}</p>
                      <Button variant="ghost" size="sm" className="h-6 gap-1" onClick={() => copyToClipboard(`${blog.title}\n\nKeyword: ${blog.target_keyword}\n\nOutline:\n${blog.outline.map((o, j) => `${j + 1}. ${o}`).join("\n")}`)}><Copy className="h-3 w-3" /></Button>
                    </div>
                    <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{blog.target_keyword}</span>
                    <ul className="space-y-1 ml-4">
                      {blog.outline.map((item, j) => <li key={j} className="text-xs text-muted-foreground list-disc">{item}</li>)}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
