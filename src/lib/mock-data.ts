// TESTER MODE dataset — mirrors database/seed-data.sql (same UUIDs).
// Dates are relative so the demo always looks fresh.
import type {
  Communication, FeasibilityStudy, FloorPlan, InvestmentRequirement,
  Project, ProjectDocument, Projection, TeamTask, AuditLog,
} from '@/types';
import type { PlanLayout } from './floorplan';

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

export const P1 = '11111111-1111-4111-8111-111111111111';
export const P2 = '22222222-2222-4222-8222-222222222222';
export const P3 = '33333333-3333-4333-8333-333333333333';
export const P4 = '44444444-4444-4444-8444-444444444444';
export const P5 = '55555555-5555-4555-8555-555555555555';

export const mockProjects: Project[] = [
  { id: P1, name: 'Olive Koramangala Residences', status: 'Design', owner_email: 'rajesh.menon.owner@gmail.com', property_location: 'Koramangala, Bengaluru, Karnataka', property_type: 'Residential', description: '32-key premium serviced residence conversion of a G+4 standalone building on 80ft road.', created_at: days(-65), updated_at: days(-3) },
  { id: P2, name: 'Olive Indiranagar Commercial Hub', status: 'Feasibility', owner_email: 'anita.desai.owner@gmail.com', property_location: 'Indiranagar 100ft Road, Bengaluru, Karnataka', property_type: 'Commercial', description: 'Mixed-use retail + co-working refurbishment, 18,500 sqft across 3 floors.', created_at: days(-24), updated_at: days(-10) },
  { id: P3, name: 'Olive Jubilee Hills Villa Renovation', status: 'Execution', owner_email: 'k.reddy.owner@gmail.com', property_location: 'Jubilee Hills, Hyderabad, Telangana', property_type: 'Renovation', description: 'Luxury 6BHK villa renovation into 9-key boutique stay with rooftop F&B.', created_at: days(-120), updated_at: days(-5) },
  { id: P4, name: 'Olive HSR Co-living Towers', status: 'Active', owner_email: 'm.gupta.owner@gmail.com', property_location: 'HSR Layout Sector 2, Bengaluru, Karnataka', property_type: 'Co-living', description: 'Twin-tower 84-bed co-living asset; owner onboarding and document collection in progress.', created_at: days(-9), updated_at: days(-6) },
  { id: P5, name: 'Olive Baner Serviced Suites', status: 'Complete', owner_email: 's.kulkarni.owner@gmail.com', property_location: 'Baner, Pune, Maharashtra', property_type: 'Commercial', description: '24-suite extended-stay property; handed over this month.', created_at: days(-210), updated_at: days(-8) },
];

