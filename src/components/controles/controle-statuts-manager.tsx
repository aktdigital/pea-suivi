"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Plus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { addControleStatut, updateControleStatut } from "@/app/controles/actions";

interface StatutControle {
  code: string;
  label: string;
  ordre: number | null;
  champ: string | null;
}

const SECTIONS: { key: string | null; title: string; hint: string }[] = [
  { key: null, title: "Commun (toutes les listes)", hint: "Valeurs proposées dans les 3 listes" },
  { key: "courrier_pea", title: "Courrier PEA", hint: "Valeurs propres à Courrier PEA" },
  { key: "lettre_mission", title: "Lettre de mission", hint: "Valeurs propres à Lettre de mission" },
  { key: "conformite", title: "Conformité", hint: "Valeurs propres à Conformité" },
];

export function ControleStatutsManager({ statuts }: { statuts: StatutControle[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [nouveaux, setNouveaux] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string; success?: boolean }>, onOk?: () => void) {
    setMessage(null);
    startTransition(async () => {
      const res = await action();
      if (res?.error) setMessage(res.error);
      else { onOk?.(); router.refresh(); }
    });
  }

  function handleAdd(sectionKey: string | null) {
    const k = sectionKey ?? "_commun";
    const val = (nouveaux[k] ?? "").trim();
    if (!val) return;
    run(() => addControleStatut(val, sectionKey), () => setNouveaux((p) => ({ ...p, [k]: "" })));
  }

  const btn =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-8 px-3 py-1.5 border border-pea-gray/40 bg-pea-cream text-pea-blue hover:bg-white disabled:opacity-50 [&_svg]:size-4";
  const inputCls = "flex-1 h-8 rounded-md border border-pea-gray/30 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-pea-teal";

  return (
    <div className="rounded-lg border border-pea-gray/30 bg-pea-cream/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-pea-blue"
      >
        <span className="inline-flex items-center gap-2">
          <Settings2 className="size-4 text-pea-teal" />
          Gérer les valeurs de contrôle
        </span>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-pea-gray leading-snug">
            « Commun » = valeurs proposées dans les 3 listes. Chaque liste peut aussi avoir ses propres valeurs.
            Modifier un libellé le met à jour partout ; les opérations déjà classées conservent leur valeur.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {SECTIONS.map((section) => {
              const k = section.key ?? "_commun";
              const items = statuts.filter((s) => (s.champ ?? null) === section.key);
              return (
                <div key={k} className="rounded-md border border-pea-gray/25 bg-white p-3 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-pea-blue uppercase tracking-wide">{section.title}</p>
                    <p className="text-[11px] text-pea-gray">{section.hint}</p>
                  </div>

                  <div className="space-y-1.5">
                    {items.length === 0 && (
                      <p className="text-[11px] text-pea-gray italic">Aucune valeur propre.</p>
                    )}
                    {items.map((s) => (
                      <div key={s.code} className="flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={s.label}
                          onChange={(e) => setEdits((p) => ({ ...p, [s.code]: e.target.value }))}
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => run(() => updateControleStatut(s.code, edits[s.code] ?? s.label))}
                          disabled={isPending || edits[s.code] === undefined || edits[s.code] === s.label}
                          className={btn}
                          title="Enregistrer le libellé"
                        >
                          <Check />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-pea-gray/15">
                    <input
                      type="text"
                      value={nouveaux[k] ?? ""}
                      onChange={(e) => setNouveaux((p) => ({ ...p, [k]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(section.key); } }}
                      placeholder="Nouvelle valeur…"
                      className={`${inputCls} mt-1`}
                    />
                    <button
                      type="button"
                      onClick={() => handleAdd(section.key)}
                      disabled={isPending || !(nouveaux[k] ?? "").trim()}
                      className={`${btn} mt-1`}
                    >
                      <Plus /> Ajouter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {message && <p className="text-xs text-pea-rust">{message}</p>}
        </div>
      )}
    </div>
  );
}
