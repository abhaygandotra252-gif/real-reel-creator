import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, Search, Users, MessageSquare, Target, ListChecks } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  target_audience: string | null;
  niche_category: string | null;
  benefits: string[] | null;
};

const PLATFORMS = [
  { value: "twitter", label: "Twitter / X" },
  { value: "reddit", label: "Reddit" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "quora", label: "Quora" },
  { value: "indie_hackers", label: "Indie Hackers" },
];

export function ProspectFinder() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [platform, setPlatform] = useState("");
  const [customIcp, setCustomIcp] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    supabase.from("products").select("id, name, description, target_audience, niche_category, benefits").then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleGenerate = async () => {
    if (!selectedProduct || !platform) {
      toast.error("Select a product and platform first");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-prospect-search", {
        body: {
          productName: product.name,
          productDescription: product.description,
          targetAudience: product.target_audience,
          nicheCategory: product.niche_category,
          benefits: product.benefits,
          platform,
          customIcp: customIcp || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate prospect playbook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">ICP Prospect Finder</CardTitle>
          <CardDescription>
            Generate platform-specific search queries, prospect personas, and outreach templates to find your ideal customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue placeholder="Select a platform" /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Custom ICP Criteria (optional)</Label>
            <Textarea
              placeholder="e.g. solo founders building SaaS, freelance designers struggling with invoicing"
              value={customIcp}
              onChange={(e) => setCustomIcp(e.target.value)}
              rows={2}
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading || !selectedProduct || !platform} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Playbook...</> : "Generate Prospect Playbook"}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Tabs defaultValue="queries" className="space-y-4">
          <TabsList className="bg-secondary/50 border border-border inline-flex w-max">
            <TabsTrigger value="queries" className="gap-1.5 px-2 sm:px-3"><Search className="h-4 w-4" /> <span className="hidden sm:inline">Search Queries</span></TabsTrigger>
            <TabsTrigger value="signals" className="gap-1.5 px-2 sm:px-3"><Target className="h-4 w-4" /> <span className="hidden sm:inline">ICP Signals</span></TabsTrigger>
            <TabsTrigger value="personas" className="gap-1.5 px-2 sm:px-3"><Users className="h-4 w-4" /> <span className="hidden sm:inline">Personas</span></TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5 px-2 sm:px-3"><MessageSquare className="h-4 w-4" /> <span className="hidden sm:inline">DM Templates</span></TabsTrigger>
            <TabsTrigger value="playbook" className="gap-1.5 px-2 sm:px-3"><ListChecks className="h-4 w-4" /> <span className="hidden sm:inline">Playbook</span></TabsTrigger>
          </TabsList>

          <TabsContent value="queries">
            <div className="space-y-3">
              {results.searchQueries?.map((q: any, i: number) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="p-3 sm:p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <code className="text-xs sm:text-sm font-mono bg-muted px-2 py-1 rounded break-all text-foreground">{q.query}</code>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(q.query)} className="shrink-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{q.description}</p>
                    <p className="text-xs text-muted-foreground/70">Expected results: {q.expectedResults}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="signals">
            <div className="space-y-3">
              {results.icpSignals?.map((s: any, i: number) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.signal}</p>
                        <p className="text-sm text-muted-foreground mt-1">{s.why}</p>
                      </div>
                      <Badge variant={s.priority === "high" ? "default" : s.priority === "medium" ? "secondary" : "outline"}>
                        {s.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="personas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.prospectPersonas?.map((p: any, i: number) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.title}</p>
                    </div>
                    <p className="text-sm text-foreground">{p.background}</p>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Pain points</p>
                      <ul className="text-sm space-y-1">
                        {p.painPoints?.map((pp: string, j: number) => (
                          <li key={j} className="text-foreground">- {pp}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Where to find them</p>
                      <p className="text-sm text-foreground">{p.whereToFind}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Typical post</p>
                      <p className="text-sm italic text-muted-foreground">"{p.typicalPost}"</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="space-y-4">
              {results.dmTemplates?.map((t: any, i: number) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline">{t.scenario}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(t.message)} className="shrink-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {t.subject && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Subject</p>
                        <p className="text-sm text-foreground">{t.subject}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Message</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{t.message}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Follow-up (3-5 days later)</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.followUp}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="playbook">
            <Card className="border-border bg-card">
              <CardContent className="p-3 sm:p-4 space-y-4">
                {results.engagementPlaybook?.map((step: any, i: number) => (
                  <div key={i} className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {step.step}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{step.action}</p>
                        <Badge variant="outline" className="text-xs">{step.timing}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.details}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