export const mockDocuments: ProjectDocument[] = [
  { id: 'a1111111-0000-4000-8000-000000000001', project_id: P1, document_type: 'client', file_name: 'koramangala_lease_agreement_v3.pdf', file_url: null, file_category: 'Agreement', uploaded_by: 'priya.k@oliveliving.com', uploaded_at: days(-60), auto_processed: true, key_info: { parties: 'Owner / Olive Living', term_years: 9, lock_in_years: 3, rent_free_fitout_days: 90 } },
  { id: 'a1111111-0000-4000-8000-000000000002', project_id: P1, document_type: 'client', file_name: 'bbmp_building_sanction_plan.pdf', file_url: null, file_category: 'Permit', uploaded_by: 'priya.k@oliveliving.com', uploaded_at: days(-58), auto_processed: true, key_info: { authority: 'BBMP', sanctioned_floors: 'G+4', far: 2.25 } },
  { id: 'a1111111-0000-4000-8000-000000000003', project_id: P1, document_type: 'internal', file_name: 'site_survey_report_koramangala.pdf', file_url: null, file_category: 'Survey', uploaded_by: 'arjun.nair@oliveliving.com', uploaded_at: days(-52), auto_processed: true, key_info: { plot_sqft: 4800, builtup_sqft: 16200, structural_grade: 'B+', seepage_zones: 2 } },
  { id: 'a1111111-0000-4000-8000-000000000004', project_id: P1, document_type: 'internal', file_name: 'ffe_specification_sheet_v2.xlsx', file_url: null, file_category: 'Specification', uploaded_by: 'sneha.rao@oliveliving.com', uploaded_at: days(-20), auto_processed: false, key_info: null },
  { id: 'a2222222-0000-4000-8000-000000000001', project_id: P2, document_type: 'client', file_name: 'indiranagar_title_deed_chain.pdf', file_url: null, file_category: 'Agreement', uploaded_by: 'priya.k@oliveliving.com', uploaded_at: days(-21), auto_processed: true, key_info: { title_clear: true, encumbrance: 'Nil (EC 2010-2026)' } },
  { id: 'a2222222-0000-4000-8000-000000000002', project_id: P2, document_type: 'client', file_name: 'trade_license_and_oc.pdf', file_url: null, file_category: 'Permit', uploaded_by: 'priya.k@oliveliving.com', uploaded_at: days(-18), auto_processed: true, key_info: { occupancy_certificate: true, trade_license_valid_till: '2027-03-31' } },
  { id: 'a2222222-0000-4000-8000-000000000003', project_id: P2, document_type: 'internal', file_name: 'structural_audit_indiranagar.pdf', file_url: null, file_category: 'Survey', uploaded_by: 'arjun.nair@oliveliving.com', uploaded_at: days(-12), auto_processed: true, key_info: { columns_ok: true, slab_deflection_mm: 8, retrofit_required: 'minor' } },
  { id: 'a3333333-0000-4000-8000-000000000001', project_id: P3, document_type: 'client', file_name: 'jubilee_hills_ghmc_permit.pdf', file_url: null, file_category: 'Permit', uploaded_by: 'vikram.mehta@oliveliving.com', uploaded_at: days(-110), auto_processed: true, key_info: { authority: 'GHMC', renovation_scope: 'internal + facade' } },
  { id: 'a3333333-0000-4000-8000-000000000002', project_id: P3, document_type: 'internal', file_name: 'boq_execution_phase2.xlsx', file_url: null, file_category: 'Specification', uploaded_by: 'sneha.rao@oliveliving.com', uploaded_at: days(-30), auto_processed: false, key_info: null },
  { id: 'a3333333-0000-4000-8000-000000000003', project_id: P3, document_type: 'internal', file_name: 'moodboard_rooftop_fnb.pdf', file_url: null, file_category: 'Reference', uploaded_by: 'sneha.rao@oliveliving.com', uploaded_at: days(-45), auto_processed: false, key_info: null },
  { id: 'a4444444-0000-4000-8000-000000000001', project_id: P4, document_type: 'client', file_name: 'hsr_mou_signed.pdf', file_url: null, file_category: 'Agreement', uploaded_by: 'priya.k@oliveliving.com', uploaded_at: days(-7), auto_processed: true, key_info: { model: 'revenue_share', owner_share_percent: 42 } },
];

