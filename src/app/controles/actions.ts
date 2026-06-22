"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type OperationUpdate = Database["public"]["Tables"]["operations"]["Update"];
type ChampControle = "courrier_pea" | "lettre_mission" | "conformite";

export async function updateControle(opId: string, champ: ChampControle, valeur: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const updateData: OperationUpdate = {
    [champ]: valeur || null,
    controle_par_id: user.id,
    controle_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("operations")
    .update(updateData)
    .eq("id", opId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/controles");
  return { success: true };
}

// ── Gestion de la liste de valeurs de contrôle (ref_statuts_controle) ──
const ROLES_GESTION = ["admin", "responsable", "assistante_admin"];

async function checkGestionRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Non authentifié" as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !ROLES_GESTION.includes(profile.role)) return { supabase, error: "Non autorisé" as const };
  return { supabase, error: null };
}

function slugCode(label: string): string {
  return (
    label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "valeur"
  );
}

export async function addControleStatut(label: string) {
  const { supabase, error: roleErr } = await checkGestionRole();
  if (roleErr) return { error: roleErr };
  const clean = (label ?? "").trim();
  if (!clean) return { error: "Libellé vide" };

  const { data: existing } = await supabase.from("ref_statuts_controle").select("code, label, ordre");
  const codes = new Set((existing ?? []).map((s) => s.code));
  if ((existing ?? []).some((s) => s.label.toLowerCase() === clean.toLowerCase())) {
    return { error: "Cette valeur existe déjà" };
  }
  let code = slugCode(clean);
  let i = 2;
  while (codes.has(code)) { code = `${slugCode(clean)}_${i++}`; }
  const maxOrdre = Math.max(0, ...(existing ?? []).map((s) => s.ordre ?? 0));

  const { error } = await supabase
    .from("ref_statuts_controle")
    .insert({ code, label: clean, color: "gray", ordre: maxOrdre + 10 });
  if (error) return { error: error.message };

  revalidatePath("/controles");
  revalidatePath("/operations");
  return { success: true };
}

export async function updateControleStatut(code: string, label: string) {
  const { supabase, error: roleErr } = await checkGestionRole();
  if (roleErr) return { error: roleErr };
  const clean = (label ?? "").trim();
  if (!clean) return { error: "Libellé vide" };

  const { error } = await supabase
    .from("ref_statuts_controle")
    .update({ label: clean })
    .eq("code", code);
  if (error) return { error: error.message };

  revalidatePath("/controles");
  revalidatePath("/operations");
  return { success: true };
}
