import apiClient from "@/services/apiClient";

export interface TagPagedItem {
  tagId: string;
  name: string;
  usage: number;
}

export interface TagApiResponse {
  items: TagPagedItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Lấy danh sách Tag (có phân trang và thống kê usage)
 */
export async function getPagedTags(
  page: number,
  pageSize: number
): Promise<TagApiResponse> {
  try {
    const response = await apiClient.get("/api/Tag/paged", {
      params: {
        asc: true,
        page,
        pageSize,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi tải danh sách Tag"
    );
  }
}

export interface TagOption {
  value: string; // tagId
  label: string; // tag name
  usage?: number;
}

export const tagService = {
  // Lấy danh sách tags cho dropdown (có search)
  async getTagOptions(
    q: string = "",
    limit: number = 20
  ): Promise<TagOption[]> {
    try {
      const response = await apiClient.get<TagOption[]>("/api/Tag/options", {
        params: { q, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching tag options:", error);
      return [];
    }
  },

  // Lấy top tags để seed dữ liệu ban đầu
  async getTopTags(limit: number = 50): Promise<TagOption[]> {
    try {
      const response = await apiClient.get<TagOption[]>("/api/Tag/top", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching top tags:", error);
      return [];
    }
  },
};

export async function updateTag(tagId: string, name: string): Promise<void> {
  try {
    // Giả sử API yêu cầu body JSON là { "name": "Tên mới" }
    await apiClient.put(`/api/Tag/${tagId}`, { name });
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi cập nhật Tag"
    );
  }
}
export async function createTag(name: string): Promise<void> {
  try {
    // Gọi API POST /api/Tag với body là { name: "..." }
    await apiClient.post("/api/Tag", { name });
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi tạo mới Tag"
    );
  }
}