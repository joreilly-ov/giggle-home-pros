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
      bids: {
        Row: {
          amount_pence: number
          contractor_id: string
          created_at: string
          id: string
          job_id: string
          note: string | null
          status: string
        }
        Insert: {
          amount_pence: number
          contractor_id: string
          created_at?: string
          id?: string
          job_id: string
          note?: string | null
          status?: string
        }
        Update: {
          amount_pence?: number
          contractor_id?: string
          created_at?: string
          id?: string
          job_id?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_details: {
        Row: {
          ai_review_summary: Json | null
          cslb_licence_number: string | null
          id: string
          insurance_verified: boolean
          licence_status: string | null
          licence_verified_at: string | null
          profile_text: string | null
          stripe_account_id: string | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          ai_review_summary?: Json | null
          cslb_licence_number?: string | null
          id: string
          insurance_verified?: boolean
          licence_status?: string | null
          licence_verified_at?: string | null
          profile_text?: string | null
          stripe_account_id?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          ai_review_summary?: Json | null
          cslb_licence_number?: string | null
          id?: string
          insurance_verified?: boolean
          licence_status?: string | null
          licence_verified_at?: string | null
          profile_text?: string | null
          stripe_account_id?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_details_cslb_licence_number_fkey"
            columns: ["cslb_licence_number"]
            isOneToOne: false
            referencedRelation: "cslb_licences"
            referencedColumns: ["licence_number"]
          },
          {
            foreignKeyName: "contractor_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          business_name: string
          created_at: string
          expertise: string[]
          id: string
          insurance_details: string | null
          license_number: string | null
          phone: string
          postcode: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_name: string
          created_at?: string
          expertise?: string[]
          id?: string
          insurance_details?: string | null
          license_number?: string | null
          phone: string
          postcode: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string
          expertise?: string[]
          id?: string
          insurance_details?: string | null
          license_number?: string | null
          phone?: string
          postcode?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cslb_licences: {
        Row: {
          asbestos_reg: string | null
          business_name: string
          business_name_2: string | null
          business_phone: string | null
          business_type: string | null
          cb_amount: number | null
          cb_cancellation_date: string | null
          cb_effective_date: string | null
          cb_number: string | null
          cb_surety_company: string | null
          city: string | null
          classifications: string | null
          country: string | null
          county: string | null
          db_amount: number | null
          db_bond_reason: string | null
          db_cancellation_date: string | null
          db_case_no: string | null
          db_date_required: string | null
          db_discp_case_region: string | null
          db_effective_date: string | null
          db_number: string | null
          db_surety_company: string | null
          expiration_date: string | null
          full_business_name: string | null
          imported_at: string
          inactivation_date: string | null
          issue_date: string | null
          last_update: string | null
          licence_number: string
          mailing_address: string | null
          name_type: string | null
          pending_class_removal: string | null
          pending_suspension: string | null
          primary_status: string
          reactivation_date: string | null
          reissue_date: string | null
          secondary_status: string | null
          state: string | null
          wb_amount: number | null
          wb_cancellation_date: string | null
          wb_effective_date: string | null
          wb_number: string | null
          wb_surety_company: string | null
          wc_cancellation_date: string | null
          wc_coverage_type: string | null
          wc_effective_date: string | null
          wc_expiration_date: string | null
          wc_insurance_company: string | null
          wc_policy_number: string | null
          wc_suspend_date: string | null
          zip_code: string | null
        }
        Insert: {
          asbestos_reg?: string | null
          business_name: string
          business_name_2?: string | null
          business_phone?: string | null
          business_type?: string | null
          cb_amount?: number | null
          cb_cancellation_date?: string | null
          cb_effective_date?: string | null
          cb_number?: string | null
          cb_surety_company?: string | null
          city?: string | null
          classifications?: string | null
          country?: string | null
          county?: string | null
          db_amount?: number | null
          db_bond_reason?: string | null
          db_cancellation_date?: string | null
          db_case_no?: string | null
          db_date_required?: string | null
          db_discp_case_region?: string | null
          db_effective_date?: string | null
          db_number?: string | null
          db_surety_company?: string | null
          expiration_date?: string | null
          full_business_name?: string | null
          imported_at?: string
          inactivation_date?: string | null
          issue_date?: string | null
          last_update?: string | null
          licence_number: string
          mailing_address?: string | null
          name_type?: string | null
          pending_class_removal?: string | null
          pending_suspension?: string | null
          primary_status: string
          reactivation_date?: string | null
          reissue_date?: string | null
          secondary_status?: string | null
          state?: string | null
          wb_amount?: number | null
          wb_cancellation_date?: string | null
          wb_effective_date?: string | null
          wb_number?: string | null
          wb_surety_company?: string | null
          wc_cancellation_date?: string | null
          wc_coverage_type?: string | null
          wc_effective_date?: string | null
          wc_expiration_date?: string | null
          wc_insurance_company?: string | null
          wc_policy_number?: string | null
          wc_suspend_date?: string | null
          zip_code?: string | null
        }
        Update: {
          asbestos_reg?: string | null
          business_name?: string
          business_name_2?: string | null
          business_phone?: string | null
          business_type?: string | null
          cb_amount?: number | null
          cb_cancellation_date?: string | null
          cb_effective_date?: string | null
          cb_number?: string | null
          cb_surety_company?: string | null
          city?: string | null
          classifications?: string | null
          country?: string | null
          county?: string | null
          db_amount?: number | null
          db_bond_reason?: string | null
          db_cancellation_date?: string | null
          db_case_no?: string | null
          db_date_required?: string | null
          db_discp_case_region?: string | null
          db_effective_date?: string | null
          db_number?: string | null
          db_surety_company?: string | null
          expiration_date?: string | null
          full_business_name?: string | null
          imported_at?: string
          inactivation_date?: string | null
          issue_date?: string | null
          last_update?: string | null
          licence_number?: string
          mailing_address?: string | null
          name_type?: string | null
          pending_class_removal?: string | null
          pending_suspension?: string | null
          primary_status?: string
          reactivation_date?: string | null
          reissue_date?: string | null
          secondary_status?: string | null
          state?: string | null
          wb_amount?: number | null
          wb_cancellation_date?: string | null
          wb_effective_date?: string | null
          wb_number?: string | null
          wb_surety_company?: string | null
          wc_cancellation_date?: string | null
          wc_coverage_type?: string | null
          wc_effective_date?: string | null
          wc_expiration_date?: string | null
          wc_insurance_company?: string | null
          wc_policy_number?: string | null
          wc_suspend_date?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      cslb_personnel: {
        Row: {
          association_dates: string[] | null
          bond_amount: number | null
          bond_cancellation_date: string | null
          bond_effective_date: string | null
          bond_number: string | null
          class_code_statuses: string[] | null
          class_codes: string[] | null
          disassociation_dates: string[] | null
          imported_at: string
          last_updated: string | null
          licence_number: string
          name: string
          name_type: string | null
          record_type: string | null
          seq_no: string
          surety_company: string | null
          surety_type: string | null
          titles: string[] | null
        }
        Insert: {
          association_dates?: string[] | null
          bond_amount?: number | null
          bond_cancellation_date?: string | null
          bond_effective_date?: string | null
          bond_number?: string | null
          class_code_statuses?: string[] | null
          class_codes?: string[] | null
          disassociation_dates?: string[] | null
          imported_at?: string
          last_updated?: string | null
          licence_number: string
          name: string
          name_type?: string | null
          record_type?: string | null
          seq_no: string
          surety_company?: string | null
          surety_type?: string | null
          titles?: string[] | null
        }
        Update: {
          association_dates?: string[] | null
          bond_amount?: number | null
          bond_cancellation_date?: string | null
          bond_effective_date?: string | null
          bond_number?: string | null
          class_code_statuses?: string[] | null
          class_codes?: string[] | null
          disassociation_dates?: string[] | null
          imported_at?: string
          last_updated?: string | null
          licence_number?: string
          name?: string
          name_type?: string | null
          record_type?: string | null
          seq_no?: string
          surety_company?: string | null
          surety_type?: string | null
          titles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "cslb_personnel_licence_number_fkey"
            columns: ["licence_number"]
            isOneToOne: false
            referencedRelation: "cslb_licences"
            referencedColumns: ["licence_number"]
          },
        ]
      }
      job_milestones: {
        Row: {
          approved_at: string | null
          created_at: string
          description: string | null
          id: string
          job_id: string
          order_index: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_id: string
          order_index?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string
          order_index?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_milestones_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          contractor_id: string
          created_at: string
          id: string
          job_id: string
          question: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          contractor_id: string
          created_at?: string
          id?: string
          job_id: string
          question: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          contractor_id?: string
          created_at?: string
          id?: string
          job_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_questions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          activity: string
          created_at: string
          description: string
          escrow_status: string
          id: string
          postcode: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          activity: string
          created_at?: string
          description: string
          escrow_status?: string
          id?: string
          postcode: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          activity?: string
          created_at?: string
          description?: string
          escrow_status?: string
          id?: string
          postcode?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      milestone_photos: {
        Row: {
          created_at: string
          id: string
          image_source: string
          job_id: string
          milestone_id: string
          note: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_source: string
          job_id: string
          milestone_id: string
          note?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          image_source?: string
          job_id?: string
          milestone_id?: string
          note?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_photos_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "job_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          interests: string[]
          postcode: string | null
          road_address: string | null
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          interests?: string[]
          postcode?: string | null
          road_address?: string | null
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          interests?: string[]
          postcode?: string | null
          road_address?: string | null
          state?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          contractor_id: string
          created_at: string
          id: string
          job_id: string
          overall: number | null
          private_feedback: string | null
          rating_cleanliness: number
          rating_communication: number
          rating_quality: number
          reviewer_id: string | null
        }
        Insert: {
          comment?: string | null
          contractor_id: string
          created_at?: string
          id?: string
          job_id?: string
          overall?: number | null
          private_feedback?: string | null
          rating_cleanliness: number
          rating_communication: number
          rating_quality: number
          reviewer_id?: string | null
        }
        Update: {
          comment?: string | null
          contractor_id?: string
          created_at?: string
          id?: string
          job_id?: string
          overall?: number | null
          private_feedback?: string | null
          rating_cleanliness?: number
          rating_communication?: number
          rating_quality?: number
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          business_name: string
          created_at: string
          id: string
          trade_category: string
          verified_status: boolean
        }
        Insert: {
          business_name: string
          created_at?: string
          id?: string
          trade_category: string
          verified_status?: boolean
        }
        Update: {
          business_name?: string
          created_at?: string
          id?: string
          trade_category?: string
          verified_status?: boolean
        }
        Relationships: []
      }
      trades_users: {
        Row: {
          trade_id: string
          user_id: string
        }
        Insert: {
          trade_id: string
          user_id: string
        }
        Update: {
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_users_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades_videos: {
        Row: {
          assigned_at: string
          trade_id: string
          video_id: string
        }
        Insert: {
          assigned_at?: string
          trade_id: string
          video_id: string
        }
        Update: {
          assigned_at?: string
          trade_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_videos_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_log: {
        Row: {
          analysis_type: string
          completion_tokens: number
          created_at: string
          id: string
          model: string
          prompt_tokens: number
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          analysis_type: string
          completion_tokens?: number
          created_at?: string
          id?: string
          model: string
          prompt_tokens?: number
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          analysis_type?: string
          completion_tokens?: number
          created_at?: string
          id?: string
          model?: string
          prompt_tokens?: number
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_metadata: {
        Row: {
          bio: string | null
          id: string
          setup_complete: boolean
          trade_interests: string[]
          updated_at: string
          username: string | null
        }
        Insert: {
          bio?: string | null
          id: string
          setup_complete?: boolean
          trade_interests?: string[]
          updated_at?: string
          username?: string | null
        }
        Update: {
          bio?: string | null
          id?: string
          setup_complete?: boolean
          trade_interests?: string[]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          analysis_result: Json | null
          city: string | null
          created_at: string
          description: string | null
          filename: string
          id: string
          postcode: string | null
          state: string | null
          status: string
          trade_category: string | null
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          city?: string | null
          created_at?: string
          description?: string | null
          filename: string
          id?: string
          postcode?: string | null
          state?: string | null
          status?: string
          trade_category?: string | null
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          city?: string | null
          created_at?: string
          description?: string | null
          filename?: string
          id?: string
          postcode?: string | null
          state?: string | null
          status?: string
          trade_category?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      visible_reviews: {
        Row: {
          comment: string | null
          contractor_id: string | null
          created_at: string | null
          id: string | null
          job_id: string | null
          overall: number | null
          rating_cleanliness: number | null
          rating_communication: number | null
          rating_quality: number | null
          reviewer_id: string | null
        }
        Insert: {
          comment?: string | null
          contractor_id?: string | null
          created_at?: string | null
          id?: string | null
          job_id?: string | null
          overall?: number | null
          rating_cleanliness?: number | null
          rating_communication?: number | null
          rating_quality?: number | null
          reviewer_id?: string | null
        }
        Update: {
          comment?: string | null
          contractor_id?: string | null
          created_at?: string | null
          id?: string | null
          job_id?: string | null
          overall?: number | null
          rating_cleanliness?: number | null
          rating_communication?: number | null
          rating_quality?: number | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      lookup_cslb_licence: { Args: { p_licence_number: string }; Returns: Json }
      seed_insert_contractor:
        | {
            Args: {
              p_activities: string[]
              p_business_name: string
              p_id: string
              p_phone: string
              p_postcode: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_business_name: string
              p_expertise: string[]
              p_insurance_details?: string
              p_license_number?: string
              p_phone: string
              p_postcode: string
              p_user_id: string
            }
            Returns: string
          }
      seed_insert_review: {
        Args: {
          p_comment: string
          p_contractor_id: string
          p_job_id: string
          p_rating_cleanliness: number
          p_rating_communication: number
          p_rating_quality: number
          p_reviewer_id: string
        }
        Returns: undefined
      }
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
