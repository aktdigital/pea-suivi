"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOperation, addRefValue } from "@/app/operations/actions";
import type { OperationFormData } from "@/app/operations/actions";
import type { Client, Conseiller } from "@/lib/types";
import { OperationFormInner } from "./operation-form-inner";
import { isInvestmentType } from "@/lib/utils";

interface OperationFormProps {
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
  defaultIsin?: string;
  canManageRefs?: boolean;
}

export function OperationFormButton({
  clients,
  conseillers,
  typeOps,
  produits,
  statuts,
  compagnies,
  produitsStructures,
  defaultIsin,
  canManageRefs = false,
}: OperationFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localTypeOps, setLocalTypeOps] = useState(typeOps);
  const [localCompagnies, setLocalCompagnies] = useState(compagnies);

  async function handleAddRef(kind: "compagnie" | "type", label: string) {
    const result = await addRefValue(kind, label);
    if (result.error) {
      setError(result.error);
      return null;
    }
    if (kind === "compagnie") {
      const next = { id: Date.now(), label: result.value! };
      setLocalCompagnies((prev) => [...prev, next]);
    } else {
      const next = { id: Date.now(), label: result.value! };
      setLocalTypeOps((prev) => [...prev, next]);
    }
    return result.value ?? null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const typeOp = String(fd.get("type_operation") || "");
    const isInvestissement = isInvestmentType(typeOp);

    // Construction des lignes supports depuis le FormData
    const ligneIsins = fd.getAll("ligne_isin").map((v) => String(v).trim());
    const ligneMontants = fd.getAll("ligne_montant").map((v) => String(v).trim());
    const lignes = ligneIsins
      .map((isin, i) => ({ isin, montant: ligneMontants[i] ?? "" }))
      .filter((l) => l.isin !== "" || l.montant !== "");

    const data: OperationFormData = {
      date: String(fd.get("date") || ""),
      client_id: String(fd.get("client_id") || ""),
      type_operation: typeOp,
      produit: String(fd.get("produit") || ""),
      compagnie: String(fd.get("compagnie") || ""),
      contrat: String(fd.get("contrat") || ""),
      montant: String(fd.get("montant") || ""),
      collecte_type: (fd.get("collecte_type") as "new_cash" | "encours") || "new_cash",
      conseiller_code: String(fd.get("conseiller_code") || ""),
      statut: String(fd.get("statut") || ""),
      support_type: String(fd.get("support_type") || ""),
      isin: String(fd.get("isin") || ""),
      validation: fd.get("validation") === "on",
      devoir_conseil: fd.get("devoir_conseil") === "on",
      commentaire: String(fd.get("commentaire") || ""),
      date_facturation: String(fd.get("date_facturation") || ""),
      lignes: isInvestissement && lignes.length > 0 ? lignes : undefined,
    };

    const result = await createOperation(data);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  // Pré-remplissage ISIN en mode investissement si defaultIsin fourni
  const defaultLignes = defaultIsin ? [{ isin: defaultIsin, montant: "" }] : undefined;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nouvelle opération
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nouvelle opération</h2>
              <button onClick={() => setOpen(false)} className="rounded-sm opacity-70 hover:opacity-100 text-lg">
                ✕
              </button>
            </div>

            <OperationFormInner
              defaultValues={{ isin: defaultIsin ?? "", date: today }}
              defaultLignes={defaultLignes}
              clients={clients}
              conseillers={conseillers}
              typeOps={localTypeOps}
              produits={produits}
              statuts={statuts}
              compagnies={localCompagnies}
              produitsStructures={produitsStructures}
              onSubmit={handleSubmit}
              saving={saving}
              error={error}
              onCancel={() => setOpen(false)}
              canManageRefs={canManageRefs}
              onAddRef={handleAddRef}
              submitLabel="Créer l'opération"
            />
          </div>
        </div>
      )}
    </>
  );
}
