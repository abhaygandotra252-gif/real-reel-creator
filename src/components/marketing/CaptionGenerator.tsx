import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, RefreshCw, Clock, Hash, MessageSquare } from "lucide-react";

type Caption = {
  angle: string;
  caption: string;
  hashtags: string[];
  best_posting_time: string;
};

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
];

export function CaptionGenerator() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);

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
      const { data, error } = await supabase.functions.invoke("generate-captions", {
        body: {
          product_name: product.name,
          product_description: product.description,
          key_features: product.key_features,
          benefits: product.benefits,
          platform,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setCaptions(data.captions);
      toast({ title: "Captions generated! ✍️" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard! 📋" });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Caption Settings</CardTitle>
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
              <Label>Platform</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                      platform === p.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !productId}
              className="w-full gradient-primary border-0 gap-2 h-12"
            >
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Generate Captions</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        {captions.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">AI-powered captions</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Get 3 unique caption variations with hashtags and optimal posting times for any platform.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Generated Captions</h2>
            {captions.map((cap, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">{cap.angle}</span>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => copyToClipboard(`${cap.caption}\n\n${cap.hashtags.join(" ")}`)}>
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-line">{cap.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {cap.hashtags.map((h, j) => (
                      <span key={j} className="inline-flex items-center gap-0.5 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        <Hash className="h-2.5 w-2.5" />{h.replace("#", "")}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> Best time: {cap.best_posting_time}
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
