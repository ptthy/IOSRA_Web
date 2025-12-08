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

// --- API Functions ---

// 1. GET List Accounts
export async function getAccounts(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  role?: string;
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