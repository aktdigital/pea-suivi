"use client";

import Link from "next/link";
import { formatCurrency, formatDate, isRachat } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Client, Conseiller } from "@/lib/types";
import { OperationClickableRow } from "@/components/operations/operation-clickable-row";

/** Opération parente telle que retournée par la requête imbriquée */
type ParentOperation = {
  id: string;
  date: string;
  type_operation: string | null;
  compagnie: string | null;
  contrat: string | null;
  collecte_type: string | null;
  statut: string | null;
  conseiller_code: string | null;
  date_facturation: string | null;
  client_id: string | null;
  commentaire: string | null;
  produit: string | null;
  isin: string | null;
  clients: { id?: string | null; nom: string; prenom: string | null } | null;
};

/** Une ligne de `operation_lignes` jointe à son opération parente */
export type IsinLigne = {
  montant: number | null;
  isin: string | null;
  operations: ParentOperation;
};

interface IsinOperationsTableProps {
  lignes: IsinLigne[];
  totalMontant: number;
  totalNewCash: number;
  totalEncours: number;
  restantAFaire: number | null;
  // Référentiels pour la popup d'édition (optionnels : si absent, pas de clic)
  editRefs?: {
    clients: Client[];
    conseillers: Conseiller[];
    typeOps: { id: number; label: string }[];
    produits: { id: number; label: string }[];
    statuts: { id: number; label: string }[];
    compagnies: { id: number; label: string }[];
    produitsStructures: { isin: string; nom_produit: string }[];
    canManageRefs: boolean;
  };
}

const STATUTS_OFFICIELS = [
  "A saisir",
  "Adéquation envoyée au client",
  "Opération envoyée au client",
  "Signé, transmis à la compagnie",
  "Validé, avenant récupéré",
  "Racheté par anticipation",
];

function getStatutVariant(statut: string | null): "default" | "success" | "warning" | "destructive" | "outline" | "secondary" {
  if (!statut) return "outline";
  const s = statut.toLowerCase();
  if (s.includes("valid") || s.includes("récupéré")) return "success";
  if (s.includes("refus") || s.includes("annul") || s.includes("racheté")) return "destructive";
  if (s.includes("attente") || s.includes("en cours")) return "warning";
  return "secondary";
}

