import { Suspense } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { formatCurrency, formatDate, statutBgClass } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ControleCell } from "@/components/controles/controle-cell";
import { ControleFiltersClient } from "@/components/controles/controle-filters";
import { ControleStatutsManager } from "@/components/controles/controle-statuts-manager";
import { OperationClickableRow } from "@/components/operations/operation-clickable-row";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { TablePagination } from "@/components/ui/table-pagination";
import type { Operation, Client, Conseiller } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

const PAGE_SIZE = 20;

/** Colonnes masquables (Date, Client et les 3 contrôles restent toujours visibles) */
const TOGGLE_COLUMNS = [
  { key: "type", label: "Type" },
  { key: "compagnie", label: "Compagnie / Contrat" },
  { key: "montant", label: "Montant" },
  { key: "isin", label: "ISIN" },
  { key: "statut", label: "Statut" },
  { key: "conseiller", label: "Conseiller" },
];

interface PageProps {
  searchParams: Promise<{ q?: string; conseiller?: string; mois?: string; compagnie?: string; contrat?: string; courrier_pea?: string; lettre_mission?: string; conformite?: string; page?: string }>;
}

export default async function ControlesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const [
    { data: refStatutsControle },
    { data: conseillers },
    { data: refCompagnies },
    clients,
    { data: refOps },
    { data: refProduits },
    { data: refStatuts },
    { data: produitsStructures },
  ] = await Promise.all([
    supabase.from("ref_statuts_controle").select("code, label, ordre, champ").order("ordre"),
    supabase.from("conseillers").select("code, full_name, email, active").eq("active", true).order("code"),
    supabase.from("ref_compagnies").select("id, label, ordre, active").eq("active", true).order("ordre"),
    // fetchAllRows : contourne le plafond 1000 lignes (la liste s'arrêtait à la lettre T)
    fetchAllRows((from, to) =>
      supabase.from("clients").select("id, nom, prenom, type_personne, conseiller_code, email, telephone, notes, created_at, updated_at").order("nom").range(from, to)
    ),
    supabase.from("ref_operations").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_produits").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_statuts").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("produits_structures").select("isin, nom_produit").eq("active", true).order("nom_produit"),
  ]);

  const statuts = refStatutsControle ?? [];

  // Rôles : gestion des valeurs (admin/responsable/assistante_admin) ; +Ajouter compagnie/type (admin/responsable)
  const { data: { user } } = await supabase.auth.getUser();
  let canManageControles = false;
  let canManageRefs = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = profile?.role ?? "";
    canManageControles = ["admin", "responsable", "assistante_admin"].includes(role);
    canManageRefs = ["admin", "responsable", "assistante_admin"].includes(role);
  }

  // Requête opérations avec jointure clients + supports (operation_lignes)
  function buildOpsQuery(from: number, to: number) {
    let query = supabase
      .from("operations")
      .select(`
        id, date, date_fin, type_operation, produit, compagnie, contrat, montant, collecte_type, conseiller_code, created_by, assistante_id, statut, support_type, isin, validation, commentaire, courrier_pea, lettre_mission, conformite, controle_par_id, controle_at, date_facturation, created_at, updated_at, client_id,
        clients(nom, prenom),
        operation_lignes(isin, montant)
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
    return query.range(from, to);
  }

  type OpRow = Operation & {
    clients?: { nom: string; prenom: string | null } | null;
    operation_lignes?: { isin: string | null; montant: number | null }[];
  };

  // fetchAllRows : contourne le plafond 1000 lignes de PostgREST
  let operations: OpRow[] = [];
  let error: { message: string } | null = null;
  try {
    operations = (await fetchAllRows((from, to) => buildOpsQuery(from, to))) as unknown as OpRow[];
  } catch (e) {
    error = { message: e instanceof Error ? e.message : "inconnue" };
  }

  let filtered: OpRow[] = operations;

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

  // Pagination (après filtrage)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageNum = Math.min(Math.max(1, parseInt(params.page ?? "1", 10) || 1), totalPages);
  const start = (pageNum - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  // Liens de pagination : préservent les filtres actifs
  function buildHref(p: number): string {
    const sp = new URLSearchParams();
    if (params.mois) sp.set("mois", params.mois);
    if (params.q) sp.set("q", params.q);
    if (params.compagnie) sp.set("compagnie", params.compagnie);
    if (params.conseiller) sp.set("conseiller", params.conseiller);
    if (params.contrat) sp.set("contrat", params.contrat);
    if (params.courrier_pea) sp.set("courrier_pea", params.courrier_pea);
    if (params.lettre_mission) sp.set("lettre_mission", params.lettre_mission);
    if (params.conformite) sp.set("conformite", params.conformite);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/controles${qs ? `?${qs}` : ""}`;
  }

  const thCls = "text-left px-2 py-1.5 font-medium text-pea-blue uppercase tracking-wide text-[11px] whitespace-nowrap";

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
          <div>
            <DataTableShell storageKey="pea-cols-controles" columns={TOGGLE_COLUMNS}>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b bg-pea-blue/5">
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Client</th>
                    <th className={thCls} data-col="type">Type</th>
                    <th className={thCls} data-col="compagnie">Compagnie / Contrat</th>
                    <th className={`${thCls} text-right`} data-col="montant">Montant</th>
                    <th className={thCls} data-col="isin">ISIN</th>
                    <th className={thCls} data-col="statut">Statut</th>
                    <th className={thCls} data-col="conseiller">Cons.</th>
                    <th className={thCls}>Courrier PEA</th>
                    <th className={thCls}>Lettre mission</th>
                    <th className={thCls}>Conformité</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((op) => {
                    const lignes = op.operation_lignes ?? [];
                    // Affichage ISIN : identique à l'onglet Opérations (N supports / ISIN unique / legacy)
                    const isinDisplay = lignes.length > 1
                      ? `${lignes.length} supports`
                      : lignes.length === 1
                        ? (lignes[0].isin ?? "—")
                        : (op.isin ?? "—");
                    const defaultLignes = lignes.map((l) => ({ isin: l.isin ?? "", montant: l.montant ?? "" }));
                    return (
                    <OperationClickableRow
                      key={op.id}
                      operation={op}
                      defaultLignes={defaultLignes.length > 0 ? defaultLignes : undefined}
                      clients={(clients ?? []) as Client[]}
                      conseillers={(conseillers ?? []) as Conseiller[]}
                      typeOps={refOps ?? []}
                      produits={refProduits ?? []}
                      statuts={refStatuts ?? []}
                      compagnies={refCompagnies ?? []}
                      produitsStructures={produitsStructures ?? []}
                      canManageRefs={canManageRefs}
                      className={`border-b border-pea-gray/20 last:border-0 hover:bg-pea-blue/5 ${statutBgClass(op.statut)}`}
                    >
                      <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(op.date)}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
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
                      <td className="px-2 py-1.5 whitespace-nowrap" data-col="type">{op.type_operation ?? "—"}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap" data-col="compagnie">
                        <div>{op.compagnie ?? "—"}</div>
                        {op.contrat && <div className="text-xs text-muted-foreground">{op.contrat}</div>}
                      </td>
                      <td className="px-2 py-1.5 text-right whitespace-nowrap font-medium" data-col="montant">{formatCurrency(op.montant)}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-xs text-muted-foreground" data-col="isin">{isinDisplay}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap" data-col="statut">
                        {op.statut ? <Badge variant="outline">{op.statut}</Badge> : "—"}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap" data-col="conseiller">{op.conseiller_code ?? "—"}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <ControleCell
                          opId={op.id}
                          champ="courrier_pea"
                          valeurActuelle={op.courrier_pea}
                          statutsControle={statuts}
                        />
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <ControleCell
                          opId={op.id}
                          champ="lettre_mission"
                          valeurActuelle={op.lettre_mission}
                          statutsControle={statuts}
                        />
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <ControleCell
                          opId={op.id}
                          champ="conformite"
                          valeurActuelle={op.conformite}
                          statutsControle={statuts}
                        />
                      </td>
                    </OperationClickableRow>
                    );
                  })}
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
        )}
      </div>
    </AppShell>
  );
}
