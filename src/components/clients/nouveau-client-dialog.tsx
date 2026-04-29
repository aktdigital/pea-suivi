"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/app/clients/actions";

interface Conseiller {
  code: string;
  full_name: string | null;
}

export function NouveauClientDialog({ conseillers }: { conseillers: Conseiller[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await createClient(fd);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="gap-1.5"
      >
        <Plus className="size-4" />
        Nouveau client
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nouveau client</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-sm opacity-70 hover:opacity-100 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Nom <span className="text-destructive">*</span>
                  </label>
                  <Input name="nom" required placeholder="Dupont" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Prénom</label>
                  <Input name="prenom" placeholder="Jean" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type de personne</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="type_personne"
                      value="physique"
                      defaultChecked
                      className="accent-primary"
                    />
                    Physique
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="type_personne"
                      value="morale"
                      className="accent-primary"
                    />
                    Morale
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Conseiller</label>
                <select
                  name="conseiller_code"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">— Aucun</option>
                  {conseillers.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.full_name ? `${c.full_name} (${c.code})` : c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" name="email" placeholder="jean.dupont@email.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Téléphone</label>
                  <Input type="tel" name="telephone" placeholder="06 00 00 00 00" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Notes libres…"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Création…" : "Créer le client"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