export function IsinOperationsTable({
  lignes,
  totalMontant,
  totalNewCash,
  totalEncours,
  restantAFaire,
  editRefs,
}: IsinOperationsTableProps) {
  if (lignes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg border-pea-gray/20">
        <p className="text-sm">Aucune opération sur ce produit pour l&apos;instant.</p>
      </div>
    );
  }

  // Agrégats par statut (depuis l'opération parente)
  const statutMap = new Map<string, { count: number; montant: number }>();
  for (const s of STATUTS_OFFICIELS) {
    statutMap.set(s, { count: 0, montant: 0 });
  }
  for (const ligne of lignes) {
    const key = ligne.operations.statut ?? "(sans statut)";
    const existing = statutMap.get(key) ?? { count: 0, montant: 0 };
    statutMap.set(key, {
      count: existing.count + 1,
      montant: existing.montant + (ligne.montant ?? 0),
    });
  }

  // Agrégats par compagnie
  const compagnieMap = new Map<string, number>();
  for (const ligne of lignes) {
    const key = ligne.operations.compagnie ?? "(sans compagnie)";
    compagnieMap.set(key, (compagnieMap.get(key) ?? 0) + (ligne.montant ?? 0));
  }

  // Total racheté par anticipation
  const totalRachete = lignes
    .filter((l) => (l.operations.statut ?? "").toLowerCase().includes("racheté"))
    .reduce((acc, l) => acc + (l.montant ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Tableau des lignes */}
      <div className="rounded-lg border border-pea-gray/20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-pea-blue/5">
              <th className="text-left px-3 py-2 font-medium text-pea-teal uppercase tracking-wide text-xs whitespace-nowrap">Date</th>
              <th className="text-left px-3 py-2 font-medium text-pea-teal uppercase tracking-wide text-xs whitespace-nowrap">Client</th>
              <th className="text-left px-3 py-2 font-medium text-pea-teal uppercase tracking-wide text-xs whitespace-nowrap">Produit</th>
              <th className="text-left px-3 py-2 font-medium text-pea-teal uppercase tracking-wide text-xs whitespace-nowrap">Compagnie / Contrat</th>
              <th className="text-right px-3 py-2 font-medium text-pea-teal uppercase tracking-wide text-xs whitespace-nowrap">Montant</th>
              <th className="text-left px-3 py-2 font-medium text-pea-teal uppercase tracking-wide text-xs whitespace-nowrap">Collecte</th>
              <th className="text-left px-3 py-2 font-medium text-pea-teal uppercase tracking-wide text-xs whitespace-nowrap">Conseiller</th>
              <th className="text-left px-3 py-2 font-medium text-pea-teal uppercase tracking-wide text-xs whitespace-nowrap">Statut</th>
              <th className="text-left px-3 py-2 font-medium text-pea-teal uppercase tracking-wide text-xs whitespace-nowrap">Commentaire</th>
              <th className="text-left px-3 py-2 font-medium text-pea-teal uppercase tracking-wide text-xs whitespace-nowrap">Date de facturation</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, i) => {
              const op = ligne.operations;
              const clientName = op.clients
                ? `${op.clients.nom} ${op.clients.prenom ?? ""}`.trim()
                : null;
              const rowClass = `border-b border-pea-gray/20 last:border-0 hover:bg-pea-blue/5 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`;

              // Construire un objet Operation-compatible pour OperationClickableRow
              const operationObj = {
                ...op,
                montant: op.collecte_type === "encours" && isRachat(op.type_operation)
                  ? -(ligne.montant ?? 0)
                  : (ligne.montant ?? null),
                // Champs requis par le type Operation
                validation: false,
                devoir_conseil: false,
                assistante_id: null,
                created_by: null,
                created_at: "",
                updated_at: "",
                courrier_pea: null,
                lettre_mission: null,
                conformite: null,
                controle_par_id: null,
                controle_at: null,
                date_fin: null,
                support_type: null,
                clients: op.clients ? { nom: op.clients.nom, prenom: op.clients.prenom } : null,
              };

              const cells = (
                <>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(op.date)}</td>
                  <td className="px-3 py-2 whitespace-nowrap" data-no-row-click>
                    {clientName && op.client_id ? (
                      <Link
                        href={`/clients/${op.client_id}`}
                        className="hover:underline hover:text-pea-teal transition-colors"
                      >
                        {clientName}
                      </Link>
                    ) : clientName ? (
                      clientName
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{op.produit ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div>{op.compagnie ?? "—"}</div>
                    {op.contrat && <div className="text-xs text-muted-foreground">{op.contrat}</div>}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap font-medium">
                    {formatCurrency(ligne.montant)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {op.collecte_type === "new_cash" ? (
                      <Badge variant="info">New Cash</Badge>
                    ) : op.collecte_type === "encours" ? (
                      <Badge variant="secondary">Encours</Badge>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{op.conseiller_code ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {op.statut ? (
                      <Badge variant={getStatutVariant(op.statut)}>{op.statut}</Badge>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 max-w-[160px]">
                    <span className="block truncate text-xs text-muted-foreground" title={op.commentaire ?? ""}>
                      {op.commentaire ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(op.date_facturation)}
                  </td>
                </>
              );

              if (editRefs) {
                return (
                  <OperationClickableRow
                    key={`${op.id}-${i}`}
                    operation={operationObj as import("@/lib/types").Operation & { clients?: { nom: string; prenom: string | null } | null }}
                    clients={editRefs.clients}
                    conseillers={editRefs.conseillers}
                    typeOps={editRefs.typeOps}
                    produits={editRefs.produits}
                    statuts={editRefs.statuts}
                    compagnies={editRefs.compagnies}
                    produitsStructures={editRefs.produitsStructures}
                    canManageRefs={editRefs.canManageRefs}
                    className={rowClass}
                  >
                    {cells}
                  </OperationClickableRow>
                );
              }

              return (
                <tr key={`${op.id}-${i}`} className={rowClass}>
                  {cells}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-pea-gray/30 bg-pea-blue/5 font-semibold">
              <td className="px-3 py-2 text-xs text-pea-blue uppercase tracking-wide" colSpan={4}>
                Total ({lignes.length} ligne{lignes.length > 1 ? "s" : ""})
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap text-pea-blue">
                {formatCurrency(totalMontant)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs" colSpan={5}>
                <span className="text-pea-teal">New Cash : {formatCurrency(totalNewCash)}</span>
                {" · "}
                <span className="text-pea-gray">Encours : {formatCurrency(totalEncours)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bloc Synthèse */}
      <div className="space-y-4">
        <h3 className="text-base font-serif font-semibold text-pea-blue">Synthèse</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Répartition par statut */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 rounded-lg border border-pea-gray/20 overflow-hidden">
            <div className="bg-pea-blue/5 px-4 py-2 border-b border-pea-gray/20">
              <p className="text-xs uppercase tracking-wide font-medium text-pea-gray">Répartition par statut</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pea-gray/10">
                  <th className="text-left px-4 py-2 text-xs font-medium text-pea-teal">Statut</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-pea-teal">Nb</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-pea-teal">Montant</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(statutMap.entries())
                  .filter(([, v]) => v.count > 0 || STATUTS_OFFICIELS.includes(""))
                  .map(([statut, { count, montant }], i) => (
                    <tr
                      key={statut}
                      className={`border-b border-pea-gray/10 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream/50"}`}
                    >
                      <td className="px-4 py-1.5">
                        <Badge variant={getStatutVariant(statut)} className="text-xs">{statut}</Badge>
                      </td>
                      <td className="px-4 py-1.5 text-right text-xs font-medium">{count}</td>
                      <td className="px-4 py-1.5 text-right text-xs font-medium">
                        {count > 0 ? formatCurrency(montant) : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Colonne droite : Total par compagnie + Totaux globaux */}
          <div className="space-y-4">
            {/* Total par compagnie */}
            <div className="rounded-lg border border-pea-gray/20 overflow-hidden">
              <div className="bg-pea-blue/5 px-4 py-2 border-b border-pea-gray/20">
                <p className="text-xs uppercase tracking-wide font-medium text-pea-gray">Total par compagnie</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {Array.from(compagnieMap.entries()).map(([compagnie, montant], i) => (
                    <tr
                      key={compagnie}
                      className={`border-b border-pea-gray/10 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream/50"}`}
                    >
                      <td className="px-4 py-1.5 text-xs">{compagnie}</td>
                      <td className="px-4 py-1.5 text-right text-xs font-medium">{formatCurrency(montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totaux globaux */}
            <div className="rounded-lg border border-pea-gray/20 overflow-hidden">
              <div className="bg-pea-blue/5 px-4 py-2 border-b border-pea-gray/20">
                <p className="text-xs uppercase tracking-wide font-medium text-pea-gray">Totaux</p>
              </div>
              <div className="divide-y divide-pea-gray/10">
                <div className="flex justify-between items-center px-4 py-2">
                  <span className="text-xs text-pea-gray">Total New cash</span>
                  <span className="text-xs font-semibold text-pea-teal">{formatCurrency(totalNewCash)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2">
                  <span className="text-xs text-pea-gray">Total encours</span>
                  <span className="text-xs font-semibold text-pea-blue">{formatCurrency(totalEncours)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2">
                  <span className="text-xs text-pea-gray">Total racheté par anticipation</span>
                  <span className="text-xs font-semibold text-destructive">{formatCurrency(totalRachete)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2 bg-pea-teal/5">
                  <span className="text-xs font-medium text-pea-blue">Restant à faire</span>
                  <span className={`text-xs font-semibold ${(restantAFaire ?? 0) <= 0 ? "text-destructive" : "text-pea-teal"}`}>
                    {formatCurrency(restantAFaire)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
