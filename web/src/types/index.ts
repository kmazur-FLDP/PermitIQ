import { Database } from './database'

// Type helpers
export type Permit = Database['public']['Tables']['erp_permits']['Row']
export type PermitHistory = Database['public']['Tables']['erp_permit_history']['Row']
export type Competitor = Database['public']['Tables']['competitor_watchlist']['Row']
export type CompetitorMatch = Database['public']['Tables']['competitor_permit_matches']['Row']
export type Alert = Database['public']['Tables']['alert_notifications']['Row']
export type AlertRule = Database['public']['Tables']['alert_rules']['Row']
export type Statistics = Database['public']['Tables']['erp_statistics']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

// Extended types with relationships
export interface PermitWithCompetitors extends Permit {
  competitor_matches?: {
    competitor: Competitor
    match_confidence: number
    matched_term: string | null
  }[]
}

export interface CompetitorWithStats extends Competitor {
  recent_permits?: Permit[]
  match_count?: number
}

export interface AlertWithDetails extends Alert {
  competitor?: Competitor
  permit?: Permit
}

// Map types
export interface PermitMarker {
  id: number
  permit_number: string
  longitude: number
  latitude: number
  applicant_name: string | null
  project_name: string | null
  status: string | null
  hotspot_score: number | null
  total_acreage: number | null
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

// Filter types
export interface PermitFilters {
  search?: string
  status?: string[]
  county?: string[]
  permitType?: string[]
  applicant?: string[]
  dateRange?: {
    start?: string
    end?: string
  }
  acreageRange?: {
    min?: number
    max?: number
  }
  hotspotScore?: {
    min?: number
    max?: number
  }
}

// Dashboard types
export interface DashboardStats {
  totalPermits: number
  newToday: number
  updatedToday: number
  avgAcreage: number
  totalAcreage: number
  topCounties: Array<{ county: string; count: number }>
  topApplicants: Array<{ applicant: string; count: number }>
  hotspotCount: number
  competitorAlerts: number
}

export interface ChartData {
  date: string
  permits: number
  acreage: number
}

// User types - using database type
export type UserRole = 'admin' | 'user'

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}
