"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SetupIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/setup/branding");
  }, [router]);
  return null;
}
