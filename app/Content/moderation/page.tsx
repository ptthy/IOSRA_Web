"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SentBackList } from "./components/sent-back-list";
import { ApprovalModal } from "./components/approval-modal";
import { RejectModal } from "./components/reject-modal";
import { ReportsList } from "./components/report-list";

interface Report {
  id: number;
  priority: string;
  reportCount: number;
  storyTitle: string;
  chapter: string;
  reporter: string;
  reportDate: string;
  reportType: string;
  reason: string;
  content: string;
  status: string;
}

export default function ModerationPage() {
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"reports" | "sent-back">("reports");
  const searchParams = useSearchParams();
  const [selectedStory, setSelectedStory] = useState<any | null>(null);

  // đọc query param ?tab=reports | sent-back
  useEffect(() => {
    const tab = searchParams.get("tab") as "reports" | "sent-back" | null;
    if (tab && (tab === "reports" || tab === "sent-back")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleReportAction = (report: Report) => {
    console.log("ReportsList handled report:", report);
  };

  const handleSentBackReview = (content: any) => {
    console.log("SentBackList review clicked:", content);
    setSelectedStory(content);
    // lưu ý: không route ở đây để giữ layout container
  };

  const handleApprovalConfirm = (languages: string[]) => {
    console.log("Selected languages:", languages);
    setIsApprovalOpen(false);
  };

  const handleRejectConfirm = (reason: string) => {
    console.log("Rejection reason:", reason);
    setIsRejectOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* === Nếu bạn cần tab UI ở tương lai, thả vào đây === */}
      {/* Hiện tại logic tab lấy từ query param nên không render tab bar */}

      {/* Reports */}
      {activeTab === "reports" && <ReportsList onHandle={handleReportAction} />}

      {/* Sent back list (list view) */}
      {activeTab === "sent-back" && !selectedStory && (
        // Không set full-page padding / background ở đây — layout sẽ handle padding & width
        <div className="space-y-6">
          <SentBackList onReview={handleSentBackReview} />
        </div>
      )}

      {/* Sent back — chi tiết 1 item */}
      {activeTab === "sent-back" && selectedStory && (
        // Dùng var tokens đúng, không dùng bg-card (sai)
        <div className="bg-[var(--card)] text-[var(--foreground)] p-6 rounded-xl shadow-sm border border-[var(--border)]">
          <h2 className="text-2xl font-semibold mb-3">{selectedStory.title}</h2>

          <div className="mb-4 space-y-2">
            <p>
              <strong className="mr-1">Tác giả:</strong>
              <span className="text-[var(--primary)]">{selectedStory.author}</span>
            </p>
            <p>
              <strong className="mr-1">Thể loại:</strong>
              <span className="text-[var(--muted-foreground)]">{selectedStory.genre}</span>
            </p>
            <p className="text-[var(--muted-foreground)] mt-2">
              {selectedStory.authorRevision?.message ?? ""}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSelectedStory(null)}
              className="px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:shadow-sm transition"
            >
              Quay lại danh sách
            </button>

            <button
              onClick={() => setIsApprovalOpen(true)}
              className="px-4 py-2 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition"
            >
              Mở modal duyệt
            </button>

            <button
              onClick={() => setIsRejectOpen(true)}
              className="px-4 py-2 rounded-md border border-[var(--destructive)] text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition"
            >
              Từ chối
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        onConfirm={handleApprovalConfirm}
      />

      <RejectModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}
