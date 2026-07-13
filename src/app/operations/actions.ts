"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isInvestmentType } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type OperationUpdate = Database["public"]["Tables"]["operations"]["Update"];

export type LigneFormData = { isin: string; montant: string };

export type OperationFormData = {
  date: string;
  client_id: string;
  type_operation: string;
  produit: string;
  compagnie: string;
  contrat: string;
  montant: string;
  /** "" = aucune collecte (acte administratif : changement RIB, clause bénéficiaire…) */
  collecte_type: "new_cash" | "encours" | "";
  conseiller_code: string;
  statut: string;
  support_type: string;
  isin: string;
  validation: boolean;
  devoir_conseil: boolean;
  commentaire: string;
  courrier_pea?: string;
  lettre_mission?: string;
  conformite?: string;
  date_facturation?: string;
  /** Assistante pour le compte de laquelle l'opération est saisie. */
  assistante_id?: string;
  /** Supports d'une opération d'investissement (multi-ISIN). */
  lignes?: LigneFormData[];
};

export async function createOperation(formData: OperationFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const lignes = (formData.lignes ?? []).filter((l) => l.isin || l.montant);

  // Calcul montant total et isin selon présence de lignes
  let montantTotal: number | null = formData.montant ? parseFloat(formData.montant) : null;
  let isinValue: string | null = formData.isin || null;

  if (lignes.length > 0) {
    montantTotal = lignes.reduce((acc, l) => acc + (l.montant ? parseFloat(l.montant) : 0), 0);
    isinValue = lignes.length === 1 ? (lignes[0].isin || null) : null;
  }

  const { data: op, error } = await supabase.from("operations").insert({
    date: formData.date,
    client_id: formData.client_id || null,
    type_operation: formData.type_operation || null,
    produit: formData.produit || null,
    compagnie: formData.compagnie || null,
    contrat: formData.contrat || null,
    montant: montantTotal,
    collecte_type: formData.collecte_type || null,
    conseiller_code: formData.conseiller_code || null,
    statut: formData.statut || null,
    support_type: formData.support_type || null,
    isin: isinValue,
    validation: formData.validation ?? false,
    devoir_conseil: formData.devoir_conseil ?? false,
    commentaire: formData.commentaire || null,
    date_facturation: formData.date_facturation || null,
    created_by: user?.id ?? null,
    // Attribution : l'assistante choisie dans le formulaire, sinon l'utilisateur connecté
    assistante_id: formData.assistante_id || user?.id || null,
  }).select("id").single();

  if (error) {
    return { error: error.message };
  }

  // Insertion des lignes si présentes
  if (lignes.length > 0 && op) {
    const ligneRows = lignes.map((l) => ({
      operation_id: op.id,
      isin: l.isin || null,
      montant: l.montant ? parseFloat(l.montant) : null,
    }));
    const { error: lignesError } = await supabase.from("operation_lignes").insert(ligneRows);
    if (lignesError) {
      return { error: lignesError.message };
    }
  }

  revalidatePath("/operations");
  revalidatePath("/controles");
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

  // Comparaison normalisée ("" et null = même absence de valeur)
  const controleChanged =
    (formData.courrier_pea !== undefined && (formData.courrier_pea || null) !== (existing?.courrier_pea || null)) ||
    (formData.lettre_mission !== undefined && (formData.lettre_mission || null) !== (existing?.lettre_mission || null)) ||
    (formData.conformite !== undefined && (formData.conformite || null) !== (existing?.conformite || null));

  const lignes = (formData.lignes ?? []).filter((l) => l.isin || l.montant);

  // GARDE-FOU : pour un type investissement, le champ « Montant » simple est masqué
  // dans le formulaire. Si aucun support n'est fourni (popup ouverte depuis une page
  // qui n'avait pas chargé les operation_lignes), on NE TOUCHE NI au montant, ni à
  // l'isin, ni aux operation_lignes existantes — sinon on écraserait les données.
  const investissementSansLignes = isInvestmentType(formData.type_operation) && lignes.length === 0;

  // Calcul montant total et isin
  let montantTotal: number | null = formData.montant ? parseFloat(formData.montant) : null;
  let isinValue: string | null = formData.isin || null;

  if (lignes.length > 0) {
    montantTotal = lignes.reduce((acc, l) => acc + (l.montant ? parseFloat(l.montant) : 0), 0);
    isinValue = lignes.length === 1 ? (lignes[0].isin || null) : null;
  }

  const updateData: OperationUpdate = {
    date: formData.date,
    client_id: formData.client_id || null,
    type_operation: formData.type_operation || null,
    produit: formData.produit || null,
    compagnie: formData.compagnie || null,
    contrat: formData.contrat || null,
    montant: investissementSansLignes ? undefined : montantTotal,
    collecte_type: formData.collecte_type || null,
    conseiller_code: formData.conseiller_code || null,
    statut: formData.statut || null,
    support_type: formData.support_type || null,
    isin: investissementSansLignes ? undefined : isinValue,
    validation: formData.validation ?? false,
    devoir_conseil: formData.devoir_conseil ?? false,
    commentaire: formData.commentaire || null,
    date_facturation: formData.date_facturation || null,
    assistante_id: formData.assistante_id !== undefined ? (formData.assistante_id || null) : undefined,
    updated_at: new Date().toISOString(),
    courrier_pea: formData.courrier_pea !== undefined ? (formData.courrier_pea || null) : undefined,
    lettre_mission: formData.lettre_mission !== undefined ? (formData.lettre_mission || null) : undefined,
    conformite: formData.conformite !== undefined ? (formData.conformite || null) : undefined,
    controle_par_id: controleChanged && user?.id ? user.id : undefined,
    controle_at: controleChanged && user?.id ? new Date().toISOString() : undefined,
  };

  const { error } = await supabase.from("operations").update(updateData).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  // Remplace les lignes existantes si des supports sont fournis
  if (lignes.length > 0) {
    // Supprime les lignes existantes
    await supabase.from("operation_lignes").delete().eq("operation_id", id);
    // Ré-insère
    const ligneRows = lignes.map((l) => ({
      operation_id: id,
      isin: l.isin || null,
      montant: l.montant ? parseFloat(l.montant) : null,
    }));
    const { error: lignesError } = await supabase.from("operation_lignes").insert(ligneRows);
    if (lignesError) {
      return { error: lignesError.message };
    }
  } else if (!investissementSansLignes && !isInvestmentType(formData.type_operation)) {
    // Type administratif : une opération de ce type ne porte pas de supports —
    // si elle en avait (changement de type), on les retire pour rester cohérent.
    await supabase.from("operation_lignes").delete().eq("operation_id", id);
  }

  revalidatePath("/operations");
  revalidatePath("/controles");
  revalidatePath("/clients", "layout");
  revalidatePath("/produits-structures", "layout");
  revalidatePath("/");
  return { success: true };
}

