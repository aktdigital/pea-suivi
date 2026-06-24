"use client";

import { useState, useMemo, useRef } from "react";
import type { Operation, Client, Conseiller, StatutControle } from "@/lib/types";
import { STATUTS_CONTROLE } from "@/lib/types";

export interface OperationFormInnerProps {
  defaultValues?: Partial<Operation & {
    courrier_pea?: StatutControle | null;
    lettre_mission?: StatutControle | null;
    conformite?: StatutControle | null;
  }>;
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  canManageRefs?: boolean;
  onAddRef?: (kind: "compagnie" | "type", label: string) => Promise<string | null>;
  submitLabel?: string;
  /** Active la saisie multi-fonds (plusieurs ISIN sur une même saisie) — création uniquement. */
  allowMultiIsin?: boolean;
}

function AddRefInline({
  kind,
  onAdd,
}: {
  kind: "compagnie" | "type";
  onAdd: (label: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="text-xs text-pea-teal hover:underline mt-1 inline-block"
      >
        + Ajouter…
      </button>
    );
  }

  return (
    <div className="flex gap-1 mt-1 items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={kind === "compagnie" ? "Nouvelle compagnie…" : "Nouveau type…"}
        className="flex h-7 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        autoFocus
      />
      <button
        type="button"
        disabled={busy || !value.trim()}
        onClick={async () => {
          setBusy(true);
          await onAdd(value.trim());
          setValue("");
          setAdding(false);
          setBusy(false);
        }}
        className="text-xs px-2 py-1 rounded bg-pea-teal text-white disabled:opacity-50"
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => { setAdding(false); setValue(""); }}
        className="text-xs px-2 py-1 rounded border border-pea-gray/30 text-pea-gray"
      >
        ✕
      </button>
    </div>
  );
}

