import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Star, Copy, Trash2, FileText, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ScriptWithProduct = {
  id: string;
  title: string;
  video_style: string;
  tone: string;
  duration: string;
  hook: string | null;
  body: string | null;
  cta: string | null;
  storyboard: any;
  is_favorite: boolean | null;
  created_at: string;
  product_id: string | null;
  products: { name: string } | null;
};

export default function Scripts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStyle, setFilterStyle] = useState("all");
  const [selectedScript, setSelectedScript] = useState<ScriptWithProduct | null>(null);

  const { data: scripts, isLoading } = useQuery({
    queryKey: ["scripts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("scripts")
        .select("*, products(name)")
        .order("created_at", { ascending: false });
      return (data ?? []) as ScriptWithProduct[];
    },
  });

  const toggleFav = useMutation({
    mutationFn: async ({ id, fav }: { id: string; fav: boolean }) => {
      await supabase.from("scripts").update({ is_favorite: fav }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scripts"] }),
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("scripts").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      toast({ title: "Script deleted" });
    },
  });

  const copyScript = (s: ScriptWithProduct) => {
    const text = `HOOK:\n${s.hook}\n\nBODY:\n${s.body}\n\nCTA:\n${s.cta}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const filtered = scripts?.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.products?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStyle = filterStyle === "all" || s.video_style === filterStyle;
    return matchSearch && matchStyle;
  }) ?? [];

  const styleLabel = (s: string) => s.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">Script Library</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">Browse and manage all your generated scripts</p>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search scripts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStyle} onValueChange={setFilterStyle}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Styles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Styles</SelectItem>
              <SelectItem value="product-review">Product Review</SelectItem>
              <SelectItem value="unboxing">Unboxing</SelectItem>
              <SelectItem value="tutorial">Tutorial</SelectItem>
              <SelectItem value="testimonial">Testimonial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="animate-pulse border-border bg-card"><CardContent className="h-24 p-4" /></Card>)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="font-display text-lg font-medium text-foreground">No scripts found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Generate your first script to see it here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card
                  className="group cursor-pointer border-border bg-card hover:border-primary/30 transition-all"
                  onClick={() => setSelectedScript(s)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{s.title}</h4>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {s.products?.name && <span className="text-foreground/70">{s.products.name}</span>}
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{styleLabel(s.video_style)}</span>
                        <span>{s.duration}</span>
                        <span className="capitalize">{s.tone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); toggleFav.mutate({ id: s.id, fav: !s.is_favorite }); }}>
                        <Star className={`h-4 w-4 ${s.is_favorite ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); copyScript(s); }}>
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); deleteScript.mutate(s.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Script Detail Dialog */}
        <Dialog open={!!selectedScript} onOpenChange={() => setSelectedScript(null)}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl bg-card border-border">
            {selectedScript && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">{selectedScript.title}</DialogTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{styleLabel(selectedScript.video_style)}</span>
                    <span>{selectedScript.duration}</span>
                    <span className="capitalize">{selectedScript.tone}</span>
                    {selectedScript.products?.name && <span>• {selectedScript.products.name}</span>}
                  </div>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  {selectedScript.hook && (
                    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                      <p className="text-xs font-semibold text-accent mb-1">🎣 HOOK</p>
                      <p className="text-foreground">{selectedScript.hook}</p>
                    </div>
                  )}
                  {selectedScript.body && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                      <p className="text-xs font-semibold text-primary mb-1">📝 BODY</p>
                      <p className="text-foreground whitespace-pre-line">{selectedScript.body}</p>
                    </div>
                  )}
                  {selectedScript.cta && (
                    <div className="rounded-lg border border-border bg-secondary/30 p-4">
                      <p className="text-xs font-semibold text-foreground mb-1">🎯 CTA</p>
                      <p className="text-foreground font-semibold">{selectedScript.cta}</p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full gap-2" onClick={() => copyScript(selectedScript)}>
                    <Copy className="h-4 w-4" /> Copy Full Script
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </AppLayout>
  );
}
