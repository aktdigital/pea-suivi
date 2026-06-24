import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, isRachat } from "@/lib/utils";
import { OperationsFilters } from "@/components/operations/operations-filters";
import { OperationsTable } from "@/components/operations/operations-table";
import { OperationFormButton } from "@/components/operations/operation-form";
import { ExportCsvButton } from "@/components/export-csv-button";
import { TrendingUp, Banknote, RefreshCw, AlertCircle } from "lucide-react";
import type { Client, Conseiller } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ mois?: string; conseiller?: string; statut?: string; type?: string; q?: string; par?: string; isin?: string; compagnie?: string; assistante?: string; support?: string; contrat?: string }>;
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
    { data: assistantesComm },
    { data: refSupports },
  ] = await Promise.all([
    supabase.from("conseillers").select("code, full_name, email, active").eq("active", true).order("code"),
    supabase.from("ref_statuts").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_operations").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_produits").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_compagnies").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("clients").select("id, nom, prenom, type_personne, conseiller_code, email, telephone, notes, created_at, updated_at").order("nom"),
    supabase.from("produits_structures").select("isin, nom_produit").eq("active", true).order("nom_produit"),
    supabase.from("profiles").select("id, full_name, email, role").in("role", ["assistante_commerciale", "assistante_admin"]).order("full_name"),
    supabase.from("profiles").select("id, full_name, email, role").in("role", ["assistante_commerciale", "responsable"]).order("full_name"),
    supabase.from("ref_supports").select("id, label, ordre, active").eq("active", true).order("ordre"),
  ]);

  // Calcul du rôle pour canManageRefs
  const { data: { user } } = await supabase.auth.getUser();
  let canManageRefs = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    canManageRefs = profile?.role === "admin" || profile?.role === "responsable" || profile?.role === "assistante_admin";
  }

  // KPIs toujours sur le mois affiché (mois sélectionné ou mois courant par défaut)
  const [year, month] = moisForKpi.split("-");
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();

  let kpiQuery = supabase
    .from("operations")
    .select("montant, collecte_type, statut, conseiller_code, type_operation")
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
    .reduce((acc, op) => acc + (isRachat(op.type_operation) ? -1 : 1) * (op.montant ?? 0), 0) ?? 0;
  // Opérations en cours = non validées (statut ne contient pas "Validé, avenant récupéré")
  const nbEnCours = kpiData?.filter((op) => !op.statut?.toLowerCase().includes("récupéré")).length ?? 0;

  const kpis = [
    { label: "Opérations", value: totalOps, icon: TrendingUp, suffix: "" },
    { label: "New Cash", value: formatCurrency(totalNewCash), icon: Banknote, suffix: "" },
    { label: "Encours", value: formatCurrency(totalEncours), icon: RefreshCw, suffix: "" },
    { label: "En cours", value: nbEnCours, icon: AlertCircle, suffix: "" },
  ];

  // URL export CSV avec tous les filtres actifs
  const exportOpsParams = new URLSearchParams();
  if (params.mois) exportOpsParams.set("mois", params.mois);
  if (params.conseiller) exportOpsParams.set("conseiller", params.conseiller);
  if (params.statut) exportOpsParams.set("statut", params.statut);
  if (params.type) exportOpsParams.set("type", params.type);
  if (params.q) exportOpsParams.set("q", params.q);
  if (params.par) exportOpsParams.set("par", params.par);
  if (params.isin) exportOpsParams.set("isin", params.isin);
  if (params.compagnie) exportOpsParams.set("compagnie", params.compagnie);
  if (params.assistante) exportOpsParams.set("assistante", params.assistante);
  if (params.support) exportOpsParams.set("support", params.support);
  if (params.contrat) exportOpsParams.set("contrat", params.contrat);
  const exportOpsHref = `/operations/export${exportOpsParams.toString() ? `?${exportOpsParams.toString()}` : ""}`;

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
          <div className="flex items-center gap-2">
            <ExportCsvButton href={exportOpsHref} />
            <OperationFormButton
              clients={(clients ?? []) as Client[]}
              conseillers={(conseillers ?? []) as Conseiller[]}
              typeOps={refOps ?? []}
              produits={refProduits ?? []}
              statuts={refStatuts ?? []}
              compagnies={refCompagnies ?? []}
              produitsStructures={produitsStructures ?? []}
              canManageRefs={canManageRefs}
            />
          </div>
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
          assistantesCommerciales={assistantesComm ?? []}
          compagnies={refCompagnies ?? []}
          supports={refSupports ?? []}
        />

        {/* Tableau */}
        <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement…</div>}>
          <OperationsTable
            mois={mois}
            conseiller={params.conseiller}
            statut={params.statut}
            type={params.type}
            q={params.q}
            par={params.par}
            isin={params.isin}
            compagnie={params.compagnie}
            assistante={params.assistante}
            support={params.support}
            contrat={params.contrat}
            clients={(clients ?? []) as Client[]}
            conseillers={(conseillers ?? []) as Conseiller[]}
            typeOps={refOps ?? []}
            produits={refProduits ?? []}
            statuts={refStatuts ?? []}
            compagnies={refCompagnies ?? []}
            produitsStructures={produitsStructures ?? []}
            canManageRefs={canManageRefs}
          />
        </Suspense>
      </div>
    </AppShell>
  );
}
