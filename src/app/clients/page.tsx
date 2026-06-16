import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { ClientsFilters } from "@/components/clients/clients-filters";
import { NouveauClientDialog } from "@/components/clients/nouveau-client-dialog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft } from "lucide-react";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ conseiller?: string; q?: string; page?: string }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let clientQuery = supabase
    .from("clients")
    .select("id, nom, prenom, type_personne, conseiller_code, assistante_profile_id", { count: "exact" })
    .order("nom")
    .range(from, to);

  if (params.conseiller) {
    clientQuery = clientQuery.eq("conseiller_code", params.conseiller);
  }

  if (params.q) {
    clientQuery = clientQuery.or(`nom.ilike.%${params.q}%,prenom.ilike.%${params.q}%`);
  }

  const [{ data: rawClients, count: totalCount }, { data: conseillers }, { data: assistantesData }] = await Promise.all([
    clientQuery,
    supabase.from("conseillers").select("code, full_name").eq("active", true).order("code"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["assistante_commerciale", "assistante_admin"]),
  ]);

  const clients = rawClients ?? [];
  const total = totalCount ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Compter les opérations par client (uniquement pour la page courante)
  const clientIds = clients.map((c) => c.id);
  const countMap: Record<string, number> = {};

  if (clientIds.length > 0) {
    const { data: opsCounts } = await supabase
      .from("operations")
      .select("client_id")
      .in("client_id", clientIds);

    for (const op of opsCounts ?? []) {
      if (op.client_id) {
        countMap[op.client_id] = (countMap[op.client_id] ?? 0) + 1;
      }
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

  // Construire les URL de pagination en préservant les filtres
  function buildPageUrl(p: number): string {
    const sp = new URLSearchParams();
    if (params.conseiller) sp.set("conseiller", params.conseiller);
    if (params.q) sp.set("q", params.q);
    sp.set("page", String(p));
    return `/clients?${sp.toString()}`;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="pb-4 border-b border-pea-gray/30 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-pea-blue">Clients</h1>
            <p className="text-sm text-pea-gray mt-1">
              {total} client{total !== 1 ? "s" : ""} trouvé{total !== 1 ? "s" : ""}.
              {totalPages > 1 && ` Page ${page} / ${totalPages}.`}
            </p>
          </div>
          <NouveauClientDialog conseillers={conseillers ?? []} />
        </div>

        <ClientsFilters conseillers={conseillers ?? []} />

        {clients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <p className="text-sm">Aucun client pour ces filtres.</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-pea-gray/20 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-pea-blue/5">
                    <th className="text-left px-4 py-2.5 font-medium text-pea-blue uppercase tracking-wide text-xs">Nom</th>
                    <th className="text-left px-4 py-2.5 font-medium text-pea-blue uppercase tracking-wide text-xs">Prénom</th>
                    <th className="text-left px-4 py-2.5 font-medium text-pea-blue uppercase tracking-wide text-xs">Type</th>
                    <th className="text-left px-4 py-2.5 font-medium text-pea-blue uppercase tracking-wide text-xs">Conseiller</th>
                    <th className="text-left px-4 py-2.5 font-medium text-pea-blue uppercase tracking-wide text-xs">Assistante</th>
                    <th className="text-right px-4 py-2.5 font-medium text-pea-blue uppercase tracking-wide text-xs">Nb opérations</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, i) => (
                    <tr
                      key={client.id}
                      className={`border-b border-pea-gray/20 last:border-0 hover:bg-pea-teal/5 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}
                    >
                      <td className="px-4 py-2.5 font-medium">
                        <Link
                          href={`/clients/${client.id}`}
                          className="hover:underline hover:text-pea-teal transition-colors"
                        >
                          {client.nom}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">{client.prenom ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={client.type_personne === "morale" ? "secondary" : "outline"}>
                          {client.type_personne === "morale" ? "Morale" : "Physique"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {client.conseiller_code
                          ? `${conseillerMap[client.conseiller_code] ?? client.conseiller_code} (${client.conseiller_code})`
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {client.assistante_profile_id
                          ? (assistanteMap[client.assistante_profile_id] ?? "—")
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="inline-flex items-center justify-center min-w-[1.5rem] px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          {countMap[client.id] ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/clients/${client.id}`}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Voir <ChevronRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{from + 1}–{Math.min(to + 1, total)} sur {total}</span>
                <div className="flex items-center gap-2">
                  {page > 1 && (
                    <Link
                      href={buildPageUrl(page - 1)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-pea-gray/30 hover:bg-pea-teal/10 hover:text-pea-blue transition-colors text-xs font-medium"
                    >
                      <ChevronLeft className="size-3" /> Précédent
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={buildPageUrl(page + 1)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-pea-gray/30 hover:bg-pea-teal/10 hover:text-pea-blue transition-colors text-xs font-medium"
                    >
                      Suivant <ChevronRight className="size-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
