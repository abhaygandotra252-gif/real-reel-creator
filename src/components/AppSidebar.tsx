import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Sparkles, Library, Video, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Products", path: "/products" },
  { icon: Sparkles, label: "Generate Script", path: "/generate" },
  { icon: Library, label: "Script Library", path: "/scripts" },
  { icon: Video, label: "Video Studio", path: "/studio" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold text-foreground">UGC Studio</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
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
              <item.icon className="relative z-10 h-5 w-5" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
