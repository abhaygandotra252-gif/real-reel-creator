import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, RefreshCw, Mail, MessageCircle } from "lucide-react";

type Template = {
  variation: string;
  subject_line: string;
  body: string;
  dm_version: string;
};

const TEMPLATE_TYPES = [
  { value: "influencer-outreach", label: "Influencer Outreach" },
  { value: "customer-followup", label: "Customer Follow-Up" },
  { value: "launch-announcement", label: "Launch Announcement" },
  { value: "collab-proposal", label: "Collab Proposal" },
];

export function OutreachGenerator() {
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [templateType, setTemplateType] = useState("influencer-outreach");
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

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
      const { data, error } = await supabase.functions.invoke("generate-outreach", {
        body: {
          product_name: product.name,
          product_description: product.description,
          key_features: product.key_features,
          benefits: product.benefits,
          template_type: templateType,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setTemplates(data.templates);
      toast({ title: "Templates generated! 📧" });
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
            <CardTitle className="font-display text-lg">Outreach Settings</CardTitle>
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
              <Label>Template Type</Label>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {TEMPLATE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTemplateType(t.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                      templateType === t.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !productId}
              className="w-full gradient-primary border-0 gap-2 h-12"
            >
              {isGenerating ? <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</> : <><Sparkles className="h-5 w-5" /> Generate Templates</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        {templates.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Email & DM templates</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                AI-generated outreach templates for influencers, customers, and collaborations — ready to send.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Generated Templates</h2>
            {templates.map((tmpl, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{tmpl.variation}</span>
                  </div>

                  {/* Email version */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Email Version</span>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3 space-y-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Subject: </span>
                        <span className="text-sm font-medium text-foreground">{tmpl.subject_line}</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line">{tmpl.body}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => copyToClipboard(`Subject: ${tmpl.subject_line}\n\n${tmpl.body}`)}>
                      <Copy className="h-3 w-3" /> Copy Email
                    </Button>
                  </div>

                  {/* DM version */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">DM Version</span>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3">
                      <p className="text-sm text-foreground whitespace-pre-line">{tmpl.dm_version}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => copyToClipboard(tmpl.dm_version)}>
                      <Copy className="h-3 w-3" /> Copy DM
                    </Button>
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
