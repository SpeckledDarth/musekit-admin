"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase";
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
  Paintbrush,
  FileText,
  File as FileIcon,
  CreditCard,
  Share2,
  Puzzle,
  Key,
  Mail,
  Bot,
  ShieldCheck,
  MessageSquare,
  Palette,
  Megaphone,
  LogOut,
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

const setupSubItems: NavItem[] = [
  { label: "Branding", href: "/setup/branding", icon: Paintbrush },
  { label: "Content", href: "/setup/content", icon: FileText },
  { label: "Pages", href: "/setup/pages", icon: FileIcon },
  { label: "Pricing", href: "/setup/pricing", icon: CreditCard },
  { label: "Social Links", href: "/setup/social", icon: Share2 },
  { label: "Features", href: "/setup/features", icon: Puzzle },
  { label: "API Keys", href: "/setup/api-keys", icon: Key },
  { label: "Email Templates", href: "/setup/email", icon: Mail },
  { label: "AI / Support", href: "/setup/ai", icon: Bot },
  { label: "Security", href: "/setup/security", icon: ShieldCheck },
  { label: "Testimonials", href: "/setup/testimonials", icon: MessageSquare },
  { label: "CSS Dashboard", href: "/setup/css-dashboard", icon: Palette },
  { label: "PassivePost", href: "/setup/passivepost", icon: Megaphone },
];

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AdminSidebar({ collapsed = false, onToggle }: AdminSidebarProps) {
  const pathname = usePathname() ?? "/";
  const { user } = useAdmin();

  const sections = Array.from(new Set(navItems.map((item) => item.section)));
  const isSetupRoute = pathname.startsWith("/setup");

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-200 h-screen sticky top-0 overflow-y-auto",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-[15px]">Admin</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "p-1.5 rounded-md hover:bg-muted transition-colors duration-150",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 px-2 py-2">
        {sections.map((section, sectionIndex) => (
          <div key={section}>
            {sectionIndex > 0 && (
              <div className={cn("my-2", !collapsed && "px-3")}>
                {!collapsed && (
                  <p className="text-[10px] text-muted-foreground/60 mb-1">
                    {section}
                  </p>
                )}
                <div className="border-t" />
              </div>
            )}
            {navItems
              .filter((item) => item.section === section)
              .map((item) => {
                const isActive =
                  item.href === "/setup"
                    ? pathname.startsWith("/setup")
                    : pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <React.Fragment key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-md text-[13px] transition-colors duration-150 relative",
                        isActive
                          ? "bg-muted text-foreground font-medium border-l-2 border-primary"
                          : "text-muted-foreground font-normal hover:bg-muted/50 hover:text-foreground",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                    {item.href === "/setup" && isSetupRoute && !collapsed && (
                      <div className="mt-0.5 mb-1 space-y-0.5">
                        {setupSubItems.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                "flex items-center gap-2 pl-9 pr-3 py-1 rounded-md text-xs transition-colors duration-150",
                                isSubActive
                                  ? "bg-muted text-foreground font-medium border-l-2 border-primary"
                                  : "text-muted-foreground font-normal hover:bg-muted/50 hover:text-foreground"
                              )}
                            >
                              <subItem.icon className="h-3.5 w-3.5 shrink-0" />
                              <span>{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="border-t p-3 group">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
              {user?.full_name ? getInitials(user.full_name) : "A"}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
              {user?.full_name ? getInitials(user.full_name) : "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate">
                {user?.full_name || "Admin"}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {user?.role?.replace("_", " ") || "admin"}
              </p>
            </div>
            <button
              onClick={() => { supabase.auth.signOut().then(() => { window.location.href = "/admin"; }); }}
              className="p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all duration-150"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
