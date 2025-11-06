//services/authorUpgradeService.ts
import apiClient from "./apiClient";

export interface AuthorUpgradeRequestPayload {
  commitment: string;
}

export type ApiUpgradeStatus = "PENDING" | "REJECTED" | "APPROVED";

export interface AuthorUpgradeRequestResponse {
  requestId: string;
  requesterId: string;
  requesterUsername: string | null;
  status: ApiUpgradeStatus | string;
  content: string; // Trường này chứa cả cam kết và lý do từ chối
  createdAt: string;
  assignedOmodId: string;
}

const submitRequest = (data: AuthorUpgradeRequestPayload) => {
  return apiClient.post("/api/AuthorUpgrade/request", data);
};

const getMyRequests = () => {
  return apiClient.get<AuthorUpgradeRequestResponse[]>(
    "/api/AuthorUpgrade/my-requests"
  );
};

export const authorUpgradeService = {
  submitRequest,
  getMyRequests,
};
