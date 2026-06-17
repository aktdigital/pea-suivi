"use client";

import React, { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  getISOWeek,
  startOfISOWeek,
  endOfISOWeek,
  addWeeks,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import { SlidersHorizontal, Download, ChevronDown, ChevronUp } from "lucide-react";
import { CAMILLE_ID, MYRIAM_ID } from "@/lib/constants";
import { serializeCsv } from "@/lib/csv";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Op {
  date: string;
  type_operation: string | null;
  created_by: string | null;
  assistante_id: string | null;
  conseiller_code: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
}

interface Conseiller {
  code: string;
  full_name: string;
}

interface PeopleRow {
  key: string;
  label: string;
  predicate: (op: Op) => boolean;
  /** Couleur de badge : indice dans BADGE_COLORS */
  colorIdx: number;
}

export interface BilanHebdoTabsProps {
  operations: Op[];
  profiles: Profile[];
  conseillers: Conseiller[];
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const TYPE_OP_MAP: Record<string, string> = {
  SOUSCRIPTION: "Souscriptions",
  "VERSEMENT COMPLEMENTAIRE": "Versements compl.",
  "RACHAT PARTIEL": "Rachats",
  "RACHAT TOTAL": "Rachats",
  ARBITRAGE: "Arbitrages",
  "PASSAGE D'ORDRE": "Passages d'ordre",
};

const OP_LABELS_ORDER = [
  "Souscriptions",
  "Versements compl.",
  "Rachats",
  "Arbitrages",
  "Passages d'ordre",
  "Autres",
];

const MOIS_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const BADGE_COLORS = [
  "bg-pea-teal/15 text-pea-teal",
  "bg-pea-gold/20 text-[#7a5530]",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

// ── Semaines ISO 2026 ──────────────────────────────────────────────────────────

function generateISOWeeks2026(maxWeek = 52) {
  const weeks: { label: string; weekNumber: number; start: Date; end: Date }[] = [];
  const w1Start = startOfISOWeek(new Date(2026, 0, 4)); // Jan 4 toujours en S1
  for (let w = 1; w <= maxWeek; w++) {
    const start = addWeeks(w1Start, w - 1);
    const end = endOfISOWeek(start);
    const startFmt = format(start, "dd/MM/yyyy", { locale: fr });
    const endFmt = format(end, "dd/MM/yyyy", { locale: fr });
    weeks.push({
      label: `S${w} — ${startFmt}-${endFmt}`,
      weekNumber: w,
      start,
      end,
    });
  }
  return weeks;
}

const ISO_WEEKS = generateISOWeeks2026(52);

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapTypeOp(typeOp: string | null): string {
  const raw = (typeOp ?? "").toUpperCase().trim();
  return TYPE_OP_MAP[raw] ?? "Autres";
}

function getISOWeek2026(dateStr: string): number | null {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() < 2025 || d.getFullYear() > 2027) return null;
  return getISOWeek(d);
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function downloadCsv(csvStr: string, filename: string) {
  const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Badge coloré ───────────────────────────────────────────────────────────────

function ColorBadge({ n, colorIdx }: { n: number; colorIdx: number }) {
  const cls = BADGE_COLORS[colorIdx % BADGE_COLORS.length];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
      {n}
    </span>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────

export function BilanHebdoTabs({ operations, profiles, conseillers }: BilanHebdoTabsProps) {
  // ── État du filtre ──────────────────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(
    new Set([CAMILLE_ID, MYRIAM_ID])
  );
  const [selectedConseillers, setSelectedConseillers] = useState<Set<string>>(
    new Set()
  );

  // ── État semaine ────────────────────────────────────────────────────────────
  const [selectedWeek, setSelectedWeek] = useState<string>(
    ISO_WEEKS[0].weekNumber.toString()
  );
  const [activeTab, setActiveTab] = useState<string>("mensuel");

  // ── Lookup profiles ─────────────────────────────────────────────────────────
  const profileById = useMemo(() => {
    const m = new Map<string, Profile>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  function profileName(id: string): string {
    const p = profileById.get(id);
    return p?.full_name ?? p?.email ?? id;
  }

  // ── People rows ─────────────────────────────────────────────────────────────
  const peopleRows = useMemo((): PeopleRow[] => {
    const rows: PeopleRow[] = [];
    let colorIdx = 0;

    // Utilisateurs cochés
    for (const uid of selectedUsers) {
      rows.push({
        key: `user_${uid}`,
        label: profileName(uid),
        predicate: (op) => op.created_by === uid,
        colorIdx: colorIdx++,
      });
    }

    // Conseillers cochés → sous-ventilation par assistante
    for (const code of selectedConseillers) {
      // Assistantes distinctes dans les ops de ce conseiller
      const assistanteIds = Array.from(
        new Set(
          operations
            .filter((op) => op.conseiller_code === code && op.assistante_id != null)
            .map((op) => op.assistante_id as string)
        )
      ).sort();

      for (const assistanteId of assistanteIds) {
        rows.push({
          key: `conseiller_${code}_${assistanteId}`,
          label: `${code} · ${profileName(assistanteId)}`,
          predicate: (op) =>
            op.conseiller_code === code && op.assistante_id === assistanteId,
          colorIdx: colorIdx++,
        });
      }
    }

    return rows;
  }, [selectedUsers, selectedConseillers, operations, profileById]);

  // ── Ensemble des ops considérées ────────────────────────────────────────────
  const activeOps = useMemo(() => {
    if (peopleRows.length === 0) return operations;
    return operations.filter((op) => peopleRows.some((r) => r.predicate(op)));
  }, [operations, peopleRows]);

  // ── Compteur de sélection ───────────────────────────────────────────────────
  const selectionCount = selectedUsers.size + selectedConseillers.size;

  function clearAll() {
    setSelectedUsers(new Set());
    setSelectedConseillers(new Set());
  }

  function toggleUser(id: string) {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleConseiller(code: string) {
    setSelectedConseillers((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  // ── Vue mensuelle ───────────────────────────────────────────────────────────
  const monthlyMatrix = useMemo(() =>
    OP_LABELS_ORDER.map((label) => {
      // Compte par mois+peopleRow
      const counts: Record<string, number> = {}; // key = `${m}_${rowKey}`
      for (const op of activeOps) {
        const mapped = mapTypeOp(op.type_operation);
        if (mapped !== label) continue;
        const d = new Date(op.date);
        const m = d.getMonth() + 1;
        if (m < 1 || m > 12) continue;
        for (const row of peopleRows) {
          if (row.predicate(op)) {
            const k = `${m}_${row.key}`;
            counts[k] = (counts[k] ?? 0) + 1;
            break; // une op ne peut matcher qu'une seule people row
          }
        }
        // si aucune people row → toutes ops (mode rien coché)
        if (peopleRows.length === 0) {
          const k = `${m}__all`;
          counts[k] = (counts[k] ?? 0) + 1;
        }
      }
      // Total par mois (toutes people rows)
      const monthTotals: Record<number, number> = {};
      for (let m = 1; m <= 12; m++) {
        if (peopleRows.length === 0) {
          monthTotals[m] = counts[`${m}__all`] ?? 0;
        } else {
          monthTotals[m] = peopleRows.reduce(
            (acc, r) => acc + (counts[`${m}_${r.key}`] ?? 0),
            0
          );
        }
      }
      const rowTotal = Object.values(monthTotals).reduce((a, b) => a + b, 0);
      return { label, counts, monthTotals, rowTotal };
    }),
  [activeOps, peopleRows]);

  // Totaux de colonne (TOTAL par mois)
  const colTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      totals[m] = monthlyMatrix.reduce((acc, r) => acc + (r.monthTotals[m] ?? 0), 0);
    }
    return totals;
  }, [monthlyMatrix]);

  const grandTotal = Object.values(colTotals).reduce((a, b) => a + b, 0);

  // Totaux TOTAL par people row par mois
  const colPeopleRowTotals = useMemo(() => {
    if (peopleRows.length === 0) return {};
    const map: Record<string, Record<number, number>> = {};
    for (const row of peopleRows) {
      map[row.key] = {};
      for (let m = 1; m <= 12; m++) {
        map[row.key][m] = monthlyMatrix.reduce(
          (acc, r) => acc + (r.counts[`${m}_${row.key}`] ?? 0),
          0
        );
      }
    }
    return map;
  }, [monthlyMatrix, peopleRows]);

  // ── Vue hebdomadaire ────────────────────────────────────────────────────────
  const weekNum = parseInt(selectedWeek, 10);

  const weeklyMatrix = useMemo(() =>
    OP_LABELS_ORDER.map((label) => {
      const counts: Record<string, number> = {}; // key = rowKey (or '__all')
      let total = 0;
      for (const op of activeOps) {
        const mapped = mapTypeOp(op.type_operation);
        if (mapped !== label) continue;
        const isoWeek = getISOWeek2026(op.date);
        if (isoWeek !== weekNum) continue;
        if (peopleRows.length === 0) {
          counts["__all"] = (counts["__all"] ?? 0) + 1;
          total++;
        } else {
          for (const row of peopleRows) {
            if (row.predicate(op)) {
              counts[row.key] = (counts[row.key] ?? 0) + 1;
              total++;
              break;
            }
          }
        }
      }
      return { label, counts, total };
    }),
  [activeOps, peopleRows, weekNum]);

  const weekColTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of peopleRows) {
      totals[row.key] = weeklyMatrix.reduce((acc, r) => acc + (r.counts[row.key] ?? 0), 0);
    }
    if (peopleRows.length === 0) {
      totals["__all"] = weeklyMatrix.reduce((acc, r) => acc + (r.counts["__all"] ?? 0), 0);
    }
    return totals;
  }, [weeklyMatrix, peopleRows]);

  const weekGrandTotal = weeklyMatrix.reduce((acc, r) => acc + r.total, 0);

  // ── Export CSV ──────────────────────────────────────────────────────────────
  function exportMensuelCsv() {
    const today = todayStr();
    const headers = ["Opération", ...MOIS_LABELS, "Total"];
    const rows: string[][] = [];

    for (const row of monthlyMatrix) {
      // Ligne principale
      rows.push([
        row.label,
        ...Array.from({ length: 12 }, (_, i) => String(row.monthTotals[i + 1] ?? 0)),
        String(row.rowTotal),
      ]);
      // Sous-lignes people rows
      for (const pr of peopleRows) {
        rows.push([
          `└ ${pr.label}`,
          ...Array.from({ length: 12 }, (_, i) =>
            String(row.counts[`${i + 1}_${pr.key}`] ?? 0)
          ),
          String(
            Array.from({ length: 12 }, (_, i) => row.counts[`${i + 1}_${pr.key}`] ?? 0).reduce(
              (a, b) => a + b, 0
            )
          ),
        ]);
      }
    }

    // Ligne TOTAL
    rows.push([
      "TOTAL",
      ...Array.from({ length: 12 }, (_, i) => String(colTotals[i + 1] ?? 0)),
      String(grandTotal),
    ]);
    for (const pr of peopleRows) {
      rows.push([
        `└ ${pr.label}`,
        ...Array.from({ length: 12 }, (_, i) =>
          String(colPeopleRowTotals[pr.key]?.[i + 1] ?? 0)
        ),
        String(
          Object.values(colPeopleRowTotals[pr.key] ?? {}).reduce((a: number, b: number) => a + b, 0)
        ),
      ]);
    }

    const csv = serializeCsv(headers, rows);
    downloadCsv(csv, `bilan_mensuel_${today}.csv`);
  }

  function exportHedboCsv() {
    const today = todayStr();
    const headers = [
      "Opération",
      ...(peopleRows.length === 0 ? ["Tous"] : peopleRows.map((r) => r.label)),
      "Total",
    ];
    const rows: string[][] = [];

    for (const row of weeklyMatrix) {
      rows.push([
        row.label,
        ...(peopleRows.length === 0
          ? [String(row.counts["__all"] ?? 0)]
          : peopleRows.map((pr) => String(row.counts[pr.key] ?? 0))),
        String(row.total),
      ]);
    }
    // TOTAL
    rows.push([
      "TOTAL",
      ...(peopleRows.length === 0
        ? [String(weekColTotals["__all"] ?? 0)]
        : peopleRows.map((pr) => String(weekColTotals[pr.key] ?? 0))),
      String(weekGrandTotal),
    ]);

    const csv = serializeCsv(headers, rows);
    downloadCsv(csv, `bilan_hebdo_S${weekNum}_${today}.csv`);
  }

  // ── Classes partagées ───────────────────────────────────────────────────────
  const btnOutline =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-8 px-3 py-1.5 border border-pea-gray/40 bg-pea-cream text-pea-blue hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:size-4 [&_svg]:shrink-0";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Barre d'outils : filtrer + export */}
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={btnOutline}
          >
            <SlidersHorizontal />
            Filtrer
            {selectionCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-pea-teal text-white text-[10px] font-bold w-4 h-4">
                {selectionCount}
              </span>
            )}
            {filterOpen ? <ChevronUp className="ml-1" /> : <ChevronDown className="ml-1" />}
          </button>
          {selectionCount === 0 && (
            <span className="text-xs text-pea-gray italic">Toutes les ops</span>
          )}
        </div>
        <button
          type="button"
          onClick={activeTab === "mensuel" ? exportMensuelCsv : exportHedboCsv}
          className={btnOutline}
        >
          <Download />
          Télécharger CSV
        </button>
      </div>

      {/* Volet de filtre repliable */}
      {filterOpen && (
        <div className="mx-4 mb-3 rounded-lg border border-pea-gray/30 bg-pea-cream p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-pea-blue uppercase tracking-wide">
              Filtres
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-pea-gray underline hover:text-pea-blue transition-colors"
            >
              Tout décocher
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Groupe Utilisateurs */}
            <div>
              <p className="text-xs font-medium text-pea-graphite mb-2 uppercase tracking-wide">
                Utilisateurs
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {profiles.map((p) => {
                  const label = p.full_name ?? p.email ?? p.id;
                  return (
                    <Checkbox
                      key={p.id}
                      id={`user_${p.id}`}
                      label={label}
                      checked={selectedUsers.has(p.id)}
                      onChange={() => toggleUser(p.id)}
                    />
                  );
                })}
              </div>
            </div>
            {/* Groupe Conseillers */}
            <div>
              <p className="text-xs font-medium text-pea-graphite mb-2 uppercase tracking-wide">
                Conseillers
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {conseillers.map((c) => (
                  <Checkbox
                    key={c.code}
                    id={`cons_${c.code}`}
                    label={`${c.full_name} (${c.code})`}
                    checked={selectedConseillers.has(c.code)}
                    onChange={() => toggleConseiller(c.code)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <Tabs
        defaultValue="mensuel"
        className="w-full"
        onValueChange={(v) => setActiveTab(v)}
      >
        <div className="px-4 pt-1 pb-0">
          <TabsList className="mb-3">
            <TabsTrigger value="mensuel">Vue mensuelle</TabsTrigger>
            <TabsTrigger value="hebdo">Vue hebdomadaire</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Onglet mensuel ── */}
        <TabsContent value="mensuel">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-pea-blue/5">
                  <th className="text-left px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap sticky left-0 bg-pea-blue/5 z-10">
                    Opération
                  </th>
                  {MOIS_LABELS.map((m) => (
                    <th
                      key={m}
                      className="text-center px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap"
                    >
                      {m}
                    </th>
                  ))}
                  <th className="text-center px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyMatrix.map((row, i) => (
                  <React.Fragment key={row.label}>
                    {/* Ligne principale */}
                    <tr className={i % 2 === 0 ? "bg-white" : "bg-pea-cream"}>
                      <td className={`px-4 py-1.5 whitespace-nowrap font-semibold text-pea-graphite sticky left-0 z-10 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}>
                        {row.label}
                      </td>
                      {Array.from({ length: 12 }, (_, idx) => {
                        const m = idx + 1;
                        return (
                          <td
                            key={m}
                            className="px-3 py-1.5 text-center whitespace-nowrap font-semibold text-pea-teal"
                          >
                            {row.monthTotals[m] ?? 0}
                          </td>
                        );
                      })}
                      <td className="px-4 py-1.5 text-center whitespace-nowrap font-bold text-pea-teal">
                        {row.rowTotal}
                      </td>
                    </tr>
                    {/* Sous-lignes people rows */}
                    {peopleRows.map((pr, prIdx) => (
                      <tr
                        key={pr.key}
                        className={`${prIdx === peopleRows.length - 1 ? "border-b" : ""} ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}
                      >
                        <td className={`px-4 py-1 pl-8 whitespace-nowrap text-xs text-pea-gray sticky left-0 z-10 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}>
                          └ {pr.label}
                        </td>
                        {Array.from({ length: 12 }, (_, idx) => {
                          const m = idx + 1;
                          return (
                            <td key={m} className="px-3 py-1 text-center whitespace-nowrap">
                              <ColorBadge
                                n={row.counts[`${m}_${pr.key}`] ?? 0}
                                colorIdx={pr.colorIdx}
                              />
                            </td>
                          );
                        })}
                        <td className="px-4 py-1 text-center whitespace-nowrap">
                          <ColorBadge
                            n={Array.from({ length: 12 }, (_, idx) =>
                              row.counts[`${idx + 1}_${pr.key}`] ?? 0
                            ).reduce((a, b) => a + b, 0)}
                            colorIdx={pr.colorIdx}
                          />
                        </td>
                      </tr>
                    ))}
                    {/* séparateur si pas de sous-lignes */}
                    {peopleRows.length === 0 && (
                      <tr className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}>
                        <td colSpan={14} className="p-0" />
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {/* Ligne TOTAL */}
                <tr className="border-t-2 font-bold bg-pea-blue/5">
                  <td className="px-4 py-2 whitespace-nowrap text-pea-blue uppercase text-xs tracking-wide sticky left-0 bg-pea-blue/5 z-10">
                    TOTAL
                  </td>
                  {Array.from({ length: 12 }, (_, idx) => (
                    <td
                      key={idx}
                      className="px-3 py-2 text-center whitespace-nowrap font-bold text-pea-graphite"
                    >
                      {colTotals[idx + 1] ?? 0}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-center whitespace-nowrap font-bold text-pea-graphite">
                    {grandTotal}
                  </td>
                </tr>
                {/* Sous-lignes TOTAL par people row */}
                {peopleRows.map((pr, prIdx) => (
                  <tr
                    key={pr.key}
                    className={`bg-pea-blue/5 ${prIdx === peopleRows.length - 1 ? "border-b" : ""}`}
                  >
                    <td className="px-4 py-1 pl-8 whitespace-nowrap text-xs text-pea-gray sticky left-0 bg-pea-blue/5 z-10">
                      └ {pr.label}
                    </td>
                    {Array.from({ length: 12 }, (_, idx) => (
                      <td key={idx} className="px-3 py-1 text-center whitespace-nowrap">
                        <ColorBadge
                          n={colPeopleRowTotals[pr.key]?.[idx + 1] ?? 0}
                          colorIdx={pr.colorIdx}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-1 text-center whitespace-nowrap">
                      <ColorBadge
                        n={Object.values(colPeopleRowTotals[pr.key] ?? {}).reduce(
                          (a: number, b: number) => a + b,
                          0
                        )}
                        colorIdx={pr.colorIdx}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </TabsContent>

        {/* ── Onglet hebdomadaire ── */}
        <TabsContent value="hebdo">
          <CardContent className="p-0">
            <div className="px-4 py-3">
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Choisir une semaine..." />
                </SelectTrigger>
                <SelectContent>
                  {ISO_WEEKS.map((w) => (
                    <SelectItem key={w.weekNumber} value={w.weekNumber.toString()}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-pea-blue/5">
                    <th className="text-left px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">
                      Opération
                    </th>
                    {peopleRows.length === 0 ? (
                      <th className="text-center px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">
                        Tous
                      </th>
                    ) : (
                      peopleRows.map((pr) => (
                        <th
                          key={pr.key}
                          className="text-center px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap"
                        >
                          {pr.label}
                        </th>
                      ))
                    )}
                    <th className="text-center px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyMatrix.map((row, i) => (
                    <tr
                      key={row.label}
                      className={`border-b last:border-0 hover:bg-pea-teal/5 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-pea-graphite">
                        {row.label}
                      </td>
                      {peopleRows.length === 0 ? (
                        <td className="px-4 py-2 text-center whitespace-nowrap font-semibold text-pea-teal">
                          {row.counts["__all"] ?? 0}
                        </td>
                      ) : (
                        peopleRows.map((pr) => (
                          <td key={pr.key} className="px-4 py-2 text-center whitespace-nowrap">
                            <ColorBadge n={row.counts[pr.key] ?? 0} colorIdx={pr.colorIdx} />
                          </td>
                        ))
                      )}
                      <td className="px-4 py-2 text-center whitespace-nowrap font-semibold text-pea-graphite">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                  {/* Ligne TOTAL */}
                  <tr className="border-t-2 font-bold bg-pea-blue/5">
                    <td className="px-4 py-2 whitespace-nowrap text-pea-blue uppercase text-xs tracking-wide">
                      TOTAL
                    </td>
                    {peopleRows.length === 0 ? (
                      <td className="px-4 py-2 text-center font-bold text-pea-graphite">
                        {weekColTotals["__all"] ?? 0}
                      </td>
                    ) : (
                      peopleRows.map((pr) => (
                        <td key={pr.key} className="px-4 py-2 text-center">
                          <ColorBadge n={weekColTotals[pr.key] ?? 0} colorIdx={pr.colorIdx} />
                        </td>
                      ))
                    )}
                    <td className="px-4 py-2 text-center font-bold text-pea-graphite">
                      {weekGrandTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </div>
  );
}
