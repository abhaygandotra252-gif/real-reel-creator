import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, RefreshCw, AtSign } from "lucide-react";

type XPost = {
  content: string;
  char_count: number;
  niche: string;
  angle: string;
};

const NICHES = [
  { value: "all", label: "All Niches" },
  { value: "startups", label: "Startups" },
  { value: "products", label: "Products" },
  { value: "marketing", label: "Marketing" },
];

export function XPostMaker() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [niche, setNiche] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState<XPost[]>([]);

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
      const { data, error } = await supabase.functions.invoke("generate-x-posts", {
        body: {
          product_name: product.name,
          product_description: product.description,
          key_features: product.key_features,
          benefits: product.benefits,
          niche,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setPosts(data.posts);
      toast({ title: `${data.posts.length} posts generated` });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const handleGenerateMore = async () => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-x-posts", {
        body: {
          product_name: product.name,
          product_description: product.description,
          key_features: product.key_features,
          benefits: product.benefits,
          niche,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setPosts((prev) => [...prev, ...data.posts]);
      toast({ title: `${data.posts.length} more posts added` });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
      <div className="space-y-4 md:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><CardTitle className="font-display text-lg">X Post Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Niche</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {NICHES.map((n) => (
                  <button key={n.value} onClick={() => setNiche(n.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${niche === n.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"}`}>
                    <span>{n.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !productId} className="w-full gradient-primary border-0 gap-2 h-12">
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Generate Posts</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-3">
        {posts.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <AtSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">X post maker</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Generate reach-focused X posts. No emojis, no AI fluff. Just sharp posts that get engagement.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">{posts.length} Posts</h2>
              <Button variant="outline" size="sm" className="gap-1" onClick={handleGenerateMore} disabled={isGenerating}>
                {isGenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Generate More
              </Button>
            </div>
            {posts.map((post, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${post.char_count > 280 ? "text-destructive" : "text-muted-foreground"}`}>
                          {post.char_count}/280
                        </span>
                        <Badge variant="outline" className="text-xs">{post.niche}</Badge>
                        <span className="text-xs text-muted-foreground">{post.angle}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 h-7" onClick={() => copyToClipboard(post.content)}>
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
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
