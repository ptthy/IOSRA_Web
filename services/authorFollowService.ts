// services/authorFollowService.ts
import apiClient from "./apiClient";

// --- Interfaces ---
export interface FollowAuthorRequest {
  enableNotifications: boolean;
}

export interface FollowStatusResponse {
  isFollowing: boolean;
  notificationsEnabled: boolean;
  followedAt: string;
}

export interface FollowerInfo {
  followerId: string;
  username: string;
  avatarUrl: string | null;
  notificationsEnabled: boolean;
  followedAt: string;
}

export interface FollowersResponse {
  items: FollowerInfo[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Service ---
export const authorFollowService = {
  /**
   * POST /api/AuthorFollow/{authorId}
   * Theo dõi một tác giả
   */
  followAuthor: (authorId: string, data: FollowAuthorRequest) => {
    return apiClient.post<FollowStatusResponse>(
      `/api/AuthorFollow/${authorId}`,
      data
    );
  },

  /**
   * DELETE /api/AuthorFollow/{authorId}
   * Bỏ theo dõi một tác giả
   */
  unfollowAuthor: (authorId: string) => {
    return apiClient.delete(`/api/AuthorFollow/${authorId}`);
  },

  /**
   * GET /api/AuthorFollow/{authorId}/followers
   * Xem danh sách người theo dõi của tác giả
   */
  getAuthorFollowers: (
    authorId: string,
    params?: { page?: number; pageSize?: number }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());

    const url = `/api/AuthorFollow/${authorId}/followers${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    return apiClient.get<FollowersResponse>(url);
  },

  /**
   * GET /api/AuthorFollow/{authorId}/status
   * Kiểm tra trạng thái follow (nếu có endpoint này)
   */
  getFollowStatus: (authorId: string) => {
    return apiClient.get<FollowStatusResponse>(
      `/api/AuthorFollow/${authorId}/status`
    );
  },
};
