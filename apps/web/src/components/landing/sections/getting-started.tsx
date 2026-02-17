"use client";

import { useState } from "react";
import { SectionHeader } from "../shared/section-header";
import { CodeBlock } from "../shared/code-block";
import { CTAButton } from "../shared/cta-button";

export function GettingStartedSection() {
  const [activeTab, setActiveTab] = useState<"self-hosted" | "managed">("self-hosted");

  const selfHostedCode = `# Install the obo MCP server
pnpm add @obo/mcp-server

# Add to your Claude MCP config (~/.claude/mcp.json)
{
  "obo": {
    "command": "node",
    "args": ["./node_modules/@obo/mcp-server/dist/index.js"],
    "env": {
      "OBO_API_URL": "http://localhost:3001",
      "OBO_PRINCIPAL": "your-email@example.com"
    }
  }
}`;

  const managedCode = `# Sign up at https://odie.io
# Create your first policy
# Start giving your agents access!

# Or use the MCP server with obo Cloud:
{
  "obo": {
    "command": "node",
    "args": ["./node_modules/@obo/mcp-server/dist/index.js"],
    "env": {
      "OBO_API_URL": "https://api.odie.io",
      "OBO_PRINCIPAL": "your-email@example.com"
    }
  }
}`;

  return (
    <section className="border-y border-border-default bg-surface-200/30">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <SectionHeader
          title="Get Started in Minutes"
          subtitle="Choose your path and start governing your AI agents today"
          centered
        />

        {/* Tab Switcher */}
        <div className="mx-auto max-w-lg">
          <div className="mb-8 flex rounded-full border border-border-default bg-surface-50 p-1">
            <button
              onClick={() => setActiveTab("self-hosted")}
              className={`flex-1 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                activeTab === "self-hosted"
                  ? "bg-accent-500 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Self-Hosted
            </button>
            <button
              onClick={() => setActiveTab("managed")}
              className={`flex-1 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                activeTab === "managed"
                  ? "bg-accent-500 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Managed
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-3xl">
          {activeTab === "self-hosted" ? (
            <div className="rounded-3xl border border-border-default bg-surface-50 p-8 shadow-[0_10px_26px_rgba(46,42,38,0.07)]">
              <h3 className="mb-4 text-xl font-semibold text-text-primary">
                Run obo Yourself
              </h3>
              <p className="mb-6 text-text-secondary">
                Install the MCP server, configure your targets and policies, and start granting
                your agents scoped access. Full documentation available on GitHub.
              </p>
              <CodeBlock code={selfHostedCode} language="bash" />
              <div className="mt-6 flex justify-center gap-4">
                <CTAButton
                  href="https://github.com/kyleto/obo"
                  variant="secondary"
                  className="group"
                >
                  <svg
                    className="mr-2 h-5 w-5 transition-transform group-hover:scale-110"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View Documentation
                </CTAButton>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-accent-300 bg-accent-50 p-8 shadow-[0_10px_26px_rgba(46,42,38,0.07)]">
              <h3 className="mb-4 text-xl font-semibold text-text-primary">
                Get Started with obo Cloud
              </h3>
              <p className="mb-6 text-text-secondary">
                Create a free account and start managing your agent policies through our beautiful
                web dashboard. No setup required.
              </p>
              <CodeBlock code={managedCode} language="bash" />
              <div className="mt-6 flex justify-center">
                <CTAButton href="/sign-up" variant="primary" className="justify-center">
                  Create Free Account
                </CTAButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
