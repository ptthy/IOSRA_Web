//app/author/revenue/page.tsx

/*
MỤC ĐÍCH: Trang quản lý doanh thu và đối soát của tác giả
CHỨC NĂNG CHÍNH:
- Hiển thị tổng quan doanh thu (số dư khả dụng, đang chờ xử lý, đã đối soát, tổng lũy kế)
- Cho phép tác giả tạo yêu cầu đối soát (rút tiền) với form nhập thông tin ngân hàng
- Hiển thị biểu đồ doanh thu theo thời gian (sử dụng Recharts)
- Hiển thị danh sách giao dịch chi tiết (mua chương, tạo giọng đọc AI, đối soát)
- Hiển thị lịch sử yêu cầu đối soát với trạng thái (pending, approved, rejected, confirmed)
- Hiển thị hóa đơn đối soát đã được admin approved (cần tác giả xác nhận đã nhận tiền)
- Modal xem chi tiết cho từng giao dịch/yêu cầu đối soát
ĐỐI TƯỢNG SỬ DỤNG: Tác giả (Author) muốn theo dõi thu nhập và thực hiện đối soát
FLOW XỬ LÝ CHÍNH:
1. Load tổng quan doanh thu, lịch sử giao dịch, lịch sử đối soát
2. Tính toán dữ liệu cho biểu đồ từ giao dịch
3. Xử lý form đối soát với validation chi tiết
4. Phân trang cho bảng giao dịch và đối soát
5. Xử lý xác nhận đã nhận tiền cho bill đã approved
*/
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
  Gem,
  Mic,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  authorRevenueService,
  RevenueSummary,
  TransactionItem,
  WithdrawRequestItem,
} from "@/services/authorRevenueService";

// --- HELPERS ---

/**
 * HELPER FORMAT SỐ THEO ĐỊNH DẠNG VIỆT NAM:
 * @param amount - Số cần format (number)
 * @returns Chuỗi số đã format với dấu chấm phân cách hàng nghìn
 *
 * Ví dụ: 1000000 -> "1.000.000"
 * Lưu ý: Bỏ chữ "AP" so với trước đây, thay bằng icon Gem (dias)
 */
const formatNumber = (amount: number) => {
  return new Intl.NumberFormat("vi-VN").format(amount);
};

/**
 * COMPONENT HIỂN THỊ SỐ TIỀN VỚI ICON GEM (Dias):
 * @param value - Giá trị số cần hiển thị
 * @param className - CSS class tùy chỉnh thêm
 * @param iconSize - Kích thước icon Gem (mặc định 14)
 * @param showPlus - Có hiển thị dấu "+" trước số dương không (dùng cho giao dịch cộng tiền)
 *
 * LOGIC HIỂN THỊ:
 * - Format số theo định dạng Việt Nam với dấu chấm phân cách
 * - Hiển thị icon Gem màu xanh dương với dấu sao vàng (*) phía trên
 * - Tự động thêm dấu "+" nếu số dương và showPlus=true
 * - Màu sắc: đỏ nếu âm, xanh lá nếu dương (khi showPlus), mặc định theo class
 */
