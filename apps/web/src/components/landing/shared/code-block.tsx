"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = "bash", className = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group relative rounded-xl bg-surface-950 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{language}</span>
        <button
          onClick={handleCopy}
          className="rounded-lg p-1.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-800"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4 text-status-success-text" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <pre className="mt-2 overflow-x-auto text-sm text-surface-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
