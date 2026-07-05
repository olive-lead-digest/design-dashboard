// Central domain types — mirror database/schema.sql exactly.

export type ProjectStatus = 'Active' | 'Feasibility' | 'Design' | 'Execution' | 'Complete';
export type DocumentType = 'client' | 'internal';
export type FileCategory = 'Agreement' | 'Permit' | 'Survey' | 'Specification' | 'Reference';
export type FeasibilityStatus = 'Generated' | 'Sent to Owner' | 'Owner Approved' | 'Revisions Requested';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Done' | 'Overdue';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type ProjectionType = 'Timeline' | 'Budget' | 'ROI' | 'Risk';
export type CommunicationType =
  | 'email' | 'dashboard_notification' | 'feasibility_sent' | 'floor_plan_sent' | 'status_update';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  owner_email: string; // production only — NEVER emailed in tester mode
  property_location: string;
  property_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string | null;
  file_category: FileCategory;
  uploaded_by: string;
  uploaded_at: string;
  auto_processed: boolean;
  key_info: Record<string, unknown> | null;
}

export interface TimelinePhase { name: string; months: number; }
export interface FeasibilityTimeline { total_months: number; phases: TimelinePhase[]; }
export interface Risk { description: string; impact: 'Low' | 'Medium' | 'High'; mitigation: string; }
export interface CostBreakdown {
  currency: string; land: number; construction: number; design: number; contingency: number; total: number;
}

export interface FeasibilityStudy {
  id: string;
  project_id: string;
  executive_summary: string | null;
  timeline: FeasibilityTimeline | null;
  risk_analysis: { risks: Risk[] } | null;
  cost_breakdown: CostBreakdown | null;
  recommendations: string[] | null;
  detailed_report: string | null;
  status: FeasibilityStatus;
  generated_at: string;
  generated_by_ai: boolean;
  sent_to_owner_at: string | null;
}

export interface Room { name: string; sqft: number; dimensions: string; }
export interface FloorPlan {
  id: string;
  project_id: string;
  plan_version: number;
  plan_2d_svg_url: string | null;
  plan_3d_model_url: string | null;
  dimensions_json: { total_sqft: number; rooms: Room[] } | null;
  materials_json: Record<string, string> | null;
  created_at: string;
  generated_by: string | null;
  design_notes: string | null;
  sent_to_owner_at: string | null;
}

export interface PaymentPhase { phase: string; amount: number; date: string; }
export interface InvestmentRequirement {
  id: string;
  project_id: string;
  total_investment: number;
  currency: 'INR' | 'USD';
  breakdown: CostBreakdown | null;
  estimated_roi_percent: number | null;
  payment_schedule: PaymentPhase[];
  updated_at: string;
  approved_by_owner: boolean;
}

export interface Communication {
  id: string;
  project_id: string;
  communication_type: CommunicationType;
  message: string;
  subject: string | null;
  sent_by_email: string;
  sent_to_owner: boolean;
  sent_to_owner_at: string | null;
  owner_read_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface TeamTask {
  id: string;
  project_id: string;
  task_owner_email: string;
  task_title: string;
  task_type: string;
  description: string | null;
  due_date: string;
  status: TaskStatus;
  created_at: string;
  completed_at: string | null;
  priority: TaskPriority;
  completion_notes: string | null;
}

export interface Projection {
  id: string;
  project_id: string | null;
  projection_type: ProjectionType;
  projection_title: string;
  data: Record<string, unknown> & { confidence_level?: number; insights?: string[] };
  generated_at: string;
  generated_from_projects: string[] | null;
  recipients_emails: string[] | null;
}

export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  timestamp: string;
  ip_address: string | null;
}

export interface AccountabilityMetric {
  bd_member: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number; // 0–100
  overdue_count: number;
  avg_completion_time_days: number | null;
}

export interface EmailPreview {
  from: string;   // tester mode: theopenhotels@gmail.com — ALWAYS
  to: string;     // tester mode: akashsakhrani05@gmail.com — ALWAYS
  subject: string;
  html: string;
  testerMode: boolean;
}

export interface SessionUser { email: string; exp: number; }

export interface ApiError { error: string; }
