"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled
          ? "border-border-default bg-surface-100/90 backdrop-blur-md shadow-sm"
          : "border-transparent bg-surface-100"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-4 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500">
              <span className="text-lg font-bold text-white">O</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-text-primary">
                obo
              </h1>
              <p className="text-xs text-text-secondary">On Behalf Of</p>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <a
              href="https://github.com/useobo/obo"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-sm font-medium text-text-secondary transition-colors hover:text-text-primary sm:block"
            >
              GitHub
            </a>
            <SignInButton mode="modal">
              <button className="inline-flex items-center justify-center rounded-full border border-border-default bg-surface-50 px-5 py-2.5 text-sm font-semibold text-text-secondary shadow-sm transition-colors hover:border-border-hover hover:bg-surface-200">
                Sign In
              </button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
