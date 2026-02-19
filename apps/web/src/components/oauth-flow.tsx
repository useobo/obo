// @ts-nocheck - tRPC types from API are not available at build time
"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface OAuthFlowProps {
  slipId: string;
  instructions: string | null;
  onComplete?: () => void;
}

type FlowState = "pending" | "polling" | "success" | "error" | "expired";

export function OAuthFlow({ slipId, instructions, onComplete }: OAuthFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>("pending");
  const [authUrl, setAuthUrl] = useState<string>("");
  const [userCode, setUserCode] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Parse instructions to extract OAuth details
  useEffect(() => {
    if (instructions) {
      // GitHub OAuth device flow format
      let visitMatch = instructions.match(/Visit:\s*(https?:\/\/[^\s]+)/);
      let codeMatch = instructions.match(/Enter code:\s*([A-Z0-9-]+)/);

      // Discord format: "Visit the following link..." or direct URL on its own line
      if (!visitMatch) {
        visitMatch = instructions.match(/Visit the following link[^\n]*\n+(https?:\/\/[^\s]+)/);
      }
      if (!visitMatch) {
        visitMatch = instructions.match(/(?:Visit|authorize)[^\n]*\s*(https?:\/\/[^\s]+)/i);
      }
      // Try to find any URL as a fallback
      if (!visitMatch) {
        visitMatch = instructions.match(/(https?:\/\/[^\s\n]+)/);
      }

      if (visitMatch) {
        setAuthUrl(visitMatch[1]);
        setFlowState("polling");
      }

      if (codeMatch) {
        setUserCode(codeMatch[1]);
      }
    }
  }, [instructions]);

  // Poll for token completion
  const { data: tokenData } = trpc.slips.getToken.useQuery(
    { slipId },
    {
      refetchInterval: flowState === "polling" ? 3000 : false,
      enabled: flowState === "polling",
    }
  );

  useEffect(() => {
    if (tokenData?.hasToken && tokenData.token) {
      setToken(tokenData.token.secret);
      setFlowState("success");
      onComplete?.();
    } else if (tokenData && !tokenData.hasToken && flowState === "polling") {
      // Still waiting...
    }
  }, [tokenData, flowState, onComplete]);

  const copyUrl = () => {
    navigator.clipboard.writeText(authUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // QR code URL (using a public API)
  const qrUrl = authUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(authUrl)}` : "";

  if (flowState === "success" && token) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-emerald-400">Authorization Complete!</h3>
            <p className="text-sm text-emerald-400/80">
              Your slip is now active and ready to use.
            </p>
          </div>
        </div>

        {/* Token display */}
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-emerald-400">
            Access Token
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-mono text-emerald-400">
              {token.slice(0, 12)}...{token.slice(-4)}
            </code>
            <button
              onClick={copyToken}
              className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (flowState === "error") {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-red-400">Authorization Failed</h3>
            <p className="text-sm text-red-400/80">{error}</p>
          </div>
        </div>
        <button
          onClick={() => setFlowState("pending")}
          className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-start gap-4">
        {/* Left side - Instructions */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
              <svg className="h-5 w-5 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Authorization Required</h3>
              <p className="text-sm text-white/60">
                Complete the authorization to activate your slip
              </p>
            </div>
          </div>

          {/* Step 1: URL */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-white/70">
              Step 1: Visit this URL
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm font-mono text-white break-all">
                {authUrl || "Loading..."}
              </code>
              <button
                onClick={copyUrl}
                disabled={!authUrl}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Step 2: Code (if applicable, e.g., GitHub device flow) */}
          {userCode && (
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-white/70">
                Step 2: Enter this code
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-center text-lg font-mono tracking-widest text-white">
                  {userCode}
                </code>
                <button
                  onClick={copyCode}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Authorize */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-white/70">
              {userCode ? "Step 3: Authorize the request" : "Step 2: Authorize the request"}
            </label>
            <p className="text-sm text-white/40">
              After authorizing, your slip will be automatically activated. This page will update.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <a
              href={authUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in New Tab
            </a>
          </div>
        </div>

        {/* Right side - QR Code */}
        {qrUrl && (
          <div className="hidden sm:block">
            <div className="rounded-xl border border-white/10 bg-white p-3">
              <img src={qrUrl} alt="QR Code" className="h-40 w-40" />
              <p className="mt-2 text-center text-xs text-gray-500">
                Scan with mobile device
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Polling status */}
      {flowState === "polling" && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-400">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Waiting for authorization...
        </div>
      )}
    </div>
  );
}
