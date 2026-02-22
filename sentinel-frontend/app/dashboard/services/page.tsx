'use client';

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/common/Button";
import { Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { useContainers } from "@/hooks/useContainers";

export default function ServicesPage() {

  // ✅ get containers from hook
  const { containers, loading, error } = useContainers();
  if (error) {
  return (
    <div>
      <DashboardHeader />
      <div className="p-6 text-sm text-red-400">
        Failed to load containers.
      </div>
    </div>
  );
}

  // ✅ search + filter state
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | 'running' | 'stopped' | 'unhealthy'>('all');

  // ✅ filtering logic
  const filteredContainers = useMemo(() => {
  if (!containers) return [];

  const q = query.trim().toLowerCase();

  return containers.filter((c: any) => {
    const name = c.name?.toLowerCase() || '';
    const image = c.image?.toLowerCase() || '';
    const status = c.status?.toLowerCase() || '';

    // 🔎 search matching
    const matchesQuery =
      name.includes(q) ||
      image.includes(q) ||
      status.includes(q);

    // 🎯 status filter
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : status.includes(statusFilter);

    return matchesQuery && matchesStatus;
  });
}, [containers, query, statusFilter]);

  // ✅ loading state
  if (loading) {
    return (
      <div>
        <DashboardHeader />
        <div className="p-6 text-sm text-muted-foreground">
          Loading containers...
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader />

      <div className="p-4 lg:p-6 space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Services
            </h1>
            <p className="text-muted-foreground">
              Manage and monitor your containers.
            </p>
          </div>

          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        </div>

        {/* ✅ SEARCH BAR */}
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search containers..."
        />

        {/* ✅ FILTER CHIPS */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'running', 'stopped', 'unhealthy'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-3 py-1 text-xs rounded-full border ${
                statusFilter === status
                  ? 'bg-primary text-white border-primary'
                  : 'border-white/10 text-muted-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* ✅ CONTAINER LIST (simple for now) */}
        {filteredContainers.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {query
              ? `No containers match "${query}"`
              : "No containers available"}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredContainers.map((c: any) => (
              <div
                key={c.id}
                className="p-4 rounded-lg border border-white/10 bg-white/5"
              >
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">
                  {c.image} • {c.status}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}