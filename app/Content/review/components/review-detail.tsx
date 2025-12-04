// File: app/Content/review/components/story-detail.tsx
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
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { postModerationDecision } from "@/services/moderationApi";
import { ApprovalModal } from "@/app/Content/moderation/components/approval-modal";
import { RejectModal } from "@/app/Content/moderation/components/reject-modal";

// Định nghĩa Interface
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
  tags: {
    tagId: string;
    tagName: string;
  }[];
}

interface StoryDetailProps {
  content: StoryFromAPI;
  onBack: () => void;
}

// Hàm tiện ích: Chuyển đổi URL trong văn bản thành thẻ <a href>
const linkify = (text: string) => {
  if (!text) return "";
  
  // Regex bắt URL (http/https)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
          onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền nếu cần
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export function ReviewDetail({ content, onBack }: StoryDetailProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HÀM XỬ LÝ DUYỆT ---
  const handleApprove = async (reason: string) => {
    setIsSubmitting(true);
    try {
      await postModerationDecision(content.reviewId, true, reason || "Approved"); 
      toast.success("Phê duyệt truyện thành công!");
      setShowApprovalModal(false);
      onBack();
    } catch (err: any) {
      toast.error(`Lỗi khi phê duyệt: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HÀM XỬ LÝ TỪ CHỐI ---
  const handleReject = async (reason: string) => {
    if (!reason) {
      toast.error("Vui lòng cung cấp lý do từ chối.");
      return;
    }
    setIsSubmitting(true);
    try {
      await postModerationDecision(content.reviewId, false, reason); 
      toast.success("Từ chối truyện thành công!");
      setShowRejectModal(false);
      onBack();
    } catch (err: any) {
      toast.error(`Lỗi khi từ chối: ${err.message}`);
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-xl mx-6 mt-6 p-6 shadow-sm z-10"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách
        </button>
        <h1 className="text-2xl font-semibold">Kiểm Duyệt Truyện</h1>
        <p className="text-[var(--muted-foreground)]">
          Đọc và đánh giá nội dung truyện theo tiêu chuẩn cộng đồng
        </p>
      </motion.div>

      {/* Alert Info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto px-8 pt-6 w-full"
      >
        <div className="p-4 rounded-xl bg-[color-mix(in_srgb,_var(--accent)_8%,_var(--card)_92%)] border border-[var(--accent)]/20 flex gap-3 text-[var(--foreground)]">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm">
            Truyện này đang chờ kiểm duyệt. Vui lòng xem xét kỹ các thông tin (Mô tả, Đại cương) trước khi quyết định.
          </p>
        </div>
      </motion.div>

      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Cột trái - Chiếm 2/3 màn hình */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card thông tin truyện */}
            <Card className="border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Ảnh bìa */}
                    <div className="w-full md:w-48 h-64 md:h-auto relative bg-gray-100 flex-shrink-0">
                        {content.coverUrl ? (
                            <img 
                                src={content.coverUrl} 
                                alt={content.title} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <BookOpen className="w-12 h-12" />
                            </div>
                        )}
                    </div>
                    
                    {/* Thông tin chi tiết */}
                    <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {content.tags.map(tag => (
                                    <Badge key={tag.tagId} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                                        {tag.tagName}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[var(--muted-foreground)]">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>Tác giả: <strong className="text-[var(--foreground)]">{content.authorUsername}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>Gửi lúc: {new Date(content.submittedAt).toLocaleString('vi-VN')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                <span>Độ dài: <strong className="text-[var(--foreground)]">{content.lengthPlan}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                <span>AI Score: <strong className="text-[var(--foreground)]">{content.aiScore.toFixed(1)}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Card Mô tả (Description) */}
            <Card className="p-6">
                <CardHeader className="px-0 pt-0 border-b border-[var(--border)] pb-4 mb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        Mô tả truyện
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="text-[var(--foreground)] leading-relaxed whitespace-pre-line text-justify">
                        {/* Sử dụng hàm linkify để hiển thị link */}
                        {linkify(content.description)}
                    </div>
                </CardContent>
            </Card>

            {/* Card Đại cương / Chi tiết truyện (Outline) */}
            <Card className="p-6">
                <CardHeader className="px-0 pt-0 border-b border-[var(--border)] pb-4 mb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-orange-500" />
                    Nội dung chi tiết 
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg min-h-[150px] border border-[var(--border)]">
                        <div className="text-[var(--foreground)] leading-relaxed whitespace-pre-line text-justify">
                             {/* Sử dụng hàm linkify để hiển thị link */}
                            {content.outline ? linkify(content.outline) : <span className="italic text-[var(--muted-foreground)]">Không có nội dung đại cương.</span>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card Quyết định */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-lg">Quyết định kiểm duyệt</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => setShowApprovalModal(true)} 
                  disabled={isSubmitting} 
                  className="bg-green-600 hover:bg-green-700 text-white h-11"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />} 
                  Phê duyệt
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRejectModal(true)} 
                  disabled={isSubmitting}
                  className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 h-11"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5 mr-2" />} 
                  Từ chối
                </Button>
              </div>
            </Card>

          </div>

          {/* Cột phải - Chiếm 1/3 màn hình */}
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
                    <span className="text-sm text-[var(--muted-foreground)]">{standard}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Thông tin bổ sung</h3>
              <div className="space-y-3 text-sm text-[var(--muted-foreground)] bg-[var(--muted)] p-4 rounded-lg">
                <div className="flex justify-between">
                  <span>Review ID:</span>
                  <span className="font-mono text-xs truncate max-w-[150px]" title={content.reviewId}>{content.reviewId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Story ID:</span>
                  <span className="font-mono text-xs truncate max-w-[150px]" title={content.storyId}>{content.storyId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Trạng thái:</span>
                  <Badge variant="secondary" className="text-xs uppercase">{content.status}</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
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