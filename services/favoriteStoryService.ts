//services/favoriteStoryService.ts
import apiClient from "./apiClient";
/**
 * Interface FavoriteStoryItem:
 * - Định nghĩa cấu trúc một truyện yêu thích
 * - Bao gồm thông tin cơ bản và cài đặt thông báo
 */
export interface FavoriteStoryItem {
  storyId: string;
  title: string;
  coverUrl: string;
  authorId: string;
  authorUsername: string;
  notiNewChapter: boolean; // Có nhận thông báo chương mới không
  createdAt: string;
}
/**
 * Interface FavoriteListResponse:
 * - Response từ API với phân trang
 */
export interface FavoriteListResponse {
  items: FavoriteStoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Service quản lý truyện yêu thích:
 * - CRUD operations cho favorite stories
 * - Quản lý cài đặt thông báo
 */
export const favoriteStoryService = {
  // GET /api/FavoriteStory
  /**
   * getFavorites: Lấy danh sách truyện yêu thích
   * @param page - Trang hiện tại
   * @param pageSize - Số lượng mỗi trang
   * @returns Promise với FavoriteListResponse
   */
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
  /**
   * addFavorite: Thêm truyện vào danh sách yêu thích
   * @param storyId - ID của truyện
   * @returns Promise với FavoriteStoryItem vừa thêm
   */
  addFavorite: async (storyId: string) => {
    const response = await apiClient.post<FavoriteStoryItem>(
      `/api/FavoriteStory/${storyId}`
    );
    return response.data;
  },

  // DELETE /api/FavoriteStory/{storyId}
  /**
   * removeFavorite: Xóa truyện khỏi danh sách yêu thích
   * @param storyId - ID của truyện
   * @returns Promise
   */
  removeFavorite: async (storyId: string) => {
    await apiClient.delete(`/api/FavoriteStory/${storyId}`);
  },

  // PUT /api/FavoriteStory/{storyId}/notifications
  /**
   * toggleNotification: Bật/tắt thông báo chương mới
   * @param storyId - ID của truyện
   * @param enabled - Trạng thái bật/tắt
   * @returns Promise với FavoriteStoryItem đã cập nhật
   *
   * Logic: Khi enabled=true → user sẽ nhận thông báo khi truyện có chương mới
   */
  toggleNotification: async (storyId: string, enabled: boolean) => {
    const response = await apiClient.put<FavoriteStoryItem>(
      `/api/FavoriteStory/${storyId}/notifications`,
      { enabled }
    );
    return response.data;
  },
};
