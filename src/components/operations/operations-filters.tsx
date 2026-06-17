"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MOIS } from "@/lib/utils";

interface FiltersProps {
  conseillers: { code: string; full_name: string }[];
  statuts: { id: number; label: string }[];
  typeOps: { id: number; label: string }[];
  assistantes: { id: string; full_name: string | null; email: string | null }[];
  assistantesCommerciales: { id: string; full_name: string | null; email: string | null }[];
  compagnies: { id: number; label: string }[];
}

export function OperationsFilters({ conseillers, statuts, typeOps, assistantes, assistantesCommerciales, compagnies }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const currentYear = new Date().getFullYear();
  const moisOptions = Array.from({ length: 12 }, (_, i) => ({
    value: `${currentYear}-${String(i + 1).padStart(2, "0")}`,
    label: `${MOIS[i]} ${currentYear}`,
  }));

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Période */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Période</label>
        <select
          value={searchParams.get("mois") ?? ""}
          onChange={(e) => setParam("mois", e.target.value)}
          className="h-9 rounded-md border border-pea-gray/30 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-pea-teal text-pea-graphite"
        >
          <option value="">Tous les mois</option>
          {moisOptions.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Conseiller */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Conseiller</label>
        <select
          value={searchParams.get("conseiller") ?? ""}
          onChange={(e) => setParam("conseiller", e.target.value)}
          className="h-9 rounded-md border border-pea-gray/30 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-pea-teal text-pea-graphite"
        >
          <option value="">Tous</option>
          {conseillers.map((c) => (
            <option key={c.code} value={c.code}>{c.full_name} ({c.code})</option>
          ))}
        </select>
      </div>

      {/* Statut */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Statut</label>
        <select
          value={searchParams.get("statut") ?? ""}
          onChange={(e) => setParam("statut", e.target.value)}
          className="h-9 rounded-md border border-pea-gray/30 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-pea-teal text-pea-graphite"
        >
          <option value="">Tous</option>
          {statuts.map((s) => (
            <option key={s.id} value={s.label}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Type opération */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Type opération</label>
        <select
          value={searchParams.get("type") ?? ""}
          onChange={(e) => setParam("type", e.target.value)}
          className="h-9 rounded-md border border-pea-gray/30 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-pea-teal text-pea-graphite"
        >
          <option value="">Tous</option>
          {typeOps.map((t) => (
            <option key={t.id} value={t.label}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Recherche client */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Recherche client</label>
        <Input
          type="search"
          placeholder="Nom du client…"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => setParam("q", e.target.value)}
          className="w-48"
        />
      </div>

      {/* Par (assistante) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Par</label>
        <select
          value={searchParams.get("par") ?? ""}
          onChange={(e) => setParam("par", e.target.value)}
          className="h-9 rounded-md border border-pea-gray/30 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-pea-teal text-pea-graphite"
        >
          <option value="">Toutes</option>
          {assistantes.map((a) => (
            <option key={a.id} value={a.id}>{a.full_name ?? a.email ?? a.id}</option>
          ))}
        </select>
      </div>

      {/* Assistante commerciale */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Assistante commerciale</label>
        <select
          value={searchParams.get("assistante") ?? ""}
          onChange={(e) => setParam("assistante", e.target.value)}
          className="h-9 rounded-md border border-pea-gray/30 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-pea-teal text-pea-graphite"
        >
          <option value="">Toutes</option>
          {assistantesCommerciales.map((a) => (
            <option key={a.id} value={a.id}>{a.full_name ?? a.email ?? a.id}</option>
          ))}
        </select>
      </div>

      {/* ISIN */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">ISIN</label>
        <Input
          type="search"
          placeholder="Code ISIN…"
          defaultValue={searchParams.get("isin") ?? ""}
          onChange={(e) => setParam("isin", e.target.value)}
          className="w-36"
        />
      </div>

      {/* Compagnie */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Compagnie</label>
        <select
          value={searchParams.get("compagnie") ?? ""}
          onChange={(e) => setParam("compagnie", e.target.value)}
          className="h-9 rounded-md border border-pea-gray/30 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-pea-teal text-pea-graphite"
        >
          <option value="">Toutes</option>
          {compagnies.map((c) => (
            <option key={c.id} value={c.label}>{c.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
