
"use client";

import apiClient from "@/services/apiClient"; 

// Interface khớp với API /api/Tag/paged
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
    const response = await apiClient.get('/api/Tag/paged', { 
      params: { 
        asc: true, // Sắp xếp theo tên
        page, 
        pageSize 
      }
    });
    return response.data; 
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi tải danh sách Tag");
  }
}

// --- CÁC HÀM CRUD  ---
//

// export async function createTag(name: string) {
//   ...
// }

// export async function updateTag(tagId: string, newName: string) {
//   ...
// }

// export async function deleteTag(tagId: string) {
//   ...
// }