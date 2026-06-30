// types/index.ts

export type UserRole = 'citizen' | 'worker' | 'admin'

export type IssueCategory =
  | 'pothole'
  | 'streetlight'
  | 'garbage'
  | 'water'
  | 'drainage'
  | 'tree'
  | 'traffic_signal'
  | 'other'

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical'

export type ComplaintStatus =
  | 'submitted'
  | 'ai_processing'
  | 'ai_failed'
  | 'routed'
  | 'assigned'
  | 'worker_en_route'
  | 'in_progress'
  | 'completed'
  | 'citizen_verified'
  | 'closed'
  | 'escalated'

export interface GeoPoint {
  lat: number
  lng: number
  address: string
  landmark?: string | null
  ward?: string | null
}

export interface AIExplainability {
  visual_cues: string[]
  reasoning: string
  hazard_assessment: string
}

export interface AIAnalysisResult {
  category: IssueCategory
  severity: SeverityLevel
  confidence: number
  description: string
  tags: string[]
  suggested_department: string
  estimated_resolution_days: number
  similar_complaints_nearby: number
  explainability: AIExplainability
  source: 'gemini' | 'rule_based_fallback'
}

export interface TimelineEvent {
  id: string
  type: string
  message: string
  actor: string
  timestamp: string
  metadata?: Record<string, string>
}

export interface XPAward {
  xp_earned: number
  total_xp: number
  level: XPLevel
  streak_days: number
}

export interface Complaint {
  id: string
  citizen_id: string
  citizen_name: string
  title: string
  description: string
  category: IssueCategory
  severity: SeverityLevel
  status: ComplaintStatus
  location: GeoPoint
  media_urls: string[]
  ai_analysis: AIAnalysisResult | null
  assigned_worker_id: string | null
  assigned_worker_name: string | null
  department: string | null
  created_at: string
  updated_at: string
  deadline: string
  escalation_level: number
  upvotes: number
  timeline: TimelineEvent[]
  resolution_photo_url: string | null
  xp_awarded?: XPAward
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: UserRole
  avatar_url: string | null
  ward: string
  city: string
  created_at: string
  xp: number
  level: number
  level_name: string
  badge: string
  streak_days: number
}

export interface XPLevel {
  level: number
  name: string
  xp_required: number
  badge: string
}

export interface RewardsState {
  xp: number
  level: number
  level_name: string
  badge: string
  streak_days: number
  next_level: XPLevel | null
  xp_to_next_level: number
  all_levels: XPLevel[]
}

export interface PublicStats {
  total_complaints: number
  resolved_today: number
  average_resolution_hours: number
  sla_compliance_percent: number
  category_breakdown: Record<string, number>
  active_workers: number
}

export interface APIResponse<T> {
  success: boolean
  data: T
  message: string
  timestamp: string
  request_id: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  has_next: boolean
}

export interface ReportFormData {
  title: string
  description: string
  category: IssueCategory
  severity: SeverityLevel
  landmark: string
  location: GeoPoint
  media_urls: string[]
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  garbage: 'Garbage',
  water: 'Water',
  drainage: 'Drainage',
  tree: 'Fallen Tree',
  traffic_signal: 'Traffic Signal',
  other: 'Other',
}

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Submitted',
  ai_processing: 'AI Analysing',
  ai_failed: 'AI Analysis Failed',
  routed: 'Routed',
  assigned: 'Assigned',
  worker_en_route: 'Worker En Route',
  in_progress: 'In Progress',
  completed: 'Completed',
  citizen_verified: 'Verified',
  closed: 'Closed',
  escalated: 'Escalated',
}
