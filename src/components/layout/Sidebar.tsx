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
  Bot,
  X,
} from "lucide-react";
import { useUIStore } from "@/lib/ui-store";

import { useEffect, useState } from "react";
import { getInitialSessionInfo } from "@/lib/user-session-utils";

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, closeMobileSidebar } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsSuperAdmin(getInitialSessionInfo().isSuperAdmin);

    const checkRole = () => {
      setIsSuperAdmin(getInitialSessionInfo().isSuperAdmin);
    };

    window.addEventListener("storage", checkRole);
    window.addEventListener("user_session_changed", checkRole);

    return () => {
      window.removeEventListener("storage", checkRole);
      window.removeEventListener("user_session_changed", checkRole);
    };
  }, []);

  const allNavItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, superAdminOnly: false },
    { name: "SaaS Clients", href: "/clients", icon: Building2, superAdminOnly: true },
    { name: "Devices", href: "/devices", icon: MonitorSmartphone, superAdminOnly: false },
    { name: "Send Message", href: "/campaigns", icon: Send, superAdminOnly: false },
    { name: "Templates", href: "/templates", icon: BookTemplate, superAdminOnly: false },
    { name: "Automation Rules", href: "/automation", icon: Bot, superAdminOnly: false },
    { name: "Users & Staff", href: "/users", icon: UserCheck, superAdminOnly: true },
  ];

  const visibleNavItems = allNavItems.filter((item) => !item.superAdminOnly || (mounted && isSuperAdmin));

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
        className={`w-64 bg-white dark:bg-[#06141b] h-screen fixed md:sticky top-0 left-0 flex flex-col p-4 z-40 md:z-10 border-r border-slate-200 dark:border-[#163546] transition-transform duration-300 ${
          isMobileSidebarOpen ? "translate-x-0 z-40" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="bg-[#0e1c2b] border border-[#1b3248] p-1 rounded-xl w-10 h-10 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
              <img src="/logo.png" alt="OrLife Engine Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                OrLife Engine
              </h1>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80 font-mono">CYBERHUB SaaS v2.0</p>
            </div>
          </div>

          {/* Close button for Mobile */}
          <button
            onClick={closeMobileSidebar}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-[#10b981]" : "text-slate-500 dark:text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Settings Footer */}
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-[#163546]">
          <Link
            href="/settings"
            onClick={closeMobileSidebar}
            className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
              pathname === "/settings"
                ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            <Settings className={`w-4 h-4 ${pathname === "/settings" ? "text-[#10b981]" : "text-slate-500 dark:text-slate-400"}`} />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
