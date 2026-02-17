import { AlertTriangle, Shield, FileText } from "lucide-react";
import { SectionHeader } from "../shared/section-header";

export function ProblemSolutionSection() {
  const problems = [
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: "Hard-coded credentials are risky",
      description:
        "Storing API keys in config files or environment variables exposes them to leaks and overuse.",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Over-permissioned agents are dangerous",
      description:
        "Giving AI agents full access to your accounts creates unnecessary risk and attack surface.",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "No audit trail means no accountability",
      description:
        "Without detailed logging, you can't track what your agents did or when something went wrong.",
    },
  ];

  return (
    <section className="border-y border-border-default bg-surface-200/30">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <SectionHeader
          title="Why Your Agents Need Governance"
          subtitle="AI agents are powerful, but giving them unrestricted access to your APIs is a security risk waiting to happen."
          centered
        />

        <div className="grid gap-6 sm:grid-cols-3">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="rounded-2xl border border-border-default bg-surface-50 p-6 shadow-[0_10px_26px_rgba(46,42,38,0.07)]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-status-error-bg text-status-error-text">
                {problem.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                {problem.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                {problem.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="mx-auto max-w-2xl rounded-2xl border-2 border-accent-300 bg-accent-50 p-8">
            <h3 className="mb-3 text-xl font-semibold text-text-primary">
              The obo Solution
            </h3>
            <p className="text-text-secondary">
              obo lets your agents request{" "}
              <span className="font-semibold text-accent-700">temporary, scoped access</span> that
              you control. Define policies, audit every action, and revoke access instantly — all
              without hard-coding credentials.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
