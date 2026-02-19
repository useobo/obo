// @ts-nocheck - tRPC types from API are not available at build time
"use client";

import { trpc } from "@/lib/trpc";

export function Stats() {
  const { data: providers } = trpc.providers.list.useQuery();
  const { data: slips } = trpc.slips.list.useQuery({}, { refetchInterval: 5000 });

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-white/50">Active Slips</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
          {slips?.length || 0}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-white/50">Providers</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
          {providers?.length || 0}
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-white/50">Policies</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-white">2</p>
      </div>
    </div>
  );
}
