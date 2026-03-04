"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: BreadcrumbItem[] = [{ label: "Admin", href: "/" }];

  const labels: Record<string, string> = {
    users: "Users",
    metrics: "Metrics",
    "audit-log": "Audit Log",
    settings: "Settings",
  };

  let path = "";
  segments.forEach((segment, index) => {
    path += `/${segment}`;
    const isLast = index === segments.length - 1;
    crumbs.push({
      label: labels[segment] || segment,
      href: isLast ? undefined : path,
    });
  });

  return crumbs;
}

export function Breadcrumb() {
  const router = useRouter();
  const crumbs = generateBreadcrumbs(router.pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {index === 0 ? (
                <Home className="h-4 w-4" />
              ) : (
                crumb.label
              )}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
