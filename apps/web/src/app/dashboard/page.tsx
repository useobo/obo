import { SignedInWrapper } from "@/clerk/client";
import { AppLayout } from "@/components/app-layout";
import { SlipList } from "@/components/slip-list";
import { Stats } from "@/components/stats";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <SignedInWrapper>
      <AppLayout>
        {/* Stats */}
        <div className="mb-8">
          <Stats />
        </div>

        {/* Quick actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/request"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-emerald-500/20 text-white transition-colors group-hover:from-purple-500/30 group-hover:to-emerald-500/30">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Request Access</h3>
              <p className="text-sm text-white/50">Create a new slip</p>
            </div>
          </Link>

          <a
            href="https://github.com/useobo/obo"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-colors group-hover:bg-white/10">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Documentation</h3>
              <p className="text-sm text-white/50">View on GitHub</p>
            </div>
          </a>

          <a
            href="https://useobo.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-colors group-hover:bg-white/10">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">About OBO</h3>
              <p className="text-sm text-white/50">Learn more</p>
            </div>
          </a>

          <a
            href="https://github.com/useobo/obo/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-colors group-hover:bg-white/10">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Feedback</h3>
              <p className="text-sm text-white/50">Report issues</p>
            </div>
          </a>
        </div>

        {/* Slips list */}
        <SlipList />
      </AppLayout>
    </SignedInWrapper>
  );
}
