"use client";

import { Search, User, Clock, BookOpen } from "lucide-react";
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

interface ContentListProps {
  onReview: (content: any) => void;
}

export function ContentList({ onReview }: ContentListProps) {
  const contents = [
    {
      id: 1,
      title: "Hành trình vào thế giới isekai",
      author: "NguyenVanA",
      type: "Truyện mới",
      typeColor:
        "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200",
      genre: "Fantasy",
      genreColor:
        "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
      submittedAt: "2025-10-12 09:30",
      wordCount: "45,000 từ",
    },
    {
      id: 2,
      title: "Chương 24 - Đại chiến",
      subtitle: "Truyện: Vũ khúc của định mệnh",
      author: "LeVanC",
      type: "Chương",
      typeColor:
        "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200",
      genre: "Action",
      genreColor:
        "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200",
      submittedAt: "2025-10-12 08:15",
      wordCount: "5,200 từ",
    },
    {
      id: 3,
      title: "Tình yêu trong mùa thu",
      author: "TranThiB",
      type: "Truyện mới",
      typeColor:
        "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200",
      genre: "Romance",
      genreColor:
        "bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200",
      submittedAt: "2025-10-12 07:45",
      wordCount: "32,000 từ",
    },
    {
      id: 4,
      title: "Chương 15 - Bí mật được hé lộ",
      subtitle: "Truyện: Thám tử bóng đêm",
      author: "PhamTanD",
      type: "Chương",
      typeColor:
        "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200",
      genre: "Mystery",
      genreColor:
        "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200",
      submittedAt: "2025-10-11 23:20",
      wordCount: "4,800 từ",
    },
    {
      id: 5,
      title: "Chiến tranh ngân hà",
      author: "HoangThiE",
      type: "Truyện mới",
      typeColor:
        "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200",
      genre: "Sci-Fi",
      genreColor:
        "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200",
      submittedAt: "2025-10-11 20:15",
      wordCount: "52,000 từ",
    },
  ];

  return (
    <div
      className="min-h-screen p-8 transition-colors duration-300"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
        // ✅ Cập nhật dòng này để đảm bảo font hiển thị tiếng Việt chuẩn
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
          Danh sách truyện và chương mới cần được kiểm tra và phê duyệt
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
                  Loại
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
                  Thể loại
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
                  Thời gian gửi
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
                  Số từ
                </TableHead>
                <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6 text-center">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {contents.map((content) => (
                <TableRow
                  key={content.id}
                  className="border-b border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/20 transition-colors"
                >
                  <TableCell className="py-4 px-6">
                    <div>
                      <div className="text-[var(--foreground)] font-medium">
                        {content.title}
                      </div>
                      {content.subtitle && (
                        <div className="text-sm text-[var(--muted-foreground)]">
                          {content.subtitle}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2 text-[var(--primary)]">
                      <User className="w-4 h-4" />
                      {content.author}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <Badge variant="outline" className={content.typeColor}>
                      {content.type}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <Badge variant="outline" className={content.genreColor}>
                      {content.genre}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4 px-6 text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {content.submittedAt}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6 text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {content.wordCount}
                    </div>
                  </TableCell>

                  {/* Button */}
                  <TableCell className="py-4 px-6 text-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Button
                        onClick={() => onReview(content)}
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
