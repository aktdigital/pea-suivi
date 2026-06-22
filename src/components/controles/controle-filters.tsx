"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";

interface ControleFiltersClientProps {
  conseillers: { code: string; full_name: string }[];
  initialQ: string;
  initialConseiller: string;
}

export function ControleFiltersClient({ conseillers }: ControleFiltersClientProps) {
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

  return (
    <div className="flex flex-wrap gap-3 items-end">
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
    </div>
  );
}