export const mockFeasibility: FeasibilityStudy[] = [
  {
    id: 'f1111111-0000-4000-8000-000000000001', project_id: P1,
    executive_summary: 'Conversion of the Koramangala G+4 asset into a 32-key serviced residence is commercially viable with a projected stabilized occupancy of 82% and payback in 4.1 years. Structural condition is sound; the critical path is fit-out procurement and BBMP facade approval.',
    timeline: { total_months: 11, phases: [{ name: 'Design Development', months: 2 }, { name: 'Approvals & Permits', months: 2 }, { name: 'Civil & MEP', months: 4 }, { name: 'FF&E + Fit-out', months: 2 }, { name: 'Pre-opening', months: 1 }] },
    risk_analysis: { risks: [
      { description: 'BBMP facade modification approval delay', impact: 'High', mitigation: 'Pre-submission consultation; retain liaison architect' },
      { description: 'Monsoon seepage in NW stairwell', impact: 'Medium', mitigation: 'Waterproofing package in Phase 1 civil scope' },
      { description: 'FF&E import lead times (lighting, sanitaryware)', impact: 'Medium', mitigation: 'Order long-lead items at design freeze; domestic alternates listed' },
      { description: 'Rent escalation clause ambiguity (Cl. 7.2)', impact: 'Low', mitigation: 'Addendum drafted; owner counsel review' },
      { description: 'Parking ratio shortfall vs zoning', impact: 'Medium', mitigation: 'Valet + leased overflow lot within 200m' },
    ] },
    cost_breakdown: { currency: 'INR', land: 0, construction: 32500000, design: 4200000, contingency: 3670000, total: 40370000 },
    recommendations: ['Freeze GFC drawings by week 6 to protect the 11-month timeline', 'Procure long-lead FF&E immediately at design freeze', 'Bundle waterproofing with Phase 1 civil to avoid re-mobilization', 'Negotiate rent-free extension of 30 days against facade approval risk', 'Target ADR ₹4,200 at launch with 12% corporate contracting mix'],
    detailed_report: '# Feasibility Study — Olive Koramangala Residences\n\n## 1. Market Analysis\nKoramangala micro-market ADR band ₹3,800–4,600 with 78–86% stabilized occupancy across the 7-asset competitive set. Demand drivers: startup corridor corporate travel, medical value travel (2 hospitals within 3 km), and weekend leisure spillover.\n\n## 2. Asset Assessment\nG+4 RCC frame, structural grade B+. Two seepage zones in NW stairwell (340 sqft membrane treatment). Floor plates suit a 20ft grid room module with minimal wet-core relocation.\n\n## 3. Program & Timeline\n11 months total: Design Development (2) → Approvals (2) → Civil & MEP (4) → FF&E + Fit-out (2) → Pre-opening (1). Critical path: BBMP facade approval and imported FF&E lead times.\n\n## 4. Financial Summary\nTotal outlay ₹4.04 Cr (construction ₹3.25 Cr, design ₹42 L, contingency ₹36.7 L). Sensitivity: at 70/78/85% occupancy, payback 5.2/4.1/3.6 years. Projected stabilized ROI 24.5%.\n\n## 5. Recommendations\nSee summary recommendations; the stage-gates and procurement triggers are the operating levers that protect the pro-forma.',
    status: 'Sent to Owner', generated_at: days(-48), generated_by_ai: true, sent_to_owner_at: days(-46),
  },
  {
    id: 'f2222222-0000-4000-8000-000000000001', project_id: P2,
    executive_summary: 'The Indiranagar mixed-use refurbishment shows strong retail frontage value but co-working competition is intense. Recommended configuration: 60% managed office / 40% F&B-retail. Viable at projected blended rental of ₹185/sqft with 14-month payback on fit-out capex.',
    timeline: { total_months: 7, phases: [{ name: 'Design & Tenant Mix', months: 2 }, { name: 'Retrofit & MEP', months: 3 }, { name: 'Fit-out & Leasing', months: 2 }] },
    risk_analysis: { risks: [
      { description: 'Anchor tenant not secured before capex start', impact: 'High', mitigation: 'LOI stage-gate before Phase 2 spend' },
      { description: '100ft Road metro construction footfall disruption', impact: 'Medium', mitigation: 'Phased facade opening; rear access activation' },
      { description: 'Slab loading limits for gym tenant', impact: 'Low', mitigation: 'Restrict heavy equipment to ground floor' },
    ] },
    cost_breakdown: { currency: 'INR', land: 0, construction: 18900000, design: 2600000, contingency: 2150000, total: 23650000 },
    recommendations: ['Stage-gate capex on anchor LOI', 'Pre-lease 40% before retrofit completion', 'Negotiate metro-disruption rent abatement with owner'],
    detailed_report: '# Feasibility Study — Olive Indiranagar Commercial Hub\n\n## 1. Micro-market\n100ft Road retail rents ₹210–260/sqft; co-working supply up 22% YoY — differentiation via managed-office + F&B hybrid.\n\n## 2. Configuration Scenarios\nA: 100% co-working (IRR 14.1%) · B: 60/40 managed office + F&B-retail (IRR 19.8%) ✅ · C: 100% retail (IRR 16.3%, leasing risk high).\n\n## 3. Capex & Phasing\n₹2.37 Cr total with anchor-LOI stage-gate before the ₹1.18 Cr retrofit tranche.\n\n## 4. Risks\nAnchor timing, metro footfall disruption, slab loading at F2 gym zone (minor retrofit specified).',
    status: 'Generated', generated_at: days(-10), generated_by_ai: true, sent_to_owner_at: null,
  },
];

