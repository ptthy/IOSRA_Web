// components/report/ReportDetailModal.tsx
"use client";
/**
 * MODAL HIỂN THỊ CHI TIẾT BÁO CÁO
 *
 * MỤC ĐÍCH:
 * - Hiển thị đầy đủ thông tin chi tiết của một báo cáo đã được tạo
 * - Cho phép người dùng/quản trị viên xem toàn bộ thông tin báo cáo
 * - Hiển thị trạng thái xử lý và các thông tin liên quan
 *
 * CHỨC NĂNG CHÍNH:
 * 1. Fetch và hiển thị chi tiết báo cáo từ server dựa trên reportId
 * 2. Hiển thị thông tin: mã báo cáo, trạng thái, loại đối tượng, người báo cáo
 * 3. Hiển thị lý do báo cáo và mô tả chi tiết
 * 4. Mapping các mã code (reason, status, type) thành text tiếng Việt dễ đọc
 * 5. Xử lý các trạng thái: loading, có dữ liệu, không có dữ liệu
 *
 * SỬ DỤNG KHI:
 * - User click "Xem chi tiết" từ danh sách báo cáo của mình
 * - Admin xem chi tiết báo cáo để xử lý
 * - Cần kiểm tra thông tin đầy đủ của một báo cáo cụ thể
 */
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
/**
 * Props interface cho component ReportDetailModal
 *
 * @property {string | null} reportId - ID của báo cáo cần hiển thị chi tiết
 * @property {boolean} isOpen - Trạng thái hiển thị modal
 * @property {() => void} onClose - Hàm đóng modal
 *
 * Component này dùng để hiển thị chi tiết thông tin của một báo cáo
 * khi người dùng click vào xem chi tiết từ danh sách báo cáo
 */
interface ReportDetailModalProps {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
}
/**
 * Mapping các lý do báo cáo từ mã code sang tên hiển thị tiếng Việt
 * Giúp hiển thị user-friendly thay vì mã code khó hiểu
 */
const REASON_MAP: Record<string, string> = {
  spam: "Nội dung rác / Spam",
  negative_content: "Nội dung tiêu cực / Xúc phạm",
  misinformation: "Thông tin sai lệch",
  ip_infringement: "Vi phạm bản quyền",
};
/**
 * Mapping trạng thái báo cáo với label và màu sắc tương ứng
 * Mỗi trạng thái có màu sắc khác nhau để dễ phân biệt:
 * - pending: màu vàng (đang chờ)
 * - approved: màu xanh lá (đã duyệt)
 * - rejected: màu đỏ (bị từ chối)
 */
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
/**
 * Mapping loại đối tượng bị báo cáo
 * Giúp hiển thị tên loại thay vì mã code
 */
const TYPE_MAP: Record<string, string> = {
  story: "Truyện",
  chapter: "Chương",
  comment: "Bình luận",
};
/**
 * Component hiển thị modal chi tiết báo cáo
 *
 * Luồng xử lý chính:
 * 1. Khi modal mở với reportId hợp lệ -> gọi API lấy chi tiết báo cáo
 * 2. Hiển thị loading trong khi fetch dữ liệu
 * 3. Hiển thị thông tin chi tiết báo cáo với định dạng dễ đọc
 * 4. Sử dụng các mapping để hiển thị text user-friendly
 * 5. Xử lý các trạng thái: loading, có dữ liệu, không có dữ liệu
 */
