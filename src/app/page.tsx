import AppShell from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, MOIS } from "@/lib/utils";
import { ListChecks, Banknote, CalendarRange, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CAMILLE_ID = "ca455682-9567-4132-b5bd-4e18cd99cf01";
const MYRIAM_ID = "0f1117f0-b185-4d16-ba2e-2a8bc578e14b";
const MICHELE_ID = "0b21016d-d791-4eb9-b9e2-2ef0247d73ef";

const TYPE_OP_MAP: Record<string, string> = {
  "SOUSCRIPTION": "Souscriptions",
  "VERSEMENT COMPLEMENTAIRE": "Versements compl.",
  "RACHAT PARTIEL": "Rachats",
  "RACHAT TOTAL": "Rachats",
  "ARBITRAGE": "Arbitrages",
  "PASSAGE D'ORDRE": "Passages d'ordre",
};

const OP_LABELS_ORDER = ["Souscriptions", "Versements compl.", "Rachats", "Arbitrages", "Passages d'ordre"];

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

  // T1 2026 = Jan/Fev/Mars 2026
  const t1Start = "2026-01-01";
  const t1End = "2026-03-31";

  const [
    { data: opsMois },
    { data: bilansAFaire },
    { data: produitsActifs },
    { data: dernieresOps },
    { data: profiles },
    { data: opsT1CamilleMyriamRaw },
    { data: opsMicheleRaw },
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
    supabase
      .from("operations")
      .select("date, type_operation, assistante_id")
      .in("assistante_id", [CAMILLE_ID, MYRIAM_ID])
      .gte("date", t1Start)
      .lte("date", t1End),
    supabase
      .from("operations")
      .select("date, courrier_pea, lettre_mission, conformite, assistante_id")
      .eq("assistante_id", MICHELE_ID)
      .gte("date", t1Start)
      .lte("date", t1End),
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

  // Bilan hebdo C/M — calcul matrice T1 2026
  const T1_MOIS = [1, 2, 3]; // Jan, Fev, Mars
  type BilanRow = { label: string; data: Record<string, number> };

  const bilanMatrix: BilanRow[] = OP_LABELS_ORDER.map((label) => ({
    label,
    data: {},
  }));

  for (const op of opsT1CamilleMyriamRaw ?? []) {
    const d = new Date(op.date);
    const m = d.getMonth() + 1;
    if (!T1_MOIS.includes(m)) continue;
    const rawLabel = (op.type_operation ?? "").toUpperCase().trim();
    const mappedLabel = TYPE_OP_MAP[rawLabel];
    if (!mappedLabel) continue;
    const isC = op.assistante_id === CAMILLE_ID;
    const key = `${m}_${isC ? "C" : "M"}`;
    const row = bilanMatrix.find((r) => r.label === mappedLabel);
    if (row) row.data[key] = (row.data[key] ?? 0) + 1;
  }

  // Compute totals per row
  const bilanTotaux = bilanMatrix.map((row) => {
    let totalC = 0, totalM = 0;
    for (const m of T1_MOIS) {
      totalC += row.data[`${m}_C`] ?? 0;
      totalM += row.data[`${m}_M`] ?? 0;
    }
    return { ...row, totalC, totalM };
  });

  // Bilan Michèle — mois x statut
  type MicheleRow = { mois: number; courrierOK: number; lettreOK: number; conformiteOK: number; total: number };
  const micheleByMois: Record<number, MicheleRow> = {};
  const DONE_STATUTS = new Set(["ok", "valide", "en_cours_compagnie"]);

  for (const op of opsMicheleRaw ?? []) {
    const m = new Date(op.date).getMonth() + 1;
    if (!T1_MOIS.includes(m)) continue;
    if (!micheleByMois[m]) micheleByMois[m] = { mois: m, courrierOK: 0, lettreOK: 0, conformiteOK: 0, total: 0 };
    const row = micheleByMois[m];
    row.total += 1;
    if (DONE_STATUTS.has(op.courrier_pea ?? "")) row.courrierOK += 1;
    if (DONE_STATUTS.has(op.lettre_mission ?? "")) row.lettreOK += 1;
    if (DONE_STATUTS.has(op.conformite ?? "")) row.conformiteOK += 1;
  }

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

        {/* Bilan hebdo Camille & Myriam */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bilan hebdomadaire — Camille &amp; Myriam (T1 2026)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-pea-blue/5">
                  <th className="text-left px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Opération</th>
                  {T1_MOIS.map((m) => (
                    <th key={m} className="text-center px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">{MOIS[m - 1]}</th>
                  ))}
                  <th className="text-center px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Total T1</th>
                </tr>
              </thead>
              <tbody>
                {bilanTotaux.map((row, i) => (
                  <tr key={row.label} className={`border-b last:border-0 hover:bg-pea-teal/5 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}>
                    <td className="px-4 py-2 whitespace-nowrap text-pea-graphite">{row.label}</td>
                    {T1_MOIS.map((m) => {
                      const c = row.data[`${m}_C`] ?? 0;
                      const mv = row.data[`${m}_M`] ?? 0;
                      return (
                        <td key={m} className="px-4 py-2 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pea-teal/15 text-pea-teal">C {c}</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pea-gold/20 text-[#7a5530]">M {mv}</span>
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pea-teal/15 text-pea-teal">C {row.totalC}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pea-gold/20 text-[#7a5530]">M {row.totalM}</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Ligne total */}
                <tr className="border-t font-bold bg-pea-blue/5">
                  <td className="px-4 py-2 whitespace-nowrap text-pea-blue uppercase text-xs tracking-wide">TOTAL</td>
                  {T1_MOIS.map((m) => {
                    const totC = bilanTotaux.reduce((acc, r) => acc + (r.data[`${m}_C`] ?? 0), 0);
                    const totM = bilanTotaux.reduce((acc, r) => acc + (r.data[`${m}_M`] ?? 0), 0);
                    return (
                      <td key={m} className="px-4 py-2 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pea-teal/15 text-pea-teal">C {totC}</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pea-gold/20 text-[#7a5530]">M {totM}</span>
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pea-teal/15 text-pea-teal">C {bilanTotaux.reduce((acc, r) => acc + r.totalC, 0)}</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pea-gold/20 text-[#7a5530]">M {bilanTotaux.reduce((acc, r) => acc + r.totalM, 0)}</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Contrôles administratifs Michèle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contrôles administratifs — Michèle (T1 2026)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {Object.keys(micheleByMois).length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">Aucune donnée pour T1 2026.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Mois</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Courrier PEA OK</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Lettre mission OK</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Conformité OK</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground whitespace-nowrap">Total contrôlés</th>
                  </tr>
                </thead>
                <tbody>
                  {T1_MOIS.map((m, i) => {
                    const row = micheleByMois[m];
                    if (!row) return (
                      <tr key={m} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-2">{MOIS[m - 1]}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                      </tr>
                    );
                    return (
                      <tr key={m} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-2 font-medium">{MOIS[m - 1]}</td>
                        <td className="px-4 py-2 text-right">{row.courrierOK} / {row.total}</td>
                        <td className="px-4 py-2 text-right">{row.lettreOK} / {row.total}</td>
                        <td className="px-4 py-2 text-right">{row.conformiteOK} / {row.total}</td>
                        <td className="px-4 py-2 text-right font-semibold">{row.total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

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
