"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOperation } from "@/app/operations/actions";
import type { OperationFormData } from "@/app/operations/actions";
import type { Client, Conseiller } from "@/lib/types";

interface OperationFormProps {
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
  defaultIsin?: string;
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
}: OperationFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      date_facturation: String(fd.get("date_facturation") || ""),
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date *</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={today}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Type opération</label>
                  <select
                    name="type_operation"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">— Sélectionner —</option>
                    {typeOps.map((t) => <option key={t.id} value={t.label}>{t.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Client</label>
                  <select
                    name="client_id"
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
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">— Sélectionner —</option>
                    {compagnies.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Contrat</label>
                  <input
                    type="text"
                    name="contrat"
                    placeholder="N° contrat"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Montant (€)</label>
                  <input
                    type="number"
                    name="montant"
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
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">— Sélectionner —</option>
                    {statuts.map((s) => <option key={s.id} value={s.label}>{s.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Code ISIN</label>
                  <input
                    type="text"
                    name="isin"
                    list="isin-list-new"
                    defaultValue={defaultIsin ?? ""}
                    placeholder="Rechercher ISIN…"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <datalist id="isin-list-new">
                    {produitsStructures.map((p) => (
                      <option key={p.isin} value={p.isin}>{p.nom_produit}</option>
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Date de facturation</label>
                  <input
                    type="date"
                    name="date_facturation"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Collecte</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="collecte_type" value="new_cash" defaultChecked />
                      New Cash
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="collecte_type" value="encours" />
                      Encours
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Support</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="support_type" value="papier" defaultChecked />
                      Papier
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="support_type" value="ligne" />
                      Ligne
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Validation</label>
                  <div className="flex items-center gap-2 h-9">
                    <input
                      type="checkbox"
                      name="validation"
                      id="new-validation"
                      className="h-4 w-4 rounded border border-input accent-primary cursor-pointer"
                    />
                    <label htmlFor="new-validation" className="text-sm cursor-pointer">Validé</label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Commentaire</label>
                <textarea
                  name="commentaire"
                  rows={3}
                  placeholder="Commentaire…"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 border border-border bg-background hover:bg-accent transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Enregistrement…" : "Créer l'opération"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
