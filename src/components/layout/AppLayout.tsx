"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <main className="min-h-screen w-full bg-slate-100 dark:bg-[#050c14] text-slate-900 dark:text-white">
        {children}
        <ConfirmDialog />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#06141b] text-slate-900 dark:text-slate-100">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 dark:bg-[#06141b] text-slate-900 dark:text-slate-100">{children}</main>
      <ConfirmDialog />
    </div>
  );
}
