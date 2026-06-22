import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serializeCsv, formatDateCsv, formatMontantCsv, formatBoolCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const moisRaw = searchParams.get("mois") ?? undefined;
  const conseiller = searchParams.get("conseiller") ?? undefined;
  const statut = searchParams.get("statut") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const par = searchParams.get("par") ?? undefined;
  const isin = searchParams.get("isin") ?? undefined;
  const compagnie = searchParams.get("compagnie") ?? undefined;
  const assistante = searchParams.get("assistante") ?? undefined;
  const support = searchParams.get("support") ?? undefined;
  const contrat = searchParams.get("contrat") ?? undefined;

  // Logique mois identique à la page
  const mois = (!moisRaw || moisRaw === "all") ? undefined : moisRaw;
  const moisEffectif = mois;

  const supabase = await createClient();

  // Requête principale — réplique exactement operations-table.tsx
  let query = supabase
    .from("operations")
    .select(`
      id, date, date_fin, type_operation, produit, compagnie, contrat, montant, collecte_type, conseiller_code, created_by, assistante_id, statut, support_type, isin, validation, commentaire, courrier_pea, lettre_mission, conformite, controle_par_id, controle_at, created_at, updated_at, client_id,
      clients(nom, prenom),
      created_by_profile:profiles!operations_created_by_fkey(id, full_name, email)
    `)
    .order("date", { ascending: false });

  if (moisEffectif) {
    const [year, month] = moisEffectif.split("-");
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    query = query
      .gte("date", `${year}-${month}-01`)
      .lte("date", `${year}-${month}-${lastDay}`);
  }

  if (conseiller) query = query.eq("conseiller_code", conseiller);
  if (statut) query = query.eq("statut", statut);
  if (type) query = query.eq("type_operation", type);
  if (par) query = query.eq("created_by", par);
  if (isin) query = query.ilike("isin", `%${isin}%`);
  if (compagnie) query = query.eq("compagnie", compagnie);
  if (assistante) query = query.eq("assistante_id", assistante);
  if (support) query = query.eq("support_type", support);
  if (contrat) query = query.ilike("contrat", `%${contrat}%`);

  // Chargement référentiels en parallèle
  const [{ data: operations }, { data: conseillers }, { data: refStatutsControle }] = await Promise.all([
    query,
    supabase.from("conseillers").select("code, full_name").eq("active", true).order("code"),
    supabase.from("ref_statuts_controle").select("code, label").order("ordre"),
  ]);

  const conseillerMap: Record<string, string> = {};
  for (const c of conseillers ?? []) {
    conseillerMap[c.code] = c.full_name;
  }

  const controleMap: Record<string, string> = {};
  for (const s of refStatutsControle ?? []) {
    controleMap[s.code] = s.label;
  }

  type OpRow = {
    id: string;
    date: string;
    date_fin: string | null;
    type_operation: string | null;
    produit: string | null;
    compagnie: string | null;
    contrat: string | null;
    montant: number | null;
    collecte_type: string | null;
    conseiller_code: string | null;
    created_by: string | null;
    statut: string | null;
    support_type: string | null;
    isin: string | null;
    validation: boolean | null;
    commentaire: string | null;
    courrier_pea: string | null;
    lettre_mission: string | null;
    conformite: string | null;
    clients?: { nom: string; prenom: string | null } | null;
    created_by_profile?: { id: string; full_name: string | null; email: string | null } | null;
  };

  let filtered: OpRow[] = (operations ?? []) as OpRow[];

  // Filtre q en mémoire — identique à operations-table.tsx
  if (q) {
    const lq = q.toLowerCase();
    filtered = filtered.filter((op) => {
      const clientName = op.clients
        ? `${op.clients.nom} ${op.clients.prenom ?? ""}`.toLowerCase()
        : "";
      return clientName.includes(lq);
    });
  }

  // En-têtes CSV
  const headers = [
    "Date",
    "Date fin",
    "Opération",
    "Client",
    "Produit",
    "Compagnie",
    "Contrat",
    "Montant",
    "Collecte",
    "Conseiller",
    "Par",
    "Statut",
    "Support",
    "ISIN",
    "Validé",
    "Courrier PEA",
    "Lettre mission",
    "Conformité",
    "Commentaire",
  ];

  const rows: string[][] = filtered.map((op) => {
    const clientNom = op.clients
      ? `${op.clients.nom} ${op.clients.prenom ?? ""}`.trim()
      : "";
    const codeConseiller = op.conseiller_code ?? "";
    const nomConseiller = codeConseiller
      ? (conseillerMap[codeConseiller] ?? codeConseiller)
      : "";
    const par = op.created_by_profile
      ? (op.created_by_profile.full_name ?? op.created_by_profile.email ?? "")
      : "";
    const collecte =
      op.collecte_type === "new_cash"
        ? "New cash"
        : op.collecte_type === "encours"
        ? "Encours"
        : (op.collecte_type ?? "");
    const courrierPea = op.courrier_pea
      ? (controleMap[op.courrier_pea] ?? op.courrier_pea)
      : "";
    const lettreMission = op.lettre_mission
      ? (controleMap[op.lettre_mission] ?? op.lettre_mission)
      : "";
    const conformite = op.conformite
      ? (controleMap[op.conformite] ?? op.conformite)
      : "";

    return [
      formatDateCsv(op.date),
      formatDateCsv(op.date_fin),
      op.type_operation ?? "",
      clientNom,
      op.produit ?? "",
      op.compagnie ?? "",
      op.contrat ?? "",
      formatMontantCsv(op.montant),
      collecte,
      nomConseiller,
      par,
      op.statut ?? "",
      op.support_type ?? "",
      op.isin ?? "",
      formatBoolCsv(op.validation),
      courrierPea,
      lettreMission,
      conformite,
      op.commentaire ?? "",
    ];
  });

  const csv = serializeCsv(headers, rows);
  const today = formatDateCsv(new Date()).split("/").reverse().join("-"); // AAAA-MM-JJ

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="operations_${today}.csv"`,
    },
  });
}
