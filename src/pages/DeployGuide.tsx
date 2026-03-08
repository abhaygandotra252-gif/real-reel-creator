import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  GitBranch,
  Globe,
  Rocket,
  Server,
  Settings,
  Shield,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const steps = [
  {
    number: 1,
    title: "Push Your Code to GitHub",
    icon: GitBranch,
    description:
      "Vercel deploys directly from a Git repository. Connect your project to GitHub first.",
    details: [
      "Create a new repository on GitHub (public or private)",
      "In Lovable, go to Settings → GitHub and connect your account",
      "Push your project to the connected repository",
    ],
    command: null,
  },
  {
    number: 2,
    title: "Create a Vercel Account",
    icon: Globe,
    description:
      "Sign up at vercel.com using your GitHub account for seamless integration.",
    details: [
      'Go to vercel.com and click "Sign Up"',
      'Select "Continue with GitHub"',
      "Authorize Vercel to access your repositories",
    ],
    command: null,
    link: "https://vercel.com/signup",
  },
  {
    number: 3,
    title: "Import Your Project",
    icon: Rocket,
    description:
      'In the Vercel dashboard, click "Add New → Project" and select your GitHub repo.',
    details: [
      'Click "Add New" then "Project" in Vercel dashboard',
      "Find and select your repository from the list",
      "Vercel will auto-detect the Vite framework",
    ],
    command: null,
  },
  {
    number: 4,
    title: "Configure Build Settings",
    icon: Settings,
    description:
      "Vercel auto-detects Vite, but verify these settings before deploying.",
    details: [
      "Framework Preset: Vite",
      "Build Command: npm run build",
      "Output Directory: dist",
      "Install Command: npm install",
    ],
    command: null,
  },
  {
    number: 5,
    title: "Add Environment Variables",
    icon: Shield,
    description:
      "Add your backend environment variables so the app can connect to your services.",
    details: [
      'Go to your project Settings → "Environment Variables"',
      "Add each variable with its key and value",
      "Make sure to add variables for all environments (Production, Preview, Development)",
    ],
    command: null,
    envVars: [
      { key: "VITE_SUPABASE_URL", description: "Your backend URL" },
      {
        key: "VITE_SUPABASE_PUBLISHABLE_KEY",
        description: "Your backend anon/public key",
      },
    ],
  },
  {
    number: 6,
    title: "Deploy",
    icon: CheckCircle2,
    description:
      'Click "Deploy" and Vercel will build and publish your app. Future pushes to main auto-deploy.',
    details: [
      'Click "Deploy" — the build usually takes 30–60 seconds',
      "You'll get a .vercel.app URL immediately",
      "Every push to your main branch triggers a new deployment automatically",
      "Pull requests get automatic preview deployments",
    ],
    command: null,
  },
];

const troubleshooting = [
  {
    problem: "Build fails with TypeScript errors",
    solution:
      'Run "npm run build" locally first to catch type errors. Fix them before pushing.',
  },
  {
    problem: "Environment variables not working",
    solution:
      'Vite env vars must start with VITE_. Double-check the prefix and redeploy — env var changes need a new deployment.',
  },
  {
    problem: "404 on page refresh (client-side routing)",
    solution:
      "Add a vercel.json with rewrites to handle SPA routing (see config below).",
  },
  {
    problem: "API/Edge functions not reachable",
    solution:
      "Backend functions are hosted separately. Make sure your VITE_SUPABASE_URL env var points to the correct backend URL.",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <Copy className="h-3 w-3" />
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function DeployGuide() {
  const vercelJson = `{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}`;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Deploy to Vercel
              </h1>
              <p className="text-sm text-muted-foreground">
                Ship your app to production in under 5 minutes
              </p>
            </div>
          </div>

          {/* Quick summary */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Terminal className="mr-1 h-3 w-3" /> Vite + React
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Globe className="mr-1 h-3 w-3" /> Free tier available
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <GitBranch className="mr-1 h-3 w-3" /> Auto-deploy on push
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => (
            <Card key={step.number} className="border-border bg-card relative overflow-hidden">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute bottom-0 left-[29px] h-4 w-px bg-border translate-y-full z-10 hidden sm:block" />
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-sm">
                    {step.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
                      {step.title}
                      {step.link && (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-normal"
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pl-[52px] sm:pl-[68px]">
                <ul className="space-y-2">
                  {step.details.map((detail, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                {step.envVars && (
                  <div className="mt-4 space-y-2">
                    {step.envVars.map((env) => (
                      <div
                        key={env.key}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <code className="text-xs font-mono text-primary break-all">
                            {env.key}
                          </code>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {env.description}
                          </p>
                        </div>
                        <CopyButton text={env.key} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* SPA Routing Fix */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Required: SPA Routing Config
          </h2>
          <p className="text-sm text-muted-foreground">
            Create a <code className="text-primary font-mono text-xs">vercel.json</code> file in your project root so page refreshes work correctly:
          </p>
          <div className="relative rounded-lg border border-border bg-secondary/50 p-4">
            <div className="absolute right-3 top-3">
              <CopyButton text={vercelJson} />
            </div>
            <pre className="text-sm font-mono text-foreground/90 overflow-x-auto">
              {vercelJson}
            </pre>
          </div>
        </div>

        <Separator />

        {/* Troubleshooting */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Troubleshooting
          </h2>
          <div className="grid gap-3">
            {troubleshooting.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-4 space-y-2"
              >
                <p className="text-sm font-medium text-destructive">
                  {item.problem}
                </p>
                <p className="text-sm text-foreground/80">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Custom domain note */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4 flex items-start gap-3">
            <Globe className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Custom domain?
              </p>
              <p className="text-sm text-muted-foreground">
                In Vercel, go to your project → Settings → Domains → add your
                domain. Point your DNS A/CNAME records as instructed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
