import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import StarField from "./StarField";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <StarField />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={`flex-1 transition-all duration-300 relative z-10 p-6 lg:p-8 ${
          collapsed ? "ml-16" : "ml-[220px]"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
