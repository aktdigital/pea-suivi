"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateClientInfo(
  id: string,
  data: { nom: string; prenom: string; type_personne?: "physique" | "morale"; email: string; telephone: string; notes: string; conseiller_code: string; assistante_profile_id: string }
) {
  const supabase = await createClient();

  const nom = data.nom.trim();
  if (!nom) return { error: "Le nom est obligatoire." };

  const { error } = await supabase
    .from("clients")
    .update({
      nom,
      prenom: data.prenom.trim() || null,
      // Modifiable après création (physique ↔ morale) — demande du 29/06
      type_personne: data.type_personne === "physique" || data.type_personne === "morale" ? data.type_personne : undefined,
      email: data.email || null,
      telephone: data.telephone || null,
      notes: data.notes || null,
      conseiller_code: data.conseiller_code || null,
      assistante_profile_id: data.assistante_profile_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  return { success: true };
}

/**
 * Suppression d'un client EN CASCADE (choix métier validé) :
 * operations & bilans sont en FK RESTRICT → on les supprime d'abord ;
 * rdv & documents partent automatiquement (FK CASCADE).
 * En cas de succès, redirige vers la liste des clients.
 */
export async function deleteClient(id: string) {
  const supabase = await createClient();

  const { error: opsError } = await supabase.from("operations").delete().eq("client_id", id);
  if (opsError) return { error: opsError.message };

  const { error: bilansError } = await supabase.from("bilans").delete().eq("client_id", id);
  if (bilansError) return { error: bilansError.message };

  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/clients");
  redirect("/clients");
}
