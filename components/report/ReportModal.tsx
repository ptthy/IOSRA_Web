// components/report/ReportModal.tsx
"use client";
/**
 * MODAL TẠO BÁO CÁO MỚI
 *
 * MỤC ĐÍCH:
 * - Cung cấp form để người dùng tạo báo cáo mới về nội dung vi phạm
 * - Thu thập thông tin: lý do báo cáo, mô tả chi tiết
 * - Xử lý gửi dữ liệu lên server và hiển thị phản hồi
 *
 * CHỨC NĂNG CHÍNH:
 * 1. Hiển thị form với các lý do báo cáo được định nghĩa sẵn (radio group)
 * 2. Cho phép nhập mô tả chi tiết về vi phạm (textarea tùy chọn)
 * 3. Xử lý submit form: gọi API tạo báo cáo
 * 4. Xử lý lỗi chi tiết từ server (đã báo cáo, tự báo cáo chính mình, lỗi server)
 * 5. Hiển thị feedback cho người dùng qua toast notification
 * 6. Reset form và đóng modal sau khi thành công
 *
 * SỬ DỤNG KHI:
 * - User click nút "Báo cáo" trên truyện, chương, hoặc bình luận
 * - Cần tạo báo cáo mới về nội dung vi phạm
 * - Hệ thống cần thu thập thông tin cụ thể về vi phạm từ người dùng
 */
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
/**
 * Props interface cho component ReportModal
 *
 * @property {boolean} isOpen - Trạng thái hiển thị modal
 * @property {() => void} onClose - Hàm đóng modal
 * @property {ReportTargetType} targetType - Loại đối tượng bị báo cáo (story/chapter/comment)
 * @property {string} targetId - ID của đối tượng bị báo cáo
 * @property {string} [targetTitle] - Tiêu đề đối tượng (hiển thị thêm thông tin)
 *
 * Component này là modal form để người dùng tạo báo cáo mới
 * Xử lý việc chọn lý do, nhập mô tả và gửi lên server
 */
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string; // Thêm cái này để hiện tên truyện/chương
}
/**
 * Danh sách các lý do báo cáo có sẵn
 * Mỗi lý do có value (dùng để gửi lên server) và label (hiển thị cho user)
 * Các lý do phổ biến trong hệ thống nội dung
 */
const REPORT_REASONS = [
  { value: "spam", label: "Nội dung rác / Spam" },
  { value: "negative_content", label: "Nội dung tiêu cực / Xúc phạm" },
  { value: "misinformation", label: "Thông tin sai lệch" },
  { value: "ip_infringement", label: "Vi phạm bản quyền" },
];
/**
 * Component modal tạo báo cáo mới
 *
 * Luồng xử lý chính:
 * 1. Hiển thị form với các lý do báo cáo (radio group)
 * 2. Cho phép nhập mô tả chi tiết (tùy chọn)
 * 3. Xử lý submit: gửi dữ liệu lên server qua reportService
 * 4. Xử lý các lỗi: đã report rồi, report chính mình, lỗi server
 * 5. Hiển thị feedback cho user qua toast notification
 */
