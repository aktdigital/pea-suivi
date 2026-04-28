"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function ProduitsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("filter") ?? "en_cours";

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setFilter("en_cours")}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          current === "en_cours"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-accent"
        }`}
      >
        En cours de commercialisation
      </button>
      <button
        onClick={() => setFilter("tous")}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          current === "tous"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-accent"
        }`}
      >
        Tous
      </button>
    </div>
  );
}
