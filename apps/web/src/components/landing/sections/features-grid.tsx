import {
  Settings,
  GitBranch,
  Plug,
  Key,
  FileSearch,
  Ban,
  Shield,
  RefreshCw,
  Infinity,
} from "lucide-react";
import { SectionHeader } from "../shared/section-header";
import { FeatureCard } from "../shared/feature-card";

export function FeaturesGridSection() {
  const coreFeatures = [
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
        "GitHub, Supabase, and growing. Extensible architecture lets you add custom providers for any API.",
    },
    {
      icon: <Plug className="h-5 w-5" />,
      title: "MCP Server Integration",
      description:
        "Native Model Context Protocol support. Works with Claude, Cursor, Windsurf, and any MCP-compatible AI agent.",
    },
    {
      icon: <Key className="h-5 w-5" />,
      title: "BYOC Support",
      description:
        "Bring Your Own Credential mode lets agents use your existing API keys with scoped, temporary delegation.",
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

  const securityFeatures = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: "AES-256-GCM Encryption",
      description:
        "All tokens encrypted at rest before storage. Supports optional one-time delivery for non-retrievable credentials.",
      highlight: true,
    },
    {
      icon: <RefreshCw className="h-5 w-5" />,
      title: "JWT Key Rotation",
      description:
        "Seamless signing key rotation without token invalidation. Keep old keys for verification while issuing new tokens.",
      highlight: true,
    },
    {
      icon: <Infinity className="h-5 w-5" />,
      title: "Self-Referential Proof",
      description:
        "OBO uses OBO to manage OBO. Agents can request slips to manage slips — proving the protocol works end-to-end.",
      highlight: true,
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
          {coreFeatures.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        {/* Security Features - Highlighted */}
        <div className="mt-16">
          <SectionHeader
            title="Enterprise-Grade Security"
            subtitle="Built for teams that take security seriously"
            centered
          />
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-6 sm:grid-cols-3">
              {securityFeatures.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  highlighted={feature.highlight}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
