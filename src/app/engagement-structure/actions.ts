"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FacturationData {
  statut_facturation: string | null;
  date_facturation: string | null;
}

export async function updateFacturation(
  isin: string,
  data: FacturationData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("produits_structures")
    .update({
      statut_facturation: data.statut_facturation || null,
      date_facturation: data.date_facturation || null,
    })
    .eq("isin", isin);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/engagement-structure");
  return {};
}
