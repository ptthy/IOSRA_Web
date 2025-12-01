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
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner"; // Import thêm toast để báo copy thành công

// --- CẤU HÌNH HIỂN THỊ ---
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadPaymentHistory();
  }, [page]);

  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      const data = await paymentHistoryService.getMyPaymentHistory({
        Page: page,
        PageSize: pageSize,
      });
      setPayments(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error("Lỗi tải lịch sử giao dịch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Đã sao chép mã đơn!");
  };

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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8 pb-16 pt-6 px-4">
        {/* HEADER */}
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

        {/* NỘI DUNG CHÍNH */}
        <Card className="shadow-md border-t-4 border-t-yellow-500 overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-xl flex items-center justify-between">
              <span>Danh sách giao dịch</span>
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">
                  Đang tải dữ liệu...
                </p>
              </div>
            ) : payments.length > 0 ? (
              <>
                {/*  DÙNG THẺ TABLE ĐỂ CỘT THẲNG HÀNG 100%  */}
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
                      {payments.map((item) => {
                        const config = TYPE_CONFIG[item.type] || {
                          label: "Khác",
                          icon: CreditCard,
                          colorClass: "bg-gray-100 text-gray-600",
                        };
                        const statusInfo = STATUS_CONFIG[item.status] || {
                          label: item.status,
                          className: "bg-gray-100 text-gray-600",
                        };
                        const Icon = config.icon;

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

                {/* Phân trang */}
                {totalPages > 1 && (
                  <div className="py-4 border-t border-border/50 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
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
