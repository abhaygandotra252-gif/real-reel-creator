import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Settings, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function Studio() {
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">Video Studio</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 md:mb-8">Generate AI avatar videos from your scripts</p>

        <Card className="border-dashed border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
              <Video className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">Coming Soon</h3>
            <p className="mt-3 max-w-md text-muted-foreground">
              Connect your HeyGen or Synthesia API key to generate realistic AI avatar videos directly from your scripts.
              Select a script, choose an avatar, and create professional UGC videos in minutes.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="gap-2" disabled>
                <Settings className="h-4 w-4" /> Connect API Key
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <a href="https://www.heygen.com/" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Learn about HeyGen
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
}
