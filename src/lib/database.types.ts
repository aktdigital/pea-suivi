export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bilans: {
        Row: {
          annee: number
          client_id: string | null
          commentaire: string | null
          created_at: string | null
          date_realise: string | null
          id: string
          mois_planifie: number | null
          statut: string | null
          updated_at: string | null
          validation: boolean | null
        }
        Insert: {
          annee: number
          client_id?: string | null
          commentaire?: string | null
          created_at?: string | null
          date_realise?: string | null
          id?: string
          mois_planifie?: number | null
          statut?: string | null
          updated_at?: string | null
          validation?: boolean | null
        }
        Update: {
          annee?: number
          client_id?: string | null
          commentaire?: string | null
          created_at?: string | null
          date_realise?: string | null
          id?: string
          mois_planifie?: number | null
          statut?: string | null
          updated_at?: string | null
          validation?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bilans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          assistante_profile_id: string | null
          civilite: string | null
          conseiller_code: string | null
          created_at: string | null
          email: string | null
          id: string
          nom: string
          notes: string | null
          prenom: string | null
          telephone: string | null
          type_personne: string | null
          updated_at: string | null
        }
        Insert: {
          assistante_profile_id?: string | null
          civilite?: string | null
          conseiller_code?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nom: string
          notes?: string | null
          prenom?: string | null
          telephone?: string | null
          type_personne?: string | null
          updated_at?: string | null
        }
        Update: {
          assistante_profile_id?: string | null
          civilite?: string | null
          conseiller_code?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nom?: string
          notes?: string | null
          prenom?: string | null
          telephone?: string | null
          type_personne?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assistante_profile_id_fkey"
            columns: ["assistante_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_conseiller_code_fkey"
            columns: ["conseiller_code"]
            isOneToOne: false
            referencedRelation: "conseillers"
            referencedColumns: ["code"]
          },
        ]
      }
      conseillers: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          email: string | null
          full_name: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          email?: string | null
          full_name: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          ai_generated: boolean | null
          ai_model: string | null
          client_id: string | null
          contenu: string | null
          created_at: string | null
          created_by: string | null
          id: string
          rdv_id: string | null
          storage_path: string | null
          titre: string
          type: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          ai_model?: string | null
          client_id?: string | null
          contenu?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          rdv_id?: string | null
          storage_path?: string | null
          titre: string
          type: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          ai_model?: string | null
          client_id?: string | null
          contenu?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          rdv_id?: string | null
          storage_path?: string | null
          titre?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_rdv_id_fkey"
            columns: ["rdv_id"]
            isOneToOne: false
            referencedRelation: "rdv"
            referencedColumns: ["id"]
          },
        ]
      }
      operations: {
        Row: {
          assistante_id: string | null
          client_id: string | null
          collecte_type: string | null
          commentaire: string | null
          compagnie: string | null
          conformite: string | null
          conseiller_code: string | null
          contrat: string | null
          controle_at: string | null
          controle_par_id: string | null
          courrier_pea: string | null
          created_at: string | null
          created_by: string | null
          date: string
          date_debut: string | null
          date_facturation: string | null
          date_fin: string | null
          id: string
          isin: string | null
          lettre_mission: string | null
          montant: number | null
          produit: string | null
          statut: string | null
          support_type: string | null
          type_operation: string | null
          updated_at: string | null
          validation: boolean | null
        }
        Insert: {
          assistante_id?: string | null
          client_id?: string | null
          collecte_type?: string | null
          commentaire?: string | null
          compagnie?: string | null
          conformite?: string | null
          conseiller_code?: string | null
          contrat?: string | null
          controle_at?: string | null
          controle_par_id?: string | null
          courrier_pea?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          date_debut?: string | null
          date_facturation?: string | null
          date_fin?: string | null
          id?: string
          isin?: string | null
          lettre_mission?: string | null
          montant?: number | null
          produit?: string | null
          statut?: string | null
          support_type?: string | null
          type_operation?: string | null
          updated_at?: string | null
          validation?: boolean | null
        }
        Update: {
          assistante_id?: string | null
          client_id?: string | null
          collecte_type?: string | null
          commentaire?: string | null
          compagnie?: string | null
          conformite?: string | null
          conseiller_code?: string | null
          contrat?: string | null
          controle_at?: string | null
          controle_par_id?: string | null
          courrier_pea?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          date_debut?: string | null
          date_facturation?: string | null
          date_fin?: string | null
          id?: string
          isin?: string | null
          lettre_mission?: string | null
          montant?: number | null
          produit?: string | null
          statut?: string | null
          support_type?: string | null
          type_operation?: string | null
          updated_at?: string | null
          validation?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "operations_assistante_id_fkey"
            columns: ["assistante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_conseiller_code_fkey"
            columns: ["conseiller_code"]
            isOneToOne: false
            referencedRelation: "conseillers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "operations_controle_par_id_fkey"
            columns: ["controle_par_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      produits_structures: {
        Row: {
          active: boolean | null
          ca_up_front: number | null
          commentaire: string | null
          compagnies_cibles: string | null
          created_at: string | null
          date_constatation_initiale: string | null
          date_facturation: string | null
          date_fin_commercialisation: string | null
          degressivite: string | null
          duree: string | null
          eligible_contrats: string | null
          enveloppe_reservee: number | null
          frequence_rappel: string | null
          isin: string
          mecanisme: string | null
          mois_creation: string | null
          montant_fait: number | null
          nom_produit: string
          objectif_rendement: string | null
          protection_capital: string | null
          protection_gain: string | null
          restant_a_faire: number | null
          sous_jacent: string | null
          statut_facturation: string | null
          structureur: string | null
          total_encours: number | null
          total_new_cash: number | null
          updated_at: string | null
          upfront_brut: string | null
        }
        Insert: {
          active?: boolean | null
          ca_up_front?: number | null
          commentaire?: string | null
          compagnies_cibles?: string | null
          created_at?: string | null
          date_constatation_initiale?: string | null
          date_facturation?: string | null
          date_fin_commercialisation?: string | null
          degressivite?: string | null
          duree?: string | null
          eligible_contrats?: string | null
          enveloppe_reservee?: number | null
          frequence_rappel?: string | null
          isin: string
          mecanisme?: string | null
          mois_creation?: string | null
          montant_fait?: number | null
          nom_produit: string
          objectif_rendement?: string | null
          protection_capital?: string | null
          protection_gain?: string | null
          restant_a_faire?: number | null
          sous_jacent?: string | null
          statut_facturation?: string | null
          structureur?: string | null
          total_encours?: number | null
          total_new_cash?: number | null
          updated_at?: string | null
          upfront_brut?: string | null
        }
        Update: {
          active?: boolean | null
          ca_up_front?: number | null
          commentaire?: string | null
          compagnies_cibles?: string | null
          created_at?: string | null
          date_constatation_initiale?: string | null
          date_facturation?: string | null
          date_fin_commercialisation?: string | null
          degressivite?: string | null
          duree?: string | null
          eligible_contrats?: string | null
          enveloppe_reservee?: number | null
          frequence_rappel?: string | null
          isin?: string
          mecanisme?: string | null
          mois_creation?: string | null
          montant_fait?: number | null
          nom_produit?: string
          objectif_rendement?: string | null
          protection_capital?: string | null
          protection_gain?: string | null
          restant_a_faire?: number | null
          sous_jacent?: string | null
          statut_facturation?: string | null
          structureur?: string | null
          total_encours?: number | null
          total_new_cash?: number | null
          updated_at?: string | null
          upfront_brut?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          conseiller_code: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          conseiller_code?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          conseiller_code?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rdv: {
        Row: {
          client_id: string | null
          conseiller_code: string | null
          created_at: string | null
          date_rdv: string
          duree_min: number | null
          id: string
          noota_link: string | null
          notes: string | null
          type_rdv: string | null
        }
        Insert: {
          client_id?: string | null
          conseiller_code?: string | null
          created_at?: string | null
          date_rdv: string
          duree_min?: number | null
          id?: string
          noota_link?: string | null
          notes?: string | null
          type_rdv?: string | null
        }
        Update: {
          client_id?: string | null
          conseiller_code?: string | null
          created_at?: string | null
          date_rdv?: string
          duree_min?: number | null
          id?: string
          noota_link?: string | null
          notes?: string | null
          type_rdv?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rdv_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdv_conseiller_code_fkey"
            columns: ["conseiller_code"]
            isOneToOne: false
            referencedRelation: "conseillers"
            referencedColumns: ["code"]
          },
        ]
      }
      ref_compagnies: {
        Row: {
          active: boolean | null
          id: number
          label: string
          ordre: number | null
        }
        Insert: {
          active?: boolean | null
          id?: number
          label: string
          ordre?: number | null
        }
        Update: {
          active?: boolean | null
          id?: number
          label?: string
          ordre?: number | null
        }
        Relationships: []
      }
      ref_frequences: {
        Row: {
          id: number
          label: string
          ordre: number | null
        }
        Insert: {
          id?: number
          label: string
          ordre?: number | null
        }
        Update: {
          id?: number
          label?: string
          ordre?: number | null
        }
        Relationships: []
      }
      ref_operations: {
        Row: {
          active: boolean | null
          code: string | null
          id: number
          label: string
          ordre: number | null
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          id?: number
          label: string
          ordre?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string | null
          id?: number
          label?: string
          ordre?: number | null
        }
        Relationships: []
      }
      ref_passages: {
        Row: {
          id: number
          label: string
        }
        Insert: {
          id?: number
          label: string
        }
        Update: {
          id?: number
          label?: string
        }
        Relationships: []
      }
      ref_produits: {
        Row: {
          active: boolean | null
          id: number
          label: string
          ordre: number | null
        }
        Insert: {
          active?: boolean | null
          id?: number
          label: string
          ordre?: number | null
        }
        Update: {
          active?: boolean | null
          id?: number
          label?: string
          ordre?: number | null
        }
        Relationships: []
      }
      ref_statuts: {
        Row: {
          active: boolean | null
          id: number
          is_final: boolean | null
          label: string
          ordre: number | null
        }
        Insert: {
          active?: boolean | null
          id?: number
          is_final?: boolean | null
          label: string
          ordre?: number | null
        }
        Update: {
          active?: boolean | null
          id?: number
          is_final?: boolean | null
          label?: string
          ordre?: number | null
        }
        Relationships: []
      }
      ref_statuts_controle: {
        Row: {
          code: string
          color: string | null
          id: number
          label: string
          ordre: number | null
        }
        Insert: {
          code: string
          color?: string | null
          id?: number
          label: string
          ordre?: number | null
        }
        Update: {
          code?: string
          color?: string | null
          id?: number
          label?: string
          ordre?: number | null
        }
        Relationships: []
      }
      ref_structureurs: {
        Row: {
          active: boolean | null
          id: number
          label: string
          ordre: number | null
        }
        Insert: {
          active?: boolean | null
          id?: number
          label: string
          ordre?: number | null
        }
        Update: {
          active?: boolean | null
          id?: number
          label?: string
          ordre?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
