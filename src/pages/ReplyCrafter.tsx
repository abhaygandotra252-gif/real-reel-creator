import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, Link2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

type Product = {
  id: string;
  name: string;
  description: string | null;
  benefits: string[] | null;
};

export default function ReplyCrafter() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [replyUrl, setReplyUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    supabase.from("products").select("id, name, description, benefits").then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  const handleCraft = async () => {
    if (!replyUrl || !selectedProduct) {
      toast.error("Select a product and paste a URL");
      return;
    }
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    setLoading(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-reply", {
        body: {
          url: replyUrl,
          productName: product.name,
          productDescription: product.description,
          benefits: product.benefits,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to craft reply");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">Reply Crafter</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">
          Paste any post, comment, or profile URL. Get a humanized reply that sounds like you actually wrote it.
        </p>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Input Panel */}
          <Card className="border-border bg-card h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Craft a Reply
              </CardTitle>
              <CardDescription>Select your product, paste the URL, and hit craft.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger><SelectValue placeholder="Select a product..." /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Post or Profile URL</Label>
                <Input
                  placeholder="https://twitter.com/user/status/..."
                  value={replyUrl}
                  onChange={(e) => setReplyUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Works with Twitter/X, Reddit, LinkedIn, Quora, Indie Hackers, and more.
                </p>
              </div>

              <Button
                onClick={handleCraft}
                disabled={loading || !replyUrl || !selectedProduct}
                className="w-full gap-2"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Crafting...</> : <><Link2 className="h-4 w-4" /> Craft Reply</>}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="space-y-4">
            {!results && !loading && (
              <Card className="border-border bg-card">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Paste a URL and craft your first reply</p>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card className="border-border bg-card">
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Scraping content and crafting replies...</p>
                </CardContent>
              </Card>
            )}

            {results?.replies?.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {results.platform_detected && (
                    <Badge variant="outline">{results.platform_detected}</Badge>
                  )}
                  <Badge variant={results.is_profile ? "secondary" : "default"}>
                    {results.is_profile ? "Profile DM" : "Post Reply"}
                  </Badge>
                </div>

                {results.replies.map((reply: any, i: number) => (
                  <Card key={i} className="border-border bg-card">
                    <CardContent className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">{reply.label}</Badge>
                        <Button variant="secondary" size="sm" onClick={() => copy(reply.content)} className="gap-1.5 shrink-0">
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </Button>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                      <p className="text-xs text-muted-foreground">References: {reply.context_used}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