export const planLayouts: Record<string, PlanLayout> = {
  'b1111111-0000-4000-8000-000000000001': {
    totalW: 81, totalH: 40,
    rooms: [
      { name: 'Reception & Lounge', x: 0, y: 0, w: 26, h: 20, sqft: 520 },
      { name: 'Cafe & Pantry', x: 26, y: 0, w: 19, h: 20, sqft: 380 },
      { name: 'Suite 103', x: 45, y: 0, w: 23, h: 20, sqft: 460 },
      { name: 'Back Office', x: 68, y: 0, w: 13, h: 20, sqft: 220 },
      { name: 'Deluxe Room 101', x: 0, y: 24, w: 15.5, h: 20, sqft: 310 },
      { name: 'Deluxe Room 102', x: 15.5, y: 24, w: 15.5, h: 20, sqft: 310 },
      { name: 'Corridor & Core', x: 31, y: 24, w: 50, h: 20, sqft: 1040 },
    ],
  },
  'b1111111-0000-4000-8000-000000000002': {
    totalW: 81, totalH: 40,
    rooms: [
      { name: 'Reception & Lounge', x: 0, y: 0, w: 23, h: 20, sqft: 460 },
      { name: 'Cafe & Pantry', x: 23, y: 0, w: 22, h: 20, sqft: 440 },
      { name: 'Suite 103', x: 45, y: 0, w: 23, h: 20, sqft: 460 },
      { name: 'Back Office', x: 68, y: 0, w: 13, h: 20, sqft: 220 },
      { name: 'Deluxe Room 101', x: 0, y: 24, w: 15.5, h: 20, sqft: 310 },
      { name: 'Deluxe Room 102', x: 15.5, y: 24, w: 15.5, h: 20, sqft: 310 },
      { name: 'Corridor & Core', x: 31, y: 24, w: 50, h: 20, sqft: 1040 },
    ],
  },
  'b3333333-0000-4000-8000-000000000001': {
    totalW: 90, totalH: 60,
    rooms: [
      { name: 'Grand Living', x: 0, y: 0, w: 30, h: 24, sqft: 720 },
      { name: 'Key 1 (Master)', x: 30, y: 0, w: 20, h: 24, sqft: 480 },
      { name: 'Key 2', x: 50, y: 0, w: 19, h: 20, sqft: 380 },
      { name: 'Key 3', x: 69, y: 0, w: 19, h: 20, sqft: 380 },
      { name: 'Chef Kitchen', x: 0, y: 28, w: 17, h: 20, sqft: 340 },
      { name: 'Rooftop F&B Deck', x: 17, y: 28, w: 55, h: 20, sqft: 1100 },
      { name: 'Service & Core', x: 0, y: 50, w: 90, h: 10, sqft: 2000 },
    ],
  },
};

