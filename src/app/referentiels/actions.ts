"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Whitelist de sécurité : seules ces tables sont autorisées
const ALLOWED_TABLES = [
  "ref_compagnies",
  "ref_produits",
  "ref_operations",
  "ref_statuts",
  "ref_supports",
  "ref_structureurs",
  "ref_frequences",
] as const;

// Tables qui ont une colonne `active`
const ACTIVABLE_TABLES = [
  "ref_compagnies",
  "ref_produits",
  "ref_operations",
  "ref_statuts",
  "ref_supports",
  "ref_structureurs",
] as const;

// Tables qui ont une colonne `code` éditable
const CODE_TABLES = ["ref_operations"] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];
type ActivableTable = (typeof ACTIVABLE_TABLES)[number];
type CodeTable = (typeof CODE_TABLES)[number];

function isAllowedTable(table: string): table is AllowedTable {
  return (ALLOWED_TABLES as readonly string[]).includes(table);
}

function isActivableTable(table: string): table is ActivableTable {
  return (ACTIVABLE_TABLES as readonly string[]).includes(table);
}

function isCodeTable(table: string): table is CodeTable {
  return (CODE_TABLES as readonly string[]).includes(table);
}

async function checkRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: "Non authentifié" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "responsable" && profile?.role !== "assistante_admin") {
    return { supabase: null, error: "Permission refusée : rôle insuffisant" as const };
  }

  return { supabase, error: null };
}

// Renomme le label d'une entrée
export async function renameRef(
  table: string,
  id: number,
  label: string
): Promise<{ error?: string }> {
  const { supabase, error: roleError } = await checkRole();
  if (roleError || !supabase) return { error: roleError ?? "Erreur" };

  if (!isAllowedTable(table)) return { error: "Table non autorisée" };

  const trimmed = label.trim();
  if (!trimmed) return { error: "Le libellé ne peut pas être vide" };

  const { error } = await supabase
    .from(table)
    .update({ label: trimmed })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/referentiels");
  return {};
}

// Active ou désactive une entrée (uniquement sur les tables activables)
export async function toggleRefActive(
  table: string,
  id: number,
  active: boolean
): Promise<{ error?: string }> {
  const { supabase, error: roleError } = await checkRole();
  if (roleError || !supabase) return { error: roleError ?? "Erreur" };

  if (!isAllowedTable(table)) return { error: "Table non autorisée" };
  if (!isActivableTable(table)) return { error: "Cette table ne supporte pas l'activation" };

  const { error } = await supabase
    .from(table)
    .update({ active })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/referentiels");
  return {};
}

// Renseigne / modifie le code (uniquement les tables qui ont une colonne `code`)
export async function updateRefCode(
  table: string,
  id: number,
  code: string
): Promise<{ error?: string }> {
  const { supabase, error: roleError } = await checkRole();
  if (roleError || !supabase) return { error: roleError ?? "Erreur" };

  if (!isAllowedTable(table)) return { error: "Table non autorisée" };
  if (!isCodeTable(table)) return { error: "Cette table n'a pas de code" };

  const trimmed = code.trim();
  const { error } = await supabase
    .from(table)
    .update({ code: trimmed || null })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/referentiels");
  return {};
}

// Ajoute une nouvelle entrée
export async function addRef(
  table: string,
  label: string
): Promise<{ error?: string }> {
  const { supabase, error: roleError } = await checkRole();
  if (roleError || !supabase) return { error: roleError ?? "Erreur" };

  if (!isAllowedTable(table)) return { error: "Table non autorisée" };

  const trimmed = label.trim();
  if (!trimmed) return { error: "Le libellé ne peut pas être vide" };

  // Calcul du prochain ordre
  const { data: maxRow } = await supabase
    .from(table)
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1)
    .single();

  const nextOrdre = ((maxRow as { ordre: number | null } | null)?.ordre ?? 0) + 10;

  // On doit faire deux branches bien typées pour satisfaire le typage Supabase
  let insertError: { message: string } | null = null;

  if (isActivableTable(table)) {
    const { error } = await supabase
      .from(table)
      .insert({ label: trimmed, ordre: nextOrdre, active: true });
    insertError = error;
  } else {
    // ref_frequences n'a pas de colonne active
    const { error } = await supabase
      .from("ref_frequences")
      .insert({ label: trimmed, ordre: nextOrdre });
    insertError = error;
  }

  const error = insertError;

  if (error) return { error: error.message };

  revalidatePath("/referentiels");
  return {};
}

// Réassigne l'ordre selon la liste d'ids fournie
export async function saveRefOrder(
  table: string,
  orderedIds: number[]
): Promise<{ error?: string }> {
  const { supabase, error: roleError } = await checkRole();
  if (roleError || !supabase) return { error: roleError ?? "Erreur" };

  if (!isAllowedTable(table)) return { error: "Table non autorisée" };
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return {};

  // Met à jour chaque ligne avec son nouvel ordre
  const updates = orderedIds.map((id, index) =>
    supabase
      .from(table)
      .update({ ordre: (index + 1) * 10 })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);
  if (firstError?.error) return { error: firstError.error.message };

  revalidatePath("/referentiels");
  return {};
}
