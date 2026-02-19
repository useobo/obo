// @ts-nocheck - tRPC types from API are not available at build time
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc";
import { SignedInWrapper } from "@/clerk/client";
import { AppLayout } from "@/components/app-layout";
import { ProviderSelector } from "@/components/provider-selector";
import { ScopeSelector } from "@/components/scope-selector";
import { OAuthFlow } from "@/components/oauth-flow";

export const dynamic = "force-dynamic";

export default function RequestPage() {
  const { user, isLoaded } = useUser();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [principal, setPrincipal] = useState("");
  const [reason, setReason] = useState("");
  const [createdSlip, setCreatedSlip] = useState<any>(null);

  // Pre-fill principal with user email when loaded
  useEffect(() => {
    if (isLoaded && user?.primaryEmailAddress?.emailAddress) {
      setPrincipal(user.primaryEmailAddress.emailAddress);
    }
  }, [isLoaded, user]);

  const requestSlip = trpc.slips.request.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || scopes.length === 0) return;

    try {
      const result = await requestSlip.mutateAsync({
        target: selectedProvider,
        principal: principal || user?.primaryEmailAddress?.emailAddress || "",
        requested_scope: scopes,
        reason: reason || undefined,
      });
      setCreatedSlip(result);
    } catch (error) {
      console.error("Failed to request slip:", error);
    }
  };

  const handleComplete = () => {
    // Optionally redirect or refresh
    window.location.href = "/dashboard";
  };

  return (
    <SignedInWrapper>
      <AppLayout>
        <div className="mx-auto max-w-2xl">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-text-secondary">
            <a href="/dashboard" className="hover:text-text-primary transition-colors">
              Dashboard
            </a>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-text-primary">Request Access</span>
          </div>

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Request Access</h1>
            <p className="mt-2 text-text-secondary">
              Create a new authorization slip to access external services on behalf of a principal.
            </p>
          </div>

          {!createdSlip ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Provider Selection */}
              <ProviderSelector value={selectedProvider} onChange={setSelectedProvider} />

              {/* Scope Selection */}
              {selectedProvider && (
                <ScopeSelector provider={selectedProvider} value={scopes} onChange={setScopes} />
              )}

              {/* Principal */}
              <div>
                <label htmlFor="principal" className="mb-2 block text-sm font-medium text-text-primary">
                  Principal
                </label>
                <input
                  id="principal"
                  type="email"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border-default bg-surface-100 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  The user on whose behalf this access is being requested
                </p>
              </div>

              {/* Reason */}
              <div>
                <label htmlFor="reason" className="mb-2 block text-sm font-medium text-text-primary">
                  Reason <span className="text-text-tertiary">(optional)</span>
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe why you need this access..."
                  rows={3}
                  className="w-full rounded-xl border border-border-default bg-surface-100 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-500/40 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={!selectedProvider || scopes.length === 0 || requestSlip.isPending}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(122,116,104,0.28)] transition-all hover:-translate-y-0.5 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestSlip.isPending ? "Creating slip..." : "Create Slip"}
                </button>
                <a
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-border-default bg-surface-100 px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-200"
                >
                  Cancel
                </a>
              </div>

              {/* Error */}
              {requestSlip.error && (
                <div className="rounded-xl bg-status-error-bg border border-status-error-border p-4 text-sm text-status-error-text">
                  {requestSlip.error.message}
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-6">
              {/* Slip created success */}
              <div className="rounded-2xl border border-status-success-border bg-status-success-bg p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success-border">
                    <svg className="h-6 w-6 text-status-success-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-status-success-text">Slip Created</h3>
                    <p className="text-sm text-status-success-text opacity-80">
                      Your authorization slip has been created successfully
                    </p>
                  </div>
                </div>

                {/* Slip details */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-status-success-text opacity-70">Slip ID</span>
                    <div className="font-mono text-status-success-text">{createdSlip.id.slice(0, 12)}...</div>
                  </div>
                  <div>
                    <span className="text-status-success-text opacity-70">Target</span>
                    <div className="capitalize text-status-success-text">{createdSlip.target}</div>
                  </div>
                  <div>
                    <span className="text-status-success-text opacity-70">Principal</span>
                    <div className="text-status-success-text">{createdSlip.principal}</div>
                  </div>
                  <div>
                    <span className="text-status-success-text opacity-70">Status</span>
                    <div className="capitalize text-status-success-text">{createdSlip.policy_result?.decision}</div>
                  </div>
                </div>
              </div>

              {/* OAuth flow if needed */}
              {createdSlip.instructions && createdSlip.provisioningMethod === "oauth" && (
                <OAuthFlow
                  slipId={createdSlip.id}
                  instructions={createdSlip.instructions}
                  onComplete={handleComplete}
                />
              )}

              {/* BYOC instructions */}
              {createdSlip.provisioningMethod === "byoc" && (
                <div className="rounded-2xl border border-border-default bg-surface-50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-warning-bg">
                      <svg className="h-5 w-5 text-status-warning-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Bring Your Own Credential</h3>
                      <p className="text-sm text-text-secondary">
                        This provider requires you to provide your own credential
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary">
                    You can provide your credential through the MCP server or API. The slip is now active and ready to accept your credential.
                  </p>
                </div>
              )}

              {/* Non-OAuth success */}
              {createdSlip.provisioningMethod !== "oauth" && (
                <div className="flex justify-center">
                  <a
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent-600"
                  >
                    Go to Dashboard
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </SignedInWrapper>
  );
}
