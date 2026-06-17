/**
 * Helper CSV — format Excel français (séparateur ";", BOM UTF-8, CRLF).
 */

/** Échappe une valeur pour CSV : entour de guillemets si nécessaire, double les " internes. */
function escapeCsvValue(value: string): string {
  if (/[;"'\n\r]/.test(value) || value.includes('"')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/** Formate une date en JJ/MM/AAAA. */
export function formatDateCsv(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Formate un montant numérique en français : décimale "," sans séparateur de milliers. */
export function formatMontantCsv(montant: number | null | undefined): string {
  if (montant === null || montant === undefined) return "";
  // Pas de séparateur de milliers, décimale ","
  return String(montant).replace(".", ",");
}

/** Formate un booléen en Oui/Non. */
export function formatBoolCsv(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value ? "Oui" : "Non";
}

/**
 * Sérialise des lignes en CSV Excel français.
 * Retourne une string avec BOM UTF-8 en tête.
 *
 * @param headers - Tableau des en-têtes
 * @param rows    - Tableau de lignes (chaque ligne = tableau de valeurs string)
 */
export function serializeCsv(headers: string[], rows: string[][]): string {
  const BOM = "﻿";
  const CRLF = "\r\n";
  const SEP = ";";

  const lines: string[] = [];
  lines.push(headers.map(escapeCsvValue).join(SEP));
  for (const row of rows) {
    lines.push(row.map(escapeCsvValue).join(SEP));
  }

  return BOM + lines.join(CRLF) + CRLF;
}
