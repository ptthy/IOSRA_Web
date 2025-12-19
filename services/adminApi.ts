// File: src/services/adminApi.ts
import apiClient from "@/services/apiClient";

// --- Types ---
export interface Account {
  accountId: string;
  username: string;
  email: string;
  status: "banned" | "unbanned" | string;
  strike: number;
  strikeStatus: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminStatsResponse {
  items: Account[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateModRequest {
  email: string;
  username: string;
  password?: string; // API yêu cầu, nhưng nên confirm lại logic FE
  phone?: string;
}

// Pricing Types
export interface ChapterRule {
  rule_id: string;
  min_char_count: number;
  max_char_count: number | null;
  dias_price: number;
}

export interface VoiceRule {
  rule_id: string;
  min_char_count: number;
  max_char_count: number | null;
  dias_price: number;
  generation_dias: number;
}

export interface TopupPricing {
  pricing_id: string;
  amount_vnd: number;
  diamond_granted: number;
  is_active: boolean;
}

export interface SubscriptionPlan {
  plan_code: string;
  plan_name: string;
  price_vnd: number;
  daily_dias: number;
}

// --- API Functions ---

// 1. GET List Accounts
export async function getAccounts(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  role?: string;
  search?: string; // Bổ sung search
}) {
  try {
    const response = await apiClient.get<AdminStatsResponse>("/api/Admin/accounts", { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi tải danh sách tài khoản");
  }
}

// 2. Create Content Mod
export async function createContentMod(data: CreateModRequest) {
  try {
    const response = await apiClient.post("/api/Admin/content-mods", data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi tạo Content Mod");
  }
}

// 3. Create Operation Mod
export async function createOperationMod(data: CreateModRequest) {
  try {
    const response = await apiClient.post("/api/Admin/operation-mods", data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi tạo Operation Mod");
  }
}

// 4. Ban/Unban User (Patch Status)
export async function updateAccountStatus(accountId: string, status: "banned" | "unbanned") {
  try {
    const response = await apiClient.patch(`/api/Admin/accounts/${accountId}/status`, { status });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái");
  }
}

// --- Pricing APIs ---

export const pricingApi = {
  // Chapter Rules
  getChapterRules: () => apiClient.get<ChapterRule[]>("/api/AdminPricing/chapter-rules"),
  updateChapterRule: (data: { ruleId: string; diasPrice: number }) => 
    apiClient.put("/api/AdminPricing/chapter-rules", data),

  // Voice Rules
  getVoiceRules: () => apiClient.get<VoiceRule[]>("/api/AdminPricing/voice-rules"),
  updateVoiceRule: (data: { ruleId: string; diasPrice: number; generationDias: number }) => 
    apiClient.put("/api/AdminPricing/voice-rules", data),

  // Topup Pricing
  getTopupPricing: () => apiClient.get<TopupPricing[]>("/api/AdminPricing/topup-pricing"),
  updateTopupPricing: (data: { pricingId: string; diamondGranted: number }) => 
    apiClient.put("/api/AdminPricing/topup-pricing", data),

  // Subscriptions
  getSubscriptionPlans: () => apiClient.get<SubscriptionPlan[]>("/api/AdminPricing/subscription-plans"),
  updateSubscriptionPlan: (data: { planCode: string; priceVnd: number; dailyDias: number }) => 
    apiClient.put("/api/AdminPricing/subscription-plans", data),
};