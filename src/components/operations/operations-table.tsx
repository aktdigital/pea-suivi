import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { OperationRow } from "./operation-row";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { TablePagination } from "@/components/ui/table-pagination";
import type { Client, Conseiller, Operation } from "@/lib/types";

const PAGE_SIZE = 20;

/** Colonnes masquables du tableau (menu « Colonnes ») — Date et Client restent toujours visibles */
const TOGGLE_COLUMNS = [
  { key: "date_fin", label: "Date fin" },
  { key: "operation", label: "Opération" },
  { key: "produit", label: "Produit" },
  { key: "compagnie", label: "Compagnie / Contrat" },
  { key: "montant", label: "Montant" },
  { key: "collecte", label: "Collecte" },
  { key: "conseiller", label: "Conseiller" },
  { key: "par", label: "Par" },
  { key: "statut", label: "Statut" },
  { key: "support", label: "Support" },
  { key: "isin", label: "ISIN" },
  { key: "valide", label: "Validé" },
  { key: "devoir", label: "Devoir conseil" },
  { key: "commentaire", label: "Commentaire" },
];

type CreatedByProfile = { id: string; full_name: string | null; email: string | null } | null;

export type OperationLigne = { isin: string | null; montant: number | null };

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
  page?: string;
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
  page,
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

  function buildQuery(from: number, to: number) {
    let query = supabase
      .from("operations")
      .select(`
        id, date, date_fin, type_operation, produit, compagnie, contrat, montant, collecte_type, conseiller_code, created_by, assistante_id, statut, support_type, isin, validation, devoir_conseil, commentaire, courrier_pea, lettre_mission, conformite, controle_par_id, controle_at, created_at, updated_at, client_id,
        clients(nom, prenom),
        created_by_profile:profiles!operations_created_by_fkey(id, full_name, email),
        operation_lignes(isin, montant)
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

    return query.range(from, to);
  }

  // fetchAllRows : contourne le plafond 1000 lignes de PostgREST
  let operations: unknown[];
  try {
    operations = await fetchAllRows((from, to) => buildQuery(from, to));
  } catch (e) {
    return (
      <div className="text-sm text-destructive p-4 border rounded-md">
        Erreur lors du chargement des opérations : {e instanceof Error ? e.message : "inconnue"}
      </div>
    );
  }

  type OpWithClient = Operation & {
    clients?: { nom: string; prenom: string | null } | null;
    created_by_profile?: CreatedByProfile;
    operation_lignes?: OperationLigne[];
  };

  let filtered: OpWithClient[] = operations as OpWithClient[];

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

  // Pagination (après filtrage en mémoire)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageNum = Math.min(Math.max(1, parseInt(page ?? "1", 10) || 1), totalPages);
  const start = (pageNum - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  // Liens de pagination : préservent tous les filtres actifs
  function buildHref(p: number): string {
    const sp = new URLSearchParams();
    if (mois) sp.set("mois", mois);
    if (conseiller) sp.set("conseiller", conseiller);
    if (statut) sp.set("statut", statut);
    if (type) sp.set("type", type);
    if (q) sp.set("q", q);
    if (par) sp.set("par", par);
    if (isin) sp.set("isin", isin);
    if (compagnie) sp.set("compagnie", compagnie);
    if (assistante) sp.set("assistante", assistante);
    if (support) sp.set("support", support);
    if (contrat) sp.set("contrat", contrat);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/operations${qs ? `?${qs}` : ""}`;
  }

  const thCls = "text-left px-2 py-1.5 font-medium text-pea-blue uppercase tracking-wide text-[11px] whitespace-nowrap";

  return (
    <div>
      <DataTableShell storageKey="pea-cols-operations" columns={TOGGLE_COLUMNS}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b bg-pea-blue/5">
              <th className={thCls}>Date</th>
              <th className={thCls} data-col="date_fin">Date fin</th>
              <th className={thCls} data-col="operation">Opération</th>
              <th className={thCls}>Client</th>
              <th className={thCls} data-col="produit">Produit</th>
              <th className={thCls} data-col="compagnie">Compagnie / Contrat</th>
              <th className={`${thCls} text-right`} data-col="montant">Montant</th>
              <th className={thCls} data-col="collecte">Collecte</th>
              <th className={thCls} data-col="conseiller">Cons.</th>
              <th className={thCls} data-col="par">Par</th>
              <th className={thCls} data-col="statut">Statut</th>
              <th className={thCls} data-col="support">Support</th>
              <th className={thCls} data-col="isin">ISIN</th>
              <th className={`${thCls} text-center`} data-col="valide">Validé</th>
              <th className={`${thCls} text-center`} data-col="devoir">Devoir</th>
              <th className={thCls} data-col="commentaire">Commentaire</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((op, i) => (
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
      </DataTableShell>
      <TablePagination
        page={pageNum}
        totalPages={totalPages}
        total={filtered.length}
        from={start + 1}
        to={Math.min(start + PAGE_SIZE, filtered.length)}
        buildHref={buildHref}
      />
    </div>
  );
}
