"use client";

import { useState } from "react";

import { SentBackList } from "../moderation/components/sent-back-list";
import Dashboard from "./components/dashboard";

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedReport(null);
  };

  const handleReview = (report: any) => {
    setSelectedReport(report);
    setCurrentPage("review");
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6 space-y-6">
        {currentPage === "dashboard" && <Dashboard />}

       
        {currentPage === "sent-back" && (
          <SentBackList onReview={handleReview} /> 
        )}

        {currentPage === "review" && selectedReport && (
          <div className="text-foreground">
            <h2 className="text-2xl font-semibold mb-2">
              {selectedReport.title}
            </h2>
            <p>Tác giả: {selectedReport.author}</p>
            <p>Thể loại: {selectedReport.genre}</p>
            <p className="mt-4 text-muted-foreground">
              {selectedReport.authorRevision.message}
            </p>
            <button
              onClick={() => setCurrentPage("sent-back")}
              className="mt-6 bg-[var(--primary)] hover:bg-[color-mix(in srgb, var(--primary) 75%, black)] text-[var(--primary-foreground)] px-4 py-2 rounded-md transition-all"
            >
              Quay lại
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
