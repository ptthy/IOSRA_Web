// File: app/Content/moderation/components/report-action-modal.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label"; // ✅ Import thêm
import { Input } from "@/components/ui/input"; // ✅ Import thêm
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // ✅ Import thêm
import { Loader2, EyeOff, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { updateReportStatus, updateContentStatus } from "@/services/moderationApi";


interface ReportItem {
  id: string;
  targetType: "story" | "chapter" | "comment" | string;
  targetId: string;
  reason: string;
  details: string;
  status: "pending" | "resolved" | "rejected" | string;
  reporterId: string;
  reportedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

interface ReportActionModalProps {
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReportActionModal({ report, isOpen, onClose, onSuccess }: ReportActionModalProps) {
  const [loading, setLoading] = useState(false);

  // ✅ VALIDATE: State cho việc xử lý phạt (Strike & Ban Date)
  const [strikeLevel, setStrikeLevel] = useState<string>("0");
  const [banDate, setBanDate] = useState<string>("");

  // Kiểm tra null được thực hiện ngay ở đây, không cần 'if (!report) return null;' nữa.
  if (!report) return null;

  // 1. Xử lý: Ẩn nội dung (Hide Content)
  const handleHideContent = async () => {
    if (!confirm(`Bạn có chắc chắn muốn ẨN nội dung ${report.targetType} này không?`)) return;
    setLoading(true);
    try {

      await updateContentStatus(report.targetType as 'story' | 'chapter' | 'comment', report.targetId, 'hidden');
      toast.success(`Đã ẩn ${report.targetType} thành công!`);
    } catch (error: any) {
      // ✅ VALIDATE: Check lỗi TargetOwnerNotFound (nếu API trả về khi ẩn)
      if (error.message?.includes("TargetOwnerNotFound") || error.code === "TargetOwnerNotFound") {
        toast.error("Không tìm thấy chủ sở hữu nội dung (Có thể tài khoản đã bị xóa).");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };
const reasonMapping: Record<string, string> = {
  spam: "Nội dung rác",
  negative_content: "Nội dung tiêu cực,xúc phạm",
  misinformation: "Thông tin sai lệch",
  ip_infringement: "Vi phạm bản quyền",
};

  // 2. Xử lý: Report Đúng (Resolved) -> User bị phạt Strike
  const handleResolve = async () => {
    // ✅ VALIDATE: Kiểm tra các trường bắt buộc cho lỗi RestrictedUntilRequired
    if (strikeLevel !== "0" && strikeLevel !== "1" && strikeLevel !== "2" && strikeLevel !== "3") {
       // ✅ VALIDATE: InvalidStrike
       toast.error("Mức phạt (Strike) không hợp lệ.");
       return;
    }

    // Nếu phạt nặng (Strike > 0) thường đi kèm Ban, cần check ngày
    // (Logic này tùy thuộc vào quy định của bạn, ví dụ Strike > 0 thì cần ngày hết hạn strike)
    if (parseInt(strikeLevel) > 0 && !banDate) {
        // ✅ VALIDATE: RestrictedUntilRequired
        toast.error("Vui lòng chọn thời gian kết thúc hạn chế (Restricted Until) khi đánh gậy.");
        return;
    }

    if (!confirm("Xác nhận báo cáo ĐÚNG? User vi phạm sẽ bị tính phạt.")) return;
    
    setLoading(true);
    try {
     
      await updateReportStatus(report.id, 'approved', {
        strike: parseInt(strikeLevel),
        restrictedUntil: banDate ? new Date(banDate).toISOString() : null
      });
      
      toast.success("Đã xử lý: Report Đúng (User đã bị phạt)");
      onSuccess();
      onClose();
    } catch (error: any) {
      // ✅ VALIDATE: Bắt lỗi cụ thể từ Backend
      const code = error.response?.data?.code || error.code;
      if (code === "TargetOwnerNotFound") {
        toast.error("Không thể phạt: Người dùng này không còn tồn tại.");
      } else if (code === "RestrictedUntilRequired") {
        toast.error("Hệ thống yêu cầu ngày kết thúc hạn chế.");
      } else {
        toast.error(error.message || "Lỗi xử lý báo cáo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Xử lý: Report Sai (Rejected) -> Không phạt
  const handleReject = async () => {
    if (!confirm("Xác nhận báo cáo SAI/SPAM? User sẽ không bị phạt.")) return;
    setLoading(true);
    try {
      await updateReportStatus(report.id, 'rejected');
      toast.success("Đã từ chối báo cáo.");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Xử lý Báo cáo vi phạm</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded-lg border">
            <div>
              <span className="font-semibold text-gray-500 block">Loại nội dung:</span>
              <Badge variant="outline" className="uppercase mt-1">{report.targetType}</Badge>
            </div>
            <div>
              <span className="font-semibold text-gray-500 block">Lý do báo cáo:</span>
              <span className="font-medium text-red-600">
  {reasonMapping[report.reason] || report.reason}
</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-gray-500 block">Chi tiết mô tả:</span>
              <p className="bg-white p-3 rounded mt-1 text-gray-800 italic border border-gray-200">
                "{report.details || 'Không có mô tả chi tiết'}"
              </p>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-gray-500 block">ID Nội dung (Target ID):</span>
              <code className="text-xs bg-gray-200 px-1 rounded">{report.targetId}</code>
            </div>
          </div>

          {/* Khu vực hành động với Nội dung */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              Hành động với nội dung:
            </h4>
            <div className="flex gap-3">
              <Button variant="destructive" size="sm" onClick={handleHideContent} disabled={loading}>
                <EyeOff className="w-4 h-4 mr-2" />
                Ẩn nội dung này
              </Button>
              {/* Bạn có thể thêm nút "Hiện lại" (Publish/Visible) nếu cần */}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              *Lưu ý: Ẩn nội dung sẽ khiến người dùng không thấy nó nữa, nhưng chưa tính điểm phạt (Strike) cho tác giả.
            </p>
          </div>

          {/* ✅ VALIDATE: UI Form Xử lý User (Phạt) */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500"/> Xử lý Người dùng (Phạt)
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Mức độ vi phạm (Strike)</Label>
                    <Select value={strikeLevel} onValueChange={setStrikeLevel} disabled={loading}>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn mức phạt" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Nhắc nhở (0 Strike)</SelectItem>
                            <SelectItem value="1">Cảnh cáo (1 Strike)</SelectItem>
                            <SelectItem value="2">Vi phạm (2 Strike)</SelectItem>
                            <SelectItem value="3">Nghiêm trọng (3 Strike)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Hạn chế đến ngày (Restricted Until)</Label>
                    <Input 
                        type="date" 
                        value={banDate} 
                        onChange={(e) => setBanDate(e.target.value)}
                        disabled={loading || strikeLevel === "0"} // Strike 0 thì không cần cấm
                    />
                </div>
            </div>
            <p className="text-xs text-gray-500">
              *Mức 1-3 yêu cầu chọn ngày kết thúc hạn chế để tránh lỗi <code>RestrictedUntilRequired</code>.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between border-t pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Đóng
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleReject}
              disabled={loading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Report Sai (Bỏ qua)
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleResolve}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Report Đúng (Phạt)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}