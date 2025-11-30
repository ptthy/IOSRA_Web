// File: review/components/review-detail.tsx
"use client"

import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  Loader2
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useState } from "react"
import { ApprovalModal } from "../../moderation/components/approval-modal"
import { RejectModal } from "../../moderation/components/reject-modal"
import { toast } from "sonner"; // ✅ SỬA 1: Import toast
import { postModerationDecision } from "@/services/moderationApi"

// (Interface StoryFromAPI giữ nguyên)
interface StoryFromAPI {
  reviewId: string;
  storyId: string;
  authorId: string;
  title: string;
  description: string;
  authorUsername: string;
  coverUrl: string;
  aiScore: number;
  aiResult: "flagged" | "rejected" | "approved";
  status: "pending" | "published" | "rejected";
  submittedAt: string;
  tags: {
    tagId: string;
    tagName: string;
  }[];
}

interface ReviewDetailPageProps {
  content: StoryFromAPI 
  onBack: () => void
}

// (Interface HistoryItem giữ nguyên)
interface HistoryItem {
  date: string;
  action: string;
  story: string;
  moderator: string;
}

export function ReviewDetail({ content, onBack }: ReviewDetailPageProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!content) return null

  const communityStandards = [
    "Không chứa nội dung bạo lực, khiêu dâm",
    "Không vi phạm bản quyền",
    "Không spam hoặc quảng cáo",
    "Ngôn ngữ phù hợp với mọi lứa tuổi",
    "Tôn trọng văn hóa và tôn giáo",
  ]
  const reviewHistory: HistoryItem[] = [
    // ... (dữ liệu tĩnh)
  ]

  // ✅ SỬA 2: Sửa hàm Approve để nhận LÝ DO (reason)
  const handleApprove = async (reason: string) => {
    if (!reason) {
      toast.error("Vui lòng cung cấp lý do phê duyệt."); // Dùng toast
      return;
    }
    
    setIsSubmitting(true);
    try {
      await postModerationDecision(content.reviewId, true, reason);
      toast.success("Phê duyệt truyện thành công!"); // Dùng toast
      setShowApprovalModal(false);
      onBack();
    } catch (err: any) {
      toast.error(`Lỗi khi phê duyệt: ${err.message}`); // Dùng toast
    } finally {
      setIsSubmitting(false);
    }
  }

  // ✅ SỬA 3: Sửa hàm Reject để dùng TOAST
  const handleReject = async (reason: string) => {
    if (!reason) {
      toast.error("Vui lòng cung cấp lý do từ chối."); // Dùng toast
      return;
    }
    setIsSubmitting(true);
    try {
      await postModerationDecision(content.reviewId, false, reason);
      toast.success("Từ chối truyện thành công!"); // Dùng toast
      setShowRejectModal(false);
      onBack();
    } catch (err: any) {
      toast.error(`Lỗi khi từ chối: ${err.message}`); // Dùng toast
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header (giữ nguyên) */}
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
        <h1 className="text-2xl font-semibold">Kiểm Duyệt Truyện</h1>
        <p className="text-[var(--muted-foreground)]">
          Đọc và đánh giá nội dung truyện theo tiêu chuẩn cộng đồng
        </p>
      </motion.div>

      {/* Alert (giữ nguyên) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto px-8 pt-6"
      >
        <div className="p-4 rounded-xl bg-[color-mix(in_srgb,_var(--accent)_8%,_var(--card)_92%)] border flex gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm">
            Truyện này đang chờ kiểm duyệt. Vui lòng đọc kỹ nội dung và đưa ra quyết định.
          </p>
        </div>
      </motion.div>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card thông tin truyện (giữ nguyên) */}
            <Card className="p-6">
              <div className="flex gap-6 mb-6">
                <Image
                  src={content.coverUrl || "https://images.unsplash.com/photo-1618173541177-883d32758e86?w=300&h=400&fit=crop"}
                  alt={content.title}
                  width={150}
                  height={220}
                  className="rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between mb-3">
                    <h2 className="text-xl font-semibold">{content.title}</h2>
                    <Badge>{content.status}</Badge>
                  </div>
                  <div className="text-[var(--muted-foreground)] space-y-2">
                    <p>
                      Tác giả: <span className="text-[var(--primary)]">{content.authorUsername}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Gửi lên: {new Date(content.submittedAt).toLocaleString('vi-VN')}
                    </p>
                    <p className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> AI: {content.aiResult} ({(content.aiScore * 100).toFixed(0)}%)
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h4 className="mb-3 font-medium">Mô tả truyện</h4>
                <p className="text-[var(--muted-foreground)] whitespace-pre-line">
                  {content.description}
                </p>
              </div>
            </Card>

            {/* Card nội dung chương (giữ nguyên) */}
            {/* <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Chương 1: Khởi đầu (TODO)</h3>
              <div className="space-y-4 text-[var(--muted-foreground)]">
                <p>(Nội dung chương 1 sẽ được tải ở đây...)</p>
              </div>
            </Card> */}
            
            {/* Card quyết định (giữ nguyên) */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Quyết định kiểm duyệt</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setShowApprovalModal(true)} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} 
                  Phê duyệt
                </Button>
                <Button variant="outline" onClick={() => setShowRejectModal(true)} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />} 
                  Từ chối
                </Button>
              </div>
            </Card>
          </div>

          {/* Cột bên phải (giữ nguyên) */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Tiêu chuẩn cộng đồng</h3>
              <ul className="space-y-3">
                {communityStandards.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-2" />
                    <span className="text-sm">{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* <Card className="p-6">
              <h3 className="mb-4 font-semibold">Lịch sử kiểm duyệt</h3>
           
            </Card> */}
          </div>
        </div>
      </div>

      {/* ✅ SỬA 4: Cập nhật 'onConfirm' của ApprovalModal */}
      <ApprovalModal 
        isOpen={showApprovalModal} 
        onClose={() => setShowApprovalModal(false)} 
        onConfirm={handleApprove} // onConfirm bây giờ nhận (reason: string)
        isSubmitting={isSubmitting}
      />
      <RejectModal 
        isOpen={showRejectModal} 
        onClose={() => setShowRejectModal(false)} 
        onConfirm={handleReject}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}