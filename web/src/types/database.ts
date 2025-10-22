export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      erp_permits: {
        Row: {
          id: number
          permit_number: string
          objectid: number
          applicant_name: string | null
          project_name: string | null
          permit_type: string | null
          permit_status: string | null
          issue_date: string | null
          expiration_date: string | null
          total_acreage: number | null
          wetland_acreage: number | null
          surface_water_acreage: number | null
          county: string | null
          description: string | null
          latitude: number | null
          longitude: number | null
          geometry: Json | null
          centroid: Json | null
          hotspot_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          permit_number: string
          objectid: number
          applicant_name?: string | null
          project_name?: string | null
          permit_type?: string | null
          permit_status?: string | null
          issue_date?: string | null
          expiration_date?: string | null
          total_acreage?: number | null
          wetland_acreage?: number | null
          surface_water_acreage?: number | null
          county?: string | null
          description?: string | null
          latitude?: number | null
          longitude?: number | null
          geometry?: Json | null
          centroid?: Json | null
          hotspot_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          permit_number?: string
          objectid?: number
          applicant_name?: string | null
          project_name?: string | null
          permit_type?: string | null
          permit_status?: string | null
          issue_date?: string | null
          expiration_date?: string | null
          total_acreage?: number | null
          wetland_acreage?: number | null
          surface_water_acreage?: number | null
          county?: string | null
          description?: string | null
          latitude?: number | null
          longitude?: number | null
          geometry?: Json | null
          centroid?: Json | null
          hotspot_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      erp_permit_history: {
        Row: {
          id: number
          permit_id: number
          permit_number: string
          objectid: number
          revision_number: number
          captured_at: string
          applicant_name: string | null
          project_name: string | null
          permit_type: string | null
          status: string | null
          issue_date: string | null
          expiration_date: string | null
          total_acreage: number | null
          county: string | null
          geometry: Json | null
          centroid: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          permit_id: number
          permit_number: string
          objectid: number
          revision_number: number
          captured_at?: string
          applicant_name?: string | null
          project_name?: string | null
          permit_type?: string | null
          status?: string | null
          issue_date?: string | null
          expiration_date?: string | null
          total_acreage?: number | null
          county?: string | null
          geometry?: Json | null
          centroid?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          permit_id?: number
          permit_number?: string
          objectid?: number
          revision_number?: number
          captured_at?: string
          applicant_name?: string | null
          project_name?: string | null
          permit_type?: string | null
          status?: string | null
          issue_date?: string | null
          expiration_date?: string | null
          total_acreage?: number | null
          county?: string | null
          geometry?: Json | null
          centroid?: Json | null
          created_at?: string
        }
      }
      competitor_watchlist: {
        Row: {
          id: number
          company_name: string
          company_aliases: string[] | null
          priority_level: string
          notes: string | null
          total_permits: number
          last_permit_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          company_name: string
          company_aliases?: string[] | null
          priority_level?: string
          notes?: string | null
          total_permits?: number
          last_permit_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          company_name?: string
          company_aliases?: string[] | null
          priority_level?: string
          notes?: string | null
          total_permits?: number
          last_permit_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      competitor_permit_matches: {
        Row: {
          id: number
          competitor_id: number
          permit_id: number
          match_confidence: number
          matched_term: string | null
          matched_at: string
        }
        Insert: {
          id?: number
          competitor_id: number
          permit_id: number
          match_confidence: number
          matched_term?: string | null
          matched_at?: string
        }
        Update: {
          id?: number
          competitor_id?: number
          permit_id?: number
          match_confidence?: number
          matched_term?: string | null
          matched_at?: string
        }
      }
      alert_notifications: {
        Row: {
          id: number
          alert_type: string
          severity: string
          title: string
          message: string
          competitor_id: number | null
          permit_id: number | null
          metadata: Json | null
          acknowledged: boolean
          acknowledged_by: string | null
          acknowledged_at: string | null
          status: string
          dedup_key: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          alert_type: string
          severity?: string
          title: string
          message: string
          competitor_id?: number | null
          permit_id?: number | null
          metadata?: Json | null
          acknowledged?: boolean
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          status?: string
          dedup_key?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          alert_type?: string
          severity?: string
          title?: string
          message?: string
          competitor_id?: number | null
          permit_id?: number | null
          metadata?: Json | null
          acknowledged?: boolean
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          status?: string
          dedup_key?: string | null
          expires_at?: string | null
          created_at?: string
        }
      }
      alert_rules: {
        Row: {
          id: number
          rule_type: string
          rule_name: string
          parameters: Json
          is_active: boolean
          delivery_methods: string[]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          rule_type: string
          rule_name: string
          parameters?: Json
          is_active?: boolean
          delivery_methods?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          rule_type?: string
          rule_name?: string
          parameters?: Json
          is_active?: boolean
          delivery_methods?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      erp_statistics: {
        Row: {
          id: number
          stat_date: string
          total_permits: number
          new_permits_today: number
          updated_permits_today: number
          top_counties: Json | null
          top_applicants: Json | null
          average_acreage: number | null
          total_acreage: number | null
          created_at: string
        }
        Insert: {
          id?: number
          stat_date: string
          total_permits: number
          new_permits_today?: number
          updated_permits_today?: number
          top_counties?: Json | null
          top_applicants?: Json | null
          average_acreage?: number | null
          total_acreage?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          stat_date?: string
          total_permits?: number
          new_permits_today?: number
          updated_permits_today?: number
          top_counties?: Json | null
          top_applicants?: Json | null
          average_acreage?: number | null
          total_acreage?: number | null
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          default_county: string | null
          notification_preferences: Json | null
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          default_county?: string | null
          notification_preferences?: Json | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          default_county?: string | null
          notification_preferences?: Json | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
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
  }
}
