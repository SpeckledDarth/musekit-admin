"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

export function useAdmin() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setUser(profile as Profile);
          setIsAdmin(
            profile.role === "admin" || profile.role === "super_admin"
          );
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, []);

  return { user, loading, isAdmin };
}