export const mockFloorPlans: FloorPlan[] = [
  { id: 'b1111111-0000-4000-8000-000000000001', project_id: P1, plan_version: 1, plan_2d_svg_url: '/api/projects/' + P1 + '/floor-plans/b1111111-0000-4000-8000-000000000001/svg', plan_3d_model_url: null, dimensions_json: { total_sqft: 3240, rooms: [{ name: 'Reception & Lounge', sqft: 520, dimensions: '26 x 20' }, { name: 'Deluxe Room 101', sqft: 310, dimensions: '15.5 x 20' }, { name: 'Deluxe Room 102', sqft: 310, dimensions: '15.5 x 20' }, { name: 'Suite 103', sqft: 460, dimensions: '23 x 20' }, { name: 'Cafe & Pantry', sqft: 380, dimensions: '19 x 20' }, { name: 'Back Office', sqft: 220, dimensions: '11 x 20' }, { name: 'Corridor & Core', sqft: 1040, dimensions: 'irregular' }] }, materials_json: { floors: 'Engineered oak + vitrified tile (wet areas)', walls: 'Low-VOC paint, oak wainscot in lounge', fixtures: 'Matte black CP fittings, brass accents', lighting: '3000K warm LED, cove + task' }, created_at: days(-40), generated_by: 'sneha.rao@oliveliving.com', design_notes: 'Ground floor typical; rooms sized to serviced-residence standard with 20ft structural grid.', sent_to_owner_at: null },
  { id: 'b1111111-0000-4000-8000-000000000002', project_id: P1, plan_version: 2, plan_2d_svg_url: '/api/projects/' + P1 + '/floor-plans/b1111111-0000-4000-8000-000000000002/svg', plan_3d_model_url: null, dimensions_json: { total_sqft: 3240, rooms: [{ name: 'Reception & Lounge', sqft: 460, dimensions: '23 x 20' }, { name: 'Deluxe Room 101', sqft: 310, dimensions: '15.5 x 20' }, { name: 'Deluxe Room 102', sqft: 310, dimensions: '15.5 x 20' }, { name: 'Suite 103', sqft: 460, dimensions: '23 x 20' }, { name: 'Cafe & Pantry', sqft: 440, dimensions: '22 x 20' }, { name: 'Back Office', sqft: 220, dimensions: '11 x 20' }, { name: 'Corridor & Core', sqft: 1040, dimensions: 'irregular' }] }, materials_json: { floors: 'Engineered oak + vitrified tile (wet areas)', walls: 'Low-VOC paint, oak wainscot in lounge', fixtures: 'Matte black CP fittings, brass accents', lighting: '3000K warm LED, cove + task' }, created_at: days(-15), generated_by: 'sneha.rao@oliveliving.com', design_notes: 'V2: cafe enlarged per owner feedback; lounge trimmed 60 sqft.', sent_to_owner_at: days(-14) },
  { id: 'b3333333-0000-4000-8000-000000000001', project_id: P3, plan_version: 1, plan_2d_svg_url: '/api/projects/' + P3 + '/floor-plans/b3333333-0000-4000-8000-000000000001/svg', plan_3d_model_url: null, dimensions_json: { total_sqft: 5400, rooms: [{ name: 'Grand Living', sqft: 720, dimensions: '30 x 24' }, { name: 'Key 1 (Master)', sqft: 480, dimensions: '20 x 24' }, { name: 'Key 2', sqft: 380, dimensions: '19 x 20' }, { name: 'Key 3', sqft: 380, dimensions: '19 x 20' }, { name: 'Chef Kitchen', sqft: 340, dimensions: '17 x 20' }, { name: 'Rooftop F&B Deck', sqft: 1100, dimensions: '55 x 20' }, { name: 'Service & Core', sqft: 2000, dimensions: 'irregular' }] }, materials_json: { floors: 'Italian marble (public), oak (keys)', walls: 'Lime plaster, walnut paneling', fixtures: 'Brushed brass, terrazzo vanities', lighting: '2700K, statement chandeliers' }, created_at: days(-90), generated_by: 'sneha.rao@oliveliving.com', design_notes: 'Execution set issued; rooftop deck load path verified.', sent_to_owner_at: null },
];

export const mockInvestments: InvestmentRequirement[] = [
  { id: 'c1111111-0000-4000-8000-000000000001', project_id: P1, total_investment: 40370000, currency: 'INR', breakdown: { currency: 'INR', land: 0, construction: 32500000, design: 4200000, contingency: 3670000, total: 40370000 }, estimated_roi_percent: 24.5, payment_schedule: [{ phase: 'Mobilization', amount: 8074000, date: '2026-08-01' }, { phase: 'Civil 50%', amount: 12111000, date: '2026-10-15' }, { phase: 'Fit-out', amount: 12111000, date: '2027-01-15' }, { phase: 'Handover', amount: 8074000, date: '2027-04-30' }], updated_at: days(-12), approved_by_owner: true },
  { id: 'c2222222-0000-4000-8000-000000000001', project_id: P2, total_investment: 23650000, currency: 'INR', breakdown: { currency: 'INR', land: 0, construction: 18900000, design: 2600000, contingency: 2150000, total: 23650000 }, estimated_roi_percent: 19.8, payment_schedule: [{ phase: 'Design', amount: 4730000, date: '2026-08-15' }, { phase: 'Retrofit', amount: 11825000, date: '2026-11-01' }, { phase: 'Fit-out & Launch', amount: 7095000, date: '2027-01-20' }], updated_at: days(-9), approved_by_owner: false },
  { id: 'c3333333-0000-4000-8000-000000000001', project_id: P3, total_investment: 61200000, currency: 'INR', breakdown: { currency: 'INR', land: 0, construction: 47500000, design: 7100000, contingency: 6600000, total: 61200000 }, estimated_roi_percent: 27.2, payment_schedule: [{ phase: 'Phase 1 (done)', amount: 24480000, date: '2026-03-01' }, { phase: 'Phase 2 (current)', amount: 24480000, date: '2026-07-15' }, { phase: 'Handover', amount: 12240000, date: '2026-10-30' }], updated_at: days(-20), approved_by_owner: true },
  { id: 'c4444444-0000-4000-8000-000000000001', project_id: P4, total_investment: 0, currency: 'INR', breakdown: { currency: 'INR', land: 0, construction: 0, design: 0, contingency: 0, total: 0 }, estimated_roi_percent: null, payment_schedule: [], updated_at: days(-6), approved_by_owner: false },
];

