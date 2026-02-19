// @ts-nocheck - tRPC types from API are not available at build time
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { providerCategories } from "./scope-presets";
import { ProviderAvatar, getProviderColor } from "./provider-avatar";

interface Provider {
  id: string;
  name: string;
  description: string;
  tags: string[];
  supports: {
    oauth: boolean;
    genesis: boolean;
    byoc: boolean;
    rogue: boolean;
  };
}

interface ProviderSelectorProps {
  value: string | null;
  onChange: (provider: string) => void;
}

export function ProviderSelector({ value, onChange }: ProviderSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: providers = [], isLoading, isError, error } = trpc.providers.list.useQuery();

  // Filter providers by search term
  const filteredProviders = providers?.filter((p: Provider) => {
    const searchTerm = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchTerm) ||
      p.description?.toLowerCase().includes(searchTerm) ||
      p.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
    );
  }) || [];

  // Group providers by category
  const groupedProviders = filteredProviders?.reduce((acc: Record<string, Provider[]>, provider: Provider) => {
    const category = providerCategories[provider.name] || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(provider);
    return acc;
  }, {}) || {};

  const selectedProvider = providers?.find((p: Provider) => p.name === value);

  return (
    <div className="relative">
      <label htmlFor="provider-search" className="mb-2 block text-sm font-medium text-text-primary">
        Select Provider
      </label>

      {/* Selected provider display / trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-border-default bg-surface-100 px-4 py-3 text-left transition-colors hover:border-border-hover focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-500/40"
      >
        {selectedProvider ? (
          <div className="flex items-center gap-3">
            <ProviderAvatar name={selectedProvider.name} size="lg" />
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary capitalize">{selectedProvider.name}</span>
              {selectedProvider.supports.oauth && (
                <span className="rounded-full bg-status-info-bg px-2 py-0.5 text-[10px] font-medium text-status-info-text border border-status-info-border">
                  OAuth
                </span>
              )}
              {selectedProvider.supports.genesis && (
                <span className="rounded-full bg-status-success-bg px-2 py-0.5 text-[10px] font-medium text-status-success-text border border-status-success-border">
                  Genesis
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-text-tertiary">Search providers...</span>
        )}
        <svg
          className={`h-5 w-5 text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-96 w-full overflow-hidden rounded-2xl border border-border-default bg-surface-50 shadow-[0_10px_30px_rgba(46,42,38,0.12)]">
          {/* Search input */}
          <div className="border-b border-border-default p-3">
            <input
              id="provider-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search providers..."
              className="w-full rounded-lg border border-border-default bg-surface-100 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-500/40"
              autoFocus
            />
          </div>

          {/* Provider list */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-text-secondary">Loading providers...</div>
            ) : isError ? (
              <div className="p-8 text-center text-status-error-text">
                Failed to load providers.{" "}
                {error?.message && <span className="text-xs">({error.message})</span>}
              </div>
            ) : !filteredProviders || filteredProviders.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">No providers found</div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedProviders || {}).map(([category, categoryProviders]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                      {category}
                    </div>
                    {categoryProviders.map((provider: Provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => {
                          onChange(provider.name);
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-200 ${
                          value === provider.name ? "bg-accent-100" : ""
                        }`}
                      >
                        <ProviderAvatar name={provider.name} size="md" />
                        <div className="flex flex-1 items-center justify-between">
                          <span className="font-medium text-text-primary capitalize">
                            {provider.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {provider.supports.oauth && (
                              <span className="rounded-full bg-status-info-bg px-1.5 py-0.5 text-[10px] font-medium text-status-info-text border border-status-info-border">
                                OAuth
                              </span>
                            )}
                            {provider.supports.genesis && (
                              <span className="rounded-full bg-status-success-bg px-1.5 py-0.5 text-[10px] font-medium text-status-success-text border border-status-success-border">
                                Genesis
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
