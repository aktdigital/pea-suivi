import { Suspense } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { ControleCell } from "@/components/controles/controle-cell";
import { ControleFiltersClient } from "@/components/controles/controle-filters";
import { ControleStatutsManager } from "@/components/controles/controle-statuts-manager";
import { ShieldCheck } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ q?: string; conseiller?: string; mois?: string; compagnie?: string; contrat?: string; courrier_pea?: string; lettre_mission?: string; conformite?: string }>;
}

export default async function ControlesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const [
    { data: refStatutsControle },
    { data: conseillers },
    { data: refCompagnies },
  ] = await Promise.all([
    supabase.from("ref_statuts_controle").select("code, label, ordre").order("ordre"),
    supabase.from("conseillers").select("code, full_name").eq("active", true).order("code"),
    supabase.from("ref_compagnies").select("id, label, ordre, active").eq("active", true).order("ordre"),
  ]);

  const statuts = refStatutsControle ?? [];

  // Rôle : Michèle (assistante_admin), Sonia (responsable), Piyanat (admin) peuvent gérer la liste de valeurs
  const { data: { user } } = await supabase.auth.getUser();
  let canManageControles = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    canManageControles = ["admin", "responsable", "assistante_admin"].includes(profile?.role ?? "");
  }

  // Requête opérations avec jointure clients
  let query = supabase
    .from("operations")
    .select(`
      id, date, type_operation, compagnie, contrat, conseiller_code, courrier_pea, lettre_mission, conformite, client_id,
      clients(nom, prenom)
    `)
    .order("date", { ascending: false });

  if (params.conseiller) query = query.eq("conseiller_code", params.conseiller);
  if (params.compagnie) query = query.eq("compagnie", params.compagnie);
  if (params.contrat) query = query.ilike("contrat", `%${params.contrat}%`);
  if (params.courrier_pea) query = query.eq("courrier_pea", params.courrier_pea);
  if (params.lettre_mission) query = query.eq("lettre_mission", params.lettre_mission);
  if (params.conformite) query = query.eq("conformite", params.conformite);
  if (params.mois) {
    const [year, month] = params.mois.split("-");
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    query = query.gte("date", `${year}-${month}-01`).lte("date", `${year}-${month}-${lastDay}`);
  }

  const { data: operations, error } = await query;

  type OpRow = {
    id: string;
    date: string;
    type_operation: string | null;
    compagnie: string | null;
    contrat: string | null;
    conseiller_code: string | null;
    courrier_pea: string | null;
    lettre_mission: string | null;
    conformite: string | null;
    client_id: string | null;
    clients?: { nom: string; prenom: string | null } | null;
  };

  let filtered: OpRow[] = (operations ?? []) as OpRow[];

  // Filtre recherche client en mémoire
  if (params.q) {
    const lq = params.q.toLowerCase();
    filtered = filtered.filter((op) => {
      const clientName = op.clients
        ? `${op.clients.nom} ${op.clients.prenom ?? ""}`.toLowerCase()
        : "";
      return clientName.includes(lq);
    });
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-pea-gray/30">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-7 text-pea-teal" />
            <div>
              <h1 className="text-3xl font-serif font-semibold tracking-tight text-pea-blue">Contrôles — Michèle</h1>
              <p className="text-sm text-pea-gray mt-1">
                Suivi des contrôles administratifs : Courrier PEA, Lettre de mission, Conformité.
              </p>
            </div>
          </div>
        </div>

        {/* Gestion des valeurs de contrôle (admin / responsable / assistante_admin) */}
        {canManageControles && <ControleStatutsManager statuts={statuts} />}

        {/* Filtres */}
        <Suspense>
          <ControleFiltersClient conseillers={conseillers ?? []} compagnies={refCompagnies ?? []} statutsControle={statuts} />
        </Suspense>

        {/* Tableau */}
        {error ? (
          <div className="text-sm text-destructive p-4 border rounded-md">
            Erreur lors du chargement : {error.message}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <p className="text-sm">Aucune opération pour ces filtres.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-pea-gray/20 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-pea-blue/5">
                  <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Date</th>
                  <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Client</th>
                  <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Type</th>
                  <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Compagnie / Contrat</th>
                  <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Conseiller</th>
                  <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Courrier PEA</th>
                  <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Lettre mission</th>
                  <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Conformité</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((op, i) => (
                  <tr
                    key={op.id}
                    className={`border-b border-pea-gray/20 last:border-0 hover:bg-pea-teal/5 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream/40"}`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(op.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {op.clients && op.client_id ? (
                        <Link
                          href={`/clients/${op.client_id}`}
                          className="hover:underline hover:text-pea-teal transition-colors"
                        >
                          {`${op.clients.nom} ${op.clients.prenom ?? ""}`.trim()}
                        </Link>
                      ) : op.clients ? (
                        `${op.clients.nom} ${op.clients.prenom ?? ""}`.trim()
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{op.type_operation ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div>{op.compagnie ?? "—"}</div>
                      {op.contrat && <div className="text-xs text-muted-foreground">{op.contrat}</div>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{op.conseiller_code ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <ControleCell
                        opId={op.id}
                        champ="courrier_pea"
                        valeurActuelle={op.courrier_pea}
                        statutsControle={statuts}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <ControleCell
                        opId={op.id}
                        champ="lettre_mission"
                        valeurActuelle={op.lettre_mission}
                        statutsControle={statuts}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <ControleCell
                        opId={op.id}
                        champ="conformite"
                        valeurActuelle={op.conformite}
                        statutsControle={statuts}
                      />
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
