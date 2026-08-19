// ---- Auth Types ----
export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  role_id: number;
  role: Role;
  territory_id?: number;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ---- Customer Types ----
export interface CustomerContact {
  id: number;
  customer_id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  is_primary: boolean;
  customer_name?: string;
  created_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  industry?: string;
  region?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  status?: string;
  annual_revenue?: number;
  employee_count?: number;
  owner_id?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  contacts?: CustomerContact[];
}

// ---- Lead Types ----
export interface Lead {
  id: number;
  title: string;
  customer_id?: number;
  assigned_to?: number;
  status: string;
  source?: string;
  priority?: string;
  estimated_value?: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_name?: string;
  notes?: string;
  campaign_id?: number;
  assignment_date?: string;
  created_at?: string;
  updated_at?: string;
}

// ---- Opportunity Types ----
export interface Opportunity {
  id: number;
  name: string;
  customer_id: number;
  owner_id: number;
  lead_id?: number;
  deal_value: number;
  stage: string;
  status: string;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  loss_reason?: string;
  competitor_id?: number;
  notes?: string;
  customer_name?: string;
  owner_name?: string;
  competitor_name?: string;
  created_at?: string;
  updated_at?: string;
}

// ---- Activity Types ----
export interface Activity {
  id: number;
  title: string;
  activity_type?: string;
  type?: string;
  status: string;
  user_id?: number;
  customer_id?: number;
  contact_id?: number;
  opportunity_id?: number;
  scheduled_date?: string;
  scheduled_at?: string;
  completed_date?: string;
  follow_up_date?: string;
  duration_minutes?: number;
  location?: string;
  description?: string;
  notes?: string;
  outcome?: string;
  customer_name?: string;
  contact_name?: string;
  user_name?: string;
  created_at?: string;
  updated_at?: string;
}

// ---- Sales Target Types ----
export interface SalesTarget {
  id: number;
  user_id: number;
  period: string;
  target_amount: number;
  achieved_amount: number;
  start_date: string;
  end_date: string;
  created_at?: string;
}

// ---- Discount Request Types ----
export interface DiscountRequest {
  id: number;
  opportunity_id: number;
  requester_id?: number;
  requested_by?: number;
  approver_id?: number;
  reviewer_id?: number;
  requested_discount?: number;
  discount_percent?: number;
  original_value?: number;
  original_price?: number;
  discounted_value?: number;
  discounted_price?: number;
  reason: string;
  status: string;
  manager_comments?: string;
  reviewer_notes?: string;
  approved_at?: string;
  created_at?: string;
}

// ---- Territory Types ----
export interface Territory {
  id: number;
  name: string;
  region: string;
  description?: string;
  manager_id?: number;
  created_at?: string;
}

// ---- Account Types ----
export interface Account {
  id: number;
  customer_id: number;
  manager_id: number;
  account_type?: string;
  health_score?: number;
  contract_value?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  notes?: string;
  created_at?: string;
}

// ---- Campaign Types ----
export interface Campaign {
  id: number;
  name: string;
  description?: string;
  campaign_type?: string;
  type?: string;
  status?: string;
  budget?: number;
  actual_cost?: number;
  actual_spend?: number;
  start_date?: string;
  end_date?: string;
  target_leads?: number;
  leads_count?: number;
  owner_id?: number;
  revenue_generated?: number;
  created_at?: string;
}

// ---- Product Types ----
export interface Product {
  id: number;
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  price?: number;
  base_price?: number;
  is_active?: boolean | number;
  created_at?: string;
}

export interface ProductUpdate {
  id: number;
  product_id: number;
  title: string;
  version?: string;
  description?: string;
  release_date?: string;
  roadmap_status?: string;
  created_at?: string;
}

export interface CustomerFeedback {
  id: number;
  customer_id: number;
  product_id?: number;
  recorded_by?: number;
  feedback: string;
  rating?: number;
  source?: string;
  status?: string;
  feedback_date: string;
  created_at?: string;
}

export interface FeatureRequest {
  id: number;
  customer_id: number;
  product_id?: number;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  business_impact?: string;
  requested_date: string;
  created_at?: string;
}

export interface ProductDocument {
  id: number;
  product_id: number;
  title: string;
  category?: string;
  description?: string;
  content?: string;
  version?: string;
  status?: string;
  created_at?: string;
}

export interface Competitor {
  id: number;
  name: string;
  website?: string;
  description?: string;
  strengths?: string;
  weaknesses?: string;
  created_at?: string;
}

// ---- Paginated Response ----
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ---- Dashboard Types ----
export interface SalesRepDashboard {
  revenue: number;
  target: number;
  achievement_pct: number;
  open_opportunities: number;
  pipeline_value: number;
  upcoming_activities: number;
  won_deals: number;
  lost_deals: number;
  win_rate: number;
}

export interface ManagerDashboard {
  team_revenue: number;
  team_target: number;
  achievement_pct: number;
  pipeline_value: number;
  win_rate: number;
  pending_discounts: number;
  total_won: number;
  total_lost: number;
  rep_performance: { id: number; name: string; revenue: number; deals: number }[];
}

export interface ExecutiveDashboard {
  total_revenue: number;
  total_deals: number;
  won_deals: number;
  lost_deals: number;
  win_rate: number;
  avg_deal_size: number;
  pipeline_value: number;
  weighted_pipeline: number;
  target_achievement: number;
  revenue_by_region: { region: string; revenue: number; deals: number }[];
  pipeline_by_stage: { stage: string; count: number; value: number }[];
  competitive_data: { competitor: string; wins: number; losses: number }[];
}
