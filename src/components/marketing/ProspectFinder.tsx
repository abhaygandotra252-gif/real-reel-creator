import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, Search, Users, MessageSquare, Target, ListChecks, ClipboardList, FileDown, ExternalLink, MessageCircle } from "lucide-react";
import { printAsPdf } from "@/lib/pdf-export";

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

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "Twitter / X",
  reddit: "Reddit",
  linkedin: "LinkedIn",
  quora: "Quora",
  indie_hackers: "Indie Hackers",
};

function buildCopyAllText(results: any, platformLabel: string) {
  let text = `=== PROSPECT PLAYBOOK (${platformLabel}) ===\n\n`;

  if (results.searchQueries?.length) {
    text += "--- SEARCH QUERIES ---\n";
    results.searchQueries.forEach((q: any, i: number) => {
      text += `${i + 1}. ${q.query}\n   ${q.description}\n\n`;
    });
  }

  if (results.icpSignals?.length) {
    text += "--- ICP SIGNALS ---\n";
    results.icpSignals.forEach((s: any) => {
      text += `• [${s.priority}] ${s.signal} — ${s.why}\n`;
    });
    text += "\n";
  }

  if (results.prospectPersonas?.length) {
    text += "--- PROSPECT PERSONAS ---\n";
    results.prospectPersonas.forEach((p: any) => {
      text += `${p.name} (${p.title})\n${p.background}\nPain points: ${p.painPoints?.join(", ")}\nWhere to find: ${p.whereToFind}\n\n`;
    });
  }

  if (results.dmTemplates?.length) {
    text += "--- DM TEMPLATES ---\n";
    results.dmTemplates.forEach((t: any) => {
      text += `[${t.scenario}]\n${t.subject ? `Subject: ${t.subject}\n` : ""}${t.message}\n\nFollow-up: ${t.followUp}\n\n`;
    });
  }

  if (results.engagementPlaybook?.length) {
    text += "--- ENGAGEMENT PLAYBOOK ---\n";
    results.engagementPlaybook.forEach((step: any) => {
      text += `Step ${step.step}: ${step.action} (${step.timing})\n${step.details}\n\n`;
    });
  }

  return text;
}

