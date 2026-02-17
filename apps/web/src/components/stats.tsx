"use client";

import { trpc } from "@/lib/trpc";

export function Stats() {
  const { data: providers } = trpc.provider.list.useQuery();
  const { data: slips } = trpc.slip.list.useQuery({}, { refetchInterval: 5000 });

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border-default bg-surface-50 p-6 shadow-[0_10px_30px_rgba(46,42,38,0.06)]">
        <p className="text-sm text-text-secondary">Active Slips</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-accent-500">
          {slips?.length || 0}
        </p>
      </div>
      <div className="rounded-2xl border border-border-default bg-surface-50 p-6 shadow-[0_10px_30px_rgba(46,42,38,0.06)]">
        <p className="text-sm text-text-secondary">Providers</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
          {providers?.length || 0}
        </p>
      </div>
      <div className="rounded-2xl border border-border-default bg-surface-50 p-6 shadow-[0_10px_30px_rgba(46,42,38,0.06)]">
        <p className="text-sm text-text-secondary">Policies</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">2</p>
      </div>
    </div>
  );
}
