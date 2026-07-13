"use client";

import { useState, useMemo } from "react";
import type { Operation, Client, Conseiller, StatutControle } from "@/lib/types";
import { STATUTS_CONTROLE } from "@/lib/types";
import { isInvestmentType } from "@/lib/utils";

export interface OperationFormInnerProps {
  defaultValues?: Partial<Operation & {
    courrier_pea?: StatutControle | null;
    lettre_mission?: StatutControle | null;
    conformite?: StatutControle | null;
  }>;
  /** Lignes support pré-remplies (édition multi-ISIN) */
  defaultLignes?: { isin: string; montant: number | string }[];
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
  /** Assistantes sélectionnables pour l'attribution de l'opération */
  assistantes?: { id: string; full_name: string | null; email: string | null }[];
  /** Utilisateur connecté (pré-sélection de l'assistante à la création) */
  currentUserId?: string | null;
  /** Valeurs de contrôle dynamiques (ref_statuts_controle) — fallback : liste codée en dur */
  statutsControle?: { code: string; label: string; champ: string | null }[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  canManageRefs?: boolean;
  onAddRef?: (kind: "compagnie" | "type", label: string) => Promise<string | null>;
  submitLabel?: string;
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
  defaultLignes,
  clients,
  conseillers,
  typeOps,
  produits,
  statuts,
  compagnies,
  produitsStructures,
  assistantes,
  currentUserId,
  statutsControle,
  onSubmit,
  saving,
  error,
  onCancel,
  canManageRefs = false,
  onAddRef,
  submitLabel = "Enregistrer",
}: OperationFormInnerProps) {
  // Mode édition = une opération existante est fournie
  const isEdit = Boolean(defaultValues?.id);
  const today = new Date().toISOString().split("T")[0];
  // Local copies so newly added values appear immediately in the select
  const [localTypeOps, setLocalTypeOps] = useState(typeOps);
  const [localCompagnies, setLocalCompagnies] = useState(compagnies);
  const [typeOpValue, setTypeOpValue] = useState(defaultValues?.type_operation ?? "");
  const [compagnieValue, setCompagnieValue] = useState(defaultValues?.compagnie ?? "");

  // Section « Supports » (mode investissement)
  const initLignes = defaultLignes && defaultLignes.length > 0
    ? defaultLignes.map((l) => ({ isin: String(l.isin ?? ""), montant: String(l.montant ?? "") }))
    : [{ isin: "", montant: "" }];
  const [lignes, setLignes] = useState<{ isin: string; montant: string }[]>(initLignes);

  function addLigne() {
    setLignes((prev) => [...prev, { isin: "", montant: "" }]);
  }
  function removeLigne(index: number) {
    setLignes((prev) => prev.filter((_, i) => i !== index));
  }
  function updateLigne(index: number, field: "isin" | "montant", value: string) {
    setLignes((prev) => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  }

  const totalLignes = lignes.reduce((acc, l) => acc + (parseFloat(l.montant) || 0), 0);

  const isInvestissement = isInvestmentType(typeOpValue);

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

        {/* Montant simple — masqué si type investissement */}
        {!isInvestissement && (
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
        )}

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

        {/* Attribution : pour le compte de quelle assistante l'opération est saisie */}
        {assistantes && assistantes.length > 0 && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Assistante (opération comptée pour)</label>
            <select
              name="assistante_id"
              defaultValue={defaultValues?.assistante_id ?? currentUserId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">— Aucune —</option>
              {assistantes.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name ?? a.email ?? a.id}</option>
              ))}
            </select>
          </div>
        )}

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

        {/* Code ISIN simple — masqué si type investissement */}
        {!isInvestissement && (
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
        )}
      </div>

      {/* Section Supports (mode investissement) */}
      {isInvestissement && (
        <div className="rounded-md border border-pea-teal/30 bg-pea-cream/40 p-3 space-y-3">
          <datalist id="isin-list">
            {produitsStructures.map((p) => (
              <option key={p.isin} value={p.isin}>{p.nom_produit}</option>
            ))}
          </datalist>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-pea-blue">Supports</p>
            <button type="button" onClick={addLigne} className="text-xs text-pea-teal hover:underline">
              + Ajouter un support
            </button>
          </div>
          <div className="space-y-2">
            {lignes.map((ligne, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  name="ligne_isin"
                  list="isin-list"
                  value={ligne.isin}
                  onChange={(e) => updateLigne(index, "isin", e.target.value)}
                  placeholder="Code ISIN…"
                  className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <input
                  type="number"
                  name="ligne_montant"
                  value={ligne.montant}
                  onChange={(e) => updateLigne(index, "montant", e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="Montant (€)"
                  className="flex h-8 w-36 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {lignes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLigne(index)}
                    className="text-pea-rust text-sm px-2 flex-shrink-0"
                    aria-label="Retirer ce support"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end items-center gap-2 pt-1 border-t border-pea-teal/20">
            <span className="text-xs text-pea-gray">Total :</span>
            <span className="text-sm font-semibold text-pea-blue">
              {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totalLignes)}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-6 flex-wrap">
        <div className="space-y-1">
          <label className="text-sm font-medium">Collecte *</label>
          <div className="flex gap-4">
            {/* Pas de pré-cochage à la création : le choix doit être explicite.
                « Aucune » = actes administratifs (changement RIB, clause bénéficiaire…) */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="collecte_type" value="new_cash" required defaultChecked={defaultValues?.collecte_type === "new_cash"} />
              New Cash
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="collecte_type" value="encours" defaultChecked={defaultValues?.collecte_type === "encours"} />
              Encours
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="collecte_type" value="" defaultChecked={isEdit && !defaultValues?.collecte_type} />
              Aucune
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
          {([
            { name: "courrier_pea", label: "Courrier PEA", value: defaultValues?.courrier_pea ?? null },
            { name: "lettre_mission", label: "Lettre mission", value: defaultValues?.lettre_mission ?? null },
            { name: "conformite", label: "Conformité", value: defaultValues?.conformite ?? null },
          ] as const).map((champ) => {
            // Valeurs dynamiques (ref_statuts_controle) filtrées pour ce champ ;
            // fallback sur la liste codée en dur si non fournies.
            const options = statutsControle && statutsControle.length > 0
              ? statutsControle
                  .filter((s) => s.champ == null || s.champ === champ.name)
                  .map((s) => ({ value: s.code, label: s.label }))
              : STATUTS_CONTROLE.map((s) => ({ value: s.value as string, label: s.label }));
            // Préserve une valeur actuelle inconnue de la liste (évite de l'écraser en enregistrant)
            const valeurInconnue = champ.value && !options.some((o) => o.value === champ.value);
            return (
              <div key={champ.name} className="space-y-1">
                <label className="text-sm font-medium">{champ.label}</label>
                <select
                  name={champ.name}
                  defaultValue={champ.value ?? ""}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">—</option>
                  {valeurInconnue && <option value={champ.value!}>{champ.value}</option>}
                  {options.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            );
          })}
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
