// services/voiceTopupPaymentService.ts
import apiClient from "./apiClient";

export interface CreateVoicePaymentRequest {
  amount: number; // Số tiền VNĐ thanh toán
}

export interface CancelVoicePaymentRequest {
  transactionId: string;
  cancellationReason?: string;
}

export const voiceTopupPaymentService = {
  // Tạo link thanh toán nạp Text
  createPaymentLink: async (data: CreateVoicePaymentRequest) => {
    // Lưu ý: Dựa trên curl bạn gửi, body chỉ có amount.
    // Nếu API backend không nhận returnUrl/cancelUrl trong body thì bạn có thể bỏ ra.
    // Ở đây mình giữ nguyên logic giống TopUpModal cũ nhưng trỏ vào endpoint mới.
    const response = await apiClient.post(
      "/api/VoiceTopupPayment/create-link",
      {
        amount: data.amount,
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
