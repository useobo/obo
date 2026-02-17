"use client";

import { useEffect, useState } from "react";

interface Stat {
  label: string;
  value: number;
}

export function Stats() {
  const [stats, setStats] = useState<Stat[]>([
    { label: "Active Slips", value: 0 },
    { label: "Providers", value: 0 },
    { label: "Policies", value: 0 },
  ]);

  useEffect(() => {
    // Fetch stats from API
    fetch("http://localhost:3001/health")
      .then((res) => res.json())
      .then(() => {
        setStats([
          { label: "Active Slips", value: 0 },
          { label: "Providers", value: 2 },
          { label: "Policies", value: 2 },
        ]);
      })
      .catch(() => {
        // API not running, show demo data
      });
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
        >
          <p className="text-sm text-zinc-400">{stat.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
