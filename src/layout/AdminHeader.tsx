"use client";

import React, { useState } from "react";
import { Search, Bell, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Breadcrumb } from "./Breadcrumb";
import { useAdmin } from "@/hooks/useAdmin";

export function AdminHeader() {
  const { user } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-6 py-3">
      <div className="flex items-center gap-4 flex-1">
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted transition-colors"
          >
            <Avatar
              fallback={user?.full_name || user?.email || "A"}
              src={user?.avatar_url}
              size="sm"
            />
            <span className="text-sm font-medium hidden sm:inline">
              {user?.full_name || "Admin"}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-card shadow-lg py-1 z-50">
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
                <User className="h-4 w-4" />
                Profile
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-destructive">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