export const mockCommunications: Communication[] = [
  { id: 'd1111111-0000-4000-8000-000000000001', project_id: P1, communication_type: 'feasibility_sent', subject: 'Your Olive Koramangala Residences — Feasibility Study Ready', message: 'The detailed feasibility study for Olive Koramangala Residences is ready: 11-month program, ₹4.04 Cr total outlay, projected ROI 24.5%. Full report attached and available on your dashboard.', sent_by_email: 'harshit.s@oliveliving.com', sent_to_owner: true, sent_to_owner_at: days(-46), owner_read_at: days(-45), created_at: days(-46), metadata: { related_feasibility_id: 'f1111111-0000-4000-8000-000000000001' } },
  { id: 'd1111111-0000-4000-8000-000000000002', project_id: P1, communication_type: 'floor_plan_sent', subject: 'Floor Plan V2 — Cafe Expanded Per Your Feedback', message: 'Version 2 of the ground-floor plan incorporates your cafe expansion request (+60 sqft). Interactive 2D/3D views are live on the dashboard.', sent_by_email: 'sneha.rao@oliveliving.com', sent_to_owner: true, sent_to_owner_at: days(-14), owner_read_at: null, created_at: days(-15), metadata: { related_plan_id: 'b1111111-0000-4000-8000-000000000002' } },
  { id: 'd1111111-0000-4000-8000-000000000003', project_id: P1, communication_type: 'status_update', subject: 'Design Development 70% Complete', message: 'GFC drawing set is 70% complete. FF&E long-lead items shortlisted; procurement starts at design freeze next week.', sent_by_email: 'sneha.rao@oliveliving.com', sent_to_owner: false, sent_to_owner_at: null, owner_read_at: null, created_at: days(-3), metadata: null },
  { id: 'd2222222-0000-4000-8000-000000000001', project_id: P2, communication_type: 'status_update', subject: 'Structural Audit Cleared — Minor Retrofit Only', message: 'Good news: the structural audit cleared the asset with only minor retrofit (slab stiffening at F2 gym zone). Feasibility study generation triggered.', sent_by_email: 'arjun.nair@oliveliving.com', sent_to_owner: false, sent_to_owner_at: null, owner_read_at: null, created_at: days(-12), metadata: null },
  { id: 'd3333333-0000-4000-8000-000000000001', project_id: P3, communication_type: 'status_update', subject: 'Phase 2 Execution — Week 4 Progress', message: 'Rooftop F&B deck waterproofing complete; MEP second fix 60% done. On track for Oct handover.', sent_by_email: 'vikram.mehta@oliveliving.com', sent_to_owner: true, sent_to_owner_at: days(-5), owner_read_at: days(-4), created_at: days(-5), metadata: null },
  { id: 'd4444444-0000-4000-8000-000000000001', project_id: P4, communication_type: 'status_update', subject: 'Welcome to Olive Living — Document Collection Started', message: 'MOU signed. Our BD team has begun collecting title, sanction, and utility documents. You will receive the feasibility study automatically once documents are in.', sent_by_email: 'priya.k@oliveliving.com', sent_to_owner: true, sent_to_owner_at: days(-6), owner_read_at: null, created_at: days(-6), metadata: null },
];