/**
 * Charge l'opération FRAÎCHE et complète pour la popup d'édition, avec ses
 * supports (operation_lignes), les valeurs de contrôle dynamiques et la liste
 * des assistantes. Garantit que l'édition part toujours des données à jour,
 * quelle que soit la page d'où la popup est ouverte (/operations, /controles,
 * fiche client, fiche produit).
 */
export async function getOperationForEdit(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: operation, error },
    { data: lignes },
    { data: statutsControle },
    { data: assistantes },
  ] = await Promise.all([
    supabase
      .from("operations")
      .select("*, clients(nom, prenom)")
      .eq("id", id)
      .single(),
    supabase
      .from("operation_lignes")
      .select("isin, montant")
      .eq("operation_id", id)
      .order("created_at"),
    supabase
      .from("ref_statuts_controle")
      .select("code, label, ordre, champ")
      .order("ordre"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["assistante_commerciale", "assistante_admin", "responsable"])
      .order("full_name"),
  ]);

  if (error || !operation) {
    return { error: error?.message ?? "Opération introuvable" };
  }

  return {
    operation,
    lignes: (lignes ?? []).map((l) => ({ isin: l.isin ?? "", montant: l.montant ?? "" })),
    statutsControle: statutsControle ?? [],
    assistantes: assistantes ?? [],
    currentUserId: user?.id ?? null,
  };
}

export async function deleteOperation(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("operations").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/operations");
  revalidatePath("/controles");
  revalidatePath("/clients", "layout");
  revalidatePath("/produits-structures", "layout");
  revalidatePath("/");
  return { success: true };
}

export async function addRefValue(kind: "compagnie" | "type", label: string): Promise<{ value?: string; error?: string }> {
  const supabase = await createClient();

  // Sécurité : vérifier que l'utilisateur est admin ou responsable
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "responsable" && profile?.role !== "assistante_admin") {
    return { error: "Permission refusée : rôle insuffisant" };
  }

  const trimmedLabel = label.trim();
  if (!trimmedLabel) return { error: "Le libellé ne peut pas être vide" };

  const table = kind === "compagnie" ? "ref_compagnies" : "ref_operations";

  // Calcul du prochain ordre
  const { data: maxRow } = await supabase
    .from(table)
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1)
    .single();

  const nextOrdre = ((maxRow as { ordre: number } | null)?.ordre ?? 0) + 10;

  const { error } = await supabase
    .from(table)
    .insert({ label: trimmedLabel, ordre: nextOrdre, active: true })
    .select()
    .single();

  // On ignore le conflit sur le label (ON CONFLICT DO NOTHING équivalent via upsert)
  if (error && !error.message.includes("duplicate")) {
    return { error: error.message };
  }

  revalidatePath("/operations");
  revalidatePath("/produits-structures");
  return { value: trimmedLabel };
}
