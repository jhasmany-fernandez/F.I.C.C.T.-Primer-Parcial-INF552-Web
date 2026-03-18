"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function ConditionalLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  if (isAuthPage) {
    // Auth pages: no sidebar, no header, centered layout
    return (
      <div className="min-h-screen bg-gray-2 dark:bg-[#020d1a]">
        <div className="flex min-h-screen items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-[1170px]">{children}</div>
        </div>
      </div>
    );
  }

  // Dashboard pages: with sidebar and header
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
        <Header />

        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
