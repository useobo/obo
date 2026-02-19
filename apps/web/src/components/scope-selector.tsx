"use client";

import { useState } from "react";
import {
  getProviderScopes,
  type ScopeOption,
  type ScopePreset,
  type ScopeGroup,
} from "./scope-presets";

interface ScopeSelectorProps {
  provider: string;
  value: string[];
  onChange: (scopes: string[]) => void;
}

export function ScopeSelector({ provider, value, onChange }: ScopeSelectorProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const providerScopes = getProviderScopes(provider);

  // Check if current scopes match a preset
  const activePreset = providerScopes.presets.find(
    (preset) =>
      !isCustomMode &&
      preset.scopes.length === value.length &&
      preset.scopes.every((scope) => value.includes(scope))
  );

  // Toggle scope selection
  const toggleScope = (scopeKey: string) => {
    if (value.includes(scopeKey)) {
      onChange(value.filter((s) => s !== scopeKey));
    } else {
      onChange([...value, scopeKey]);
    }
  };

  // Select a preset
  const selectPreset = (preset: ScopePreset) => {
    onChange(preset.scopes);
    setIsCustomMode(false);
  };

  // Toggle group expansion
  const toggleGroup = (category: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedGroups(newExpanded);
  };

  // Risk level colors
  const riskColors = {
    low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const riskLabels = {
    low: "Low Risk",
    medium: "Medium",
    high: "High Risk",
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white">
        Access Level
      </label>

      {/* Preset chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {providerScopes.presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => selectPreset(preset)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 ${
              activePreset?.id === preset.id && !isCustomMode
                ? "border-purple-500 bg-purple-500 text-white shadow-md"
                : "border-white/10 bg-white/5 text-white hover:border-white/20"
            }`}
          >
            {preset.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIsCustomMode(true)}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 ${
            isCustomMode
              ? "border-purple-500 bg-purple-500 text-white shadow-md"
              : "border-white/10 bg-white/5 text-white hover:border-white/20"
          }`}
        >
          Custom
        </button>
      </div>

      {/* Active scopes summary */}
      {value.length > 0 && (
        <div className="mb-4 rounded-xl bg-white/5 p-3">
          <div className="mb-2 text-xs font-medium text-white/70">
            Selected Scopes ({value.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {value.map((scope) => (
              <span
                key={scope}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white"
              >
                {scope}
                <button
                  type="button"
                  onClick={() => toggleScope(scope)}
                  className="hover:text-red-400 transition-colors"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom scope selection */}
      {isCustomMode && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white">Custom Scopes</div>
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              Use presets instead
            </button>
          </div>

          {providerScopes.groups.map((group: ScopeGroup) => {
            const isExpanded = expandedGroups.has(group.category);
            const hasSelectedInGroup = group.scopes.some((scope) =>
              value.includes(scope.key)
            );

            return (
              <div key={group.category} className="border-b border-white/5 last:border-0 pb-3 last:pb-0">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.category)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="text-sm font-medium text-white">
                    {group.category}
                  </span>
                  <svg
                    className={`h-4 w-4 text-white/40 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="mt-2 space-y-2">
                    {group.scopes.map((scope: ScopeOption) => {
                      const isSelected = value.includes(scope.key);

                      return (
                        <div
                          key={scope.key}
                          className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                            isSelected
                              ? "border-purple-500/50 bg-purple-500/10"
                              : "border-white/5 bg-white/5 hover:border-white/10"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleScope(scope.key)}
                            className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                              isSelected
                                ? "border-purple-500 bg-purple-500 text-white"
                                : "border-white/20 bg-white/5"
                            }`}
                          >
                            {isSelected && (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                {scope.name}
                              </span>
                              <span
                                className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${riskColors[scope.risk]}`}
                              >
                                {riskLabels[scope.risk]}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-white/50">
                              {scope.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Preset description */}
      {!isCustomMode && activePreset && (
        <div className="mt-2 text-xs text-white/40">
          {activePreset.description}
        </div>
      )}
    </div>
  );
}