export function ReportDetailModal({
  reportId,
  isOpen,
  onClose,
}: ReportDetailModalProps) {
  // State lưu trữ chi tiết báo cáo
  const [report, setReport] = useState<ReportItem | null>(null);
  // State quản lý trạng thái loading
  const [loading, setLoading] = useState(false);
  /**
   * useEffect hook theo dõi sự thay đổi của isOpen và reportId
   * Logic: Khi modal mở và có reportId -> fetch dữ liệu
   * Khi modal đóng -> reset state về null
   */
  useEffect(() => {
    if (isOpen && reportId) {
      fetchDetail();
    } else {
      // Reset khi đóng modal để lần mở sau không hiển thị dữ liệu cũ
      setReport(null);
    }
  }, [isOpen, reportId]);
  /**
   * Hàm gọi API lấy chi tiết báo cáo
   * Xử lý 3 trạng thái: bắt đầu loading -> gọi API -> kết thúc loading
   */
  const fetchDetail = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      // Gọi service để lấy dữ liệu
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
        {/* 
          Xử lý 3 trường hợp:
          1. Đang loading: hiển thị spinner
          2. Có dữ liệu: hiển thị chi tiết báo cáo
          3. Không có dữ liệu: hiển thị thông báo
        */}
        {loading ? (
          // Trạng thái loading: hiển thị spinner xoay
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : report ? (
          // Có dữ liệu: hiển thị chi tiết báo cáo
          <div className="space-y-4">
            {/* 
              Phần header: Mã báo cáo và trạng thái
              - Flex justify-between: chia đều 2 bên
              - border-b: đường kẻ phân cách
            */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">
                  Mã báo cáo
                </p>
                {/* 
                  Hiển thị mã báo cáo với font-mono để dễ đọc
                  break-all: cho phép ngắt từ ở bất kỳ ký tự nào
                */}
                <p className="font-mono text-sm break-all">{report.reportId}</p>
              </div>
              {/* 
                Badge hiển thị trạng thái với màu tương ứng
                Sử dụng STATUS_MAP để lấy label và màu
              */}
              <Badge
                variant="outline"
                className={`${
                  STATUS_MAP[report.status]?.color || ""
                } px-3 py-1`}
              >
                {STATUS_MAP[report.status]?.label || report.status}
              </Badge>
            </div>
            {/* 
              Grid 2 cột hiển thị thông tin cơ bản:
              - Loại đối tượng bị báo cáo
              - Người báo cáo
            */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" /> Loại đối tượng
                </div>
                <p className="font-medium">
                  {/* 
                    Sử dụng TYPE_MAP để dịch mã type sang tên dễ đọc
                    Fallback về report.targetType nếu không có trong map
                  */}
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
            {/* 
              Phần nội dung báo cáo:
              - Lý do chính (bắt buộc)
              - Mô tả chi tiết (tùy chọn)
              - Background mờ để phân biệt với phần khác
            */}
            <div className="bg-muted/30 p-3 rounded-lg border space-y-2">
              <div>
                <span className="text-sm font-semibold">Lý do chính:</span>
                <p className="text-destructive font-medium mt-1">
                  {/* 
                  Hiển thị lý do với màu đỏ nổi bật
                  Sử dụng REASON_MAP để dịch mã lý do
                */}
                  {REASON_MAP[report.reason] || report.reason}
                </p>
              </div>

              <div className="pt-2 border-t border-dashed border-border">
                <span className="text-sm font-semibold">Mô tả chi tiết:</span>
                {/* 
                  Hiển thị mô tả chi tiết
                  whitespace-pre-wrap: giữ nguyên định dạng xuống dòng
                  Fallback message nếu không có mô tả
                */}
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {report.details || "Không có mô tả thêm."}
                </p>
              </div>
            </div>
            {/* 
              Footer: Hiển thị thời gian tạo báo cáo
              Định dạng ngày giờ theo chuẩn Việt Nam
            */}
            <div className="text-xs text-muted-foreground flex justify-end gap-1 pt-2">
              <Calendar className="h-3 w-3" />
              Tạo lúc: {new Date(report.createdAt).toLocaleString("vi-VN")}
            </div>
          </div>
        ) : (
          // Không có dữ liệu: hiển thị thông báo
          <p className="text-center text-muted-foreground py-4">
            Không tìm thấy dữ liệu.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
