// services/storyCatalog.ts
import apiClient from "./apiClient";
import { Story, Tag } from "./apiTypes";
// export interface Story {
//   storyId: string;
//   title: string;
//   authorId: string;
//   authorUsername: string;
//   coverUrl: string;
//   isPremium: boolean;
//   totalChapters: number;
//   publishedAt: string;
//   shortDescription: string;
//   description: string;
//   lengthPlan: string;
//   tags: Array<{
//     tagId: string;
//     tagName: string;
//   }>;
// }

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StoryCatalogParams {
  page?: number;
  pageSize?: number;
  query?: string;
  tagId?: string;
  authorId?: string;
}

export interface AdvanceFilterParams {
  Page?: number; // SỬA: Viết hoa Page
  PageSize?: number; // SỬA: Viết hoa PageSize
  Query?: string; // SỬA: Viết hoa Query
  TagId?: string; // SỬA: Viết hoa TagId
  AuthorId?: string; // SỬA: Viết hoa AuthorId
  IsPremium?: boolean;
  MinAvgRating?: number;
  SortBy?: "Newest" | "WeeklyViews" | "TopRated" | "MostChapters";
  SortDir?: "Asc" | "Desc";
}

export interface TopWeeklyStory {
  story: Story;
  weeklyViewCount: number;
  weekStartUtc: string;
}

export const storyCatalogApi = {
  // === Endpoint 1: GET /api/StoryCatalog ===
  getStories: (
    params: StoryCatalogParams
  ): Promise<PaginatedResponse<Story>> => {
    return apiClient
      .get("/api/StoryCatalog", { params })
      .then((response) => response.data);
  },

  // === Endpoint 2: GET /api/StoryCatalog/advance-filter ===
  getAdvancedFilter: (
    params: AdvanceFilterParams
  ): Promise<PaginatedResponse<Story>> => {
    // SỬA: Chuyển đổi params sang dạng viết hoa cho advance-filter
    const formattedParams: Record<string, any> = {};

    if (params.Page !== undefined) formattedParams.Page = params.Page;
    if (params.PageSize !== undefined)
      formattedParams.PageSize = params.PageSize;
    if (params.Query) formattedParams.Query = params.Query;
    if (params.TagId) formattedParams.TagId = params.TagId;
    if (params.AuthorId) formattedParams.AuthorId = params.AuthorId;
    if (params.IsPremium !== undefined)
      formattedParams.IsPremium = params.IsPremium;
    if (params.MinAvgRating !== undefined)
      formattedParams.MinAvgRating = params.MinAvgRating;
    if (params.SortBy) formattedParams.SortBy = params.SortBy;
    if (params.SortDir) formattedParams.SortDir = params.SortDir;

    console.log("🎯 Advance filter formatted params:", formattedParams);

    return apiClient
      .get("/api/StoryCatalog/advance-filter", { params: formattedParams })
      .then((response) => response.data);
  },

  // === Endpoint 3: GET /api/StoryCatalog/latest ===
  getLatestStories: (limit: number = 10): Promise<Story[]> => {
    return apiClient
      .get("/api/StoryCatalog/latest", {
        params: { limit },
      })
      .then((response) => {
        console.log("Latest stories API response:", response.data);
        return response.data;
      });
  },

  // === Endpoint 4: GET /api/StoryCatalog/top-weekly ===
  getTopWeeklyStories: (limit: number = 10): Promise<TopWeeklyStory[]> => {
    return apiClient
      .get("/api/StoryCatalog/top-weekly", {
        params: { limit },
      })
      .then((response) => {
        console.log("Top weekly stories API response:", response.data);
        return response.data;
      });
  },

  // === Endpoint 5: GET /api/StoryCatalog/{storyId} ===
  getStoryById: (storyId: string): Promise<Story> => {
    return apiClient
      .get(`/api/StoryCatalog/${storyId}`)
      .then((response) => response.data);
  },
};
