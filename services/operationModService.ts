// File: services/operationModService.ts
"use client";

import apiClient from "@/services/apiClient";

/**
 * Lấy danh sách yêu cầu nâng cấp (cho OMod xem)
 */
export async function getUpgradeRequests(status: "PENDING" | "APPROVED" | "REJECTED") {
  try {
    // (Đã sửa ở bước trước: thêm /api)
    const response = await apiClient.get('/api/OperationMod/requests', { 
      params: { 
        status: status
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Lỗi khi tải danh sách yêu cầu");
  }
}

/**
 * Duyệt yêu cầu (Approve)
 */
export async function approveRequest(requestId: string) {
  try {
    // ✅ SỬA: Dùng API thật (theo tài liệu bạn gửi)
    // API này không cần gửi body
    const response = await apiClient.post(`/api/OperationMod/requests/${requestId}/approve`);
    return response.data; // Trả về { message: "Request approved." }
    
  } catch (error: any) {
     throw new Error(error.response?.data?.message || error.message || "Lỗi khi duyệt yêu cầu");
  }
}

/**
 * Từ chối yêu cầu (Reject)
 */
export async function rejectRequest(requestId: string, reason: string) {
   try {
    // ✅ SỬA: Dùng API thật (theo tài liệu bạn gửi)
    // API này yêu cầu gửi 'reason' trong body
    const payload = { reason: reason };
    const response = await apiClient.post(`/api/OperationMod/requests/${requestId}/reject`, payload);
    return response.data; // Trả về { message: "Request rejected." }

  } catch (error: any) {
     throw new Error(error.response?.data?.message || error.message || "Lỗi khi từ chối yêu cầu");
  }
}