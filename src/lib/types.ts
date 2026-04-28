export type Role =
  | "admin"
  | "responsable"
  | "assistante_commerciale"
  | "assistante_admin"
  | "conseiller";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  conseiller_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conseiller {
  code: string;
  full_name: string;
  email: string | null;
  active: boolean;
}

export type TypePersonne = "physique" | "morale";

export interface Client {
  id: string;
  nom: string;
  prenom: string | null;
  type_personne: TypePersonne;
  conseiller_code: string | null;
  email: string | null;
  telephone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CollecteType = "new_cash" | "encours";
export type SupportType = "papier" | "ligne";

export interface Operation {
  id: string;
  date: string;
  client_id: string | null;
  type_operation: string | null;
  produit: string | null;
  compagnie: string | null;
  contrat: string | null;
  montant: number | null;
  collecte_type: CollecteType | null;
  conseiller_code: string | null;
  statut: string | null;
  support_type: SupportType | null;
  isin: string | null;
  validation: boolean;
  commentaire: string | null;
  assistante_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  courrier_pea: StatutControle | null;
  lettre_mission: StatutControle | null;
  conformite: StatutControle | null;
  controle_par_id: string | null;
  controle_at: string | null;
}

export type StatutControle = "a_faire" | "so" | "en_attente_avenants" | "en_cours_compagnie" | "valide" | "ok";

export const STATUTS_CONTROLE: { value: StatutControle; label: string }[] = [
  { value: "a_faire", label: "À faire" },
  { value: "so", label: "Sans objet" },
  { value: "en_attente_avenants", label: "En attente avenants" },
  { value: "en_cours_compagnie", label: "En cours compagnie" },
  { value: "valide", label: "Validé" },
  { value: "ok", label: "OK" },
];

export type StatutBilan = "a_faire" | "planifie" | "realise" | "valide" | "refuse";

export interface Bilan {
  id: string;
  client_id: string;
  annee: number;
  mois_planifie: number | null;
  date_realise: string | null;
  statut: StatutBilan;
  validation: boolean;
  commentaire: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefRow {
  id: number;
  label: string;
  ordre: number;
  active: boolean;
}
