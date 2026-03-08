import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Video, Sparkles, RefreshCw, Download, Film, Wand2, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 — Landscape" },
  { value: "9:16", label: "9:16 — Portrait / Reels" },
  { value: "1:1", label: "1:1 — Square" },
];

const DURATIONS = [
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
  { value: 15, label: "15s" },
];

const VIDEO_TYPES = [
  { value: "product-promo", label: "Product Promo", icon: Video, desc: "Cinematic product showcase" },
  { value: "motion-graphics", label: "Motion Graphics", icon: Film, desc: "Animated text & graphics" },
];

type GeneratedVideo = {
  url: string;
  prompt: string;
  status: "processing" | "succeed" | "failed";
  taskId: string;
  duration?: string;
};

const STATUS_CONFIG = {
  processing: { icon: Loader2, label: "Generating...", color: "text-primary" },
  succeed: { icon: CheckCircle2, label: "Ready", color: "text-green-500" },
  failed: { icon: XCircle, label: "Failed", color: "text-destructive" },
};

export default function Studio() {
  const { toast } = useToast();
  const [videoType, setVideoType] = useState("product-promo");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [scriptId, setScriptId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [pollingProgress, setPollingProgress] = useState(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval>>();

  const { data: scripts } = useQuery({
    queryKey: ["scripts"],
    queryFn: async () => {
      const { data } = await supabase.from("scripts").select("*, products(name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const enhancePromptFromScript = async () => {
    const script = scripts?.find(s => s.id === scriptId);
    if (!script) {
      toast({ title: "Select a script first", variant: "destructive" });
      return;
    }
    setIsEnhancing(true);
    try {
      const scriptText = `${script.hook || ""}\n${script.body || ""}\n${script.cta || ""}`;
      const { data, error } = await supabase.functions.invoke("generate-video-prompt", {
        body: { script_text: scriptText, product_name: script.products?.name || "", video_type: videoType },
      });
      if (error) throw error;
      setPrompt(data.prompt);
      toast({ title: "Prompt enhanced from script! ✨" });
    } catch (err: any) {
      toast({ title: "Failed to enhance prompt", description: err.message, variant: "destructive" });
    } finally {
      setIsEnhancing(false);
    }
  };

  const pollForVideo = useCallback((taskId: string, videoIndex: number) => {
    let elapsed = 0;
    const maxWait = 300; // 5 min max
    const interval = 5000; // poll every 5s

    pollTimerRef.current = setInterval(async () => {
      elapsed += interval / 1000;
      setPollingProgress(Math.min(95, (elapsed / maxWait) * 100));

      try {
        const { data, error } = await supabase.functions.invoke("kling-video", {
          body: { action: "poll", task_id: taskId },
        });
        if (error) throw error;

        if (data.status === "succeed" && data.video_url) {
          clearInterval(pollTimerRef.current);
          setGeneratedVideos(prev => prev.map((v, i) =>
            i === videoIndex ? { ...v, url: data.video_url, status: "succeed", duration: data.video_duration } : v
          ));
          setIsGenerating(false);
          setPollingProgress(100);
          toast({ title: "Video ready! 🎉", description: "Your AI video has been generated." });
        } else if (data.status === "failed") {
          clearInterval(pollTimerRef.current);
          setGeneratedVideos(prev => prev.map((v, i) =>
            i === videoIndex ? { ...v, status: "failed" } : v
          ));
          setIsGenerating(false);
          setPollingProgress(0);
          toast({ title: "Video generation failed", description: data.status_msg || "Please try again.", variant: "destructive" });
        }
        // else still processing, keep polling
      } catch {
        // Network error, keep trying
      }

      if (elapsed >= maxWait) {
        clearInterval(pollTimerRef.current);
        setIsGenerating(false);
        setPollingProgress(0);
        toast({ title: "Timeout", description: "Video is still processing. Check back later.", variant: "destructive" });
      }
    }, interval);
  }, [toast]);

  const generateVideo = async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a video prompt", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setPollingProgress(0);

    try {
      const finalPrompt = videoType === "motion-graphics"
        ? `Motion graphics animation: ${prompt}. Kinetic typography, smooth transitions, dynamic shapes, professional motion design, vibrant colors.`
        : prompt;

      const { data, error } = await supabase.functions.invoke("kling-video", {
        body: {
          action: "create",
          prompt: finalPrompt,
          duration,
          aspect_ratio: aspectRatio,
          mode: "std",
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({ title: "Video generation started! 🎬", description: `Task submitted. This typically takes 2-4 minutes for a ${duration}s video.` });

      const newVideo: GeneratedVideo = {
        url: "",
        prompt: finalPrompt,
        status: "processing",
        taskId: data.task_id,
      };

      setGeneratedVideos(prev => [newVideo, ...prev]);
      pollForVideo(data.task_id, 0);
    } catch (err: any) {
      setIsGenerating(false);
      setPollingProgress(0);
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">Video Studio</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 md:mb-8">Generate real AI videos powered by Kling AI — up to 15 seconds</p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Config Panel */}
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg">Video Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Video Type */}
                <div>
                  <Label>Video Type</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {VIDEO_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setVideoType(t.value)}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                          videoType === t.value
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <t.icon className="h-4 w-4" />
                        <span className="text-xs font-medium">{t.label}</span>
                        <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* From Script */}
                <div>
                  <Label>Start from Script (optional)</Label>
                  <div className="mt-1 flex gap-2">
                    <Select value={scriptId} onValueChange={setScriptId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a script..." />
                      </SelectTrigger>
                      <SelectContent>
                        {scripts?.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={enhancePromptFromScript}
                      disabled={!scriptId || isEnhancing}
                      title="Generate prompt from script"
                    >
                      {isEnhancing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">AI will convert your script into a visual video prompt</p>
                </div>

                {/* Prompt */}
                <div>
                  <Label>Video Prompt</Label>
                  <Textarea
                    className="mt-1 min-h-[100px]"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={videoType === "motion-graphics"
                      ? "Describe the motion graphics: dynamic text animations, abstract shapes flowing, brand colors transitioning..."
                      : "Describe the video: close-up of product on marble surface, soft golden lighting, camera slowly panning..."
                    }
                  />
                </div>

                {/* Aspect Ratio */}
                <div>
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map(ar => (
                        <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div>
                  <Label>Duration</Label>
                  <div className="mt-2 flex gap-2">
                    {DURATIONS.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setDuration(d.value)}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          duration === d.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Longer videos use more credits</p>
                </div>

                <Button
                  onClick={generateVideo}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full gradient-primary border-0 gap-2 text-base h-12"
                >
                  {isGenerating ? (
                    <><RefreshCw className="h-5 w-5 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="h-5 w-5" /> Generate Video</>
                  )}
                </Button>
                {isGenerating && (
                  <div className="space-y-1">
                    <Progress value={pollingProgress} className="h-2" />
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>AI is creating your video — usually 2-4 min</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview / Output */}
          <div className="lg:col-span-3">
            {generatedVideos.length === 0 ? (
              <Card className="border-dashed border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">Ready to create</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Powered by Kling AI — generate real cinematic videos up to 15 seconds from text prompts.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {(videoType === "motion-graphics"
                      ? ["Kinetic typography intro", "Logo reveal with particles", "Product stats animation"]
                      : ["Product on marble close-up", "Lifestyle flat lay scene", "Unboxing reveal shot"]
                    ).map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setPrompt(suggestion)}
                        className="rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold text-foreground">Generated Videos</h2>
                {generatedVideos.map((video, i) => {
                  const statusInfo = STATUS_CONFIG[video.status];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <motion.div key={video.taskId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="border-border bg-card">
                        <CardContent className="p-4">
                          {video.status === "succeed" && video.url ? (
                            <div className="mb-3 overflow-hidden rounded-lg bg-secondary">
                              <video src={video.url} controls className="w-full" />
                            </div>
                          ) : (
                            <div className="mb-3 flex aspect-video items-center justify-center rounded-lg bg-secondary/50 border border-border">
                              <div className="text-center px-4">
                                <StatusIcon className={`mx-auto mb-2 h-8 w-8 ${statusInfo.color} ${video.status === "processing" ? "animate-spin" : ""}`} />
                                <p className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</p>
                                {video.status === "processing" && (
                                  <p className="mt-1 text-xs text-muted-foreground">This usually takes 2-4 minutes</p>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="rounded-lg bg-secondary/30 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Prompt:</p>
                            <p className="text-sm text-foreground line-clamp-3">{video.prompt}</p>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => { setPrompt(video.prompt); window.scrollTo(0, 0); }}>
                              <RefreshCw className="h-3 w-3" /> Regenerate
                            </Button>
                            {video.url && (
                              <Button variant="outline" size="sm" className="gap-1" asChild>
                                <a href={video.url} download={`kling-video-${video.taskId}.mp4`} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-3 w-3" /> Download
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
