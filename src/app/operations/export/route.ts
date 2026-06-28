import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serializeCsv, formatDateCsv, formatMontantCsv, formatBoolCsv } from "@/lib/csv";
import { fetchAllRows } from "@/lib/supabase/paginate";

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
    operation_lignes?: { isin: string | null; montant: number | null }[];
  };

  // Pagination obligatoire (plafond PostgREST 1000) : on reconstruit la requête —
  // filtres identiques à operations-table.tsx — pour chaque page via .range().
  const [operations, { data: conseillers }, { data: refStatutsControle }] = await Promise.all([
    fetchAllRows<OpRow>((from, to) => {
      let page = supabase
        .from("operations")
        .select(`
      id, date, date_fin, type_operation, produit, compagnie, contrat, montant, collecte_type, conseiller_code, created_by, assistante_id, statut, support_type, isin, validation, commentaire, courrier_pea, lettre_mission, conformite, controle_par_id, controle_at, created_at, updated_at, client_id,
      clients(nom, prenom),
      created_by_profile:profiles!operations_created_by_fkey(id, full_name, email),
      operation_lignes(isin, montant)
    `);
      if (moisEffectif) {
        const [year, month] = moisEffectif.split("-");
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        page = page
          .gte("date", `${year}-${month}-01`)
          .lte("date", `${year}-${month}-${lastDay}`);
      }
      if (conseiller) page = page.eq("conseiller_code", conseiller);
      if (statut) page = page.eq("statut", statut);
      if (type) page = page.eq("type_operation", type);
      if (par) page = page.eq("created_by", par);
      if (isin) page = page.ilike("isin", `%${isin}%`);
      if (compagnie) page = page.eq("compagnie", compagnie);
      if (assistante) page = page.eq("assistante_id", assistante);
      if (support) page = page.eq("support_type", support);
      if (contrat) page = page.ilike("contrat", `%${contrat}%`);
      return page.order("date", { ascending: false }).range(from, to) as unknown as PromiseLike<{
        data: OpRow[] | null;
        error: { message: string } | null;
      }>;
    }),
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

  let filtered: OpRow[] = operations;

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
    const parField = op.created_by_profile
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

    // ISIN : liste les ISIN des supports séparés par " ; " (ou isin legacy si pas de lignes)
    const lignes = op.operation_lignes ?? [];
    const isinColonne = lignes.length > 0
      ? lignes.map((l) => l.isin ?? "").filter(Boolean).join(" ; ")
      : (op.isin ?? "");

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
      parField,
      op.statut ?? "",
      op.support_type ?? "",
      isinColonne,
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
