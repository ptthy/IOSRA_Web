// services/paymentService.ts
import apiClient from "./apiClient";
// Interface cho gói nạp Diamond từ API
export interface PaymentPricingPackage {
  pricingId: string;
  amountVnd: number;
  diamondGranted: number;
  isActive: boolean;
  updatedAt: string;
}
export interface TopUpRequest {
  amount: number;
  returnUrl: string;
  cancelUrl: string;
  pricingId?: string;
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
   * Lấy danh sách gói nạp Kim Cương
   */
  getPricingPackages: async () => {
    const response = await apiClient.get<PaymentPricingPackage[]>(
      "/api/Payment/pricing"
    );
    return response;
  },
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
