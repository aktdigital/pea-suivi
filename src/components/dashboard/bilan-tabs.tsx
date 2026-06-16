"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getISOWeek, startOfISOWeek, endOfISOWeek, addWeeks, format } from "date-fns";
import { fr } from "date-fns/locale";
import { CAMILLE_ID, MYRIAM_ID } from "@/lib/constants";

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
];

const T1_MOIS = [1, 2, 3];
const MOIS_LABELS = ["Janvier", "Février", "Mars"];

interface Op {
  date: string;
  type_operation: string | null;
  assistante_id: string | null;
}

// Generate ISO weeks for 2026 (S1 to S15)
function generateISOWeeks2026(maxWeek = 15) {
  const weeks: { label: string; weekNumber: number; start: Date; end: Date }[] = [];
  // ISO week 1 of 2026: find the first ISO week that belongs to 2026
  // Start from 2025-12-29 (which is Monday of W1 2026)
  const w1Start = startOfISOWeek(new Date(2026, 0, 4)); // Jan 4 is always in W1
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

const ISO_WEEKS = generateISOWeeks2026(15);

export function BilanHebdoTabs({ operations }: { operations: Op[] }) {
  const [selectedWeek, setSelectedWeek] = useState<string>(
    ISO_WEEKS[0].weekNumber.toString()
  );

  // ── Vue mensuelle ──────────────────────────────────────────────────────────
  const monthlyMatrix = OP_LABELS_ORDER.map((label) => {
    const data: Record<string, number> = {};
    for (const op of operations) {
      const d = new Date(op.date);
      const m = d.getMonth() + 1;
      if (!T1_MOIS.includes(m)) continue;
      const rawLabel = (op.type_operation ?? "").toUpperCase().trim();
      const mappedLabel = TYPE_OP_MAP[rawLabel];
      if (mappedLabel !== label) continue;
      const isC = op.assistante_id === CAMILLE_ID;
      const key = `${m}_${isC ? "C" : "M"}`;
      data[key] = (data[key] ?? 0) + 1;
    }
    let totalC = 0;
    let totalM = 0;
    for (const m of T1_MOIS) {
      totalC += data[`${m}_C`] ?? 0;
      totalM += data[`${m}_M`] ?? 0;
    }
    return { label, data, totalC, totalM };
  });

  const monthGrandTotals = T1_MOIS.map((m) => ({
    m,
    c: monthlyMatrix.reduce((acc, r) => acc + (r.data[`${m}_C`] ?? 0), 0),
    mv: monthlyMatrix.reduce((acc, r) => acc + (r.data[`${m}_M`] ?? 0), 0),
  }));

  const grandTotalC = monthlyMatrix.reduce((acc, r) => acc + r.totalC, 0);
  const grandTotalM = monthlyMatrix.reduce((acc, r) => acc + r.totalM, 0);

  // ── Vue hebdomadaire ───────────────────────────────────────────────────────
  const weekNum = parseInt(selectedWeek, 10);
  const selectedWeekInfo = ISO_WEEKS.find((w) => w.weekNumber === weekNum);

  const weeklyMatrix = OP_LABELS_ORDER.map((label) => {
    let c = 0;
    let mv = 0;
    if (selectedWeekInfo) {
      for (const op of operations) {
        const d = new Date(op.date);
        const isoWeek = getISOWeek(d);
        const isoYear = d >= new Date(2026, 0, 1) && d <= new Date(2026, 11, 31) ? 2026 : d.getFullYear();
        if (isoYear !== 2026 || isoWeek !== weekNum) continue;
        const rawLabel = (op.type_operation ?? "").toUpperCase().trim();
        const mappedLabel = TYPE_OP_MAP[rawLabel];
        if (mappedLabel !== label) continue;
        if (op.assistante_id === CAMILLE_ID) c++;
        else if (op.assistante_id === MYRIAM_ID) mv++;
      }
    }
    return { label, c, mv, total: c + mv };
  });

  const weekGrandC = weeklyMatrix.reduce((acc, r) => acc + r.c, 0);
  const weekGrandM = weeklyMatrix.reduce((acc, r) => acc + r.mv, 0);
  const weekGrandTotal = weekGrandC + weekGrandM;

  const cellC = (n: number) => (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pea-teal/15 text-pea-teal">
      {n}
    </span>
  );
  const cellM = (n: number) => (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pea-gold/20 text-[#7a5530]">
      {n}
    </span>
  );

  return (
    <Tabs defaultValue="mensuel" className="w-full">
      <div className="px-4 pt-2 pb-0">
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
                <th className="text-left px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">
                  Opération
                </th>
                {T1_MOIS.map((m, i) => (
                  <th
                    key={m}
                    className="text-center px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap"
                  >
                    {MOIS_LABELS[i]}
                  </th>
                ))}
                <th className="text-center px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">
                  Total T1
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyMatrix.map((row, i) => {
                const totalRow = row.totalC + row.totalM;
                return (
                  <React.Fragment key={row.label}>
                    {/* Ligne principale */}
                    <tr
                      className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}
                    >
                      <td className="px-4 py-1.5 whitespace-nowrap font-semibold text-pea-graphite">
                        {row.label}
                      </td>
                      {T1_MOIS.map((m) => {
                        const c = row.data[`${m}_C`] ?? 0;
                        const mv = row.data[`${m}_M`] ?? 0;
                        return (
                          <td
                            key={m}
                            className="px-4 py-1.5 text-center whitespace-nowrap font-semibold text-pea-teal"
                          >
                            {c + mv}
                          </td>
                        );
                      })}
                      <td className="px-4 py-1.5 text-center whitespace-nowrap font-bold text-pea-teal">
                        {totalRow}
                      </td>
                    </tr>
                    {/* Sous-ligne Camille */}
                    <tr className={i % 2 === 0 ? "bg-white" : "bg-pea-cream"}>
                      <td className="px-4 py-1 pl-8 whitespace-nowrap text-xs text-pea-gray">
                        └ Camille
                      </td>
                      {T1_MOIS.map((m) => (
                        <td
                          key={m}
                          className="px-4 py-1 text-center whitespace-nowrap"
                        >
                          {cellC(row.data[`${m}_C`] ?? 0)}
                        </td>
                      ))}
                      <td className="px-4 py-1 text-center whitespace-nowrap">
                        {cellC(row.totalC)}
                      </td>
                    </tr>
                    {/* Sous-ligne Myriam */}
                    <tr
                      className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}
                    >
                      <td className="px-4 py-1 pl-8 whitespace-nowrap text-xs text-pea-gray">
                        └ Myriam
                      </td>
                      {T1_MOIS.map((m) => (
                        <td
                          key={m}
                          className="px-4 py-1 text-center whitespace-nowrap"
                        >
                          {cellM(row.data[`${m}_M`] ?? 0)}
                        </td>
                      ))}
                      <td className="px-4 py-1 text-center whitespace-nowrap">
                        {cellM(row.totalM)}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
              {/* Ligne TOTAL */}
              <tr className="border-t-2 font-bold bg-pea-blue/5">
                <td className="px-4 py-2 whitespace-nowrap text-pea-blue uppercase text-xs tracking-wide">
                  TOTAL
                </td>
                {monthGrandTotals.map(({ m, c, mv }) => (
                  <td
                    key={m}
                    className="px-4 py-2 text-center whitespace-nowrap font-bold text-pea-graphite"
                  >
                    {c + mv}
                  </td>
                ))}
                <td className="px-4 py-2 text-center whitespace-nowrap font-bold text-pea-graphite">
                  {grandTotalC + grandTotalM}
                </td>
              </tr>
              {/* Sous-ligne Camille total */}
              <tr className="bg-pea-blue/5">
                <td className="px-4 py-1 pl-8 whitespace-nowrap text-xs text-pea-gray">
                  └ Camille
                </td>
                {monthGrandTotals.map(({ m, c }) => (
                  <td key={m} className="px-4 py-1 text-center whitespace-nowrap">
                    {cellC(c)}
                  </td>
                ))}
                <td className="px-4 py-1 text-center whitespace-nowrap">
                  {cellC(grandTotalC)}
                </td>
              </tr>
              {/* Sous-ligne Myriam total */}
              <tr className="bg-pea-blue/5 border-b">
                <td className="px-4 py-1 pl-8 whitespace-nowrap text-xs text-pea-gray">
                  └ Myriam
                </td>
                {monthGrandTotals.map(({ m, mv }) => (
                  <td key={m} className="px-4 py-1 text-center whitespace-nowrap">
                    {cellM(mv)}
                  </td>
                ))}
                <td className="px-4 py-1 text-center whitespace-nowrap">
                  {cellM(grandTotalM)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </TabsContent>

      {/* ── Onglet hebdomadaire ── */}
      <TabsContent value="hebdo">
        <CardContent className="p-0">
          <div className="px-4 py-3">
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-72">
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
                  <th className="text-center px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">
                    Camille
                  </th>
                  <th className="text-center px-4 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">
                    Myriam
                  </th>
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
                    <td className="px-4 py-2 text-center whitespace-nowrap">
                      {cellC(row.c)}
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap">
                      {cellM(row.mv)}
                    </td>
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
                  <td className="px-4 py-2 text-center">{cellC(weekGrandC)}</td>
                  <td className="px-4 py-2 text-center">{cellM(weekGrandM)}</td>
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
  );
}
