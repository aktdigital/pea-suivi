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
