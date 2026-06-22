"use client";

import { useState } from "react";
import { X } from "lucide-react";

// Popup "Ajouter une autre valeur"
interface AddOtherPopupProps {
  label: string;
  onAdd: (val: string) => void;
  onClose: () => void;
}

export function AddOtherPopup({ label, onAdd, onClose }: AddOtherPopupProps) {
  const [val, setVal] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-lg border shadow-lg p-5 w-80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Ajouter : {label}</span>
          <button onClick={onClose} className="opacity-70 hover:opacity-100"><X className="size-4" /></button>
        </div>
        <input
          autoFocus
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onAdd(val.trim()); } }}
          placeholder="Nouvelle valeur…"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-3 py-1 rounded border border-border hover:bg-accent transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!val.trim()}
            onClick={() => { if (val.trim()) onAdd(val.trim()); }}
            className="text-sm px-3 py-1 rounded bg-pea-teal text-white hover:bg-pea-teal/80 transition-colors disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

// Classes communes
const inputClass = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";
const selectClass = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";
const labelClass = "text-sm font-medium text-pea-blue";

// Section identité du produit
export function ProduitIdentiteFields() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className={labelClass}>ISIN *</label>
        <input type="text" name="isin" required placeholder="FR0000000000" className={inputClass} />
      </div>
      <div className="space-y-1 col-span-2 sm:col-span-1">
        <label className={labelClass}>Nom du produit *</label>
        <input type="text" name="nom_produit" required placeholder="Nom du produit structuré" className={inputClass} />
      </div>
      <div className="space-y-1 col-span-2">
        <label className={labelClass}>Sous-jacent</label>
        <input type="text" name="sous_jacent" placeholder="Ex : Euro Stoxx 50" className={inputClass} />
      </div>
    </div>
  );
}

// Section caractéristiques financières
interface CaracteristiquesFieldsProps {
  mecanismes: string[];
  durees: string[];
  frequences: string[];
  eligible: string[];
  structureurs: string[];
  selectedMecanisme: string;
  selectedDuree: string;
  selectedFrequence: string;
  selectedEligible: string;
  selectedStructureur: string;
  onMecanismeChange: (v: string) => void;
  onDureeChange: (v: string) => void;
  onFrequenceChange: (v: string) => void;
  onEligibleChange: (v: string) => void;
  onStructureurChange: (v: string) => void;
  // Valeurs par défaut optionnelles (mode édition)
  defaultDateConstatation?: string;
  defaultProtectionGain?: string;
  defaultProtectionCapital?: string;
  defaultDegressivite?: string;
  defaultObjectifRendement?: string;
  defaultUpfrontBrut?: string;
}

