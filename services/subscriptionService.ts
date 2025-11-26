// services/subscriptionService.ts
import apiClient from "./apiClient";

export interface SubscriptionPlan {
  planCode: string;
  planName: string;
  priceVnd: number;
  durationDays: number;
  dailyDias: number;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  planCode: string | null;
  planName: string | null;
  startAt: string | null;
  endAt: string | null;
  dailyDias: number;
  canClaimToday: boolean;
  lastClaimedAt: string | null;
}

export interface ClaimDailyResponse {
  subscriptionId: string;
  claimedDias: number;
  walletBalance: number;
  claimedAt: string;
  nextClaimAvailableAt: string;
}

export const subscriptionService = {
  // Lấy danh sách các gói cước
  getPlans: () => {
    return apiClient.get<SubscriptionPlan[]>("/api/Subscription/plans");
  },

  // Kiểm tra trạng thái gói của user
  getStatus: () => {
    return apiClient.get<SubscriptionStatus>("/api/Subscription/status");
  },

  // Nhận quà hàng ngày
  claimDaily: () => {
    return apiClient.post<ClaimDailyResponse>(
      "/api/Subscription/claim-daily",
      {}
    );
  },
};
