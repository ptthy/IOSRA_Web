//app/author/revenue/page.tsx
"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  FileText,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  authorRevenueService,
  RevenueSummary,
  TransactionItem,
  WithdrawRequestItem,
} from "@/services/authorRevenueService";

// --- HELPERS ---
const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatShortDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};
// Format số có dấu chấm (hiển thị)
const formatNumberInput = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (!numbers) return "";
  return Number(numbers).toLocaleString("vi-VN");
};

// Chuyển về số nguyên để gửi API
const parseNumberInput = (value: string): number => {
  return Number(value.replace(/\D/g, "")) || 0;
};

// --- COMPONENTS: DETAIL MODAL (TRANSACTIONS & WITHDRAW) ---
// Cấu hình Việt hóa tên trường
const LABELS_MAP: Record<string, string> = {
  // --- TÀI CHÍNH ---
  grossVnd: "Doanh thu ban đầu (VNĐ)",
  priceDias: "Giá (Dias)",
  rewardRate: "Tỷ lệ thưởng (%)",

  // --- NỘI DUNG ---
  chapterTitle: "Tên chương",
  voiceNames: "Giọng đọc (AI)",

  // --- NGÂN HÀNG (VIẾT THƯỜNG - Đề phòng) ---
  bankName: "Ngân hàng",
  bankAccountNumber: "Số tài khoản",
  accountHolderName: "Chủ tài khoản",
  commitment: "Nội dung cam kết",
  moderatorNote: "Ghi chú Admin",

  // --- NGÂN HÀNG (VIẾT HOA - Fix lỗi hiển thị tiếng Anh của bạn) ---
  BankName: "Ngân hàng",
  BankAccountNumber: "Số tài khoản",
  AccountHolderName: "Chủ tài khoản",
  Commitment: "Nội dung cam kết",
  ModeratorNote: "Ghi chú Admin",

  // --- CÁC MÃ ID ---
  transactionId: "Mã giao dịch",
  requestId: "Mã yêu cầu",
};

// 2. Danh sách ẨN (Đã thêm ChapterId và VoiceIds để ẩn đi)
const HIDDEN_FIELDS = [
  "chapterId",
  "voiceIds",
  "voicePurchaseId",
  "purchaseLogId",
];

