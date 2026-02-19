"use client";

import Link from "next/link";
import { ProviderAvatar } from "@/components/provider-avatar";

export const dynamic = 'force-dynamic';

const providers = [
  { id: "github", name: "GitHub", description: "Git hosting and code collaboration", oauth: true },
  { id: "supabase", name: "Supabase", description: "Open source Firebase alternative", oauth: false },
  { id: "vercel", name: "Vercel", description: "Deploy frontend projects", oauth: false },
  { id: "slack", name: "Slack", description: "Messaging and notifications", oauth: false },
  { id: "linear", name: "Linear", description: "Project management and issues", oauth: false },
  { id: "notion", name: "Notion", description: "Docs, databases, and wikis", oauth: false },
  { id: "huggingface", name: "Hugging Face", description: "ML models, datasets, and AI platform", oauth: true },
  { id: "openai", name: "OpenAI", description: "GPT models, fine-tuning, and AI API", oauth: false },
  { id: "discord", name: "Discord", description: "Chat and community platform", oauth: true },
  { id: "stripe", name: "Stripe", description: "Payments infrastructure and billing", oauth: true },
  { id: "twitch", name: "Twitch", description: "Live streaming and chat platform", oauth: true },
  { id: "strava", name: "Strava", description: "Fitness tracking and athlete network", oauth: true },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 via-emerald-500/5 to-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-emerald-500 rounded-xl flex items-center justify-center font-bold text-lg">
                o
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">obo</h1>
                <p className="text-xs text-white/40">Credentials for agents acting on your behalf</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/useobo/obo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-white text-[#0a0a0a] text-sm font-semibold rounded-lg hover:bg-white/90 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl text-center relative z-10">
          <h2 className="text-6xl sm:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              API keys for AI
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-emerald-400 to-emerald-400 bg-clip-text text-transparent">
              agents
            </span>
          </h2>

          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Let your agents work on your behalf—with scoped, revocable access to the services they need.
            <span className="text-white/30"> No more copying API keys into chat.</span>
          </p>

          <div className="flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link
              href="/dashboard"
              className="group relative px-8 py-4 bg-white text-[#0a0a0a] font-semibold rounded-xl overflow-hidden transition-all hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5M6 17l5-5m0 0l-5-5" />
                </svg>
              </span>
            </Link>
            <a
              href="https://github.com/useobo/obo"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
            >
              Self-Host Guide
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-[bounce_2s_infinite]">
          <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Value Props - Cards with Visual Interest */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-transparent hover:from-purple-500/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-6 ring-1 ring-purple-500/20">
                  <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Fast, Not Fragile</h3>
                <p className="text-white/40 text-sm leading-relaxed">No more copy-pasting API keys. OAuth flow takes seconds. Your agent gets what it needs and moves on.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent hover:from-emerald-500/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-6 ring-1 ring-emerald-500/20">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Scoped Access</h3>
                <p className="text-white/40 text-sm leading-relaxed">Your agent only gets the permissions it requests. Read-only stays read-only. Nothing more.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent hover:from-blue-500/20 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-6 ring-1 ring-blue-500/20">
                  <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Revoke Anytime</h3>
                <p className="text-white/40 text-sm leading-relaxed">Done with the task? Revoke the slip. Token is invalidated. You stay in control.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Visual Timeline */}
      <section className="relative px-6 py-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-20">How it works</h3>

          <div className="relative">
            {/* Connection line - positioned at center of badges */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="grid md:grid-cols-4 gap-x-12 gap-y-8">
              {/* Step 1 */}
              <div className="relative text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 ring-4 ring-[#0a0a0a]">
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">1</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Agent Requests</h4>
                <p className="text-sm text-white/40 leading-relaxed">Your AI agent asks for access to a service like Discord</p>
              </div>

              {/* Step 2 */}
              <div className="relative text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 ring-4 ring-[#0a0a0a]">
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">2</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">You Approve</h4>
                <p className="text-sm text-white/40 leading-relaxed">Click a link, authorize on the provider's site via OAuth</p>
              </div>

              {/* Step 3 */}
              <div className="relative text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 ring-4 ring-[#0a0a0a]">
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">3</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Token Issued</h4>
                <p className="text-sm text-white/40 leading-relaxed">Agent receives a scoped, temporary access token</p>
              </div>

              {/* Step 4 */}
              <div className="relative text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-emerald-500/20 border border-white/20 flex items-center justify-center mb-5 ring-4 ring-[#0a0a0a]">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Revoke Anytime</h4>
                <p className="text-sm text-white/40 leading-relaxed">Done? Revoke the slip. Token is immediately invalidated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Providers Grid */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Supported Services</h3>
            <p className="text-white/40">14+ providers · OAuth or bring your own credentials</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {providers.map((provider, index) => (
              <div
                key={provider.id}
                className="group relative p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <ProviderAvatar name={provider.name} size="sm" />
                  <span className="font-medium">{provider.name}</span>
                  {provider.oauth && (
                    <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">OAuth</span>
                  )}
                </div>
                <p className="text-xs text-white/30">{provider.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-white/20">More coming soon: AWS, Atlassian, Salesforce...</p>
          </div>
        </div>
      </section>

      {/* Two ways to use Obo */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Two ways to get started</h3>
            <p className="text-white/40">Hosted for convenience, or self-hosted for control</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Hosted option */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-white/10 hover:border-purple-500/30 transition-all">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-5">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-3">useobo.com</h4>
                <p className="text-white/50 text-sm mb-6 leading-relaxed">
                  Zero setup. Just sign in and start creating slips. We handle the infrastructure, database, and OAuth callbacks.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors"
                >
                  Get started
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5M6 17l5-5m0 0l-5-5" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Self-host option */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-white/10 hover:border-emerald-500/30 transition-all">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-5">
                  <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-3">Self-host Obo</h4>
                <p className="text-white/50 text-sm mb-6 leading-relaxed">
                  Run it on your own infrastructure. MIT-licensed, fully open source. Keep everything on your servers, always free.
                </p>
                <a
                  href="https://github.com/useobo/obo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
                >
                  View on GitHub
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MCP Install */}
      <section className="relative px-6 py-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-2xl font-semibold mb-4">Use with Claude Code</h3>
          <p className="text-white/40 mb-8">Add Obo to your Claude config to start requesting API keys in agent workflows</p>

          <div className="p-6 rounded-2xl bg-[#0f0f0f] border border-white/10 text-left overflow-x-auto">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-white/30 text-sm">~/.claude/mcp.json</span>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify({ mcpServers: { obo: { command: "node", args: ["/path/to/@useobo/mcp/dist/index.js"] } } }, null, 2))}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="text-sm overflow-x-auto"><code className="text-emerald-400">{`{
  "mcpServers": {
    "obo": {
      "command": "node",
      "args": ["/path/to/@useobo/mcp/dist/index.js"]
    }
  }
}`}</code></pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/5">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} OBO · Open source, MIT license
          </p>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="https://github.com/useobo/obo" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">
              GitHub
            </a>
            <a href="https://github.com/useobo/obo/discussions" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">
              Discussions
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
