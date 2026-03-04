"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sliders,
  ToggleLeft,
  HeadsetIcon,
  TrendingUp,
  DollarSign,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard, section: "Main" },
  { label: "Users", href: "/users", icon: Users, section: "Main" },
  { label: "Metrics", href: "/metrics", icon: BarChart3, section: "Main" },
  { label: "Audit Log", href: "/audit-log", icon: ScrollText, section: "Main" },
  { label: "Revenue", href: "/revenue", icon: DollarSign, section: "Main" },
  { label: "Setup Dashboard", href: "/setup", icon: Sliders, section: "Configuration" },
  { label: "Feature Toggles", href: "/feature-toggles", icon: ToggleLeft, section: "Configuration" },
  { label: "Customer Service", href: "/customer-service", icon: HeadsetIcon, section: "Tools" },
  { label: "Onboarding", href: "/onboarding", icon: TrendingUp, section: "Tools" },
  { label: "Settings", href: "/settings", icon: Settings, section: "System" },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AdminSidebar({ collapsed = false, onToggle }: AdminSidebarProps) {
  const router = useRouter();

  const sections = Array.from(new Set(navItems.map((item) => item.section)));

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300 h-screen sticky top-0 overflow-y-auto",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Admin</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {sections.map((section) => (
          <div key={section}>
            {!collapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section}
              </p>
            )}
            {navItems
              .filter((item) => item.section === section)
              .map((item) => {
                const isActive =
                  router.pathname === item.href ||
                  (item.href !== "/" && router.pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t">
        {!collapsed && (
          <p className="text-xs text-muted-foreground">MuseKit Admin v1.0</p>
        )}
      </div>
    </aside>
  );
}
