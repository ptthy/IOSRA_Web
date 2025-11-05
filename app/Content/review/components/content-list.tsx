// File: review/components/content-list.tsx
"use client";

import { Search, User, Clock, Loader2, AlertCircle } from "lucide-react"; // Bỏ BookOpen (không dùng)
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useModeration } from "@/context/ModerationContext"; // ✅ SỬA 1: Import hook Context
import { getModerationStories } from "@/services/moderationApi";

// Định nghĩa kiểu dữ liệu từ API
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

interface ContentListProps {
  onReview: (content: StoryFromAPI) => void;
}

export function ContentList({ onReview }: ContentListProps) {
  const [stories, setStories] = useState<StoryFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ SỬA 2: Lấy hàm 'updateCount' từ context
  const { updateCount } = useModeration();

  useEffect(() => {
    const fetchPendingStories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data: StoryFromAPI[] = await getModerationStories('pending');
        setStories(data);
        
        // ✅ SỬA 3: Gửi số lượng (data.length) lên Context
        updateCount('pending', data.length);
        
      } catch (err: any) {
        setError(err.message);
        updateCount('pending', 0); // Nếu lỗi, set số đếm về 0
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingStories();
    
    // ✅ SỬA 4: Thêm 'updateCount' vào dependency array
  }, [updateCount]); 
  

  // --- Render ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
        <p className="ml-3 text-lg">Đang tải danh sách...</p>
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

  if (stories.length === 0) {
    // Tự động cập nhật sidebar là 0 nếu không có truyện
    // (useEffect đã làm việc này)
    return (
       <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-lg text-gray-500">Không có truyện nào chờ duyệt.</p>
      </div>
    )
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
          Truyện & Chương Chờ Kiểm Duyệt
        </h1>
        <p className="text-[var(--muted-foreground)]">
          {`Bạn có ${stories.length} nội dung cần kiểm tra và phê duyệt`}
        </p>
      </motion.div>

      {/* Search (Giữ nguyên) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Tìm kiếm theo tên truyện, tác giả, thể loại..."
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
                  Tiêu đề
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
                  Tác giả
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
                  Đánh giá AI
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
                  Thể loại
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
              {stories.map((story) => (
                <TableRow
                  key={story.reviewId}
                  className="border-b border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/20 transition-colors"
                >
                  <TableCell className="py-4 px-6">
                    <div>
                      <div className="text-[var(--foreground)] font-medium">
                        {story.title}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2 text-[var(--primary)]">
                      <User className="w-4 h-4" />
                      {story.authorUsername}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <Badge variant={story.aiResult === 'rejected' ? 'destructive' : 'outline'}
                      className={cn(
                        story.aiResult === 'flagged' && 'bg-yellow-100 text-yellow-800',
                        story.aiResult === 'approved' && 'bg-green-100 text-green-800',
                        story.aiResult === 'rejected' && 'bg-red-100 text-red-800'
                      )}
                    >
                      {story.aiResult} ({(story.aiScore * 100).toFixed(0)}%)
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                     {story.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag.tagId} variant="outline" className="mr-1 mb-1 bg-blue-100 text-blue-800">
                        {tag.tagName}
                      </Badge>
                     ))}
                  </TableCell>

                  <TableCell className="py-4 px-6 text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(story.submittedAt).toLocaleString('vi-VN')}
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4 px-6 text-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Button
                        onClick={() => onReview(story)}
                        className="bg-[var(--primary)] hover:bg-[color-mix(in srgb, var(--primary) 75%, black)] text-[var(--primary-foreground)] shadow-md font-medium px-4 py-2 rounded-lg transition-all"
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
    </div>
  );
}
