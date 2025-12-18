// File: app/Content/review/components/history-page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Download,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Loader2,
  FileText,
  Info,
  BookOpen,
  FileType,
  Bot // <--- Thêm icon Bot
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import moment from "moment";
import "moment/locale/vi";
import { getModerationStories, getModerationChapters } from "@/services/moderationApi";

moment.locale("vi");

// Interface chung để hiển thị lên bảng
interface HistoryItem {
  id: string; 
  type: "story" | "chapter";
  title: string; 
  subTitle?: string; 
  author: string;
  status: "pending" | "published" | "rejected";
  date: string;
  note?: string; 
  aiScore?: number; // <--- MỚI: Thêm trường điểm AI
}

export function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"story" | "chapter">("story");
  const [data, setData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTime, setFilterTime] = useState("7days");

  // Modal detail
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  // Helper: Màu sắc cho điểm AI
  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return "text-gray-500";
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 5) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // --- 1. Fetch Data Logic ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        let combined: HistoryItem[] = [];

        if (activeTab === "story") {
          // Gọi API Truyện
          const [published, rejected] = await Promise.all([
            getModerationStories("published"),
            getModerationStories("rejected"),
          ]);

          const mapStory = (list: any[], status: any) =>
            list.map((item: any) => ({
              id: item.reviewId,
              type: "story" as const,
              title: item.title,
              author: item.authorUsername,
              status: item.status,
              date: item.submittedAt,
              note: item.pendingNote,
              aiScore: item.aiScore, // <--- Map dữ liệu aiScore
            }));

          combined = [...mapStory(published, "published"), ...mapStory(rejected, "rejected")];

        } else {
          // Gọi API Chương
          const [published, rejected] = await Promise.all([
            getModerationChapters("published"),
            getModerationChapters("rejected"),
          ]);

          const mapChapter = (list: any[], status: any) =>
            list.map((item: any) => ({
              id: item.reviewId,
              type: "chapter" as const,
              title: item.chapterTitle,
              subTitle: item.storyTitle,
              author: item.authorUsername,
              status: item.status,
              date: item.submittedAt,
              note: item.aiFeedback,
              aiScore: item.aiScore, // <--- Map dữ liệu aiScore
            }));

          combined = [...mapChapter(published, "published"), ...mapChapter(rejected, "rejected")];
        }

        // Sort mặc định theo thời gian mới nhất
        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setData(combined);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // --- 2. Filter Logic (Client-side) ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Lọc theo Status
      if (filterStatus !== "all") {
        if (filterStatus === "published" && item.status !== "published") return false;
        if (filterStatus === "rejected" && item.status !== "rejected") return false;
      }

      // Lọc theo Time
      if (filterTime !== "all") {
        const itemDate = moment(item.date);
        const now = moment();
        if (filterTime === "today" && !itemDate.isSame(now, "day")) return false;
        if (filterTime === "7days" && itemDate.isBefore(now.subtract(7, "days"))) return false;
        if (filterTime === "30days" && itemDate.isBefore(now.subtract(30, "days"))) return false;
      }

      return true;
    });
  }, [data, filterStatus, filterTime]);

  // --- 3. Stats Calculation ---
  const stats = useMemo(() => {
    const total = filteredData.length;
    const published = filteredData.filter((i) => i.status === "published").length;
    const rejected = filteredData.filter((i) => i.status === "rejected").length;
    const rate = total > 0 ? ((published / total) * 100).toFixed(0) : 0;

    return [
      { label: "Tổng số mục", value: total, color: "text-[var(--foreground)]" },
      { label: "Đã duyệt", value: published, color: "text-green-600" },
      { label: "Đã từ chối", value: rejected, color: "text-red-600" },
      { label: "Tỷ lệ duyệt", value: `${rate}%`, color: "text-blue-600" },
    ];
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 transition-colors duration-300">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">Lịch Sử Kiểm Duyệt</h1>
        <p className="text-[var(--muted-foreground)]">Theo dõi các quyết định duyệt Truyện và Chương</p>
      </motion.div>

      {/* FILTER BAR */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center"
      >
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          
          {/* 1. Filter Loại Nội Dung */}
          <div className="bg-[var(--card)] p-1 rounded-lg border border-[var(--border)] flex">
            <button
              onClick={() => setActiveTab("story")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                activeTab === "story" 
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm" 
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <BookOpen className="w-4 h-4" /> Truyện
            </button>
            <button
              onClick={() => setActiveTab("chapter")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                activeTab === "chapter" 
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm" 
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <FileType className="w-4 h-4" /> Chương
            </button>
          </div>

          {/* 2. Filter Trạng Thái */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] bg-[var(--card)] border-[var(--border)] h-11">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--muted-foreground)]" />
                <SelectValue placeholder="Trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="published">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Đã từ chối </SelectItem>
            </SelectContent>
          </Select>

          {/* 3. Filter Thời Gian */}
          <Select value={filterTime} onValueChange={setFilterTime}>
            <SelectTrigger className="w-[180px] bg-[var(--card)] border-[var(--border)] h-11">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
                <SelectValue placeholder="Thời gian" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="7days">7 ngày qua</SelectItem>
              <SelectItem value="30days">30 ngày qua</SelectItem>
              <SelectItem value="all">Tất cả thời gian</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8"
      >
        {stats.map((s, i) => (
          <Card key={i} className="p-5 border border-[var(--border)] bg-[var(--card)] rounded-xl shadow-sm">
            <p className={`text-3xl font-semibold mb-1 ${s.color}`}>{s.value}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{s.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Main Table */}
      <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)] rounded-xl shadow-sm">
        <Table className={cn("w-full text-sm", isLoading && "opacity-50 pointer-events-none")}>
          <TableHeader>
            <TableRow className="bg-[var(--muted)]/20">
              <TableHead className="py-4 px-6 w-[180px]">Thời gian</TableHead>
              <TableHead className="py-4 px-6 min-w-[250px]">
                {activeTab === "story" ? "Tên Truyện" : "Thông tin Chương"}
              </TableHead>
              <TableHead className="py-4 px-6">Tác giả</TableHead>
              <TableHead className="py-4 px-6 w-[150px]">Trạng thái</TableHead>
              <TableHead className="py-4 px-6 text-right">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--primary)]" />
                  <p className="mt-2 text-[var(--muted-foreground)]">Đang tải dữ liệu {activeTab === "story" ? "truyện" : "chương"}...</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-red-600">
                  <AlertCircle className="w-8 h-8 mx-auto" />
                  <p className="mt-2">Lỗi: {error}</p>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-[var(--muted-foreground)]">
                  Không có dữ liệu trong khoảng thời gian này
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="border-b hover:bg-[var(--muted)]/20 transition">
                  <TableCell className="py-4 px-6 text-[var(--muted-foreground)]">
                    <div className="flex flex-col">
                      <span className="font-medium text-[var(--foreground)]">{moment(item.date).format("HH:mm")}</span>
                      <span className="text-xs">{moment(item.date).format("DD/MM/YYYY")}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-base">{item.title}</span>
                      {item.type === "chapter" && (
                        <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Truyện: {item.subTitle}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2 text-[var(--primary)]">
                      <User className="w-4 h-4" />
                      {item.author}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <Badge
                      className={cn(
                        "gap-2 border-0 px-3 py-1.5 w-fit",
                        item.status === "published" && "bg-green-100 text-green-700 hover:bg-green-200",
                        item.status === "rejected" && "bg-red-100 text-red-600 hover:bg-red-200"
                      )}
                    >
                      {item.status === "published" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {item.status === "published" ? "Đã duyệt" : "Từ chối"}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4 px-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Info className="w-4 h-4 mr-1" /> Xem
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal Detail */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className={cn("flex items-center gap-2 text-xl", selectedItem?.status === 'rejected' ? "text-red-600" : "text-green-600")}>
              {selectedItem?.status === 'rejected' ? <XCircle className="w-6 h-6"/> : <CheckCircle2 className="w-6 h-6"/>}
              {selectedItem?.status === 'rejected' ? "Chi tiết từ chối" : "Thông tin đã duyệt"}
            </DialogTitle>
            <DialogDescription>
              ID: <span className="font-mono text-xs">{selectedItem?.id}</span>
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-3 text-sm bg-[var(--muted)]/50 p-4 rounded-lg border border-[var(--border)]">
                    <span className="text-[var(--muted-foreground)]">Loại:</span>
                    <span className="col-span-2 font-medium capitalize">{selectedItem.type === 'story' ? 'Truyện' : 'Chương'}</span>

                    <span className="text-[var(--muted-foreground)]">Tiêu đề:</span>
                    <span className="col-span-2 font-medium">{selectedItem.title}</span>
                    
                    {selectedItem.type === 'chapter' && (
                      <>
                        <span className="text-[var(--muted-foreground)]">Thuộc truyện:</span>
                        <span className="col-span-2">{selectedItem.subTitle}</span>
                      </>
                    )}

                    <span className="text-[var(--muted-foreground)]">Tác giả:</span>
                    <span className="col-span-2 font-medium text-[var(--primary)]">{selectedItem.author}</span>
                    
                    {/* --- HIỂN THỊ AI SCORE --- */}
                    <span className="text-[var(--muted-foreground)] flex items-center gap-2">
                       <Bot className="w-4 h-4"/> Điểm AI:
                    </span>
                    <span className={cn("col-span-2 font-bold text-base", getScoreColor(selectedItem.aiScore))}>
                       {selectedItem.aiScore !== undefined ? `${selectedItem.aiScore} / 10` : "Chưa có đánh giá"}
                    </span>
                    {/* ------------------------- */}

                    <span className="text-[var(--muted-foreground)]">Thời gian xử lý:</span>
                    <span className="col-span-2">{new Date(selectedItem.date).toLocaleString('vi-VN')}</span>
                </div>

                <div className={cn(
                  "p-4 rounded-lg border",
                  selectedItem.status === 'rejected' 
                    ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                    : "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30"
                )}>
                    <h4 className={cn(
                      "font-semibold mb-2 text-sm flex items-center gap-2",
                      selectedItem.status === 'rejected' ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"
                    )}>
                        <FileText className="w-4 h-4"/> 
                        {selectedItem.status === 'rejected' ? "Lý do từ chối:" : "Ghi chú / Feedback:"}
                    </h4>
                    <p className="text-sm text-[var(--foreground)] whitespace-pre-line leading-relaxed max-h-[200px] overflow-y-auto">
                        {selectedItem.note || "Không có nội dung chi tiết."}
                    </p>
                </div>
                
                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={() => setSelectedItem(null)}>Đóng</Button>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}