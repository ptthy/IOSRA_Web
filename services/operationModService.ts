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
  const res = await apiClient.post(
    `/api/OperationMod/requests/${requestId}/approve`
  );
  return res.data;
}

export async function rejectRequest(requestId: string, reason: string) {
  // ✅ THÊM /api vào đường dẫn
  const res = await apiClient.post(
    `/api/OperationMod/requests/${requestId}/reject`,
    {
      reason,
    }
  );
  return res.data;
}
// 1. Lấy danh sách yêu cầu
export async function getRankRequests(status?: string) {
  const res = await apiClient.get("/api/OperationMod/rank-requests", {
    params: { status },
  });
  return res.data;
}

// 2. Duyệt yêu cầu (Approve)
export async function approveRankRequest(requestId: string) {
  const res = await apiClient.post(
    `/api/OperationMod/rank-requests/${requestId}/approve`
  );
  return res.data;
}

// 3. Từ chối yêu cầu (Reject)
export async function rejectRankRequest(requestId: string, reason: string) {
  const res = await apiClient.post(
    `/api/OperationMod/rank-requests/${requestId}/reject`,
    {
      reason: reason, // hoặc "note": reason tùy backend quy định, nhưng thường là reason
    }
  );
  return res.data;
}
