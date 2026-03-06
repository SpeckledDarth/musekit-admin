"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function SetupIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/setup/branding");
  }, [router]);
  return null;
}