function buildPlaybookHtml(results: any, platformLabel: string): string {
  let html = "";

  if (results.searchQueries?.length) {
    html += `<h2>Search Queries</h2>`;
    results.searchQueries.forEach((q: any, i: number) => {
      html += `<div class="section"><h3>${i + 1}. <code>${q.query}</code></h3><p>${q.description}</p><p><em>Expected: ${q.expectedResults}</em></p></div>`;
    });
  }

  if (results.icpSignals?.length) {
    html += `<h2>ICP Signals</h2>`;
    results.icpSignals.forEach((s: any) => {
      html += `<div class="section"><p><strong>${s.signal}</strong> <span class="badge">${s.priority}</span></p><p>${s.why}</p></div>`;
    });
  }

  if (results.prospectPersonas?.length) {
    html += `<h2>Prospect Personas</h2>`;
    results.prospectPersonas.forEach((p: any) => {
      html += `<div class="section"><h3>${p.name} — ${p.title}</h3><p>${p.background}</p><p><strong>Pain points:</strong></p><ul>${p.painPoints?.map((pp: string) => `<li>${pp}</li>`).join("") || ""}</ul><p><strong>Where to find:</strong> ${p.whereToFind}</p><p class="quote">"${p.typicalPost}"</p></div>`;
    });
  }

  if (results.dmTemplates?.length) {
    html += `<h2>DM Templates</h2>`;
    results.dmTemplates.forEach((t: any) => {
      html += `<div class="section"><p class="badge">${t.scenario}</p>${t.subject ? `<p><strong>Subject:</strong> ${t.subject}</p>` : ""}<p>${t.message}</p><p><em>Follow-up:</em> ${t.followUp}</p></div>`;
    });
  }

  if (results.engagementPlaybook?.length) {
    html += `<h2>Engagement Playbook</h2>`;
    results.engagementPlaybook.forEach((step: any) => {
      html += `<div class="section"><h3>Step ${step.step}: ${step.action}</h3><p class="badge">${step.timing}</p><p>${step.details}</p></div>`;
    });
  }

  return html;
}

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

  const handleDownloadPdf = () => {
    if (!results) return;
    const html = buildPlaybookHtml(results, platformLabel);
    printAsPdf(`Prospect Playbook — ${platformLabel}`, html);
  };

  const platformLabel = PLATFORM_LABELS[platform] || platform;

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
        <div className="space-y-5">
          {/* How This Works Guide */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">How to use this playbook:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Search</p>
                    <p className="text-xs text-muted-foreground">Copy a search query below and paste it into {platformLabel}. Browse the results for matching people.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Identify</p>
                    <p className="text-xs text-muted-foreground">Use the personas & ICP signals to recognise who's a real fit vs. who isn't worth pursuing.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Engage first</p>
                    <p className="text-xs text-muted-foreground">Follow the playbook steps. Don't DM immediately — interact with their content for 2-3 days first.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Reach out</p>
                    <p className="text-xs text-muted-foreground">Use the DM templates to send a value-first message. Never hard-pitch on the first message.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copy All + Download PDF */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(buildCopyAllText(results, platformLabel))}
              className="gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              Copy Entire Playbook
            </Button>
          </div>

          <Tabs defaultValue={results.livePosts?.length ? "posts" : "queries"} className="space-y-4">
            <ScrollArea className="w-full">
              <TabsList className="bg-secondary/50 border border-border inline-flex w-max">
                {results.livePosts?.length > 0 && (
                  <TabsTrigger value="posts" className="gap-1.5 px-3"><MessageCircle className="h-4 w-4" /> Live Posts ({results.livePosts.length})</TabsTrigger>
                )}
                <TabsTrigger value="queries" className="gap-1.5 px-3"><Search className="h-4 w-4" /> Search Queries</TabsTrigger>
                <TabsTrigger value="signals" className="gap-1.5 px-3"><Target className="h-4 w-4" /> ICP Signals</TabsTrigger>
                <TabsTrigger value="personas" className="gap-1.5 px-3"><Users className="h-4 w-4" /> Personas</TabsTrigger>
                <TabsTrigger value="templates" className="gap-1.5 px-3"><MessageSquare className="h-4 w-4" /> DM Templates</TabsTrigger>
                <TabsTrigger value="playbook" className="gap-1.5 px-3"><ListChecks className="h-4 w-4" /> Playbook</TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {results.livePosts?.length > 0 && (
              <TabsContent value="posts">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Recent posts from people who could be your prospects. Click to open and engage.</p>
                  {results.livePosts.map((post: any, i: number) => {
                    const postDate = new Date(post.created_utc * 1000);
                    const daysAgo = Math.floor((Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24));
                    const timeLabel = daysAgo === 0 ? "today" : daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
                    return (
                      <Card key={i} className="border-border bg-card">
                        <CardContent className="p-3 sm:p-4 space-y-2">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
                                  {post.title}
                                </a>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{post.subreddit}</Badge>
                                  <span className="text-xs text-muted-foreground">u/{post.author}</span>
                                  <span className="text-xs text-muted-foreground">• {timeLabel}</span>
                                  <span className="text-xs text-muted-foreground">• {post.num_comments} comments</span>
                                </div>
                              </div>
                            </div>
                            {post.selftext_preview && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{post.selftext_preview}</p>
                            )}
                            <div className="flex gap-2">
                              <Button variant="secondary" size="sm" asChild className="gap-1.5 flex-1 sm:flex-none">
                                <a href={post.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5" /> Open Post
                                </a>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(post.url)} className="gap-1.5">
                                <Copy className="h-3.5 w-3.5" /> Link
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            )}

            <TabsContent value="queries">
              <div className="space-y-3">
                {results.searchQueries?.map((q: any, i: number) => (
                  <Card key={i} className="border-border bg-card">
                    <CardContent className="p-3 sm:p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1.5 rounded break-all text-foreground flex-1">{q.query}</code>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button variant="secondary" size="sm" onClick={() => copyToClipboard(q.query)} className="shrink-0 gap-1.5 flex-1 sm:flex-none">
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </Button>
                          {q.searchUrl && (
                            <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5 flex-1 sm:flex-none">
                              <a href={q.searchUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" /> Search
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{q.description}</p>
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
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{s.signal}</p>
                          <p className="text-sm text-muted-foreground mt-1">{s.why}</p>
                        </div>
                        <Badge variant={s.priority === "high" ? "default" : s.priority === "medium" ? "secondary" : "outline"} className="shrink-0">
                          {s.priority}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="personas">
              <div className="grid grid-cols-1 gap-4">
                {results.prospectPersonas?.map((p: any, i: number) => (
                  <Card key={i} className="border-border bg-card">
                    <CardContent className="p-3 sm:p-4 space-y-3">
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.title}</p>
                      </div>
                      <p className="text-sm text-foreground">{p.background}</p>
                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-xs font-semibold text-foreground mb-1.5">Pain points</p>
                        <ul className="text-sm space-y-1">
                          {p.painPoints?.map((pp: string, j: number) => (
                            <li key={j} className="text-foreground">• {pp}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Where to find them</p>
                        <p className="text-sm text-muted-foreground">{p.whereToFind}</p>
                      </div>
                      <div className="border-l-2 border-primary/30 pl-3">
                        <p className="text-xs font-semibold text-foreground mb-1">What they typically post</p>
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
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20 w-fit">{t.scenario}</Badge>
                        <Button variant="secondary" size="sm" onClick={() => copyToClipboard(t.message)} className="shrink-0 gap-1.5 w-full sm:w-auto sm:ml-auto">
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </Button>
                      </div>
                      {t.subject && (
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-xs font-semibold text-foreground">Subject line</p>
                          <p className="text-sm text-foreground mt-0.5">{t.subject}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Message</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{t.message}</p>
                      </div>
                      <div className="rounded-md bg-accent/50 p-3">
                        <p className="text-xs font-semibold text-foreground">Follow-up (send 3-5 days later)</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-0.5">{t.followUp}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="playbook">
              <Card className="border-border bg-card">
                <CardContent className="p-3 sm:p-4 space-y-1">
                  {results.engagementPlaybook?.map((step: any, i: number) => (
                    <div key={i} className="flex gap-3 sm:gap-4 relative">
                      {i < (results.engagementPlaybook?.length ?? 0) - 1 && (
                        <div className="absolute left-[14px] sm:left-[18px] top-10 bottom-0 w-px bg-border" />
                      )}
                      <div className="flex-shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs sm:text-sm font-bold z-10">
                        {step.step}
                      </div>
                      <div className="space-y-1 min-w-0 pb-5">
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2">
                          <p className="text-sm font-medium text-foreground">{step.action}</p>
                          <Badge variant="outline" className="text-xs w-fit">{step.timing}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.details}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
