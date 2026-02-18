import { SignedInWrapper } from "@/clerk/client";
import { SlipList } from "@/components/slip-list";
import { RequestSlipForm } from "@/components/request-slip-form";
import { Stats } from "@/components/stats";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

// Force dynamic rendering to skip Clerk validation during build
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <SignedInWrapper>
      <div className="min-h-screen bg-surface-100 text-text-primary">
        <header className="border-b border-border-default bg-surface-50/90 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-4 sm:px-8 lg:px-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-text-primary">obo</h1>
                <p className="text-sm text-text-secondary">On Behalf Of — Agentic API Governance</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/registry"
                  className="text-sm text-text-secondary hover:text-accent-primary transition-colors"
                >
                  Registry
                </Link>
                <UserButton afterSignOutUrl="/"/>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <RequestSlipForm />
            </div>

            <div className="space-y-8 lg:col-span-2">
              <Stats />
              <SlipList />
            </div>
          </div>
        </main>
      </div>
    </SignedInWrapper>
  );
}
