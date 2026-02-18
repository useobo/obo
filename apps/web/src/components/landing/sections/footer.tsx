import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border-default bg-surface-200/50">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500">
                <span className="text-lg font-bold text-white">O</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">obo</h3>
                <p className="text-xs text-text-secondary">On Behalf Of</p>
              </div>
            </Link>
            <p className="mt-4 text-sm text-text-secondary">
              Agentic API governance for the modern stack. Built for the future of AI.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-text-primary">Product</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/useobo/obo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-in"
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-text-primary">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/useobo/obo#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/useobo/obo/blob/main/packages/mcp/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  MCP Server Guide
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/useobo/obo/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  Issues
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-text-primary">Legal</h4>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-text-tertiary">Privacy Policy</span>
              </li>
              <li>
                <span className="text-sm text-text-tertiary">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border-default pt-8">
          <p className="text-center text-sm text-text-tertiary">
            © {currentYear} obo. Built for the agentic future.
          </p>
        </div>
      </div>
    </footer>
  );
}
