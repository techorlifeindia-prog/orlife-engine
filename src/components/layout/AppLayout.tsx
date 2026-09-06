"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="min-h-screen w-full bg-[#050c14]">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-[#06141b]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto bg-[#06141b]">{children}</main>
    </div>
  );
}
