// services/authorUpgradeService.ts
import apiClient from "./apiClient";

// --- PHẦN 1: NÂNG CẤP LÊN TÁC GIẢ (READER -> AUTHOR) ---

export interface AuthorUpgradeRequestPayload {
  commitment: string;
}

export type ApiUpgradeStatus = "pending" | "rejected" | "approved";

export interface AuthorUpgradeRequestResponse {
  requestId: string;
  requesterId: string;
  requesterUsername: string | null;
  status: ApiUpgradeStatus | string;
  content: string;
  createdAt: string;
  assignedOmodId: string;
  moderatorNote?: string | null;
}

// Gọi API xin làm tác giả
const submitRequest = (data: AuthorUpgradeRequestPayload) => {
  return apiClient.post("/api/AuthorUpgrade/request", data);
};

// Gọi API lấy lịch sử xin làm tác giả
const getMyRequests = () => {
  return apiClient.get<AuthorUpgradeRequestResponse[]>(
    "/api/AuthorUpgrade/my-requests"
  );
};

// --- PHẦN 2: NÂNG CẤP RANK (BRONZE -> GOLD -> DIAMOND) ---

export interface RankUpgradeRequestPayload {
  commitment: string;
}

export interface RankUpgradeResponse {
  requestId: string;
  authorId: string;
  authorUsername: string;
  authorEmail: string;
  commitment: string;
  currentRankName: string;
  targetRankName: string;
  targetRankMinFollowers: number;
  totalFollowers: number; // Sửa từ totalFollower -> totalFollowers
  status: ApiUpgradeStatus | string;
  moderatorId?: string | null;
  moderatorUsername?: string | null;
  moderatorNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

// Gọi API xin lên Rank
const submitRankRequest = (data: RankUpgradeRequestPayload) => {
  return apiClient.post("/api/AuthorUpgrade/rank-requests", data);
};

// Gọi API lấy lịch sử xin lên Rank
const getRankRequests = () => {
  return apiClient.get<RankUpgradeResponse[]>(
    "/api/AuthorUpgrade/rank-requests"
  );
};
// Gọi API lấy thông tin  Rank
const getRankStatus = () => {
  return apiClient.get("/api/AuthorUpgrade/rank-status");
};

export const authorUpgradeService = {
  submitRequest, // Dùng cho trang /author-upgrade
  getMyRequests, // Dùng cho trang /author-upgrade
  submitRankRequest, // Dùng cho trang /author/author-upgrade-rank
  getRankRequests, // Dùng cho trang /author/author-upgrade-rank
  getRankStatus, // Dùng cho trang /author/author-upgrade-rank
};
