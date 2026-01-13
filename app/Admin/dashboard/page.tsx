"use client";

import SystemStatus from "./components/system-status";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tổng quan hệ thống</h1>
      <SystemStatus />
    </div>
  );
}
