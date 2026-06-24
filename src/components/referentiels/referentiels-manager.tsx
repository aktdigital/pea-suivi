"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { renameRef, toggleRefActive, addRef, saveRefOrder, updateRefCode } from "@/app/referentiels/actions";

// Types des lignes de chaque table
interface RefRow {
  id: number;
  label: string;
  ordre: number | null;
  active?: boolean | null;
  code?: string | null;
  is_final?: boolean | null;
}

interface RefFreqRow {
  id: number;
  label: string;
  ordre: number | null;
}

interface ReferentielsManagerProps {
  compagnies: RefRow[];
  produits: RefRow[];
  operations: RefRow[];
  statuts: RefRow[];
  supports: RefRow[];
  structureurs: RefRow[];
  frequences: RefFreqRow[];
}

// Définition des onglets dans l'ordre demandé
type TabDef = {
  key: string;
  label: string;
  table: string;
  hasActive: boolean;
  hasCode?: boolean;
  readonlyFields?: string[];
};

const TABS: TabDef[] = [
  { key: "compagnies", label: "Compagnies", table: "ref_compagnies", hasActive: true },
  { key: "produits", label: "Produits", table: "ref_produits", hasActive: true },
  { key: "operations", label: "Opérations", table: "ref_operations", hasActive: true, hasCode: true },
  { key: "statuts", label: "Statuts", table: "ref_statuts", hasActive: true, readonlyFields: ["is_final"] },
  { key: "supports", label: "Supports", table: "ref_supports", hasActive: true },
  { key: "structureurs", label: "Structureurs", table: "ref_structureurs", hasActive: true },
  { key: "frequences", label: "Fréquences", table: "ref_frequences", hasActive: false },
];

interface RefListProps {
  table: string;
  initialRows: RefRow[];
  hasActive: boolean;
  hasCode?: boolean;
  readonlyFields?: string[];
}

