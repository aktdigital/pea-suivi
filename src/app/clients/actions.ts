"use server";
import { createClient as supa } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createClient(formData: FormData) {
  const supabase = await supa();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      nom: String(formData.get("nom") || ""),
      prenom: String(formData.get("prenom") || "") || null,
      type_personne: String(formData.get("type_personne") || "physique"),
      conseiller_code: String(formData.get("conseiller_code") || "") || null,
      email: String(formData.get("email") || "") || null,
      telephone: String(formData.get("telephone") || "") || null,
      notes: String(formData.get("notes") || "") || null,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/clients");
  return { id: data?.id };
}
