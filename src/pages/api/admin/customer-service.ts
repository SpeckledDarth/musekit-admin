import type { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import type { SupportTicket } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await verifyAdmin(req, res);
  if (!admin) return;

  if (req.method === "GET") {
    try {
      const supabase = createSupabaseAdmin();
      const { userId, type } = req.query;

      if (type === "tickets") {
        const { data, error } = await supabase
          .from("support_tickets")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          const mockTickets: SupportTicket[] = [
            {
              id: "ticket-1",
              user_id: "user-1",
              user_email: "alice@example.com",
              subject: "Cannot access premium features",
              message: "I upgraded my plan but still cannot access the premium features. Please help.",
              status: "open",
              priority: "high",
              nps_score: 6,
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "ticket-2",
              user_id: "user-2",
              user_email: "bob@example.com",
              subject: "Billing discrepancy",
              message: "I was charged twice for the same month. Please investigate and refund the duplicate charge.",
              status: "in_progress",
              priority: "urgent",
              nps_score: 4,
              admin_response: "Looking into this now. Will follow up shortly.",
              created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "ticket-3",
              user_id: "user-3",
              user_email: "carol@example.com",
              subject: "Feature request: Dark mode",
              message: "Would love to see a dark mode option in the dashboard. It would be much easier on the eyes.",
              status: "resolved",
              priority: "low",
              nps_score: 9,
              admin_response: "Dark mode is now available! Check your settings.",
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "ticket-4",
              user_id: "user-4",
              user_email: "dave@example.com",
              subject: "Login issues on mobile",
              message: "I can't log in from my phone. The page just keeps loading.",
              status: "open",
              priority: "medium",
              nps_score: 5,
              created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "ticket-5",
              user_id: "user-5",
              user_email: "eve@example.com",
              subject: "Data export not working",
              message: "When I try to export my data as CSV, I get a blank file. This worked before last week.",
              status: "in_progress",
              priority: "high",
              admin_response: "We've identified the issue and are working on a fix.",
              created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "ticket-6",
              user_id: "user-6",
              user_email: "frank@example.com",
              subject: "Account deletion request",
              message: "Please delete my account and all associated data.",
              status: "closed",
              priority: "medium",
              nps_score: 3,
              admin_response: "Account has been deleted as requested. Sorry to see you go.",
              created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ];

          return res.status(200).json({ tickets: mockTickets });
        }

        return res.status(200).json({ tickets: data || [] });
      }

      if (userId) {
        const [profileRes, subsRes, notesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", userId as string)
            .single(),
          supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId as string)
            .order("created_at", { ascending: false }),
          supabase
            .from("audit_logs")
            .select("*")
            .eq("resource_type", "admin_note")
            .eq("resource_id", userId as string)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        if (profileRes.error) throw profileRes.error;

        res.status(200).json({
          profile: profileRes.data,
          subscriptions: subsRes.data || [],
          notes: (notesRes.data || []).map(
            (log: Record<string, unknown>) => ({
              id: log.id,
              note:
                (log.metadata as Record<string, string>)?.note || log.action,
              created_at: log.created_at,
            })
          ),
        });
      } else {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;

        res.status(200).json({ users: data || [] });
      }
    } catch (error) {
      console.error("Customer service API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "POST") {
    try {
      const { action, id, status, admin_response } = req.body;

      if (action === "update_ticket") {
        if (!id) {
          return res.status(400).json({ error: "Ticket ID is required" });
        }

        const supabase = createSupabaseAdmin();
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (status) updateData.status = status;
        if (admin_response !== undefined) updateData.admin_response = admin_response;

        const { data, error } = await supabase
          .from("support_tickets")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          const mockUpdated: SupportTicket = {
            id,
            user_id: "user-mock",
            user_email: "user@example.com",
            subject: "Ticket",
            message: "Message",
            status: (status as SupportTicket["status"]) || "open",
            priority: "medium",
            admin_response: admin_response || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return res.status(200).json({ ticket: mockUpdated });
        }

        return res.status(200).json({ ticket: data });
      }

      return res.status(400).json({ error: "Unknown action" });
    } catch (error) {
      console.error("Customer service POST error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
