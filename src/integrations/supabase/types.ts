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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bourse: {
        Row: {
          conditions: string | null
          cree_le: string | null
          date_limite: string | null
          description: string | null
          devise: string | null
          domaine_etude: string | null
          est_active: boolean | null
          est_validee: boolean | null
          id: string
          langue: string | null
          lien_candidature: string | null
          maj_le: string | null
          montant: number | null
          niveau_etude: Database["public"]["Enums"]["niveau_etude"] | null
          pays: string | null
          pays_cibles: string[] | null
          titre: string
          type_bourse: Database["public"]["Enums"]["type_bourse"] | null
        }
        Insert: {
          conditions?: string | null
          cree_le?: string | null
          date_limite?: string | null
          description?: string | null
          devise?: string | null
          domaine_etude?: string | null
          est_active?: boolean | null
          est_validee?: boolean | null
          id?: string
          langue?: string | null
          lien_candidature?: string | null
          maj_le?: string | null
          montant?: number | null
          niveau_etude?: Database["public"]["Enums"]["niveau_etude"] | null
          pays?: string | null
          pays_cibles?: string[] | null
          titre: string
          type_bourse?: Database["public"]["Enums"]["type_bourse"] | null
        }
        Update: {
          conditions?: string | null
          cree_le?: string | null
          date_limite?: string | null
          description?: string | null
          devise?: string | null
          domaine_etude?: string | null
          est_active?: boolean | null
          est_validee?: boolean | null
          id?: string
          langue?: string | null
          lien_candidature?: string | null
          maj_le?: string | null
          montant?: number | null
          niveau_etude?: Database["public"]["Enums"]["niveau_etude"] | null
          pays?: string | null
          pays_cibles?: string[] | null
          titre?: string
          type_bourse?: Database["public"]["Enums"]["type_bourse"] | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_resolved: boolean | null
          message: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_resolved?: boolean | null
          message: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_resolved?: boolean | null
          message?: string
          name?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1_id: string
          participant_2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id: string
          participant_2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id?: string
          participant_2_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_bot: boolean | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_bot?: boolean | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_bot?: boolean | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      partenaires: {
        Row: {
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          rating: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          rating?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          rating?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      produits_affiliation: {
        Row: {
          categorie: Database["public"]["Enums"]["product_category"] | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          lien_affiliation: string
          nom: string
          note: number | null
          populaire: boolean | null
          prix: number | null
          source: string | null
        }
        Insert: {
          categorie?: Database["public"]["Enums"]["product_category"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          lien_affiliation: string
          nom: string
          note?: number | null
          populaire?: boolean | null
          prix?: number | null
          source?: string | null
        }
        Update: {
          categorie?: Database["public"]["Enums"]["product_category"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          lien_affiliation?: string
          nom?: string
          note?: number | null
          populaire?: boolean | null
          prix?: number | null
          source?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          education_level: Database["public"]["Enums"]["education_level"] | null
          email: string
          field_of_study: string | null
          finance_type: string | null
          full_name: string | null
          gpa: number | null
          id: string
          origin_country: string | null
          preferred_language: string | null
          scholarship_type:
            | Database["public"]["Enums"]["scholarship_type"]
            | null
          target_country: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          email: string
          field_of_study?: string | null
          finance_type?: string | null
          full_name?: string | null
          gpa?: number | null
          id: string
          origin_country?: string | null
          preferred_language?: string | null
          scholarship_type?:
            | Database["public"]["Enums"]["scholarship_type"]
            | null
          target_country?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          email?: string
          field_of_study?: string | null
          finance_type?: string | null
          full_name?: string | null
          gpa?: number | null
          id?: string
          origin_country?: string | null
          preferred_language?: string | null
          scholarship_type?:
            | Database["public"]["Enums"]["scholarship_type"]
            | null
          target_country?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          bourse_id: string
          created_at: string | null
          id: string
          match_reasons: Json | null
          score: number
          user_id: string
        }
        Insert: {
          bourse_id: string
          created_at?: string | null
          id?: string
          match_reasons?: Json | null
          score: number
          user_id: string
        }
        Update: {
          bourse_id?: string
          created_at?: string | null
          id?: string
          match_reasons?: Json | null
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      temoignages: {
        Row: {
          avatar_url: string | null
          content: string
          country: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          name: string
          rating: number | null
          scholarship_name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          content: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          name: string
          rating?: number | null
          scholarship_name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          content?: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          name?: string
          rating?: number | null
          scholarship_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin" | "moderator"
      education_level:
        | "high_school"
        | "undergraduate"
        | "masters"
        | "phd"
        | "postdoc"
      niveau_etude: "LICENCE" | "MASTER" | "DOCTORAT" | "POSTDOC" | "AUTRE"
      notification_type:
        | "recommendation"
        | "deadline"
        | "partner_response"
        | "system"
      product_category:
        | "books"
        | "courses"
        | "software"
        | "supplies"
        | "services"
        | "other"
      scholarship_type:
        | "full"
        | "partial"
        | "travel"
        | "research"
        | "merit"
        | "need_based"
      type_bourse:
        | "GOUVERNEMENTALE"
        | "PRIVEE"
        | "UNIVERSITAIRE"
        | "FONDATION"
        | "AGREGATEUR"
        | "AUTRE"
        | "ORGANISATION"
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
    Enums: {
      app_role: ["user", "admin", "moderator"],
      education_level: [
        "high_school",
        "undergraduate",
        "masters",
        "phd",
        "postdoc",
      ],
      niveau_etude: ["LICENCE", "MASTER", "DOCTORAT", "POSTDOC", "AUTRE"],
      notification_type: [
        "recommendation",
        "deadline",
        "partner_response",
        "system",
      ],
      product_category: [
        "books",
        "courses",
        "software",
        "supplies",
        "services",
        "other",
      ],
      scholarship_type: [
        "full",
        "partial",
        "travel",
        "research",
        "merit",
        "need_based",
      ],
      type_bourse: [
        "GOUVERNEMENTALE",
        "PRIVEE",
        "UNIVERSITAIRE",
        "FONDATION",
        "AGREGATEUR",
        "AUTRE",
        "ORGANISATION",
      ],
    },
  },
} as const
