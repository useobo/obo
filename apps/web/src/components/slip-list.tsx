"use client";

import { useEffect, useState } from "react";

interface Slip {
  id: string;
  target: string;
  principal: string;
  granted_scope: string[];
  issued_at: string;
  expires_at: string | null;
  policy_result: {
    decision: string;
    policy_id: string;
  };
}

export function SlipList() {
  const [slips, setSlips] = useState<Slip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlips();
  }, []);

  const fetchSlips = async () => {
    try {
      const res = await fetch("http://localhost:3001/trpc/slip.list");
      if (res.ok) {
        const data = await res.json();
        setSlips(data.result || []);
      }
    } catch (err) {
      console.error("Failed to fetch slips");
    } finally {
      setLoading(false);
    }
  };

  const revokeSlip = async (id: string) => {
    try {
      await fetch("http://localhost:3001/trpc/slip.revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchSlips();
    } catch (err) {
      console.error("Failed to revoke slip");
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-zinc-400">Loading slips...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
      <div className="border-b border-zinc-800 px-6 py-4">
        <h2 className="text-lg font-semibold">Active Slips</h2>
      </div>

      {slips.length === 0 ? (
        <div className="p-6 text-center text-zinc-400">
          No active slips. Request one to get started.
        </div>
      ) : (
        <div className="divide-y divide-zinc-800">
          {slips.map((slip) => (
            <div key={slip.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{slip.id}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        slip.policy_result.decision === "auto_approve"
                          ? "bg-green-900/50 text-green-300"
                          : "bg-yellow-900/50 text-yellow-300"
                      }`}
                    >
                      {slip.policy_result.decision}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-zinc-400">
                    <div>
                      <span className="font-medium text-zinc-300">Target:</span> {slip.target}
                    </div>
                    <div>
                      <span className="font-medium text-zinc-300">Principal:</span> {slip.principal}
                    </div>
                    <div>
                      <span className="font-medium text-zinc-300">Scopes:</span>{" "}
                      {slip.granted_scope.join(", ")}
                    </div>
                    <div>
                      <span className="font-medium text-zinc-300">Policy:</span> {slip.policy_result.policy_id}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => revokeSlip(slip.id)}
                  className="rounded-md border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
