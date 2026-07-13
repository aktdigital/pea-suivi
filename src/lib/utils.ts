import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function isRachat(typeOperation: string | null | undefined): boolean {
  return /rachat/i.test(typeOperation ?? "");
}

export function isInvestmentType(t: string | null | undefined): boolean {
  return /souscription|versement|arbitrage|rachat|passage d'ordre|ordre de remplacement/i.test(t ?? "");
}

/**
 * Couleur de fond d'une ligne d'opération selon son statut.
 * Partagé entre /operations et /controles pour un code couleur cohérent.
 */
export function statutBgClass(statut: string | null | undefined): string {
  if (!statut) return "bg-white";
  const s = statut.toLowerCase();
  if (s.includes("à saisir") || s.includes("a saisir")) return "bg-white";
  if (s.includes("racheté") || s.includes("anticipation")) return "bg-pea-gray/15";
  if (s.includes("validé") && s.includes("avenant")) return "bg-green-100";
  if (s.includes("signé") && (s.includes("envoyé") || s.includes("transmis"))) return "bg-orange-100";
  if (s.includes("envoyé") || s.includes("envoyée")) return "bg-yellow-50";
  return "bg-white";
}
