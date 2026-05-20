"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateFacturation } from "@/app/engagement-structure/actions";
import type { ProduitStructure } from "@/lib/types";

interface Props {
  produit: ProduitStructure;
}

const STATUT_OPTIONS = [
  { value: "", label: "Aucun" },
  { value: "E", label: "E — Enregistré e-Capital" },
  { value: "F", label: "F — Facturé" },
  { value: "D", label: "D — À définir" },
];

export function FacturationEditDialog({ produit }: Props) {
  const [open, setOpen] = useState(false);
  const [statut, setStatut] = useState<string>(produit.statut_facturation ?? "");
  const [date, setDate] = useState<string>(produit.date_facturation ?? "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    // Reset to current values each time we open
    setStatut(produit.statut_facturation ?? "");
    setDate(produit.date_facturation ?? "");
    setErrorMsg(null);
    setOpen(true);
  }

  function handleSave() {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await updateFacturation(produit.isin, {
        statut_facturation: statut || null,
        date_facturation: date || null,
      });
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <>
      {/* Trigger zone: two cells rendered externally, this component only manages the dialog */}
      {/* The pencil icon is embedded here and triggered by the parent cells */}
      <span
        onClick={handleOpen}
        className="inline-flex items-center gap-1 cursor-pointer group"
        title="Éditer la facturation"
      >
        <Pencil className="size-3 opacity-0 group-hover:opacity-60 text-pea-teal transition-opacity" />
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-pea-blue font-serif">
              Facturation — {produit.nom_produit}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {errorMsg && (
              <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{errorMsg}</p>
            )}

            {/* Statut facturation */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Statut facturation</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                className="w-full text-sm border rounded px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-pea-teal/40"
              >
                {STATUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Date facturation */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date facturation</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm border rounded px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-pea-teal/40"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm rounded border border-pea-gray/30 hover:bg-muted/50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 text-sm rounded bg-pea-teal text-white hover:bg-pea-teal/90 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* Exported helper: a clickable cell wrapper that opens the facturation dialog */
export function FacturationCell({
  produit,
  children,
}: {
  produit: ProduitStructure;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [statut, setStatut] = useState<string>(produit.statut_facturation ?? "");
  const [date, setDate] = useState<string>(produit.date_facturation ?? "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    setStatut(produit.statut_facturation ?? "");
    setDate(produit.date_facturation ?? "");
    setErrorMsg(null);
    setOpen(true);
  }

  function handleSave() {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await updateFacturation(produit.isin, {
        statut_facturation: statut || null,
        date_facturation: date || null,
      });
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <span
        onClick={handleOpen}
        className="inline-flex items-center gap-1 cursor-pointer group rounded border border-dashed border-transparent hover:border-pea-teal/40 hover:bg-pea-teal/5 px-1 -mx-1 transition-colors"
        title="Cliquer pour éditer la facturation"
      >
        {children}
        <Pencil className="size-3 opacity-0 group-hover:opacity-50 text-pea-teal flex-shrink-0 transition-opacity" />
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-pea-blue font-serif">
              Facturation — {produit.nom_produit}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {errorMsg && (
              <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{errorMsg}</p>
            )}

            {/* Statut facturation */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Statut facturation</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                className="w-full text-sm border rounded px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-pea-teal/40"
              >
                {STATUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Date facturation */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date facturation</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm border rounded px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-pea-teal/40"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm rounded border border-pea-gray/30 hover:bg-muted/50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 text-sm rounded bg-pea-teal text-white hover:bg-pea-teal/90 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
