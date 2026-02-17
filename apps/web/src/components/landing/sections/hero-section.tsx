"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { CTAButton } from "../shared/cta-button";
import { VisualPlaceholder } from "../shared/visual-placeholder";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(circle_at_20%_20%,rgba(122,116,104,0.12),transparent_50%),radial-gradient(circle_at_80%_5%,rgba(140,135,126,0.08),transparent_45%)]" />

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-16 sm:px-8 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Content */}
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-border-default bg-surface-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
              obo Platform
            </div>

            <h1 className="text-balance mb-6 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Give Your AI Agents{" "}
              <span className="text-accent-600">Scoped, Temporary Access</span>
            </h1>

            <p className="text-balance mb-10 text-lg leading-relaxed text-text-secondary sm:text-xl">
              Agentic API governance for the modern stack. Issue revocable slips, enforce
              policies, and audit every request — all while your agents act on your behalf.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <SignedIn>
                <CTAButton href="/" variant="primary">
                  Go to Dashboard
                </CTAButton>
              </SignedIn>
              <SignedOut>
                <>
                  <CTAButton href="/sign-up" variant="primary">
                    Get Started Free
                  </CTAButton>
                  <CTAButton
                    href="https://github.com/kyleto/obo"
                    variant="secondary"
                    className="group"
                  >
                    <svg
                      className="mr-2 h-5 w-5 transition-transform group-hover:scale-110"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    View on GitHub
                  </CTAButton>
                </>
              </SignedOut>
            </div>

            <p className="mt-6 text-sm text-text-tertiary">
              Free forever for self-hosted · Managed tier available
            </p>
          </div>

          {/* Right: Visual */}
          <div className="flex items-center">
            <VisualPlaceholder label="Hero screenshot coming soon" aspectRatio="4/3" />
          </div>
        </div>
      </div>
    </section>
  );
}
