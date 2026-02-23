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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      courier_documents: {
        Row: {
          courier_id: string
          created_at: string
          date: string | null
          id: string
          name: string
          type: string | null
        }
        Insert: {
          courier_id: string
          created_at?: string
          date?: string | null
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          courier_id?: string
          created_at?: string
          date?: string | null
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_documents_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_history: {
        Row: {
          action: string
          courier_id: string
          created_at: string
          id: string
        }
        Insert: {
          action: string
          courier_id: string
          created_at?: string
          id?: string
        }
        Update: {
          action?: string
          courier_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courier_history_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
        ]
      }
      couriers: {
        Row: {
          address: string | null
          compliance: Database["public"]["Enums"]["courier_compliance"]
          contact_email: string | null
          created_at: string
          equipment_type: string | null
          id: string
          insurance_company: string | null
          is_new: boolean | null
          mc: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["courier_status"]
          trucks: number | null
          updated_at: string
          usdot: string | null
        }
        Insert: {
          address?: string | null
          compliance?: Database["public"]["Enums"]["courier_compliance"]
          contact_email?: string | null
          created_at?: string
          equipment_type?: string | null
          id?: string
          insurance_company?: string | null
          is_new?: boolean | null
          mc?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["courier_status"]
          trucks?: number | null
          updated_at?: string
          usdot?: string | null
        }
        Update: {
          address?: string | null
          compliance?: Database["public"]["Enums"]["courier_compliance"]
          contact_email?: string | null
          created_at?: string
          equipment_type?: string | null
          id?: string
          insurance_company?: string | null
          is_new?: boolean | null
          mc?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["courier_status"]
          trucks?: number | null
          updated_at?: string
          usdot?: string | null
        }
        Relationships: []
      }
      load_documents: {
        Row: {
          created_at: string
          id: string
          load_id: string
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          load_id: string
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          load_id?: string
          name?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "load_documents_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      load_history: {
        Row: {
          action: string
          created_at: string
          id: string
          load_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          load_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          load_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "load_history_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      loads: {
        Row: {
          courier_id: string | null
          created_at: string
          dropoff_date: string | null
          id: string
          pickup_date: string | null
          shipper_id: string | null
          status: Database["public"]["Enums"]["load_status"]
          stock_number: string | null
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
          vin: string | null
        }
        Insert: {
          courier_id?: string | null
          created_at?: string
          dropoff_date?: string | null
          id?: string
          pickup_date?: string | null
          shipper_id?: string | null
          status?: Database["public"]["Enums"]["load_status"]
          stock_number?: string | null
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          vin?: string | null
        }
        Update: {
          courier_id?: string | null
          created_at?: string
          dropoff_date?: string | null
          id?: string
          pickup_date?: string | null
          shipper_id?: string | null
          status?: Database["public"]["Enums"]["load_status"]
          stock_number?: string | null
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loads_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipper_documents: {
        Row: {
          created_at: string
          date: string | null
          id: string
          name: string
          shipper_id: string
          type: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          name: string
          shipper_id: string
          type?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          name?: string
          shipper_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipper_documents_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      shipper_history: {
        Row: {
          action: string
          created_at: string
          id: string
          shipper_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          shipper_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          shipper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipper_history_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      shippers: {
        Row: {
          address: string | null
          business_type: string | null
          city: string | null
          compliance: Database["public"]["Enums"]["shipper_compliance"]
          contact_email: string | null
          created_at: string
          ein: string | null
          hours_dropoff: string | null
          hours_pickup: string | null
          id: string
          is_new: boolean | null
          name: string
          phone: string | null
          principal_name: string | null
          state: string | null
          status: Database["public"]["Enums"]["shipper_status"]
          tax_exempt: boolean | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          compliance?: Database["public"]["Enums"]["shipper_compliance"]
          contact_email?: string | null
          created_at?: string
          ein?: string | null
          hours_dropoff?: string | null
          hours_pickup?: string | null
          id?: string
          is_new?: boolean | null
          name: string
          phone?: string | null
          principal_name?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["shipper_status"]
          tax_exempt?: boolean | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          compliance?: Database["public"]["Enums"]["shipper_compliance"]
          contact_email?: string | null
          created_at?: string
          ein?: string | null
          hours_dropoff?: string | null
          hours_pickup?: string | null
          id?: string
          is_new?: boolean | null
          name?: string
          phone?: string | null
          principal_name?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["shipper_status"]
          tax_exempt?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          author: string
          created_at: string
          id: string
          text: string
          ticket_id: string
        }
        Insert: {
          author: string
          created_at?: string
          id?: string
          text: string
          ticket_id: string
        }
        Update: {
          author?: string
          created_at?: string
          id?: string
          text?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          updated_at?: string
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
      courier_compliance: "compliant" | "non-compliant"
      courier_status: "active" | "inactive"
      load_status: "pending" | "in-transit" | "delivered" | "cancelled"
      shipper_compliance: "compliant" | "non-compliant"
      shipper_status: "active" | "inactive"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in-progress" | "resolved" | "closed"
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
      courier_compliance: ["compliant", "non-compliant"],
      courier_status: ["active", "inactive"],
      load_status: ["pending", "in-transit", "delivered", "cancelled"],
      shipper_compliance: ["compliant", "non-compliant"],
      shipper_status: ["active", "inactive"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in-progress", "resolved", "closed"],
    },
  },
} as const