export function CaracteristiquesFields({
  mecanismes, durees, frequences, eligible, structureurs,
  selectedMecanisme, selectedDuree, selectedFrequence, selectedEligible, selectedStructureur,
  onMecanismeChange, onDureeChange, onFrequenceChange, onEligibleChange, onStructureurChange,
  defaultDateConstatation = "",
  defaultProtectionGain = "",
  defaultProtectionCapital = "",
  defaultDegressivite = "",
  defaultObjectifRendement = "",
  defaultUpfrontBrut = "",
}: CaracteristiquesFieldsProps) {
  return (
    <div className="border-t border-pea-gray/20 pt-4 space-y-4">
      <p className="text-xs uppercase tracking-wide text-pea-gray font-medium">Caractéristiques</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClass}>Mécanisme</label>
          <select className={selectClass} value={selectedMecanisme} onChange={(e) => onMecanismeChange(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {mecanismes.map((m) => <option key={m} value={m}>{m}</option>)}
            <option value="__autres__">+ Autres…</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Durée</label>
          <select className={selectClass} value={selectedDuree} onChange={(e) => onDureeChange(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {durees.map((d) => <option key={d} value={d}>{d}</option>)}
            <option value="__autres__">+ Autres…</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Date de constatation initiale</label>
          <input type="date" name="date_constatation_initiale" defaultValue={defaultDateConstatation} className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Fréquence rappel</label>
          <select className={selectClass} value={selectedFrequence} onChange={(e) => onFrequenceChange(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {frequences.map((f) => <option key={f} value={f}>{f}</option>)}
            <option value="__autres__">+ Autres…</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Éligible contrats</label>
          <select className={selectClass} value={selectedEligible} onChange={(e) => onEligibleChange(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {eligible.map((e) => <option key={e} value={e}>{e}</option>)}
            <option value="__autres__">+ Autres…</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Protection gain</label>
          <input type="text" name="protection_gain" defaultValue={defaultProtectionGain} placeholder="Ex : 0.5 ou 50%" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Protection capital</label>
          <input type="text" name="protection_capital" defaultValue={defaultProtectionCapital} placeholder="Ex : 0.9 ou 90%" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Dégressivité</label>
          <input type="text" name="degressivite" defaultValue={defaultDegressivite} placeholder="Description…" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Objectif rendement</label>
          <input type="text" name="objectif_rendement" defaultValue={defaultObjectifRendement} placeholder="Ex : 0.07 ou 7%" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Upfront brut</label>
          <input type="text" name="upfront_brut" defaultValue={defaultUpfrontBrut} placeholder="Ex : 0.025 ou 2.5%" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Structureur</label>
          <select className={selectClass} value={selectedStructureur} onChange={(e) => onStructureurChange(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {structureurs.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value="__autres__">+ Autres…</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Section commercialisation
const MOIS_OPTIONS = [
  "Janvier 2025", "Février 2025", "Mars 2025", "Avril 2025", "Mai 2025", "Juin 2025",
  "Juillet 2025", "Août 2025", "Septembre 2025", "Octobre 2025", "Novembre 2025", "Décembre 2025",
  "Janvier 2026", "Février 2026", "Mars 2026", "Avril 2026", "Mai 2026", "Juin 2026",
  "Juillet 2026", "Août 2026", "Septembre 2026", "Octobre 2026", "Novembre 2026", "Décembre 2026",
];

interface CommercialisationFieldsProps {
  defaultDateFin?: string;
  defaultEnveloppe?: string;
  defaultMoisCreation?: string;
}

export function CommercialisationFields({
  defaultDateFin = "",
  defaultEnveloppe = "",
  defaultMoisCreation = "",
}: CommercialisationFieldsProps = {}) {
  return (
    <div className="border-t border-pea-gray/20 pt-4 space-y-4">
      <p className="text-xs uppercase tracking-wide text-pea-gray font-medium">Commercialisation</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClass}>Date fin commercialisation</label>
          <input type="date" name="date_fin_commercialisation" defaultValue={defaultDateFin} className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Enveloppe réservée (€)</label>
          <input type="number" name="enveloppe_reservee" step="1000" min="0" defaultValue={defaultEnveloppe} placeholder="0" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Mois création</label>
          <select name="mois_creation" defaultValue={defaultMoisCreation} className={selectClass}>
            <option value="">— Sélectionner —</option>
            {MOIS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

// Section compagnies cibles
interface CompagniesFieldsProps {
  compagnies: { id: number; label: string }[];
  selectedCompagnies: string[];
  onToggle: (label: string) => void;
  onAddOther: () => void;
}

export function CompagniesFields({ compagnies, selectedCompagnies, onToggle, onAddOther }: CompagniesFieldsProps) {
  return (
    <div className="border-t border-pea-gray/20 pt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-pea-gray font-medium">Compagnies cibles</p>
        <button type="button" onClick={onAddOther} className="text-xs text-pea-teal hover:underline">
          + Autres…
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-pea-gray/20 rounded-md p-3">
        {compagnies.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selectedCompagnies.includes(c.label)}
              onChange={() => onToggle(c.label)}
              className="h-4 w-4 rounded border border-input accent-pea-teal"
            />
            <span className="truncate">{c.label}</span>
          </label>
        ))}
      </div>
      {selectedCompagnies.length > 0 && (
        <p className="text-xs text-pea-gray">Sélection : {selectedCompagnies.join(", ")}</p>
      )}
    </div>
  );
}
