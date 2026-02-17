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
      <div className="rounded-2xl border border-border-default bg-surface-50 p-6 shadow-[0_10px_30px_rgba(46,42,38,0.06)]">
        <p className="text-text-secondary">Loading slips...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-default bg-surface-50 shadow-[0_10px_30px_rgba(46,42,38,0.06)]">
      <div className="border-b border-border-default px-6 py-4">
        <h2 className="text-lg font-semibold text-text-primary">Active Slips</h2>
      </div>

      {!slips || slips.length === 0 ? (
        <div className="p-6 text-center text-text-secondary">
          No active slips. Request one to get started.
        </div>
      ) : (
        <div className="divide-y divide-border-default">
          {slips.map((slip: any) => (
            <div key={slip.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono text-sm font-medium text-text-primary">{slip.id}</h3>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        slip.policy_result?.decision === "auto_approve"
                          ? "bg-status-success-bg border-status-success-border text-status-success-text"
                          : "bg-status-warning-bg border-status-warning-border text-status-warning-text"
                      }`}
                    >
                      {slip.policy_result?.decision || "unknown"}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                      slip.status === "active"
                        ? "bg-status-info-bg border-status-info-border text-status-info-text"
                        : "bg-status-error-bg border-status-error-border text-status-error-text"
                    }`}>
                      {slip.status || "active"}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-text-secondary">
                    <div>
                      <span className="font-medium text-text-primary">Target:</span> {slip.target}
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Principal:</span> {slip.principal}
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Scopes:</span>{" "}
                      {Array.isArray(slip.grantedScope) ? slip.grantedScope.join(", ") : "N/A"}
                    </div>
                    <div>
                      <span className="font-medium text-text-primary">Issued:</span>{" "}
                      {slip.createdAt ? new Date(slip.createdAt).toLocaleString() : "N/A"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => revokeSlip.mutate({ id: slip.id })}
                  disabled={revokeSlip.isPending}
                  className="inline-flex items-center justify-center rounded-lg border border-border-default bg-surface-100 px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-200 hover:border-border-hover disabled:opacity-50"
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
