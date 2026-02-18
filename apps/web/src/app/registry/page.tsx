import Link from "next/link";

export const dynamic = 'force-dynamic';

interface Provider {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  supports: {
    oauth: boolean;
    genesis: boolean;
    byoc: boolean;
    rogue: boolean;
  };
  status: "stable" | "beta" | "roadmap" | "community";
  docsUrl?: string;
  websiteUrl?: string;
}

const providers: Provider[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Git hosting and code collaboration",
    icon: "",
    tags: ["git", "hosting", "code", "repos", "ci"],
    supports: { oauth: true, genesis: true, byoc: true, rogue: false },
    status: "stable",
    docsUrl: "https://docs.github.com/en/developers",
    websiteUrl: "https://github.com",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Open source Firebase alternative",
    icon: "",
    tags: ["database", "auth", "storage", "realtime"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: true },
    status: "stable",
    docsUrl: "https://supabase.com/docs",
    websiteUrl: "https://supabase.com",
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Deploy frontend projects and serverless functions",
    icon: "",
    tags: ["deployment", "frontend", "nextjs", "serverless"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
    status: "stable",
    docsUrl: "https://vercel.com/docs",
    websiteUrl: "https://vercel.com",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Messaging and notifications for teams",
    icon: "",
    tags: ["messaging", "chat", "notifications", "team"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
    status: "stable",
    docsUrl: "https://api.slack.com",
    websiteUrl: "https://slack.com",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Project management and issue tracking",
    icon: "",
    tags: ["project-management", "issues", "tracking", "agile"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
    status: "stable",
    docsUrl: "https://linear.app/docs",
    websiteUrl: "https://linear.app",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Docs, databases, and wikis",
    icon: "",
    tags: ["docs", "database", "wiki", "knowledge"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
    status: "stable",
    docsUrl: "https://developers.notion.com",
    websiteUrl: "https://notion.so",
  },
  {
    id: "obo",
    name: "OBO",
    description: "Self-referential access management (dogfooding)",
    icon: "",
    tags: ["internal", "self-hosted", "api"],
    supports: { oauth: false, genesis: true, byoc: true, rogue: false },
    status: "stable",
  },
  // Roadmap items
  {
    id: "stripe",
    name: "Stripe",
    description: "Payments infrastructure",
    icon: "",
    tags: ["payments", "billing", "fintech"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
    status: "roadmap",
    docsUrl: "https://stripe.com/docs/api",
    websiteUrl: "https://stripe.com",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "AI models and APIs",
    icon: "",
    tags: ["ai", "llm", "gpt", "api"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
    status: "roadmap",
    docsUrl: "https://platform.openai.com/docs",
    websiteUrl: "https://openai.com",
  },
  {
    id: "aws",
    name: "AWS",
    description: "Amazon Web Services",
    icon: "",
    tags: ["cloud", "infrastructure", "serverless"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
    status: "roadmap",
    docsUrl: "https://docs.aws.amazon.com",
    websiteUrl: "https://aws.amazon.com",
  },
  {
    id: "google-cloud",
    name: "Google Cloud",
    description: "Cloud computing and services",
    icon: "",
    tags: ["cloud", "gcp", "infrastructure"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
    status: "roadmap",
    docsUrl: "https://cloud.google.com/docs",
    websiteUrl: "https://cloud.google.com",
  },
  {
    id: "atlassian",
    name: "Atlassian (Jira)",
    description: "Issue tracking and project management",
    icon: "",
    tags: ["project-management", "issues", "agile"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
    status: "roadmap",
    docsUrl: "https://developer.atlassian.com",
    websiteUrl: "https://www.atlassian.com",
  },
  {
    id: "figma",
    name: "Figma",
    description: "Design and collaboration",
    icon: "",
    tags: ["design", "collaboration", "ui"],
    supports: { oauth: false, genesis: false, byoc: true, rogue: false },
    status: "roadmap",
    docsUrl: "https://www.figma.com/developers/api",
    websiteUrl: "https://www.figma.com",
  },
];

function getStatusBadge(status: Provider["status"]) {
  const styles = {
    stable: "bg-emerald-100 text-emerald-800 border-emerald-200",
    beta: "bg-blue-100 text-blue-800 border-blue-200",
    roadmap: "bg-amber-100 text-amber-800 border-amber-200",
    community: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const labels = {
    stable: "Stable",
    beta: "Beta",
    roadmap: "Roadmap",
    community: "Community",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function SupportBadge({ supported, label }: { supported: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        supported
          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
          : "bg-surface-200 text-text-secondary border-border-default"
      }`}
    >
      {label}
    </span>
  );
}

export default function RegistryPage() {
  const stableProviders = providers.filter((p) => p.status === "stable");
  const roadmapProviders = providers.filter((p) => p.status === "roadmap");

  return (
    <div className="min-h-screen bg-surface-100 text-text-primary">
      <header className="border-b border-border-default bg-surface-50/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="hover:opacity-70 transition-opacity">
              <h1 className="text-4xl font-semibold tracking-tight text-text-primary">obo</h1>
              <p className="text-sm text-text-secondary">Provider Registry</p>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl font-semibold text-text-primary mb-4">Provider Registry</h2>
          <p className="text-lg text-text-secondary max-w-3xl">
            OBO supports integrations with popular developer tools and services. Each provider implements
            the{" "}
            <code className="px-2 py-1 bg-surface-200 rounded text-sm font-mono">Provider</code>
            {" "}interface, enabling AI agents to request scoped, revocable access on behalf of users.
          </p>
        </div>

        {/* Legend */}
        <div className="mb-10 p-6 bg-surface-50 rounded-lg border border-border-default">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4">
            Provisioning Methods
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">OAuth</span>
              <p className="text-text-secondary">Native OAuth flow for seamless authentication</p>
            </div>
            <div>
              <span className="font-medium">BYOC</span>
              <p className="text-text-secondary">Bring Your Own Credential (PAT, API key, etc.)</p>
            </div>
            <div>
              <span className="font-medium">Genesis</span>
              <p className="text-text-secondary">Programmatic account creation via API</p>
            </div>
            <div>
              <span className="font-medium">Rogue</span>
              <p className="text-text-secondary">Proxy via OBO master account</p>
            </div>
          </div>
        </div>

        {/* Stable Providers */}
        <section className="mb-16">
          <h3 className="text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            Available Providers
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {stableProviders.map((provider) => (
              <div
                key={provider.id}
                className="p-6 bg-white rounded-lg border border-border-default hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-text-primary">{provider.name}</h4>
                    <p className="text-sm text-text-secondary mt-1">{provider.description}</p>
                  </div>
                  {getStatusBadge(provider.status)}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {provider.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-surface-100 text-text-secondary text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <SupportBadge supported={provider.supports.oauth} label="OAuth" />
                  <SupportBadge supported={provider.supports.byoc} label="BYOC" />
                  <SupportBadge supported={provider.supports.genesis} label="Genesis" />
                  <SupportBadge supported={provider.supports.rogue} label="Rogue" />
                </div>

                {provider.docsUrl && (
                  <div className="mt-4 pt-4 border-t border-border-default">
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent-primary hover:underline"
                    >
                      Documentation &rarr;
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap Providers */}
        <section className="mb-16">
          <h3 className="text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            Roadmap
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmapProviders.map((provider) => (
              <div
                key={provider.id}
                className="p-4 bg-surface-50 rounded-lg border border-border-default"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-text-primary">{provider.name}</h4>
                  {getStatusBadge(provider.status)}
                </div>
                <p className="text-sm text-text-secondary">{provider.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to Implement */}
        <section className="mb-16 p-8 bg-gradient-to-br from-accent-surface to-blue-50 rounded-xl border border-accent-border">
          <h3 className="text-2xl font-semibold text-text-primary mb-4">
            Build Your Own Provider
          </h3>
          <p className="text-text-secondary mb-6">
            Want to add support for your service? OBO is an open protocol. Anyone can implement a provider
            by following the{" "}
            <code className="px-2 py-1 bg-white rounded text-sm font-mono">Provider</code> interface.
          </p>

          <div className="bg-surface-900 text-surface-100 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-6">
            <pre>{`interface Provider {
  name: Target;
  description: string;
  tags: string[];
  supports: {
    oauth: boolean;
    genesis: boolean;
    byoc: boolean;
    rogue: boolean;
  };
  provision(request: SlipRequest): Promise<SlipResponse>;
  validate(credential: string, principal: Principal): Promise<boolean>;
  revoke(slip: Slip): Promise<void>;
}`}</pre>
          </div>

          <div className="space-y-4 text-sm text-text-secondary">
            <p>
              <strong className="text-text-primary">provision()</strong> - Accept or deny a slip request,
              returning credentials if approved
            </p>
            <p>
              <strong className="text-text-primary">validate()</strong> - Verify a credential works (for BYOC mode)
            </p>
            <p>
              <strong className="text-text-primary">revoke()</strong> - Clean up when a slip is revoked
            </p>
          </div>

          <div className="mt-6 flex gap-4">
            <a
              href="https://github.com/useobo/obo"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-surface-900 text-white rounded-lg hover:bg-surface-800 transition-colors font-medium"
            >
              View on GitHub
            </a>
            <a
              href="https://github.com/useobo/obo/tree/main/packages/providers"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-surface-900 rounded-lg hover:bg-surface-50 transition-colors font-medium border border-border-default"
            >
              Example Implementations
            </a>
          </div>
        </section>

        {/* Community */}
        <section className="text-center p-8 bg-surface-50 rounded-lg border border-border-default">
          <h3 className="text-xl font-semibold text-text-primary mb-2">Community Providers</h3>
          <p className="text-text-secondary mb-4">
            Built a provider? Share it with the community so others can benefit.
          </p>
          <a
            href="https://github.com/useobo/obo/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            Start a discussion &rarr;
          </a>
        </section>
      </main>
    </div>
  );
}
