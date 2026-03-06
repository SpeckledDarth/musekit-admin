"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "./Breadcrumb";
import { UserAvatarMenu } from "@/components/UserAvatarMenu";
import { supabase } from "@/lib/supabase";

export function AdminHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  function handleAvatarAction(action: "dashboard" | "settings" | "sign-out") {
    if (action === "dashboard") {
      router.push("/");
    } else if (action === "settings") {
      router.push("/settings");
    } else if (action === "sign-out") {
      supabase.auth.signOut().then(() => {
        window.location.href = "/";
      });
    }
  }

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

        <UserAvatarMenu onAction={handleAvatarAction} />
      </div>
    </header>
  );
}
