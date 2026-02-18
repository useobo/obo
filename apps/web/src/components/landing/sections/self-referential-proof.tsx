import { Code } from "lucide-react";
import { SectionHeader } from "../shared/section-header";
import { CTAButton } from "../shared/cta-button";

export function SelfReferentialProofSection() {
  const codeExample = `# Agent requests OBO access via MCP
request_slip(
  target="obo",
  principal="you@example.com",
  scopes=["slips:list", "slips:create"]
)

# OBO issues a scoped JWT token
{
  "slip_id": "slip_obo_123456",
  "token": "eyJhbGci...",
  "scopes": ["slips:list", "slips:create"],
  "expires_at": "2025-02-18T00:00:00Z"
}

# Agent can now manage your slips
list_slips(principal="you@example.com")`;

  return (
    <section className="border-y border-border-default bg-surface-50">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Explanation */}
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-border-default bg-surface-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
              Self-Referential Proof
            </div>

            <h2 className="mb-4 text-2xl font-semibold text-text-primary sm:text-3xl">
              OBO uses OBO to manage OBO
            </h2>

            <p className="mb-6 text-lg text-text-secondary">
              We dogfood our own protocol. Agents can request slips to access OBO itself —
              creating, listing, and revoking other slips. This proves the protocol works end-to-end.
            </p>

            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700 text-xs font-bold">
                  ✓
                </span>
                <span>Agents can request slips to manage their own access</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700 text-xs font-bold">
                  ✓
                </span>
                <span>JWT tokens with scoped permissions (slips:list, slips:create, etc.)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700 text-xs font-bold">
                  ✓
                </span>
                <span>Same revocation and policy engine applies to OBO itself</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700 text-xs font-bold">
                  ✓
                </span>
                <span>Proves the protocol works for any service, including ourselves</span>
              </li>
            </ul>

            <div className="mt-8">
              <CTAButton
                href="https://github.com/useobo/obo/blob/main/packages/providers/src/obo/index.ts"
                variant="secondary"
                className="group"
              >
                <Code className="mr-2 h-4 w-4" />
                View the Source
              </CTAButton>
            </div>
          </div>

          {/* Right: Code Example */}
          <div className="lg:mt-16">
            <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-950 p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2 text-sm text-text-tertiary">obo-terminal</span>
              </div>
              <pre className="text-sm leading-relaxed">
                <code className="text-surface-100">
                  {codeExample}
                </code>
              </pre>
            </div>

            <div className="mt-6 rounded-xl border border-accent-200 bg-accent-50 p-4">
              <p className="text-sm font-medium text-accent-800">
                <strong>New:</strong> JWT key rotation, revocation, and GCP KMS support
                now available for enterprise deployments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
