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
  protection_gain: string | null;
  protection_capital: string | null;
  degressivite: string | null;
  objectif_rendement: string | null;
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

/**
 * Formate une valeur stockée en texte comme pourcentage.
 * - Si la valeur contient déjà "%" ou des lettres → on l'affiche telle quelle.
 * - Sinon on interprète comme un nombre décimal (0.046 → 4,60 %, -0.5 → -50 %).
 */
function formatPct(v: string | null | undefined): string {
  if (!v) return "—";
  const trimmed = v.trim();
  if (trimmed.includes("%") || /[a-zA-Z]/.test(trimmed)) return trimmed;
  const num = parseFloat(trimmed.replace(",", "."));
  if (Number.isNaN(num)) return trimmed;
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function ProduitCard({ produit }: { produit: ProduitStructure }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const pct = produit.enveloppe_reservee && produit.montant_fait
    ? (produit.montant_fait / produit.enveloppe_reservee) * 100
    : 0;

  const isExpired = produit.date_fin_commercialisation
    ? new Date(produit.date_fin_commercialisation) < new Date()
    : false;

  return (
    <>
      <div
        className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-base leading-tight">{produit.nom_produit}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{produit.sous_jacent ?? ""}</p>
          </div>
          {produit.mecanisme && (
            <Badge variant="info" className="shrink-0">{produit.mecanisme}</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground font-mono">{produit.isin}</span>
          {produit.duree && (
            <span className="text-muted-foreground">• {produit.duree}</span>
          )}
        </div>

        {produit.enveloppe_reservee !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{pct.toFixed(0)} %</span>
            </div>
            <Progress value={produit.montant_fait ?? 0} max={produit.enveloppe_reservee} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Fait : {formatCurrency(produit.montant_fait)}</span>
              <span>Enveloppe : {formatCurrency(produit.enveloppe_reservee)}</span>
            </div>
          </div>
        )}

        {produit.restant_a_faire !== null && (
          <div className="text-sm">
            <span className="font-medium">Restant à faire : </span>
            <span className={produit.restant_a_faire <= 0 ? "text-destructive font-semibold" : "text-green-700 font-semibold"}>
              {formatCurrency(produit.restant_a_faire)}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {produit.date_fin_commercialisation && (
            <Badge variant={isExpired ? "destructive" : "warning"}>
              {isExpired ? "Expiré" : "Expire"} le {formatDate(produit.date_fin_commercialisation)}
            </Badge>
          )}
        </div>

        {produit.compagnies_cibles && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {produit.compagnies_cibles}
          </p>
        )}
      </div>

      {/* Drawer détail */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-background rounded-t-xl sm:rounded-xl border shadow-lg w-full sm:max-w-xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{produit.nom_produit}</h2>
              <button
                onClick={(e) => { e.stopPropagation(); setDetailOpen(false); }}
                className="rounded-sm opacity-70 hover:opacity-100 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <DetailRow label="ISIN" value={produit.isin} />
                <DetailRow label="Mécanisme" value={produit.mecanisme} />
                <DetailRow label="Durée" value={produit.duree} />
                <DetailRow label="Fréquence rappel" value={produit.frequence_rappel} />
              </div>

              <div className="border-t pt-3 space-y-2">
                <h3 className="font-medium">Sous-jacent & Rendement</h3>
                <DetailRow label="Sous-jacent" value={produit.sous_jacent} />
                <DetailRow label="Objectif rendement" value={formatPct(produit.objectif_rendement)} />
                <DetailRow label="Protection gain" value={formatPct(produit.protection_gain)} />
                <DetailRow label="Protection capital" value={formatPct(produit.protection_capital)} />
                <DetailRowDegressivite value={produit.degressivite} />
                <DetailRow label="Upfront brut" value={formatPct(produit.upfront_brut)} />
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
      )}
    </>
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

function DetailRowDegressivite({ value }: { value: string | null | undefined }) {
  if (!value) {
    return (
      <div className="flex gap-2">
        <span className="text-muted-foreground min-w-[140px] shrink-0">Dégressivité :</span>
        <span className="font-medium">—</span>
      </div>
    );
  }
  // Si la valeur est purement booléenne (old data)
  const lower = value.toString().toLowerCase();
  if (lower === "true" || lower === "false") {
    return (
      <div className="flex gap-2">
        <span className="text-muted-foreground min-w-[140px] shrink-0">Dégressivité :</span>
        <span className="font-medium">{lower === "true" ? "Oui" : "Non"}</span>
      </div>
    );
  }
  // Valeur texte descriptive
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground min-w-[140px] shrink-0">Dégressivité :</span>
      <span className="font-medium text-xs leading-relaxed whitespace-pre-line">{value}</span>
    </div>
  );
}
