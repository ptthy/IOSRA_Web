// File: app/Content/chapters/components/chapter-detail.tsx
"use client";

import React, { useState, useEffect } from "react";
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
import { postChapterDecision, getChapterContent } from "@/services/moderationApi"; 
import { ChapterFromAPI } from "./chapter-list"; 
import { ApprovalModal } from "@/app/Content/moderation/components/approval-modal"; 
import { RejectModal } from "@/app/Content/moderation/components/reject-modal"; 
import apiClient from "@/services/apiClient";
// URL gốc của Server chứa file (Dựa trên curl bạn cung cấp)
// Nên đưa vào biến môi trường: process.env.NEXT_PUBLIC_API_URL
const STORAGE_BASE_URL = "https://45-132-75-29.sslip.io";

interface ChapterDetailProps {
  content: ChapterFromAPI;
  onBack: () => void;
}

export function ChapterDetail({ content, onBack }: ChapterDetailProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho nội dung chương
  const [chapterText, setChapterText] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  // ✅ ĐÃ SỬA: Logic xử lý dữ liệu trả về từ API
  useEffect(() => {
    async function fetchContent() {
      if (!content.reviewId) return;

      setIsLoadingContent(true);
      try {
        // 1. Lấy metadata trước
        const data = await getChapterContent(content.reviewId);
        
        let textToShow = "";

        // Trường hợp A: API trả về text luôn (ít gặp)
        if (typeof data === 'string') {
          textToShow = data;
        } 
        // Trường hợp B: API trả về Object có contentPath
        else if (data && typeof data === 'object') {
          
          if (data.contentPath) {
             // 💡 SỬ DỤNG API CLIENT ĐỂ TẢI FILE .TXT
             // Việc này giúp request có kèm Token và dùng đúng BaseURL của API
             try {
                const fileRes = await apiClient.get(data.contentPath, {
                  responseType: 'text', // Quan trọng: báo axios trả về text thay vì json
                  baseURL: undefined // Thử dùng relative path so với domain gốc nếu path không bắt đầu bằng /api
                });
                textToShow = fileRes.data;
             } catch (err1) {
                // Nếu gọi theo domain gốc lỗi, thử gọi qua API Base URL mặc định
                try {
                  console.log("Thử tải file qua API Base URL...");
                  const fileRes2 = await apiClient.get(data.contentPath, {
                    responseType: 'text'
                  });
                  textToShow = fileRes2.data;
                } catch (err2: any) {
                   console.error("Lỗi tải file:", err2);
                   // Fallback cuối cùng: Thử fetch thủ công với đường dẫn tĩnh
                   textToShow = `Không thể tải nội dung từ: ${data.contentPath}. \n(Lỗi: ${err2.response?.status || 404} - Vui lòng kiểm tra lại xem Backend đã public thư mục 'stories' chưa)`;
                }
             }
          }
          // Ưu tiên: Nếu Backend trả trực tiếp field content hoặc text trong JSON
          else if (data.content) {
             textToShow = data.content;
          } else if (data.text) {
             textToShow = data.text;
          } else {
             textToShow = "API trả về metadata nhưng không có đường dẫn file (contentPath) hoặc nội dung.";
          }
        } else {
            textToShow = "Dữ liệu không hợp lệ.";
        }

        setChapterText(textToShow);

      } catch (error) {
        console.error("Failed to load chapter content:", error);
        toast.error("Không thể tải nội dung chương.");
        setChapterText("Lỗi kết nối khi lấy thông tin chương.");
      } finally {
        setIsLoadingContent(false);
      }
    }

    fetchContent();
  }, [content.reviewId]);

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-xl mx-6 mt-6 p-6 sticky top-6 z-10 shadow-sm"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách
        </button>
        <h1 className="text-2xl font-semibold">Kiểm Duyệt Chương</h1>
        <p className="text-[var(--muted-foreground)]">
          Đọc và đánh giá nội dung chương theo tiêu chuẩn cộng đồng
        </p>
      </motion.div>

      {/* Alert */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto px-8 pt-6"
      >
        <div className="p-4 rounded-xl bg-[color-mix(in_srgb,_var(--accent)_8%,_var(--card)_92%)] border border-[var(--accent)]/20 flex gap-3 text-[var(--foreground)]">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm">
            Chương này đang chờ kiểm duyệt. Vui lòng đọc kỹ nội dung và đưa ra quyết định.
          </p>
        </div>
      </motion.div>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái - Chiếm 2/3 màn hình */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card thông tin chương */}
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex justify-between mb-3">
                  <h2 className="text-xl font-semibold">{content.chapterTitle}</h2>
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {content.aiScore.toFixed(1)} Điểm AI
                  </Badge>
                </div>
                <div className="text-[var(--muted-foreground)] space-y-2">
                  <p>
                    Truyện: <span className="text-[var(--primary)] font-medium">{content.storyTitle}</span>
                  </p>
                  <p>
                    Tác giả: <span className="text-[var(--primary)] font-medium">{content.authorUsername}</span>
                  </p>
                  <p className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" /> 
                    Gửi lên: {new Date(content.submittedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              
              {/* Lý do AI Flag */}
              <div className="pt-6 border-t border-[var(--border)]">
                <h4 className="mb-3 font-medium text-yellow-800 dark:text-yellow-400">
                  Lý do AI gắn cờ
                </h4>
                <div className="text-sm text-yellow-700 dark:text-yellow-200 whitespace-pre-line bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                  {content.aiFeedback || "Không có feedback."}
                </div>
              </div>
            </Card>
          
            {/* Card nội dung chương */}
            {/* <Card className="p-6">
              <CardHeader className="px-0 pt-0 border-b border-[var(--border)] pb-4 mb-4">
                <h3 className="text-lg font-semibold">Nội dung chương</h3>
              </CardHeader>
              <CardContent className="px-0">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg min-h-[300px] max-h-[800px] overflow-y-auto border border-[var(--border)]">
                  {isLoadingContent ? (
                    <div className="flex flex-col items-center justify-center h-40 text-[var(--muted-foreground)]">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <p>Đang tải nội dung chương...</p>
                    </div>
                  ) : chapterText ? (
                    <article className="prose dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap leading-relaxed text-[var(--foreground)] text-justify">
                        {chapterText}
                      </p>
                    </article>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-[var(--muted-foreground)] italic">
                      <BookOpen className="w-8 h-8 mb-2 opacity-20" />
                      <p>(Không tìm thấy nội dung hiển thị)</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card> */}

            {/* Card quyết định */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Quyết định kiểm duyệt</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => setShowApprovalModal(true)} 
                  disabled={isSubmitting} 
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />} 
                  Phê duyệt
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRejectModal(true)} 
                  disabled={isSubmitting}
                  className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                  <span>Chapter ID:</span>
                  <span className="font-mono text-xs truncate max-w-[150px]" title={content.chapterId}>{content.chapterId}</span>
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