export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}: ReportModalProps) {
  // State quản lý lý do được chọn (mặc định là "spam")
  const [reason, setReason] = useState("spam");
  // State quản lý mô tả chi tiết
  const [details, setDetails] = useState("");
  // State quản lý trạng thái đang gửi dữ liệu
  const [isSubmitting, setIsSubmitting] = useState(false);
  /**
   * Hàm xử lý submit form báo cáo
   * Luồng xử lý:
   * 1. Kiểm tra targetId có tồn tại
   * 2. Bật trạng thái submitting
   * 3. Gọi API tạo báo cáo
   * 4. Xử lý kết quả/thất bại
   * 5. Reset form và đóng modal khi thành công
   * 6. Xử lý các lỗi cụ thể từ backend
   */
  const handleSubmit = async () => {
    // Validate cơ bản: targetId phải tồn tại
    if (!targetId) return;

    setIsSubmitting(true);
    try {
      // Gọi service tạo báo cáo với các thông tin
      await reportService.createReport({
        targetType,
        targetId,
        reason,
        details: details.trim(), // Trim để loại bỏ khoảng trắng thừa
      });
      // Thành công: hiển thị toast, reset form, đóng modal
      toast.success("Gửi báo cáo thành công! Cảm ơn đóng góp của bạn.");
      setDetails("");
      setReason("spam");
      onClose();
    } catch (error: any) {
      /**
       * Xử lý lỗi chi tiết từ API response
       * Backend trả về các error code cụ thể:
       * - ReportAlreadyExists: đã báo cáo nội dung này
       * - CannotReportOwnContent: báo cáo nội dung của chính mình
       */

      const responseData = error.response?.data;
      const errorCode = responseData?.error?.code;
      // Kiểm tra lỗi 400 (Bad Request)
      if (error.response?.status === 400) {
        // Case 1: Đã report rồi - thông báo và đóng modal
        if (errorCode === "ReportAlreadyExists") {
          toast.warning("Bạn đã báo cáo nội dung này rồi. Vui lòng chờ xử lý!");
          onClose(); // Đóng modal luôn vì không cần thiết
        }
        // Case 2: Tự report chính mình - thông báo lỗi
        else if (errorCode === "CannotReportOwnContent") {
          toast.warning("Bạn không thể báo cáo nội dung của chính mình!");
          // Không đóng modal để user nhận thức rõ
        } else {
          // Case 3: Các lỗi 400 khác - hiển thị message từ server
          toast.error(
            responseData?.error?.message || "Lỗi dữ liệu không hợp lệ."
          );
        }
      } else {
        // Các lỗi 500 hoặc khác
        toast.error("Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại sau.");
      }
    } finally {
      // Luôn tắt trạng thái submitting dù thành công hay thất bại
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 
        Dialog Content với styling:
        - sm:max-w-[450px]: giới hạn chiều rộng
        - bg-card, text-card-foreground: màu nền và chữ theo theme
        - border-border: màu viền
      */}
      <DialogContent className="sm:max-w-[450px] bg-card text-card-foreground border-border">
        <DialogHeader>
          {/* 
            Tiêu đề modal với icon cảnh báo và màu đỏ nổi bật
            Tạo cảm giác "quan trọng" cho hành động báo cáo
          */}
          <DialogTitle className="flex items-center gap-2 text-destructive text-xl">
            <AlertTriangle className="h-6 w-6" />
            Báo cáo vi phạm
          </DialogTitle>
          {/* 
            Hiển thị thông tin đối tượng đang báo cáo (nếu có)
            Giúp user xác nhận đúng đối tượng
          */}
          {targetTitle && (
            <p className="text-sm text-muted-foreground mt-1">
              Đang báo cáo:{" "}
              <span className="font-semibold text-foreground">
                {targetTitle}
              </span>
            </p>
          )}
        </DialogHeader>
        {/* 
          Nội dung form báo cáo
          - Phần 1: Chọn lý do (radio group)
          - Phần 2: Nhập mô tả chi tiết (textarea)
        */}
        <div className="space-y-5 py-3">
          <div className="space-y-3">
            <Label className="text-base font-semibold text-foreground">
              Chọn lý do:
            </Label>
            {/* 
              RadioGroup từ shadcn/ui:
              - value: lý do đang được chọn
              - onValueChange: cập nhật state khi chọn
              - Các item được custom styling để dễ tương tác
            */}
            <RadioGroup
              value={reason}
              onValueChange={setReason}
              className="gap-2"
            >
              {REPORT_REASONS.map((item) => (
                /**
                 * Mỗi option lý do:
                 * - Có thể click toàn bộ div để chọn
                 * - Styling thay đổi khi được chọn (border đỏ, nền đỏ nhạt)
                 * - Có hover effect để chỉ ra có thể tương tác
                 */
                <div
                  key={item.value}
                  onClick={() => setReason(item.value)}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    reason === item.value
                      ? "border-destructive bg-destructive/10 ring-1 ring-destructive"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {/* 
                    Radio button với styling đặc biệt:
                    - Màu đỏ để phù hợp với theme báo cáo
                    - data-[state=checked]: styling khi được chọn
                  */}
                  <RadioGroupItem
                    value={item.value}
                    id={item.value}
                    className="text-destructive border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground"
                  />
                  {/* Label có thể click, chiếm toàn bộ width còn lại */}
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
          {/* Phần nhập mô tả chi tiết */}
          <div className="space-y-2">
            <Label
              htmlFor="details"
              className="text-base font-semibold text-foreground"
            >
              Chi tiết thêm (tùy chọn):
            </Label>
            {/* 
              Textarea cho mô tả chi tiết:
              - resize-none: không cho phép resize
              - h-24: chiều cao cố định
              - focus-visible:ring-destructive/50: focus ring màu đỏ nhạt
            */}
            <Textarea
              id="details"
              placeholder="Mô tả cụ thể vi phạm..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="resize-none h-24 bg-background border-input focus-visible:ring-destructive/50"
            />
          </div>
        </div>
        {/* 
          Dialog Footer với 2 button:
          - Hủy: đóng modal, không submit
          - Gửi báo cáo: thực hiện submit
        */}
        <DialogFooter className="gap-2 sm:gap-0">
          {/* Button Hủy - secondary action */}
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-border hover:bg-muted"
          >
            Hủy bỏ
          </Button>
          {/* 
            Button Gửi báo cáo - primary action
            - Màu đỏ nổi bật (dùng destructive theme)
            - Hiển thị loading spinner khi đang submit
            - Disabled khi đang submit để tránh double click
          */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
          >
            {isSubmitting ? (
              // Trạng thái đang gửi: hiển thị spinner
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...
              </>
            ) : (
              // Trạng thái bình thường
              "Gửi Báo Cáo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