const APDisplay = ({
  value,
  className = "",
  iconSize = 14,
  showPlus = false,
  showAsterisk = true, // <--- THÊM PROP NÀY (Mặc định là true để giữ nguyên ở chỗ khác)
}: {
  value: number;
  className?: string;
  iconSize?: number;
  showPlus?: boolean;
  showAsterisk?: boolean; // <--- KHAI BÁO TYPE
}) => {
  const isPositive = value > 0;
  // Màu mặc định: Xanh lá nếu dương (khi showPlus), Đỏ nếu âm, hoặc theo class truyền vào
  const defaultColor =
    value < 0
      ? "text-red-600" // Âm: màu đỏ
      : showPlus && isPositive
      ? "text-green-600" // Dương và showPlus: màu xanh lá
      : "text-[var(--foreground)]"; // Mặc định: màu chữ thông thường

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold ${
        className || defaultColor
      }`}
    >
      {showPlus && isPositive ? "+" : ""}
      {/* Thêm dấu + nếu cần */}
      {formatNumber(value)}
      {/* Icon Gem màu xanh dương */}
      <div className="relative inline-flex items-center">
        <Gem size={iconSize} className="h-4 w-4 fill-blue-500 text-blue-600" />
        {/* Chỉ hiển thị dấu sao nếu showAsterisk = true */}
        {showAsterisk && (
          <span className="absolute -bottom-3 -right-2 text-yellow-500 text-lg font-bold leading-none">
            *
          </span>
        )}
      </div>
    </span>
  );
};
/**
 * HELPER FORMAT DATE ĐẦY ĐỦ (ngày + giờ):
 * @param dateString - Chuỗi date ISO từ API
 * @returns Chuỗi date đã format theo định dạng Việt Nam: "dd/mm/yyyy, hh:mm"
 */
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
/**
 * HELPER FORMAT DATE NGẮN (cho biểu đồ):
 * @param dateString - Chuỗi date ISO
 * @returns Chuỗi date ngắn chỉ có "dd/mm" (bỏ năm)
 */
const formatShortDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};
/**
 * HELPER FORMAT SỐ NHẬP LIỆU (có dấu chấm phân cách khi nhập):
 * @param value - Chuỗi nhập vào từ input
 * @returns Chuỗi đã format với dấu chấm phân cách hàng nghìn
 *
 * LOGIC:
 * 1. Xóa tất cả ký tự không phải số (0-9) khỏi chuỗi nhập
 * 2. Convert string số -> number -> format theo VN với dấu chấm
 * Ví dụ: "1000000" -> "1.000.000"
 */
const formatNumberInput = (value: string): string => {
  const numbers = value.replace(/\D/g, ""); // Chỉ giữ lại số
  if (!numbers) return ""; // Nếu không có số -> trả về rỗng
  return Number(numbers).toLocaleString("vi-VN"); // Format với dấu chấm
};

/**
 * HELPER PARSE SỐ NHẬP LIỆU (chuyển về số nguyên):
 * @param value - Chuỗi đã format có dấu chấm phân cách
 * @returns Số nguyên (number)
 *
 * LOGIC: Xóa dấu chấm phân cách -> chuyển thành number
 * Ví dụ: "1.000.000" -> 1000000
 */
const parseNumberInput = (value: string): number => {
  return Number(value.replace(/\D/g, "")) || 0; // Xóa tất cả non-digit
};

// --- COMPONENTS: DETAIL MODAL (TRANSACTIONS & WITHDRAW) ---

/**
 * MAPPING LABEL VIỆT HÓA CHO CÁC FIELD TỪ API:
 * Mapping key API (có thể viết hoa/viết thường) thành label tiếng Việt cho giao diện
 *
 * TẠI SAO CẦN MAPPING:
 * - Backend có thể trả về key tiếng Anh hoặc mixed case
 * - Cần hiển thị tiếng Việt cho người dùng
 * - Xử lý cả trường hợp viết hoa và viết thường để phòng backend trả về khác nhau
 */
const LABELS_MAP: Record<string, string> = {
  // ---  THỐNG KÊ CHI TIẾT (STORIES/CHAPTERS) ---
  contentId: "Mã nội dung",
  title: "Tiêu đề nội dung",

  // ---CHI TIẾT NGƯỜI MUA (ITEM) ---
  // --- BỔ SUNG: DỮ LIỆU THỐNG KÊ CHI TIẾT ---
  totalRevenue: "Tổng doanh thu",
  chapterRevenue: "Doanh thu từ mở chương",
  voiceRevenue: "Doanh thu từ giọng đọc",
  totalPurchases: "Tổng lượt mua",
  purchasers: "Danh sách người mua",
  purchaseDate: "Thời gian mua",
  price: "Giá mua",
  username: "Người mua",
  avatarUrl: "Ảnh đại diện",
  accountId: "ID Tài khoản",

  // --- TÀI CHÍNH ---
  grossAmount: "Doanh thu ban đầu ",
  priceDias: "Giá cho 1 chương nếu mất phí (Dias)",
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

  // --- VIỆT HÓA CÁC TRƯỜNG CÒN SÓT ---
  buyerId: "Người mua (ID)",
  costDias: "Phí tiêu tốn (Dias)", // Thay cho 'Cost Dias'
  charCount: "Số lượng ký tự", // Thay cho 'char Count'
  generatedVoices: "Mã giọng đọc tạo", // Thay cho 'generated Voices'

  // --- CÁC MÃ ID ---
  transactionId: "Mã giao dịch",
  requestId: "Mã yêu cầu",
  filterType: "Đang lọc theo",
};

/**
 * DANH SÁCH TRƯỜNG ẨN:
 * Các trường không cần hiển thị trong modal detail
 */
const HIDDEN_FIELDS = [
  "chapterId",
  "voiceIds",
  "voicePurchaseId",
  "purchaseLogId",
];

/**
 * COMPONENT MODAL CHI TIẾT:
 * Hiển thị chi tiết của transaction hoặc withdraw request trong popup
 *
 * PROPS:
 * - isOpen: Boolean kiểm soát hiển thị modal (true/false)
 * - onClose: Hàm đóng modal (set selectedItem = null)
 * - data: Dữ liệu chi tiết của item được chọn
 * - type: Loại modal ('transaction' hoặc 'withdraw') để hiển thị title phù hợp
 *
 * UI STRUCTURE:
 * 1. Header với tiêu đề và mã ID chính
 * 2. Card hiển thị số tiền và thời gian
 * 3. Bảng chi tiết với các field từ metadata
 * 4. Nút đóng modal
 */
const DetailModal = ({
  isOpen,
  onClose,
  data,
  type,
  purchaserData, // <--- THÊM PROP NÀY
}: {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: "transaction" | "withdraw";
  purchaserData?: any; // <--- THÊM TYPE NÀY
}) => {
  // Early return nếu modal không mở hoặc không có data
  if (!isOpen || !data) return null;
  // --- LOGIC XÁC ĐỊNH LOẠI MODAL (MỚI) ---
  // --- CODE MỚI: LOGIC HIỂN THỊ THỐNG KÊ ---
  // Dùng purchaserData làm nguồn dữ liệu chính cho thống kê
  const isContentStats = !!purchaserData;
  const stats = purchaserData; // Alias cho ngắn gọn

  // Hàm render 4 ô thống kê (Dashboard)
  const renderStatsDashboard = () => {
    if (!stats) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Ô 1: Tổng Doanh Thu */}
        <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800">
          <div className="text-xs text-green-600 dark:text-green-400 font-medium uppercase">
            Tổng Doanh Thu
          </div>
          <div className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
            <APDisplay value={stats.totalRevenue} />
          </div>
        </div>
        {/* Ô 2: DT Chương */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">
            DT Chương
          </div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
            <APDisplay value={stats.chapterRevenue || 0} />
          </div>
        </div>
        {/* Ô 3: DT Giọng */}
        <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800">
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase">
            DT giọng
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">
            <APDisplay value={stats.voiceRevenue || 0} />
          </div>
        </div>
        {/* Ô 4: Lượt mua */}
        <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800 flex flex-col justify-center">
          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium leading-tight">
            LƯỢT MUA
            <br />
            <span className="text-[10px] opacity-80">(Chương & Giọng)</span>
          </div>
          <div className="text-xl font-bold text-orange-700 dark:text-orange-300 mt-1">
            {stats.totalPurchases}
          </div>
        </div>
      </div>
    );
  };

  // 1. Xác định Tiêu đề (Title) - ĐÃ PHÂN LOẠI 3 TRƯỜNG HỢP
  let modalTitle = "";
  if (type === "withdraw") {
    modalTitle = "Chi Tiết Yêu Cầu Đối Soát";
  } else if (isContentStats) {
    // Check loại filter được gửi trong metadata
    const filterType = data.metadata?.filterType;

    if (filterType === "chapter") {
      modalTitle = "Chi Tiết: Doanh Thu Mở Chương";
    } else if (filterType === "voice") {
      modalTitle = "Chi Tiết: Doanh Thu Mua Giọng";
    } else {
      modalTitle = "Chi Tiết: Tổng Hợp Cả Chương & Giọng";
    }
  } else {
    modalTitle = "Chi Tiết Giao Dịch";
  }

  // 2. Xác định Nhãn ID (Label) & Giá trị ID
  const idLabel = isContentStats ? "Mã ID chương" : "Mã ID giao dịch";

  // Ưu tiên hiển thị contentId nếu có (cho thống kê), ngược lại dùng transactionId/requestId
  const displayId = data.contentId || data.transactionId || data.requestId;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
        {/* Nút đóng modal (X) ở góc phải */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          {/* 1. HEADER MODAL (Tiêu đề & ID) */}
          <div className="border-b border-[var(--border)] pb-4">
            <h2 className="text-2xl font-bold text-[var(--primary)]">
              {modalTitle}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {idLabel}:{" "}
              <span className="font-mono select-all text-[var(--foreground)]">
                {displayId}
              </span>
            </p>
          </div>

          {/* 2. LOGIC HIỂN THỊ (QUAN TRỌNG) */}

          {/* TRƯỜNG HỢP A: Nếu là Thống Kê chương -> Hiện 4 ô màu (Dashboard) */}
          {isContentStats && renderStatsDashboard()}

          {/* TRƯỜNG HỢP B: Nếu KHÔNG phải thống kê (Giao dịch thường) -> Hiện 2 ô xám cũ */}
          {!isContentStats && (
            <div className="grid grid-cols-2 gap-4">
              {/* Card Số Tiền */}
              <div className="p-4 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)]">
                <span className="text-sm font-medium text-[var(--muted-foreground)] flex items-center gap-1">
                  Số{" "}
                  <div className="relative inline-flex items-center">
                    <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                    <span className="absolute -bottom-2 -right-2 text-yellow-500 text-lg font-bold leading-none">
                      *
                    </span>
                  </div>
                </span>
                <div
                  className={`text-2xl font-bold ${
                    data.amount > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <APDisplay
                    value={data.amount}
                    className={`text-2xl ${
                      data.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                    iconSize={20}
                    showPlus={type === "transaction"}
                  />
                </div>
              </div>

              {/* Card Thời Gian */}
              <div className="p-4 bg-[var(--muted)]/30 rounded-lg border border-[var(--border)] flex flex-col justify-center">
                <span className="text-sm font-medium text-[var(--muted-foreground)]">
                  Thời gian
                </span>
                <div className="font-medium text-[var(--foreground)]">
                  {formatDate(data.createdAt)}
                </div>
              </div>
            </div>
          )}
          {/* BẢNG CHI TIẾT CÁC FIELD TỪ METADATA */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--primary)]" /> Thông tin
              chi tiết
            </h3>

            <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] overflow-hidden">
              <Table>
                <TableBody>
                  {/* --- PHẦN 1: TÊN CHƯƠNG & GIỌNG ĐỌC (Hiện Text thường không qua metadata) --- */}

                  {/* 1.1 Tên Chương - nếu có trong data root (không phải metadata) */}
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

                  {/* 1.2 Tên Giọng Đọc (array) - nếu có trong data root */}
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
                  {/* --- PHẦN 2: METADATA CÒN LẠI (nếu có metadata object) --- */}
                  {data.metadata
                    ? Object.entries(data.metadata).map(([key, value]) => {
                        // 1. Ẩn ID trong danh sách HIDDEN_FIELDS (không cần hiển thị)
                        if (HIDDEN_FIELDS.includes(key)) return null;

                        // 2. Ẩn chapterTitle/voiceNames nếu lỡ trùng trong metadata (vì đã hiện ở trên rồi)
                        if (key === "chapterTitle" || key === "voiceNames")
                          return null;

                        // 3. Hiển thị thông thường các field còn lại
                        return (
                          <TableRow key={key} className="hover:bg-transparent">
                            {/* Cột Trái: Tên trường (Việt hóa qua LABELS_MAP hoặc tự format) */}
                            <TableCell className="font-bold text-[var(--muted-foreground)] w-[160px] bg-[var(--muted)]/20">
                              {LABELS_MAP[key] ||
                                key.replace(/([A-Z])/g, " $1").trim()}
                              {/* Convert camelCase to space */}
                            </TableCell>

                            {/* Cột Phải: Giá trị (format tùy loại data) */}
                            <TableCell className="text-[var(--foreground)] break-all">
                              {key === "filterType" ? (
                                // Việt hóa giá trị của Filter
                                <span>
                                  {value === "chapter"
                                    ? "Chương"
                                    : value === "voice"
                                    ? "Giọng đọc (Audio)"
                                    : "Tất cả (Chương & Giọng)"}
                                </span>
                              ) : (key === "grossAmount" ||
                                  key.toLowerCase().includes("price") ||
                                  key.toLowerCase().includes("cost")) &&
                                typeof value === "number" ? (
                                <APDisplay
                                  value={Number(value)}
                                  showAsterisk={false}
                                />
                              ) : Array.isArray(value) ? (
                                value.join(", ")
                              ) : typeof value === "object" ? (
                                JSON.stringify(value)
                              ) : (
                                String(value)
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    : null}

                  {/* --- PHẦN 3: THÔNG TIN RÚT TIỀN (Chỉ dùng nếu metadata không có) --- */}
                  {/* Fallback cho trường hợp cũ, thực tế metadata của bạn đã chứa thông tin Bank rồi */}
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
          {/* --- PHẦN 4: DANH SÁCH NGƯỜI MUA (BỔ SUNG) --- */}
          {purchaserData && purchaserData.purchasers && (
            <div className="space-y-3 pt-4 border-t border-[var(--border)] mt-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Người mua ({purchaserData.purchasers.total || 0})
              </h3>

              <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] max-h-[250px] overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[var(--muted)]/50">
                      <TableHead>Người dùng</TableHead>
                      <TableHead className="text-right">Giá</TableHead>
                      <TableHead className="text-right">Ngày mua</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaserData.purchasers.items?.map(
                      (p: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="flex items-center gap-2 py-3">
                            <div className="h-6 w-6 rounded-full overflow-hidden bg-gray-200">
                              <img
                                src={p.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-medium text-sm">
                              {p.username}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            <APDisplay value={p.price} />
                          </TableCell>
                          <TableCell className="text-right text-xs text-[var(--muted-foreground)]">
                            {formatDate(p.purchaseDate)}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          {/* NÚT ĐÓNG MODAL */}
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
/**
 * COMPONENT CHÍNH: AuthorRevenuePage
 * Trang quản lý doanh thu và đối soát cho tác giả
 */
export default function AuthorRevenuePage() {
  // --- STATE QUẢN LÝ DỮ LIỆU CHÍNH ---

  /**
   * STATE DATA CHÍNH:
   * - summary: Tổng quan doanh thu (RevenueSummary object từ API)
   * - transactions: Danh sách giao dịch (mua chương, tạo giọng AI, đối soát)
   * - withdrawHistory: Lịch sử yêu cầu đối soát (rút tiền)
   * - loading: Trạng thái loading khi fetch data lần đầu
   */
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [transactionPage, setTransactionPage] = useState(1);
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawRequestItem[]>(
    []
  );
  const [withdrawPage, setWithdrawPage] = useState(1);
  const [loading, setLoading] = useState(true);

  /**
   * STATE MODAL CHI TIẾT:
   * - selectedItem: Item được chọn để xem chi tiết (transaction hoặc withdraw)
   * - modalType: Loại modal ('transaction' hoặc 'withdraw') để hiển thị đúng UI
   */
  const [selectedItem, setSelectedItem] = useState<
    TransactionItem | WithdrawRequestItem | null
  >(null);
  const [modalType, setModalType] = useState<"transaction" | "withdraw" | null>(
    null
  );
  [];
  /**
   * STATE BIỂU ĐỒ DOANH THU:
   * - chartData: Dữ liệu cho biểu đồ line chart (doanh thu theo ngày)
   * Format: [{ date: "dd/mm", revenue: number }, ...]
   */
  const [chartData, setChartData] = useState<
    { date: string; revenue: number }[]
  >([]);

  /**
   * STATE PAGINATION CHO BẢNG:
   * - txPage: Trang hiện tại của bảng transactions
   * - wdPage: Trang hiện tại của bảng withdraws
   * - salesPage: Trang hiện tại của bảng thống kê bán hàng (MỚI THÊM)
   * - itemsPerPage: Số item mỗi trang (mặc định 10)
   */
  const [txPage, setTxPage] = useState(1);
  const [wdPage, setWdPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const itemsPerPage = 10;

  /**
   * STATE FORM RÚT TIỀN (WITHDRAW REQUEST):
   * - withdrawAmount: Số tiền muốn rút (đã format có dấu chấm)
   * - bankName: Tên ngân hàng (VD: Vietcombank, MB Bank)
   * - bankAccount: Số tài khoản ngân hàng
   * - accountHolder: Tên chủ tài khoản (viết hoa không dấu)
   * - commitmentText: Lời cam kết của tác giả
   * - isSubmitting: Trạng thái đang submit form (disable button)
   * - amountInputRef: Ref đến input số tiền để điều khiển cursor
   */
  const amountInputRef = useRef<HTMLInputElement>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<number | string>("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [commitmentText, setCommitmentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State lưu dữ liệu chi tiết người mua lấy từ API
  const [purchaserDetail, setPurchaserDetail] = useState<any | null>(null);
  // State lưu thống kê tổng của Truyện
  const [storyStats, setStoryStats] = useState<any | null>(null);

  // State loading riêng cho khi xem chi tiết (tùy chọn)
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  // --- STATE QUẢN LÝ LUỒNG THỐNG KÊ (MỚI) ---
  // 'stories': Hiển thị danh sách truyện
  // 'chapters': Hiển thị danh sách chương của 1 truyện cụ thể
  const [statsView, setStatsView] = useState<"stories" | "chapters">("stories");

  // Lưu ID và Title của truyện đang được chọn xem chi tiết
  const [selectedStoryFilter, setSelectedStoryFilter] = useState<{
    id: string;
    title: string;
  } | null>(null);
  // State lưu trữ doanh thu thật (TotalRevenue) lấy từ API detail cho từng truyện
  const [realStoryData, setRealStoryData] = useState<Record<string, number>>(
    {}
  );
  // ---  QUẢN LÝ TAB ACTIVE ---
  const [activeTab, setActiveTab] = useState("transactions");
  // --- QUẢN LÝ TAB & SỐ LIỆU CHƯƠNG ---
  // State lưu số liệu thật của từng chương (Key: ChapterID -> Value: {c: chapterRevenue, v: voiceRevenue})
  const [realChapterData, setRealChapterData] = useState<
    Record<string, { c: number; v: number }>
  >({});

  /**
   * HELPER XỬ LÝ LỖI API (giống các file khác):
   * Xử lý error response từ backend với ưu tiên: details -> message -> fallback
   */

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
  // --- DATA FETCHING ---

  /**
   * HÀM FETCH TẤT CẢ DỮ LIỆU (tổng quan, giao dịch, đối soát):
   * 1. Lấy tổng quan doanh thu (summary)
   * 2. Lấy lịch sử giao dịch (transactions) - lấy nhiều (200) để tính biểu đồ
   * 3. Tính toán dữ liệu cho biểu đồ từ transactions
   * 4. Lấy lịch sử yêu cầu đối soát (withdrawHistory)
   *
   * LOGIC TÍNH BIỂU ĐỒ:
   * - Chỉ tính các giao dịch có amount > 0 (doanh thu, không tính chi)
   * - Gom nhóm giao dịch theo ngày (formatShortDate)
   * - Tính tổng revenue cho mỗi ngày
   * - Sort theo thời gian tăng dần
   */
  const fetchAllData = async () => {
    try {
      setLoading(true); // Bắt đầu loading
      // 1. Lấy tổng quan doanh thu
      const summaryRes = await authorRevenueService.getSummary();
      setSummary(summaryRes.data);
      // 2. Lấy lịch sử giao dịch (lấy nhiều item để tính biểu đồ)
      const transRes = await authorRevenueService.getTransactions({
        PageSize: 200, // Lấy 200 item để đủ data cho chart
      });
      setTransactions(transRes.data.items);
      // 3. Tính toán dữ liệu biểu đồ từ transactions
      const chartMap = new Map<string, number>(); // Map: dateString -> totalRevenue
      // Sort transactions theo thời gian tăng dần (cũ -> mới)
      const sortedTrans = [...transRes.data.items].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      // Duyệt qua từng transaction
      sortedTrans.forEach((item) => {
        if (item.amount > 0) {
          // Chỉ tính doanh thu (amount > 0), không tính chi
          const dateKey = formatShortDate(item.createdAt); // "dd/mm"
          const currentVal = chartMap.get(dateKey) || 0;
          chartMap.set(dateKey, currentVal + item.amount); // Cộng dồn theo ngày
        }
      });
      // Convert Map thành array cho Recharts
      setChartData(
        Array.from(chartMap.entries()).map(([date, revenue]) => ({
          date,
          revenue,
        }))
      );
      // 4. Lấy lịch sử yêu cầu đối soát
      const withdrawRes = await authorRevenueService.getWithdrawHistory();
      // Sort withdraw history mới -> cũ (theo createdAt giảm dần)
      setWithdrawHistory(
        withdrawRes.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error: any) {
      console.error("Lỗi tải dữ liệu doanh thu:", error);
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải dữ liệu.");
    } finally {
      setLoading(false); // Luôn tắt loading
    }
  };
  /**
   * EFFECT FETCH DATA KHI COMPONENT MOUNT:
   * Chạy 1 lần khi component được mount lần đầu tiên
   * Dependency array rỗng [] -> chỉ chạy 1 lần
   */
  useEffect(() => {
    fetchAllData();
  }, []);
  // ---  TỰ ĐỘNG GỌI API LẤY DOANH THU THẬT CHO TỪNG TRUYỆN ---
  useEffect(() => {
    if (transactions.length === 0) return;

    // 1. Lấy danh sách các ID truyện duy nhất từ giao dịch
    const uniqueStoryIds = [
      ...new Set(
        transactions
          .map((t) => t.storyId || t.metadata?.storyId)
          .filter((id) => id && id !== "unknown")
      ),
    ];

    // 2. Gọi API detail cho từng truyện để lấy totalRevenue "xịn"
    uniqueStoryIds.forEach(async (id) => {
      if (!id) return;
      try {
        // Gọi page=1, pageSize=1 cho nhẹ, chỉ cần lấy field totalRevenue
        const res = await authorRevenueService.getStoryRevenueDetail(id, 1, 1);

        // Lưu vào state: Key là ID truyện, Value là số tiền đúng (VD: 295)
        setRealStoryData((prev) => ({
          ...prev,
          [id]: res.data.totalRevenue,
        }));
      } catch (error) {
        console.error(`Lỗi lấy doanh thu thật cho truyện ${id}`, error);
      }
    });
  }, [transactions]);
  // --- ACTIONS (USER INTERACTIONS) ---

  /**
   * HÀM XỬ LÝ RÚT TIỀN (WITHDRAW REQUEST):
   * @param e - React.FormEvent từ form submit
   *
   * FLOW XỬ LÝ CHI TIẾT:
   * 1. Ngăn chặn form submit default behavior
   * 2. Parse số tiền từ chuỗi format (bỏ dấu chấm)
   * 3. Validate input:
   *    - Số tiền tối thiểu 1.000 dias
   *    - Số tiền không vượt quá số dư khả dụng
   *    - Thông tin ngân hàng đầy đủ
   *    - Cam kết không rỗng
   * 4. Gọi API requestWithdraw với thông tin đã validate
   * 5. Nếu thành công: reset form, refetch data, reset pagination
   * 6. Xử lý lỗi với helper handleApiError
   */
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn reload page
    if (!summary) return; // Nếu chưa có summary -> không làm gì
    // Parse số tiền từ chuỗi format (bỏ dấu chấm phân cách)
    const rawAmountStr = String(withdrawAmount).replace(/\./g, "");
    const amountNum = Number(rawAmountStr);

    // Validate số tiền
    if (!amountNum || amountNum < 1000) {
      toast.error(
        <div className="flex items-center gap-1">
          Số <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
          <span className="absolute -bottom-2 -right-1 text-yellow-500 text-lg font-bold leading-none">
            *
          </span>{" "}
          luân chuyển tối thiểu là 1.000
        </div>
      );
      return;
    }
    // Kiểm tra số dư khả dụng
    if (amountNum > summary.revenueBalance) {
      toast.error(
        <div className="flex items-center gap-1">
          Số <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
          <span className="absolute -bottom-2 -right-1 text-yellow-500 text-lg font-bold leading-none">
            *
          </span>{" "}
          khả dụng không đủ.
        </div>
      );
      return;
    }
    // Validate thông tin ngân hàng
    if (!bankName || !bankAccount || !accountHolder) {
      toast.error("Vui lòng điền đầy đủ thông tin ngân hàng.");
      return;
    }
    // Validate cam kết
    if (!commitmentText.trim()) {
      toast.error("Vui lòng nhập nội dung cam kết.");
      return;
    }

    try {
      setIsSubmitting(true); // Bắt đầu submit
      // Gọi API requestWithdraw với payload đầy đủ
      await authorRevenueService.requestWithdraw({
        amount: amountNum,
        bankName,
        bankAccountNumber: bankAccount,
        accountHolderName: accountHolder.toUpperCase(), // Luôn uppercase
        commitment: commitmentText,
      });

      toast.success("Gửi yêu cầu đối soát thành công!");
      // Reset form sau khi thành công
      setWithdrawAmount("");
      setCommitmentText("");
      // Refetch data để cập nhật UI (số dư, lịch sử)
      await fetchAllData();
      // Reset về trang 1 của bảng withdraws
      setWdPage(1); // Reset về trang 1
    } catch (error: any) {
      console.error("Lỗi :", error);
      // --- DÙNG HELPER ---
      // Helper sẽ tự lấy message chi tiết (ví dụ: "Bạn đang có yêu cầu chờ xử lý...")
      handleApiError(error, "Gửi yêu cầu chuyển đối/đối soát thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };
  /**
   * HÀM XÁC NHẬN ĐÃ NHẬN TIỀN (CHO BILL ĐÃ APPROVED):
   * @param requestId - ID của yêu cầu đối soát (withdraw request)
   *
   * MỤC ĐÍCH: Sau khi admin approved và chuyển tiền, tác giả cần xác nhận đã nhận tiền
   * để hoàn tất quy trình và cập nhật trạng thái thành "confirmed"
   *
   * FLOW:
   * 1. Gọi API confirmWithdraw với requestId
   * 2. Nếu thành công: thông báo, refetch data
   * 3. Xử lý lỗi nếu có
   */
  const handleConfirmReceipt = async (requestId: string) => {
    try {
      setLoading(true); // Bật loading toàn page
      await authorRevenueService.confirmWithdraw(requestId);

      toast.success("Đã xác nhận thành công! Cảm ơn bạn.");

      // Tải lại dữ liệu để cập nhật danh sách (trạng thái từ approved -> confirmed)
      await fetchAllData();
    } catch (error: any) {
      console.error("Lỗi xác nhận:", error);
      handleApiError(error, "Xác nhận thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false); // Tắt loading
    }
  };
  // --- CODE MỚI: STATE & API (Đã cập nhật đầy đủ) ---

  /**
   * HÀM XỬ LÝ: XEM CHI TIẾT TRUYỆN (Tương ứng Ảnh 1)
   * Kích hoạt khi click vào hàng của một truyện trong danh sách.
   * * @param storyId - ID của truyện cần xem
   * @param storyTitle - Tên truyện (để hiển thị lên header)
   * * LOGIC:
   * 1. Bật loading toàn trang.
   * 2. Gọi API getStoryRevenueDetail để lấy số liệu thống kê chính xác từ Server.
   * 3. Lưu dữ liệu vào `storyStats` (để vẽ 4 ô màu dashboard).
   * 4. Cập nhật `selectedStoryFilter` và chuyển `statsView` sang 'chapters'.
   * 5. Reset phân trang về trang 1.
   */
  const handleViewStoryDetail = async (storyId: string, storyTitle: string) => {
    try {
      setLoading(true);
      // Gọi API lấy thống kê truyện (Tổng doanh thu, DT Chương, DT Giọng...)
      const res = await authorRevenueService.getStoryRevenueDetail(
        storyId,
        1,
        20
      );

      setStoryStats(res.data); // Lưu dữ liệu thống kê vào State
      setSelectedStoryFilter({ id: storyId, title: storyTitle });
      setStatsView("chapters"); // Chuyển giao diện sang danh sách chương
      setSalesPage(1); // Reset về trang 1
      // ---  TỰ ĐỘNG CHUYỂN TAB ---
      setActiveTab("content-stats");
    } catch (error) {
      toast.error("Không thể tải chi tiết truyện.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * HÀM XEM CHI TIẾT CHƯƠNG (ĐÃ FIX TÊN CHƯƠNG GỌN GÀNG)
   * Kích hoạt khi người dùng click vào icon mắt ở bảng thống kê.
   * * @param chapterId - ID của chương cần xem.
   * @param filterType - Loại dữ liệu muốn xem: 'all' (tổng), 'chapter' (chỉ chương), 'voice' (chỉ giọng).
   */
  const handleViewChapterDetail = async (
    chapterId: string,
    filterType: "all" | "chapter" | "voice" = "all"
  ) => {
    try {
      // BƯỚC 1: GỌI API LẤY DỮ LIỆU GỐC
      // Gọi lên server để lấy toàn bộ thông tin chi tiết của chương (bao gồm cả chương và giọng)
      const res = await authorRevenueService.getChapterRevenueDetail(chapterId);
      let data = res.data;

      // BƯỚC 2: CHUẨN BỊ BIẾN ĐỂ LỌC
      // Mặc định lấy toàn bộ danh sách người mua
      let filteredItems = data.purchasers?.items || [];
      // Mặc định hiển thị tổng doanh thu (Chương + Giọng)
      let displayRevenue = data.totalRevenue;

      // BƯỚC 3: THỰC HIỆN LỌC THEO `filterType`
      if (filterType === "chapter") {
        // Trường hợp 1: Chỉ xem doanh thu Chương (Text)
        // -> Lọc lấy người mua có type='chapter'
        filteredItems = filteredItems.filter((p: any) => p.type === "chapter");
        // -> Lấy số tiền riêng của mảng Chương
        displayRevenue = data.chapterRevenue || 0;
      } else if (filterType === "voice") {
        // Trường hợp 2: Chỉ xem doanh thu Giọng (Audio)
        // -> Lọc lấy người mua có type='voice'
        filteredItems = filteredItems.filter((p: any) => p.type === "voice");
        // -> Lấy số tiền riêng của mảng Giọng
        displayRevenue = data.voiceRevenue || 0;
      }
      // (Trường hợp 'all' thì giữ nguyên mặc định ở Bước 2)

      // BƯỚC 4: CẬP NHẬT DỮ LIỆU DANH SÁCH NGƯỜI MUA
      // Tạo object mới chứa danh sách người mua đã được lọc
      const processedData = {
        ...data,
        purchasers: {
          ...data.purchasers,
          items: filteredItems, // Gán list đã lọc
          total: filteredItems.length, // Cập nhật tổng số lượng
        },
      };

      // Lưu vào state để hiển thị bảng danh sách người mua bên dưới Modal
      setPurchaserDetail(processedData);

      // BƯỚC 5: KÍCH HOẠT MODAL HIỂN THỊ
      // Tạo item giả lập để component DetailModal nhận diện và mở lên
      setSelectedItem({
        contentId: data.contentId,
        transactionId: data.contentId,

        // Hiển thị số tiền đúng theo loại lọc (Tổng hoặc riêng lẻ)
        amount: displayRevenue,

        createdAt: new Date().toISOString(),
        type: "purchase",

        // --- QUAN TRỌNG: Lấy tên chương gốc từ API ---
        // Không thêm tiền tố "Người mua..." để tiêu đề gọn gàng
        chapterTitle: data.title,

        // Truyền metadata để DetailModal biết đường đổi tiêu đề và hiển thị dòng "Đang lọc theo..."
        metadata: {
          filterType: filterType,
        },
      } as any);

      // Set loại modal là transaction để hiện đúng giao diện
      setModalType("transaction");
    } catch (error) {
      // BƯỚC 6: XỬ LÝ LỖI
      toast.error("Không thể tải chi tiết chương.");
    }
  };
  // ----------------------------------------------------------------------
  /**
   * LOGIC XỬ LÝ DỮ LIỆU THỐNG KÊ (CLIENT-SIDE AGGREGATION - V2)
   *
   * MỤC ĐÍCH:
   * Biến đổi danh sách giao dịch phẳng (flat list) từ API thành cấu trúc phân cấp:
   * Level 1: Danh sách Truyện (Tổng hợp)
   * Level 2: Danh sách Chương của 1 truyện (Chi tiết 8 cột)
   *
   * FLOW XỬ LÝ CHÍNH:
   * 1. Lọc dữ liệu: Chỉ lấy các giao dịch loại 'purchase', 'chapter_purchase', 'voice_purchase'.
   * 2. Gom nhóm Cấp 1 (Stories): Cộng dồn doanh thu của tất cả giao dịch thuộc cùng 1 StoryId.
   * 3. Gom nhóm Cấp 2 (Chapters) - Chỉ chạy khi user chọn 1 truyện:
   * - Lọc các giao dịch thuộc truyện đó.
   * - Gom nhóm theo ChapterId.
   * - QUAN TRỌNG: Phân loại transaction để cộng vào cột tương ứng:
   * + Cột Chương: type = 'chapter_purchase' hoặc 'purchase' (data cũ)
   * + Cột Giọng: type = 'voice_purchase'
   * 4. Phân trang (Pagination): Cắt dữ liệu hiển thị theo trang hiện tại (10 item/trang).
   */

  // --- BƯỚC 1: LỌC DỮ LIỆU ĐẦU VÀO ---
  // Chỉ lấy các giao dịch mua bán, bỏ qua các giao dịch rút tiền/tạo giọng
  const allPurchases = transactions.filter((t) =>
    ["purchase", "chapter_purchase", "voice_purchase"].includes(t.type)
  );

  // --- BƯỚC 2: GOM NHÓM THEO TRUYỆN (LEVEL 1) ---
  // Map<StoryId, StoryData>
  const storiesMap = new Map<
    string,
    { id: string; title: string; revenue: number; txCount: number }
  >();

  allPurchases.forEach((tx) => {
    // Ưu tiên lấy storyId từ root, nếu không có thì lấy từ metadata, cuối cùng là "unknown"
    const sId = tx.storyId || tx.metadata?.storyId || "unknown";
    const sTitle =
      tx.storyTitle || tx.metadata?.storyTitle || "Truyện chưa xác định";

    if (!storiesMap.has(sId)) {
      storiesMap.set(sId, { id: sId, title: sTitle, revenue: 0, txCount: 0 });
    }
    const story = storiesMap.get(sId)!;
    story.revenue += tx.amount; // Cộng dồn tổng doanh thu (Chương + Giọng)
    story.txCount += 1; // Đếm số lượng giao dịch
  });
  const groupedStories = Array.from(storiesMap.values());

  // --- BƯỚC 3: GOM NHÓM THEO CHƯƠNG (LEVEL 2) ---
  let groupedChapters: any[] = [];

  // Logic này chỉ chạy khi người dùng đã click chọn xem chi tiết 1 truyện
  if (selectedStoryFilter) {
    // 3.1: Lọc lấy các giao dịch chỉ thuộc về truyện đang chọn
    const txOfStory = allPurchases.filter(
      (tx) =>
        (tx.storyId || tx.metadata?.storyId || "unknown") ===
        selectedStoryFilter.id
    );

    // 3.2: Khởi tạo Map để gom nhóm theo ChapterId
    // Cấu trúc lưu trữ chi tiết: đếm lượt mua và doanh thu riêng cho Chương và Giọng
    const chaptersMap = new Map<
      string,
      {
        id: string;
        title: string;
        latestDate: string;
        // Nhóm số liệu Mua Chương
        chapterCount: number;
        chapterRevenue: number;
        // Nhóm số liệu Mua Giọng
        voiceCount: number;
        voiceRevenue: number;
      }
    >();

    txOfStory.forEach((tx) => {
      // Lấy ID chương (fallback nếu thiếu)
      const cId = tx.chapterId || tx.metadata?.chapterId || "unknown_chapter";
      const cTitle =
        tx.chapterTitle || tx.metadata?.chapterTitle || "Chương không tên";

      // Khởi tạo record cho chương nếu chưa tồn tại trong Map
      if (!chaptersMap.has(cId)) {
        chaptersMap.set(cId, {
          id: cId,
          title: cTitle,
          latestDate: tx.createdAt,
          chapterCount: 0,
          chapterRevenue: 0,
          voiceCount: 0,
          voiceRevenue: 0,
        });
      }
      const chap = chaptersMap.get(cId)!;

      // --- LOGIC PHÂN LOẠI QUAN TRỌNG ---
      // Case A: Mua nội dung chương (Text)
      // Bao gồm cả type 'purchase' (cũ) để tương thích dữ liệu cũ
      if (tx.type === "chapter_purchase" || tx.type === "purchase") {
        chap.chapterCount += 1;
        chap.chapterRevenue += tx.amount;
      }
      // Case B: Mua giọng đọc (Voice)
      else if (tx.type === "voice_purchase") {
        chap.voiceCount += 1;
        chap.voiceRevenue += tx.amount;
      }

      // Cập nhật ngày giao dịch mới nhất để hiển thị "Mới nhất: dd/mm"
      if (new Date(tx.createdAt) > new Date(chap.latestDate)) {
        chap.latestDate = tx.createdAt;
      }
    });
    // Chuyển Map thành Array để render
    groupedChapters = Array.from(chaptersMap.values());
  }

  // --- BƯỚC 4: PHÂN TRANG HIỂN THỊ (PAGINATION) ---
  // Xác định nguồn dữ liệu dựa trên view hiện tại (Truyện hay Chương)
  const currentStatsData =
    statsView === "stories"
      ? groupedStories.slice(
          (salesPage - 1) * itemsPerPage,
          salesPage * itemsPerPage
        )
      : groupedChapters.slice(
          (salesPage - 1) * itemsPerPage,
          salesPage * itemsPerPage
        );
  // --- CODE MỚI: TỰ ĐỘNG GỌI API LẤY SỐ LIỆU THẬT CHO CHƯƠNG ---
  useEffect(() => {
    if (statsView !== "chapters" || !selectedStoryFilter) return;

    // Lấy danh sách ID chương đang hiển thị trên trang hiện tại
    const currentChapterIds = currentStatsData
      .map((item) => item.id)
      .filter((id) => id && id !== "unknown_chapter");

    currentChapterIds.forEach(async (chapterId) => {
      // Nếu đã có dữ liệu rồi thì thôi không gọi lại để đỡ lag
      if (realChapterData[chapterId]) return;

      try {
        const res = await authorRevenueService.getChapterRevenueDetail(
          chapterId
        );
        setRealChapterData((prev) => ({
          ...prev,
          [chapterId]: {
            c: res.data.chapterRevenue || 0,
            v: res.data.voiceRevenue || 0,
          },
        }));
      } catch (err) {
        console.error("Lỗi lấy data chương", chapterId);
      }
    });
  }, [currentStatsData, statsView]);
  // Tính tổng số item để component Pagination render số trang chính xác
  const totalStatsItems =
    statsView === "stories" ? groupedStories.length : groupedChapters.length;
  // --- PAGINATION COMPONENT (TÁI SỬ DỤNG) ---

  /**
   * COMPONENT PAGINATION TÁI SỬ DỤNG CHO CẢ 2 BẢNG:
   * @param currentPage - Trang hiện tại
   * @param setPage - Hàm set state trang (setTxPage hoặc setWdPage)
   * @param totalItems - Tổng số item trong danh sách
   *
   * LOGIC HIỂN THỊ PAGINATION THÔNG MINH:
   * - Hiển thị tối đa 5 nút trang (hoặc ít hơn nếu tổng trang ít)
   * - Luôn hiển thị trang 1 và trang cuối cùng
   * - Hiển thị trang hiện tại và 2 trang xung quanh (current-1, current+1)
   * - Dùng "..." cho các trang bị ẩn giữa
   * - Có nút previous/next với disable state
   */
  const renderPagination = (
    currentPage: number,
    setPage: (p: number) => void,
    totalItems: number
  ) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null; // Không hiển thị nếu chỉ có 1 trang

    return (
      <div className="flex items-center justify-between mt-4 py-2 border-t border-[var(--border)] pt-4">
        {/* Hiển thị thông tin trang hiện tại/tổng */}
        <p className="text-xs text-[var(--muted-foreground)]">
          Trang {currentPage} / {totalPages}
        </p>
        {/* Các nút trang */}
        <div className="flex items-center space-x-1">
          {/* Nút Previous */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {/* Các nút số trang */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) =>
            // Logic hiển thị thông minh:
            // - Hiển thị nếu: tổng trang <=5 HOẶC trang 1 HOẶC trang cuối HOẶC trang trong khoảng currentPage±1
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
              // Hiển thị "..." cho khoảng trống
              <span key={page} className="px-1 text-[var(--muted-foreground)]">
                ...
              </span>
            ) : null
          )}
          {/* Nút Next */}
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

  /**
   * HELPER HIỂN THỊ BADGE TRẠNG THÁI (CHO CẢ TRANSACTION VÀ WITHDRAW):
   * @param status - Trạng thái cần hiển thị (string)
   * @returns Component badge với màu sắc, icon và text phù hợp
   *
   * PHÂN LOẠI STATUS:
   * A. Transaction Types (type field):
   *    - withdraw_release: Hoàn lại vào (màu đỏ) - tiền được trả lại vào ví
   *    - purchase: Cộng vào (màu xanh lá) - doanh thu từ mua chương
   *    - voice_generation: Tạo giọng đọc AI (màu xanh dương) - chi phí tạo giọng AI
   *    - withdraw_reserve: Luân chuyển khỏi (màu vàng) - tiền bị giữ khi request withdraw
   *
   * B. Withdraw Request Status (status field):
   *    - approved: Thành công (màu xanh lá) - admin đã approved và chuyển tiền
   *    - rejected: Từ chối (màu đỏ) - admin từ chối yêu cầu
   *    - pending: Đang xử lý (màu cam) - chờ admin duyệt
   *    - confirmed: Đã ký xác nhận (xanh lá đậm) - tác giả đã xác nhận nhận tiền
   */
  const renderStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      // --- TRANSACTION TYPES ---
      case "withdraw_release":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Hoàn lại vào
          </span>
        );
      case "purchase":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Cộng vào
          </span>
        );
      case "chapter_purchase": // MỚI
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Doanh thu từ mở chương
          </span>
        );
      case "voice_purchase": // MỚI
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            <Mic className="w-3 h-3 mr-1" /> Doanh thu từ mua giọng đọc
          </span>
        );
      case "voice_generation":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 border border-pink-200">
            <Mic className="w-3 h-3 mr-1" /> Tạo giọng đọc AI
          </span>
        );

      case "withdraw_reserve":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="w-3 h-3 mr-1" /> Luân chuyển khỏi
          </span>
        );
      // --- WITHDRAW REQUEST STATUS ---
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Thành công
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Từ chối
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
            <Clock className="w-3 h-3 mr-1" /> Đang xử lý
          </span>
        );

      case "confirmed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-700 text-white border border-green-800 shadow-sm">
            <CheckCircle2 className="w-3 h-3 mr-1 text-white" /> Đã ký xác nhận
          </span>
        );

      // Default
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)]">
            {status}
          </span>
        );
    }
  };

  // --- PAGINATION CALCULATIONS ---

  /**
   * TÍNH TOÁN DỮ LIỆU HIỆN TẠI CHO PHÂN TRANG:
   * - currentTransactions: Slice transactions array theo trang hiện tại
   * - currentWithdraws: Slice withdrawHistory array theo trang hiện tại
   *
   * CÔNG THỨC: (page-1)*itemsPerPage đến page*itemsPerPage
   */
  const currentTransactions = transactions.slice(
    (txPage - 1) * itemsPerPage,
    txPage * itemsPerPage
  );
  const currentWithdraws = withdrawHistory.slice(
    (wdPage - 1) * itemsPerPage,
    wdPage * itemsPerPage
  );
  // --- THÊM ĐOẠN NÀY: Lọc và Phân trang cho Tab Thống Kê Bán Hàng ---
  // 1. Lọc ra danh sách chỉ gồm các giao dịch MUA (purchase)
  const purchaseTransactions = transactions.filter(
    (t) => t.type === "purchase"
  );

  // 2. Cắt dữ liệu theo trang hiện tại (salesPage)
  const currentSales = purchaseTransactions.slice(
    (salesPage - 1) * itemsPerPage,
    salesPage * itemsPerPage
  );
  // Hiển thị loading state khi đang fetch data lần đầu
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-[var(--muted-foreground)] animate-pulse">
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }
  // --- MAIN RENDER ---
  return (
    <div className="space-y-6 relative pb-10">
      {/* Modal chi tiết (hidden khi không có selectedItem) */}
      <DetailModal
        isOpen={!!selectedItem}
        onClose={() => {
          setSelectedItem(null);
          setPurchaserDetail(null); // Reset khi đóng
        }}
        data={selectedItem}
        type={modalType || "transaction"}
        purchaserData={purchaserDetail} // <--- TRUYỀN STATE VÀO ĐÂY
      />

      {/* HEADER với tiêu đề và thông tin hạng tác giả */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[var(--primary)]">
            Quản Lý Doanh Thu
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Theo dõi thu nhập thực tế và lịch sử đối soát
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Badge hiển thị hạng tác giả (rankName từ API) */}
          <div className="flex items-center px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm">
            <span className="text-sm font-medium text-[var(--muted-foreground)] mr-2">
              Hạng:
            </span>
            <span className="text-sm font-bold text-[var(--primary)] uppercase">
              {summary?.rankName || "N/A"}
            </span>
          </div>
          {/* Badge hiển thị tỷ lệ chia sẻ (rankRewardRate từ API) */}
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

      {/* 
        STAT CARDS (4 ô thống kê chính) - Grid responsive
        Hiển thị: Số dias khả dụng, Đang chờ xử lý, Đã đối soát thành công, Tổng lũy kế
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: (
              <span className="flex items-center gap-1">
                Số
                <div className="relative inline-flex items-center">
                  <Gem className="w-4 h-4 fill-blue-500 text-blue-600" />
                  <span className="absolute -bottom-3 -right-1 text-yellow-500 text-lg font-bold leading-none">
                    *
                  </span>
                </div>
                khả dụng
              </span>
            ),
            value: summary?.revenueBalance || 0,
            icon: <Wallet className="w-5 h-5" />,
            color: "var(--primary)",
            desc: "Có thể đối soát ngay",
          },
          {
            title: "Đang chờ xử lý",
            value: summary?.revenuePending || 0,
            icon: <History className="w-5 h-5" />,
            color: "#f59e0b",
            desc: "Yêu cầu đối soát đang duyệt",
          },
          {
            title: "Đã đối soát thành công",
            value: summary?.revenueWithdrawn || 0,
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: "#10b981",
            desc: "Tổng dias đã đối soát về",
          },
          {
            title: "Tổng Lũy Kế",
            value: summary?.totalRevenue || 0,
            icon: <TrendingUp className="w-5 h-5" />,
            color: "#7c3aed",
            desc: "Bao gồm cả số dias đã đối soát ",
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
                <APDisplay value={item.value as number} />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {item.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 
        NEW LAYOUT: WITHDRAW FORM (LEFT) - BILL SECTION (RIGHT)
        Grid 12 cột: Form chiếm 5 cột, Bills chiếm 7 cột trên desktop
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WITHDRAW FORM - Cột trái (5/12) */}
        <Card className="lg:col-span-5 border border-[var(--border)] bg-[var(--card)] shadow-md h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-[var(--primary)] flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Yêu Cầu Đối Soát
            </CardTitle>
            <CardDescription>
              Nhập thông tin tài khoản chính xác.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              {/* Input số tiền với format tự động */}
              <div className="space-y-1.5">
                <Label>
                  Số lượng{" "}
                  <div className="relative inline-flex items-center">
                    <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                    <span className="absolute -bottom-2 -right-2 text-yellow-500 text-lg font-bold leading-none">
                      *
                    </span>
                  </div>{" "}
                  (dias) mong muốn <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="1.000"
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
                {/* Hiển thị số dư khả dụng */}
                <div className="text-[10px] text-right text-[var(--muted-foreground)]">
                  Khả dụng:{" "}
                  <APDisplay
                    value={summary?.revenueBalance || 0}
                    iconSize={10}
                  />
                </div>
              </div>
              {/* Input thông tin ngân hàng */}
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
              {/* Nút submit form */}
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

        {/* BILL SECTION - Cột phải (7/12) hiển thị các bill đã approved cần xác nhận */}
        <Card className="lg:col-span-7 border-none shadow-none bg-transparent flex flex-col h-full">
          {/* Header nhỏ phía trên */}
          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Hóa Đơn Đối Soát
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Danh sách các khoản thanh toán đã được duyệt chi.
              </p>
            </div>
            {/* Badge đếm số lượng bill cần xác nhận (status = approved) */}
            {withdrawHistory.filter((wd) => wd.status === "approved").length >
              0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {
                  withdrawHistory.filter((wd) => wd.status === "approved")
                    .length
                }{" "}
                cần xác nhận
              </span>
            )}
          </div>
          {/* Danh sách bills - scrollable nếu nhiều */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
            {withdrawHistory.filter((wd) => wd.status === "approved").length >
            0 ? (
              // Có bills cần xác nhận
              withdrawHistory
                .filter((wd) => wd.status === "approved")
                .map((wd) => (
                  <div
                    key={wd.requestId}
                    className="group relative bg-white dark:bg-[#1e1e1e] border-2 border-dashed border-green-300 dark:border-green-800 rounded-xl p-0 overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    {/* --- TOP: HEADER BILL với trạng thái APPROVED --- */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 border-b border-dashed border-green-200 dark:border-green-800 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            APPROVED
                          </div>
                          <span className="text-xs text-[var(--muted-foreground)] font-mono">
                            #{wd.requestId.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Ngày duyệt: {formatDate(wd.createdAt)}
                        </p>
                      </div>
                      {/* Icon trang trí */}
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600">
                        <Gem className="w-5 h-5 fill-current" />
                      </div>
                    </div>

                    {/* --- MIDDLE: BILL BODY với thông tin chi tiết --- */}
                    <div className="p-5 space-y-4">
                      {/* Thông tin người nhận (Bank) grid 2 cột */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-[var(--muted-foreground)] font-semibold tracking-wider">
                            Ngân hàng thụ hưởng
                          </p>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                            {wd.bankName}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-[var(--muted-foreground)] font-semibold tracking-wider">
                            Số tài khoản
                          </p>
                          <p className="text-sm font-mono font-medium tracking-wide">
                            {wd.bankAccountNumber}
                          </p>
                        </div>
                      </div>

                      {/* Admin Note (Nếu có) - hiển thị ghi chú từ moderator */}
                      {wd.moderatorNote && (
                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg p-3">
                          <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase mb-1 flex items-center gap-1">
                            <User className="w-3 h-3" /> Lời nhắn từ Operation
                            Mod
                          </p>
                          <p className="text-xs text-[var(--foreground)] italic">
                            "{wd.moderatorNote}"
                          </p>
                        </div>
                      )}

                      {/* Đường kẻ đứt ngăn cách */}
                      <div className="border-t-2 border-dashed border-[var(--border)] my-2"></div>

                      {/* --- BOTTOM: TOTAL & ACTION BUTTON --- */}
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] uppercase text-[var(--muted-foreground)] font-semibold mb-0.5">
                            Tổng thực nhận
                          </p>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                            <APDisplay
                              value={wd.amount}
                              showPlus={false}
                              iconSize={20}
                            />
                          </div>
                        </div>
                        {/* Nút xác nhận đã nhận tiền */}
                        <Button
                          onClick={() => handleConfirmReceipt(wd.requestId)}
                          className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Xác nhận đã nhận
                        </Button>
                      </div>
                    </div>

                    {/* Họa tiết răng cưa (trang trí viền dưới - optional) */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--background)]"
                      style={{
                        background: `radial-gradient(circle, transparent 50%, var(--background) 50%) -5px -5px / 10px 10px repeat-x`,
                        transform: "rotate(180deg)",
                      }}
                    />
                  </div>
                ))
            ) : (
              // EMPTY STATE (Khi không có bill)
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--muted)]/20 p-8 text-center min-h-[300px]">
                <div className="w-20 h-20 bg-[var(--muted)] rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-[var(--muted-foreground)] opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  Chưa có đơn cần xác nhận
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] max-w-xs mx-auto mt-2">
                  Hiện tại không có đơn đối soát nào cần bạn xác nhận.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
      {/* TABLES SECTION (TABS) cho Lịch sử giao dịch và Lịch sử đối soát */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[var(--muted)] mb-6">
          <TabsTrigger value="transactions">
            Lịch Sử Giao Dịch (Chi Tiết)
          </TabsTrigger>
          <TabsTrigger value="withdraws">
            Lịch Sử Trạng Thái Đối Soát
          </TabsTrigger>
          <TabsTrigger value="content-stats">Thống Kê Doanh Thu</TabsTrigger>
        </TabsList>

        {/* TRANSACTION HISTORY TAB */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">
                Danh Sách Giao Dịch
              </CardTitle>
              <CardDescription>
                Bao gồm doanh thu từ truyện, giọng đọc và các lệnh đối soát.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {/* Table header với màu nền đặc biệt */}
                  <TableRow className="bg-[var(--muted)]/50 hover:bg-[var(--muted)]/50 border-b border-[var(--border)]">
                    <TableHead className="w-[150px]">Thời gian</TableHead>
                    <TableHead>Loại GD</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Mã giao dịch
                    </TableHead>

                    {/* Header cột số tiền với icon Gem */}
                    <TableHead className="text-right">
                      <div className="flex w-full items-center justify-end gap-1">
                        Số{" "}
                        <div className="relative inline-flex items-center mb-0.5">
                          <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                          <span className="absolute -bottom-3 -right-2 text-yellow-500 text-lg font-bold leading-none">
                            *
                          </span>
                        </div>
                      </div>
                    </TableHead>

                    <TableHead className="w-[50px]"></TableHead>
                    {/* Cột action (eye icon) */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTransactions.length > 0 ? (
                    // Map qua các transaction của trang hiện tại
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
                          title={tx.transactionId}
                        >
                          {tx.transactionId}
                        </TableCell>

                        <TableCell className="font-bold text-[var(--foreground)] text-right">
                          {/* Hiển thị số tiền với dấu + nếu là doanh thu */}
                          <APDisplay value={tx.amount} showPlus={true} />
                        </TableCell>
                        {/* Nút eye để xem chi tiết */}
                        <TableCell className="w-[50px]">
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
                    // Empty state khi không có giao dịch
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
        {/* --- TAB MỚI: THỐNG KÊ CHI TIẾT (ĐÃ SỬA) --- */}
        <TabsContent value="content-stats" className="space-y-4">
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-2.5">
                <CardTitle className="text-[var(--primary)]">
                  {statsView === "stories"
                    ? "Thống Kê Theo Truyện"
                    : `Chi Tiết: ${selectedStoryFilter?.title}`}
                </CardTitle>
                <CardDescription>
                  {statsView === "stories"
                    ? "Chọn một bộ truyện để xem chi tiết doanh thu."
                    : "Thống kê doanh thu chi tiết chính xác."}
                </CardDescription>
              </div>

              {statsView === "chapters" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatsView("stories");
                    setSelectedStoryFilter(null);
                    setStoryStats(null); // Reset stats
                    setSalesPage(1);
                  }}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {/* --- CODE MỚI: DASHBOARD THỐNG KÊ (HIỆN KHI XEM CHI TIẾT) --- */}
              {statsView === "chapters" && storyStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-in slide-in-from-top-2">
                  <div className="p-4 rounded-xl border bg-green-50/50 border-green-100 dark:bg-green-900/20 dark:border-green-800">
                    <div className="text-xs font-semibold uppercase text-green-600 dark:text-green-400 mb-1">
                      Tổng Doanh Thu
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      <APDisplay value={storyStats.totalRevenue} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border bg-blue-50/50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                    <div className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400 mb-1">
                      DT Chương
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      <APDisplay value={storyStats.chapterRevenue || 0} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border bg-purple-50/50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800">
                    <div className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400 mb-1">
                      DT Giọng
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      <APDisplay value={storyStats.voiceRevenue || 0} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border bg-orange-50/50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800">
                    <div className="text-xs font-semibold uppercase text-orange-600 dark:text-orange-400 mb-1">
                      Tổng Lượt Mua (Chương&Giọng)
                    </div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {storyStats.totalPurchases}
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[var(--muted)]/50">
                      <TableHead className="min-w-[200px]">
                        {statsView === "stories" ? "Tên Truyện" : "Tên Chương"}
                      </TableHead>

                      {statsView === "stories" ? (
                        <>
                          <TableHead className="text-center w-[150px]">
                            Số Giao Dịch
                          </TableHead>
                          <TableHead className="text-right w-[180px]">
                            Tổng Doanh Thu
                          </TableHead>
                          <TableHead className="w-[80px] text-center">
                            Chi tiết
                          </TableHead>
                        </>
                      ) : (
                        // --- HEADER MỚI: VIỆT HÓA & CỘT ĐÚNG YÊU CẦU ---
                        <>
                          <TableHead className="text-center">Lượt Mở</TableHead>
                          <TableHead className="text-right">
                            DT Chương
                          </TableHead>
                          <TableHead className="text-center">
                            Lượt Giọng
                          </TableHead>
                          <TableHead className="text-right">DT Giọng</TableHead>
                          <TableHead className="text-right font-bold text-green-600">
                            Tổng
                          </TableHead>
                          <TableHead className="w-[50px]">Chi tiết</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {currentStatsData.length > 0 ? (
                      currentStatsData.map((item: any, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-[var(--muted)]/20 cursor-pointer border-b border-[var(--border)]"
                          onClick={() => {
                            if (statsView === "stories") {
                              // GỌI HÀM MỚI KHI CLICK TRUYỆN
                              handleViewStoryDetail(item.id, item.title);
                            }
                          }}
                        >
                          <TableCell className="font-medium">
                            {item.title || "Không tên"}
                            {statsView === "chapters" && (
                              <div className="text-[10px] text-muted-foreground">
                                Cập nhật: {formatShortDate(item.latestDate)}
                              </div>
                            )}
                          </TableCell>

                          {statsView === "stories" ? (
                            <>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                  {item.txCount} GD
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-600 text-base">
                                {/* Nếu có số liệu thật từ API (realStoryData) thì hiện, không thì hiện số cộng tay */}
                                <APDisplay
                                  value={
                                    realStoryData[item.id] !== undefined
                                      ? realStoryData[item.id]
                                      : item.revenue
                                  }
                                  showPlus
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Button variant="ghost" size="icon">
                                  <ChevronRight className="w-5 h-5" />
                                </Button>
                              </TableCell>
                            </>
                          ) : (
                            // --- ROW DATA MỚI CHO CHƯƠNG ---
                            <>
                              <TableCell className="text-center text-sm">
                                {item.chapterCount || "-"}
                              </TableCell>

                              {/* CỘT DT CHƯƠNG: Dùng số liệu thật (realChapterData) + Icon Mắt */}
                              <TableCell className="text-right font-medium text-blue-600">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Hiển thị số: Ưu tiên realData.c */}
                                  <APDisplay
                                    value={
                                      realChapterData[item.id]
                                        ? realChapterData[item.id].c
                                        : item.chapterRevenue
                                    }
                                  />
                                  {/* Nút Mắt nhỏ cho Chương */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewChapterDetail(
                                        item.id,
                                        "chapter"
                                      );
                                    }}
                                    className="p-1 hover:bg-blue-100 rounded-full text-blue-400 transition-colors"
                                    title="Xem người mua chương"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                </div>
                              </TableCell>

                              <TableCell className="text-center text-sm">
                                {item.voiceCount || "-"}
                              </TableCell>

                              {/* CỘT DT GIỌNG: Dùng số liệu thật (realChapterData) + Icon Mắt */}
                              <TableCell className="text-right font-medium text-purple-600">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Hiển thị số: Ưu tiên realData.v */}
                                  <APDisplay
                                    value={
                                      realChapterData[item.id]
                                        ? realChapterData[item.id].v
                                        : item.voiceRevenue
                                    }
                                  />
                                  {/* Nút Mắt nhỏ cho Giọng */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewChapterDetail(item.id, "voice");
                                    }}
                                    className="p-1 hover:bg-purple-100 rounded-full text-purple-400 transition-colors"
                                    title="Xem người mua giọng"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                </div>
                              </TableCell>

                              {/* CỘT TỔNG: Cộng 2 số thực lại */}
                              <TableCell className="text-right font-bold text-green-600">
                                <APDisplay
                                  value={
                                    (realChapterData[item.id]
                                      ? realChapterData[item.id].c
                                      : item.chapterRevenue) +
                                    (realChapterData[item.id]
                                      ? realChapterData[item.id].v
                                      : item.voiceRevenue)
                                  }
                                  showPlus
                                />
                              </TableCell>

                              <TableCell>
                                {/* NÚT MẮT TO (Xem Tất Cả) */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewChapterDetail(item.id, "all");
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Chưa có dữ liệu.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(salesPage, setSalesPage, totalStatsItems)}
            </CardContent>
          </Card>
        </TabsContent>
        {/* WITHDRAW HISTORY TAB */}
        <TabsContent value="withdraws" className="space-y-4">
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">
                Lịch Sử Yêu Cầu Đối Soát
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
                    <TableHead>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        Số{" "}
                        <div className="relative inline-flex items-center">
                          <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                          <span className="absolute -bottom-2 -right-2 text-yellow-500 text-lg font-bold leading-none">
                            *
                          </span>
                        </div>
                      </div>
                    </TableHead>
                    <TableHead>Ngân hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentWithdraws.length > 0 ? (
                    // Map qua các withdraw request của trang hiện tại
                    currentWithdraws.map((wd) => (
                      <TableRow
                        key={wd.requestId}
                        className="hover:bg-[var(--muted)]/20 border-b border-[var(--border)]"
                      >
                        <TableCell className="font-medium text-xs md:text-sm text-[var(--muted-foreground)]">
                          {formatDate(wd.createdAt)}
                        </TableCell>
                        <TableCell className="font-bold text-[var(--foreground)]">
                          <APDisplay value={wd.amount} />
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{wd.bankName}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {wd.bankAccountNumber}
                          </div>
                        </TableCell>
                        <TableCell>{renderStatusBadge(wd.status)}</TableCell>
                        <TableCell>
                          {/* Nút eye để xem chi tiết withdraw request */}
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
                    // Empty state khi không có yêu cầu nào
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

              {/* Pagination cho Withdraws */}
              {renderPagination(wdPage, setWdPage, withdrawHistory.length)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
