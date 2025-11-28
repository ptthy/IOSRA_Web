// services/paymentService.ts
import apiClient from "./apiClient";

export interface TopUpRequest {
  amount: number;
  returnUrl: string;
  cancelUrl: string;
}

export interface SubscriptionRequest {
  planCode: string; // "premium_month"
  returnUrl: string;
  cancelUrl: string;
}

export interface CancelLinkRequest {
  transactionId: string;
  cancellationReason?: string;
}

export const paymentService = {
  /**
   * Tạo link thanh toán nạp Kim Cương (Top-up)
   */
  createPaymentLink: (data: TopUpRequest) => {
    return apiClient.post("/api/Payment/create-link", data);
  },

  /**
   * Tạo link đăng ký gói VIP (Subscription)
   */
  createSubscriptionLink: (data: SubscriptionRequest) => {
    return apiClient.post("/api/Payment/create-subscription-link", data);
  },

  /**
   * Hủy đơn hàng đang chờ thanh toán
   */
  cancelPaymentLink: (data: CancelLinkRequest) => {
    return apiClient.post("/api/Payment/cancel-link", data);
  },
};
