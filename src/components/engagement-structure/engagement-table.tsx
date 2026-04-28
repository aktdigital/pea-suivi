"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ProduitStructure {
  isin: string;
  nom_produit: string;
  sous_jacent: string | null;
  mecanisme: string | null;
  duree: string | null;
  frequence_rappel: string | null;
  protection_gain: number | null;
  protection_capital: number | null;
  degressivite: boolean | null;
  objectif_rendement: number | null;
  eligible_contrats: string | null;
  upfront_brut: string | null;
  date_fin_commercialisation: string | null;
  enveloppe_reservee: number | null;
  montant_fait: number | null;
  restant_a_faire: number | null;
  compagnies_cibles: string | null;
  commentaire: string | null;
  active: boolean;
}

interface Props {
  produitsEnCours: ProduitStructure[];
  produitsExpires: ProduitStructure[];
}

function joursRestants(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const fin = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);
  return Math.floor((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function DetailModal({ produit, onClose }: { produit: ProduitStructure; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-xl border shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold leading-tight">{produit.nom_produit}</h2>
          <button onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100 text-lg">✕</button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="ISIN" value={produit.isin} />
            <DetailRow label="Mécanisme" value={produit.mecanisme} />
            <DetailRow label="Durée" value={produit.duree} />
            <DetailRow label="Fréquence rappel" value={produit.frequence_rappel} />
          </div>

          <div className="border-t pt-3 space-y-2">
            <h3 className="font-medium">Sous-jacent &amp; Rendement</h3>
            <DetailRow label="Sous-jacent" value={produit.sous_jacent} />
            <DetailRow label="Objectif rendement" value={produit.objectif_rendement != null ? `${produit.objectif_rendement} %` : null} />
            <DetailRow label="Protection gain" value={produit.protection_gain != null ? `${produit.protection_gain} %` : null} />
            <DetailRow label="Protection capital" value={produit.protection_capital != null ? `${produit.protection_capital} %` : null} />
            <DetailRow label="Dégressivité" value={produit.degressivite === null ? null : produit.degressivite ? "Oui" : "Non"} />
            <DetailRow label="Upfront brut" value={produit.upfront_brut} />
          </div>

          <div className="border-t pt-3 space-y-2">
            <h3 className="font-medium">Commercialisation</h3>
            <DetailRow label="Fin commercialisation" value={formatDate(produit.date_fin_commercialisation)} />
            <DetailRow label="Enveloppe réservée" value={formatCurrency(produit.enveloppe_reservee)} />
            <DetailRow label="Montant fait" value={formatCurrency(produit.montant_fait)} />
            <DetailRow label="Restant à faire" value={formatCurrency(produit.restant_a_faire)} />
            <DetailRow label="Contrats éligibles" value={produit.eligible_contrats} />
            <DetailRow label="Compagnies cibles" value={produit.compagnies_cibles} />
          </div>

          {produit.commentaire && (
            <div className="border-t pt-3">
              <h3 className="font-medium mb-1">Commentaire</h3>
              <p className="text-muted-foreground leading-relaxed">{produit.commentaire}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground min-w-[140px] shrink-0">{label} :</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

function ProduitRow({ produit, index }: { produit: ProduitStructure; index: number }) {
  const [open, setOpen] = useState(false);
  const jours = joursRestants(produit.date_fin_commercialisation);
  const isUrgent = jours !== null && jours <= 7;
  const isDepasse = (produit.restant_a_faire ?? 1) <= 0;
  const pct = produit.enveloppe_reservee && produit.enveloppe_reservee > 0
    ? Math.min(100, ((produit.montant_fait ?? 0) / produit.enveloppe_reservee) * 100)
    : 0;

  const rowClass = isDepasse || isUrgent
    ? "border-b cursor-pointer bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
    : `border-b cursor-pointer hover:bg-muted/30 ${index % 2 === 0 ? "" : "bg-muted/10"}`;

  return (
    <>
      <tr className={rowClass} onClick={() => setOpen(true)}>
        <td className="px-3 py-2">
          <div className="font-medium text-sm leading-tight">{produit.nom_produit}</div>
          {produit.sous_jacent && <div className="text-xs text-muted-foreground">{produit.sous_jacent}</div>}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground font-mono">{produit.isin}</td>
        <td className="px-3 py-2 whitespace-nowrap">
          {produit.mecanisme ? <Badge variant="info">{produit.mecanisme}</Badge> : "—"}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-right">{formatCurrency(produit.enveloppe_reservee)}</td>
        <td className="px-3 py-2 whitespace-nowrap text-right">{formatCurrency(produit.montant_fait)}</td>
        <td className="px-3 py-2 whitespace-nowrap text-right">
          <span className={(produit.restant_a_faire ?? 1) <= 0 ? "text-destructive font-semibold" : "text-green-700 font-semibold"}>
            {formatCurrency(produit.restant_a_faire)}
          </span>
        </td>
        <td className="px-3 py-2 min-w-[120px]">
          <div className="flex items-center gap-2">
            <Progress value={produit.montant_fait ?? 0} max={produit.enveloppe_reservee ?? 100} className="flex-1 h-2" />
            <span className="text-xs whitespace-nowrap">{pct.toFixed(0)} %</span>
          </div>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          {produit.date_fin_commercialisation ? (
            <Badge variant={isUrgent ? "destructive" : isDepasse ? "destructive" : "warning"}>
              {formatDate(produit.date_fin_commercialisation)}
              {jours !== null && jours >= 0 && <span className="ml-1">({jours}j)</span>}
            </Badge>
          ) : "—"}
        </td>
        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[140px]">
          <span className="block truncate" title={produit.eligible_contrats ?? ""}>{produit.eligible_contrats ?? "—"}</span>
        </td>
        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[120px]">
          <span className="block truncate" title={produit.compagnies_cibles ?? ""}>{produit.compagnies_cibles ?? "—"}</span>
        </td>
        <td className="px-3 py-2">
          <button
            className="text-xs text-muted-foreground hover:text-foreground underline"
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          >
            Détail
          </button>
        </td>
      </tr>
      {open && <DetailModal produit={produit} onClose={() => setOpen(false)} />}
    </>
  );
}

export function EngagementTable({ produitsEnCours, produitsExpires }: Props) {
  const [expiresOpen, setExpiresOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Tableau produits en cours */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Nom produit</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">ISIN</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Mécanisme</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Enveloppe</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Montant fait</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Restant</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">% Réalisé</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Date fin</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Contrats éligibles</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Compagnies</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {produitsEnCours.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Aucun produit en cours de commercialisation.
                </td>
              </tr>
            ) : (
              produitsEnCours.map((p, i) => (
                <ProduitRow key={p.isin} produit={p} index={i} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Section produits expirés (collapsable) */}
      <div className="border rounded-lg">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
          onClick={() => setExpiresOpen((v) => !v)}
        >
          <span className="text-muted-foreground">
            Produits expirés ({produitsExpires.length})
          </span>
          <span className="text-muted-foreground">{expiresOpen ? "▲" : "▼"}</span>
        </button>
        {expiresOpen && (
          <div className="border-t overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Nom produit</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">ISIN</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Mécanisme</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Enveloppe</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Montant fait</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Restant</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">% Réalisé</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Date fin</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Contrats éligibles</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Compagnies</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {produitsExpires.map((p, i) => (
                  <ProduitRow key={p.isin} produit={p} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
