"use client";

import { useTheme } from "next-themes";
import { Bell, Moon, Search, Sun, Menu, LogOut, Shield, RotateCcw, ArrowLeft, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getInitialSessionInfo, SessionUser } from "@/lib/user-session-utils";
import { useUIStore } from "@/lib/ui-store";

export function Header({ title = "Dashboard Overview" }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { toggleMobileSidebar } = useUIStore();

  const [session, setSession] = useState(() => getInitialSessionInfo());
  const currentUser = session.user;
  const isImpersonating = session.isImpersonating;

  useEffect(() => {
    setMounted(true);
    setSession(getInitialSessionInfo());

    const syncSession = () => {
      setSession(getInitialSessionInfo());
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener("user_session_changed", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("user_session_changed", syncSession);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleExitImpersonation = () => {
    localStorage.removeItem("superadmin_impersonating_client");
    window.dispatchEvent(new Event("user_session_changed"));
    window.location.href = "/clients";
  };

  const initialLetter = currentUser.name.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white dark:bg-[#06141b] border-b border-slate-200 dark:border-[#163546] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 gap-4">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-xl bg-slate-100 dark:bg-[#081822] hover:bg-slate-200 dark:hover:bg-[#112937] border border-slate-200 dark:border-[#163546] text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors md:hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title */}
        <h2 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white shrink-0">{title}</h2>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search devices, alerts, campaigns..."
            className="w-full bg-slate-100 dark:bg-[#081822] border border-slate-200 dark:border-[#163546] focus:border-[#10b981]/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#10b981]/50 transition-all"
          />
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Return to Super Admin Button (Only visible during 1-Click Client Impersonation Mode) */}
        {mounted && isImpersonating && (
          <button
            onClick={handleExitImpersonation}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-3 sm:px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all animate-pulse shrink-0"
            title="Exit Client View & Return to Super Admin Panel"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">Exit Client View</span>
            <span>➜ Super Admin</span>
          </button>
        )}

        <button className="p-2 rounded-xl bg-slate-100 dark:bg-[#081822] hover:bg-slate-200 dark:hover:bg-[#112937] border border-slate-200 dark:border-[#163546] text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,1)] absolute top-1.5 right-1.5 animate-pulse"></span>
        </button>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#081822] hover:bg-slate-200 dark:hover:bg-[#112937] border border-slate-200 dark:border-[#163546] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        )}

        {/* User Profile Avatar & Interactive Dropdown */}
        <div className="relative border-l border-slate-200 dark:border-[#163546] pl-2 sm:pl-3">
          <button
            onClick={() => setUserDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span suppressHydrationWarning className="text-xs font-bold text-slate-900 dark:text-white max-w-[140px] truncate">{currentUser.name}</span>
              <span suppressHydrationWarning className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {currentUser.role}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
              <div suppressHydrationWarning className="w-full h-full rounded-[10px] bg-white dark:bg-[#06141b] flex items-center justify-center text-slate-900 dark:text-white font-bold text-sm">
                {initialLetter}
              </div>
            </div>
          </button>

          {/* User Profile Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 top-12 w-64 bg-white dark:bg-[#081822] border border-slate-200 dark:border-[#163546] rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in space-y-2">
              <div className="p-3 bg-slate-50 dark:bg-[#06141b] rounded-xl border border-slate-200 dark:border-[#163546] space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 truncate max-w-[140px]">
                    <Shield className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" /> {currentUser.name}
                  </p>
                  <span className="text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 dark:border-emerald-500/30">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{currentUser.email}</p>
              </div>

              {isImpersonating && (
                <button
                  onClick={handleExitImpersonation}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors text-left border-t border-slate-200 dark:border-[#163546]"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" /> Return to Super Admin Panel
                </button>
              )}

              <div className="pt-1 border-t border-slate-200 dark:border-[#163546]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" /> Logout Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
