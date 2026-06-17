"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProduitStructureFormData {
  isin: string;
  nom_produit: string;
  sous_jacent?: string;
  mecanisme?: string;
  duree?: string;
  frequence_rappel?: string;
  protection_gain?: string;
  protection_capital?: string;
  degressivite?: string;
  objectif_rendement?: string;
  eligible_contrats?: string;
  upfront_brut?: string;
  date_fin_commercialisation?: string;
  enveloppe_reservee?: string;
  compagnies_cibles?: string;
  structureur?: string;
  mois_creation?: string;
  commentaire?: string;
  date_constatation_initiale?: string;
}

export async function createProduitStructure(formData: ProduitStructureFormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("produits_structures").insert({
    isin: formData.isin.trim(),
    nom_produit: formData.nom_produit.trim(),
    sous_jacent: formData.sous_jacent || null,
    mecanisme: formData.mecanisme || null,
    duree: formData.duree || null,
    frequence_rappel: formData.frequence_rappel || null,
    protection_gain: formData.protection_gain || null,
    protection_capital: formData.protection_capital || null,
    degressivite: formData.degressivite || null,
    objectif_rendement: formData.objectif_rendement || null,
    eligible_contrats: formData.eligible_contrats || null,
    upfront_brut: formData.upfront_brut || null,
    date_fin_commercialisation: formData.date_fin_commercialisation || null,
    enveloppe_reservee: formData.enveloppe_reservee ? parseFloat(formData.enveloppe_reservee) : null,
    compagnies_cibles: formData.compagnies_cibles || null,
    structureur: formData.structureur || null,
    mois_creation: formData.mois_creation || null,
    commentaire: formData.commentaire || null,
    date_constatation_initiale: formData.date_constatation_initiale || null,
    active: true,
    montant_fait: 0,
    restant_a_faire: formData.enveloppe_reservee ? parseFloat(formData.enveloppe_reservee) : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/produits-structures");
  return { isin: formData.isin.trim() };
}

export async function addRefFrequence(label: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ref_frequences")
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1)
    .single();

  const nextOrdre = (existing?.ordre ?? 0) + 1;

  const { error } = await supabase
    .from("ref_frequences")
    .insert({ label: label.trim(), ordre: nextOrdre });

  if (error) return { error: error.message };
  return { success: true };
}
