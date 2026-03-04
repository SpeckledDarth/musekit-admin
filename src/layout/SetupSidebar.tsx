"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
  Paintbrush,
  FileText,
  File,
  CreditCard,
  Share2,
  Puzzle,
  Key,
  Mail,
  Bot,
  ShieldCheck,
  Megaphone,
} from "lucide-react";

const setupNavItems = [
  { label: "Branding", href: "/setup/branding", icon: Paintbrush },
  { label: "Content", href: "/setup/content", icon: FileText },
  { label: "Pages", href: "/setup/pages", icon: File },
  { label: "Pricing", href: "/setup/pricing", icon: CreditCard },
  { label: "Social Links", href: "/setup/social", icon: Share2 },
  { label: "Features", href: "/setup/features", icon: Puzzle },
  { label: "API Keys", href: "/setup/api-keys", icon: Key },
  { label: "Email Templates", href: "/setup/email", icon: Mail },
  { label: "AI / Support", href: "/setup/ai", icon: Bot },
  { label: "Security", href: "/setup/security", icon: ShieldCheck },
  { label: "PassivePost", href: "/setup/passivepost", icon: Megaphone },
];

export function SetupSidebar() {
  const router = useRouter();

  return (
    <div className="w-56 shrink-0 border-r bg-muted/30 p-3 space-y-1">
      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Setup
      </p>
      {setupNavItems.map((item) => {
        const isActive = router.pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
