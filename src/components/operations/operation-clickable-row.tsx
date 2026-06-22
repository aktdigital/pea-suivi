"use client";

import { useState } from "react";
import type { Operation, Client, Conseiller } from "@/lib/types";
import { OperationRowActions } from "./operation-row-actions";

interface OperationClickableRowProps {
  operation: Operation & { clients?: { nom: string; prenom: string | null } | null };
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
  canManageRefs?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper <tr> cliquable qui ouvre la popup d'édition de l'opération.
 * Passe `data-no-row-click` sur un élément enfant pour qu'il ne déclenche pas l'édition.
 */
export function OperationClickableRow({
  operation,
  clients,
  conseillers,
  typeOps,
  produits,
  statuts,
  compagnies,
  produitsStructures,
  canManageRefs = false,
  children,
  className = "",
}: OperationClickableRowProps) {
  const [editOpen, setEditOpen] = useState(false);

  function handleRowClick(e: React.MouseEvent<HTMLTableRowElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("[data-no-row-click]")) return;
    setEditOpen(true);
  }

  return (
    <tr onClick={handleRowClick} className={`cursor-pointer ${className}`}>
      {children}
      {/* OperationRowActions en mode silencieux : pas de boutons crayon/poubelle visibles, juste la popup */}
      <td className="hidden" data-no-row-click>
        <OperationRowActions
          operation={operation}
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
          hideTrigger
        />
      </td>
    </tr>
  );
}
