"use client";

import { trpc } from "@/lib/trpc";

export function SlipList() {
  const { data: slips, isLoading } = trpc.slip.list.useQuery({}, { refetchInterval: 5000 });
  const utils = trpc.useUtils();

  const revokeSlip = trpc.slip.revoke.useMutation({
    onSuccess: () => {
      utils.slip.list.invalidate();
    },
  });

  if (isLoading) {
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

      {!slips || slips.length === 0 ? (
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
                  onClick={() => revokeSlip.mutate({ id: slip.id })}
                  disabled={revokeSlip.isPending}
                  className="rounded-md border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800 disabled:opacity-50"
                >
                  {revokeSlip.isPending ? "Revoking..." : "Revoke"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
