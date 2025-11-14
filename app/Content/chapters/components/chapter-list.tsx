// File: app/Content/chapters/components/chapter-list.tsx (ĐÃ SỬA LAYOUT)
"use client";

import React, { useState, useEffect } from "react";
import { 
  Loader2, 
  AlertCircle, 
  BookOpen, 
  Clock, 
  User, 
  AlertTriangle,
  Search 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { useModeration } from "@/context/ModerationContext"; // (Tùy chọn)

import { getModerationChapters } from "@/services/moderationApi";

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
        setError(null);
        
        const data: ChapterFromAPI[] = await getModerationChapters('pending');
        const filteredData = data; // Hiển thị TẤT CẢ data API trả về

        setChapters(filteredData);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingChapters();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
        <p className="ml-3 text-lg">Đang tải danh sách chương...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px] bg-red-50 text-red-700 p-4 rounded-lg">
        <AlertCircle className="w-6 h-6 mr-2" />
        <p className="text-lg">Lỗi khi tải dữ liệu: {error}</p>
      </div>
    );
  }
  
  if (chapters.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-lg text-gray-500">Không có chương nào chờ duyệt.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-8 transition-colors duration-300"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
        fontFamily:
          "'Poppins', 'Poppins Vietnamese', 'Noto Sans Vietnamese', 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">
          Chương Chờ Kiểm Duyệt
        </h1>
        <p className="text-[var(--muted-foreground)]">
          {`Bạn có ${chapters.length} chương cần kiểm tra và phê duyệt`}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Tìm kiếm theo tên chương, tên truyện, tác giả..."
          className="pl-12 h-12 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm transition-colors duration-300">
          <Table className="bg-[var(--card)] transition-colors duration-300">
            <TableHeader>
              <TableRow className="bg-[var(--card)] border-b border-[var(--border)] hover:bg-[var(--muted)]/10 transition-colors">
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
                  Tên Chương
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
                  Truyện
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
                  Tác giả
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
                  Đánh giá AI
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
                  Thời gian gửi
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6 text-center">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {chapters.map((chapter) => (
                <TableRow
                  key={chapter.reviewId}
                  className="border-b border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/20 transition-colors"
                >
                  <TableCell className="py-4 px-6">
                    <div>
                      <div className="text-[var(--foreground)] font-medium">
                        {chapter.chapterTitle}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <div className="text-[var(--primary)]">
                      {chapter.storyTitle}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2 text-[var(--primary)]">
                      <User className="w-4 h-4" />
                      {chapter.authorUsername}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <Badge 
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-300"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {chapter.aiScore.toFixed(1)} Điểm
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4 px-6 text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(chapter.submittedAt).toLocaleString('vi-VN')}
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4 px-6 text-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Button
                        onClick={() => onReviewClick(chapter)}
                        className="bg-[var(--primary)] hover:bg-[color-mix(in_srgb,_var(--primary)_75%,_black)] text-[var(--primary-foreground)] shadow-md font-medium px-4 py-2 rounded-lg transition-all"
                      >
                        Kiểm duyệt
                      </Button>
                    </motion.div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* Grid View (Ẩn đi, chỉ dùng Table) */}
      {/* <motion.div
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
      </motion.div> */}
    </div>
  );
}