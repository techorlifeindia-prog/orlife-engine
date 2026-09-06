"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  MonitorSmartphone,
  Send,
  Settings,
  BookTemplate,
  Users,
  UserCheck,
  Zap,
  X,
} from "lucide-react";
import { useUIStore } from "@/lib/ui-store";

import { useEffect, useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, closeMobileSidebar } = useUIStore();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Check if impersonating a client (Client View)
    const impersonating = localStorage.getItem("superadmin_impersonating_client");
    if (impersonating) {
      setIsSuperAdmin(false);
      return;
    }

    // Check logged in user role
    const savedUser = localStorage.getItem("orlife_current_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === "Super Admin" || parsed.phone?.includes("9246574995") || parsed.email === "super@gmail.com") {
          setIsSuperAdmin(true);
          return;
        }
      } catch (e) {}
    } else {
      // Default to true in dev if no user saved yet
      setIsSuperAdmin(true);
      return;
    }

    setIsSuperAdmin(false);
  }, []);

  const allNavItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, superAdminOnly: false },
    { name: "SaaS Clients", href: "/clients", icon: Building2, superAdminOnly: true },
    { name: "Devices", href: "/devices", icon: MonitorSmartphone, superAdminOnly: false },
    { name: "Send Message", href: "/campaigns", icon: Send, superAdminOnly: false },
    { name: "Templates", href: "/templates", icon: BookTemplate, superAdminOnly: false },
    { name: "Contacts", href: "/contacts", icon: Users, superAdminOnly: false },
    { name: "Users & Staff", href: "/users", icon: UserCheck, superAdminOnly: true },
  ];

  const visibleNavItems = allNavItems.filter((item) => !item.superAdminOnly || isSuperAdmin);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-64 bg-[#06141b] h-screen fixed md:sticky top-0 left-0 flex flex-col p-4 z-50 border-r border-[#163546] transition-transform duration-300 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="bg-[#10b981]/20 border border-[#10b981]/40 p-2.5 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)] text-[#10b981]">
              <Zap className="w-5 h-5 fill-[#10b981]" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                OrLife Connect
              </h1>
              <p className="text-[11px] text-emerald-400/80 font-mono">CYBERHUB SaaS v2.0</p>
            </div>
          </div>

          {/* Close button for Mobile */}
          <button
            onClick={closeMobileSidebar}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 space-y-2">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeMobileSidebar}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-[#10b981]" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Settings Footer */}
        <div className="mt-auto pt-4 border-t border-[#163546]">
          <Link
            href="/settings"
            onClick={closeMobileSidebar}
            className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
              pathname === "/settings"
                ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            <Settings className={`w-4 h-4 ${pathname === "/settings" ? "text-[#10b981]" : "text-slate-400"}`} />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
