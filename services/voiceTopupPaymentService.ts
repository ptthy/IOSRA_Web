// services/voiceTopupPaymentService.ts
import apiClient from "./apiClient";
//  Interface cho gói nạp từ API Pricing
export interface VoicePricingPackage {
  pricingId: string; // ID gói
  amountVnd: number;
  charsGranted: number; // Số ký tự
  isActive: boolean;
  updatedAt: string;
}

export interface CreateVoicePaymentRequest {
  amount: number; // Số tiền VNĐ thanh toán
  pricingId?: string;
}

export interface CancelVoicePaymentRequest {
  transactionId: string;
  cancellationReason?: string;
}

export const voiceTopupPaymentService = {
  // API lấy danh sách gói nạp
  getPricingPackages: async () => {
    const response = await apiClient.get<VoicePricingPackage[]>(
      "/api/VoiceTopupPayment/pricing"
    );
    return response;
  },
  // Tạo link thanh toán nạp Text
  createPaymentLink: async (data: CreateVoicePaymentRequest) => {
    const response = await apiClient.post(
      "/api/VoiceTopupPayment/create-link",
      {
        amount: data.amount,
        pricingId: data.pricingId,
      }
    );
    return response;
  },

  // Hủy link thanh toán
  cancelPaymentLink: async (data: CancelVoicePaymentRequest) => {
    const response = await apiClient.post(
      "/api/VoiceTopupPayment/cancel-link",
      data
    );
    return response;
  },
};
