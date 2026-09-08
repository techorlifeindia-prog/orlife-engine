"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }

    const savedUser = localStorage.getItem("orlife_current_user");
    if (!savedUser) {
      setIsAuthenticated(false);
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return (
      <main className="min-h-screen w-full bg-slate-100 dark:bg-[#050c14] text-slate-900 dark:text-white">
        {children}
        <ConfirmDialog />
      </main>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06141b] text-slate-400 text-sm">
        Redirecting to OrLife Connect Portal Login...
      </div>
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

