// app/all-report/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { reportService, ReportItem } from "@/services/reportService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Flag, AlertCircle, Clock } from "lucide-react";
import { ReportDetailModal } from "@/components/report/ReportDetailModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// Map tiếng Việt cho giao diện list
const REASON_MAP_SHORT: Record<string, string> = {
  spam: "Spam",
  negative_content: "Tiêu cực",
  misinformation: "Sai lệch",
  ip_infringement: "Bản quyền",
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Chờ xử lý",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  approved: {
    label: "Đã duyệt",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  rejected: {
    label: "Từ chối",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  story: { label: "Truyện", color: "bg-blue-50 text-blue-700" },
  chapter: { label: "Chương", color: "bg-purple-50 text-purple-700" },
  comment: { label: "Bình luận", color: "bg-gray-50 text-gray-700" },
};

// Hàm cắt chuỗi 5 từ
const truncateDetails = (text: string) => {
  if (!text) return "";
  const words = text.split(" ");
  if (words.length <= 5) return text;
  return words.slice(0, 5).join(" ") + "...";
};

export default function AllReportPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const handleApiError = (error: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic từ Backend
    if (error.response && error.response.data && error.response.data.error) {
      const { message, details } = error.response.data.error;

      // Ưu tiên Validation (details)
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          // Nối các lỗi lại thành 1 câu
          const msg = details[firstKey].join(" ");
          toast.error(msg);
          return;
        }
      }

      // Message từ Backend
      if (message) {
        toast.error(message);
        return;
      }
    }

    // 2. Fallback
    const fallbackMsg = error.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // -------------------
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.getMyReports(1, 50); // Lấy 50 cái mới nhất
      setReports(data.items);
      // } catch (error) {
      //   console.error(error);
      // } finally {
      //   setLoading(false);
      // }
    } catch (error: any) {
      console.error(error);
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải lịch sử báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7.5xl mx-auto space-y-6">
        <Card className="shadow-lg border-t-4 border-t-red-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Flag className="h-6 w-6 text-red-600" />
              Lịch sử báo cáo
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Theo dõi trạng thái các báo cáo vi phạm bạn đã gửi.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-3">
                {/* Header Row (Optional, giống table header) */}
                <div className="hidden md:flex px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="w-[120px]">Lý do</div>
                  <div className="w-[100px]">Trạng thái</div>
                  <div className="w-[80px]">Loại</div>
                  <div className="flex-1">Chi tiết</div>
                  <div className="w-[100px] text-right">Ngày gửi</div>
                </div>

                {reports.map((item) => (
                  <div
                    key={item.reportId}
                    onClick={() => setSelectedReportId(item.reportId)}
                    className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 rounded-lg border border-border/60 hover:border-red-300 hover:bg-red-50/30 transition-all cursor-pointer bg-card"
                  >
                    {/* Reason (Cột 1) */}
                    <div className="flex items-center gap-2 md:w-[120px]">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="font-bold text-sm">
                        {REASON_MAP_SHORT[item.reason] || item.reason}
                      </span>
                    </div>

                    {/* Status (Cột 2) */}
                    <div className="md:w-[100px]">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase font-bold",
                          STATUS_MAP[item.status]?.className
                        )}
                      >
                        {STATUS_MAP[item.status]?.label || item.status}
                      </Badge>
                    </div>

                    {/* Target Type (Cột 3) */}
                    <div className="md:w-[80px]">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          TYPE_MAP[item.targetType]?.color
                        )}
                      >
                        {TYPE_MAP[item.targetType]?.label || item.targetType}
                      </Badge>
                    </div>

                    {/* Details (Cột 4 - Truncated 5 words) */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate italic">
                        {item.details ? (
                          `"${truncateDetails(item.details)}"`
                        ) : (
                          <span className="opacity-50">Không có mô tả</span>
                        )}
                      </p>
                    </div>

                    {/* Date (Cột 5) */}
                    <div className="md:w-[100px] text-right text-xs text-muted-foreground flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3 md:hidden" />
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Flag className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Bạn chưa gửi báo cáo nào.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal chi tiết */}
      <ReportDetailModal
        isOpen={!!selectedReportId}
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />
    </div>
  );
}
