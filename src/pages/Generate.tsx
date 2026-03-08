import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, Save, RefreshCw, Film, Megaphone, Camera, MessageSquareQuote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VIDEO_STYLES = [
  { value: "product-review", label: "Product Review", icon: Megaphone, desc: "\"I tried this and here's what happened...\"" },
  { value: "unboxing", label: "Unboxing", icon: Camera, desc: "\"Let me show you what's inside...\"" },
  { value: "tutorial", label: "Tutorial / How-to", icon: Film, desc: "\"Here's how I use this every day...\"" },
  { value: "testimonial", label: "Testimonial", icon: MessageSquareQuote, desc: "\"This changed my life, honestly...\"" },
];

const TONES = ["casual", "enthusiastic", "professional", "relatable"];
const DURATIONS = ["15s", "30s", "60s", "90s"];

type GeneratedScript = {
  title: string;
  hook: string;
  body: string;
  cta: string;
  storyboard: { scene: string; direction: string; duration: string }[];
};

export default function Generate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState("");
  const [style, setStyle] = useState("");
  const [tone, setTone] = useState("casual");
  const [duration, setDuration] = useState("60s");
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("name");
      return data ?? [];
    },
  });

  const selectedProduct = products?.find(p => p.id === productId);

  const generate = async () => {
    if (!productId || !style) {
      toast({ title: "Select a product and video style", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setScript(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-script", {
        body: {
          product: selectedProduct,
          video_style: style,
          tone,
          duration,
        },
      });
      if (error) throw error;
      setScript(data);
      toast({ title: "Script generated! 🎬" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveScript = useMutation({
    mutationFn: async () => {
      if (!script) return;
      const { error } = await supabase.from("scripts").insert({
        product_id: productId,
        title: script.title,
        video_style: style,
        tone,
        duration,
        hook: script.hook,
        body: script.body,
        cta: script.cta,
        storyboard: script.storyboard as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      toast({ title: "Script saved to library! 📚" });
    },
    onError: () => toast({ title: "Error saving script", variant: "destructive" }),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const fullScriptText = script ? `HOOK:\n${script.hook}\n\nBODY:\n${script.body}\n\nCTA:\n${script.cta}` : "";

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">Generate Script</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 md:mb-8">AI-powered UGC script generator for authentic, converting content</p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          {/* Config Panel */}
          <div className="space-y-6 md:col-span-2">
            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="font-display text-lg">Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {/* Product */}
                <div>
                  <Label>Product</Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a product" /></SelectTrigger>
                    <SelectContent>
                      {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {products?.length === 0 && <p className="mt-1 text-xs text-muted-foreground">No products yet. Add one first!</p>}
                </div>

                {/* Style */}
                <div>
                  <Label>Video Style</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {VIDEO_STYLES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setStyle(s.value)}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                          style === s.value
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <s.icon className="h-4 w-4" />
                        <span className="text-xs font-medium">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone */}
                <div>
                  <Label>Tone</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TONES.map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                          tone === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <Label>Duration</Label>
                  <div className="mt-2 flex gap-2">
                    {DURATIONS.map(d => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          duration === d ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={generate} disabled={isGenerating || !productId || !style} className="w-full gradient-primary border-0 gap-2 text-base h-12">
                  {isGenerating ? (
                    <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="h-5 w-5" /> Generate Script</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Script Output */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card className="border-border bg-card animate-pulse-glow">
                    <CardContent className="flex flex-col items-center justify-center py-24">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
                        <Sparkles className="h-8 w-8 text-primary-foreground animate-pulse" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground">Crafting your script...</h3>
                      <p className="mt-1 text-sm text-muted-foreground">AI is writing an authentic UGC script</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : script ? (
                <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Title + Actions */}
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-foreground">{script.title}</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => copyToClipboard(fullScriptText)}>
                        <Copy className="h-4 w-4" /> Copy All
                      </Button>
                      <Button size="sm" className="gradient-primary border-0 gap-1" onClick={() => saveScript.mutate()} disabled={saveScript.isPending}>
                        <Save className="h-4 w-4" /> Save
                      </Button>
                    </div>
                  </div>

                  {/* Hook */}
                  <Card className="border-accent/30 bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-accent">🎣 HOOK</CardTitle>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(script.hook)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent><p className="text-foreground font-medium">{script.hook}</p></CardContent>
                  </Card>

                  {/* Body */}
                  <Card className="border-primary/30 bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-primary">📝 BODY</CardTitle>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(script.body)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent><p className="text-foreground whitespace-pre-line">{script.body}</p></CardContent>
                  </Card>

                  {/* CTA */}
                  <Card className="border-border bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gradient-primary">🎯 CALL TO ACTION</CardTitle>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(script.cta)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent><p className="text-foreground font-semibold">{script.cta}</p></CardContent>
                  </Card>

                  {/* Storyboard */}
                  {script.storyboard?.length > 0 && (
                    <Card className="border-border bg-card">
                      <CardHeader><CardTitle className="font-display text-base">🎬 Shot-by-Shot Storyboard</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {script.storyboard.map((shot, i) => (
                            <div key={i} className="flex gap-4 rounded-lg border border-border bg-secondary/30 p-3">
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-foreground">{shot.scene}</p>
                                  <span className="text-xs text-muted-foreground">{shot.duration}</span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">{shot.direction}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Regenerate */}
                  <Button variant="outline" className="w-full gap-2" onClick={generate}>
                    <RefreshCw className="h-4 w-4" /> Regenerate Script
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="border-dashed border-border bg-card">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                      <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="font-display text-xl font-semibold text-foreground">Ready to create</h3>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Select a product, choose your video style and tone, then hit generate. AI will craft an authentic UGC script with hooks, body, CTA, and visual directions.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
