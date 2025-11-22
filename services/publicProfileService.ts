// services/publicProfileService.ts
import apiClient from "./apiClient";
import type { Story } from "./apiTypes";

// --- Interfaces ---
export interface PublicProfile {
  accountId: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  gender: "M" | "F" | "other" | "unspecified" | null;
  createdAt: string;
  isAuthor: boolean;
  author?: {
    authorId: string;
    rankName: string;
    isRestricted: boolean;
    isVerified: boolean;
    followerCount: number;
    publishedStoryCount: number;
    latestPublishedAt: string | null;
  };
  followState: {
    isFollowing: boolean;
    notificationsEnabled: boolean;
    followedAt: string | null;
  } | null;
}

export interface PublicStoriesResponse {
  items: Story[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Service ---
export const publicProfileService = {
  /**
   * GET /api/PublicProfile/{accountId}
   * Xem thông tin cá nhân công khai + trạng thái follow
   */
  getPublicProfile: (accountId: string) => {
    return apiClient.get<PublicProfile>(`/api/PublicProfile/${accountId}`);
  },

  /**
   * GET /api/PublicProfile/{accountId}/stories
   * Xem danh sách truyện của tác giả
   */
  getPublicStories: (
    accountId: string,
    params?: {
      Page?: number;
      PageSize?: number;
      Query?: string;
      TagId?: string;
      AuthorId?: string;
      IsPremium?: boolean;
      MinAvgRating?: number;
      SortBy?: "Newest" | "WeeklyViews" | "TopRated" | "MostChapters";
      SortDir?: "Asc" | "Desc";
    }
  ) => {
    const queryParams = new URLSearchParams();

    // Thêm các query parameters nếu có
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const url = `/api/PublicProfile/${accountId}/stories${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    return apiClient.get<PublicStoriesResponse>(url);
  },
};
