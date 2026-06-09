import { NavLink } from "react-router-dom";
import {
  Home,
  Moon,
  BookOpen,
  BarChart3,
  TrendingUp,
  Wind,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  to: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems: NavItem[] = [
  { icon: Home, label: "首页总览", to: "/home" },
  { icon: Moon, label: "睡眠记录", to: "/sleep" },
  { icon: BookOpen, label: "梦境日记", to: "/dream" },
  { icon: BarChart3, label: "关联分析", to: "/analysis" },
  { icon: TrendingUp, label: "趋势看板", to: "/dashboard" },
  { icon: Wind, label: "助眠工具", to: "/tools" },
  { icon: Clock, label: "梦境回溯", to: "/timeline" },
  { icon: FileText, label: "月度报告", to: "/report" },
];

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const bottomTabItems = navItems.slice(0, 5);

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col bg-night-900/80 backdrop-blur border-r border-white/5 transition-all duration-300",
          collapsed ? "w-16" : "w-[220px]"
        )}
      >
        <div className="flex h-16 items-center gap-2 px-4 shrink-0">
          <Moon className="h-6 w-6 shrink-0 text-stargold" />
          <span
            className={cn(
              "font-serif text-lg font-bold bg-gradient-to-r from-stargold to-aurora bg-clip-text text-transparent transition-all duration-300 whitespace-nowrap overflow-hidden",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            DreamLog
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors duration-200 border-l-2",
                  isActive
                    ? "border-l-stargold text-stargold bg-stargold/10"
                    : "border-l-transparent text-moonlight/50 hover:text-white/80 hover:bg-white/5"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors duration-200",
                      isActive ? "text-stargold" : "text-moonlight/50 group-hover:text-white/80"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm whitespace-nowrap overflow-hidden transition-all duration-300",
                      collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/5 p-2">
          <button
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-lg p-2 text-moonlight/50 hover:text-white/80 hover:bg-white/5 transition-colors duration-200"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-card border-t border-white/10" style={{ height: "64px" }}>
        <div className="flex justify-around items-center h-full px-2">
          {bottomTabItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-stargold/10"
                    : "hover:bg-white/5"
                )
              }
            >
              {({ isActive }) => (
                <item.icon
                  className={cn(
                    "h-6 w-6 shrink-0 transition-colors duration-200",
                    isActive ? "text-stargold" : "text-white/40"
                  )}
                />
              )}
            </NavLink>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onMobileClose}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-60 bg-night-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between px-4 shrink-0 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Moon className="h-6 w-6 shrink-0 text-stargold" />
              <span className="font-serif text-lg font-bold bg-gradient-to-r from-stargold to-aurora bg-clip-text text-transparent whitespace-nowrap">
                DreamLog
              </span>
            </div>
            <button
              onClick={onMobileClose}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors duration-200 border-l-2",
                    isActive
                      ? "border-l-stargold text-stargold bg-stargold/10"
                      : "border-l-transparent text-moonlight/50 hover:text-white/80 hover:bg-white/5"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors duration-200",
                        isActive ? "text-stargold" : "text-moonlight/50 group-hover:text-white/80"
                      )}
                    />
                    <span className="text-sm whitespace-nowrap">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
