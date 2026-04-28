import AppShell from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, MOIS } from "@/lib/utils";
import { ListChecks, Banknote, CalendarRange, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BilanHebdoTabs } from "@/components/dashboard/bilan-tabs";
import { ActiviteFilters } from "@/components/dashboard/activite-filters";

const CAMILLE_ID = "ca455682-9567-4132-b5bd-4e18cd99cf01";
const MYRIAM_ID = "0f1117f0-b185-4d16-ba2e-2a8bc578e14b";

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  const moisDebut = `${year}-${monthStr}-01`;
  const moisFin = `${year}-${monthStr}-${lastDay}`;
  const todayStr = now.toISOString().split("T")[0];

  // Jan–Avril 2026 pour les bilan tabs + activité filters
  const extStart = "2026-01-01";
  const extEnd = "2026-04-30";

  const [
    { data: opsMois },
    { data: bilansAFaire },
    { data: produitsActifs },
    { data: dernieresOps },
    { data: profiles },
    { data: opsBilanCamilleMyriamRaw },
    { data: opsActiviteRaw },
  ] = await Promise.all([
    supabase
      .from("operations")
      .select("montant, collecte_type, conseiller_code, created_by, assistante_id")
      .gte("date", moisDebut)
      .lte("date", moisFin),
    supabase
      .from("bilans")
      .select("id")
      .in("statut", ["a_faire", "planifie"])
      .eq("annee", year),
    supabase
      .from("produits_structures")
      .select("isin")
      .eq("active", true)
      .gte("date_fin_commercialisation", todayStr),
    supabase
      .from("operations")
      .select("id, date, type_operation, montant, statut, clients(nom, prenom), conseiller_code")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id, full_name, email, role"),
    // Opérations Camille & Myriam Jan-Avril 2026 (pour BilanHebdoTabs)
    supabase
      .from("operations")
      .select("date, type_operation, assistante_id")
      .in("assistante_id", [CAMILLE_ID, MYRIAM_ID])
      .gte("date", extStart)
      .lte("date", extEnd),
    // Toutes ops Jan-Avril 2026 (pour ActiviteFilters)
    supabase
      .from("operations")
      .select("date, montant, collecte_type, conseiller_code, created_by, assistante_id")
      .gte("date", extStart)
      .lte("date", extEnd),
  ]);

  const totalNewCash =
    opsMois
      ?.filter((op) => op.collecte_type === "new_cash")
      .reduce((acc, op) => acc + (op.montant ?? 0), 0) ?? 0;

  const kpis = [
    {
      label: `Opérations — ${MOIS[month - 1]}`,
      value: opsMois?.length ?? 0,
      icon: ListChecks,
      suffix: "",
    },
    {
      label: "Volume New Cash",
      value: formatCurrency(totalNewCash),
      icon: Banknote,
      suffix: "",
    },
    {
      label: "Bilans à faire",
      value: (bilansAFaire ?? []).length,
      icon: CalendarRange,
      suffix: "",
    },
    {
      label: "Produits structurés actifs",
      value: (produitsActifs ?? []).length,
      icon: Layers,
      suffix: "",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="pb-4 border-b border-pea-gray/30">
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-pea-blue">Tableau de bord</h1>
          <p className="text-sm text-pea-gray mt-1">
            Vue d&apos;ensemble de l&apos;activité — {MOIS[month - 1]} {year}
          </p>
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

        {/* Bilan Camille & Myriam — vue mensuelle / hebdomadaire */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bilan hebdomadaire — Camille &amp; Myriam (T1 2026)</CardTitle>
          </CardHeader>
          <BilanHebdoTabs operations={opsBilanCamilleMyriamRaw ?? []} />
        </Card>

        {/* Activité par assistante & conseiller avec filtre mois */}
        <ActiviteFilters
          operations={opsActiviteRaw ?? []}
          profiles={profiles ?? []}
        />

        {/* 5 dernières opérations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">5 dernières opérations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(dernieresOps ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">Aucune opération.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Montant</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Conseiller</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {(dernieresOps ?? []).map((op, i) => {
                    const rawClient = op.clients;
                    const clientData = Array.isArray(rawClient)
                      ? (rawClient[0] as { nom: string; prenom: string | null } | undefined) ?? null
                      : (rawClient as { nom: string; prenom: string | null } | null);
                    return (
                      <tr key={op.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-2 whitespace-nowrap">{formatDate(op.date)}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {clientData ? `${clientData.nom} ${clientData.prenom ?? ""}`.trim() : "—"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{op.type_operation ?? "—"}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap font-medium">
                          {formatCurrency(op.montant)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{op.conseiller_code ?? "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {op.statut ? (
                            <Badge variant="outline">{op.statut}</Badge>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