function RefList({ table, initialRows, hasActive, hasCode = false, readonlyFields = [] }: RefListProps) {
  const [rows, setRows] = useState<RefRow[]>(initialRows);
  const [labels, setLabels] = useState<Record<number, string>>(
    Object.fromEntries(initialRows.map((r) => [r.id, r.label]))
  );
  const [codes, setCodes] = useState<Record<number, string>>(
    Object.fromEntries(initialRows.map((r) => [r.id, r.code ?? ""]))
  );
  const [savingCode, setSavingCode] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [toggling, setToggling] = useState<Record<number, boolean>>({});
  const [movePending, startMoveTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<number | "add", string>>>({});
  const [addLabel, setAddLabel] = useState("");
  const [adding, setAdding] = useState(false);

  function setError(key: number | "add", msg: string) {
    setErrors((prev) => ({ ...prev, [key]: msg }));
  }

  function clearError(key: number | "add") {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as keyof typeof next];
      return next;
    });
  }

  async function handleRename(id: number) {
    clearError(id);
    const label = labels[id] ?? "";
    setSaving((p) => ({ ...p, [id]: true }));
    const result = await renameRef(table, id, label);
    setSaving((p) => ({ ...p, [id]: false }));
    if (result.error) {
      setError(id, result.error);
    } else {
      // Mise à jour locale du label
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, label: label.trim() } : r)));
    }
  }

  async function handleSaveCode(id: number) {
    clearError(id);
    const code = codes[id] ?? "";
    setSavingCode((p) => ({ ...p, [id]: true }));
    const result = await updateRefCode(table, id, code);
    setSavingCode((p) => ({ ...p, [id]: false }));
    if (result.error) {
      setError(id, result.error);
    } else {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, code: code.trim() || null } : r)));
    }
  }

  async function handleToggle(id: number, current: boolean | null | undefined) {
    clearError(id);
    const newActive = !current;
    setToggling((p) => ({ ...p, [id]: true }));
    const result = await toggleRefActive(table, id, newActive);
    setToggling((p) => ({ ...p, [id]: false }));
    if (result.error) {
      setError(id, result.error);
    } else {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, active: newActive } : r)));
    }
  }

  function move(index: number, direction: -1 | 1) {
    const newRows = [...rows];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newRows.length) return;
    [newRows[index], newRows[targetIndex]] = [newRows[targetIndex], newRows[index]];
    setRows(newRows);
    startMoveTransition(async () => {
      await saveRefOrder(table, newRows.map((r) => r.id));
    });
  }

  async function handleAdd() {
    clearError("add");
    if (!addLabel.trim()) {
      setError("add", "Le libellé ne peut pas être vide");
      return;
    }
    setAdding(true);
    const result = await addRef(table, addLabel);
    setAdding(false);
    if (result.error) {
      setError("add", result.error);
    } else {
      setAddLabel("");
      // Le revalidatePath côté serveur rafraîchira les données ;
      // on ajoute une ligne temporaire pour la réactivité immédiate
      const maxOrdre = rows.reduce((m, r) => Math.max(m, r.ordre ?? 0), 0);
      const tempRow: RefRow = {
        id: Date.now(), // id temporaire remplacé au prochain refresh serveur
        label: addLabel.trim(),
        ordre: maxOrdre + 10,
        active: hasActive ? true : undefined,
      };
      setRows((prev) => [...prev, tempRow]);
      setLabels((prev) => ({ ...prev, [tempRow.id]: tempRow.label }));
    }
  }

  return (
    <div className="space-y-4">
      {/* Liste */}
      <div className="rounded-lg border border-pea-gray/20 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-pea-blue/5 border-b border-pea-gray/20">
              <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs w-8">#</th>
              <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs">Libellé</th>
              {hasCode && (
                <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs w-36">Code</th>
              )}
              {readonlyFields.includes("is_final") && (
                <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs w-20">Final</th>
              )}
              {hasActive && (
                <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs w-20">Actif</th>
              )}
              <th className="px-3 py-2 w-24"></th>
              <th className="px-3 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className={`border-b border-pea-gray/20 last:border-0 ${
                  index % 2 === 0 ? "bg-white" : "bg-pea-cream/40"
                } ${hasActive && !row.active ? "opacity-50" : ""}`}
              >
                <td className="px-3 py-2 text-pea-gray/60 text-xs tabular-nums">{index + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={labels[row.id] ?? row.label}
                      onChange={(e) => {
                        setLabels((prev) => ({ ...prev, [row.id]: e.target.value }));
                        clearError(row.id);
                      }}
                      className="h-7 text-sm"
                      disabled={saving[row.id]}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs shrink-0"
                      onClick={() => handleRename(row.id)}
                      disabled={saving[row.id]}
                    >
                      {saving[row.id] ? "…" : "Enregistrer"}
                    </Button>
                  </div>
                  {errors[row.id] && (
                    <p className="text-xs text-destructive mt-1">{errors[row.id]}</p>
                  )}
                </td>
                {hasCode && (
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Input
                        value={codes[row.id] ?? ""}
                        onChange={(e) => {
                          setCodes((prev) => ({ ...prev, [row.id]: e.target.value }));
                          clearError(row.id);
                        }}
                        placeholder="—"
                        className="h-7 w-20 text-xs font-mono"
                        disabled={savingCode[row.id]}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs shrink-0"
                        onClick={() => handleSaveCode(row.id)}
                        disabled={savingCode[row.id]}
                        title="Enregistrer le code"
                      >
                        {savingCode[row.id] ? "…" : "OK"}
                      </Button>
                    </div>
                  </td>
                )}
                {readonlyFields.includes("is_final") && (
                  <td className="px-3 py-2">
                    {row.is_final ? (
                      <Badge className="text-xs bg-pea-teal text-white">Oui</Badge>
                    ) : (
                      <span className="text-pea-gray/40 text-xs">Non</span>
                    )}
                  </td>
                )}
                {hasActive && (
                  <td className="px-3 py-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.active ?? false}
                        onChange={() => handleToggle(row.id, row.active)}
                        disabled={toggling[row.id]}
                        className="rounded border-pea-gray/40 accent-pea-teal"
                      />
                      <span className="text-xs text-pea-gray">
                        {toggling[row.id] ? "…" : row.active ? "Actif" : "Inactif"}
                      </span>
                    </label>
                  </td>
                )}
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-pea-gray hover:text-pea-blue"
                      onClick={() => move(index, -1)}
                      disabled={index === 0 || movePending}
                      title="Monter"
                    >
                      ▲
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-pea-gray hover:text-pea-blue"
                      onClick={() => move(index, 1)}
                      disabled={index === rows.length - 1 || movePending}
                      title="Descendre"
                    >
                      ▼
                    </Button>
                  </div>
                </td>
                <td className="px-3 py-2"></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4 + (hasActive ? 1 : 0) + (hasCode ? 1 : 0) + readonlyFields.length}
                  className="px-3 py-6 text-center text-sm text-pea-gray/60"
                >
                  Aucune valeur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Ajouter une valeur */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nouvelle valeur…"
          value={addLabel}
          onChange={(e) => {
            setAddLabel(e.target.value);
            clearError("add");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="max-w-xs h-8 text-sm"
          disabled={adding}
        />
        <Button size="sm" onClick={handleAdd} disabled={adding} className="h-8">
          {adding ? "Ajout…" : "Ajouter"}
        </Button>
        {errors["add"] && (
          <p className="text-xs text-destructive">{errors["add"]}</p>
        )}
      </div>
    </div>
  );
}

export function ReferentielsManager({
  compagnies,
  produits,
  operations,
  statuts,
  supports,
  structureurs,
  frequences,
}: ReferentielsManagerProps) {
  const dataMap: Record<string, { rows: RefRow[]; hasActive: boolean; hasCode?: boolean; readonlyFields?: string[] }> = {
    compagnies: { rows: compagnies, hasActive: true },
    produits: { rows: produits, hasActive: true },
    operations: { rows: operations, hasActive: true, hasCode: true },
    statuts: { rows: statuts, hasActive: true, readonlyFields: ["is_final"] },
    supports: { rows: supports, hasActive: true },
    structureurs: { rows: structureurs, hasActive: true },
    frequences: {
      rows: frequences.map((f) => ({ ...f, active: undefined })),
      hasActive: false,
    },
  };

  return (
    <Tabs defaultValue="compagnies" className="space-y-4">
      <TabsList className="flex-wrap h-auto gap-1">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} className="text-sm">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map((tab) => {
        const data = dataMap[tab.key];
        return (
          <TabsContent key={tab.key} value={tab.key} className="mt-4">
            <RefList
              table={tab.table}
              initialRows={data.rows}
              hasActive={data.hasActive}
              hasCode={data.hasCode}
              readonlyFields={data.readonlyFields ?? []}
            />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
