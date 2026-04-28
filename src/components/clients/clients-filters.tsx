"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

interface ClientsFiltersProps {
  conseillers: { code: string; full_name: string }[];
}

export function ClientsFilters({ conseillers }: ClientsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Conseiller</label>
        <select
          value={searchParams.get("conseiller") ?? ""}
          onChange={(e) => setParam("conseiller", e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Tous</option>
          {conseillers.map((c) => (
            <option key={c.code} value={c.code}>
              {c.full_name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Recherche</label>
        <Input
          type="search"
          placeholder="Nom du client…"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => setParam("q", e.target.value)}
          className="w-56"
        />
      </div>
    </div>
  );
}
