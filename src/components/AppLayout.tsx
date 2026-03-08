import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background px-4 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="ml-3 font-display text-lg font-bold text-foreground">UGC Studio</span>
      </div>

      {/* md = icon sidebar (w-16), lg = full sidebar (w-64) */}
      <main className="md:ml-16 lg:ml-64 min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
