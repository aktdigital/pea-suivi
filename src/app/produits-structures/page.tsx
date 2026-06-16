import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { ProduitCard } from "@/components/produits-structures/produit-card";
import { ProduitsFilter } from "@/components/produits-structures/produits-filter";
import { ProduitsSearch } from "@/components/produits-structures/produits-search";
import { NouveauProduitDialog } from "@/components/produits-structures/nouveau-produit-dialog";

interface PageProps {
  searchParams: Promise<{ filter?: string; q?: string }>;
}

function unique(arr: (string | null | undefined)[]): string[] {
  return [...new Set(arr.filter((v): v is string => Boolean(v)))].sort();
}

export default async function ProduitsStructuresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = params.filter ?? "en_cours";
  const q = params.q?.trim().toLowerCase() ?? "";

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("produits_structures")
    .select("isin, nom_produit, sous_jacent, mecanisme, duree, frequence_rappel, protection_gain, protection_capital, degressivite, objectif_rendement, eligible_contrats, upfront_brut, date_fin_commercialisation, enveloppe_reservee, montant_fait, restant_a_faire, compagnies_cibles, commentaire, active, structureur, total_new_cash, total_encours, ca_up_front, mois_creation")
    .eq("active", true)
    .order("nom_produit");

  if (filter === "en_cours") {
    query = query.gte("date_fin_commercialisation", today);
  }

  const [
    { data: allProduits, error },
    { data: allForDistinct },
    { data: refFrequences },
    { data: refCompagnies },
  ] = await Promise.all([
    query,
    supabase
      .from("produits_structures")
      .select("mecanisme, duree, eligible_contrats, structureur")
      .eq("active", true),
    supabase.from("ref_frequences").select("id, label, ordre").order("ordre"),
    supabase.from("ref_compagnies").select("id, label, ordre, active").eq("active", true).order("ordre"),
  ]);

  // Filtrage textuel
  const produits = q
    ? (allProduits ?? []).filter(
        (p) =>
          p.isin.toLowerCase().includes(q) ||
          p.nom_produit.toLowerCase().includes(q)
      )
    : (allProduits ?? []);

  // Listes distinctes pour le dialog de création
  const mecanismes = unique((allForDistinct ?? []).map((p) => p.mecanisme));
  const durees = unique((allForDistinct ?? []).map((p) => p.duree));
  const eligibleContrats = unique((allForDistinct ?? []).map((p) => p.eligible_contrats));
  const structureurs = unique((allForDistinct ?? []).map((p) => p.structureur));
  const frequences = (refFrequences ?? []).map((f) => f.label);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Produits Structurés</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Catalogue des produits structurés — Phoenix, Autocall, etc.
            </p>
          </div>
          <NouveauProduitDialog
            mecanismes={mecanismes}
            durees={durees}
            frequences={frequences}
            eligibleContrats={eligibleContrats}
            compagnies={refCompagnies ?? []}
            structureurs={structureurs}
          />
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
