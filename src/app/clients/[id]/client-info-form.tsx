"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateClientInfo } from "./actions";
import type { Client } from "@/lib/types";

export function ClientInfoForm({ client }: { client: Client }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await updateClientInfo(client.id, {
      email: String(fd.get("email") || ""),
      telephone: String(fd.get("telephone") || ""),
      notes: String(fd.get("notes") || ""),
    });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
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
      </div>
    </form>
  );
}
