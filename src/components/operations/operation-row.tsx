"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, statutBgClass } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OperationRowActions } from "./operation-row-actions";
import type { Client, Conseiller, Operation } from "@/lib/types";
import type { OperationLigne } from "./operations-table";

type CreatedByProfile = { id: string; full_name: string | null; email: string | null } | null;

export type OpWithProfile = Operation & {
  clients?: { nom: string; prenom: string | null } | null;
  created_by_profile?: CreatedByProfile;
  operation_lignes?: OperationLigne[];
};

interface OperationRowProps {
  op: OpWithProfile;
  index: number;
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
  canManageRefs?: boolean;
}

function getStatutVariant(statut: string | null): "default" | "success" | "warning" | "destructive" | "outline" {
  if (!statut) return "outline";
  const s = statut.toLowerCase();
  if (s.includes("valid") || s.includes("récupéré")) return "success";
  if (s.includes("refus") || s.includes("annul")) return "destructive";
  if (s.includes("attente") || s.includes("en cours")) return "warning";
  return "secondary" as "default";
}

/** Affichage de la colonne ISIN selon le nombre de supports */
function isinDisplay(op: OpWithProfile): string {
  const lignes = op.operation_lignes ?? [];
  const nb = lignes.length;
  if (nb > 1) return `${nb} supports`;
  if (nb === 1) return lignes[0].isin ?? "—";
  return op.isin ?? "—";
}

export function OperationRow({
  op,
  index,
  clients,
  conseillers,
  typeOps,
  produits,
  statuts,
  compagnies,
  produitsStructures,
  canManageRefs = false,
}: OperationRowProps) {
  const [editOpen, setEditOpen] = useState(false);

  function handleRowClick(e: React.MouseEvent<HTMLTableRowElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("[data-no-row-click]")) return;
    setEditOpen(true);
  }

  // Mapper les lignes en defaultLignes pour le formulaire d'édition
  const defaultLignes = (op.operation_lignes ?? []).map((l) => ({
    isin: l.isin ?? "",
    montant: l.montant ?? "",
  }));

  return (
    <tr
      key={op.id}
      onClick={handleRowClick}
      className={`border-b border-pea-gray/20 last:border-0 hover:bg-pea-blue/5 cursor-pointer ${statutBgClass(op.statut)}`}
    >
      <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(op.date)}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground" data-col="date_fin">{op.date_fin ? formatDate(op.date_fin) : "—"}</td>
      <td className="px-2 py-1.5 whitespace-nowrap" data-col="operation">{op.type_operation ?? "—"}</td>
      <td className="px-2 py-1.5 whitespace-nowrap" data-no-row-click>
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
      <td className="px-2 py-1.5 whitespace-nowrap" data-col="produit">{op.produit ?? "—"}</td>
      <td className="px-2 py-1.5 whitespace-nowrap" data-col="compagnie">
        <div>{op.compagnie ?? "—"}</div>
        {op.contrat && <div className="text-xs text-muted-foreground">{op.contrat}</div>}
      </td>
      <td className="px-2 py-1.5 text-right whitespace-nowrap font-medium" data-col="montant">
        {formatCurrency(op.montant)}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap" data-col="collecte">
        {op.collecte_type === "new_cash" ? (
          <Badge variant="info">New Cash</Badge>
        ) : op.collecte_type === "encours" ? (
          <Badge variant="secondary">Encours</Badge>
        ) : "—"}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap" data-col="conseiller">{op.conseiller_code ?? "—"}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground text-xs" data-col="par" data-no-row-click>
        {op.created_by_profile?.full_name ?? "—"}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap" data-col="statut">
        {op.statut ? (
          <Badge variant={getStatutVariant(op.statut)}>{op.statut}</Badge>
        ) : "—"}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap" data-col="support">
        {op.support_type ?? "—"}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap text-xs text-muted-foreground" data-col="isin">
        {isinDisplay(op)}
      </td>
      <td className="px-2 py-1.5 text-center" data-col="valide">
        {op.validation ? (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pea-teal/15 text-pea-teal text-xs">✓</span>
        ) : (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pea-gray/15 text-pea-gray text-xs">—</span>
        )}
      </td>
      <td className="px-2 py-1.5 text-center" data-col="devoir">
        {op.devoir_conseil ? (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pea-teal/15 text-pea-teal text-xs">✓</span>
        ) : (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pea-gray/15 text-pea-gray text-xs">—</span>
        )}
      </td>
      <td className="px-2 py-1.5 max-w-[130px]" data-col="commentaire">
        <span className="block truncate text-xs text-muted-foreground" title={op.commentaire ?? ""}>
          {op.commentaire ?? "—"}
        </span>
      </td>
      <td className="px-2 py-1.5" data-no-row-click>
        <OperationRowActions
          operation={op}
          defaultLignes={defaultLignes.length > 0 ? defaultLignes : undefined}
          clients={clients}
          conseillers={conseillers}
          typeOps={typeOps}
          produits={produits}
          statuts={statuts}
          compagnies={compagnies}
          produitsStructures={produitsStructures}
          externalEditOpen={editOpen}
          onExternalEditClose={() => setEditOpen(false)}
          canManageRefs={canManageRefs}
        />
      </td>
    </tr>
  );
}
