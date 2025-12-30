"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { ApprovalModal } from "./components/approval-modal";
import { RejectModal } from "./components/reject-modal";
import { ReportsList } from "./components/report-list";
import { toast } from "sonner"; // Import toast để dùng

// ✅ SỬA 1: Xóa Interface 'Report' (vì logic đã chuyển vào report-list)
// interface Report { ... }

export default function ModerationPage() {
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"reports" | "sent-back">(
    "reports"
  );
  const searchParams = useSearchParams();
  const [selectedStory, setSelectedStory] = useState<any | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab") as "reports" | "sent-back" | null;
    if (tab && (tab === "reports" || tab === "sent-back")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // ✅ SỬA 2: Xóa hàm 'handleReportAction' (không còn dùng)
  // const handleReportAction = (report: Report) => {
  //   console.log("ReportsList handled report:", report);
  // };

  const handleSentBackReview = (content: any) => {
    console.log("SentBackList review clicked:", content);
    setSelectedStory(content);
  };

  const handleApprovalConfirm = (reason: string) => {
    console.log("Approval reason:", reason);
    // (Logic duyệt truyện 'sent-back' ở đây)
    toast.success("Đã duyệt (chưa gọi API thật)");
    setIsApprovalOpen(false);
    setSelectedStory(null); // Quay lại danh sách
  };

  const handleRejectConfirm = (reason: string) => {
    console.log("Rejection reason:", reason);
    // (Logic từ chối truyện 'sent-back' ở đây)
    toast.error("Đã từ chối (chưa gọi API thật)");
    setIsRejectOpen(false);
    setSelectedStory(null); // Quay lại danh sách
  };

  return (
    <div className="space-y-6">
      {/* Reports */}
      {/* ReportsList tự quản lý việc mở Modal chi tiết báo cáo bên trong nó */}
      {activeTab === "reports" && <ReportsList />}

      {/* Hiển thị chi tiết nội dung khiếu nại nếu có selectedStory */}
      {activeTab === "sent-back" && selectedStory && (
        <div className="bg-[var(--card)] text-[var(--foreground)] p-6 rounded-xl shadow-sm border border-[var(--border)]">
          <h2 className="text-2xl font-semibold mb-3">{selectedStory.title}</h2>

          <div className="mb-4 space-y-2">
            <p>
              <strong className="mr-1">Tác giả:</strong>
              <span className="text-[var(--primary)]">
                {selectedStory.author}
              </span>
            </p>
            <p>
              <strong className="mr-1">Thể loại:</strong>
              <span className="text-[var(--muted-foreground)]">
                {selectedStory.genre}
              </span>
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

      {/* Modals (Giữ nguyên) */}
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
