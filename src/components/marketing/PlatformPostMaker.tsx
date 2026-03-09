import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, RefreshCw, MessageCircle } from "lucide-react";

const ALL_PLATFORMS = [
  "Reddit",
  "Hacker News",
  "Indie Hackers",
  "Dev.to",
  "Product Hunt",
  "BetaList",
  "Lobsters",
  "Slashdot",
  "Twitter/X Community",
  "LinkedIn",
  "Facebook Groups",
  "Quora",
];

type PlatformPost = {
  name: string;
  post_title: string;
  post_body: string;
  tips: string;
  subreddit_suggestions?: string[];
};

export function PlatformPostMaker() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([...ALL_PLATFORMS]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState<PlatformPost[]>([]);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    const product = products?.find((p) => p.id === productId);
    if (!product) { toast({ title: "Select a product first", variant: "destructive" }); return; }
    if (selectedPlatforms.length === 0) { toast({ title: "Select at least one platform", variant: "destructive" }); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-platform-posts", {
        body: {
          product_name: product.name,
          product_description: product.description,
          key_features: product.key_features,
          benefits: product.benefits,
          target_audience: product.target_audience,
          platforms: selectedPlatforms,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setPosts(data.platforms);
      toast({ title: `Posts generated for ${data.platforms.length} platforms` });
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">Platform Settings</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {ALL_PLATFORMS.length} platforms available
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Platforms</Label>
                <button
                  onClick={() => setSelectedPlatforms(selectedPlatforms.length === ALL_PLATFORMS.length ? [] : [...ALL_PLATFORMS])}
                  className="text-xs text-primary hover:underline"
                >
                  {selectedPlatforms.length === ALL_PLATFORMS.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {ALL_PLATFORMS.map((platform) => (
                  <label key={platform} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={() => togglePlatform(platform)}
                    />
                    <span className="text-sm text-foreground">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !productId || selectedPlatforms.length === 0} className="w-full gradient-primary border-0 gap-2 h-12">
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
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Multi-platform post maker</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Generate tailored posts for Reddit, Hacker News, Indie Hackers, Dev.to, and {ALL_PLATFORMS.length - 4} more platforms.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Generated for {posts.length} platforms
            </h2>
            {posts.map((post, i) => (
              <Card key={i} className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-base">{post.name}</CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1 h-7" onClick={() => copyToClipboard(`${post.post_title}\n\n${post.post_body}`)}>
                      <Copy className="h-3 w-3" /> Copy All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Title</p>
                    <p className="text-sm font-medium text-foreground">{post.post_title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Body</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{post.post_body}</p>
                  </div>
                  {post.subreddit_suggestions && post.subreddit_suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Subreddits</p>
                      <div className="flex flex-wrap gap-1">
                        {post.subreddit_suggestions.map((sub, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{sub}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Tips</p>
                    <p className="text-xs text-muted-foreground">{post.tips}</p>
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
