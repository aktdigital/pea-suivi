"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type OperationUpdate = Database["public"]["Tables"]["operations"]["Update"];

export type OperationFormData = {
  date: string;
  client_id: string;
  type_operation: string;
  produit: string;
  compagnie: string;
  contrat: string;
  montant: string;
  collecte_type: "new_cash" | "encours";
  conseiller_code: string;
  statut: string;
  support_type: "papier" | "ligne";
  isin: string;
  validation: boolean;
  commentaire: string;
  courrier_pea?: string;
  lettre_mission?: string;
  conformite?: string;
};

export async function createOperation(formData: OperationFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("operations").insert({
    date: formData.date,
    client_id: formData.client_id || null,
    type_operation: formData.type_operation || null,
    produit: formData.produit || null,
    compagnie: formData.compagnie || null,
    contrat: formData.contrat || null,
    montant: formData.montant ? parseFloat(formData.montant) : null,
    collecte_type: formData.collecte_type || null,
    conseiller_code: formData.conseiller_code || null,
    statut: formData.statut || null,
    support_type: formData.support_type || null,
    isin: formData.isin || null,
    validation: formData.validation ?? false,
    commentaire: formData.commentaire || null,
    created_by: user?.id ?? null,
    assistante_id: user?.id ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/operations");
  revalidatePath("/");
  return { success: true };
}

export async function updateOperation(id: string, formData: OperationFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch existing operation to detect contrôle changes
  const { data: existing } = await supabase
    .from("operations")
    .select("courrier_pea, lettre_mission, conformite")
    .eq("id", id)
    .single();

  const controleChanged =
    formData.courrier_pea !== undefined && formData.courrier_pea !== existing?.courrier_pea ||
    formData.lettre_mission !== undefined && formData.lettre_mission !== existing?.lettre_mission ||
    formData.conformite !== undefined && formData.conformite !== existing?.conformite;

  const updateData: OperationUpdate = {
    date: formData.date,
    client_id: formData.client_id || null,
    type_operation: formData.type_operation || null,
    produit: formData.produit || null,
    compagnie: formData.compagnie || null,
    contrat: formData.contrat || null,
    montant: formData.montant ? parseFloat(formData.montant) : null,
    collecte_type: formData.collecte_type || null,
    conseiller_code: formData.conseiller_code || null,
    statut: formData.statut || null,
    support_type: formData.support_type || null,
    isin: formData.isin || null,
    validation: formData.validation ?? false,
    commentaire: formData.commentaire || null,
    updated_at: new Date().toISOString(),
    courrier_pea: formData.courrier_pea !== undefined ? (formData.courrier_pea || "a_faire") : undefined,
    lettre_mission: formData.lettre_mission !== undefined ? (formData.lettre_mission || "a_faire") : undefined,
    conformite: formData.conformite !== undefined ? (formData.conformite || "a_faire") : undefined,
    controle_par_id: controleChanged && user?.id ? user.id : undefined,
    controle_at: controleChanged && user?.id ? new Date().toISOString() : undefined,
  };

  const { error } = await supabase.from("operations").update(updateData).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/operations");
  revalidatePath("/");
  return { success: true };
}

export async function deleteOperation(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("operations").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/operations");
  revalidatePath("/");
  return { success: true };
}
