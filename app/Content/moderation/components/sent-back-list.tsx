"use client";

import { Search, AlertCircle, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface SentBackListProps {
  onReview: (content: any) => void;
}

export function SentBackList({ onReview }: SentBackListProps) {
  const sentBackStories = [
      {
        id: 1,
        title: "Cuộc phiêu lưu của anh hùng",
        author: "TranThiB",
        genre: "Fantasy",
        badge: "Last",
        badgeColor: "bg-purple-600 text-white",
        moderatorFeedback: {
          date: "2025-10-10",
          message:
            "Nội dung chưa rõ ràng, lối hành sự cần phải cải thiện.",
        },
        authorRevision: {
          date: "2025-10-12 18:15",
          message:
            "Đã sửa lại cả lối hành sự và cải thiện nội dung theo góp ý.",
        },
      },
      {
        id: 2,
        title: "Tình yêu qua thời gian",
        author: "LeVanC",
        genre: "Romance",
        badge: "Last",
        badgeColor: "bg-purple-600 text-white",
        moderatorFeedback: {
          date: "2025-10-09",
          message:
            "Một số đoạn nội dung không phù hợp với tiêu chuẩn cộng đồng.",
        },
        authorRevision: {
          date: "2025-10-11 16:30",
          message:
            "Đã chỉnh sửa và làm nhẹ các đoạn nội dung nhạy cảm.",
        },
      },
    ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

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
          Truyện Gửi Lại
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Danh sách truyện đã được tác giả gửi lại sau khi bị chỉnh sửa
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
          placeholder="Tìm kiếm theo tên truyện hoặc tác giả..."
          className="pl-12 h-12 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
        />
      </motion.div>

      {/* Stories List */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {sentBackStories.map((story) => (
          <motion.div key={story.id} variants={item}>
            <Card className="p-6 border border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">
                      {story.title}
                    </h3>
                    <Badge className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white border-0">
                      {story.badge}
                    </Badge>
                  </div>
                  <div className="text-[var(--muted-foreground)] mb-2">
                    Tác giả:{" "}
                    <span className="text-[var(--primary)] font-medium">
                      {story.author}
                    </span>{" "}
                    • Thể loại: {story.genre}
                  </div>
                </div>
                <Button
                  className="bg-[var(--primary)] hover:bg-[color-mix(in srgb, var(--primary) 75%, black)] text-[var(--primary-foreground)] shadow-md font-medium px-4 py-2 rounded-lg transition-all"
                  onClick={() => onReview(story)}
                >
                  Xem lại
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Moderator Feedback */}
              <div className="p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)] text-[var(--destructive)] rounded-xl">

                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-800 dark:text-red-300 font-medium">
                      Phản hồi trước ({story.moderatorFeedback.date})
                    </span>
                  </div>
                  <p className="text-sm text-red-900 dark:text-red-200">
                    {story.moderatorFeedback.message}
                  </p>
                </div>

                {/* Author Revision */}
              <div className="p-4 bg-[var(--primary)]/10 border border-[var(--primary)] text-[var(--primary)] rounded-xl">

                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                      Chỉnh sửa của tác giả ({story.authorRevision.date})
                    </span>
                  </div>
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    {story.authorRevision.message}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
