import { ArrowRight } from "lucide-react";
import { SectionHeader } from "../shared/section-header";
import { IconBadge } from "../shared/icon-badge";

export function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "Agent Requests Access",
      description:
        "Your AI agent requests a slip for a specific target (GitHub, Supabase, etc.) and scope through the MCP protocol.",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      number: 2,
      title: "Policy Evaluation",
      description:
        "obo evaluates the request against your defined policies. Auto-approve trusted requests, require manual review for sensitive actions.",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      number: 3,
      title: "Slip Issued & Used",
      description:
        "A temporary, revocable authorization slip is granted. The agent uses it to access the target service with the approved permissions.",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-surface-100">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <SectionHeader
          title="How obo Works"
          subtitle="Three simple steps to governed AI agent access"
          centered
        />

        <div className="grid gap-8 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="rounded-2xl border border-border-default bg-surface-50 p-8 shadow-[0_10px_26px_rgba(46,42,38,0.07)]">
                <div className="mb-6 flex items-start justify-between">
                  <IconBadge variant="accent" size="lg">
                    {step.icon}
                  </IconBadge>
                  <span className="text-5xl font-bold text-accent-200/60">
                    {step.number}
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:absolute lg:left-full lg:top-1/2 lg:-translate-y-1/2 lg:flex lg:items-center lg:justify-center lg:px-4">
                  <ArrowRight className="h-6 w-6 text-accent-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
