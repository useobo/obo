"use client";

import { trpc } from "@/lib/trpc";

export function Stats() {
  const { data: providers } = trpc.provider.list.useQuery();
  const { data: slips } = trpc.slip.list.useQuery({}, { refetchInterval: 5000 });

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-sm text-zinc-400">Active Slips</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {slips?.length || 0}
        </p>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-sm text-zinc-400">Providers</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {providers?.length || 0}
        </p>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-sm text-zinc-400">Policies</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">2</p>
      </div>
    </div>
  );
}
