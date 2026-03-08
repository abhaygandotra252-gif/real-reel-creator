import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, RefreshCw, Zap, Lightbulb, Target, ChevronRight } from "lucide-react";

type Step = { step_number: number; title: string; description: string; template: string };
type Playbook = {
  tactic_name: string; overview: string; steps: Step[];
  pro_tips: string[]; expected_results: string;
};

const TACTICS = [
  { value: "cold-value-dms", label: "Cold Value DMs", desc: "Reach people complaining about the problem you solve" },
  { value: "strategic-commenting", label: "Strategic Commenting", desc: "Add value on high-traffic content in your niche" },
  { value: "quora-answers", label: "Quora / SO Answers", desc: "Answer questions your product solves" },
  { value: "community-seeding", label: "Community Seeding", desc: "Introduce your product in Slack, Discord, FB groups" },
  { value: "partnership-pitches", label: "Partnership Pitches", desc: "Co-marketing with complementary products" },
  { value: "micro-influencer", label: "Micro-Influencer Briefs", desc: "Collaborate with small, high-trust creators" },
];

export function GrowthHacks() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [tactic, setTactic] = useState("cold-value-dms");
  const [isGenerating, setIsGenerating] = useState(false);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);

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
      const { data, error } = await supabase.functions.invoke("generate-growth-hacks", {
        body: { product_name: product.name, product_description: product.description, key_features: product.key_features, benefits: product.benefits, tactic },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setPlaybook(data);
      toast({ title: "Playbook generated" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const copyAll = () => {
    if (!playbook) return;
    const all = [
      `# ${playbook.tactic_name}`,
      playbook.overview,
      "",
      ...playbook.steps.map(s => `## Step ${s.step_number}: ${s.title}\n${s.description}\n\nTemplate:\n${s.template}`),
      "",
      "## Pro Tips",
      ...playbook.pro_tips.map(t => `- ${t}`),
      "",
      `## Expected Results\n${playbook.expected_results}`,
    ].join("\n");
    navigator.clipboard.writeText(all);
    toast({ title: "Full playbook copied" });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Growth Tactics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>{products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tactic</Label>
              <div className="mt-2 grid grid-cols-1 gap-1.5">
                {TACTICS.map((t) => (
                  <button key={t.value} onClick={() => setTactic(t.value)}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-all ${tactic === t.value ? "border-primary bg-primary/10" : "border-border bg-secondary/30 hover:border-primary/20"}`}>
                    <ChevronRight className={`h-4 w-4 mt-0.5 shrink-0 transition-transform ${tactic === t.value ? "text-primary rotate-90" : "text-muted-foreground"}`} />
                    <div>
                      <span className="text-sm font-medium text-foreground">{t.label}</span>
                      <span className="block text-xs text-muted-foreground">{t.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !productId} className="w-full gradient-primary border-0 gap-2 h-12">
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Generate Playbook</>}
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        {!playbook ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary"><Zap className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Unconventional growth playbooks</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Tactics most founders overlook. Get step-by-step playbooks with ready-to-use templates for cold DMs, strategic commenting, community seeding, and more.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">{playbook.tactic_name}</h2>
              <Button variant="outline" size="sm" className="gap-1" onClick={copyAll}><Copy className="h-3 w-3" /> Copy All</Button>
            </div>
            <p className="text-sm text-muted-foreground">{playbook.overview}</p>

            {playbook.steps.map((step, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{step.step_number}</div>
                      <span className="font-display text-sm font-semibold text-foreground">{step.title}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => copyToClipboard(step.template)}><Copy className="h-3 w-3" /> Copy</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <span className="text-xs text-muted-foreground mb-1 block">Template</span>
                    <p className="text-sm text-foreground whitespace-pre-line font-mono">{step.template}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {playbook.pro_tips.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /><span className="font-display text-sm font-semibold text-foreground">Pro Tips</span></div>
                  <ul className="space-y-1.5">
                    {playbook.pro_tips.map((tip, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span>-</span><span>{tip}</span></li>)}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><span className="font-display text-sm font-semibold text-foreground">Expected Results</span></div>
                <p className="text-sm text-muted-foreground">{playbook.expected_results}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
