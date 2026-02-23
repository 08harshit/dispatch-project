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
      accounting_history: {
        Row: {
          action_type: string
          created_at: string
          details: string | null
          id: string
          new_value: string | null
          performed_by: string
          previous_value: string | null
          record_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: string | null
          id?: string
          new_value?: string | null
          performed_by?: string
          previous_value?: string | null
          record_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: string | null
          id?: string
          new_value?: string | null
          performed_by?: string
          previous_value?: string | null
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_history_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "accounting_records"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_records: {
        Row: {
          cost: number
          created_at: string
          date: string
          has_docs: boolean
          id: string
          listing_id: string
          payment_method: string | null
          payout_status: string
          stock_number: string | null
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
          vin: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          date?: string
          has_docs?: boolean
          id?: string
          listing_id: string
          payment_method?: string | null
          payout_status?: string
          stock_number?: string | null
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          vin?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          has_docs?: boolean
          id?: string
          listing_id?: string
          payment_method?: string | null
          payout_status?: string
          stock_number?: string | null
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
          vin?: string | null
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          lead_id: string | null
          new_value: string | null
          notes: string | null
          performed_by: string | null
          previous_value: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          lead_id?: string | null
          new_value?: string | null
          notes?: string | null
          performed_by?: string | null
          previous_value?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          new_value?: string | null
          notes?: string | null
          performed_by?: string | null
          previous_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_reports: {
        Row: {
          announcements: Json
          brakes_tires: Json
          clean: boolean
          condition_notes: string | null
          created_at: string
          damage_areas: Json
          estimated_repair_cost: string | null
          exterior_checklist: Json
          exterior_damage_items: Json
          high_value_options: Json
          id: string
          interior_damage_items: Json
          invoice_available: boolean
          key_fobs: number
          keys_available: boolean
          lead_id: string | null
          mechanic_comments: string | null
          mechanical_issues: Json
          mileage: string | null
          no_structural_damage: boolean
          not_drivable: boolean
          other_odor: boolean
          pdf_report_url: string | null
          photos: Json
          prior_paint: boolean
          runs_and_drives: string
          smoke_odor: boolean
          starts: boolean
          structural_issues: Json
          tires_condition: string
          tires_wheels: Json
          under_hood: Json
          under_vehicle: Json
          updated_at: string
          vehicle_details: Json
          vehicle_history: Json
          vehicle_id: string
        }
        Insert: {
          announcements?: Json
          brakes_tires?: Json
          clean?: boolean
          condition_notes?: string | null
          created_at?: string
          damage_areas?: Json
          estimated_repair_cost?: string | null
          exterior_checklist?: Json
          exterior_damage_items?: Json
          high_value_options?: Json
          id?: string
          interior_damage_items?: Json
          invoice_available?: boolean
          key_fobs?: number
          keys_available?: boolean
          lead_id?: string | null
          mechanic_comments?: string | null
          mechanical_issues?: Json
          mileage?: string | null
          no_structural_damage?: boolean
          not_drivable?: boolean
          other_odor?: boolean
          pdf_report_url?: string | null
          photos?: Json
          prior_paint?: boolean
          runs_and_drives?: string
          smoke_odor?: boolean
          starts?: boolean
          structural_issues?: Json
          tires_condition?: string
          tires_wheels?: Json
          under_hood?: Json
          under_vehicle?: Json
          updated_at?: string
          vehicle_details?: Json
          vehicle_history?: Json
          vehicle_id: string
        }
        Update: {
          announcements?: Json
          brakes_tires?: Json
          clean?: boolean
          condition_notes?: string | null
          created_at?: string
          damage_areas?: Json
          estimated_repair_cost?: string | null
          exterior_checklist?: Json
          exterior_damage_items?: Json
          high_value_options?: Json
          id?: string
          interior_damage_items?: Json
          invoice_available?: boolean
          key_fobs?: number
          keys_available?: boolean
          lead_id?: string | null
          mechanic_comments?: string | null
          mechanical_issues?: Json
          mileage?: string | null
          no_structural_damage?: boolean
          not_drivable?: boolean
          other_odor?: boolean
          pdf_report_url?: string | null
          photos?: Json
          prior_paint?: boolean
          runs_and_drives?: string
          smoke_odor?: boolean
          starts?: boolean
          structural_issues?: Json
          tires_condition?: string
          tires_wheels?: Json
          under_hood?: Json
          under_vehicle?: Json
          updated_at?: string
          vehicle_details?: Json
          vehicle_history?: Json
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condition_reports_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      couriers: {
        Row: {
          available_capacity: number | null
          created_at: string | null
          dot_number: string | null
          email: string
          id: string
          is_available: boolean | null
          latitude: number | null
          legal_name: string | null
          longitude: number | null
          mc_number: string | null
          name: string
          operating_status: string | null
          phone: string | null
          updated_at: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          available_capacity?: number | null
          created_at?: string | null
          dot_number?: string | null
          email: string
          id?: string
          is_available?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          longitude?: number | null
          mc_number?: string | null
          name: string
          operating_status?: string | null
          phone?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          available_capacity?: number | null
          created_at?: string | null
          dot_number?: string | null
          email?: string
          id?: string
          is_available?: boolean | null
          latitude?: number | null
          legal_name?: string | null
          longitude?: number | null
          mc_number?: string | null
          name?: string
          operating_status?: string | null
          phone?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      driver_notifications: {
        Row: {
          courier_id: string
          created_at: string
          distance_meters: number | null
          expires_at: string
          id: string
          lead_id: string
          matching_request_id: string
          offer_amount: number
          responded_at: string | null
          status: string
        }
        Insert: {
          courier_id: string
          created_at?: string
          distance_meters?: number | null
          expires_at: string
          id?: string
          lead_id: string
          matching_request_id: string
          offer_amount: number
          responded_at?: string | null
          status?: string
        }
        Update: {
          courier_id?: string
          created_at?: string
          distance_meters?: number | null
          expires_at?: string
          id?: string
          lead_id?: string
          matching_request_id?: string
          offer_amount?: number
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_notifications_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_notifications_matching_request_id_fkey"
            columns: ["matching_request_id"]
            isOneToOne: false
            referencedRelation: "matching_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          delivery_address: string
          delivery_contact_email: string | null
          delivery_contact_name: string | null
          delivery_contact_phone: string | null
          delivery_location_type: string | null
          id: string
          initial_price: number | null
          is_locked: boolean | null
          listing_id: string
          locked_by_courier_id: string | null
          notes: string | null
          payment_type: string | null
          pickup_address: string
          pickup_contact_email: string | null
          pickup_contact_name: string | null
          pickup_contact_phone: string | null
          pickup_location_type: string | null
          status: string | null
          updated_at: string | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_rolls: boolean | null
          vehicle_runs: boolean | null
          vehicle_type: string | null
          vehicle_vin: string | null
          vehicle_year: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_address: string
          delivery_contact_email?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_location_type?: string | null
          id?: string
          initial_price?: number | null
          is_locked?: boolean | null
          listing_id: string
          locked_by_courier_id?: string | null
          notes?: string | null
          payment_type?: string | null
          pickup_address: string
          pickup_contact_email?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_location_type?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_rolls?: boolean | null
          vehicle_runs?: boolean | null
          vehicle_type?: string | null
          vehicle_vin?: string | null
          vehicle_year?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_address?: string
          delivery_contact_email?: string | null
          delivery_contact_name?: string | null
          delivery_contact_phone?: string | null
          delivery_location_type?: string | null
          id?: string
          initial_price?: number | null
          is_locked?: boolean | null
          listing_id?: string
          locked_by_courier_id?: string | null
          notes?: string | null
          payment_type?: string | null
          pickup_address?: string
          pickup_contact_email?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_location_type?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_rolls?: boolean | null
          vehicle_runs?: boolean | null
          vehicle_type?: string | null
          vehicle_vin?: string | null
          vehicle_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_locked_by_courier_id_fkey"
            columns: ["locked_by_courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_requests: {
        Row: {
          courier_notified_at: string | null
          couriers_tried: string[] | null
          created_at: string
          current_courier_id: string | null
          id: string
          initial_offer: number
          lead_id: string
          pickup_latitude: number | null
          pickup_longitude: number | null
          response_deadline: string | null
          search_radius_meters: number
          status: string
          updated_at: string
        }
        Insert: {
          courier_notified_at?: string | null
          couriers_tried?: string[] | null
          created_at?: string
          current_courier_id?: string | null
          id?: string
          initial_offer: number
          lead_id: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          response_deadline?: string | null
          search_radius_meters?: number
          status?: string
          updated_at?: string
        }
        Update: {
          courier_notified_at?: string | null
          couriers_tried?: string[] | null
          created_at?: string
          current_courier_id?: string | null
          id?: string
          initial_offer?: number
          lead_id?: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          response_deadline?: string | null
          search_radius_meters?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_requests_current_courier_id_fkey"
            columns: ["current_courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiations: {
        Row: {
          accepted_at: string | null
          counter_count: number | null
          courier_id: string
          courier_response_deadline: string | null
          created_at: string | null
          current_offer: number | null
          id: string
          lead_id: string
          negotiation_expires_at: string | null
          negotiation_started_at: string | null
          shipper_response_deadline: string | null
          status: Database["public"]["Enums"]["negotiation_status"] | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          counter_count?: number | null
          courier_id: string
          courier_response_deadline?: string | null
          created_at?: string | null
          current_offer?: number | null
          id?: string
          lead_id: string
          negotiation_expires_at?: string | null
          negotiation_started_at?: string | null
          shipper_response_deadline?: string | null
          status?: Database["public"]["Enums"]["negotiation_status"] | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          counter_count?: number | null
          courier_id?: string
          courier_response_deadline?: string | null
          created_at?: string | null
          current_offer?: number | null
          id?: string
          lead_id?: string
          negotiation_expires_at?: string | null
          negotiation_started_at?: string | null
          shipper_response_deadline?: string | null
          status?: Database["public"]["Enums"]["negotiation_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          negotiation_id: string
          offered_by: string
          responded_at: string | null
          response: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          negotiation_id: string
          offered_by: string
          responded_at?: string | null
          response?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          negotiation_id?: string
          offered_by?: string
          responded_at?: string | null
          response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipment_documents: {
        Row: {
          courier_id: string | null
          created_at: string
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          lead_id: string
          mime_type: string | null
          notes: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          courier_id?: string | null
          created_at?: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          lead_id: string
          mime_type?: string | null
          notes?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Update: {
          courier_id?: string | null
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          lead_id?: string
          mime_type?: string | null
          notes?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_documents_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      negotiation_status:
        | "pending"
        | "negotiating"
        | "accepted"
        | "declined"
        | "expired"
        | "timeout"
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
      negotiation_status: [
        "pending",
        "negotiating",
        "accepted",
        "declined",
        "expired",
        "timeout",
      ],
    },
  },
} as const
