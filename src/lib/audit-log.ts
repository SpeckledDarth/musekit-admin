import { getSupabaseAdmin } from "./supabase";

interface AuditDetails {
  resource_type?: string;
  resource_id?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  [key: string]: any;
}

async function logAuditEvent(
  action: string,
  userId: string,
  details: AuditDetails,
  ipAddress?: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const insertData: Record<string, any> = {
      action,
      user_id: userId,
      details,
    };
    if (ipAddress) {
      insertData.ip_address = ipAddress;
    }
    await supabase.from("audit_logs").insert(insertData);
  } catch (error) {
    console.error("[audit-log] Failed to write audit event:", error);
  }
}

export { logAuditEvent };
export type { AuditDetails };
