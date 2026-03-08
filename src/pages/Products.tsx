import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Package, Globe, Trash2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [urlImport, setUrlImport] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "", description: "", key_features: "", benefits: "",
    target_audience: "", niche_category: "", image_url: "", source_url: "",
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const createProduct = useMutation({
    mutationFn: async (product: typeof form) => {
      const { error } = await supabase.from("products").insert({
        name: product.name,
        description: product.description,
        key_features: product.key_features.split("\n").filter(Boolean),
        benefits: product.benefits.split("\n").filter(Boolean),
        target_audience: product.target_audience,
        niche_category: product.niche_category,
        image_url: product.image_url,
        source_url: product.source_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDialogOpen(false);
      setForm({ name: "", description: "", key_features: "", benefits: "", target_audience: "", niche_category: "", image_url: "", source_url: "" });
      toast({ title: "Product added!" });
    },
    onError: () => toast({ title: "Error adding product", variant: "destructive" }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product deleted" });
    },
  });

  const handleUrlImport = async () => {
    if (!urlImport) return;
    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-product", {
        body: { url: urlImport },
      });
      if (error) throw error;
      if (data) {
        setForm({
          name: data.name || "",
          description: data.description || "",
          key_features: (data.key_features || []).join("\n"),
          benefits: (data.benefits || []).join("\n"),
          target_audience: data.target_audience || "",
          niche_category: data.niche_category || "",
          image_url: data.image_url || "",
          source_url: urlImport,
        });
        toast({ title: "Product details extracted!" });
      }
    } catch {
      toast({ title: "Failed to extract product info. Fill manually.", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.niche_category?.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  const categories = [...new Set(products?.map(p => p.niche_category).filter(Boolean))];

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">Manage your product library</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 gap-2">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display">Add New Product</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="manual" className="mt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="manual" className="flex-1 gap-2"><Package className="h-4 w-4" /> Manual</TabsTrigger>
                  <TabsTrigger value="url" className="flex-1 gap-2"><Globe className="h-4 w-4" /> URL Import</TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="space-y-4 pt-4">
                  <div>
                    <Label>Product / Landing Page URL</Label>
                    <div className="mt-1 flex gap-2">
                      <Input placeholder="https://example.com/product" value={urlImport} onChange={e => setUrlImport(e.target.value)} />
                      <Button onClick={handleUrlImport} disabled={isImporting} variant="outline">
                        {isImporting ? "Extracting..." : "Extract"}
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">AI will extract product details from the page</p>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="pt-4">
                  <p className="text-sm text-muted-foreground">Fill in product details below</p>
                </TabsContent>
              </Tabs>

              <div className="mt-4 space-y-4">
                <div><Label>Product Name *</Label><Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Glow Serum" /></div>
                <div><Label>Description</Label><Textarea className="mt-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this product do?" /></div>
                <div><Label>Key Features (one per line)</Label><Textarea className="mt-1" value={form.key_features} onChange={e => setForm(f => ({ ...f, key_features: e.target.value }))} placeholder="Hydrating formula&#10;Vitamin C enriched&#10;SPF 50 protection" /></div>
                <div><Label>Benefits (one per line)</Label><Textarea className="mt-1" value={form.benefits} onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))} placeholder="Glowing skin in 7 days&#10;Reduces dark spots" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Target Audience</Label><Input className="mt-1" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} placeholder="Women 25-40" /></div>
                  <div><Label>Niche / Category</Label><Input className="mt-1" value={form.niche_category} onChange={e => setForm(f => ({ ...f, niche_category: e.target.value }))} placeholder="Skincare" /></div>
                </div>
                <div><Label>Image URL</Label><Input className="mt-1" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></div>
                <Button onClick={() => createProduct.mutate(form)} disabled={!form.name || createProduct.isPending} className="w-full gradient-primary border-0">
                  {createProduct.isPending ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search products by name or category..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={() => setSearch("")} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!search ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSearch(cat!)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${search === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse border-border bg-card"><CardContent className="h-48 p-6" /></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="font-display text-lg font-medium text-foreground">No products yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Add your first product to start generating scripts</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="group border-border bg-card hover:border-primary/30 transition-all">
                  {product.image_url && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-display">{product.name}</CardTitle>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive" onClick={() => deleteProduct.mutate(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {product.niche_category && (
                      <span className="inline-block w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{product.niche_category}</span>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {product.description && <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {product.key_features?.slice(0, 3).map((f, fi) => (
                        <span key={fi} className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{f}</span>
                      ))}
                    </div>
                    {product.source_url && (
                      <a href={product.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" /> Source
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
