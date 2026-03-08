import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Sparkles, Library, Megaphone, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Products", path: "/products" },
  { icon: Sparkles, label: "Generate Script", path: "/generate" },
  { icon: Library, label: "Script Library", path: "/scripts" },
  { icon: Megaphone, label: "Marketing", path: "/marketing" },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Overlay — mobile only */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
          // Mobile: slide in/out full width
          open ? "translate-x-0" : "-translate-x-full",
          // Tablet (md): icon-only collapsed sidebar, always visible
          "md:translate-x-0 md:w-64"
        )}
      >
        {/* Logo + Close */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">UGC Studio</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2 py-4 lg:px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={item.label}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 justify-center lg:justify-start",
                  isActive
                    ? "text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg gradient-primary opacity-90"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <item.icon className="relative z-10 h-5 w-5 shrink-0" />
                <span className="relative z-10 hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2 lg:p-4">
          <Link
            to="/settings"
            onClick={onClose}
            title="Settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors justify-center lg:justify-start"
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className="hidden lg:block">Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
