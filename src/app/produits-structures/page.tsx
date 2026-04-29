import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { ProduitCard } from "@/components/produits-structures/produit-card";
import { ProduitsFilter } from "@/components/produits-structures/produits-filter";
import { ProduitsSearch } from "@/components/produits-structures/produits-search";

interface PageProps {
  searchParams: Promise<{ filter?: string; q?: string }>;
}

export default async function ProduitsStructuresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = params.filter ?? "en_cours";
  const q = params.q?.trim().toLowerCase() ?? "";

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("produits_structures")
    .select("*")
    .eq("active", true)
    .order("nom_produit");

  if (filter === "en_cours") {
    query = query.gte("date_fin_commercialisation", today);
  }

  const { data: allProduits, error } = await query;

  // Filtre textuel côté JS (ISIN exact/contient + nom contient, case-insensitive)
  const produits = q
    ? (allProduits ?? []).filter(
        (p) =>
          p.isin.toLowerCase().includes(q) ||
          p.nom_produit.toLowerCase().includes(q)
      )
    : (allProduits ?? []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produits Structurés</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catalogue des produits structurés — Phoenix, Autocall, etc.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <ProduitsFilter />
          <div className="sm:ml-auto sm:w-80">
            <Suspense>
              <ProduitsSearch />
            </Suspense>
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive p-4 border rounded-md">
            Erreur : {error.message}
          </div>
        )}

        {!error && produits.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <p className="text-sm">Aucun produit pour ce filtre.</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {produits.map((p) => (
            <ProduitCard key={p.isin} produit={p} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
