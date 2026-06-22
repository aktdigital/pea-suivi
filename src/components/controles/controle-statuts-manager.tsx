"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Plus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { addControleStatut, updateControleStatut } from "@/app/controles/actions";

interface StatutControle {
  code: string;
  label: string;
  ordre: number | null;
}

export function ControleStatutsManager({ statuts }: { statuts: StatutControle[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [nouveau, setNouveau] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string; success?: boolean }>) {
    setMessage(null);
    startTransition(async () => {
      const res = await action();
      if (res?.error) setMessage(res.error);
      else {
        setMessage(null);
        router.refresh();
      }
    });
  }

  function handleAdd() {
    if (!nouveau.trim()) return;
    run(async () => {
      const res = await addControleStatut(nouveau);
      if (!res?.error) setNouveau("");
      return res;
    });
  }

  function handleUpdate(code: string) {
    const val = edits[code];
    if (val === undefined) return;
    run(() => updateControleStatut(code, val));
  }

  const btn =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-8 px-3 py-1.5 border border-pea-gray/40 bg-pea-cream text-pea-blue hover:bg-white disabled:opacity-50 [&_svg]:size-4";

  return (
    <div className="rounded-lg border border-pea-gray/30 bg-pea-cream/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-pea-blue"
      >
        <span className="inline-flex items-center gap-2">
          <Settings2 className="size-4 text-pea-teal" />
          Gérer les valeurs de contrôle ({statuts.length})
        </span>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-pea-gray leading-snug">
            Ces valeurs alimentent les listes « Courrier PEA », « Lettre de mission » et « Conformité ». Modifier un libellé
            le met à jour partout ; les opérations déjà classées conservent leur valeur.
          </p>

          {/* Liste existante (modification du libellé) */}
          <div className="space-y-1.5">
            {statuts.map((s) => (
              <div key={s.code} className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={s.label}
                  onChange={(e) => setEdits((p) => ({ ...p, [s.code]: e.target.value }))}
                  className="flex-1 h-8 rounded-md border border-pea-gray/30 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-pea-teal"
                />
                <button
                  type="button"
                  onClick={() => handleUpdate(s.code)}
                  disabled={isPending || edits[s.code] === undefined || edits[s.code] === s.label}
                  className={btn}
                  title="Enregistrer le libellé"
                >
                  <Check />
                </button>
              </div>
            ))}
          </div>

          {/* Ajout */}
          <div className="flex items-center gap-2 pt-1 border-t border-pea-gray/20">
            <input
              type="text"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
              placeholder="Nouvelle valeur…"
              className="flex-1 h-8 rounded-md border border-pea-gray/30 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-pea-teal mt-2"
            />
            <button type="button" onClick={handleAdd} disabled={isPending || !nouveau.trim()} className={`${btn} mt-2`}>
              <Plus /> Ajouter
            </button>
          </div>

          {message && <p className="text-xs text-pea-rust">{message}</p>}
        </div>
      )}
    </div>
  );
}
