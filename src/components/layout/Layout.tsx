import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import StarField from "./StarField";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen">
      <StarField />
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <main
        className={`flex-1 transition-all duration-300 relative z-10 p-6 lg:p-8 ${
          collapsed ? "md:ml-16" : "md:ml-[220px]"
        }`}
      >
        <div className="md:hidden mb-4 flex items-center">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-white/60"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 font-serif font-bold bg-gradient-to-r from-stargold to-aurora bg-clip-text text-transparent">
            DreamLog
          </span>
        </div>
        <Outlet />
        <div className="h-20 md:hidden" />
      </main>
    </div>
  );
}
