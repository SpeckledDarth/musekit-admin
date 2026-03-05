"use client";

import React, { useState, useRef, useEffect } from "react";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAdmin } from "@/hooks/useAdmin";

export interface UserAvatarMenuProps {
  onAction: (action: "dashboard" | "settings" | "sign-out") => void;
}

export function UserAvatarMenu({ onAction }: UserAvatarMenuProps) {
  const { user } = useAdmin();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted transition-colors"
      >
        <Avatar
          fallback={user?.full_name || user?.email || "U"}
          src={user?.avatar_url}
          size="sm"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-md border bg-card shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium truncate">
              {user?.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>

          <button
            onClick={() => { onAction("dashboard"); setOpen(false); }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => { onAction("settings"); setOpen(false); }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
          >
            <Settings className="h-4 w-4" />
            Account Settings
          </button>

          <div className="border-t my-1" />

          <button
            onClick={() => { onAction("sign-out"); setOpen(false); }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
