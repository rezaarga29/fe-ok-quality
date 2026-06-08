import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

// Inner layout that reads sidebar state for offset
function LayoutInner() {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      {/* Sidebar (fixed position internally) */}
      <Sidebar />

      {/* Main content
          - Mobile: padding-top 57px to clear topbar
          - Desktop: padding-left 256px (expanded) or 70px (collapsed)
      */}
      <main
        className={`
          min-h-screen transition-all duration-300 ease-in-out
          pt-[57px] lg:pt-0
          ${collapsed ? "lg:pl-[70px]" : "lg:pl-64"}
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default function UserLayout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