export function OperationFormInner({
  defaultValues,
  clients,
  conseillers,
  typeOps,
  produits,
  statuts,
  compagnies,
  produitsStructures,
  onSubmit,
  saving,
  error,
  onCancel,
  canManageRefs = false,
  onAddRef,
  submitLabel = "Enregistrer",
  allowMultiIsin = false,
}: OperationFormInnerProps) {
  const today = new Date().toISOString().split("T")[0];
  // Local copies so newly added values appear immediately in the select
  const [localTypeOps, setLocalTypeOps] = useState(typeOps);
  const [localCompagnies, setLocalCompagnies] = useState(compagnies);
  const [typeOpValue, setTypeOpValue] = useState(defaultValues?.type_operation ?? "");
  const [compagnieValue, setCompagnieValue] = useState(defaultValues?.compagnie ?? "");

  // Option B : fonds supplémentaires (création multi-ISIN). Chaque ligne => une opération.
  const [extraFonds, setExtraFonds] = useState<number[]>([]);
  const fondsKeyRef = useRef(0);
  function addFonds() {
    fondsKeyRef.current += 1;
    setExtraFonds((prev) => [...prev, fondsKeyRef.current]);
  }
  function removeFonds(key: number) {
    setExtraFonds((prev) => prev.filter((k) => k !== key));
  }

  // Tâche B : Nortia en premier, puis alphabétique dans chaque groupe
  const sortedCompagnies = useMemo(() => {
    return [...localCompagnies].sort((a, b) => {
      const aNortia = /nortia/i.test(a.label);
      const bNortia = /nortia/i.test(b.label);
      if (aNortia && !bNortia) return -1;
      if (!aNortia && bNortia) return 1;
      return a.label.localeCompare(b.label, "fr", { sensitivity: "base" });
    });
  }, [localCompagnies]);

  async function handleAddCompagnie(label: string) {
    if (!onAddRef) return;
    const result = await onAddRef("compagnie", label);
    if (result) {
      setLocalCompagnies((prev) => [...prev, { id: Date.now(), label: result }]);
      setCompagnieValue(result);
    }
  }

  async function handleAddType(label: string) {
    if (!onAddRef) return;
    const result = await onAddRef("type", label);
    if (result) {
      setLocalTypeOps((prev) => [...prev, { id: Date.now(), label: result }]);
      setTypeOpValue(result);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Date *</label>
          <input
            type="date"
            name="date"
            defaultValue={defaultValues?.date ?? today}
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Type opération</label>
          <select
            name="type_operation"
            value={typeOpValue}
            onChange={(e) => setTypeOpValue(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— Sélectionner —</option>
            {localTypeOps.map((t) => <option key={t.id} value={t.label}>{t.label}</option>)}
          </select>
          {canManageRefs && onAddRef && (
            <AddRefInline kind="type" onAdd={handleAddType} />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Client</label>
          <select
            name="client_id"
            defaultValue={defaultValues?.client_id ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— Sélectionner —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom} {c.prenom ?? ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Produit</label>
          <select
            name="produit"
            defaultValue={defaultValues?.produit ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— Sélectionner —</option>
            {produits.map((p) => <option key={p.id} value={p.label}>{p.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Compagnie</label>
          <select
            name="compagnie"
            value={compagnieValue}
            onChange={(e) => setCompagnieValue(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— Sélectionner —</option>
            {sortedCompagnies.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
          </select>
          {canManageRefs && onAddRef && (
            <AddRefInline kind="compagnie" onAdd={handleAddCompagnie} />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Contrat</label>
          <input
            type="text"
            name="contrat"
            defaultValue={defaultValues?.contrat ?? ""}
            placeholder="N° contrat"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Montant (€)</label>
          <input
            type="number"
            name="montant"
            defaultValue={defaultValues?.montant ?? ""}
            step="0.01"
            min="0"
            placeholder="0.00"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Conseiller</label>
          <select
            name="conseiller_code"
            defaultValue={defaultValues?.conseiller_code ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— Sélectionner —</option>
            {conseillers.map((c) => (
              <option key={c.code} value={c.code}>{c.full_name} ({c.code})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Statut</label>
          <select
            name="statut"
            defaultValue={defaultValues?.statut ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— Sélectionner —</option>
            {statuts.map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Date de facturation</label>
          <input
            type="date"
            name="date_facturation"
            defaultValue={defaultValues?.date_facturation ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Code ISIN</label>
          <input
            type="text"
            name="isin"
            defaultValue={defaultValues?.isin ?? ""}
            list="isin-list"
            placeholder="Rechercher ISIN…"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <datalist id="isin-list">
            {produitsStructures.map((p) => (
              <option key={p.isin} value={p.isin}>{p.nom_produit}</option>
            ))}
          </datalist>
        </div>
      </div>

      {allowMultiIsin && (
        <div className="rounded-md border border-pea-gray/30 bg-pea-cream/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Autres fonds (même opération)</p>
            <button type="button" onClick={addFonds} className="text-xs text-pea-teal hover:underline">
              + Ajouter un fonds
            </button>
          </div>
          {extraFonds.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Arbitrage sur plusieurs fonds ? Le 1ᵉʳ fonds = le Code ISIN + Montant ci-dessus.
              Ajoute ici un ISIN et un montant par fonds supplémentaire : chacun créera une ligne
              d&apos;opération avec les mêmes informations communes.
            </p>
          ) : (
            <div className="space-y-2">
              {extraFonds.map((key) => (
                <div key={key} className="flex gap-2 items-center">
                  <input
                    type="text"
                    name="extra_isin"
                    list="isin-list"
                    placeholder="Code ISIN…"
                    className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input
                    type="number"
                    name="extra_montant"
                    step="0.01"
                    min="0"
                    placeholder="Montant (€)"
                    className="flex h-8 w-36 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => removeFonds(key)}
                    className="text-pea-rust text-sm px-2"
                    aria-label="Retirer ce fonds"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-6">
        <div className="space-y-1">
          <label className="text-sm font-medium">Collecte</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="collecte_type" value="new_cash" defaultChecked={defaultValues?.collecte_type === "new_cash" || !defaultValues?.collecte_type} />
              New Cash
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="collecte_type" value="encours" defaultChecked={defaultValues?.collecte_type === "encours"} />
              Encours
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Support</label>
          <select
            name="support_type"
            defaultValue={defaultValues?.support_type ?? ""}
            className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-pea-teal"
          >
            <option value="">—</option>
            {["Papier", "En Ligne", "Mail", "Extranet", "Signature électronique externe"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            {defaultValues?.support_type &&
              !["Papier", "En Ligne", "Mail", "Extranet", "Signature électronique externe"].includes(defaultValues.support_type) && (
                <option value={defaultValues.support_type}>{defaultValues.support_type}</option>
              )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Validation</label>
          <div className="flex items-center gap-2 h-9">
            <input
              type="checkbox"
              name="validation"
              id="edit-validation"
              defaultChecked={defaultValues?.validation ?? false}
              className="h-4 w-4 rounded border border-input accent-primary cursor-pointer"
            />
            <label htmlFor="edit-validation" className="text-sm cursor-pointer">Validé</label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Devoir de conseil</label>
          <div className="flex items-center gap-2 h-9">
            <input
              type="checkbox"
              name="devoir_conseil"
              id="edit-devoir-conseil"
              defaultChecked={defaultValues?.devoir_conseil ?? false}
              className="h-4 w-4 rounded border border-input accent-primary cursor-pointer"
            />
            <label htmlFor="edit-devoir-conseil" className="text-sm cursor-pointer">Réalisé</label>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Commentaire</label>
        <textarea
          name="commentaire"
          defaultValue={defaultValues?.commentaire ?? ""}
          rows={3}
          placeholder="Commentaire…"
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Section contrôles administratifs Michèle */}
      <div className="border-t pt-4 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Contrôles administratifs (Michèle)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Courrier PEA</label>
            <select
              name="courrier_pea"
              defaultValue={defaultValues?.courrier_pea ?? "a_faire"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {STATUTS_CONTROLE.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Lettre mission</label>
            <select
              name="lettre_mission"
              defaultValue={defaultValues?.lettre_mission ?? "a_faire"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {STATUTS_CONTROLE.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Conformité</label>
            <select
              name="conformite"
              defaultValue={defaultValues?.conformite ?? "a_faire"}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {STATUTS_CONTROLE.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 border border-border bg-background hover:bg-accent transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
