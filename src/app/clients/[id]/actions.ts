"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateClientInfo(
  id: string,
  data: { email: string; telephone: string; notes: string }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      email: data.email || null,
      telephone: data.telephone || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  return { success: true };
}
