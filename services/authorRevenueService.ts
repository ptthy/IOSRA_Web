//services/authorRevenueService.ts
import apiClient from "./apiClient";

// --- TYPES DEFINITIONS ---

// 1. Summary Types
export interface RevenueSummary {
  revenueBalance: number; // Số dư khả dụng
  revenuePending: number; // Đang chờ
  revenueWithdrawn: number; // Đã rút
  totalRevenue: number; // Tổng doanh thu
  rankName?: "Casual" | "Bronze" | "Gold" | "Diamond";
  rankRewardRate: number; // Tỷ lệ chia sẻ (VD: 60)
}

// 2. Transaction Types
export interface TransactionMetadata {
  grossAmount: number;
  voiceIds?: string[];
  voiceNames?: string[];
  chapterTitle?: string;
  chapterId?: string;
  priceDias?: number;
  rewardRate: number;
  bankName?: string;
  generatedVoices?: string[]; // Mảng ID giọng đã tạo
  charCount?: number; // Số ký tự
  buyerId?: string; // ID người mua
}

export interface TransactionItem {
  transactionId: string;
  type: "purchase" | string;
  amount: number;
  purchaseLogId?: string | null;
  requestId?: string | null;
  chapterTitle?: string | null;
  voiceNames?: string[] | null;
  metadata?: TransactionMetadata; // Metadata có thể null hoặc object
  createdAt: string;
  bankName?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;

  chapterId?: string | null;
  voicePurchaseId?: string | null;
}

export interface TransactionResponse {
  items: TransactionItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TransactionParams {
  Page?: number;
  PageSize?: number;
  Type?: string;
  From?: string; // ISO Date
  To?: string; // ISO Date
}

// 3. Withdraw Types
export interface WithdrawRequestPayload {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  accountHolderName: string;
  commitment: string;
}

export type WithdrawStatus = "pending" | "approved" | "rejected";

export interface WithdrawRequestItem {
  requestId: string;
  amount: number;
  status: WithdrawStatus | string;
  bankName: string;
  bankAccountNumber: string;
  accountHolderName: string;
  commitment: string;
  moderatorNote?: string | null;
  moderatorUsername?: string | null;
  transactionCode?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

// --- API SERVICES ---

// Lấy tổng quan doanh thu
const getSummary = () => {
  return apiClient.get<RevenueSummary>("/api/AuthorRevenue/summary");
};

// Lấy lịch sử giao dịch (biến động số dư)
const getTransactions = (params?: TransactionParams) => {
  return apiClient.get<TransactionResponse>("/api/AuthorRevenue/transactions", {
    params,
  });
};

// Gửi yêu cầu rút tiền
const requestWithdraw = (data: WithdrawRequestPayload) => {
  return apiClient.post<WithdrawRequestItem>(
    "/api/AuthorRevenue/withdraw",
    data
  );
};

// Lấy lịch sử rút tiền
// Status optional: nếu không truyền sẽ lấy tất cả (pending, approved, rejected)
const getWithdrawHistory = (status?: WithdrawStatus) => {
  const params = status ? { status } : {};
  return apiClient.get<WithdrawRequestItem[]>("/api/AuthorRevenue/withdraw", {
    params,
  });
};

export const authorRevenueService = {
  getSummary,
  getTransactions,
  requestWithdraw,
  getWithdrawHistory,
};
