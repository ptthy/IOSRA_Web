import apiClient from "./apiClient";

export async function getUpgradeRequests(status?: string) {
  // ✅ THÊM /api vào đường dẫn
  const res = await apiClient.get("/api/OperationMod/requests", {
    params: { status },
  });
  return res.data;
}

export async function approveRequest(requestId: string) {
  // ✅ THÊM /api vào đường dẫn
  const res = await apiClient.post(`/api/OperationMod/requests/${requestId}/approve`);
  return res.data;
}

export async function rejectRequest(requestId: string, reason: string) {
  // ✅ THÊM /api vào đường dẫn
  const res = await apiClient.post(`/api/OperationMod/requests/${requestId}/reject`, {
    reason,
  });
  return res.data;
}