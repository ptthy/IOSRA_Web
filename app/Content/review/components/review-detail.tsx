"use client"

import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  BookOpen,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useState } from "react"
import { ApprovalModal } from "../../moderation/components/approval-modal"
import { RejectModal } from "../../moderation/components/reject-modal"

interface ReviewDetailPageProps {
  content: any
  onBack: () => void
}

export function ReviewDetail({ content, onBack }: ReviewDetailPageProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  if (!content) return null

  const communityStandards = [
    "Không chứa nội dung bạo lực, khiêu dâm",
    "Không vi phạm bản quyền",
    "Không spam hoặc quảng cáo",
    "Ngôn ngữ phù hợp với mọi lứa tuổi",
    "Tôn trọng văn hóa và tôn giáo",
  ]

  const reviewHistory = [
    {
      date: "2025-10-10",
      action: "Đã duyệt",
      story: "Chiến binh ánh sáng",
      moderator: "Admin",
    },
    {
      date: "2025-10-09",
      action: "Từ chối",
      story: "Thế giới ma thuật",
      moderator: "ModUser",
    },
    {
      date: "2025-10-08",
      action: "Đã duyệt",
      story: "Tình yêu học đường",
      moderator: "Admin",
    },
  ]

  const handleApprove = (languages: string[]) => {
    console.log("Approved with languages:", languages)
  }

  const handleReject = (reason: string) => {
    console.log("Rejected with reason:", reason)
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
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
            <Card className="p-6">
              <div className="flex gap-6 mb-6">
                <Image
                  src={content.coverImage || "https://images.unsplash.com/photo-1618173541177-883d32758e86?w=300&h=400&fit=crop"}
                  alt={content.title}
                  width={150}
                  height={220}
                  className="rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between mb-3">
                    <h2 className="text-xl font-semibold">{content.title}</h2>
                    <Badge>Chờ kiểm duyệt</Badge>
                  </div>
                  <div className="text-[var(--muted-foreground)] space-y-2">
                    <p>
                      Tác giả: <span className="text-[var(--primary)]">{content.author}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Gửi lên: {content.submittedAt}
                    </p>
                    <p className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> {content.wordCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h4 className="mb-3 font-medium">Mô tả truyện</h4>
                <p className="text-[var(--muted-foreground)]">
                  Một câu chuyện phiêu lưu đầy kịch tính về một sinh viên bình thường bị triệu hồi vào thế giới khác...
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Chương 1: Khởi đầu</h3>
              <div className="space-y-4 text-[var(--muted-foreground)]">
                <p>Đó là một ngày bình thường như mọi ngày khác...</p>
                <p>Khi đang băng qua đường một ánh sáng chói lóa...</p>
                <p>&ldquo;Chào mừng đến với Alteria&rdquo; một giọng nói vang lên...</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Quyết định kiểm duyệt</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setShowApprovalModal(true)}>
                  <CheckCircle2 className="w-5 h-5" /> Phê duyệt
                </Button>
                <Button variant="outline" onClick={() => setShowRejectModal(true)}>
                  <XCircle className="w-5 h-5" /> Từ chối
                </Button>
              </div>
            </Card>
          </div>

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

            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Lịch sử kiểm duyệt</h3>
              <div className="space-y-3">
                {reviewHistory.map((item, i) => (
                  <div key={i} className="p-4 rounded-xl border">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium">{item.story}</p>
                      <Badge>{item.action}</Badge>
                    </div>
                    <div className="text-xs flex justify-between text-[var(--muted-foreground)]">
                      <span>Kiểm duyệt bởi: {item.moderator}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ApprovalModal isOpen={showApprovalModal} onClose={() => setShowApprovalModal(false)} onConfirm={handleApprove} />
      <RejectModal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} onConfirm={handleReject} />
    </div>
  )
}
