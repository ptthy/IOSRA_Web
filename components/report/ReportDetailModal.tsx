// components/report/ReportDetailModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, User, Info } from "lucide-react";
import { reportService, ReportItem } from "@/services/reportService";

interface ReportDetailModalProps {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const REASON_MAP: Record<string, string> = {
  spam: "Nội dung rác / Spam",
  negative_content: "Nội dung tiêu cực / Xúc phạm",
  misinformation: "Thông tin sai lệch",
  ip_infringement: "Vi phạm bản quyền",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: {
    label: "Đang chờ xử lý",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  approved: {
    label: "Đã duyệt (Vi phạm)",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  rejected: {
    label: "Bị từ chối (Không vi phạm)",
    color: "bg-red-100 text-red-800 border-red-200",
  },
};

const TYPE_MAP: Record<string, string> = {
  story: "Truyện",
  chapter: "Chương",
  comment: "Bình luận",
};

export function ReportDetailModal({
  reportId,
  isOpen,
  onClose,
}: ReportDetailModalProps) {
  const [report, setReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && reportId) {
      fetchDetail();
    } else {
      setReport(null);
    }
  }, [isOpen, reportId]);

  const fetchDetail = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const data = await reportService.getReportDetail(reportId);
      setReport(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chi tiết báo cáo</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : report ? (
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  Mã báo cáo
                </p>
                <p className="font-mono text-sm break-all">{report.reportId}</p>
              </div>
              <Badge
                variant="outline"
                className={`${
                  STATUS_MAP[report.status]?.color || ""
                } px-3 py-1`}
              >
                {STATUS_MAP[report.status]?.label || report.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" /> Loại đối tượng
                </div>
                <p className="font-medium">
                  {TYPE_MAP[report.targetType] || report.targetType}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" /> Người báo cáo
                </div>
                <p className="font-medium">{report.reporterUsername}</p>
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg border space-y-2">
              <div>
                <span className="text-sm font-semibold">Lý do chính:</span>
                <p className="text-destructive font-medium mt-1">
                  {REASON_MAP[report.reason] || report.reason}
                </p>
              </div>

              <div className="pt-2 border-t border-dashed border-border">
                <span className="text-sm font-semibold">Mô tả chi tiết:</span>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {report.details || "Không có mô tả thêm."}
                </p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex justify-end gap-1 pt-2">
              <Calendar className="h-3 w-3" />
              Tạo lúc: {new Date(report.createdAt).toLocaleString("vi-VN")}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Không tìm thấy dữ liệu.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
