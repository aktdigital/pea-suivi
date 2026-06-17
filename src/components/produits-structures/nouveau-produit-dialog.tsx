"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createProduitStructure } from "@/app/produits-structures/actions";
import {
  AddOtherPopup,
  ProduitIdentiteFields,
  CaracteristiquesFields,
  CommercialisationFields,
  CompagniesFields,
} from "./nouveau-produit-form-fields";

interface NouveauProduitDialogProps {
  mecanismes: string[];
  durees: string[];
  frequences: string[];
  eligibleContrats: string[];
  compagnies: { id: number; label: string }[];
  structureurs: string[];
}

type AddOtherTarget = "mecanisme" | "duree" | "frequence" | "eligible_contrats" | "compagnies" | "structureur" | null;

const addOtherLabels: Record<string, string> = {
  mecanisme: "Mécanisme",
  duree: "Durée",
  frequence: "Fréquence rappel",
  eligible_contrats: "Éligible contrats",
  compagnies: "Compagnie cible",
  structureur: "Structureur",
};

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

  // Listes locales (permettent d'ajouter via "Autres")
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

  function handleSelectChange(val: string, target: AddOtherTarget, setter: (v: string) => void) {
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
      date_constatation_initiale: String(fd.get("date_constatation_initiale") || ""),
    });

    setSaving(false);

    if ("error" in result && result.error) {
      setError(result.error);
    } else if ("isin" in result && result.isin) {
      handleClose();
      router.push(`/produits-structures/${encodeURIComponent(result.isin)}`);
    }
  }

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
              <ProduitIdentiteFields />

              <CaracteristiquesFields
                mecanismes={mecanismes}
                durees={durees}
                frequences={frequences}
                eligible={eligible}
                structureurs={structureurs}
                selectedMecanisme={selectedMecanisme}
                selectedDuree={selectedDuree}
                selectedFrequence={selectedFrequence}
                selectedEligible={selectedEligible}
                selectedStructureur={selectedStructureur}
                onMecanismeChange={(v) => handleSelectChange(v, "mecanisme", setSelectedMecanisme)}
                onDureeChange={(v) => handleSelectChange(v, "duree", setSelectedDuree)}
                onFrequenceChange={(v) => handleSelectChange(v, "frequence", setSelectedFrequence)}
                onEligibleChange={(v) => handleSelectChange(v, "eligible_contrats", setSelectedEligible)}
                onStructureurChange={(v) => handleSelectChange(v, "structureur", setSelectedStructureur)}
              />

              <CommercialisationFields />

              <CompagniesFields
                compagnies={compagnies}
                selectedCompagnies={selectedCompagnies}
                onToggle={toggleCompagnie}
                onAddOther={() => setAddOtherTarget("compagnies")}
              />

              {/* Commentaire */}
              <div className="border-t border-pea-gray/20 pt-4 space-y-1">
                <label className="text-sm font-medium text-pea-blue">Commentaire</label>
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
