// File: app/Content/review/components/review-detail.tsx
"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  BookOpen,
  Clock,
  User,
  Info,
  FileText,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { postModerationDecision } from "@/services/moderationApi";
import { ApprovalModal } from "@/app/Content/moderation/components/approval-modal";
import { RejectModal } from "@/app/Content/moderation/components/reject-modal";

export interface StoryFromAPI {
  reviewId: string;
  storyId: string;
  title: string;
  description: string;
  authorUsername: string;
  coverUrl: string;
  aiScore: number;
  aiResult: "flagged" | "rejected" | "approved";
  status: "pending" | "published" | "rejected";
  outline: string;
  lengthPlan: string;
  submittedAt: string;
  pendingNote: string | null;
  tags: { tagId: string; tagName: string }[];
}

export function ReviewDetail({
  content,
  onBack,
}: {
  content: StoryFromAPI;
  onBack: () => void;
}) {
  // Logic xử lý Phê duyệt (Approve)
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Helpers dịch tiếng Việt ---
  const getAiLabel = (result: string) => {
    switch (result) {
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Từ chối";
      case "flagged":
        return "Cảnh báo";
      default:
        return result;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ duyệt";
      case "published":
        return "Đã đăng";
      case "rejected":
        return "Bị từ chối";
      default:
        return status;
    }
  };
  // Gọi API postModerationDecision với cờ approve: true
  const handleApprove = async (reason: string) => {
    if (content.aiResult === "rejected") {
      const confirmAi = confirm(
        "CẢNH BÁO QUAN TRỌNG: AI đã từ chối truyện này vì vi phạm nội dung.\n" +
          "Hành động duyệt này có thể gây rủi ro.\n\n" +
          "Bạn vẫn muốn DUYỆT?"
      );
      if (!confirmAi) return;
    }

    if (!reason) {
      toast.error("Vui lòng nhập lý do duyệt.");
      return;
    }

    setIsSubmitting(true);
    try {
      await postModerationDecision(content.reviewId, true, reason);
      toast.success("Đã duyệt truyện thành công!");
      onBack();
    } catch (error: any) {
      const code = error.response?.data?.code || error.code;
      if (code === "ModerationAlreadyHandled") {
        toast.error("Lỗi: Truyện này đã được xử lý bởi người khác.");
        onBack();
      } else if (code === "StoryNotPending") {
        toast.error("Truyện không ở trạng thái chờ duyệt.");
      } else {
        toast.error("Có lỗi xảy ra: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
      setShowApprovalModal(false);
    }
  };

  // Gọi API postModerationDecision với cờ approve: false kèm lý do vi phạm
  const handleReject = async (reason: string) => {
    if (!reason) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }

    setIsSubmitting(true);
    try {
      await postModerationDecision(content.reviewId, false, reason);
      toast.success("Đã từ chối truyện.");
      onBack();
    } catch (error: any) {
      const code = error.response?.data?.code || error.code;
      if (code === "ModerationAlreadyHandled") {
        toast.error("Lỗi: Truyện này đã được xử lý bởi người khác.");
        onBack();
      } else {
        toast.error("Lỗi: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
      setShowRejectModal(false);
    }
  };

  const communityStandards = [
    "Không chứa nội dung bạo lực, khiêu dâm",
    "Không vi phạm bản quyền",
    "Không spam hoặc quảng cáo",
    "Ngôn ngữ phù hợp với mọi lứa tuổi",
    "Tôn trọng văn hóa và tôn giáo",
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-10">
      <div className="sticky top-0 z-50 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 shadow-md">
        <button onClick={onBack} className="flex items-center gap-2 mb-2">
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách
        </button>

        <h1 className="text-2xl font-semibold">Kiểm Duyệt Truyện</h1>
        <p className="text-[var(--muted-foreground)]">
          Đánh giá nội dung truyện và thông tin liên quan
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto px-8 pt-6"
      >
        <div className="p-4 rounded-xl bg-[color-mix(in_srgb,_var(--accent)_8%,_var(--card)_92%)] border border-[var(--accent)]/20 flex gap-3 text-[var(--foreground)]">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm">
            Truyện này đang chờ kiểm duyệt. Vui lòng kiểm tra kỹ đại cương, bìa
            và các tag.
          </p>
        </div>
      </motion.div>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- CỘT TRÁI (2/3) --- */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-l-4 border-l-[var(--primary)]">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="shrink-0">
                  <img
                    src={content.coverUrl}
                    alt="Cover"
                    className="w-32 h-48 object-cover rounded-lg shadow-md border border-[var(--border)]"
                  />
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-bold text-[var(--foreground)] leading-tight">
                        {content.title}
                      </h2>
                      {/* SỬA: Hiển thị AI Label Tiếng Việt */}
                      <Badge
                        variant="outline"
                        className={
                          content.aiResult === "approved"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : content.aiResult === "rejected"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }
                      >
                        {content.aiResult === "rejected" && (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        )}
                        AI: {getAiLabel(content.aiResult).toUpperCase()} (
                        {content.aiScore})
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-[var(--muted-foreground)] space-y-1">
                      <p className="flex items-center gap-2">
                        <User className="w-4 h-4" /> Tác giả:{" "}
                        <span className="font-medium text-[var(--foreground)]">
                          {content.authorUsername}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Gửi lúc:{" "}
                        {new Date(content.submittedAt).toLocaleString("vi-VN")}
                      </p>
                      <p className="flex items-center gap-2">
                        <Info className="w-4 h-4" /> Kế hoạch:{" "}
                        <Badge variant="secondary" className="text-xs">
                          {content.lengthPlan}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  <div className="bg-[var(--muted)]/50 p-3 rounded-lg border border-[var(--border)]">
                    <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">
                      Mô tả ngắn
                    </h4>
                    <p className="text-sm text-[var(--foreground)] leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">
                      {content.description}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 min-h-[300px]">
              <CardHeader className="px-0 pt-0 border-b border-[var(--border)] pb-4 mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Nội dung truyện (Outline)
                </h3>
              </CardHeader>
              <CardContent className="px-0">
                <div className="prose dark:prose-invert max-w-none text-[var(--foreground)] whitespace-pre-line leading-relaxed">
                  {content.outline}
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Quyết định kiểm duyệt</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setShowApprovalModal(true)}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  )}
                  Phê duyệt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(true)}
                  disabled={isSubmitting}
                  className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-2" />
                  )}
                  Từ chối
                </Button>
              </div>
            </Card>
          </div>

          {/* --- CỘT PHẢI (1/3) --- */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4 font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Tiêu chuẩn cộng đồng
              </h3>
              <ul className="space-y-3">
                {communityStandards.map((standard, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-2 flex-shrink-0" />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {standard}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4" /> Thể loại
              </h3>
              <div className="flex flex-wrap gap-2">
                {content.tags.length > 0 ? (
                  content.tags.map((tag) => (
                    <Badge
                      key={tag.tagId}
                      variant="secondary"
                      className="px-3 py-1 text-xs"
                    >
                      {tag.tagName}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[var(--muted-foreground)]">
                    Không có thẻ nào
                  </span>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Thông tin bổ sung</h3>
              <div className="space-y-3 text-sm text-[var(--muted-foreground)] bg-[var(--muted)] p-4 rounded-lg">
                <div className="flex justify-between">
                  <span>Review ID:</span>
                  <span
                    className="font-mono text-xs truncate max-w-[150px]"
                    title={content.reviewId}
                  >
                    {content.reviewId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Story ID:</span>
                  <span
                    className="font-mono text-xs truncate max-w-[150px]"
                    title={content.storyId}
                  >
                    {content.storyId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Trạng thái:</span>
                  {/* SỬA: Hiển thị Status tiếng Việt */}
                  <Badge variant="secondary" className="text-xs uppercase">
                    {getStatusLabel(content.status)}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onConfirm={handleApprove}
        isSubmitting={isSubmitting}
      />

      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
