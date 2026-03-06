"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb } from "@/layout/Breadcrumb";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";
import { formatDate, timeAgo } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";
import {
  ArrowLeft,
  Ticket,
  MessageSquare,
  Clock,
  User,
  Trash2,
  CheckCircle,
  RotateCcw,
  Send,
} from "lucide-react";
import type { SupportTicket } from "@/types";

interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

const priorityVariant: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  low: "secondary",
  medium: "outline",
  high: "warning",
  urgent: "destructive",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  open: "warning",
  in_progress: "default",
  resolved: "success",
  closed: "secondary",
};

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAdmin();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [updating, setUpdating] = useState(false);

  const [commentBody, setCommentBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchTicket();
  }, [id]);

  async function fetchTicket() {
    setLoading(true);
    try {
      const res = await fetch(`/admin/api/admin/customer-service/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch ticket");
      const data = await res.json();
      setTicket(data.ticket);
      setComments(data.comments || []);
      setEditStatus(data.ticket.status);
      setEditPriority(data.ticket.priority);
    } catch (error) {
      toast.error("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!ticket) return;
    setUpdating(true);
    try {
      const res = await fetch(`/admin/api/admin/customer-service/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          priority: editPriority,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setTicket(data.ticket);
      toast.success("Ticket updated");
    } catch (error) {
      toast.error("Failed to update ticket");
    } finally {
      setUpdating(false);
    }
  }

  async function handleAssignToMe() {
    if (!ticket || !user) return;
    setUpdating(true);
    try {
      const res = await fetch(`/admin/api/admin/customer-service/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: user.id }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      const data = await res.json();
      setTicket(data.ticket);
      toast.success("Ticket assigned to you");
    } catch (error) {
      toast.error("Failed to assign ticket");
    } finally {
      setUpdating(false);
    }
  }

  async function handleAddComment() {
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/admin/api/admin/customer-service/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_comment",
          body: commentBody,
          is_internal: isInternal,
        }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setCommentBody("");
      setIsInternal(false);
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleCloseTicket() {
    setShowCloseDialog(false);
    setUpdating(true);
    try {
      const res = await fetch(`/admin/api/admin/customer-service/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (!res.ok) throw new Error("Failed to close");
      const data = await res.json();
      setTicket(data.ticket);
      setEditStatus("closed");
      toast.success("Ticket closed");
    } catch (error) {
      toast.error("Failed to close ticket");
    } finally {
      setUpdating(false);
    }
  }

  async function handleReopenTicket() {
    setUpdating(true);
    try {
      const res = await fetch(`/admin/api/admin/customer-service/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      });
      if (!res.ok) throw new Error("Failed to reopen");
      const data = await res.json();
      setTicket(data.ticket);
      setEditStatus("open");
      toast.success("Ticket reopened");
    } catch (error) {
      toast.error("Failed to reopen ticket");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteTicket() {
    setShowDeleteDialog(false);
    try {
      const res = await fetch(`/admin/api/admin/customer-service/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Ticket deleted");
      router.push("/customer-service");
    } catch (error) {
      toast.error("Failed to delete ticket");
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Ticket... - MuseKit Admin</title>
        </Head>
        <div className="space-y-6">
          <Breadcrumb />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (notFound || !ticket) {
    return (
      <>
        <Head>
          <title>Ticket Not Found - MuseKit Admin</title>
        </Head>
        <div className="space-y-6">
          <Breadcrumb />
          <Link href="/customer-service">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customer Service
            </Button>
          </Link>
          <EmptyState
            icon={Ticket}
            title="Ticket Not Found"
            description="The ticket you're looking for doesn't exist or has been deleted."
            actionLabel="Go to Customer Service"
            onAction={() => router.push("/customer-service")}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{ticket.subject} - MuseKit Admin</title>
      </Head>

      <div className="space-y-6">
        <Breadcrumb />

        <Link href="/customer-service">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customer Service
          </Button>
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {ticket.ticket_number && (
                <Badge variant="outline">{ticket.ticket_number}</Badge>
              )}
              <Badge variant={statusVariant[ticket.status]}>
                {ticket.status.replace("_", " ")}
              </Badge>
              <Badge variant={priorityVariant[ticket.priority]}>
                {ticket.priority}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {timeAgo(ticket.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md border">
                    {ticket.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User Email</p>
                    <p className="text-sm">{ticket.user_email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <p className="text-sm">{ticket.category || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">{formatDate(ticket.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Updated</p>
                    <p className="text-sm">{formatDate(ticket.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-md border ${
                          comment.is_internal
                            ? "bg-amber-50 border-amber-200"
                            : "bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">
                              {comment.user_id}
                            </span>
                            {comment.is_internal && (
                              <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                                Internal
                              </Badge>
                            )}
                          </div>
                          <span
                            className="text-xs text-muted-foreground cursor-help"
                            title={formatDate(comment.created_at)}
                          >
                            {timeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4 space-y-3">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-input"
                      />
                      Internal note
                    </label>
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={submittingComment || !commentBody.trim()}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {submittingComment ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status & Priority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Priority</label>
                  <Select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Assigned To</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {ticket.assigned_to || "Unassigned"}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleAssignToMe}>
                      Assign to Me
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleUpdate}
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Update"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.status !== "closed" && ticket.status !== "resolved" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowCloseDialog(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Close Ticket
                  </Button>
                )}
                {(ticket.status === "closed" || ticket.status === "resolved") && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleReopenTicket}
                    disabled={updating}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reopen Ticket
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Ticket
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showCloseDialog}
        onConfirm={handleCloseTicket}
        onCancel={() => setShowCloseDialog(false)}
        title="Close Ticket"
        message="Are you sure you want to close this ticket?"
        confirmText="Close"
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onConfirm={handleDeleteTicket}
        onCancel={() => setShowDeleteDialog(false)}
        title="Delete Ticket"
        message="Are you sure you want to permanently delete this ticket? This action cannot be undone."
        confirmText="Delete"
        destructive
      />
    </>
  );
}
