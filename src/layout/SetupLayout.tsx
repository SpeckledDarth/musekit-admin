"use client";

import React from "react";
import { SetupSidebar } from "./SetupSidebar";

interface SetupLayoutProps {
  children: React.ReactNode;
}

export function SetupLayout({ children }: SetupLayoutProps) {
  return (
    <div className="flex -m-6 min-h-[calc(100vh-73px)]">
      <SetupSidebar />
      <div className="flex-1 p-6 overflow-y-auto">{children}</div>
    </div>
  );
}
