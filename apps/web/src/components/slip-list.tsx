// @ts-nocheck - tRPC types from API are not available at build time
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ProviderAvatar } from "./provider-avatar";
import Link from "next/link";

type SortOption = "date" | "target" | "status";
type StatusFilter = "all" | "active" | "revoked" | "expired";

export function SlipList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [page, setPage] = useState(1);

  const { data: slips = [], isLoading } = trpc.slips.list.useQuery(
    {
      active_only: statusFilter === "active" ? true : undefined,
    },
    { refetchInterval: 5000 }
  );

  const utils = trpc.useUtils();

  const cleanupSlips = trpc.slips.cleanup.useMutation({
    onSuccess: () => {
      utils.slips.list.invalidate();
    },
  });

  const revokeSlip = trpc.slips.revoke.useMutation({
    onSuccess: () => {
      utils.slips.list.invalidate();
    },
  });

  // Filter and sort slips
  const filteredSlips = slips
    .filter((slip: any) => {
      // Status filter
      if (statusFilter !== "all" && statusFilter !== "active") {
        if (statusFilter === "revoked" && slip.status !== "revoked") return false;
        if (statusFilter === "expired" && slip.status !== "expired") return false;
      }
      if (statusFilter === "active" && slip.status !== "active") return false;

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          slip.id?.toLowerCase().includes(searchLower) ||
          slip.target?.toLowerCase().includes(searchLower) ||
          slip.principal?.toLowerCase().includes(searchLower) ||
          slip.grantedScope?.some((s: string) => s.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "target":
          return a.target?.localeCompare(b.target);
        case "status":
          return a.status?.localeCompare(b.status);
        case "date":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredSlips.length / itemsPerPage);
  const paginatedSlips = filteredSlips.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getStatusBadge = (status: string) => {
    if (status === "revoked") {
      return (
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-red-500/10 border-red-500/20 text-red-400">
          Revoked
        </span>
      );
    }
    if (status === "expired") {
      return (
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-amber-500/10 border-amber-500/20 text-amber-400">
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
        Active
      </span>
    );
  };

  const formatDate = (dateStr: string | Date) => {
    // The database stores timestamps in LOCAL time but the API returns them with 'Z' (UTC marker)
    // Example: DB has 14:50 Pacific, API returns "2026-02-18T14:50:08.763Z"
    // JS parses this as 14:50 UTC = 6:50 AM Pacific, showing "8h ago"
    // Fix: Remove the 'Z' so JS treats it as local time (which it actually is in the DB)
    let date: Date;
    if (typeof dateStr === 'string') {
      // Strip 'Z' suffix - the DB stores local time but incorrectly labels it as UTC
      const cleanedDate = dateStr.replace(/Z$/, '');
      date = new Date(cleanedDate);
    } else {
      date = dateStr;
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 30) return "Just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Active Slips</h2>
            <button
              onClick={() => cleanupSlips.mutate()}
              disabled={cleanupSlips.isPending}
              className="text-sm text-white/40 hover:text-white/60 disabled:opacity-50 transition-colors"
            >
              Clean up old
            </button>
          </div>
          <Link
            href="/request"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Slip
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by target, principal, or scope..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
          >
            <option value="active">Active</option>
            <option value="all">All</option>
            <option value="revoked">Revoked</option>
            <option value="expired">Expired</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
          >
            <option value="date">Sort by Date</option>
            <option value="target">Sort by Target</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-8 text-center text-white/50">Loading slips...</div>
      ) : filteredSlips.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <svg className="h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white">No slips found</h3>
          <p className="mt-1 text-sm text-white/50">
            {search ? "Try adjusting your search or filters" : "Create a slip to get started"}
          </p>
          {!search && (
            <Link
              href="/request"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
            >
              Create Slip
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table view */}
          <div className="hidden sm:block">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/[0.02]">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                    Target
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                    Principal
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                    Scopes
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                    Created
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedSlips.map((slip: any) => (
                  <tr key={slip.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ProviderAvatar name={slip.target} size="sm" />
                        <span className="font-medium capitalize text-white">{slip.target}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">{slip.principal}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {slip.grantedScope?.slice(0, 2).map((scope: string) => (
                          <span
                            key={scope}
                            className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/60"
                          >
                            {scope}
                          </span>
                        ))}
                        {slip.grantedScope?.length > 2 && (
                          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/40">
                            +{slip.grantedScope.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {formatDate(slip.createdAt)}
                      {slip.provisioningMethod === "oauth" && (
                        <div className="mt-1">
                          {slip.tokenId ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Token ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Awaiting OAuth
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {slip.status === "active" && (
                        <button
                          onClick={() => revokeSlip.mutate({ id: slip.id })}
                          disabled={revokeSlip.isPending}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden divide-y divide-white/5">
            {paginatedSlips.map((slip: any) => (
              <div key={slip.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ProviderAvatar name={slip.target} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium capitalize text-white">{slip.target}</h3>
                        {slip.provisioningMethod === "oauth" && (
                          slip.tokenId ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Awaiting OAuth
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-xs text-white/60">{slip.principal}</p>
                    </div>
                  </div>
                  {slip.status === "active" && (
                    <button
                      onClick={() => revokeSlip.mutate({ id: slip.id })}
                      disabled={revokeSlip.isPending}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {slip.grantedScope?.slice(0, 3).map((scope: string) => (
                      <span
                        key={scope}
                        className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/60"
                      >
                        {scope}
                      </span>
                    ))}
                    {slip.grantedScope?.length > 3 && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/40">
                        +{slip.grantedScope.length - 3}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-white/40">{formatDate(slip.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/50">
                  Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredSlips.length)} of{" "}
                  {filteredSlips.length} slips
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`min-w-[2rem] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                            page === pageNum
                              ? "bg-gradient-to-r from-purple-500 to-emerald-500 text-white"
                              : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
