import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, RefreshCw, Twitter } from "lucide-react";

type Tweet = { number: number; content: string; char_count: number };

const THREAD_TYPES = [
  { value: "launch", label: "Product Launch", icon: "🚀" },
  { value: "build-in-public", label: "Build in Public", icon: "🔨" },
  { value: "how-i-built", label: "How I Built This", icon: "⚙️" },
  { value: "tips", label: "Tips & Value", icon: "💡" },
];

export function ThreadBuilder() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [threadType, setThreadType] = useState("launch");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tweets, setTweets] = useState<Tweet[]>([]);

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
      const { data, error } = await supabase.functions.invoke("generate-thread", {
        body: { product_name: product.name, product_description: product.description, key_features: product.key_features, benefits: product.benefits, thread_type: threadType },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setTweets(data.tweets);
      toast({ title: "Thread ready! 🧵" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied! 📋" });
  };

  const copyThread = () => {
    const all = tweets.map(t => `${t.number}/ ${t.content}`).join("\n\n");
    navigator.clipboard.writeText(all);
    toast({ title: "Full thread copied! 🧵" });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Thread Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Thread Type</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {THREAD_TYPES.map((t) => (
                  <button key={t.value} onClick={() => setThreadType(t.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${threadType === t.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"}`}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !productId} className="w-full gradient-primary border-0 gap-2 h-12">
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Build Thread</>}
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        {tweets.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary"><Twitter className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Viral thread builder</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Generate scroll-stopping Twitter/X threads with hooks, stories, and CTAs.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Your Thread ({tweets.length} tweets)</h2>
              <Button variant="outline" size="sm" className="gap-1" onClick={copyThread}><Copy className="h-3 w-3" /> Copy Thread</Button>
            </div>
            {tweets.map((t, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{t.number}</div>
                      {i < tweets.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-foreground">{t.content}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${t.char_count > 280 ? "text-destructive" : "text-muted-foreground"}`}>{t.char_count}/280</span>
                        <Button variant="ghost" size="sm" className="gap-1 h-7" onClick={() => copyToClipboard(t.content)}><Copy className="h-3 w-3" /> Copy</Button>
                      </div>
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