const DetailModal = ({
  isOpen,
  onClose,
  data,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: "transaction" | "withdraw";
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          {/* HEADER MODAL */}
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="text-2xl font-bold text-[var(--primary)]">
              {type === "transaction"
                ? "Chi Tiết Giao Dịch"
                : "Chi Tiết Yêu Cầu Rút Tiền"}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Mã ID Chính:{" "}
              <span className="font-mono select-all text-[var(--foreground)]">
                {data.transactionId || data.requestId}
              </span>
            </p>
          </div>

          {/* SỐ TIỀN & THỜI GIAN */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                Số tiền
              </span>
              <div
                className={`text-2xl font-bold ${
                  data.amountVnd > 0 || data.amount > 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {type === "transaction"
                  ? (data.amountVnd > 0 ? "+" : "") + formatVND(data.amountVnd)
                  : formatVND(data.amount)}
              </div>
            </div>
            <div className="p-4 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)] flex flex-col justify-center">
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                Thời gian
              </span>
              <div className="font-medium text-[var(--foreground)]">
                {formatDate(data.createdAt)}
              </div>
            </div>
          </div>

          {/* BẢNG CHI TIẾT */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--primary)]" /> Thông tin
              chi tiết
            </h3>

            <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] overflow-hidden">
              <Table>
                <TableBody>
                  {/* --- PHẦN 1: TÊN CHƯƠNG & GIỌNG ĐỌC (Hiện Text thường) --- */}

                  {/* 1.1 Tên Chương */}
                  {data.chapterTitle && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="font-bold text-[var(--muted-foreground)] w-[160px] bg-[var(--muted)]/20">
                        {LABELS_MAP["chapterTitle"]}
                      </TableCell>
                      <TableCell className="text-[var(--foreground)]">
                        {data.chapterTitle}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* 1.2 Tên Giọng Đọc */}
                  {data.voiceNames &&
                    Array.isArray(data.voiceNames) &&
                    data.voiceNames.length > 0 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="font-bold text-[var(--muted-foreground)] w-[160px] bg-[var(--muted)]/20 align-top">
                          {LABELS_MAP["voiceNames"]}
                        </TableCell>
                        <TableCell className="text-[var(--foreground)]">
                          {/* Nối mảng thành chuỗi cách nhau dấu phẩy cho gọn */}
                          {data.voiceNames.join(", ")}
                        </TableCell>
                      </TableRow>
                    )}

                  {/* --- PHẦN 2: METADATA CÒN LẠI --- */}
                  {data.metadata
                    ? Object.entries(data.metadata).map(([key, value]) => {
                        // 1. Ẩn ID trong danh sách HIDDEN_FIELDS
                        if (HIDDEN_FIELDS.includes(key)) return null;

                        // 2. Ẩn chapterTitle/voiceNames nếu lỡ trùng trong metadata (vì đã hiện ở trên rồi)
                        if (key === "chapterTitle" || key === "voiceNames")
                          return null;

                        // 3. Hiển thị thông thường
                        return (
                          <TableRow key={key} className="hover:bg-transparent">
                            {/* Cột Trái: Tên trường (Việt hóa) */}
                            <TableCell className="font-bold text-[var(--muted-foreground)] w-[160px] bg-[var(--muted)]/20">
                              {LABELS_MAP[key] ||
                                key.replace(/([A-Z])/g, " $1").trim()}
                            </TableCell>

                            {/* Cột Phải: Giá trị */}
                            <TableCell className="text-[var(--foreground)] break-all">
                              {key === "grossVnd"
                                ? formatVND(Number(value))
                                : Array.isArray(value) // Nếu còn mảng nào khác thì join lại
                                ? value.join(", ")
                                : typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    : null}

                  {/* --- PHẦN 3: THÔNG TIN RÚT TIỀN (Chỉ dùng nếu metadata không có) --- */}
                  {/* Đoạn này giữ lại để fallback, nhưng thực tế metadata của bạn đã chứa thông tin Bank rồi */}
                  {type === "withdraw" && !data.metadata && (
                    <>
                      <TableRow>
                        <TableCell className="font-bold text-[var(--muted-foreground)] w-[160px] bg-[var(--muted)]/20">
                          {LABELS_MAP["BankName"]}
                        </TableCell>
                        <TableCell>{data.bankName}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold text-[var(--muted-foreground)] w-[160px] bg-[var(--muted)]/20">
                          {LABELS_MAP["BankAccountNumber"]}
                        </TableCell>
                        <TableCell className="font-mono">
                          {data.bankAccountNumber}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold text-[var(--muted-foreground)] w-[160px] bg-[var(--muted)]/20">
                          {LABELS_MAP["AccountHolderName"]}
                        </TableCell>
                        <TableCell className="uppercase">
                          {data.accountHolderName}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold text-[var(--muted-foreground)] w-[160px] bg-[var(--muted)]/20">
                          {LABELS_MAP["Commitment"]}
                        </TableCell>
                        <TableCell className="italic text-[var(--muted-foreground)]">
                          "{data.commitment}"
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={onClose}
              className="bg-[var(--primary)] text-[var(--primary-foreground)] min-w-[100px]"
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AuthorRevenuePage() {
  // --- STATE ---
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [transactionPage, setTransactionPage] = useState(1);
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawRequestItem[]>(
    []
  );
  const [withdrawPage, setWithdrawPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const amountInputRef = useRef<HTMLInputElement>(null);

  const [selectedItem, setSelectedItem] = useState<
    TransactionItem | WithdrawRequestItem | null
  >(null);
  const [modalType, setModalType] = useState<"transaction" | "withdraw" | null>(
    null
  );
  [];

  const [chartData, setChartData] = useState<
    { date: string; revenue: number }[]
  >([]);

  // Pagination State
  const [txPage, setTxPage] = useState(1);
  const [wdPage, setWdPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State

  // Form Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState<number | string>("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [commitmentText, setCommitmentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DATA FETCHING ---
  const fetchAllData = async () => {
    try {
      setLoading(true);

      const summaryRes = await authorRevenueService.getSummary();
      setSummary(summaryRes.data);

      const transRes = await authorRevenueService.getTransactions({
        PageSize: 200,
      });
      setTransactions(transRes.data.items);

      const chartMap = new Map<string, number>();
      const sortedTrans = [...transRes.data.items].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      sortedTrans.forEach((item) => {
        if (item.amountVnd > 0) {
          const dateKey = formatShortDate(item.createdAt);
          const currentVal = chartMap.get(dateKey) || 0;
          chartMap.set(dateKey, currentVal + item.amountVnd);
        }
      });
      setChartData(
        Array.from(chartMap.entries()).map(([date, revenue]) => ({
          date,
          revenue,
        }))
      );

      const withdrawRes = await authorRevenueService.getWithdrawHistory();
      setWithdrawHistory(
        withdrawRes.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error("Lỗi tải dữ liệu doanh thu:", error);
      toast.error("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- ACTIONS ---
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary) return;
    const rawAmountStr = String(withdrawAmount).replace(/\./g, "");
    const amountNum = Number(rawAmountStr);

    if (!amountNum || amountNum < 100000) {
      toast.error("Số tiền rút tối thiểu là 100.000 VNĐ");
      return;
    }
    if (amountNum > summary.revenueBalanceVnd) {
      toast.error("Số dư khả dụng không đủ.");
      return;
    }
    if (!bankName || !bankAccount || !accountHolder) {
      toast.error("Vui lòng điền đầy đủ thông tin ngân hàng.");
      return;
    }
    if (!commitmentText.trim()) {
      toast.error("Vui lòng nhập nội dung cam kết.");
      return;
    }

    try {
      setIsSubmitting(true);
      await authorRevenueService.requestWithdraw({
        amount: amountNum,
        bankName,
        bankAccountNumber: bankAccount,
        accountHolderName: accountHolder.toUpperCase(),
        commitment: commitmentText,
      });

      toast.success("Gửi yêu cầu rút tiền thành công!");
      setWithdrawAmount("");
      setCommitmentText("");
      await fetchAllData();
      setWdPage(1);
    } catch (error: any) {
      // Log lỗi để debug nếu cần
      console.error("Lỗi rút tiền:", error);

      // Lấy data response từ server
      const resData = error.response?.data;
      const status = error.response?.status;

      // --- BẮT LỖI 409 (CONFLICT) ---
      if (status === 409) {
        // Kiểm tra mã lỗi cụ thể từ server
        if (resData?.error?.code === "WithdrawPending") {
          toast.error(
            "Bạn đang có yêu cầu rút tiền đang chờ xử lý. Vui lòng đợi yêu cầu trước hoàn tất."
          );
          return;
        }
      }

      // --- BẮT CÁC LỖI KHÁC ---
      // Lưu ý: Cấu trúc JSON của bạn là { error: { message: "..." } }
      // Nên cần lấy resData?.error?.message trước
      const msg =
        resData?.error?.message || // Lấy message trong object error
        resData?.message || // Lấy message lỡ như nó nằm ngoài
        "Có lỗi xảy ra, vui lòng thử lại.";

      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- PAGINATION COMPONENT ---
  const renderPagination = (
    currentPage: number,
    setPage: (p: number) => void,
    totalItems: number
  ) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 py-2 border-t border-[var(--border)] pt-4">
        <p className="text-xs text-[var(--muted-foreground)]">
          Trang {currentPage} / {totalPages}
        </p>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) =>
            totalPages <= 5 ||
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1) ? (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 text-xs ${
                  currentPage === page
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : ""
                }`}
                onClick={() => setPage(page)}
              >
                {page}
              </Button>
            ) : page === 2 || page === totalPages - 1 ? (
              <span key={page} className="px-1 text-[var(--muted-foreground)]">
                ...
              </span>
            ) : null
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // --- RENDER HELPERS ---
  const renderStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "withdraw_release":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Hoàn lại vào ví
          </span>
        );
      case "purchase":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Cộng vào ví
          </span>
        );

      case "withdraw_reserve":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="w-3 h-3 mr-1" /> Rút tiền khỏi ví
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)]">
            {status}
          </span>
        );
    }
  };

  // Get current slices
  const currentTransactions = transactions.slice(
    (txPage - 1) * itemsPerPage,
    txPage * itemsPerPage
  );
  const currentWithdraws = withdrawHistory.slice(
    (wdPage - 1) * itemsPerPage,
    wdPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-[var(--muted-foreground)] animate-pulse">
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-10">
      {/* Modal */}
      <DetailModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        data={selectedItem}
        type={modalType || "transaction"}
      />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--primary)]">
            Quản Lý Doanh Thu
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Theo dõi thu nhập thực tế và lịch sử giao dịch
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm">
            <span className="text-sm font-medium text-[var(--muted-foreground)] mr-2">
              Hạng:
            </span>
            <span className="text-sm font-bold text-[var(--primary)] uppercase">
              {summary?.rankName || "N/A"}
            </span>
          </div>
          <div className="flex items-center px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm">
            <span className="text-sm font-medium text-[var(--muted-foreground)] mr-2">
              Chia sẻ:
            </span>
            <span className="text-sm font-bold text-green-600">
              {summary?.rankRewardRate || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Số dư khả dụng",
            value: formatVND(summary?.revenueBalanceVnd || 0),
            icon: <Wallet className="w-5 h-5" />,
            color: "var(--primary)",
            desc: "Có thể rút ngay",
          },
          {
            title: "Đang chờ xử lý",
            value: formatVND(summary?.revenuePendingVnd || 0),
            icon: <History className="w-5 h-5" />,
            color: "#f59e0b",
            desc: "Yêu cầu rút đang duyệt",
          },
          {
            title: "Đã rút thành công",
            value: formatVND(summary?.revenueWithdrawnVnd || 0),
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: "#10b981",
            desc: "Tổng tiền đã về túi",
          },
          {
            title: "Tổng doanh thu",
            value: formatVND(summary?.totalRevenueVnd || 0),
            icon: <TrendingUp className="w-5 h-5" />,
            color: "#7c3aed",
            desc: "Doanh thu trọn đời",
          },
        ].map((item, idx) => (
          <Card
            key={idx}
            className="border border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                {item.title}
              </CardTitle>
              <div style={{ color: item.color }}>{item.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {item.value}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {item.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* NEW LAYOUT: WITHDRAW FORM (LEFT) - CHART (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WITHDRAW FORM */}
        <Card className="lg:col-span-5 border border-[var(--border)] bg-[var(--card)] shadow-md h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-[var(--primary)] flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Yêu Cầu Rút Tiền
            </CardTitle>
            <CardDescription>
              Nhập thông tin tài khoản nhận tiền chính xác.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-1.5">
                <Label>
                  Số tiền rút (VNĐ) <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="100.000"
                  value={withdrawAmount}
                  ref={amountInputRef}
                  onChange={(e) => {
                    const formatted = formatNumberInput(e.target.value);
                    setWithdrawAmount(formatted);

                    // Giữ con trỏ ở cuối (rất mượt)
                    setTimeout(() => {
                      if (amountInputRef.current) {
                        const len = formatted.length;
                        amountInputRef.current.setSelectionRange(len, len);
                      }
                    }, 0);
                  }}
                  className="font-mono text-lg tracking-wider text-right bg-[var(--background)] dark:border-[#f0ead6]"
                />
                <p className="text-[10px] text-right text-[var(--muted-foreground)]">
                  Khả dụng: {formatVND(summary?.revenueBalanceVnd || 0)}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Tên Ngân Hàng <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  placeholder="Nhập tên ngân hàng (VD: MB Bank, Vietcombank...)"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="bg-[var(--background)] dark:border-[#f0ead6]"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Số Tài Khoản <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  placeholder="0123456789"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="bg-[var(--background)] dark:border-[#f0ead6] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Tên Chủ Tài Khoản (Không dấu){" "}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  placeholder="NGUYEN VAN A"
                  value={accountHolder}
                  onChange={(e) =>
                    setAccountHolder(e.target.value.toUpperCase())
                  }
                  className="bg-[var(--background)] dark:border-[#f0ead6] uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Lời Cam Kết <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  placeholder="Tôi cam kết thông tin là chính xác..."
                  value={commitmentText}
                  onChange={(e) => setCommitmentText(e.target.value)}
                  className="bg-[var(--background)] dark:border-[#f0ead6] italic"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[var(--primary)] hover:bg-[color-mix(in srgb,var(--primary)85%,black)] text-[var(--primary-foreground)] mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xử lý..." : "Gửi Yêu Cầu"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* CHART (RESIZED) */}
        <Card className="lg:col-span-7 border border-[var(--border)] bg-[var(--card)] shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-[var(--primary)]">
              Biểu Đồ Thu Nhập
            </CardTitle>
            <CardDescription>Xu hướng doanh thu theo ngày</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <div className="h-full w-full min-h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        color: "var(--popover-foreground)",
                      }}
                      formatter={(value: number) => [
                        formatVND(value),
                        "Doanh thu",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ fill: "var(--primary)", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">
                  Chưa có dữ liệu biểu đồ.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLES SECTION (TABS) */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[var(--muted)] mb-6">
          <TabsTrigger value="transactions">
            Lịch Sử Giao Dịch (Chi Tiết)
          </TabsTrigger>
          <TabsTrigger value="withdraws">
            Lịch Sử Trạng Thái Rút Tiền
          </TabsTrigger>
        </TabsList>

        {/* TRANSACTION HISTORY TAB */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">
                Danh Sách Giao Dịch
              </CardTitle>
              <CardDescription>
                Bao gồm doanh thu từ truyện, giọng đọc và các lệnh rút tiền.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-[var(--muted)]/50">
                  <TableRow className="hover:bg-transparent border-b border-[var(--border)]">
                    <TableHead className="w-[150px]">Thời gian</TableHead>
                    <TableHead>Loại GD</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Mã giao dịch
                    </TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTransactions.length > 0 ? (
                    currentTransactions.map((tx) => (
                      <TableRow
                        key={tx.transactionId}
                        className="hover:bg-[var(--muted)]/20 border-b border-[var(--border)]"
                      >
                        <TableCell className="font-medium text-xs md:text-sm text-[var(--muted-foreground)]">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell>{renderStatusBadge(tx.type)}</TableCell>
                        <TableCell
                          className="hidden md:table-cell text-xs text-[var(--muted-foreground)] max-w-[300px] truncate font-mono select-all"
                          title={tx.transactionId} // Hover vào sẽ hiện full ID
                        >
                          {tx.transactionId}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold text-sm ${
                            tx.amountVnd > 0
                              ? "text-[var(--primary)]"
                              : "text-red-600"
                          }`}
                        >
                          {tx.amountVnd > 0 ? "+" : ""}
                          {formatVND(tx.amountVnd)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                            onClick={() => {
                              setSelectedItem(tx);
                              setModalType("transaction");
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-10 text-[var(--muted-foreground)]"
                      >
                        Chưa có giao dịch nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination for Transactions */}
              {renderPagination(txPage, setTxPage, transactions.length)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WITHDRAW HISTORY TAB */}
        <TabsContent value="withdraws" className="space-y-4">
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">
                Lịch Sử Yêu Cầu Rút Tiền
              </CardTitle>
              <CardDescription>
                Theo dõi trạng thái duyệt của các yêu cầu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-[var(--muted)]/50">
                  <TableRow className="hover:bg-transparent border-b border-[var(--border)]">
                    <TableHead className="w-[150px]">Thời gian</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Ngân hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentWithdraws.length > 0 ? (
                    currentWithdraws.map((wd) => (
                      <TableRow
                        key={wd.requestId}
                        className="hover:bg-[var(--muted)]/20 border-b border-[var(--border)]"
                      >
                        <TableCell className="font-medium text-xs md:text-sm text-[var(--muted-foreground)]">
                          {formatDate(wd.createdAt)}
                        </TableCell>
                        <TableCell className="font-bold text-[var(--foreground)]">
                          {formatVND(wd.amount)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{wd.bankName}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {wd.bankAccountNumber}
                          </div>
                        </TableCell>
                        <TableCell>{renderStatusBadge(wd.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                            onClick={() => {
                              setSelectedItem(wd);
                              setModalType("withdraw");
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-10 text-[var(--muted-foreground)]"
                      >
                        Chưa có yêu cầu nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination for Withdraws */}
              {renderPagination(wdPage, setWdPage, withdrawHistory.length)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
