import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { ClientsFilters } from "@/components/clients/clients-filters";
import { NouveauClientDialog } from "@/components/clients/nouveau-client-dialog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ conseiller?: string; q?: string }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: conseillers }, { data: rawClients }, { data: assistantesData }] = await Promise.all([
    supabase.from("conseillers").select("code, full_name").eq("active", true).order("code"),
    supabase
      .from("clients")
      .select("id, nom, prenom, type_personne, conseiller_code, assistante_profile_id")
      .order("nom"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["assistante_commerciale", "assistante_admin"]),
  ]);

  let clients = rawClients ?? [];

  if (params.conseiller) {
    clients = clients.filter((c) => c.conseiller_code === params.conseiller);
  }

  if (params.q) {
    const lq = params.q.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(lq) ||
        (c.prenom ?? "").toLowerCase().includes(lq)
    );
  }

  // Compter les opérations par client
  const { data: opsCounts } = await supabase
    .from("operations")
    .select("client_id");

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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="pb-4 border-b border-pea-gray/30 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-pea-blue">Clients</h1>
            <p className="text-sm text-pea-gray mt-1">
              Référentiel des {(rawClients ?? []).length} clients du cabinet.
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
        )}
      </div>
    </AppShell>
  );
}
