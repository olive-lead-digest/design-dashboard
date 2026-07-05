-- =============================================================
-- Olive Living Design & Project Management Dashboard — Schema
-- Applies alongside existing dp_* tables. RLS on ALL tables.
-- Access rule: JWT email must end in @oliveliving.com.
-- service_role (n8n / server) bypasses RLS by design.
-- =============================================================

create extension if not exists pgcrypto;

-- ---------- helper: updated_at trigger ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- projects ----------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'Active'
    check (status in ('Active','Feasibility','Design','Execution','Complete')),
  owner_email text not null, -- production only; NEVER emailed in tester mode
  property_location text not null,
  property_type text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_projects_updated on projects;
create trigger trg_projects_updated before update on projects
  for each row execute function set_updated_at();

-- ---------- documents ----------
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  document_type text not null check (document_type in ('client','internal')),
  file_name text not null,
  file_url text,
  file_category text not null
    check (file_category in ('Agreement','Permit','Survey','Specification','Reference')),
  uploaded_by text not null,
  uploaded_at timestamptz not null default now(),
  auto_processed boolean not null default false,
  key_info jsonb
);
create index if not exists idx_documents_project on documents(project_id);

-- ---------- feasibility_studies ----------
create table if not exists feasibility_studies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  executive_summary text,
  timeline jsonb,
  risk_analysis jsonb,
  cost_breakdown jsonb,
  recommendations jsonb,
  detailed_report text,
  status text not null default 'Generated'
    check (status in ('Generated','Sent to Owner','Owner Approved','Revisions Requested')),
  generated_at timestamptz not null default now(),
  generated_by_ai boolean not null default true,
  sent_to_owner_at timestamptz
);
create index if not exists idx_feasibility_project on feasibility_studies(project_id);

-- ---------- floor_plans ----------
create table if not exists floor_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  plan_version integer not null default 1,
  plan_2d_svg_url text,
  plan_3d_model_url text,
  dimensions_json jsonb,
  materials_json jsonb,
  created_at timestamptz not null default now(),
  generated_by text,
  design_notes text,
  sent_to_owner_at timestamptz
);
create index if not exists idx_floorplans_project on floor_plans(project_id);

-- ---------- investment_requirements ----------
create table if not exists investment_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  total_investment numeric(14,2) not null default 0,
  currency text not null default 'INR' check (currency in ('INR','USD')),
  breakdown jsonb,
  estimated_roi_percent numeric(5,2),
  payment_schedule jsonb,
  updated_at timestamptz not null default now(),
  approved_by_owner boolean not null default false
);
create index if not exists idx_investment_project on investment_requirements(project_id);
drop trigger if exists trg_investment_updated on investment_requirements;
create trigger trg_investment_updated before update on investment_requirements
  for each row execute function set_updated_at();

-- ---------- communications ----------
create table if not exists communications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  communication_type text not null
    check (communication_type in ('email','dashboard_notification','feasibility_sent','floor_plan_sent','status_update')),
  message text not null,
  subject text,
  sent_by_email text not null,
  sent_to_owner boolean not null default false,
  sent_to_owner_at timestamptz,
  owner_read_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb
);
create index if not exists idx_comms_project on communications(project_id);

-- ---------- team_tasks (BD accountability) ----------
create table if not exists team_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  task_owner_email text not null,
  task_title text not null,
  task_type text not null,
  description text,
  due_date timestamptz not null,
  status text not null default 'Not Started'
    check (status in ('Not Started','In Progress','Done','Overdue')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  completion_notes text
);
create index if not exists idx_tasks_project on team_tasks(project_id);
create index if not exists idx_tasks_owner on team_tasks(task_owner_email);

-- ---------- projections ----------
create table if not exists projections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  projection_type text not null check (projection_type in ('Timeline','Budget','ROI','Risk')),
  projection_title text not null,
  data jsonb not null,
  generated_at timestamptz not null default now(),
  generated_from_projects uuid[],
  recipients_emails text[] -- tester mode: always overridden to akashsakhrani05@gmail.com
);
create index if not exists idx_projections_project on projections(project_id);

-- ---------- audit_logs ----------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  action text not null,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  "timestamp" timestamptz not null default now(),
  ip_address text
);
create index if not exists idx_audit_user on audit_logs(user_email);
create index if not exists idx_audit_time on audit_logs("timestamp");

-- =============================================================
-- ROW-LEVEL SECURITY — org isolation for @oliveliving.com
-- =============================================================
alter table projects                enable row level security;
alter table documents               enable row level security;
alter table feasibility_studies     enable row level security;
alter table floor_plans             enable row level security;
alter table investment_requirements enable row level security;
alter table communications          enable row level security;
alter table team_tasks              enable row level security;
alter table projections             enable row level security;
alter table audit_logs              enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'projects','documents','feasibility_studies','floor_plans',
    'investment_requirements','communications','team_tasks','projections','audit_logs'
  ] loop
    execute format('drop policy if exists org_isolation on %I', t);
    execute format(
      $pol$create policy org_isolation on %I
        for all
        using ((auth.jwt() ->> 'email') like '%%@oliveliving.com')
        with check ((auth.jwt() ->> 'email') like '%%@oliveliving.com')$pol$, t);
  end loop;
end $$;

comment on table projects is 'Olive D&PM dashboard. RLS: @oliveliving.com only.';
