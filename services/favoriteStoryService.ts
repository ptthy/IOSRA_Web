//services/favoriteStoryService.ts
import apiClient from "./apiClient";

export interface FavoriteStoryItem {
  storyId: string;
  title: string;
  coverUrl: string;
  authorId: string;
  authorUsername: string;
  notiNewChapter: boolean;
  createdAt: string;
}

export interface FavoriteListResponse {
  items: FavoriteStoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export const favoriteStoryService = {
  // GET /api/FavoriteStory
  getFavorites: async (page: number = 1, pageSize: number = 20) => {
    const response = await apiClient.get<FavoriteListResponse>(
      "/api/FavoriteStory",
      {
        params: { page, pageSize },
      }
    );
    return response.data;
  },

  // POST /api/FavoriteStory/{storyId}
  addFavorite: async (storyId: string) => {
    const response = await apiClient.post<FavoriteStoryItem>(
      `/api/FavoriteStory/${storyId}`
    );
    return response.data;
  },

  // DELETE /api/FavoriteStory/{storyId}
  removeFavorite: async (storyId: string) => {
    await apiClient.delete(`/api/FavoriteStory/${storyId}`);
  },

  // PUT /api/FavoriteStory/{storyId}/notifications
  toggleNotification: async (storyId: string, enabled: boolean) => {
    const response = await apiClient.put<FavoriteStoryItem>(
      `/api/FavoriteStory/${storyId}/notifications`,
      { enabled }
    );
    return response.data;
  },
};
