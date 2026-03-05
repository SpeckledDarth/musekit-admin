"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/hooks/useAdmin";
import { formatDate, timeAgo } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Subscription, Notification, AuditLog } from "@/types";
import {
  CreditCard,
  Bell,
  Activity,
  UserCog,
  Receipt,
  MessageSquarePlus,
  Headset,
  CheckCircle2,
  Circle,
  BellOff,
  Clock,
} from "lucide-react";

export interface UserDashboardProps {
  onAction?: (action: string) => void;
}

const statusVariantMap: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  active: "success",
  trialing: "secondary",
  past_due: "warning",
  canceled: "destructive",
  incomplete: "default",
};

function SubscriptionCard({ subscription, loading }: { subscription: Subscription | null; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active subscription found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{subscription.plan}</span>
          <Badge variant={statusVariantMap[subscription.status] || "default"}>
            {subscription.status}
          </Badge>
        </div>
        {subscription.current_period_start && subscription.current_period_end && (
          <div className="text-sm text-muted-foreground">
            <p>Current period: {formatDate(subscription.current_period_start)} – {formatDate(subscription.current_period_end)}</p>
            {subscription.status === "active" && (
              <p>Renews {formatDate(subscription.current_period_end)}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationFeed({
  notifications,
  loading,
  onMarkAllRead,
}: {
  notifications: Notification[];
  loading: boolean;
  onMarkAllRead: () => void;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="No notifications"
            description="You're all caught up!"
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-md p-2 ${!n.read ? "bg-muted/50" : ""}`}
              >
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {timeAgo(n.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityTimeline({ logs, loading }: { logs: AuditLog[]; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No recent activity"
            description="Your activity will show up here."
          />
        ) : (
          <div className="relative space-y-0">
            {logs.map((log, idx) => (
              <div key={log.id} className="flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
                    <Circle className="h-2 w-2 fill-primary text-primary" />
                  </div>
                  {idx < logs.length - 1 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm">
                    <span className="font-medium">{log.action}</span>
                    {log.resource_type && (
                      <span className="text-muted-foreground"> on {log.resource_type}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{timeAgo(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const quickActions = [
  { action: "edit-profile", label: "Edit Profile", icon: UserCog },
  { action: "view-billing", label: "View Billing", icon: Receipt },
  { action: "submit-feedback", label: "Submit Feedback", icon: MessageSquarePlus },
  { action: "contact-support", label: "Contact Support", icon: Headset },
];

function QuickActions({ onAction }: { onAction?: (action: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ action, label, icon: Icon }) => (
            <button
              key={action}
              onClick={() => onAction?.(action)}
              className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChecklistItem {
  label: string;
  done: boolean;
}

function GettingStartedChecklist({
  items,
  loading,
}: {
  items: ChecklistItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-3" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-6 w-48" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Getting Started</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{completed} of {total} complete</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={item.done ? "text-muted-foreground line-through" : ""}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function UserDashboard({ onAction }: UserDashboardProps) {
  const { user, loading: userLoading } = useAdmin();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [notiLoading, setNotiLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubLoading(false);
      setNotiLoading(false);
      setLogLoading(false);
      return;
    }

    async function fetchSubscription() {
      try {
        const { data } = await supabase
          .from("muse_product_subscriptions")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setSubscription(data as Subscription | null);
      } catch (err) {
        console.error("Error fetching subscription:", err);
      } finally {
        setSubLoading(false);
      }
    }

    async function fetchNotifications() {
      try {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(10);
        setNotifications((data as Notification[]) || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setNotiLoading(false);
      }
    }

    async function fetchAuditLogs() {
      try {
        const { data } = await supabase
          .from("audit_logs")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(20);
        setAuditLogs((data as AuditLog[]) || []);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
      } finally {
        setLogLoading(false);
      }
    }

    fetchSubscription();
    fetchNotifications();
    fetchAuditLogs();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("Error marking notifications as read:", error);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const checklistItems: ChecklistItem[] = React.useMemo(() => {
    if (!user) return [];
    return [
      { label: "Complete your profile", done: !!(user.full_name && user.avatar_url) },
      { label: "Verify your email", done: !!user.email },
      { label: "First login", done: !!user.last_sign_in_at },
      { label: "Activate a subscription", done: !!(subscription && subscription.status === "active") },
      { label: "Create an organization", done: !!user.organization_id },
    ];
  }, [user, subscription]);

  if (userLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Avatar
          src={user?.avatar_url}
          fallback={user?.full_name || user?.email || "U"}
          size="lg"
        />
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SubscriptionCard subscription={subscription} loading={subLoading} />
        <QuickActions onAction={onAction} />
        <NotificationFeed
          notifications={notifications}
          loading={notiLoading}
          onMarkAllRead={handleMarkAllRead}
        />
        <ActivityTimeline logs={auditLogs} loading={logLoading} />
        <div className="md:col-span-2">
          <GettingStartedChecklist items={checklistItems} loading={subLoading && userLoading} />
        </div>
      </div>
    </div>
  );
}