export const mockTasks: TeamTask[] = [
  { id: 'e1111111-0000-4000-8000-000000000001', project_id: P4, task_owner_email: 'priya.k@oliveliving.com', task_title: 'Collect HSR title deed chain + EC', task_type: 'Document Procurement', description: 'Title chain 13 years + latest encumbrance certificate from owner counsel.', due_date: days(3), status: 'In Progress', created_at: days(-6), completed_at: null, priority: 'High', completion_notes: null },
  { id: 'e1111111-0000-4000-8000-000000000002', project_id: P4, task_owner_email: 'priya.k@oliveliving.com', task_title: 'Obtain BBMP sanctioned plan copy', task_type: 'Document Procurement', description: 'Certified copy of sanctioned plan for both towers.', due_date: days(-2), status: 'Overdue', created_at: days(-6), completed_at: null, priority: 'High', completion_notes: null },
  { id: 'e1111111-0000-4000-8000-000000000003', project_id: P4, task_owner_email: 'arjun.nair@oliveliving.com', task_title: 'Site survey — HSR twin towers', task_type: 'Site Survey', description: 'Full measurement survey + structural walkthrough with photos.', due_date: days(6), status: 'Not Started', created_at: days(-5), completed_at: null, priority: 'Medium', completion_notes: null },
  { id: 'e1111111-0000-4000-8000-000000000004', project_id: P1, task_owner_email: 'sneha.rao@oliveliving.com', task_title: 'Issue GFC drawing set', task_type: 'Specification', description: 'Freeze and issue Good-For-Construction set to PMC.', due_date: days(7), status: 'In Progress', created_at: days(-20), completed_at: null, priority: 'High', completion_notes: null },
  { id: 'e1111111-0000-4000-8000-000000000005', project_id: P1, task_owner_email: 'priya.k@oliveliving.com', task_title: 'Facade approval pre-submission meeting', task_type: 'Document Procurement', description: 'Schedule BBMP pre-submission consult with liaison architect.', due_date: days(-1), status: 'Overdue', created_at: days(-10), completed_at: null, priority: 'Medium', completion_notes: null },
  { id: 'e1111111-0000-4000-8000-000000000006', project_id: P1, task_owner_email: 'arjun.nair@oliveliving.com', task_title: 'Verify NW stairwell waterproofing scope', task_type: 'Site Survey', description: 'Confirm seepage extents; sign off Phase 1 waterproofing BOQ line.', due_date: days(-12), status: 'Done', created_at: days(-25), completed_at: days(-13), priority: 'Medium', completion_notes: 'Scope confirmed; 2 zones, 340 sqft membrane.' },
  { id: 'e1111111-0000-4000-8000-000000000007', project_id: P2, task_owner_email: 'priya.k@oliveliving.com', task_title: 'Anchor tenant LOI shortlist', task_type: 'Document Procurement', description: 'Shortlist 3 anchor candidates; obtain at least 1 LOI before capex gate.', due_date: days(10), status: 'In Progress', created_at: days(-8), completed_at: null, priority: 'High', completion_notes: null },
  { id: 'e1111111-0000-4000-8000-000000000008', project_id: P2, task_owner_email: 'arjun.nair@oliveliving.com', task_title: 'Slab load test — F2 gym zone', task_type: 'Site Survey', description: 'Load test and retrofit recommendation for gym tenant slab.', due_date: days(-4), status: 'Done', created_at: days(-14), completed_at: days(-5), priority: 'Medium', completion_notes: 'Retrofit: stiffening plates 12 sqm. Report filed.' },
  { id: 'e1111111-0000-4000-8000-000000000009', project_id: P3, task_owner_email: 'vikram.mehta@oliveliving.com', task_title: 'MEP second-fix inspection', task_type: 'Site Survey', description: 'Inspect second fix vs drawings; punch list to contractor.', due_date: days(2), status: 'In Progress', created_at: days(-7), completed_at: null, priority: 'High', completion_notes: null },
  { id: 'e1111111-0000-4000-8000-000000000010', project_id: P3, task_owner_email: 'sneha.rao@oliveliving.com', task_title: 'Rooftop F&B furniture package sign-off', task_type: 'Specification', description: 'Final vendor sign-off for loose furniture; 6-week lead.', due_date: days(5), status: 'Not Started', created_at: days(-4), completed_at: null, priority: 'Medium', completion_notes: null },
  { id: 'e1111111-0000-4000-8000-000000000011', project_id: P3, task_owner_email: 'vikram.mehta@oliveliving.com', task_title: 'Facade lighting mockup approval', task_type: 'Specification', description: 'Night mockup for owner approval.', due_date: days(-20), status: 'Done', created_at: days(-35), completed_at: days(-21), priority: 'Low', completion_notes: 'Approved with 2700K revision.' },
  { id: 'e1111111-0000-4000-8000-000000000012', project_id: P5, task_owner_email: 'vikram.mehta@oliveliving.com', task_title: 'Handover snag closure', task_type: 'Site Survey', description: 'Close 14 snag items and file handover certificate.', due_date: days(-8), status: 'Done', created_at: days(-30), completed_at: days(-9), priority: 'High', completion_notes: 'All snags closed; certificate signed.' },
];

