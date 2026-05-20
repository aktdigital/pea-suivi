import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { OperationsFilters } from "@/components/operations/operations-filters";
import { OperationsTable } from "@/components/operations/operations-table";
import { OperationFormButton } from "@/components/operations/operation-form";
import { TrendingUp, Banknote, RefreshCw, AlertCircle } from "lucide-react";
import type { Client, Conseiller } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ mois?: string; conseiller?: string; statut?: string; type?: string; q?: string; controle_a_faire?: string; par?: string; isin?: string; compagnie?: string }>;
}

export default async function OperationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Mois courant par défaut — "" ou "all" = tous les mois (pas de filtre date)
  const now = new Date();
  const defaultMois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const moisRaw = params.mois;
  const mois = (!moisRaw || moisRaw === "all") ? undefined : moisRaw;
  const moisForKpi = mois ?? defaultMois;

  // Chargement des référentiels en parallèle
  const [
    { data: conseillers },
    { data: refStatuts },
    { data: refOps },
    { data: refProduits },
    { data: refCompagnies },
    { data: clients },
    { data: produitsStructures },
    { data: assistantes },
  ] = await Promise.all([
    supabase.from("conseillers").select("code, full_name, email, active").eq("active", true).order("code"),
    supabase.from("ref_statuts").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_operations").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_produits").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_compagnies").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("clients").select("id, nom, prenom, type_personne, conseiller_code, email, telephone, notes, created_at, updated_at").order("nom"),
    supabase.from("produits_structures").select("isin, nom_produit").eq("active", true).order("nom_produit"),
    supabase.from("profiles").select("id, full_name, email, role").in("role", ["assistante_commerciale", "assistante_admin"]).order("full_name"),
  ]);

  // KPIs toujours sur le mois affiché (mois sélectionné ou mois courant par défaut)
  const [year, month] = moisForKpi.split("-");
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();

  let kpiQuery = supabase
    .from("operations")
    .select("montant, collecte_type, statut, conseiller_code")
    .gte("date", `${year}-${month}-01`)
    .lte("date", `${year}-${month}-${lastDay}`);

  if (params.conseiller) kpiQuery = kpiQuery.eq("conseiller_code", params.conseiller);

  const { data: kpiData } = await kpiQuery;

  const totalOps = kpiData?.length ?? 0;
  const totalNewCash = kpiData
    ?.filter((op) => op.collecte_type === "new_cash")
    .reduce((acc, op) => acc + (op.montant ?? 0), 0) ?? 0;
  const totalEncours = kpiData
    ?.filter((op) => op.collecte_type === "encours")
    .reduce((acc, op) => acc + (op.montant ?? 0), 0) ?? 0;
  // Opérations en cours = non validées (statut ne contient pas "Validé, avenant récupéré")
  const nbEnCours = kpiData?.filter((op) => !op.statut?.toLowerCase().includes("récupéré")).length ?? 0;

  const kpis = [
    { label: "Opérations", value: totalOps, icon: TrendingUp, suffix: "" },
    { label: "New Cash", value: formatCurrency(totalNewCash), icon: Banknote, suffix: "" },
    { label: "Encours", value: formatCurrency(totalEncours), icon: RefreshCw, suffix: "" },
    { label: "En cours", value: nbEnCours, icon: AlertCircle, suffix: "" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="pb-4 border-b border-pea-gray/30 flex-1">
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-pea-blue">Opérations</h1>
            <p className="text-sm text-pea-gray mt-1">
              Suivi des souscriptions, rachats, arbitrages et autres opérations.
            </p>
          </div>
          <OperationFormButton
            clients={(clients ?? []) as Client[]}
            conseillers={(conseillers ?? []) as Conseiller[]}
            typeOps={refOps ?? []}
            produits={refProduits ?? []}
            statuts={refStatuts ?? []}
            compagnies={refCompagnies ?? []}
            produitsStructures={produitsStructures ?? []}
          />
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="border-pea-gray/30 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <CardTitle className="text-xs font-medium text-pea-gray uppercase tracking-wide">{k.label}</CardTitle>
                <k.icon className="size-4 text-pea-teal" />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-3xl font-serif font-semibold text-pea-blue">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtres */}
        <OperationsFilters
          conseillers={conseillers ?? []}
          statuts={refStatuts ?? []}
          typeOps={refOps ?? []}
          assistantes={assistantes ?? []}
          compagnies={refCompagnies ?? []}
        />

        {/* Tableau */}
        <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement…</div>}>
          <OperationsTable
            mois={params.controle_a_faire === "1" ? undefined : mois}
            conseiller={params.conseiller}
            statut={params.statut}
            type={params.type}
            q={params.q}
            controleAFaire={params.controle_a_faire === "1"}
            par={params.par}
            isin={params.isin}
            compagnie={params.compagnie}
            clients={(clients ?? []) as Client[]}
            conseillers={(conseillers ?? []) as Conseiller[]}
            typeOps={refOps ?? []}
            produits={refProduits ?? []}
            statuts={refStatuts ?? []}
            compagnies={refCompagnies ?? []}
            produitsStructures={produitsStructures ?? []}
          />
        </Suspense>
      </div>
    </AppShell>
  );
}
