"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface OpClient {
  id?: string | null;
  nom: string;
  prenom: string | null;
}

interface IsinOperation {
  id: string;
  date: string;
  client_id: string | null;
  produit: string | null;
  compagnie: string | null;
  contrat: string | null;
  montant: number | null;
  collecte_type: "new_cash" | "encours" | null;
  conseiller_code: string | null;
  statut: string | null;
  commentaire: string | null;
  clients?: OpClient | null;
}

interface IsinOperationsTableProps {
  operations: IsinOperation[];
  totalMontant: number;
  totalNewCash: number;
  totalEncours: number;
}

function getStatutVariant(statut: string | null): "default" | "success" | "warning" | "destructive" | "outline" | "secondary" {
  if (!statut) return "outline";
  const s = statut.toLowerCase();
  if (s.includes("valid") || s.includes("récupéré")) return "success";
  if (s.includes("refus") || s.includes("annul")) return "destructive";
  if (s.includes("attente") || s.includes("en cours")) return "warning";
  return "secondary";
}

export function IsinOperationsTable({
  operations,
  totalMontant,
  totalNewCash,
  totalEncours,
}: IsinOperationsTableProps) {
  if (operations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg border-pea-gray/20">
        <p className="text-sm">Aucune opération sur ce produit pour l&apos;instant.</p>
      </div>
    );
  }

  return (
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
          </tr>
        </thead>
        <tbody>
          {operations.map((op, i) => {
            const clientName = op.clients
              ? `${op.clients.nom} ${op.clients.prenom ?? ""}`.trim()
              : null;
            return (
              <tr
                key={op.id}
                className={`border-b border-pea-gray/20 last:border-0 hover:bg-pea-teal/5 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}
              >
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(op.date)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
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
                  {formatCurrency(op.montant)}
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
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-pea-gray/30 bg-pea-blue/5 font-semibold">
            <td className="px-3 py-2 text-xs text-pea-blue uppercase tracking-wide" colSpan={4}>
              Total ({operations.length} opération{operations.length > 1 ? "s" : ""})
            </td>
            <td className="px-3 py-2 text-right whitespace-nowrap text-pea-blue">
              {formatCurrency(totalMontant)}
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-xs" colSpan={4}>
              <span className="text-pea-teal">New Cash : {formatCurrency(totalNewCash)}</span>
              {" · "}
              <span className="text-pea-gray">Encours : {formatCurrency(totalEncours)}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
