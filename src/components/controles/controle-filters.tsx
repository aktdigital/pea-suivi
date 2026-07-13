"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { DebouncedSearchInput } from "@/components/ui/debounced-search-input";
import { MOIS } from "@/lib/utils";

interface RefStatutControle {
  code: string;
  label: string;
  ordre: number | null;
}

interface ControleFiltersClientProps {
  conseillers: { code: string; full_name: string }[];
  compagnies: { id: number; label: string }[];
  statutsControle: RefStatutControle[];
}

export function ControleFiltersClient({ conseillers, compagnies, statutsControle }: ControleFiltersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      // replace + scroll:false : pas d'entrée d'historique par frappe, pas de remontée en haut de page
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const currentYear = new Date().getFullYear();
  const moisOptions = Array.from({ length: 12 }, (_, i) => ({
    value: `${currentYear}-${String(i + 1).padStart(2, "0")}`,
    label: `${MOIS[i]} ${currentYear}`,
  }));

  const selectCls =
    "h-9 rounded-md border border-pea-gray/30 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-pea-teal text-pea-graphite";

  const statutSelect = (key: string, label: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">{label}</label>
      <select value={searchParams.get(key) ?? ""} onChange={(e) => setParam(key, e.target.value)} className={selectCls}>
        <option value="">Tous</option>
        {statutsControle.map((s) => (
          <option key={s.code} value={s.code}>{s.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Période */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Période</label>
        <select value={searchParams.get("mois") ?? ""} onChange={(e) => setParam("mois", e.target.value)} className={selectCls}>
          <option value="">Tous les mois</option>
          {moisOptions.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Recherche client */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Recherche client</label>
        <DebouncedSearchInput placeholder="Nom du client…" initialValue={searchParams.get("q") ?? ""} onCommit={(v) => setParam("q", v)} className="w-44" />
      </div>

      {/* Compagnie */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Compagnie</label>
        <select value={searchParams.get("compagnie") ?? ""} onChange={(e) => setParam("compagnie", e.target.value)} className={selectCls}>
          <option value="">Toutes</option>
          {compagnies.map((c) => (
            <option key={c.id} value={c.label}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Conseiller */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Conseiller</label>
        <select value={searchParams.get("conseiller") ?? ""} onChange={(e) => setParam("conseiller", e.target.value)} className={selectCls}>
          <option value="">Tous</option>
          {conseillers.map((c) => (
            <option key={c.code} value={c.code}>{c.full_name} ({c.code})</option>
          ))}
        </select>
      </div>

      {/* Contrat */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-pea-gray uppercase tracking-wide">Contrat</label>
        <DebouncedSearchInput placeholder="Contrat / n°…" initialValue={searchParams.get("contrat") ?? ""} onCommit={(v) => setParam("contrat", v)} className="w-36" />
      </div>

      {/* Statuts des 3 contrôles */}
      {statutSelect("courrier_pea", "Courrier PEA")}
      {statutSelect("lettre_mission", "Lettre mission")}
      {statutSelect("conformite", "Conformité")}
    </div>
  );
}
