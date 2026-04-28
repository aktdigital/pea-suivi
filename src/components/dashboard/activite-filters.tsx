"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

interface OpActivite {
  date: string | null;
  montant: number | null;
  collecte_type: string | null;
  conseiller_code: string | null;
  created_by: string | null;
  assistante_id: string | null;
}

interface ProfileActivite {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
}

interface ActiviteFiltersProps {
  operations: OpActivite[];
  profiles: ProfileActivite[];
}

export function ActiviteFilters({ operations, profiles }: ActiviteFiltersProps) {
  const [selectedMois, setSelectedMois] = useState<string>("tous");

  const moisLabel =
    selectedMois === "tous"
      ? "2026"
      : MOIS[parseInt(selectedMois, 10) - 1];

  // Filtrer les opérations par mois sélectionné
  const filteredOps = operations.filter((op) => {
    if (!op.date) return false;
    if (selectedMois === "tous") {
      // On garde toutes les ops 2026
      return op.date.startsWith("2026");
    }
    const m = parseInt(selectedMois, 10);
    const mStr = String(m).padStart(2, "0");
    return op.date.startsWith(`2026-${mStr}`);
  });

  // Activité par assistante
  const assistanteProfiles = profiles.filter((p) =>
    p.role?.startsWith("assistante")
  );

  const activiteAssistantes = assistanteProfiles.map((profile) => {
    const opsAssistante = filteredOps.filter(
      (op) => op.created_by === profile.id || op.assistante_id === profile.id
    );
    const volume = opsAssistante.reduce((acc, op) => acc + (op.montant ?? 0), 0);
    return {
      name: profile.full_name ?? profile.email ?? profile.id,
      nbOps: opsAssistante.length,
      volume,
    };
  });

  // Activité par conseiller
  const conseillerCodes = Array.from(
    new Set(filteredOps.map((op) => op.conseiller_code).filter(Boolean))
  ) as string[];

  const activiteConseillers = conseillerCodes.map((code) => {
    const opsConseiller = filteredOps.filter((op) => op.conseiller_code === code);
    const volNewCash = opsConseiller
      .filter((op) => op.collecte_type === "new_cash")
      .reduce((acc, op) => acc + (op.montant ?? 0), 0);
    const volEncours = opsConseiller
      .filter((op) => op.collecte_type === "encours")
      .reduce((acc, op) => acc + (op.montant ?? 0), 0);
    return {
      code,
      nbOps: opsConseiller.length,
      volNewCash,
      volEncours,
    };
  });

  const filterSelect = (
    <Select value={selectedMois} onValueChange={setSelectedMois}>
      <SelectTrigger className="w-44 h-7 text-xs">
        <SelectValue placeholder="Filtrer par mois" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tous">Tous les mois</SelectItem>
        {MOIS.map((m, i) => (
          <SelectItem key={i + 1} value={String(i + 1)}>
            {m}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Activité par assistante */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">
            Activité par assistante — {moisLabel}
          </CardTitle>
          {filterSelect}
        </CardHeader>
        <CardContent className="p-0">
          {activiteAssistantes.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-4">Aucune donnée.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                    Assistante
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                    Nb ops
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody>
                {activiteAssistantes.map((a) => (
                  <tr key={a.name} className="border-b last:border-0">
                    <td className="px-4 py-2">{a.name}</td>
                    <td className="px-4 py-2 text-right font-medium">{a.nbOps}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(a.volume)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Activité par conseiller */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">
            Activité par conseiller — {moisLabel}
          </CardTitle>
          {filterSelect}
        </CardHeader>
        <CardContent className="p-0">
          {activiteConseillers.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-4">
              Aucune opération pour cette période.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                    Conseiller
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                    Nb ops
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                    New Cash
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                    Encours
                  </th>
                </tr>
              </thead>
              <tbody>
                {activiteConseillers.map((c) => (
                  <tr key={c.code} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{c.code}</td>
                    <td className="px-4 py-2 text-right">{c.nbOps}</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(c.volNewCash)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(c.volEncours)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
