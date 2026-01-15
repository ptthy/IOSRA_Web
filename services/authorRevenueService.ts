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
  storyId?: string; // <--- Cần trường này để gom nhóm
  storyTitle?: string; // <--- Cần trường này để hiển thị tên truyện
}

export interface TransactionItem {
  transactionId: string;
  type: "purchase" | "chapter_purchase" | "voice_purchase" | string;
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

  storyId?: string | null;
  storyTitle?: string | null;
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
// Định nghĩa cấu trúc dữ liệu người mua để hiển thị trong bảng/modal
export interface PurchaserItem {
  accountId: string;
  username: string;
  avatarUrl: string;
  price: number;
  purchaseDate: string;
  type?: "chapter" | "voice" | string;
}

// Cấu trúc dữ liệu trả về từ API doanh thu chi tiết
export interface RevenueDetailResponse {
  contentId: string;
  title: string;
  totalRevenue: number;
  chapterRevenue?: number;
  voiceRevenue?: number;
  totalPurchases: number;
  purchasers: {
    items: PurchaserItem[];
    total: number;
    page: number;
    pageSize: number;
  };
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

//Ký xác nhận nhận tiền
const confirmWithdraw = (requestId: string) => {
  return apiClient.post<{ message: string }>(
    `/api/AuthorRevenue/withdraw/${requestId}/confirm`
  );
};
/**
 * Lấy chi tiết doanh thu và danh sách người mua theo ID truyện
 * @param storyId ID của truyện (UUID)
 */
const getStoryRevenueDetail = (storyId: string, page = 1, pageSize = 20) => {
  return apiClient.get<RevenueDetailResponse>(
    `/api/AuthorRevenue/stories/${storyId}`,
    {
      params: { page, pageSize },
    }
  );
};

/**
 * Lấy chi tiết doanh thu và danh sách người mua theo ID chương
 * @param chapterId ID của chương (UUID)
 */
const getChapterRevenueDetail = (
  chapterId: string,
  page = 1,
  pageSize = 20
) => {
  return apiClient.get<RevenueDetailResponse>(
    `/api/AuthorRevenue/chapters/${chapterId}`,
    {
      params: { page, pageSize },
    }
  );
};

export const authorRevenueService = {
  getSummary,
  getTransactions,
  requestWithdraw,
  getWithdrawHistory,
  confirmWithdraw,
  getStoryRevenueDetail,
  getChapterRevenueDetail,
};
