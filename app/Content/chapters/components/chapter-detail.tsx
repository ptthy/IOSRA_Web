// File: app/Content/chapters/components/chapter-detail.tsx (ĐÃ SỬA LAYOUT)
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { postChapterDecision } from "@/services/moderationApi"; 
import { ChapterFromAPI } from "./chapter-list"; 
import { ApprovalModal } from "@/app/Content/moderation/components/approval-modal"; 
import { RejectModal } from "@/app/Content/moderation/components/reject-modal"; 

interface ChapterDetailProps {
  content: ChapterFromAPI;
  onBack: () => void;
}

export function ChapterDetail({ content, onBack }: ChapterDetailProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm gọi API Duyệt
  const handleApprove = async (reason: string) => {
    if (!reason) {
      toast.error("Vui lòng cung cấp lý do phê duyệt.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await postChapterDecision(content.reviewId, true, reason); 
      toast.success("Phê duyệt chương thành công!");
      setShowApprovalModal(false);
      onBack();
    } catch (err: any) {
      toast.error(`Lỗi khi phê duyệt: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm gọi API Từ chối
  const handleReject = async (reason: string) => {
    if (!reason) {
      toast.error("Vui lòng cung cấp lý do từ chối.");
      return;
    }
    setIsSubmitting(true);
    try {
      await postChapterDecision(content.reviewId, false, reason); 
      toast.success("Từ chối chương thành công!");
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header - Giống với mẫu story */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-xl mx-6 mt-6 p-6 sticky top-6 z-10"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách
        </button>
        <h1 className="text-2xl font-semibold">Kiểm Duyệt Chương</h1>
        <p className="text-[var(--muted-foreground)]">
          Đọc và đánh giá nội dung chương theo tiêu chuẩn cộng đồng
        </p>
      </motion.div>

      {/* Alert - Giống với mẫu story */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto px-8 pt-6"
      >
        <div className="p-4 rounded-xl bg-[color-mix(in_srgb,_var(--accent)_8%,_var(--card)_92%)] border flex gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm">
            Chương này đang chờ kiểm duyệt. Vui lòng đọc kỹ nội dung và đưa ra quyết định.
          </p>
        </div>
      </motion.div>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái - Chiếm 2/3 màn hình */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card thông tin chương - Layout giống story */}
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex justify-between mb-3">
                  <h2 className="text-xl font-semibold">{content.chapterTitle}</h2>
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-800 border-yellow-300"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {content.aiScore.toFixed(1)} Điểm AI
                  </Badge>
                </div>
                <div className="text-[var(--muted-foreground)] space-y-2">
                  <p>
                    Truyện: <span className="text-[var(--primary)]">{content.storyTitle}</span>
                  </p>
                  <p>
                    Tác giả: <span className="text-[var(--primary)]">{content.authorUsername}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 
                    Gửi lên: {new Date(content.submittedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              
              {/* Lý do AI Flag */}
              <div className="pt-6 border-t">
                <h4 className="mb-3 font-medium text-yellow-800 dark:text-yellow-300">
                  Lý do AI gắn cờ
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-200 whitespace-pre-line bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  {content.aiFeedback || "Không có feedback."}
                </p>
              </div>
            </Card>
          
            {/* Card nội dung chương */}
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <h3 className="text-lg font-semibold">Nội dung chương</h3>
              </CardHeader>
              <CardContent className="px-0">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg min-h-[200px]">
                  <p className="text-[var(--muted-foreground)] italic">
                    (Phần này cần gọi API `GET /api/moderation/chapters/{content.reviewId}` để lấy nội dung text của chương và hiển thị ở đây)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card quyết định - Layout giống story */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Quyết định kiểm duyệt</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => setShowApprovalModal(true)} 
                  disabled={isSubmitting} 
                  className="bg-[var(--primary)] hover:bg-[color-mix(in_srgb,_var(--primary)_75%,_black)]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />} 
                  Phê duyệt
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRejectModal(true)} 
                  disabled={isSubmitting}
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
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-2" />
                    <span className="text-sm text-[var(--muted-foreground)]">{standard}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Có thể thêm các card khác ở đây nếu cần */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Thông tin bổ sung</h3>
              <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                <p>Review ID: {content.reviewId}</p>
                <p>Chapter ID: {content.chapterId}</p>
                <p>Status: {content.status}</p>
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