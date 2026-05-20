"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OperationRowActions } from "./operation-row-actions";
import type { Client, Conseiller, Operation, StatutControle } from "@/lib/types";

type CreatedByProfile = { id: string; full_name: string | null; email: string | null } | null;

export type OpWithProfile = Operation & {
  clients?: { nom: string; prenom: string | null } | null;
  created_by_profile?: CreatedByProfile;
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
}

function getControleVariant(statut: StatutControle | null | undefined): "default" | "success" | "warning" | "destructive" | "outline" | "secondary" | "info" {
  if (!statut || statut === "a_faire") return "destructive";
  if (statut === "so") return "secondary";
  if (statut === "ok" || statut === "valide") return "success";
  if (statut === "en_attente_avenants") return "warning";
  if (statut === "en_cours_compagnie") return "info";
  return "outline";
}

function getControleLabel(statut: StatutControle | null | undefined): string {
  if (!statut || statut === "a_faire") return "À faire";
  if (statut === "so") return "S/O";
  if (statut === "ok") return "OK";
  if (statut === "valide") return "Validé";
  if (statut === "en_attente_avenants") return "En attente";
  if (statut === "en_cours_compagnie") return "En cours";
  return statut;
}

function statutBgClass(statut: string | null): string {
  if (!statut) return "bg-white";
  const s = statut.toLowerCase();
  if (s.includes("à saisir") || s.includes("a saisir")) return "bg-white";
  if (s.includes("validé") && s.includes("avenant")) return "bg-green-100";
  if (s.includes("signé") && (s.includes("envoyé") || s.includes("transmis"))) return "bg-orange-100";
  if (s.includes("envoyé") || s.includes("envoyée")) return "bg-yellow-50";
  return "bg-white";
}

function getStatutVariant(statut: string | null): "default" | "success" | "warning" | "destructive" | "outline" {
  if (!statut) return "outline";
  const s = statut.toLowerCase();
  if (s.includes("valid") || s.includes("récupéré")) return "success";
  if (s.includes("refus") || s.includes("annul")) return "destructive";
  if (s.includes("attente") || s.includes("en cours")) return "warning";
  return "secondary" as "default";
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
}: OperationRowProps) {
  const [editOpen, setEditOpen] = useState(false);

  function handleRowClick(e: React.MouseEvent<HTMLTableRowElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("[data-no-row-click]")) return;
    setEditOpen(true);
  }

  return (
    <tr
      key={op.id}
      onClick={handleRowClick}
      className={`border-b border-pea-gray/20 last:border-0 hover:bg-pea-teal/5 cursor-pointer ${statutBgClass(op.statut)}`}
    >
      <td className="px-3 py-2 whitespace-nowrap">{formatDate(op.date)}</td>
      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{op.date_fin ? formatDate(op.date_fin) : "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap">{op.type_operation ?? "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap" data-no-row-click>
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
      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground text-xs" data-no-row-click>
        {op.created_by_profile?.full_name ?? "—"}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {op.statut ? (
          <Badge variant={getStatutVariant(op.statut)}>{op.statut}</Badge>
        ) : "—"}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {op.support_type === "papier" ? "Papier" : op.support_type === "ligne" ? "Ligne" : "—"}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
        {op.isin ?? "—"}
      </td>
      <td className="px-3 py-2 text-center">
        {op.validation ? (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pea-teal/15 text-pea-teal text-xs">✓</span>
        ) : (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pea-gray/15 text-pea-gray text-xs">—</span>
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <Badge variant={getControleVariant(op.courrier_pea as StatutControle)}>
          {getControleLabel(op.courrier_pea as StatutControle)}
        </Badge>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <Badge variant={getControleVariant(op.lettre_mission as StatutControle)}>
          {getControleLabel(op.lettre_mission as StatutControle)}
        </Badge>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <Badge variant={getControleVariant(op.conformite as StatutControle)}>
          {getControleLabel(op.conformite as StatutControle)}
        </Badge>
      </td>
      <td className="px-3 py-2 max-w-[150px]">
        <span className="block truncate text-xs text-muted-foreground" title={op.commentaire ?? ""}>
          {op.commentaire ?? "—"}
        </span>
      </td>
      <td className="px-3 py-2" data-no-row-click>
        <OperationRowActions
          operation={op}
          clients={clients}
          conseillers={conseillers}
          typeOps={typeOps}
          produits={produits}
          statuts={statuts}
          compagnies={compagnies}
          produitsStructures={produitsStructures}
          externalEditOpen={editOpen}
          onExternalEditClose={() => setEditOpen(false)}
        />
      </td>
    </tr>
  );
}
