// Database row types — mirrors Supabase table schemas

export interface PanelApiKey {
  id: string;
  key_hash: string;
  product_key: string;
  max_tier: "guest" | "contractor" | "team";
  owner_github_login: string;
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface PanelUserRole {
  id: string;
  github_login: string;
  role: "guest" | "contractor" | "team" | "admin";
  product_key: string;
  granted_by: string;
  expires_at: string | null;
  created_at: string;
}

export interface PanelSubmission {
  id: string;
  product_key: string;
  github_login: string | null;
  tier: string;
  transcript: unknown; // jsonb
  metadata: unknown; // jsonb
  console_errors: unknown | null; // jsonb
  screenshot_url: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

export interface PanelIssue {
  id: string;
  submission_id: string;
  github_issue_number: number | null;
  github_issue_url: string | null;
  plain_summary: string;
  technical_details: unknown; // jsonb
  labels: string[] | null;
  created_at: string;
}
