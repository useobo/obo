"use client";

import { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/request", label: "Request Access" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[128px]" />
      </div>

      <header className="relative border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="hover:opacity-70 transition-opacity flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-emerald-500 rounded-xl flex items-center justify-center font-bold text-lg">
                  o
                </div>
                <h1 className="text-xl font-semibold tracking-tight">obo</h1>
              </Link>
              <nav className="hidden sm:flex items-center gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "text-white"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <UserButton afterSignOutUrl="/"/>
          </div>
          {/* Mobile nav */}
          <nav className="flex sm:hidden items-center gap-4 mt-4 pt-4 border-t border-white/10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
