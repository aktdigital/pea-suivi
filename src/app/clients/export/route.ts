import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serializeCsv, formatDateCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const conseiller = searchParams.get("conseiller") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const supabase = await createClient();

  // Requête principale sans pagination — tous les clients filtrés
  let clientQuery = supabase
    .from("clients")
    .select("id, civilite, nom, prenom, type_personne, conseiller_code, assistante_profile_id")
    .order("nom");

  if (conseiller) {
    clientQuery = clientQuery.eq("conseiller_code", conseiller);
  }
  if (q) {
    clientQuery = clientQuery.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%`);
  }

  // La table operations est petite : on charge tous les client_id une fois et on
  // agrège, plutôt qu'un .in() sur ~900 UUID (URL PostgREST trop longue / rejetée).
  const [{ data: clients }, { data: conseillers }, { data: assistantesData }, { data: opsCounts }] = await Promise.all([
    clientQuery,
    supabase.from("conseillers").select("code, full_name").eq("active", true).order("code"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["assistante_commerciale", "assistante_admin"]),
    supabase.from("operations").select("client_id"),
  ]);

  const clientList = clients ?? [];

  const countMap: Record<string, number> = {};
  for (const op of opsCounts ?? []) {
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
