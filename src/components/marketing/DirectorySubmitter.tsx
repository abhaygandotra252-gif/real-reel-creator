import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, RefreshCw, ExternalLink, FolderOpen, Lightbulb, Tag } from "lucide-react";

type Listing = {
  directory: string;
  one_liner: string;
  full_description: string;
  category_tags: string[];
  submission_tip: string;
};

const DIRECTORIES = [
  { id: "betalist", name: "BetaList", url: "https://betalist.com/submit", desc: "Early adopter directory" },
  { id: "alternativeto", name: "AlternativeTo", url: "https://alternativeto.net/manage-apps/", desc: "\"Alternatives to X\" listings" },
  { id: "saashub", name: "SaaSHub", url: "https://www.saashub.com/submit", desc: "SaaS discovery platform" },
  { id: "theresanai", name: "There's An AI For That", url: "https://theresanaiforthat.com/submit/", desc: "AI tool directory" },
  { id: "capterra", name: "Capterra", url: "https://www.capterra.com/vendors/sign-up", desc: "B2B software reviews" },
  { id: "g2", name: "G2", url: "https://sell.g2.com/", desc: "Enterprise software reviews" },
  { id: "microlaunch", name: "Microlaunch", url: "https://microlaunch.net/submit", desc: "Daily product launches" },
  { id: "launchingnext", name: "Launching Next", url: "https://www.launchingnext.com/submit/", desc: "Startup directory" },
  { id: "betapage", name: "BetaPage", url: "https://betapage.co/submit-startup", desc: "Beta product directory" },
  { id: "startupbase", name: "StartupBase", url: "https://startupbase.io/submit", desc: "Curated startup directory" },
  { id: "producthunt", name: "Product Hunt", url: "https://www.producthunt.com/posts/new", desc: "The launch platform" },
  { id: "toolify", name: "Toolify", url: "https://www.toolify.ai/submit", desc: "AI tools directory" },
];

export function DirectorySubmitter() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [selectedDirs, setSelectedDirs] = useState<string[]>(["betalist", "alternativeto", "saashub", "producthunt"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const toggleDir = (id: string) => {
    setSelectedDirs(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedDirs(DIRECTORIES.map(d => d.id));
  const deselectAll = () => setSelectedDirs([]);

  const handleGenerate = async () => {
    const product = products?.find((p) => p.id === productId);
    if (!product) { toast({ title: "Select a product first", variant: "destructive" }); return; }
    if (selectedDirs.length === 0) { toast({ title: "Select at least one directory", variant: "destructive" }); return; }
    setIsGenerating(true);
    try {
      const dirNames = selectedDirs.map(id => DIRECTORIES.find(d => d.id === id)?.name).filter(Boolean);
      const { data, error } = await supabase.functions.invoke("generate-directory-listing", {
        body: { product_name: product.name, product_description: product.description, key_features: product.key_features, benefits: product.benefits, directories: dirNames },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setListings(data.listings);
      toast({ title: "Directory listings generated" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally { setIsGenerating(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const getDirectoryUrl = (dirName: string) => {
    const dir = DIRECTORIES.find(d => d.name.toLowerCase() === dirName.toLowerCase());
    return dir?.url || "#";
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><CardTitle className="font-display text-lg">Directory Submissions</CardTitle></CardHeader>
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
                <Label>Directories</Label>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-primary hover:underline">All</button>
                  <button onClick={deselectAll} className="text-xs text-muted-foreground hover:underline">None</button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {DIRECTORIES.map((dir) => (
                  <label key={dir.id} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-all ${selectedDirs.includes(dir.id) ? "border-primary bg-primary/5" : "border-border bg-secondary/30 hover:border-primary/20"}`}>
                    <Checkbox checked={selectedDirs.includes(dir.id)} onCheckedChange={() => toggleDir(dir.id)} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{dir.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">{dir.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !productId || selectedDirs.length === 0} className="w-full gradient-primary border-0 gap-2 h-12">
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Generate Listings</>}
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        {listings.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary"><FolderOpen className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Submit to directories</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Generate submission-ready profiles for 12+ startup and product directories. Copy the text, click the link, paste, and submit.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Directory Listings ({listings.length})</h2>
            {listings.map((listing, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-foreground">{listing.directory}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => copyToClipboard(`${listing.one_liner}\n\n${listing.full_description}`)}>
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                      <a href={getDirectoryUrl(listing.directory)} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1"><ExternalLink className="h-3 w-3" /> Submit</Button>
                      </a>
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3 space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">One-liner</span>
                      <p className="text-sm font-medium text-foreground">{listing.one_liner}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Description</span>
                      <p className="text-sm text-foreground whitespace-pre-line">{listing.full_description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.category_tags.map((tag, j) => (
                      <span key={j} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        <Tag className="h-2.5 w-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-start gap-1.5 rounded-lg bg-secondary/50 p-2.5 text-xs text-muted-foreground">
                    <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>{listing.submission_tip}</span>
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
