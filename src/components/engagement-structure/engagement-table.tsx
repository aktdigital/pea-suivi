"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProduitStructure } from "@/lib/types";

const MOIS_ORDER = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function capitalize(s: string | null): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatUpfront(val: string | null): string {
  if (!val) return "—";
  const num = parseFloat(val);
  if (!isNaN(num) && val.trim().match(/^[\d.]+$/)) {
    return `${(num * 100).toFixed(2)} %`;
  }
  return val;
}

interface Props {
  produits: ProduitStructure[];
  compagnies: { id: number; label: string }[];
}

function ProduitRow({ produit, index }: { produit: ProduitStructure; index: number }) {
  const isDepasse = (produit.restant_a_faire ?? 1) <= 0;

  const rowClass = isDepasse
    ? "border-b bg-red-50 dark:bg-red-950/30"
    : `border-b ${index % 2 === 0 ? "" : "bg-muted/10"}`;

  return (
    <tr className={rowClass}>
      <td className="px-3 py-2">
        <div className="font-medium text-sm leading-tight">{produit.nom_produit}</div>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground max-w-[140px]">
        <span className="block truncate" title={produit.compagnies_cibles ?? ""}>{produit.compagnies_cibles ?? "—"}</span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-xs">{produit.structureur ?? "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-muted-foreground">{produit.isin}</td>
      <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{produit.sous_jacent ?? "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap">
        {produit.mecanisme ? <Badge variant="info">{produit.mecanisme}</Badge> : "—"}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-xs text-right">{formatUpfront(produit.upfront_brut)}</td>
      <td className="px-3 py-2 whitespace-nowrap text-right text-xs">{formatCurrency(produit.enveloppe_reservee)}</td>
      <td className="px-3 py-2 whitespace-nowrap text-right text-xs">{formatCurrency(produit.montant_fait)}</td>
      <td className="px-3 py-2 whitespace-nowrap text-right text-xs">{formatCurrency(produit.total_new_cash)}</td>
      <td className="px-3 py-2 whitespace-nowrap text-right text-xs">{formatCurrency(produit.total_encours)}</td>
      <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">{formatCurrency(produit.ca_up_front)}</td>
      <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{produit.date_facturation ? formatDate(produit.date_facturation) : "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap text-xs">
        {produit.statut_facturation === "E" ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-pea-blue/10 text-pea-blue" title="Enregistré e-Capital">E</span>
        ) : produit.statut_facturation === "F" ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-pea-teal/15 text-pea-teal" title="Facturé">F</span>
        ) : produit.statut_facturation === "D" ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-pea-gold/20 text-[#7a5530]" title="À définir">D</span>
        ) : "—"}
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-xs">{capitalize(produit.mois_creation)}</td>
    </tr>
  );
}

interface RecapMois {
  mois: string;
  enveloppe: number;
  realise: number;
  caUpFront: number;
  newCash: number;
  encours: number;
  nb: number;
}

