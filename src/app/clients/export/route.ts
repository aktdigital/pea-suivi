import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serializeCsv, formatDateCsv } from "@/lib/csv";
import { fetchAllRows } from "@/lib/supabase/paginate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const conseiller = searchParams.get("conseiller") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const supabase = await createClient();

  type ClientRow = {
    id: string;
    civilite: string | null;
    nom: string | null;
    prenom: string | null;
    type_personne: string | null;
    conseiller_code: string | null;
    assistante_profile_id: string | null;
  };

  // Pagination obligatoire : sans .range() en boucle, PostgREST plafonne à 1000
  // lignes (l'export s'arrêtait au 1000e client, ~lettre T). On agrège les ops en
  // mémoire plutôt qu'un .in() sur ~900 UUID (URL PostgREST trop longue / rejetée).
  const [clientList, { data: conseillers }, { data: assistantesData }, opsCounts] = await Promise.all([
    fetchAllRows<ClientRow>((from, to) => {
      let page = supabase
        .from("clients")
        .select("id, civilite, nom, prenom, type_personne, conseiller_code, assistante_profile_id");
      if (conseiller) page = page.eq("conseiller_code", conseiller);
      if (q) page = page.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%`);
      return page.order("nom").range(from, to);
    }),
    supabase.from("conseillers").select("code, full_name").eq("active", true).order("code"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["assistante_commerciale", "assistante_admin"]),
    // operations peut dépasser 1000 lignes → pagination aussi, sinon "Nb opérations" faux.
    fetchAllRows<{ client_id: string | null }>((from, to) =>
      supabase.from("operations").select("client_id").range(from, to)
    ),
  ]);

  const countMap: Record<string, number> = {};
  for (const op of opsCounts) {
    if (op.client_id) {
      countMap[op.client_id] = (countMap[op.client_id] ?? 0) + 1;
    }
  }

  const conseillerMap: Record<string, string> = {};
  for (const c of conseillers ?? []) {
    conseillerMap[c.code] = c.full_name;
  }

  const assistanteMap: Record<string, string> = {};
  for (const a of assistantesData ?? []) {
    assistanteMap[a.id] = a.full_name ?? a.email ?? a.id;
  }

  // Construction des lignes CSV
  const headers = ["Civilité", "Nom", "Prénom", "Type", "Conseiller", "Code conseiller", "Assistante", "Nb opérations"];

  const rows: string[][] = clientList.map((client) => {
    const type = client.type_personne === "morale" ? "Morale" : "Physique";
    const codeConseiller = client.conseiller_code ?? "";
    const nomConseiller = codeConseiller
      ? (conseillerMap[codeConseiller] ?? codeConseiller)
      : "";
    const nomAssistante = client.assistante_profile_id
      ? (assistanteMap[client.assistante_profile_id] ?? "")
      : "";
    const nbOps = String(countMap[client.id] ?? 0);

    return [
      client.civilite ?? "",
      client.nom ?? "",
      client.prenom ?? "",
      type,
      nomConseiller,
      codeConseiller,
      nomAssistante,
      nbOps,
    ];
  });

  const csv = serializeCsv(headers, rows);
  const today = formatDateCsv(new Date()).split("/").reverse().join("-"); // AAAA-MM-JJ

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients_${today}.csv"`,
    },
  });
}
