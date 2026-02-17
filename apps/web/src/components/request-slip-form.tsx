"use client";

import { useState } from "react";

interface Provider {
  name: string;
  description: string;
  tags: string[];
}

export function RequestSlipForm() {
  const [target, setTarget] = useState("github");
  const [principal, setPrincipal] = useState("kaarch@gmail.com");
  const [scopes, setScopes] = useState("repos:read");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const providers: Provider[] = [
    { name: "github", description: "GitHub - Git hosting and code collaboration", tags: ["git", "hosting", "code"] },
    { name: "supabase", description: "Supabase - Open source Firebase alternative", tags: ["database", "auth", "storage"] },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://localhost:3001/trpc/slip.request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          principal,
          requested_scope: scopes.split(",").map((s) => s.trim()),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ type: "success", message: `Slip created: ${data.result.slip.id}` });
      } else {
        setResult({ type: "error", message: data.error?.message || "Failed to create slip" });
      }
    } catch (err) {
      setResult({ type: "error", message: "API unavailable. Make sure the API server is running." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="mb-4 text-lg font-semibold">Request a Slip</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="target" className="mb-1 block text-sm text-zinc-400">
            Target
          </label>
          <select
            id="target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            {providers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="principal" className="mb-1 block text-sm text-zinc-400">
            Principal
          </label>
          <input
            id="principal"
            type="email"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>

        <div>
          <label htmlFor="scopes" className="mb-1 block text-sm text-zinc-400">
            Scopes (comma-separated)
          </label>
          <input
            id="scopes"
            type="text"
            value={scopes}
            onChange={(e) => setScopes(e.target.value)}
            placeholder="repos:read, user:email"
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          />
          <p className="mt-1 text-xs text-zinc-500">
            GitHub: repos:read, repos:write, user:read, user:email
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Requesting..." : "Request Slip"}
        </button>

        {result && (
          <div
            className={`rounded-md p-3 text-sm ${
              result.type === "success"
                ? "bg-green-900/50 text-green-200"
                : "bg-red-900/50 text-red-200"
            }`}
          >
            {result.message}
          </div>
        )}
      </form>
    </div>
  );
}
