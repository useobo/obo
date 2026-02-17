import {
  Settings,
  GitBranch,
  Plug,
  Key,
  FileSearch,
  Ban,
} from "lucide-react";
import { SectionHeader } from "../shared/section-header";
import { FeatureCard } from "../shared/feature-card";

export function FeaturesGridSection() {
  const features = [
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Policy Engine",
      description:
        "Define fine-grained rules for what agents can request. Auto-approve trusted actions, require manual review for sensitive operations.",
    },
    {
      icon: <GitBranch className="h-5 w-5" />,
      title: "Multi-Provider Support",
      description:
        "Works with GitHub, Supabase, and more. Extensible architecture lets you add custom providers for any API.",
    },
    {
      icon: <Plug className="h-5 w-5" />,
      title: "MCP Server Integration",
      description:
        "Native support for Model Context Protocol. Any MCP-compatible AI agent can request slips from your obo instance.",
    },
    {
      icon: <Key className="h-5 w-5" />,
      title: "BYOC Support",
      description:
        "Bring Your Own Credential mode lets agents use your existing GitHub PATs with scoped, temporary delegation.",
    },
    {
      icon: <FileSearch className="h-5 w-5" />,
      title: "Complete Audit Trail",
      description:
        "Every slip request, approval, and usage is logged. Full visibility into what your agents are doing on your behalf.",
    },
    {
      icon: <Ban className="h-5 w-5" />,
      title: "Instant Revocation",
      description:
        "Revoke any slip instantly. If an agent behaves unexpectedly, terminate its access immediately without changing credentials.",
    },
  ];

  return (
    <section className="border-y border-border-default bg-surface-200/30">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <SectionHeader
          title="Everything You Need for Agentic Governance"
          subtitle="Powerful features that give you control over AI agent access"
          centered
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
