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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          action: string
          created_at: string
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      accounting_transactions: {
        Row: {
          amount: number
          application_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          notes: string | null
          recorded_by: string | null
          reference_number: string | null
          transaction_date: string
          type: string
        }
        Insert: {
          amount?: number
          application_id?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          transaction_date?: string
          type: string
        }
        Update: {
          amount?: number
          application_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_transactions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          academic_results: Json | null
          admin_notes: string | null
          admission_letter_url: string | null
          affordable_fees_amount: number | null
          birth_certificate_url: string | null
          chronic_disease: boolean | null
          chronic_disease_details: string | null
          class_grade: string | null
          course_program: string | null
          created_at: string
          current_school: string | null
          date_of_birth: string | null
          deceased_parent: string | null
          declaration_consent: boolean | null
          declaration_date: string | null
          district: string | null
          education_level: string
          father_details: Json | null
          fees_per_term: number | null
          gender: string | null
          guardian_details: Json | null
          id: string
          lci_chairperson: string | null
          lci_contact: string | null
          mother_details: Json | null
          nationality: string | null
          nearby_relative: Json | null
          nearest_neighbor: Json | null
          next_of_kin: Json | null
          nin: string | null
          orphan_status: string | null
          parent_email: string | null
          parent_id_url: string | null
          parent_name: string
          parent_passport_photo_url: string | null
          parent_phone: string
          parent_signature_url: string | null
          parish: string | null
          passport_photo_url: string | null
          physical_defect: boolean | null
          physical_defect_details: string | null
          previous_fees_amount: number | null
          previous_schools: Json | null
          reason: string | null
          registration_number: string | null
          relationship: string | null
          religion: string | null
          report_card_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          right_thumb_url: string | null
          school_id: string | null
          status: string
          student_name: string
          student_signature_url: string | null
          sub_county: string | null
          subject_combination: string | null
          subject_grades: Json | null
          tribe: string | null
          updated_at: string
          user_id: string
          village: string | null
          vulnerability_indicators: string[] | null
          who_pays_fees: string | null
        }
        Insert: {
          academic_results?: Json | null
          admin_notes?: string | null
          admission_letter_url?: string | null
          affordable_fees_amount?: number | null
          birth_certificate_url?: string | null
          chronic_disease?: boolean | null
          chronic_disease_details?: string | null
          class_grade?: string | null
          course_program?: string | null
          created_at?: string
          current_school?: string | null
          date_of_birth?: string | null
          deceased_parent?: string | null
          declaration_consent?: boolean | null
          declaration_date?: string | null
          district?: string | null
          education_level?: string
          father_details?: Json | null
          fees_per_term?: number | null
          gender?: string | null
          guardian_details?: Json | null
          id?: string
          lci_chairperson?: string | null
          lci_contact?: string | null
          mother_details?: Json | null
          nationality?: string | null
          nearby_relative?: Json | null
          nearest_neighbor?: Json | null
          next_of_kin?: Json | null
          nin?: string | null
          orphan_status?: string | null
          parent_email?: string | null
          parent_id_url?: string | null
          parent_name?: string
          parent_passport_photo_url?: string | null
          parent_phone?: string
          parent_signature_url?: string | null
          parish?: string | null
          passport_photo_url?: string | null
          physical_defect?: boolean | null
          physical_defect_details?: string | null
          previous_fees_amount?: number | null
          previous_schools?: Json | null
          reason?: string | null
          registration_number?: string | null
          relationship?: string | null
          religion?: string | null
          report_card_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          right_thumb_url?: string | null
          school_id?: string | null
          status?: string
          student_name: string
          student_signature_url?: string | null
          sub_county?: string | null
          subject_combination?: string | null
          subject_grades?: Json | null
          tribe?: string | null
          updated_at?: string
          user_id: string
          village?: string | null
          vulnerability_indicators?: string[] | null
          who_pays_fees?: string | null
        }
        Update: {
          academic_results?: Json | null
          admin_notes?: string | null
          admission_letter_url?: string | null
          affordable_fees_amount?: number | null
          birth_certificate_url?: string | null
          chronic_disease?: boolean | null
          chronic_disease_details?: string | null
          class_grade?: string | null
          course_program?: string | null
          created_at?: string
          current_school?: string | null
          date_of_birth?: string | null
          deceased_parent?: string | null
          declaration_consent?: boolean | null
          declaration_date?: string | null
          district?: string | null
          education_level?: string
          father_details?: Json | null
          fees_per_term?: number | null
          gender?: string | null
          guardian_details?: Json | null
          id?: string
          lci_chairperson?: string | null
          lci_contact?: string | null
          mother_details?: Json | null
          nationality?: string | null
          nearby_relative?: Json | null
          nearest_neighbor?: Json | null
          next_of_kin?: Json | null
          nin?: string | null
          orphan_status?: string | null
          parent_email?: string | null
          parent_id_url?: string | null
          parent_name?: string
          parent_passport_photo_url?: string | null
          parent_phone?: string
          parent_signature_url?: string | null
          parish?: string | null
          passport_photo_url?: string | null
          physical_defect?: boolean | null
          physical_defect_details?: string | null
          previous_fees_amount?: number | null
          previous_schools?: Json | null
          reason?: string | null
          registration_number?: string | null
          relationship?: string | null
          religion?: string | null
          report_card_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          right_thumb_url?: string | null
          school_id?: string | null
          status?: string
          student_name?: string
          student_signature_url?: string | null
          sub_county?: string | null
          subject_combination?: string | null
          subject_grades?: Json | null
          tribe?: string | null
          updated_at?: string
          user_id?: string
          village?: string | null
          vulnerability_indicators?: string[] | null
          who_pays_fees?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          application_id: string | null
          appointment_date: string
          bursary_request_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          person_name: string
          phone: string
          purpose: string | null
          requirements: string[] | null
          seat_number: string | null
          status: string
        }
        Insert: {
          application_id?: string | null
          appointment_date: string
          bursary_request_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          person_name: string
          phone: string
          purpose?: string | null
          requirements?: string[] | null
          seat_number?: string | null
          status?: string
        }
        Update: {
          application_id?: string | null
          appointment_date?: string
          bursary_request_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          person_name?: string
          phone?: string
          purpose?: string | null
          requirements?: string[] | null
          seat_number?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointments_bursary_request"
            columns: ["bursary_request_id"]
            isOneToOne: false
            referencedRelation: "bursary_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          check_in_at: string
          check_in_coords: Json | null
          check_in_distance: number | null
          check_out_at: string | null
          check_out_coords: Json | null
          check_out_distance: number | null
          created_at: string
          date: string | null
          device_fingerprint: string | null
          hours_worked: number | null
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          check_in_at?: string
          check_in_coords?: Json | null
          check_in_distance?: number | null
          check_out_at?: string | null
          check_out_coords?: Json | null
          check_out_distance?: number | null
          created_at?: string
          date?: string | null
          device_fingerprint?: string | null
          hours_worked?: number | null
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          check_in_at?: string
          check_in_coords?: Json | null
          check_in_distance?: number | null
          check_out_at?: string | null
          check_out_coords?: Json | null
          check_out_distance?: number | null
          created_at?: string
          date?: string | null
          device_fingerprint?: string | null
          hours_worked?: number | null
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      budget_allocations: {
        Row: {
          allocated_amount: number
          category: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          spent_amount: number
          term: string | null
          year: string | null
        }
        Insert: {
          allocated_amount?: number
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          spent_amount?: number
          term?: string | null
          year?: string | null
        }
        Update: {
          allocated_amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          spent_amount?: number
          term?: string | null
          year?: string | null
        }
        Relationships: []
      }
      bursary_request_links: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          is_used: boolean
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_used?: boolean
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_used?: boolean
          token?: string
        }
        Relationships: []
      }
      bursary_requests: {
        Row: {
          admin_notes: string | null
          appointment_id: string | null
          children: Json | null
          created_at: string
          district: string | null
          education_level: string | null
          full_name: string
          id: string
          income_details: string | null
          link_id: string | null
          nin: string | null
          parish: string | null
          phone: string
          reason: string | null
          school_name: string | null
          status: string
          sub_county: string | null
          village: string | null
        }
        Insert: {
          admin_notes?: string | null
          appointment_id?: string | null
          children?: Json | null
          created_at?: string
          district?: string | null
          education_level?: string | null
          full_name: string
          id?: string
          income_details?: string | null
          link_id?: string | null
          nin?: string | null
          parish?: string | null
          phone: string
          reason?: string | null
          school_name?: string | null
          status?: string
          sub_county?: string | null
          village?: string | null
        }
        Update: {
          admin_notes?: string | null
          appointment_id?: string | null
          children?: Json | null
          created_at?: string
          district?: string | null
          education_level?: string | null
          full_name?: string
          id?: string
          income_details?: string | null
          link_id?: string | null
          nin?: string | null
          parish?: string | null
          phone?: string
          reason?: string | null
          school_name?: string | null
          status?: string
          sub_county?: string | null
          village?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          application_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          recorded_by: string | null
          term: string | null
        }
        Insert: {
          amount?: number
          application_id?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          recorded_by?: string | null
          term?: string | null
        }
        Update: {
          amount?: number
          application_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          recorded_by?: string | null
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_form_submissions: {
        Row: {
          application_id: string
          created_at: string
          id: string
          responses: Json | null
          signed_document_url: string | null
          status: string
          submitted_at: string | null
          template_id: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          responses?: Json | null
          signed_document_url?: string | null
          status?: string
          submitted_at?: string | null
          template_id: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          responses?: Json | null
          signed_document_url?: string | null
          status?: string
          submitted_at?: string | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_form_submissions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_form_submissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "lawyer_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_form_templates: {
        Row: {
          created_at: string
          description: string | null
          fields: Json
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lost_id_reports: {
        Row: {
          application_id: string | null
          created_at: string
          finder_name: string | null
          finder_phone: string
          id: string
          notes: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          finder_name?: string | null
          finder_phone: string
          id?: string
          notes?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          finder_name?: string | null
          finder_phone?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_id_reports_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          unit_cost?: number | null
        }
        Relationships: []
      }
      material_distributions: {
        Row: {
          application_id: string | null
          category_id: string | null
          distributed_at: string
          distributed_by: string | null
          id: string
          notes: string | null
          quantity: number
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          application_id?: string | null
          category_id?: string | null
          distributed_at?: string
          distributed_by?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          application_id?: string | null
          category_id?: string | null
          distributed_at?: string
          distributed_by?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_distributions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_distributions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_payments: {
        Row: {
          amount: number
          application_id: string
          created_at: string
          description: string | null
          id: string
          payment_code_id: string | null
          payment_date: string
          payment_method: string
          recorded_by: string | null
        }
        Insert: {
          amount?: number
          application_id: string
          created_at?: string
          description?: string | null
          id?: string
          payment_code_id?: string | null
          payment_date?: string
          payment_method?: string
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          application_id?: string
          created_at?: string
          description?: string | null
          id?: string
          payment_code_id?: string | null
          payment_date?: string
          payment_method?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_payments_payment_code_id_fkey"
            columns: ["payment_code_id"]
            isOneToOne: false
            referencedRelation: "payment_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_codes: {
        Row: {
          application_id: string | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          is_used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          application_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          application_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_codes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      petty_cash: {
        Row: {
          amount: number
          authorized_by: string | null
          created_at: string
          description: string
          id: string
          notes: string | null
          receipt_url: string | null
          recorded_by: string | null
          transaction_date: string
          type: string
        }
        Insert: {
          amount?: number
          authorized_by?: string | null
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          transaction_date?: string
          type: string
        }
        Update: {
          amount?: number
          authorized_by?: string | null
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          transaction_date?: string
          type?: string
        }
        Relationships: []
      }
      photocopy_pricing: {
        Row: {
          copy_type: string
          created_at: string
          id: string
          is_active: boolean
          paper_size: string
          price_per_copy: number
        }
        Insert: {
          copy_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          paper_size?: string
          price_per_copy?: number
        }
        Update: {
          copy_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          paper_size?: string
          price_per_copy?: number
        }
        Relationships: []
      }
      photocopy_shifts: {
        Row: {
          closed_at: string | null
          closing_cash: number | null
          created_at: string
          discrepancy: number | null
          expected_cash: number | null
          id: string
          opening_cash: number | null
          shift_date: string
          staff_id: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          discrepancy?: number | null
          expected_cash?: number | null
          id?: string
          opening_cash?: number | null
          shift_date: string
          staff_id: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          discrepancy?: number | null
          expected_cash?: number | null
          id?: string
          opening_cash?: number | null
          shift_date?: string
          staff_id?: string
          status?: string
        }
        Relationships: []
      }
      photocopy_transactions: {
        Row: {
          amount_paid: number
          change_given: number | null
          copy_type: string
          created_at: string
          customer_name: string | null
          id: string
          notes: string | null
          num_copies: number
          paper_size: string
          price_per_copy: number
          served_by: string | null
          total_amount: number
        }
        Insert: {
          amount_paid?: number
          change_given?: number | null
          copy_type?: string
          created_at?: string
          customer_name?: string | null
          id?: string
          notes?: string | null
          num_copies?: number
          paper_size?: string
          price_per_copy?: number
          served_by?: string | null
          total_amount?: number
        }
        Update: {
          amount_paid?: number
          change_given?: number | null
          copy_type?: string
          created_at?: string
          customer_name?: string | null
          id?: string
          notes?: string | null
          num_copies?: number
          paper_size?: string
          price_per_copy?: number
          served_by?: string | null
          total_amount?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_cards: {
        Row: {
          application_id: string
          created_at: string
          file_url: string
          id: string
          notes: string | null
          term: string
          year: string
        }
        Insert: {
          application_id: string
          created_at?: string
          file_url: string
          id?: string
          notes?: string | null
          term: string
          year: string
        }
        Update: {
          application_id?: string
          created_at?: string
          file_url?: string
          id?: string
          notes?: string | null
          term?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      scanned_documents: {
        Row: {
          application_id: string | null
          application_number: string
          created_at: string
          id: string
          original_filename: string
          school_id: string | null
          storage_path: string
        }
        Insert: {
          application_id?: string | null
          application_number?: string
          created_at?: string
          id?: string
          original_filename?: string
          school_id?: string | null
          storage_path?: string
        }
        Update: {
          application_id?: string | null
          application_number?: string
          created_at?: string
          id?: string
          original_filename?: string
          school_id?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "scanned_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scanned_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_attendance_reports: {
        Row: {
          class_grade: string | null
          created_at: string
          fees_currently_paying: number | null
          id: string
          match_status: string | null
          registration_number: string | null
          reporter_name: string | null
          reporter_phone: string | null
          school_id: string
          student_name: string
          term: string | null
          year: string | null
        }
        Insert: {
          class_grade?: string | null
          created_at?: string
          fees_currently_paying?: number | null
          id?: string
          match_status?: string | null
          registration_number?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          school_id: string
          student_name: string
          term?: string | null
          year?: string | null
        }
        Update: {
          class_grade?: string | null
          created_at?: string
          fees_currently_paying?: number | null
          id?: string
          match_status?: string | null
          registration_number?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          school_id?: string
          student_name?: string
          term?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_attendance_reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_users: {
        Row: {
          created_at: string
          id: string
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          boarding_available: boolean | null
          boarding_functional_fees: Json | null
          created_at: string
          day_functional_fees: Json | null
          district: string
          full_fees: number
          id: string
          is_active: boolean | null
          level: string
          name: string
          nyunga_covered_fees: number
          parent_pays: number | null
          parish: string | null
          requirements: string | null
          sub_county: string | null
          total_bursaries: number
          updated_at: string
          village: string | null
        }
        Insert: {
          boarding_available?: boolean | null
          boarding_functional_fees?: Json | null
          created_at?: string
          day_functional_fees?: Json | null
          district?: string
          full_fees?: number
          id?: string
          is_active?: boolean | null
          level?: string
          name: string
          nyunga_covered_fees?: number
          parent_pays?: number | null
          parish?: string | null
          requirements?: string | null
          sub_county?: string | null
          total_bursaries?: number
          updated_at?: string
          village?: string | null
        }
        Update: {
          boarding_available?: boolean | null
          boarding_functional_fees?: Json | null
          created_at?: string
          day_functional_fees?: Json | null
          district?: string
          full_fees?: number
          id?: string
          is_active?: boolean | null
          level?: string
          name?: string
          nyunga_covered_fees?: number
          parent_pays?: number | null
          parish?: string | null
          requirements?: string | null
          sub_county?: string | null
          total_bursaries?: number
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      staff_permissions: {
        Row: {
          can_access: boolean
          created_at: string
          id: string
          module_key: string
          user_id: string
        }
        Insert: {
          can_access?: boolean
          created_at?: string
          id?: string
          module_key: string
          user_id: string
        }
        Update: {
          can_access?: boolean
          created_at?: string
          id?: string
          module_key?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          access_level: string | null
          created_at: string
          date_joined: string | null
          date_of_birth: string | null
          department: string | null
          district: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employment_status: string | null
          full_name: string
          gender: string | null
          id: string
          left_thumb_url: string | null
          nin: string | null
          parish: string | null
          phone: string | null
          photo_url: string | null
          right_thumb_url: string | null
          role_title: string | null
          staff_number: string | null
          sub_county: string | null
          updated_at: string
          user_id: string
          village: string | null
        }
        Insert: {
          access_level?: string | null
          created_at?: string
          date_joined?: string | null
          date_of_birth?: string | null
          department?: string | null
          district?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employment_status?: string | null
          full_name: string
          gender?: string | null
          id?: string
          left_thumb_url?: string | null
          nin?: string | null
          parish?: string | null
          phone?: string | null
          photo_url?: string | null
          right_thumb_url?: string | null
          role_title?: string | null
          staff_number?: string | null
          sub_county?: string | null
          updated_at?: string
          user_id: string
          village?: string | null
        }
        Update: {
          access_level?: string | null
          created_at?: string
          date_joined?: string | null
          date_of_birth?: string | null
          department?: string | null
          district?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employment_status?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          left_thumb_url?: string | null
          nin?: string | null
          parish?: string | null
          phone?: string | null
          photo_url?: string | null
          right_thumb_url?: string | null
          role_title?: string | null
          staff_number?: string | null
          sub_county?: string | null
          updated_at?: string
          user_id?: string
          village?: string | null
        }
        Relationships: []
      }
      student_claims: {
        Row: {
          action_taken: string | null
          application_id: string
          claim_type: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          school_id: string | null
          status: string
        }
        Insert: {
          action_taken?: string | null
          application_id: string
          claim_type?: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          school_id?: string | null
          status?: string
        }
        Update: {
          action_taken?: string | null
          application_id?: string
          claim_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          school_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_claims_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_claims_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      uganda_locations: {
        Row: {
          created_at: string
          id: string
          level: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uganda_locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "uganda_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_readonly_query: { Args: { query_text: string }; Returns: Json }
      get_schools_with_availability: {
        Args: never
        Returns: {
          approved_count: number
          available_slots: number
          id: string
          level: string
          name: string
          total_bursaries: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_scanned_documents_to_applications: {
        Args: never
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "parent"
        | "school"
        | "staff"
        | "accountant"
        | "secretary"
        | "data_entrant"
      education_level:
        | "nursery"
        | "primary"
        | "secondary_o"
        | "secondary_a"
        | "vocational"
        | "university"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "parent",
        "school",
        "staff",
        "accountant",
        "secretary",
        "data_entrant",
      ],
      education_level: [
        "nursery",
        "primary",
        "secondary_o",
        "secondary_a",
        "vocational",
        "university",
      ],
    },
  },
} as const
