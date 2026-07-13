"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteOperation, updateOperation, addRefValue, getOperationForEdit } from "@/app/operations/actions";
import type { OperationFormData } from "@/app/operations/actions";
import type { Operation, Client, Conseiller } from "@/lib/types";
import { OperationFormInner } from "./operation-form-inner";
import { isInvestmentType } from "@/lib/utils";

interface RowActionsProps {
  operation: Operation & { clients?: { nom: string; prenom: string | null } | null };
  /** Supports existants de l'opération (pour pré-remplir le formulaire d'édition) */
  defaultLignes?: { isin: string; montant: number | string }[];
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
  externalEditOpen?: boolean;
  onExternalEditClose?: () => void;
  canManageRefs?: boolean;
  hideTrigger?: boolean;
}

export function OperationRowActions({
  operation,
  defaultLignes,
  clients,
  conseillers,
  typeOps,
  produits,
  statuts,
  compagnies,
  produitsStructures,
  externalEditOpen,
  onExternalEditClose,
  canManageRefs = false,
  hideTrigger = false,
}: RowActionsProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [deleting, setDeleting] = useState(false);
  const [internalEditOpen, setInternalEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localTypeOps, setLocalTypeOps] = useState(typeOps);
  const [localCompagnies, setLocalCompagnies] = useState(compagnies);

  // Données FRAÎCHES chargées à l'ouverture de la popup : opération complète +
  // supports + valeurs de contrôle + assistantes. Évite d'éditer depuis des
  // données partielles (fiche client, contrôles, fiche produit) qui écraseraient
  // montant / supports / validation au premier « Enregistrer ».
  type FreshData = {
    operation: Operation & { clients?: { nom: string; prenom: string | null } | null };
    lignes: { isin: string; montant: number | string }[];
    statutsControle: { code: string; label: string; ordre: number | null; champ: string | null }[];
    assistantes: { id: string; full_name: string | null; email: string | null }[];
    currentUserId: string | null;
  };
  const [fresh, setFresh] = useState<FreshData | null>(null);
  const [freshError, setFreshError] = useState(false);

  async function handleAddRef(kind: "compagnie" | "type", label: string): Promise<string | null> {
    const result = await addRefValue(kind, label);
    if (result.error) {
      setError(result.error);
      return null;
    }
    if (kind === "compagnie") {
      setLocalCompagnies((prev) => [...prev, { id: Date.now(), label: result.value! }]);
    } else {
      setLocalTypeOps((prev) => [...prev, { id: Date.now(), label: result.value! }]);
    }
    return result.value ?? null;
  }

  const editOpen = externalEditOpen ?? internalEditOpen;

  function setEditOpen(val: boolean) {
    if (val) {
      setInternalEditOpen(true);
    } else {
      setInternalEditOpen(false);
      // Réinitialise les données fraîches pour la prochaine ouverture
      setFresh(null);
      setFreshError(false);
      onExternalEditClose?.();
    }
  }

  // Charge les données fraîches dès que la popup s'ouvre
  useEffect(() => {
    if (!editOpen) return;
    let cancelled = false;
    getOperationForEdit(operation.id).then((res) => {
      if (cancelled) return;
      if (res && "operation" in res && res.operation) {
        setFresh(res as unknown as FreshData);
      } else {
        // En cas d'erreur : fallback silencieux sur les props (comportement précédent)
        setFreshError(true);
      }
    }).catch(() => {
      if (!cancelled) setFreshError(true);
    });
    return () => { cancelled = true; };
  }, [editOpen, operation.id]);

  // Chargement en cours tant que ni données fraîches ni erreur
  const loadingFresh = editOpen && !fresh && !freshError;

  async function handleDelete() {
    if (!confirm("Supprimer cette opération ?")) return;
    setDeleting(true);
    await deleteOperation(operation.id);
    setDeleting(false);
    router.refresh();
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

    // Le champ assistante n'est envoyé que s'il était présent dans le formulaire
    const assistanteRaw = fd.get("assistante_id");

    const data: OperationFormData = {
      date: String(fd.get("date") || ""),
      client_id: String(fd.get("client_id") || ""),
      type_operation: typeOp,
      produit: String(fd.get("produit") || ""),
      compagnie: String(fd.get("compagnie") || ""),
      contrat: String(fd.get("contrat") || ""),
      montant: String(fd.get("montant") || ""),
      // Pas de fallback "new_cash" : "" = aucune collecte (acte administratif)
      collecte_type: String(fd.get("collecte_type") ?? "") as "new_cash" | "encours" | "",
      conseiller_code: String(fd.get("conseiller_code") || ""),
      statut: String(fd.get("statut") || ""),
      support_type: String(fd.get("support_type") || ""),
      isin: String(fd.get("isin") || ""),
      validation: fd.get("validation") === "on",
      devoir_conseil: fd.get("devoir_conseil") === "on",
      commentaire: String(fd.get("commentaire") || ""),
      courrier_pea: String(fd.get("courrier_pea") ?? ""),
      lettre_mission: String(fd.get("lettre_mission") ?? ""),
      conformite: String(fd.get("conformite") ?? ""),
      date_facturation: String(fd.get("date_facturation") || ""),
      assistante_id: assistanteRaw === null ? undefined : String(assistanteRaw),
      lignes: isInvestissement && lignes.length > 0 ? lignes : undefined,
    };
    const result = await updateOperation(operation.id, data);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      {!hideTrigger && (
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
      )}

      {editOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-no-row-click>
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Modifier l&apos;opération</h2>
              <button onClick={() => setEditOpen(false)} className="rounded-sm opacity-70 hover:opacity-100">✕</button>
            </div>
            {loadingFresh ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Chargement de l&apos;opération…</div>
            ) : (
              <OperationFormInner
                defaultValues={fresh?.operation ?? operation}
                defaultLignes={fresh ? (fresh.lignes.length > 0 ? fresh.lignes : undefined) : defaultLignes}
                clients={clients}
                conseillers={conseillers}
                typeOps={localTypeOps}
                produits={produits}
                statuts={statuts}
                compagnies={localCompagnies}
                produitsStructures={produitsStructures}
                assistantes={fresh?.assistantes}
                currentUserId={fresh?.currentUserId}
                statutsControle={fresh?.statutsControle}
                onSubmit={handleSubmit}
                saving={saving}
                error={error}
                onCancel={() => setEditOpen(false)}
                canManageRefs={canManageRefs}
                onAddRef={handleAddRef}
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
