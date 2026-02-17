import { Check } from "lucide-react";
import { SectionHeader } from "../shared/section-header";
import { CTAButton } from "../shared/cta-button";

export function ComparisonSection() {
  const features = [
    { name: "Policy Engine", selfHosted: true, managed: true },
    { name: "MCP Integration", selfHosted: true, managed: true },
    { name: "GitHub Support", selfHosted: true, managed: true },
    { name: "Supabase Support", selfHosted: true, managed: true },
    { name: "BYOC Mode", selfHosted: true, managed: true },
    { name: "Audit Logs", selfHosted: true, managed: true },
    { name: "Instant Revocation", selfHosted: true, managed: true },
    { name: "Web Dashboard", selfHosted: false, managed: true },
    { name: "Visual Policy Editor", selfHosted: false, managed: true },
    { name: "Hosted Infrastructure", selfHosted: false, managed: true },
    { name: "Team Management", selfHosted: false, managed: true },
  ];

  return (
    <section className="bg-surface-100">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <SectionHeader
          title="Choose Your Deployment"
          subtitle="Both options give you full control. Pick the one that fits your workflow."
          centered
        />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Self-Hosted */}
          <div className="rounded-3xl border-2 border-border-default bg-surface-50 p-8 shadow-[0_10px_26px_rgba(46,42,38,0.07)]">
            <div className="mb-6">
              <div className="mb-3 inline-flex items-center rounded-full bg-surface-200 px-4 py-1.5 text-sm font-semibold text-text-secondary">
                Open Source
              </div>
              <h3 className="text-2xl font-semibold text-text-primary">
                Self-Hosted MCP Server
              </h3>
              <p className="mt-3 text-text-secondary">
                Run obo yourself. Full control, free forever. Perfect for individual developers
                and technical teams.
              </p>
            </div>

            <ul className="mb-8 space-y-3">
              {features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-3">
                  {feature.selfHosted ? (
                    <Check className="h-5 w-5 shrink-0 text-accent-600" />
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded-full border-2 border-surface-400" />
                  )}
                  <span
                    className={`text-sm ${
                      feature.selfHosted ? "text-text-primary" : "text-text-muted"
                    }`}
                  >
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            <CTAButton
              href="https://github.com/kyleto/obo"
              variant="secondary"
              className="w-full justify-center"
            >
              View on GitHub
            </CTAButton>
          </div>

          {/* Managed */}
          <div className="relative rounded-3xl border-2 border-accent-300 bg-accent-50 p-8 shadow-[0_10px_26px_rgba(46,42,38,0.07)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center rounded-full bg-accent-500 px-4 py-1.5 text-sm font-semibold text-white">
                Recommended for Teams
              </span>
            </div>

            <div className="mb-6">
              <div className="mb-3 inline-flex items-center rounded-full bg-accent-200 px-4 py-1.5 text-sm font-semibold text-accent-700">
                Managed Solution
              </div>
              <h3 className="text-2xl font-semibold text-text-primary">
                obo Cloud Dashboard
              </h3>
              <p className="mt-3 text-text-secondary">
                Get started in seconds. Hosted infrastructure with a beautiful web UI. Free tier
                available.
              </p>
            </div>

            <ul className="mb-8 space-y-3">
              {features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-3">
                  {feature.managed ? (
                    <Check className="h-5 w-5 shrink-0 text-accent-600" />
                  ) : (
                    <span className="h-5 w-5 shrink-0 rounded-full border-2 border-surface-400" />
                  )}
                  <span
                    className={`text-sm ${
                      feature.managed ? "text-text-primary" : "text-text-muted"
                    }`}
                  >
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            <CTAButton
              href="/sign-up"
              variant="primary"
              className="w-full justify-center"
            >
              Get Started Free
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}
