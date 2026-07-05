// =====================================================================
// 🔴 CRITICAL EMAIL CONFIGURATION — TESTING PHASE ONLY
// The ONLY two emails permitted anywhere in tester mode.
// NEVER use project.owner_email or any user email while testing.
// =====================================================================
export const TESTER_SENDER = 'theopenhotels@gmail.com';
export const TESTER_RECEIVER = 'akashsakhrani05@gmail.com';

export const IS_TESTER_MODE = process.env.NEXT_PUBLIC_TESTER_MODE === 'true';
export const MOCK_EMAIL_SEND = process.env.NEXT_PUBLIC_MOCK_EMAIL_SEND === 'true';
export const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || '@oliveliving.com';
export const PUBLIC_ALLOWED_DOMAIN = '@oliveliving.com';

export const TESTER_BADGE_TEXT = `🧪 TESTER MODE - Emails: ${TESTER_SENDER} → ${TESTER_RECEIVER}`;

export const SESSION_COOKIE = 'dd_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 60; // 30-min inactivity auto-logout

export const RATE_LIMIT_PER_MINUTE = 50;

export const PROJECT_STATUSES = ['Active', 'Feasibility', 'Design', 'Execution', 'Complete'] as const;
export const TASK_STATUSES = ['Not Started', 'In Progress', 'Done', 'Overdue'] as const;
export const TASK_PRIORITIES = ['Low', 'Medium', 'High'] as const;
export const FILE_CATEGORIES = ['Agreement', 'Permit', 'Survey', 'Specification', 'Reference'] as const;
export const TASK_TYPES = ['Document Procurement', 'Site Survey', 'Specification', 'Owner Liaison', 'Vendor Management'] as const;

export const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-secondary/10 text-secondary border-secondary/30',
  Feasibility: 'bg-accent/10 text-accent border-accent/30',
  Design: 'bg-blue-100 text-blue-700 border-blue-300',
  Execution: 'bg-purple-100 text-purple-700 border-purple-300',
  Complete: 'bg-success/10 text-success border-success/30',
  'Not Started': 'bg-gray-100 text-gray-600 border-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-300',
  Done: 'bg-success/10 text-success border-success/30',
  Overdue: 'bg-warning/10 text-warning border-warning/30',
  Generated: 'bg-blue-100 text-blue-700 border-blue-300',
  'Sent to Owner': 'bg-accent/10 text-accent border-accent/30',
  'Owner Approved': 'bg-success/10 text-success border-success/30',
  'Revisions Requested': 'bg-warning/10 text-warning border-warning/30',
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-accent/10 text-accent',
  High: 'bg-warning/10 text-warning',
};

// % complete by phase — used for progress bars
export const STATUS_PROGRESS: Record<string, number> = {
  Active: 10, Feasibility: 30, Design: 55, Execution: 80, Complete: 100,
};

export const BD_TEAM = [
  'priya.k@oliveliving.com',
  'arjun.nair@oliveliving.com',
  'sneha.rao@oliveliving.com',
  'vikram.mehta@oliveliving.com',
] as const;

export const DEPARTMENT_HEAD = 'harshit.s@oliveliving.com';
