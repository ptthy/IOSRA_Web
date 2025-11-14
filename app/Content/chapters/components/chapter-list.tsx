"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle, BookOpen, Clock, User, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
// import { useModeration } from "@/context/ModerationContext"; // (Tùy chọn)

// ✅ SỬA 1: Bỏ comment dòng import API
import { getModerationChapters } from "@/services/moderationApi"; // API mới
// import { ChapterFromAPI } from "../page"; // Dòng này không cần nữa

// 1. Định nghĩa Interface (Kiểu dữ liệu)
export interface ChapterFromAPI {
  reviewId: string;
  chapterId: string;
  storyTitle: string;
  chapterTitle: string;
  authorUsername: string;
  aiScore: number;
  aiFeedback: string;
  status: "pending" | "published" | "rejected";
  submittedAt: string;
}

// 2. MOCK DATA (Sẽ không dùng nữa)
// const MOCK_DATA: ChapterFromAPI[] = [ ... ];

interface ChapterListProps {
  onReviewClick: (chapter: ChapterFromAPI) => void;
}

export function ChapterList({ onReviewClick }: ChapterListProps) {
  const [chapters, setChapters] = useState<ChapterFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { updateCount } = useModeration(); // (Tùy chọn)

  useEffect(() => {
    const fetchPendingChapters = async () => {
      try {
        setIsLoading(true);
        setError(null); // Xóa lỗi cũ
        
        // ✅ SỬA 2: BỎ MOCK DATA, GỌI API THẬT
        // await new Promise(resolve => setTimeout(resolve, 800));
        // const data = MOCK_DATA; 
        const data: ChapterFromAPI[] = await getModerationChapters('pending');
        
        // ✅ SỬA 3: TẠM THỜI TẮT BỘ LỌC ĐỂ TEST API
        // (Sau khi test thành công, bạn có thể bật lại bộ lọc này)
        // const filteredData = data.filter(chapter => 
        //    chapter.aiScore >= 5 && chapter.aiScore <= 7
        // );
        const filteredData = data; // Hiển thị TẤT CẢ data API trả về

        setChapters(filteredData);
        
      } catch (err: any) {
        setError(err.message); // Hiển thị lỗi thật từ API
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingChapters();
  }, []); // Chỉ chạy 1 lần

  if (isLoading) {
    return <div className="text-center p-12"><Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" /></div>;
  }
  
  // ✅ SỬA 4: Hiển thị lỗi nếu API thất bại
  if (error) {
    return <div className="text-center p-12 text-red-600"><AlertCircle className="w-8 h-8 mx-auto" /><p>Lỗi API: {error}</p></div>;
  }
  
  if (chapters.length === 0) {
    return <div className="text-center p-12 text-gray-500">API thành công nhưng không có chương nào ở trạng thái "pending".</div>;
  }

  // UI Render (Giữ nguyên)
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      }}
    >
      {chapters.map((chapter) => (
        <motion.div key={chapter.reviewId} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <Card
            className="overflow-hidden cursor-pointer group hover:shadow-md transition-shadow border-gray-200 dark:border-gray-800"
            onClick={() => onReviewClick(chapter)}
          >
            <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
              <BookOpen className="w-12 h-12 text-gray-400" />
              <Badge
                className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 text-white border-0"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {chapter.aiScore.toFixed(1)} Điểm AI
              </Badge>
            </div>
            
            <div className="p-4 space-y-2">
              <div className="text-xs text-gray-500 truncate uppercase font-medium tracking-wide">
                {chapter.storyTitle}
              </div>

              <h3 className="font-semibold text-base leading-tight truncate group-hover:text-blue-600 transition-colors">
                {chapter.chapterTitle}
              </h3>
              
              <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="truncate max-w-[80px]">{chapter.authorUsername}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{new Date(chapter.submittedAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}