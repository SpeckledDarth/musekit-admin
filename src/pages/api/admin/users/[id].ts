import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAuditEvent } from "@/lib/audit-log";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await verifyAdmin(req, res);
  if (!admin) return;

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "User ID required" });
  }

  try {
    const supabase = createSupabaseAdmin();

    if (req.method === "GET") {
      const profileRes = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      const profile = profileRes.data;

      const [subRes, activityRes, teamRes, notesRes, invitesRes] = await Promise.all([
        supabase
          .from("muse_product_subscriptions")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("audit_logs")
          .select("*")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
        profile?.organization_id
          ? supabase
              .from("organization_members")
              .select("*")
              .eq("organization_id", profile.organization_id)
              .limit(50)
          : Promise.resolve({ data: [] }),
        supabase
          .from("audit_logs")
          .select("*")
          .eq("resource_type", "admin_note")
          .eq("resource_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
        profile?.organization_id
          ? supabase
              .from("invitations")
              .select("*")
              .eq("organization_id", profile.organization_id)
              .eq("status", "pending")
              .order("created_at", { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [] }),
      ]);

      res.status(200).json({
        profile,
        subscription:
          subRes.data && subRes.data.length > 0 ? subRes.data[0] : null,
        activity: activityRes.data || [],
        teamMembers: teamRes.data || [],
        pendingInvites: invitesRes.data || [],
        notes: (notesRes.data || []).map(
          (log: Record<string, unknown>) => ({
            id: log.id,
            user_id: id,
            admin_id: log.user_id || "",
            note:
              (log.metadata as Record<string, string>)?.note || log.action,
            created_at: log.created_at,
          })
        ),
      });
    } else if (req.method === "POST") {
      const admin = await verifyAdmin(req, res);
      if (!admin) return;

      const { action, note, email, role, memberId, inviteId } = req.body;

      if (action === "add_note") {
        await supabase.from("audit_logs").insert({
          user_id: admin.userId,
          action: "admin_note_added",
          resource_type: "admin_note",
          resource_id: id,
          metadata: { note },
        });
        res.status(200).json({ success: true });
      } else if (action === "impersonate") {
        await supabase.from("audit_logs").insert({
          user_id: admin.userId,
          action: "user_impersonation_started",
          resource_type: "user",
          resource_id: id,
          metadata: {
            admin_id: admin.userId,
            admin_email: admin.email,
            target_user_id: id,
            session_duration_minutes: 30,
          },
        });
        res.status(200).json({ success: true });
      } else if (action === "invite_member") {
        if (!email || !role) {
          return res.status(400).json({ error: "Email and role are required" });
        }

        const profileRes = await supabase
          .from("profiles")
          .select("id, organization_id")
          .eq("id", id)
          .single();

        const orgId = profileRes.data?.organization_id;

        const token = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const inviteData = {
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          organization_id: orgId || id,
          email,
          role,
          status: "pending",
          invited_by: admin.userId,
          created_at: new Date().toISOString(),
          token,
          expires_at: expiresAt,
        };

        if (orgId) {
          await supabase.from("invitations").insert(inviteData);
        }

        await supabase.from("audit_logs").insert({
          user_id: admin.userId,
          action: "team_member_invited",
          resource_type: "team_invite",
          resource_id: id,
          metadata: { email, role, organization_id: orgId },
        });

        res.status(200).json({ success: true, inviteId: inviteData.id });
      } else if (action === "change_role") {
        if (!memberId || !role) {
          return res.status(400).json({ error: "Member ID and role are required" });
        }

        await supabase
          .from("organization_members")
          .update({ role })
          .eq("id", memberId);

        await supabase.from("audit_logs").insert({
          user_id: admin.userId,
          action: "team_member_role_changed",
          resource_type: "team_member",
          resource_id: memberId,
          metadata: { new_role: role, target_user_id: id },
        });

        res.status(200).json({ success: true });
      } else if (action === "remove_member") {
        if (!memberId) {
          return res.status(400).json({ error: "Member ID is required" });
        }

        await supabase
          .from("organization_members")
          .delete()
          .eq("id", memberId);

        await supabase.from("audit_logs").insert({
          user_id: admin.userId,
          action: "team_member_removed",
          resource_type: "team_member",
          resource_id: memberId,
          metadata: { target_user_id: id },
        });

        res.status(200).json({ success: true });
      } else if (action === "revoke_invite") {
        if (!inviteId) {
          return res.status(400).json({ error: "Invite ID is required" });
        }

        await supabase
          .from("invitations")
          .delete()
          .eq("id", inviteId);

        await supabase.from("audit_logs").insert({
          user_id: admin.userId,
          action: "team_invite_revoked",
          resource_type: "team_invite",
          resource_id: inviteId,
          metadata: { target_user_id: id },
        });

        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ error: "Unknown action" });
      }
    } else if (req.method === "PUT") {
      const { full_name, email, role, status } = req.body;
      const updates: Record<string, string> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (email !== undefined) updates.email = email;
      if (role !== undefined) updates.role = role;
      if (status !== undefined) updates.status = status;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const { data: before } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      updates.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      await logAuditEvent("user_profile_updated", admin.userId, {
        resource_type: "user",
        resource_id: id,
        before: before || {},
        after: updates,
      });

      const { data: updated } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      res.status(200).json({ profile: updated });
    } else if (req.method === "DELETE") {
      const { data: before } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await logAuditEvent("user_deleted", admin.userId, {
        resource_type: "user",
        resource_id: id,
        before: before || {},
      });

      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("User detail API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
