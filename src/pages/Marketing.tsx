import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Image, MessageSquare, ImageIcon, Mail, Rocket, Twitter, Search, Megaphone, Layout, FolderOpen, Zap, Users } from "lucide-react";
import { CarouselGenerator } from "@/components/marketing/CarouselGenerator";
import { CaptionGenerator } from "@/components/marketing/CaptionGenerator";
import { MockupGenerator } from "@/components/marketing/MockupGenerator";
import { OutreachGenerator } from "@/components/marketing/OutreachGenerator";
import { LaunchCopyGenerator } from "@/components/marketing/LaunchCopyGenerator";
import { ThreadBuilder } from "@/components/marketing/ThreadBuilder";
import { SEOGenerator } from "@/components/marketing/SEOGenerator";
import { AdCopyGenerator } from "@/components/marketing/AdCopyGenerator";
import { LandingCopyGenerator } from "@/components/marketing/LandingCopyGenerator";
import { DirectorySubmitter } from "@/components/marketing/DirectorySubmitter";
import { GrowthHacks } from "@/components/marketing/GrowthHacks";
import { ProspectFinder } from "@/components/marketing/ProspectFinder";

const TABS = [
  { value: "launch", label: "Launch", icon: Rocket },
  { value: "directories", label: "Directories", icon: FolderOpen },
  { value: "growth", label: "Growth", icon: Zap },
  { value: "threads", label: "Threads", icon: Twitter },
  { value: "captions", label: "Captions", icon: MessageSquare },
  { value: "carousels", label: "Carousels", icon: Image },
  { value: "seo", label: "SEO", icon: Search },
  { value: "ads", label: "Ads", icon: Megaphone },
  { value: "landing", label: "Landing", icon: Layout },
  { value: "mockups", label: "Mockups", icon: ImageIcon },
  { value: "outreach", label: "Outreach", icon: Mail },
  { value: "prospects", label: "Prospects", icon: Users },
];

export default function Marketing() {
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">Marketing Toolkit</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 md:mb-8">
          Zero-to-launch growth suite — generate copy, submit to directories, and deploy unconventional tactics
        </p>

        <Tabs defaultValue="launch" className="space-y-6">
          <ScrollArea className="w-full">
            <TabsList className="bg-secondary/50 border border-border inline-flex w-max">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-foreground whitespace-nowrap px-2 sm:px-3"
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="launch"><LaunchCopyGenerator /></TabsContent>
          <TabsContent value="directories"><DirectorySubmitter /></TabsContent>
          <TabsContent value="growth"><GrowthHacks /></TabsContent>
          <TabsContent value="threads"><ThreadBuilder /></TabsContent>
          <TabsContent value="captions"><CaptionGenerator /></TabsContent>
          <TabsContent value="carousels"><CarouselGenerator /></TabsContent>
          <TabsContent value="seo"><SEOGenerator /></TabsContent>
          <TabsContent value="ads"><AdCopyGenerator /></TabsContent>
          <TabsContent value="landing"><LandingCopyGenerator /></TabsContent>
          <TabsContent value="mockups"><MockupGenerator /></TabsContent>
          <TabsContent value="outreach"><OutreachGenerator /></TabsContent>
          <TabsContent value="prospects"><ProspectFinder /></TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
}
