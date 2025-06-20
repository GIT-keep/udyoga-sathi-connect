export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      employer_profiles: {
        Row: {
          business_address: string
          business_name: string
          created_at: string | null
          id: string
          job_type_provided: string
        }
        Insert: {
          business_address: string
          business_name: string
          created_at?: string | null
          id: string
          job_type_provided: string
        }
        Update: {
          business_address?: string
          business_name?: string
          created_at?: string | null
          id?: string
          job_type_provided?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_requests: {
        Row: {
          created_at: string | null
          employer_id: string | null
          id: string
          job_id: string | null
          message: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employer_id?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employer_id?: string | null
          id?: string
          job_id?: string | null
          message?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_requests_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_skills: {
        Row: {
          id: string
          job_id: string | null
          skill_id: number | null
        }
        Insert: {
          id?: string
          job_id?: string | null
          skill_id?: number | null
        }
        Update: {
          id?: string
          job_id?: string | null
          skill_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          contact_email: string
          created_at: string | null
          description: string
          employer_id: string | null
          hours_of_work: string
          id: string
          matched_student_id: string | null
          pay_rate: number
          pay_type: Database["public"]["Enums"]["pay_type"]
          specific_instructions: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at: string | null
          whatsapp_number: string
        }
        Insert: {
          contact_email: string
          created_at?: string | null
          description: string
          employer_id?: string | null
          hours_of_work: string
          id?: string
          matched_student_id?: string | null
          pay_rate: number
          pay_type: Database["public"]["Enums"]["pay_type"]
          specific_instructions?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at?: string | null
          whatsapp_number: string
        }
        Update: {
          contact_email?: string
          created_at?: string | null
          description?: string
          employer_id?: string | null
          hours_of_work?: string
          id?: string
          matched_student_id?: string | null
          pay_rate?: number
          pay_type?: Database["public"]["Enums"]["pay_type"]
          specific_instructions?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string
          updated_at?: string | null
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_matched_student_id_fkey"
            columns: ["matched_student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          job_request_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          job_request_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          job_request_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_job_request_id_fkey"
            columns: ["job_request_id"]
            isOneToOne: false
            referencedRelation: "job_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aadhaar_card: string
          age: number
          created_at: string | null
          full_name: string
          id: string
          phone_number: string
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          aadhaar_card: string
          age: number
          created_at?: string | null
          full_name: string
          id: string
          phone_number: string
          updated_at?: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          aadhaar_card?: string
          age?: number
          created_at?: string | null
          full_name?: string
          id?: string
          phone_number?: string
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          address: string
          college_id: string
          created_at: string | null
          id: string
          job_availability_hours: string
          skills_evidence_url: string | null
        }
        Insert: {
          address: string
          college_id: string
          created_at?: string | null
          id: string
          job_availability_hours: string
          skills_evidence_url?: string | null
        }
        Update: {
          address?: string
          college_id?: string
          created_at?: string | null
          id?: string
          job_availability_hours?: string
          skills_evidence_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skills: {
        Row: {
          id: string
          skill_id: number | null
          student_id: string | null
        }
        Insert: {
          id?: string
          skill_id?: number | null
          student_id?: string | null
        }
        Update: {
          id?: string
          skill_id?: number | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_matching_students: {
        Args: { job_uuid: string }
        Returns: {
          student_id: string
          full_name: string
          phone_number: string
          matching_skills_count: number
        }[]
      }
    }
    Enums: {
      job_status: "active" | "matched" | "completed" | "cancelled"
      pay_type: "per_hour" | "per_day"
      request_status: "pending" | "accepted" | "rejected"
      user_type: "student" | "employer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      job_status: ["active", "matched", "completed", "cancelled"],
      pay_type: ["per_hour", "per_day"],
      request_status: ["pending", "accepted", "rejected"],
      user_type: ["student", "employer"],
    },
  },
} as const
