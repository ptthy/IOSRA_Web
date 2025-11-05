import apiClient from "./apiClient";

export async function getUpgradeRequests(status?: string) {
  const res = await apiClient.get("/OperationMod/requests", {
    params: { status },
  });
  return res.data;
}


export async function approveRequest(requestId: string) {
  const res = await apiClient.post(`/OperationMod/requests/${requestId}/approve`);
  return res.data;
}


export async function rejectRequest(requestId: string, reason: string) {
  const res = await apiClient.post(`/OperationMod/requests/${requestId}/reject`, {
    reason,
  });
  return res.data;
}