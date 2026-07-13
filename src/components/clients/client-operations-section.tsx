"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Operation, Client, Conseiller } from "@/lib/types";
import { OperationClickableRow } from "@/components/operations/operation-clickable-row";

interface ClientOperationsSectionProps {
  operations: (Operation & {
    clients?: { nom: string; prenom: string | null } | null;
    operation_lignes?: { isin: string | null; montant: number | null }[];
  })[];
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
  canManageRefs?: boolean;
}

function getStatutVariant(statut: string | null): "default" | "success" | "warning" | "destructive" | "outline" | "secondary" {
  if (!statut) return "outline";
  const s = statut.toLowerCase();
  if (s.includes("valid") || s.includes("récupéré")) return "success";
  if (s.includes("refus") || s.includes("annul") || s.includes("racheté")) return "destructive";
  if (s.includes("attente") || s.includes("en cours")) return "warning";
  return "secondary";
}

export function ClientOperationsSection({
  operations,
  clients,
  conseillers,
  typeOps,
  produits,
  statuts,
  compagnies,
  produitsStructures,
  canManageRefs = false,
}: ClientOperationsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Opérations ({operations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {operations.length === 0 ? (
          <p className="text-sm text-muted-foreground px-6 pb-4">
            Aucune opération enregistrée pour ce client.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Produit</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Compagnie</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Montant</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op, i) => {
                  // Supports existants → pré-remplissage de la popup d'édition
                  const defaultLignes = (op.operation_lignes ?? []).map((l) => ({
                    isin: l.isin ?? "",
                    montant: l.montant ?? "",
                  }));
                  return (
                  <OperationClickableRow
                    key={op.id}
                    operation={op}
                    defaultLignes={defaultLignes.length > 0 ? defaultLignes : undefined}
                    clients={clients}
                    conseillers={conseillers}
                    typeOps={typeOps}
                    produits={produits}
                    statuts={statuts}
                    compagnies={compagnies}
                    produitsStructures={produitsStructures}
                    canManageRefs={canManageRefs}
                    className={`border-b last:border-0 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    <td className="px-4 py-2 whitespace-nowrap">{formatDate(op.date)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{op.type_operation ?? "—"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{op.produit ?? "—"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{op.compagnie ?? "—"}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap font-medium">
                      {formatCurrency(op.montant)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {op.statut ? (
                        <Badge variant={getStatutVariant(op.statut)}>{op.statut}</Badge>
                      ) : "—"}
                    </td>
                  </OperationClickableRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
