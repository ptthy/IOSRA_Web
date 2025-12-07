// File: app/Content/review/components/history-page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Loader2,
  FileText,
  Info
} from "lucide-react";
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
import { getModerationStories } from "@/services/moderationApi";

moment.locale("vi");

interface StoryFromAPI {
  reviewId: string;
  storyId: string;
  title: string;
  authorUsername: string;
  status: "pending" | "published" | "rejected";
  submittedAt: string;
  pendingNote?: string;
  aiResult: string;
}

export function HistoryPage() {
  const [historyData, setHistoryData] = useState<StoryFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State quản lý item đang được chọn để xem chi tiết
  const [selectedRejectItem, setSelectedRejectItem] = useState<StoryFromAPI | null>(null);

  const stats = useMemo(() => {
    const publishedCount = historyData.filter(
      (item) => item.status === "published"
    ).length;
    const rejectedCount = historyData.filter(
      (item) => item.status === "rejected"
    ).length;
    const totalCount = historyData.length;
    const pendingCount = 0;
    const approvalRate =
      totalCount > 0
        ? `${((publishedCount / totalCount) * 100).toFixed(0)}%`
        : "N/A";

    return [
      { label: "Tổng số", value: totalCount.toString(), color: "text-[var(--foreground)]" },
      { label: "Đã duyệt", value: publishedCount.toString(), color: "text-green-600" },
      { label: "Đã từ chối", value: rejectedCount.toString(), color: "text-red-600" },
      { label: "Đang chờ", value: pendingCount.toString(), color: "text-yellow-500" },
      { label: "Tỷ lệ duyệt", value: approvalRate, color: "text-[var(--primary)]" },
    ];
  }, [historyData]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);

        const published = await getModerationStories("published");
        const rejected = await getModerationStories("rejected");

        const combined = [...published, ...rejected].sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
        );

        setHistoryData(combined);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 transition-colors duration-300">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">Lịch Sử Kiểm Duyệt</h1>
        <p className="text-[var(--muted-foreground)]">Theo dõi các quyết định kiểm duyệt đã thực hiện</p>
      </motion.div>

      {/* Filter Bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch"
      >
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
          <Input placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
            className="pl-12 bg-[var(--card)] border-[var(--border)] h-12 w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Select defaultValue="all">
            <SelectTrigger className="flex-1 bg-[var(--card)] border-[var(--border)] h-12">
              <div className="flex items-center gap-2"><Filter className="w-4 h-4" /><SelectValue placeholder="Tất cả hành động" /></div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="7days">
            <SelectTrigger className="flex-1 bg-[var(--card)] border-[var(--border)] h-12">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><SelectValue placeholder="7 ngày qua" /></div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="7days">7 ngày qua</SelectItem>
              <SelectItem value="30days">30 ngày qua</SelectItem>
              <SelectItem value="all">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="bg-[var(--primary)] text-[var(--primary-foreground)] h-12 min-w-[140px]">
          <Download className="w-4 h-4 mr-2" />
          Xuất báo cáo
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8"
      >
        {stats.map((s, i) => (
          <Card key={i} className="p-5 border border-[var(--border)] bg-[var(--card)] rounded-xl shadow-sm hover:shadow-md transition">
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
              <TableHead className="py-4 px-6">Thời gian</TableHead>
              <TableHead className="py-4 px-6">Tiêu đề</TableHead>
              <TableHead className="py-4 px-6">Tác giả</TableHead>
              <TableHead className="py-4 px-6">Trạng thái</TableHead>
              <TableHead className="py-4 px-6">Ghi chú / Lý do</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--primary)]" />
                  <p className="mt-2 text-[var(--muted-foreground)]">Đang tải...</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-red-600">
                  <AlertCircle className="w-8 h-8 mx-auto" />
                  <p className="mt-2">Lỗi: {error}</p>
                </TableCell>
              </TableRow>
            ) : historyData.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-48 text-center text-[var(--muted-foreground)]">Không có dữ liệu</TableCell></TableRow>
            ) : (
              historyData.map((item) => (
                <TableRow key={item.reviewId} className="border-b hover:bg-[var(--muted)]/20 transition">
                  <TableCell className="py-4 px-6 text-[var(--muted-foreground)] flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {moment(item.submittedAt).fromNow()}
                  </TableCell>

                  <TableCell className="py-4 px-6 font-medium">
                    {item.title}
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2 text-[var(--primary)]">
                      <User className="w-4 h-4" />
                      {item.authorUsername}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <Badge
                      className={cn(
                        "gap-2 border-0 px-3 py-1.5",
                        item.status === "published" && "bg-green-100 text-green-700",
                        item.status === "rejected" && "bg-red-100 text-red-600",
                        item.status === "pending" && "bg-yellow-100 text-yellow-600"
                      )}
                    >
                      {item.status === "published" && <CheckCircle2 className="w-4 h-4" />}
                      {item.status === "rejected" && <XCircle className="w-4 h-4" />}
                      {item.status === "pending" && <Clock className="w-4 h-4" />}
                      {item.status === "published" ? "Đã duyệt" : item.status === "rejected" ? "Đã từ chối" : "Chờ duyệt"}
                    </Badge>
                  </TableCell>

                  {/* Nút Xem chi tiết */}
                  <TableCell className="py-4 px-6 text-sm">
                    {item.status === "rejected" ? (
                      <button
                        onClick={() => setSelectedRejectItem(item)}
                        className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                      >
                        <Info className="w-4 h-4" /> Xem chi tiết
                      </button>
                    ) : (
                      <span className="text-[var(--muted-foreground)]">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal hiển thị chi tiết lý do */}
      <Dialog open={!!selectedRejectItem} onOpenChange={() => setSelectedRejectItem(null)}>
        <DialogContent className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
                <XCircle className="w-5 h-5"/> Chi tiết từ chối
            </DialogTitle>
            <DialogDescription>
                Thông tin chi tiết về lý do tác phẩm bị từ chối.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRejectItem && (
            <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-2 text-sm bg-[var(--muted)]/50 p-3 rounded-md">
                    <span className="text-[var(--muted-foreground)]">Tiêu đề:</span>
                    <span className="col-span-2 font-medium truncate">{selectedRejectItem.title}</span>
                    
                    <span className="text-[var(--muted-foreground)]">Tác giả:</span>
                    <span className="col-span-2 font-medium">{selectedRejectItem.authorUsername}</span>
                    
                    <span className="text-[var(--muted-foreground)]">Ngày gửi:</span>
                    <span className="col-span-2">{new Date(selectedRejectItem.submittedAt).toLocaleString('vi-VN')}</span>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                    <h4 className="text-red-700 dark:text-red-400 font-semibold mb-2 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4"/> Lý do từ chối:
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                        {selectedRejectItem.pendingNote || "Không có lý do cụ thể."}
                    </p>
                </div>
                
                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={() => setSelectedRejectItem(null)}>Đóng</Button>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}