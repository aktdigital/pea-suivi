"use client";

import Link from "next/link";
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
  active: boolean | null;
}

export function ProduitCard({ produit }: { produit: ProduitStructure }) {
  const pct = produit.enveloppe_reservee && produit.montant_fait
    ? (produit.montant_fait / produit.enveloppe_reservee) * 100
    : 0;

  const isExpired = produit.date_fin_commercialisation
    ? new Date(produit.date_fin_commercialisation) < new Date()
    : false;

  return (
    <Link
      href={`/produits-structures/${encodeURIComponent(produit.isin)}`}
      className="block rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3 hover:shadow-md transition-shadow"
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
    </Link>
  );
}