export const mockProjections: Projection[] = [
  { id: '91111111-0000-4000-8000-000000000001', project_id: null, projection_type: 'Timeline', projection_title: 'Portfolio Timeline Projection — Q3 FY27', data: { confidence_level: 0.82, insights: ['Koramangala tracks to Apr 2027 opening if GFC freezes on schedule', 'Jubilee Hills holds Oct 2026 handover with 9 days float', 'Indiranagar timeline gated on anchor LOI (stage-gate)'], per_project: [{ project: 'Olive Koramangala Residences', expected_completion: '2027-04-30', months_remaining: 10 }, { project: 'Olive Jubilee Hills Villa Renovation', expected_completion: '2026-10-30', months_remaining: 4 }, { project: 'Olive Indiranagar Commercial Hub', expected_completion: '2027-02-15', months_remaining: 7 }] }, generated_at: days(-2), generated_from_projects: [P1, P2, P3], recipients_emails: ['akashsakhrani05@gmail.com'] },
  { id: '91111111-0000-4000-8000-000000000002', project_id: null, projection_type: 'Budget', projection_title: 'Portfolio Budget Projection — ₹12.52 Cr Committed', data: { confidence_level: 0.78, committed_total_inr: 125220000, projected_spend_inr: 129850000, variance_percent: 3.7, insights: ['Variance driven by FF&E import lead-time premiums (Koramangala)', 'Jubilee Hills Phase 2 tracking on budget', 'Cost per key trending ₹12.6L vs ₹11.9L plan'] }, generated_at: days(-2), generated_from_projects: [P1, P2, P3], recipients_emails: ['akashsakhrani05@gmail.com'] },
  { id: '91111111-0000-4000-8000-000000000003', project_id: null, projection_type: 'ROI', projection_title: 'Portfolio ROI Projection — Blended 23.8%', data: { confidence_level: 0.74, blended_roi_percent: 23.8, best: { project: 'Olive Jubilee Hills Villa Renovation', roi: 27.2 }, worst: { project: 'Olive Indiranagar Commercial Hub', roi: 19.8 }, scenarios: { bear: 18.2, base: 23.8, bull: 28.9 }, insights: ['Boutique renovation assets outperform on ROI', 'Commercial mixed-use drags blended ROI until anchor secured'] }, generated_at: days(-2), generated_from_projects: [P1, P2, P3], recipients_emails: ['akashsakhrani05@gmail.com'] },
  { id: '91111111-0000-4000-8000-000000000004', project_id: null, projection_type: 'Risk', projection_title: 'Portfolio Risk Projection — 2 High-Attention Items', data: { confidence_level: 0.8, top_risks: [{ risk: 'BBMP facade approval delay (Koramangala)', likelihood: 'Medium', impact: 'High', mitigation: 'Pre-submission consult booked' }, { risk: 'Anchor LOI slip (Indiranagar)', likelihood: 'Medium', impact: 'High', mitigation: 'Capex stage-gate enforced' }, { risk: 'Monsoon delay rooftop works (Jubilee Hills)', likelihood: 'Low', impact: 'Medium', mitigation: 'Waterproofing complete' }, { risk: 'Document procurement lag (HSR)', likelihood: 'High', impact: 'Medium', mitigation: '2 overdue BD tasks escalated' }, { risk: 'FF&E import lead times', likelihood: 'Medium', impact: 'Medium', mitigation: 'Domestic alternates listed' }] }, generated_at: days(-2), generated_from_projects: [P1, P2, P3, P4], recipients_emails: ['akashsakhrani05@gmail.com'] },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'aa111111-0000-4000-8000-000000000001', user_email: 'harshit.s@oliveliving.com', action: 'login', table_name: null, record_id: null, old_values: null, new_values: { success: true }, timestamp: days(-1), ip_address: '203.0.113.10' },
  { id: 'aa111111-0000-4000-8000-000000000002', user_email: 'harshit.s@oliveliving.com', action: 'send_to_owner', table_name: 'communications', record_id: 'd1111111-0000-4000-8000-000000000001', old_values: null, new_values: { mode: 'tester', from: 'theopenhotels@gmail.com', to: 'akashsakhrani05@gmail.com' }, timestamp: days(-46), ip_address: '203.0.113.10' },
  { id: 'aa111111-0000-4000-8000-000000000003', user_email: 'sneha.rao@oliveliving.com', action: 'generate_floor_plan', table_name: 'floor_plans', record_id: 'b1111111-0000-4000-8000-000000000002', old_values: null, new_values: { version: 2 }, timestamp: days(-15), ip_address: '203.0.113.22' },
];
