import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package, FileText, Sparkles, Star, ArrowRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Index() {
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*");
      return data ?? [];
    },
  });

  const { data: scripts } = useQuery({
    queryKey: ["scripts"],
    queryFn: async () => {
      const { data } = await supabase.from("scripts").select("*, products(name)");
      return data ?? [];
    },
  });

  const totalProducts = products?.length ?? 0;
  const totalScripts = scripts?.length ?? 0;
  const favoriteScripts = scripts?.filter((s) => s.is_favorite).length ?? 0;

  const recentScripts = scripts?.slice(0, 5) ?? [];

  const stats = [
    { label: "Products", value: totalProducts, icon: Package, gradient: "gradient-primary" },
    { label: "Scripts Generated", value: totalScripts, icon: FileText, gradient: "gradient-accent" },
    { label: "Favorites", value: favoriteScripts, icon: Star, gradient: "gradient-warm" },
  ];

  return (
    <AppLayout>
      {/* Hero */}
      <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="font-display text-4xl font-bold text-foreground">
          Welcome to <span className="text-gradient-primary">UGC Studio</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Create scroll-stopping UGC scripts that convert. AI-powered, human-authentic.
        </p>
      </motion.div>

      {/* Quick Create */}
      <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="mb-8">
        <Link to="/generate">
          <Card className="group cursor-pointer overflow-hidden border-primary/20 bg-card transition-all hover:border-primary/40 hover:glow-primary">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Generate New Script</h3>
                  <p className="text-sm text-muted-foreground">Select a product and let AI craft the perfect UGC script</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} {...fadeUp} transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}>
            <Card className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.gradient}`}>
                  <stat.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Scripts */}
      <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.5 }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">Recent Scripts</h2>
          <Link to="/scripts" className="flex items-center gap-1 text-sm text-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentScripts.length === 0 ? (
          <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="mb-4 h-10 w-10 text-muted-foreground" />
              <h3 className="font-display text-lg font-medium text-foreground">No scripts yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Add a product and generate your first UGC script</p>
              <div className="mt-4 flex gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link to="/products">Add Product</Link>
                </Button>
                <Button asChild size="sm" className="gradient-primary border-0">
                  <Link to="/generate">Generate Script</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentScripts.map((script) => (
              <Card key={script.id} className="border-border bg-card hover:bg-secondary/50 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h4 className="font-medium text-foreground">{script.title}</h4>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{script.video_style}</span>
                      <span>{script.duration}</span>
                      <span>•</span>
                      <span>{script.tone}</span>
                    </div>
                  </div>
                  {script.is_favorite && <Star className="h-4 w-4 fill-accent text-accent" />}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
