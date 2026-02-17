import { SlipList } from "@/components/slip-list";
import { RequestSlipForm } from "@/components/request-slip-form";
import { Stats } from "@/components/stats";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">OBO</h1>
              <p className="text-sm text-zinc-400">On Behalf Of — Agentic API Governance</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-700"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column - Request form */}
          <div className="lg:col-span-1">
            <RequestSlipForm />
          </div>

          {/* Right column - Stats and slips */}
          <div className="space-y-8 lg:col-span-2">
            <Stats />
            <SlipList />
          </div>
        </div>
      </main>
    </div>
  );
}
