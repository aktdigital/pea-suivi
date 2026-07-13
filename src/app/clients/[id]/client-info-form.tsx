"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateClientInfo, deleteClient } from "./actions";
import type { Client } from "@/lib/types";

interface Conseiller {
  code: string;
  full_name: string | null;
}

interface Assistante {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
}

interface ClientInfoFormProps {
  client: Client;
  conseillers: Conseiller[];
  assistantes: Assistante[];
  operationsCount: number;
}

export function ClientInfoForm({ client, conseillers, assistantes, operationsCount }: ClientInfoFormProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteClient(client.id);
    // En cas de succès, deleteClient redirige (la promesse ne résout pas ici).
    if (result?.error) {
      setDeleteError(result.error);
      setDeleting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await updateClientInfo(client.id, {
      nom: String(fd.get("nom") || ""),
      prenom: String(fd.get("prenom") || ""),
      type_personne: String(fd.get("type_personne") || "") as "physique" | "morale",
      email: String(fd.get("email") || ""),
      telephone: String(fd.get("telephone") || ""),
      notes: String(fd.get("notes") || ""),
      conseiller_code: String(fd.get("conseiller_code") || ""),
      assistante_profile_id: String(fd.get("assistante_profile_id") || ""),
    });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditing(false);
    }
  }

  const conseillerLabel = (code: string | null) => {
    if (!code) return "—";
    const c = conseillers.find((x) => x.code === code);
    if (!c) return code;
    return c.full_name ? `${c.full_name} (${c.code})` : c.code;
  };

  const assistanteLabel = (profileId: string | null) => {
    if (!profileId) return "—";
    const a = assistantes.find((x) => x.id === profileId);
    if (!a) return "—";
    return a.full_name ?? a.email ?? profileId;
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Conseiller</span>
            <p className="font-medium mt-0.5">{conseillerLabel(client.conseiller_code)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Assistante</span>
            <p className="font-medium mt-0.5">{assistanteLabel(client.assistante_profile_id ?? null)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Email</span>
            <p className="font-medium mt-0.5">{client.email ?? "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Téléphone</span>
            <p className="font-medium mt-0.5">{client.telephone ?? "—"}</p>
          </div>
          {client.notes && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Notes</span>
              <p className="font-medium mt-0.5 whitespace-pre-line">{client.notes}</p>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Modifier
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Nom</label>
          <Input type="text" name="nom" defaultValue={client.nom ?? ""} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Prénom</label>
          <Input type="text" name="prenom" defaultValue={client.prenom ?? ""} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Type de personne</label>
          <select
            name="type_personne"
            defaultValue={client.type_personne}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="physique">Personne physique</option>
            <option value="morale">Personne morale</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Conseiller</label>
          <select
            name="conseiller_code"
            defaultValue={client.conseiller_code ?? ""}
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
        <div className="space-y-1">
          <label className="text-sm font-medium">Assistante</label>
          <select
            name="assistante_profile_id"
            defaultValue={client.assistante_profile_id ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Aucune</option>
            {assistantes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name ?? a.email ?? a.id}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" name="email" defaultValue={client.email ?? ""} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Téléphone</label>
          <Input type="tel" name="telephone" defaultValue={client.telephone ?? ""} />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            defaultValue={client.notes ?? ""}
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Notes libres…"
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
          Annuler
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="ml-auto"
          onClick={() => setConfirmOpen(true)}
        >
          Supprimer
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!deleting) setConfirmOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce client ?</DialogTitle>
            <DialogDescription>
              {client.nom} {client.prenom ?? ""} sera supprimé définitivement
              {operationsCount > 0
                ? `, ainsi que ses ${operationsCount} opération${operationsCount > 1 ? "s" : ""} liée${operationsCount > 1 ? "s" : ""}`
                : ""}
              . Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
