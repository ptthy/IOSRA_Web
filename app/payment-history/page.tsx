"use client";

import React, { useState, useEffect } from "react";
import {
  paymentHistoryService,
  PaymentHistoryItem,
} from "@/services/paymentHistoryService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CreditCard,
  Calendar,
  Gem,
  Crown,
  Mic,
  Receipt,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Helper để gộp và xử lý className Tailwind CSS một cách linh hoạt
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner"; // Import thêm toast để báo copy thành công

// --- CẤU HÌNH HIỂN THỊ ---
/**
 * TYPE_CONFIG: Map định nghĩa giao diện cho từng loại giao dịch
 * Mỗi loại có: label (tên hiển thị), icon (component icon), colorClass (màu sắc)
 * Giúp tái sử dụng code và đồng bộ giao diện
 */
const TYPE_CONFIG: Record<
  string,
  { label: string; icon: any; colorClass: string }
> = {
  dia_topup: {
    label: "Nạp Kim Cương",
    icon: Gem,
    colorClass:
      "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  voice_topup: {
    label: "Nạp Ký tự Voice",
    icon: Mic,
    colorClass:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  subscription: {
    label: "Gói Hội Viên",
    icon: Crown,
    colorClass:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
};
/**
 * STATUS_CONFIG: Map định nghĩa giao diện cho từng trạng thái giao dịch
 * Mỗi trạng thái có: label (tên hiển thị), className (CSS classes)
 */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  success: {
    label: "Thành công",
    className:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  pending: {
    label: "Chờ thanh toán",
    className:
      "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  },
  cancelled: {
    label: "Đã hủy",
    className:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
  failed: {
    label: "Thất bại",
    className:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
};
/**
 * Hàm định dạng tiền tệ VND
 * Sử dụng Intl.NumberFormat để format theo chuẩn Việt Nam
 * Input: amount (số tiền)
 * Output: string định dạng "1.000.000 ₫"
 */
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]); // Danh sách giao dịch
  const [loading, setLoading] = useState(true); // Trạng thái loading
  const [page, setPage] = useState(1); // Trang hiện tại
  const [total, setTotal] = useState(0); // Tổng số bản ghi
  const pageSize = 20; // Số item mỗi trang (cố định)
  // --- HELPER: Xử lý lỗi API ---
  /**
   * Hàm xử lý lỗi API thống nhất cho toàn bộ ứng dụng
   * Logic xử lý ưu tiên:
   * 1. Kiểm tra lỗi validation/Logic từ Backend (400 Bad Request)
   * 2. Ưu tiên hiển thị lỗi validation chi tiết nếu có
   * 3. Fallback: Hiển thị message từ backend hoặc message mặc định
   *
   * Đầu vào: err (lỗi từ catch), defaultMessage (thông báo mặc định)
   * Đầu ra: Toast thông báo lỗi và return (không trả về giá trị)
   */
  const handleApiError = (err: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic từ Backend (kiểu 400)
    if (err.response && err.response.data && err.response.data.error) {
      const { message, details } = err.response.data.error;

      // Ưu tiên Validation (lỗi chi tiết từ field nào đó)
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          toast.error(details[firstKey].join(" "));
          return;
        }
      }
      // Message từ Backend (lỗi tổng quát)
      if (message) {
        toast.error(message);
        return;
      }
    }
    // 2. Fallback - lấy message từ response hoặc dùng default
    const fallbackMsg = err.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // --- EFFECT: Load dữ liệu khi page thay đổi ---
  /**
   * useEffect này chạy mỗi khi biến page thay đổi
   * Mục đích: Tải dữ liệu lịch sử giao dịch cho trang hiện tại
   * Phụ thuộc: [page] - chỉ chạy lại khi page thay đổi
   */
  useEffect(() => {
    loadPaymentHistory();
  }, [page]);
  // --- HÀM LOAD LỊCH SỬ GIAO DỊCH ---
  /**
   * Hàm gọi API lấy lịch sử giao dịch với phân trang
   * Flow:
   * 1. Bật loading
   * 2. Gọi API với params: Page (trang hiện tại), PageSize (20)
   * 3. Nếu thành công: cập nhật payments và total
   * 4. Nếu lỗi: gọi handleApiError để hiển thị thông báo
   * 5. Luôn tắt loading (dù thành công hay thất bại)
   */
  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      // Gọi API từ service
      const data = await paymentHistoryService.getMyPaymentHistory({
        Page: page,
        PageSize: pageSize,
      });
      setPayments(data.items); // Cập nhật danh sách giao dịch
      setTotal(data.total); // Cập nhật tổng số bản ghi
    } catch (error: any) {
      //  GỌI HÀM XỬ LÝ LỖI
      handleApiError(error, "Không thể tải lịch sử giao dịch.");
      console.error("Lỗi tải lịch sử giao dịch:", error);
    } finally {
      setLoading(false); // Luôn tắt loading
    }
  };
  // --- HÀM SAO CHÉP MÃ ĐƠN ---
  /**
   * Hàm sao chép mã đơn hàng vào clipboard
   * Sử dụng Web API: navigator.clipboard.writeText()
   * Hiển thị toast thông báo thành công
   *
   * Đầu vào: code (mã đơn hàng)
   * Đầu ra: Toast thông báo "Đã sao chép mã đơn!"
   */
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Đã sao chép mã đơn!");
  };
  // --- HÀM RENDER MÔ TẢ GIAO DỊCH ---
  /**
   * Hàm render mô tả chi tiết cho từng loại giao dịch
   * Logic phân loại theo item.type:
   * - subscription: hiển thị tên gói
   * - dia_topup: hiển thị số kim cương nhận được
   * - voice_topup: hiển thị số ký tự voice nhận được
   * - other: hiển thị "Giao dịch khác"
   *
   * Đầu vào: item (PaymentHistoryItem)
   * Đầu ra: JSX Element (span với nội dung tương ứng)
   */
  const renderPaymentDescription = (item: PaymentHistoryItem) => {
    if (item.type === "subscription") {
      return (
        <span className="font-bold text-foreground">
          {item.planName || "Gói Premium"}
        </span>
      );
    }
    if (item.type === "dia_topup") {
      return (
        <span className="font-bold text-foreground">
          +{item.grantedValue?.toLocaleString()} Dias
        </span>
      );
    }
    if (item.type === "voice_topup") {
      return (
        <span className="font-bold text-foreground">
          +{item.grantedValue?.toLocaleString()} Ký tự
        </span>
      );
    }
    return <span>Giao dịch khác</span>;
  };
  // --- TÍNH TOÁN PHÂN TRANG ---
  /**
   * Tính tổng số trang dựa trên:
   * total (tổng số bản ghi từ API) / pageSize (20)
   * Math.ceil làm tròn lên để đảm bảo trang cuối có đủ dữ liệu
   */
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8 pb-16 pt-6 px-4">
        {/* HEADER - Tiêu đề trang */}
        <div className="space-y-2 border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <Receipt className="h-8 w-8 text-yellow-600 dark:text-yellow-400 fill-yellow-600/20" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Lịch sử Giao Dịch
              </h1>
              <p className="text-muted-foreground mt-1">
                Lịch sử nạp và mua gói cước.
              </p>
            </div>
          </div>
        </div>

        {/* NỘI DUNG CHÍNH - Card chứa bảng giao dịch */}
        <Card className="shadow-md border-t-4 border-t-yellow-500 overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xl flex items-center justify-between">
              <span>Danh sách giao dịch</span>
              {/* Badge hiển thị tổng số bản ghi khi không loading */}
              {!loading && (
                <Badge
                  variant="secondary"
                  className="font-normal bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                >
                  {total} bản ghi
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* LOADING STATE - Hiển thị khi đang tải dữ liệu */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">
                  Đang tải dữ liệu...
                </p>
              </div>
            ) : payments.length > 0 ? (
              <>
                {/* TABLE HIỂN THỊ - Dùng thẻ table để cột thẳng hàng 100% */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-semibold">
                      <tr>
                        {/* Định nghĩa độ rộng cột (Width) để cố định layout */}
                        <th className="px-6 py-4 w-[25%] min-w-[200px]">
                          Loại giao dịch
                        </th>
                        <th className="px-4 py-4 w-[20%] min-w-[150px]">
                          Chi tiết gói
                        </th>
                        <th className="px-4 py-4 w-[20%] min-w-[180px]">
                          Mã đơn
                        </th>
                        <th className="px-4 py-4 w-[15%] min-w-[120px]">
                          Số tiền
                        </th>
                        <th className="px-4 py-4 w-[10%] min-w-[140px]">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 w-[10%] min-w-[120px] text-right">
                          Thời gian
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {/* MAP QUA DANH SÁCH GIAO DỊCH */}
                      {payments.map((item) => {
                        // Lấy config cho loại giao dịch từ TYPE_CONFIG
                        const config = TYPE_CONFIG[item.type] || {
                          label: "Khác",
                          icon: CreditCard,
                          colorClass: "bg-gray-100 text-gray-600",
                        };
                        // Lấy thông tin trạng thái từ STATUS_CONFIG
                        const statusInfo = STATUS_CONFIG[item.status] || {
                          label: item.status,
                          className: "bg-gray-100 text-gray-600",
                        };
                        const Icon = config.icon; // Lấy component icon

                        return (
                          <tr
                            key={item.paymentId}
                            className="hover:bg-muted/30 transition-colors group"
                          >
                            {/* Cột 1: Loại giao dịch */}
                            <td className="px-6 py-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "p-2 rounded-lg shrink-0",
                                    config.colorClass
                                  )}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>
                                <span className="font-medium text-base">
                                  {config.label}
                                </span>
                              </div>
                            </td>

                            {/* Cột 2: Chi tiết gói */}
                            <td className="px-4 py-4 align-middle text-base">
                              {renderPaymentDescription(item)}
                            </td>

                            {/* Cột 3: Mã đơn (Nổi bật) */}
                            <td className="px-4 py-4 align-middle">
                              <div
                                className="inline-flex items-center gap-2 bg-muted/60 px-2.5 py-1 rounded-md border border-border/60 group-hover:border-primary/30 group-hover:bg-background transition-colors cursor-pointer"
                                onClick={() => handleCopyCode(item.orderCode)}
                                title="Nhấn để sao chép"
                              >
                                <span className="font-mono font-bold text-foreground text-sm tracking-wide">
                                  {item.orderCode}
                                </span>
                                <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </td>

                            {/* Cột 4: Số tiền */}
                            <td className="px-4 py-4 align-middle">
                              <span className="font-bold text-lg text-foreground">
                                {formatCurrency(item.amountVnd)}
                              </span>
                            </td>

                            {/* Cột 5: Trạng thái */}
                            <td className="px-4 py-4 align-middle">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-bold uppercase px-2.5 py-1 text-[10px] whitespace-nowrap",
                                  statusInfo.className
                                )}
                              >
                                {statusInfo.label}
                              </Badge>
                            </td>

                            {/* Cột 6: Thời gian */}
                            <td className="px-6 py-4 align-middle text-right">
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-sm font-medium text-foreground">
                                  {new Date(item.createdAt).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.createdAt).toLocaleTimeString(
                                    "vi-VN",
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang - chỉ hiển thị khi có nhiều hơn 1 trang */}
                {totalPages > 1 && (
                  <div className="py-4 border-t border-border/50 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          {/* Nút Previous: vô hiệu hóa khi ở trang 1 */}
                          <PaginationPrevious
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className={
                              page === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        <PaginationItem>
                          <span className="px-4 py-2 text-sm font-medium text-muted-foreground">
                            Trang {page} / {totalPages}
                          </span>
                        </PaginationItem>

                        <PaginationItem>
                          {/* Nút Next: vô hiệu hóa khi ở trang cuối */}
                          <PaginationNext
                            onClick={() =>
                              setPage((p) => Math.min(totalPages, p + 1))
                            }
                            className={
                              page === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              /* EMPTY STATE - Khi không có giao dịch nào */
              <div className="text-center py-20 bg-muted/10">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground">
                  Chưa có giao dịch nào
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Lịch sử nạp tiền và đăng ký gói sẽ xuất hiện tại đây.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
