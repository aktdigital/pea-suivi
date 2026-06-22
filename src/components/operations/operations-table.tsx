import { createClient } from "@/lib/supabase/server";
import { OperationRow } from "./operation-row";
import type { Client, Conseiller, Operation } from "@/lib/types";

type CreatedByProfile = { id: string; full_name: string | null; email: string | null } | null;

interface OperationsTableProps {
  mois?: string;
  conseiller?: string;
  statut?: string;
  type?: string;
  q?: string;
  par?: string;
  isin?: string;
  compagnie?: string;
  assistante?: string;
  support?: string;
  contrat?: string;
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
  canManageRefs?: boolean;
}


export async function OperationsTable({
  mois,
  conseiller,
  statut,
  type,
  q,
  par,
  isin,
  compagnie,
  assistante,
  support,
  contrat,
  clients,
  conseillers,
  typeOps,
  produits,
  statuts,
  compagnies,
  produitsStructures,
  canManageRefs = false,
}: OperationsTableProps) {
  const supabase = await createClient();

  let query = supabase
    .from("operations")
    .select(`
      id, date, date_fin, type_operation, produit, compagnie, contrat, montant, collecte_type, conseiller_code, created_by, assistante_id, statut, support_type, isin, validation, commentaire, courrier_pea, lettre_mission, conformite, controle_par_id, controle_at, created_at, updated_at, client_id,
      clients(nom, prenom),
      created_by_profile:profiles!operations_created_by_fkey(id, full_name, email)
    `)
    .order("date", { ascending: false });

  // Filtre période
  if (mois) {
    const [year, month] = mois.split("-");
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

  const { data: operations, error } = await query;

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 border rounded-md">
        Erreur lors du chargement des opérations : {error.message}
      </div>
    );
  }

  type OpWithClient = Operation & {
    clients?: { nom: string; prenom: string | null } | null;
    created_by_profile?: CreatedByProfile;
  };

  let filtered: OpWithClient[] = (operations ?? []) as OpWithClient[];

  // Filtre recherche client côté serveur
  if (q) {
    const lq = q.toLowerCase();
    filtered = filtered.filter((op) => {
      const clientName = op.clients
        ? `${op.clients.nom} ${op.clients.prenom ?? ""}`.toLowerCase()
        : "";
      return clientName.includes(lq);
    });
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        <p className="text-sm">Aucune opération pour ces filtres.</p>
        <p className="text-xs mt-1">Cliquez sur &quot;+ Nouvelle opération&quot; pour en créer une.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-pea-gray/20 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-pea-blue/5">
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Date</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Date fin</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Opération</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Client</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Produit</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Compagnie / Contrat</th>
            <th className="text-right px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Montant</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Collecte</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Conseiller</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Par</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Statut</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Support</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">ISIN</th>
            <th className="text-center px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Validé</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Commentaire</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((op, i) => (
            <OperationRow
              key={op.id}
              op={op}
              index={i}
              clients={clients}
              conseillers={conseillers}
              typeOps={typeOps}
              produits={produits}
              statuts={statuts}
              compagnies={compagnies}
              produitsStructures={produitsStructures}
              canManageRefs={canManageRefs}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
