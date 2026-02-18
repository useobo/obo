"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function RequestSlipForm() {
  const [target, setTarget] = useState("github");
  const [principal, setPrincipal] = useState("kaarch@gmail.com");
  const [scopes, setScopes] = useState("repos:read");

  const requestSlip = trpc.obo.request.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    requestSlip.mutate(
      {
        target,
        principal,
        requested_scope: scopes.split(",").map((s) => s.trim()),
      },
      {
        onSuccess: () => {
          // Invalidate list query to refresh
          window.location.reload();
        },
      }
    );
  };

  const providers = [
    { name: "github", description: "GitHub - Git hosting and code collaboration" },
    { name: "supabase", description: "Supabase - Open source Firebase alternative" },
  ];

  return (
    <div className="rounded-2xl border border-border-default bg-surface-50 p-6 shadow-[0_10px_30px_rgba(46,42,38,0.06)]">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Request a Slip</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="target" className="mb-1 block text-sm text-text-secondary">
            Target
          </label>
          <select
            id="target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-xl border border-border-default bg-surface-100 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-accent-500/40"
          >
            {providers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="principal" className="mb-1 block text-sm text-text-secondary">
            Principal
          </label>
          <input
            id="principal"
            type="email"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border-default bg-surface-100 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-accent-500/40"
          />
        </div>

        <div>
          <label htmlFor="scopes" className="mb-1 block text-sm text-text-secondary">
            Scopes (comma-separated)
          </label>
          <input
            id="scopes"
            type="text"
            value={scopes}
            onChange={(e) => setScopes(e.target.value)}
            placeholder="repos:read, user:email"
            className="w-full rounded-xl border border-border-default bg-surface-100 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-accent-500/40"
          />
          <p className="mt-1 text-xs text-text-tertiary">
            GitHub: repos:read, repos:write, user:read, user:email
          </p>
        </div>

        <button
          type="submit"
          disabled={requestSlip.isPending}
          className="inline-flex w-full items-center justify-center rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(122,116,104,0.28)] transition-all hover:-translate-y-0.5 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/40 disabled:opacity-50"
        >
          {requestSlip.isPending ? "Requesting..." : "Request Slip"}
        </button>

        {requestSlip.error && (
          <div className="rounded-md bg-status-error-bg border border-status-error-border p-3 text-sm text-status-error-text">
            {requestSlip.error.message}
          </div>
        )}

        {requestSlip.isSuccess && (
          <div className="rounded-md bg-status-success-bg border border-status-success-border p-3 text-sm text-status-success-text">
            Slip created: {requestSlip.data.slip.id}
          </div>
        )}
      </form>
    </div>
  );
}
