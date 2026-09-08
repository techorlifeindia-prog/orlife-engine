"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Bell, Moon, Search, Sun, Menu, LogOut, Shield, RotateCcw, ArrowLeft, ShieldCheck, User, X, Save, Eye, EyeOff, CheckCircle2 } from "lucide-react";
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

  // Profile Quick Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("orlife123");
  const [showEditPass, setShowEditPass] = useState(false);
  const [editSavedSuccess, setEditSavedSuccess] = useState(false);

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

  const handleOpenEditModal = () => {
    let savedPass = "orlife123";
    if (typeof window !== "undefined") {
      const savedUserStr = localStorage.getItem("orlife_current_user");
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          if (parsed.password) savedPass = parsed.password;
        } catch (e) {}
      }
      const customPass = localStorage.getItem("orlife_superadmin_password");
      if (customPass) savedPass = customPass;
    }

    setEditName(currentUser.name || "Super Admin");
    setEditEmail(currentUser.email || "admin@orlifeindia.com");
    setEditPhone(currentUser.phone || "+919246574995");
    setEditPassword(savedPass);
    setUserDropdownOpen(false);
    setIsEditModalOpen(true);
  };

  const handleSaveModalProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const newPass = editPassword.trim() || "orlife123";
    const updatedUser = {
      name: editName.trim() || "Super Admin",
      email: editEmail.trim() || "admin@orlifeindia.com",
      role: currentUser.role || "Super Admin",
      phone: editPhone.trim() || "+919246574995",
      password: newPass,
    };

    if (isImpersonating) {
      // Client View mode — update the impersonation data
      const clientData = { ...updatedUser, role: currentUser.role || "Client Account" };
      localStorage.setItem("superadmin_impersonating_client", JSON.stringify(clientData));
    } else {
      // Super Admin mode — update main user + password
      localStorage.setItem("orlife_current_user", JSON.stringify(updatedUser));
      localStorage.setItem("orlife_superadmin_password", newPass);
    }

    window.dispatchEvent(new Event("user_session_changed"));
    setSession(getInitialSessionInfo());
    setEditSavedSuccess(true);
    setTimeout(() => {
      setEditSavedSuccess(false);
      setIsEditModalOpen(false);
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem("orlife_current_user");
    localStorage.removeItem("superadmin_impersonating_client");
    window.location.href = "/login";
  };

  const handleExitImpersonation = () => {
    localStorage.removeItem("superadmin_impersonating_client");
    window.dispatchEvent(new Event("user_session_changed"));
    window.location.href = "/clients";
  };

  const displayName = mounted ? currentUser.name : "";
  const displayRole = mounted ? currentUser.role : "";
  const initialLetter = mounted ? (currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U") : "";

  return (
    <header className="h-16 bg-white dark:bg-[#06141b] border-b border-slate-200 dark:border-[#163546] sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 gap-4">
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

        {/* User Profile Avatar & Interactive Single-Click Modal Trigger */}
        <div className="relative border-l border-slate-200 dark:border-[#163546] pl-2 sm:pl-3">
          <button
            onClick={handleOpenEditModal}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none group cursor-pointer"
            title="Click to Open Profile & Account Settings"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold text-slate-900 dark:text-white max-w-[140px] truncate group-hover:text-emerald-400 transition-colors">{displayName}</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                {displayRole && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>} {displayRole}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-[0_0_12px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[10px] bg-white dark:bg-[#06141b] flex items-center justify-center text-slate-900 dark:text-white font-bold text-sm">
                {initialLetter}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Interactive 1-Click Complete Profile Dialog Box Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0b1724] border border-slate-200 dark:border-[#1b2f44] w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#172c40] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-base shadow-sm">
                  {initialLetter}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{displayName || "User Profile"}</h3>
                    <span className="text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 dark:border-emerald-500/30">
                      {displayRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{mounted ? currentUser.email : ""}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#172c40] transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Notification Alert */}
            {editSavedSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Profile Credentials Updated & Saved Successfully!</span>
              </div>
            )}

            {/* Edit Credentials Form */}
            <form onSubmit={handleSaveModalProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">User Display Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Super Admin"
                    className="w-full bg-slate-50 dark:bg-[#050e17] border border-slate-200 dark:border-[#172c40] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="e.g. admin@orlifeindia.com"
                    className="w-full bg-slate-50 dark:bg-[#050e17] border border-slate-200 dark:border-[#172c40] rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">WhatsApp Phone (+91)</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. +91 92465 74995"
                    className="w-full bg-slate-50 dark:bg-[#050e17] border border-slate-200 dark:border-[#172c40] rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Super Admin Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showEditPass ? "text" : "password"}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#050e17] border border-slate-200 dark:border-[#172c40] rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPass(!showEditPass)}
                      className="absolute right-3 text-slate-400 hover:text-slate-200 p-1"
                    >
                      {showEditPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons inside Dialog */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#172c40] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {isImpersonating ? (
                    <button
                      type="button"
                      onClick={handleExitImpersonation}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" /> Exit Client View
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" /> Logout Account
                    </button>
                  )}

                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <Save className="w-4 h-4" /> Save Profile
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
