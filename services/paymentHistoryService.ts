// services/paymentHistoryService.ts
import apiClient from "./apiClient";

export interface PaymentHistoryItem {
  paymentId: string;
  type: "dia_topup" | "voice_topup" | "subscription";
  provider: string; // "PayOS"
  orderCode: string;
  amountVnd: number;
  grantedValue: number | null;
  grantedUnit: string | null; // "dias"
  status: "pending" | "success" | "cancelled" | "failed";
  createdAt: string;
  planCode: string | null;
  planName: string | null;
}

export interface PaymentHistoryResponse {
  items: PaymentHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaymentHistoryParams {
  Page?: number;
  PageSize?: number;
  Type?: string;
  Status?: string;
  From?: string;
  To?: string;
}

export const paymentHistoryService = {
  // GET /api/PaymentHistory
  getMyPaymentHistory: async (params?: PaymentHistoryParams) => {
    const response = await apiClient.get<PaymentHistoryResponse>(
      "/api/PaymentHistory",
      { params }
    );
    return response.data;
  },
};
