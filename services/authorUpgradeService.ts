import apiClient from "./apiClient";

export interface AuthorUpgradeRequestPayload {
  commitment: string;
}

export type ApiUpgradeStatus = "PENDING" | "REJECTED" | "APPROVED";

export interface AuthorUpgradeRequestResponse {
  id: number;
  status: ApiUpgradeStatus;
  commitment: string;
  rejectionReason?: string | null; // Có thể null
  createdAt: string;
  updatedAt: string;
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
