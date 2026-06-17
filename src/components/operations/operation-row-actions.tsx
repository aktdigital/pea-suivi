"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteOperation, updateOperation } from "@/app/operations/actions";
import type { OperationFormData } from "@/app/operations/actions";
import type { Operation, Client, Conseiller } from "@/lib/types";
import { OperationFormInner } from "./operation-form-inner";

interface RowActionsProps {
  operation: Operation & { clients?: { nom: string; prenom: string | null } | null };
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
  externalEditOpen?: boolean;
  onExternalEditClose?: () => void;
}

export function OperationRowActions({
  operation,
  clients,
  conseillers,
  typeOps,
  produits,
  statuts,
  compagnies,
  produitsStructures,
  externalEditOpen,
  onExternalEditClose,
}: RowActionsProps) {
  const [deleting, setDeleting] = useState(false);
  const [internalEditOpen, setInternalEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editOpen = externalEditOpen ?? internalEditOpen;

  function setEditOpen(val: boolean) {
    if (val) {
      setInternalEditOpen(true);
    } else {
      setInternalEditOpen(false);
      onExternalEditClose?.();
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette opération ?")) return;
    setDeleting(true);
    await deleteOperation(operation.id);
    setDeleting(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const data: OperationFormData = {
      date: String(fd.get("date") || ""),
      client_id: String(fd.get("client_id") || ""),
      type_operation: String(fd.get("type_operation") || ""),
      produit: String(fd.get("produit") || ""),
      compagnie: String(fd.get("compagnie") || ""),
      contrat: String(fd.get("contrat") || ""),
      montant: String(fd.get("montant") || ""),
      collecte_type: (fd.get("collecte_type") as "new_cash" | "encours") || "new_cash",
      conseiller_code: String(fd.get("conseiller_code") || ""),
      statut: String(fd.get("statut") || ""),
      support_type: (fd.get("support_type") as "papier" | "ligne") || "papier",
      isin: String(fd.get("isin") || ""),
      validation: fd.get("validation") === "on",
      commentaire: String(fd.get("commentaire") || ""),
      courrier_pea: String(fd.get("courrier_pea") || "a_faire"),
      lettre_mission: String(fd.get("lettre_mission") || "a_faire"),
      conformite: String(fd.get("conformite") || "a_faire"),
      date_facturation: String(fd.get("date_facturation") || ""),
    };
    const result = await updateOperation(operation.id, data);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditOpen(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setEditOpen(true)}
          title="Modifier"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
          title="Supprimer"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Modifier l&apos;opération</h2>
              <button onClick={() => setEditOpen(false)} className="rounded-sm opacity-70 hover:opacity-100">✕</button>
            </div>
            <OperationFormInner
              defaultValues={operation}
              clients={clients}
              conseillers={conseillers}
              typeOps={typeOps}
              produits={produits}
              statuts={statuts}
              compagnies={compagnies}
              produitsStructures={produitsStructures}
              onSubmit={handleSubmit}
              saving={saving}
              error={error}
              onCancel={() => setEditOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
