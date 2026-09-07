"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContactsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/campaigns?tab=groups");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 text-slate-400">
      <p className="text-sm font-medium">Redirecting to Send Message & Groups...</p>
    </div>
  );
}
