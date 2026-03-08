import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Image, MessageSquare, ImageIcon, Mail } from "lucide-react";
import { CarouselGenerator } from "@/components/marketing/CarouselGenerator";
import { CaptionGenerator } from "@/components/marketing/CaptionGenerator";
import { MockupGenerator } from "@/components/marketing/MockupGenerator";
import { OutreachGenerator } from "@/components/marketing/OutreachGenerator";

export default function Marketing() {
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">Marketing Toolkit</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 md:mb-8">
          AI-powered tools to boost your product visibility across every channel
        </p>

        <Tabs defaultValue="carousels" className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="carousels" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground">
              <Image className="h-4 w-4" /> Carousels
            </TabsTrigger>
            <TabsTrigger value="captions" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground">
              <MessageSquare className="h-4 w-4" /> Captions
            </TabsTrigger>
            <TabsTrigger value="mockups" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground">
              <ImageIcon className="h-4 w-4" /> Mockups
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground">
              <Mail className="h-4 w-4" /> Outreach
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carousels"><CarouselGenerator /></TabsContent>
          <TabsContent value="captions"><CaptionGenerator /></TabsContent>
          <TabsContent value="mockups"><MockupGenerator /></TabsContent>
          <TabsContent value="outreach"><OutreachGenerator /></TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
}