function RecapMensuel({ produits }: { produits: ProduitStructure[] }) {
  const recap = useMemo(() => {
    const map = new Map<string, RecapMois>();
    for (const p of produits) {
      if (!p.mois_creation) continue;
      const key = p.mois_creation.toLowerCase();
      const existing = map.get(key) ?? {
        mois: key,
        enveloppe: 0,
        realise: 0,
        caUpFront: 0,
        newCash: 0,
        encours: 0,
        nb: 0,
      };
      existing.enveloppe += p.enveloppe_reservee ?? 0;
      existing.realise += p.montant_fait ?? 0;
      existing.caUpFront += p.ca_up_front ?? 0;
      existing.newCash += p.total_new_cash ?? 0;
      existing.encours += p.total_encours ?? 0;
      existing.nb += 1;
      map.set(key, existing);
    }

    return MOIS_ORDER
      .filter((m) => map.has(m))
      .map((m) => map.get(m)!);
  }, [produits]);

  const totaux = useMemo(() => ({
    enveloppe: recap.reduce((s, r) => s + r.enveloppe, 0),
    realise: recap.reduce((s, r) => s + r.realise, 0),
    caUpFront: recap.reduce((s, r) => s + r.caUpFront, 0),
    newCash: recap.reduce((s, r) => s + r.newCash, 0),
    encours: recap.reduce((s, r) => s + r.encours, 0),
    nb: recap.reduce((s, r) => s + r.nb, 0),
  }), [recap]);

  if (recap.length === 0) return null;

  return (
    <div className="rounded-lg border overflow-x-auto">
      <div className="px-4 py-3 border-b bg-muted/30">
        <h3 className="text-sm font-semibold">Récap mensuel</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Mois</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Engagements pris</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Enveloppe réalisée</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">CA Up Front</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">New Cash</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Encours</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Nb produits</th>
          </tr>
        </thead>
        <tbody>
          {recap.map((r, i) => (
            <tr key={r.mois} className={`border-b ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
              <td className="px-3 py-2 font-medium">{capitalize(r.mois)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(r.enveloppe)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(r.realise)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(r.caUpFront)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(r.newCash)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(r.encours)}</td>
              <td className="px-3 py-2 text-right">{r.nb}</td>
            </tr>
          ))}
          {/* Ligne TOTAL */}
          <tr className="border-b font-semibold bg-muted/20">
            <td className="px-3 py-2">TOTAL</td>
            <td className="px-3 py-2 text-right">{formatCurrency(totaux.enveloppe)}</td>
            <td className="px-3 py-2 text-right">{formatCurrency(totaux.realise)}</td>
            <td className="px-3 py-2 text-right">{formatCurrency(totaux.caUpFront)}</td>
            <td className="px-3 py-2 text-right">{formatCurrency(totaux.newCash)}</td>
            <td className="px-3 py-2 text-right">{formatCurrency(totaux.encours)}</td>
            <td className="px-3 py-2 text-right">{totaux.nb}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function EngagementTable({ produits, compagnies }: Props) {
  const [filterMois, setFilterMois] = useState<string>("tous");
  const [filterStructureur, setFilterStructureur] = useState<string>("tous");
  const [filterCompagnie, setFilterCompagnie] = useState<string>("tous");

  // Listes distinctes pour les filtres
  const moisDisponibles = useMemo(() => {
    const set = new Set<string>();
    produits.forEach((p) => { if (p.mois_creation) set.add(p.mois_creation.toLowerCase()); });
    return MOIS_ORDER.filter((m) => set.has(m));
  }, [produits]);

  const structureursDisponibles = useMemo(() => {
    const set = new Set<string>();
    produits.forEach((p) => { if (p.structureur) set.add(p.structureur); });
    return Array.from(set).sort();
  }, [produits]);

  // Tri par défaut : mois_creation (MOIS_ORDER index) puis enveloppe_reservee desc
  const sorted = useMemo(() => {
    return [...produits].sort((a, b) => {
      const mA = a.mois_creation ? MOIS_ORDER.indexOf(a.mois_creation.toLowerCase()) : 99;
      const mB = b.mois_creation ? MOIS_ORDER.indexOf(b.mois_creation.toLowerCase()) : 99;
      if (mA !== mB) return mA - mB;
      return (b.enveloppe_reservee ?? 0) - (a.enveloppe_reservee ?? 0);
    });
  }, [produits]);

  const filtered = useMemo(() => {
    return sorted.filter((p) => {
      const okMois = filterMois === "tous" || (p.mois_creation?.toLowerCase() === filterMois);
      const okStructureur = filterStructureur === "tous" || p.structureur === filterStructureur;
      const okCompagnie = filterCompagnie === "tous" || (p.compagnies_cibles ?? "").toLowerCase().includes(filterCompagnie.toLowerCase());
      return okMois && okStructureur && okCompagnie;
    });
  }, [sorted, filterMois, filterStructureur, filterCompagnie]);

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">Mois :</label>
          <select
            value={filterMois}
            onChange={(e) => setFilterMois(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-background"
          >
            <option value="tous">Tous mois</option>
            {moisDisponibles.map((m) => (
              <option key={m} value={m}>{capitalize(m)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">Structureur :</label>
          <select
            value={filterStructureur}
            onChange={(e) => setFilterStructureur(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-background"
          >
            <option value="tous">Tous structureurs</option>
            {structureursDisponibles.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">Compagnie :</label>
          <select
            value={filterCompagnie}
            onChange={(e) => setFilterCompagnie(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-background"
          >
            <option value="tous">Toutes compagnies</option>
            {compagnies.map((c) => (
              <option key={c.id} value={c.label}>{c.label}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-muted-foreground self-center">{filtered.length} produit(s)</span>
      </div>

      {/* Tableau principal */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Nom du produit structuré</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Compagnie(s) éligible(s)</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Structureur</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Code ISIN</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Sous-jacent</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Mécanisme</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">UP FRONT</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Enveloppe totale réservée</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Enveloppe réalisée</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Total New Cash</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Total Encours</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">CA UP FRONT</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Date facturation</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Statut facturation</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Mois de création</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Aucun produit pour ces filtres.
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <ProduitRow key={p.isin} produit={p} index={i} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Récap mensuel */}
      <RecapMensuel produits={produits} />
    </div>
  );
}
