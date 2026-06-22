"use client";

import { useTransition } from "react";
import { updateControle } from "@/app/controles/actions";

type ChampControle = "courrier_pea" | "lettre_mission" | "conformite";

interface RefStatutControle {
  code: string;
  label: string;
  ordre: number | null;
  champ: string | null;
}

interface ControleCellProps {
  opId: string;
  champ: ChampControle;
  valeurActuelle: string | null;
  statutsControle: RefStatutControle[];
}

export function ControleCell({ opId, champ, valeurActuelle, statutsControle }: ControleCellProps) {
  const [isPending, startTransition] = useTransition();

  // Valeurs applicables à ce champ : communes (champ null) + spécifiques à ce champ
  const options = statutsControle.filter((s) => s.champ == null || s.champ === champ);

  // Vérifie si la valeur actuelle est un code connu (applicable à ce champ)
  const codesConnus = options.map((s) => s.code);
  const estCodeConnu = valeurActuelle === null || codesConnus.includes(valeurActuelle ?? "");

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    startTransition(async () => {
      await updateControle(opId, champ, val);
    });
  }

  return (
    <select
      defaultValue={valeurActuelle ?? ""}
      onChange={handleChange}
      disabled={isPending}
      data-no-row-click
      className="h-8 rounded-md border border-pea-gray/30 bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-pea-teal text-pea-graphite disabled:opacity-50 min-w-[120px]"
    >
      <option value="">—</option>
      {/* Si la valeur actuelle n'est pas un code connu, l'afficher comme option sélectionnée */}
      {!estCodeConnu && valeurActuelle && (
        <option value={valeurActuelle}>{valeurActuelle}</option>
      )}
      {options.map((s) => (
        <option key={s.code} value={s.code}>{s.label}</option>
      ))}
    </select>
  );
}
