import AppShell from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, MOIS } from "@/lib/utils";
import { ListChecks, Banknote, CalendarRange, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const [
    { data: opsMois },
    { data: bilansAFaire },
    { data: produitsActifs },
    { data: dernieresOps },
    { data: profiles },
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

  // Activité par assistante (created_by dans profiles avec rôle assistante_*)
  const assistanteProfiles = (profiles ?? []).filter(
    (p) => p.role?.startsWith("assistante")
  );

  const activiteAssistantes = assistanteProfiles.map((profile) => {
    const opsAssistante = (opsMois ?? []).filter(
      (op) => op.created_by === profile.id || op.assistante_id === profile.id
    );
    const volume = opsAssistante.reduce((acc, op) => acc + (op.montant ?? 0), 0);
    return {
      name: profile.full_name ?? profile.email ?? profile.id,
      nbOps: opsAssistante.length,
      volume,
    };
  });

  // Activité par conseiller
  const conseillerCodes = Array.from(
    new Set((opsMois ?? []).map((op) => op.conseiller_code).filter(Boolean))
  ) as string[];

  const activiteConseillers = conseillerCodes.map((code) => {
    const opsConseiller = (opsMois ?? []).filter((op) => op.conseiller_code === code);
    const volNewCash = opsConseiller
      .filter((op) => op.collecte_type === "new_cash")
      .reduce((acc, op) => acc + (op.montant ?? 0), 0);
    const volEncours = opsConseiller
      .filter((op) => op.collecte_type === "encours")
      .reduce((acc, op) => acc + (op.montant ?? 0), 0);
    return {
      code,
      nbOps: opsConseiller.length,
      volNewCash,
      volEncours,
    };
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vue d&apos;ensemble de l&apos;activité — {MOIS[month - 1]} {year}
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
                <k.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Activité par assistante */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activité par assistante — {MOIS[month - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activiteAssistantes.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 pb-4">Aucune donnée.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Assistante</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Nb ops</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activiteAssistantes.map((a) => (
                      <tr key={a.name} className="border-b last:border-0">
                        <td className="px-4 py-2">{a.name}</td>
                        <td className="px-4 py-2 text-right font-medium">{a.nbOps}</td>
                        <td className="px-4 py-2 text-right font-medium">{formatCurrency(a.volume)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Activité par conseiller */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activité par conseiller — {MOIS[month - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activiteConseillers.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 pb-4">Aucune opération ce mois-ci.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Conseiller</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Nb ops</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">New Cash</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Encours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activiteConseillers.map((c) => (
                      <tr key={c.code} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium">{c.code}</td>
                        <td className="px-4 py-2 text-right">{c.nbOps}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(c.volNewCash)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(c.volEncours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

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
