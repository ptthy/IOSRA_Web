// components/report/ReportModal.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Flag, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { reportService, ReportTargetType } from "@/services/reportService";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string; // 🔥 Thêm cái này để hiện tên truyện/chương
}

const REPORT_REASONS = [
  { value: "spam", label: "Nội dung rác / Spam" },
  { value: "negative_content", label: "Nội dung tiêu cực / Xúc phạm" },
  { value: "misinformation", label: "Thông tin sai lệch" },
  { value: "ip_infringement", label: "Vi phạm bản quyền" },
];

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}: ReportModalProps) {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!targetId) return;

    setIsSubmitting(true);
    try {
      await reportService.createReport({
        targetType,
        targetId,
        reason,
        details: details.trim(),
      });
      toast.success("Gửi báo cáo thành công! Cảm ơn đóng góp của bạn.");
      setDetails("");
      setReason("spam");
      onClose();
    } catch (error: any) {
      // 🔥 BẮT LỖI 400: ReportAlreadyExists
      const responseData = error.response?.data;
      const errorCode = responseData?.error?.code; // Lấy mã lỗi từ cấu trúc JSON bạn gửi

      if (
        error.response?.status === 400 &&
        errorCode === "ReportAlreadyExists"
      ) {
        // Hiển thị cảnh báo màu vàng (Warning) thay vì lỗi đỏ
        toast.warning(
          "Bạn đã gửi báo cáo cho nội dung này rồi. Vui lòng chờ BQT xử lý!"
        );

        // Tùy chọn: Có thể đóng modal luôn nếu muốn
        // onClose();
      } else {
        // Các lỗi khác
        const errorMessage =
          responseData?.error?.message || // Lấy message trong object error
          responseData?.message || // Hoặc message ở ngoài (nếu có)
          "Có lỗi xảy ra khi gửi báo cáo.";

        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive text-xl">
            <AlertTriangle className="h-6 w-6" />
            Báo cáo vi phạm
          </DialogTitle>
          {targetTitle && (
            <p className="text-sm text-muted-foreground mt-1">
              Đang báo cáo:{" "}
              <span className="font-semibold text-foreground">
                {targetTitle}
              </span>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-5 py-3">
          <div className="space-y-3">
            <Label className="text-base font-semibold text-foreground">
              Chọn lý do:
            </Label>
            <RadioGroup
              value={reason}
              onValueChange={setReason}
              className="gap-2"
            >
              {REPORT_REASONS.map((item) => (
                <div
                  key={item.value}
                  onClick={() => setReason(item.value)}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    reason === item.value
                      ? "border-destructive bg-destructive/10 ring-1 ring-destructive"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <RadioGroupItem
                    value={item.value}
                    id={item.value}
                    className="text-destructive border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground"
                  />
                  <Label
                    htmlFor={item.value}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="details"
              className="text-base font-semibold text-foreground"
            >
              Chi tiết thêm (tùy chọn):
            </Label>
            <Textarea
              id="details"
              placeholder="Mô tả cụ thể vi phạm..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="resize-none h-24 bg-background border-input focus-visible:ring-destructive/50"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-border hover:bg-muted"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...
              </>
            ) : (
              "Gửi Báo Cáo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
