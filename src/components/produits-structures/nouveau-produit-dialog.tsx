"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createProduitStructure } from "@/app/produits-structures/actions";

const MOIS_OPTIONS = [
  "Janvier 2025", "Février 2025", "Mars 2025", "Avril 2025", "Mai 2025", "Juin 2025",
  "Juillet 2025", "Août 2025", "Septembre 2025", "Octobre 2025", "Novembre 2025", "Décembre 2025",
  "Janvier 2026", "Février 2026", "Mars 2026", "Avril 2026", "Mai 2026", "Juin 2026",
  "Juillet 2026", "Août 2026", "Septembre 2026", "Octobre 2026", "Novembre 2026", "Décembre 2026",
];

interface NouveauProduitDialogProps {
  mecanismes: string[];
  durees: string[];
  frequences: string[];
  eligibleContrats: string[];
  compagnies: { id: number; label: string }[];
  structureurs: string[];
}

interface AddOtherPopupProps {
  label: string;
  onAdd: (val: string) => void;
  onClose: () => void;
}

function AddOtherPopup({ label, onAdd, onClose }: AddOtherPopupProps) {
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

type AddOtherTarget = "mecanisme" | "duree" | "frequence" | "eligible_contrats" | "compagnies" | "structureur" | null;

export function NouveauProduitDialog({
  mecanismes: initMecanismes,
  durees: initDurees,
  frequences: initFrequences,
  eligibleContrats: initEligible,
  compagnies: initCompagnies,
  structureurs: initStructureurs,
}: NouveauProduitDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addOtherTarget, setAddOtherTarget] = useState<AddOtherTarget>(null);

  // Local state pour les listes (permettent d'ajouter via "Autres")
  const [mecanismes, setMecanismes] = useState(initMecanismes);
  const [durees, setDurees] = useState(initDurees);
  const [frequences, setFrequences] = useState(initFrequences);
  const [eligible, setEligible] = useState(initEligible);
  const [compagnies, setCompagnies] = useState(initCompagnies);
  const [structureurs, setStructureurs] = useState(initStructureurs);

  // Sélections courantes
  const [selectedMecanisme, setSelectedMecanisme] = useState("");
  const [selectedDuree, setSelectedDuree] = useState("");
  const [selectedFrequence, setSelectedFrequence] = useState("");
  const [selectedEligible, setSelectedEligible] = useState("");
  const [selectedStructureur, setSelectedStructureur] = useState("");
  const [selectedCompagnies, setSelectedCompagnies] = useState<string[]>([]);

  const formRef = useRef<HTMLFormElement>(null);

  function handleAddOther(target: AddOtherTarget, val: string) {
    switch (target) {
      case "mecanisme":
        setMecanismes((prev) => [...prev, val]);
        setSelectedMecanisme(val);
        break;
      case "duree":
        setDurees((prev) => [...prev, val]);
        setSelectedDuree(val);
        break;
      case "frequence":
        setFrequences((prev) => [...prev, val]);
        setSelectedFrequence(val);
        break;
      case "eligible_contrats":
        setEligible((prev) => [...prev, val]);
        setSelectedEligible(val);
        break;
      case "compagnies":
        setCompagnies((prev) => [...prev, { id: Date.now(), label: val }]);
        setSelectedCompagnies((prev) => [...prev, val]);
        break;
      case "structureur":
        setStructureurs((prev) => [...prev, val]);
        setSelectedStructureur(val);
        break;
    }
    setAddOtherTarget(null);
  }

  function handleSelectChange(
    val: string,
    target: AddOtherTarget,
    setter: (v: string) => void,
  ) {
    if (val === "__autres__") {
      setAddOtherTarget(target);
    } else {
      setter(val);
    }
  }

  function toggleCompagnie(label: string) {
    setSelectedCompagnies((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  }

  function resetForm() {
    formRef.current?.reset();
    setSelectedMecanisme("");
    setSelectedDuree("");
    setSelectedFrequence("");
    setSelectedEligible("");
    setSelectedStructureur("");
    setSelectedCompagnies([]);
    setError(null);
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const result = await createProduitStructure({
      isin: String(fd.get("isin") || ""),
      nom_produit: String(fd.get("nom_produit") || ""),
      sous_jacent: String(fd.get("sous_jacent") || ""),
      mecanisme: selectedMecanisme,
      duree: selectedDuree,
      frequence_rappel: selectedFrequence,
      protection_gain: String(fd.get("protection_gain") || ""),
      protection_capital: String(fd.get("protection_capital") || ""),
      degressivite: String(fd.get("degressivite") || ""),
      objectif_rendement: String(fd.get("objectif_rendement") || ""),
      eligible_contrats: selectedEligible,
      upfront_brut: String(fd.get("upfront_brut") || ""),
      date_fin_commercialisation: String(fd.get("date_fin_commercialisation") || ""),
      enveloppe_reservee: String(fd.get("enveloppe_reservee") || ""),
      compagnies_cibles: selectedCompagnies.join(", "),
      structureur: selectedStructureur,
      mois_creation: String(fd.get("mois_creation") || ""),
      commentaire: String(fd.get("commentaire") || ""),
    });

    setSaving(false);

    if ("error" in result && result.error) {
      setError(result.error);
    } else if ("isin" in result && result.isin) {
      handleClose();
      router.push(`/produits-structures/${encodeURIComponent(result.isin)}`);
    }
  }

  const inputClass = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";
  const selectClass = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";
  const labelClass = "text-sm font-medium text-pea-blue";

  const addOtherLabels: Record<string, string> = {
    mecanisme: "Mécanisme",
    duree: "Durée",
    frequence: "Fréquence rappel",
    eligible_contrats: "Éligible contrats",
    compagnies: "Compagnie cible",
    structureur: "Structureur",
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-pea-blue hover:bg-pea-teal text-white transition-colors">
        <Plus className="size-4" />
        Nouveau produit structuré
      </Button>

      {addOtherTarget && (
        <AddOtherPopup
          label={addOtherLabels[addOtherTarget] ?? addOtherTarget}
          onAdd={(val) => handleAddOther(addOtherTarget, val)}
          onClose={() => setAddOtherTarget(null)}
        />
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-serif font-semibold text-pea-blue">Nouveau produit structuré</h2>
              <button onClick={handleClose} className="rounded-sm opacity-70 hover:opacity-100">
                <X className="size-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
              {/* Identité */}
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

              {/* Caractéristiques */}
              <div className="border-t border-pea-gray/20 pt-4 space-y-4">
                <p className="text-xs uppercase tracking-wide text-pea-gray font-medium">Caractéristiques</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Mécanisme</label>
                    <select
                      className={selectClass}
                      value={selectedMecanisme}
                      onChange={(e) => handleSelectChange(e.target.value, "mecanisme", setSelectedMecanisme)}
                    >
                      <option value="">— Sélectionner —</option>
                      {mecanismes.map((m) => <option key={m} value={m}>{m}</option>)}
                      <option value="__autres__">+ Autres…</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Durée</label>
                    <select
                      className={selectClass}
                      value={selectedDuree}
                      onChange={(e) => handleSelectChange(e.target.value, "duree", setSelectedDuree)}
                    >
                      <option value="">— Sélectionner —</option>
                      {durees.map((d) => <option key={d} value={d}>{d}</option>)}
                      <option value="__autres__">+ Autres…</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Fréquence rappel</label>
                    <select
                      className={selectClass}
                      value={selectedFrequence}
                      onChange={(e) => handleSelectChange(e.target.value, "frequence", setSelectedFrequence)}
                    >
                      <option value="">— Sélectionner —</option>
                      {frequences.map((f) => <option key={f} value={f}>{f}</option>)}
                      <option value="__autres__">+ Autres…</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Éligible contrats</label>
                    <select
                      className={selectClass}
                      value={selectedEligible}
                      onChange={(e) => handleSelectChange(e.target.value, "eligible_contrats", setSelectedEligible)}
                    >
                      <option value="">— Sélectionner —</option>
                      {eligible.map((e) => <option key={e} value={e}>{e}</option>)}
                      <option value="__autres__">+ Autres…</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Protection gain</label>
                    <input type="text" name="protection_gain" placeholder="Ex : 0.5 ou 50%" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Protection capital</label>
                    <input type="text" name="protection_capital" placeholder="Ex : 0.9 ou 90%" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Dégressivité</label>
                    <input type="text" name="degressivite" placeholder="Description…" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Objectif rendement</label>
                    <input type="text" name="objectif_rendement" placeholder="Ex : 0.07 ou 7%" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Upfront brut</label>
                    <input type="text" name="upfront_brut" placeholder="Ex : 0.025 ou 2.5%" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Structureur</label>
                    <select
                      className={selectClass}
                      value={selectedStructureur}
                      onChange={(e) => handleSelectChange(e.target.value, "structureur", setSelectedStructureur)}
                    >
                      <option value="">— Sélectionner —</option>
                      {structureurs.map((s) => <option key={s} value={s}>{s}</option>)}
                      <option value="__autres__">+ Autres…</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Commercialisation */}
              <div className="border-t border-pea-gray/20 pt-4 space-y-4">
                <p className="text-xs uppercase tracking-wide text-pea-gray font-medium">Commercialisation</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Date fin commercialisation</label>
                    <input type="date" name="date_fin_commercialisation" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Enveloppe réservée (€)</label>
                    <input type="number" name="enveloppe_reservee" step="1000" min="0" placeholder="0" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Mois création</label>
                    <select name="mois_creation" className={selectClass}>
                      <option value="">— Sélectionner —</option>
                      {MOIS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Compagnies cibles (multi-select) */}
              <div className="border-t border-pea-gray/20 pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-pea-gray font-medium">Compagnies cibles</p>
                  <button
                    type="button"
                    onClick={() => setAddOtherTarget("compagnies")}
                    className="text-xs text-pea-teal hover:underline"
                  >
                    + Autres…
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-pea-gray/20 rounded-md p-3">
                  {compagnies.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCompagnies.includes(c.label)}
                        onChange={() => toggleCompagnie(c.label)}
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

              {/* Commentaire */}
              <div className="border-t border-pea-gray/20 pt-4 space-y-1">
                <label className={labelClass}>Commentaire</label>
                <textarea
                  name="commentaire"
                  rows={3}
                  placeholder="Commentaire libre…"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 border border-border bg-background hover:bg-accent transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 bg-pea-blue text-white hover:bg-pea-teal transition-colors disabled:opacity-50"
                >
                  {saving ? "Enregistrement…" : "Créer le produit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
