"use client";

import { useTheme } from "next-themes";
import { Bell, Moon, Search, Sun, Menu, LogOut, Key, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useUIStore } from "@/lib/ui-store";

export function Header({ title = "Dashboard Overview" }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { toggleMobileSidebar } = useUIStore();

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: string;
    email: string;
    phone: string;
  }>({
    name: "Super Admin",
    role: "Super Admin",
    email: "super@gmail.com",
    phone: "+91 92465 74995",
  });

  useEffect(() => {
    setMounted(true);

    const impersonating = localStorage.getItem("superadmin_impersonating_client");
    if (impersonating) {
      try {
        const parsed = JSON.parse(impersonating);
        setCurrentUser({
          name: parsed.businessName || parsed.name || "Client User",
          role: "Client View",
          email: parsed.email || "client@orlife.com",
          phone: parsed.phone || "",
        });
        return;
      } catch (e) {}
    }

    const savedUser = localStorage.getItem("orlife_current_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser({
          name: parsed.name || "Logged User",
          role: parsed.role || "Client Account",
          email: parsed.email || "user@orlife.com",
          phone: parsed.phone || "",
        });
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const initialLetter = currentUser.name.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-[#06141b] border-b border-[#163546] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 gap-4">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-xl bg-[#081822] hover:bg-[#112937] border border-[#163546] text-slate-300 hover:text-emerald-400 transition-colors md:hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title */}
        <h2 className="text-base sm:text-xl font-bold tracking-tight text-white shrink-0">{title}</h2>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search devices, alerts, campaigns..."
            className="w-full bg-[#081822] border border-[#163546] focus:border-[#10b981]/60 text-white placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#10b981]/50 transition-all"
          />
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button className="p-2 rounded-xl bg-[#081822] hover:bg-[#112937] border border-[#163546] text-slate-300 hover:text-emerald-400 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,1)] absolute top-1.5 right-1.5 animate-pulse"></span>
        </button>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl bg-[#081822] hover:bg-[#112937] border border-[#163546] text-slate-300 hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
        )}

        {/* User Profile Avatar & Interactive Dropdown */}
        <div className="relative border-l border-[#163546] pl-2 sm:pl-3">
          <button
            onClick={() => setUserDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold text-white max-w-[140px] truncate">{currentUser.name}</span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {currentUser.role}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
              <div className="w-full h-full rounded-[10px] bg-[#06141b] flex items-center justify-center text-white font-bold text-sm">
                {initialLetter}
              </div>
            </div>
          </button>

          {/* User Profile Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 top-12 w-64 bg-[#081822] border border-[#163546] rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in space-y-2">
              <div className="p-3 bg-[#06141b] rounded-xl border border-[#163546] space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-100 flex items-center gap-1 truncate max-w-[140px]">
                    <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {currentUser.name}
                  </p>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</p>
              </div>

              <div className="space-y-1 pt-1 border-t border-[#163546]">
                {currentUser.role === "Super Admin" && (
                  <a
                    href="/login"
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#112937] hover:text-emerald-400 rounded-xl transition-colors"
                  >
                    <Key className="w-4 h-4 text-emerald-400" /> Super Admin Portal
                  </a>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-red-400" /> Logout Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
