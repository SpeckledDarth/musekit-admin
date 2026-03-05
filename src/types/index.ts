export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin" | "super_admin";
  status: "active" | "inactive" | "suspended" | "pending";
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  organization_id: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  joined_at: string;
  profile?: Profile;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  type: string;
  message: string;
  rating: number | null;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
}

export interface AdminNote {
  id: string;
  user_id: string;
  admin_id: string;
  note: string;
  created_at: string;
  admin_profile?: Profile;
}

export interface MetricCard {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
}

export interface AlertThreshold {
  metric: string;
  operator: ">" | "<" | ">=" | "<=";
  value: number;
  enabled: boolean;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_email?: string;
  assigned_to?: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category?: string;
  ticket_number?: string;
  nps_score?: number;
  admin_response?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
}
