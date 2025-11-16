// services/chapterCommentService.ts
import apiClient from "./apiClient";

export interface ChapterComment {
  commentId: string;
  storyId: string;
  chapterId: string;
  chapterNo: number;
  chapterTitle: string;
  readerId: string;
  username: string;
  avatarUrl: string | null;
  content: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  dislikeCount: number;
  viewerReaction: "like" | "dislike" | null;
}

export interface CommentReaction {
  readerId: string;
  username: string;
  avatarUrl: string;
  reactionType: "like" | "dislike";
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CreateReactionRequest {
  reactionType: "like" | "dislike";
}

class ChapterCommentService {
  // === Lấy danh sách bình luận theo chapter ===
  async getCommentsByChapter(
    chapterId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<ChapterComment>> {
    const response = await apiClient.get<PaginatedResponse<ChapterComment>>(
      `/api/ChapterComment/chapter/${chapterId}`,
      {
        params: { page, pageSize },
      }
    );
    return response.data;
  }

  // === Lấy danh sách bình luận theo story (có thể filter theo chapter) ===
  async getCommentsByStory(
    storyId: string,
    options?: {
      chapterId?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<StoryCommentsResponse> {
    const { chapterId, page = 1, pageSize = 20 } = options || {};

    const params: any = { page, pageSize };
    if (chapterId) {
      params.chapterId = chapterId;
    }

    const response = await apiClient.get<StoryCommentsResponse>(
      `/api/ChapterComment/story/${storyId}`,
      { params }
    );

    return response.data;
  }

  // === Tạo bình luận mới ===
  async createComment(
    chapterId: string,
    data: CreateCommentRequest
  ): Promise<ChapterComment> {
    const response = await apiClient.post<ChapterComment>(
      `/api/ChapterComment/${chapterId}`,
      data
    );
    return response.data;
  }

  // === Cập nhật bình luận ===
  async updateComment(
    chapterId: string,
    commentId: string,
    data: CreateCommentRequest
  ): Promise<ChapterComment> {
    const response = await apiClient.put<ChapterComment>(
      `/api/ChapterComment/${chapterId}/${commentId}`,
      data
    );
    return response.data;
  }

  // === Xóa bình luận ===
  async deleteComment(chapterId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/api/ChapterComment/${chapterId}/${commentId}`);
  }

  // === Thêm reaction (like/dislike) ===
  async addReaction(
    chapterId: string,
    commentId: string,
    data: CreateReactionRequest
  ): Promise<void> {
    await apiClient.post(
      `/api/ChapterComment/${chapterId}/${commentId}/reaction`,
      data
    );
  }

  // === Xóa reaction ===
  async removeReaction(chapterId: string, commentId: string): Promise<void> {
    await apiClient.delete(
      `/api/ChapterComment/${chapterId}/${commentId}/reaction`
    );
  }

  // === Lấy danh sách reactions (có thể filter theo type) ===
  async getCommentReactions(
    chapterId: string,
    commentId: string,
    options?: {
      reactionType?: "like" | "dislike";
      page?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResponse<CommentReaction>> {
    const { reactionType, page = 1, pageSize = 20 } = options || {};

    const params: any = { page, pageSize };
    if (reactionType) {
      params.reactionType = reactionType;
    }

    const response = await apiClient.get<PaginatedResponse<CommentReaction>>(
      `/api/ChapterComment/${chapterId}/${commentId}/reactions`,
      { params }
    );
    return response.data;
  }

  // === Helper methods để xử lý like/dislike ===

  // Like comment
  async likeComment(chapterId: string, commentId: string): Promise<void> {
    await this.addReaction(chapterId, commentId, { reactionType: "like" });
  }

  // Dislike comment
  async dislikeComment(chapterId: string, commentId: string): Promise<void> {
    await this.addReaction(chapterId, commentId, { reactionType: "dislike" });
  }

  // Remove reaction (bỏ like/dislike)
  async removeCommentReaction(
    chapterId: string,
    commentId: string
  ): Promise<void> {
    await this.removeReaction(chapterId, commentId);
  }

  // Lấy danh sách người like
  async getLikes(
    chapterId: string,
    commentId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<CommentReaction>> {
    return this.getCommentReactions(chapterId, commentId, {
      reactionType: "like",
      page,
      pageSize,
    });
  }

  // Lấy danh sách người dislike
  async getDislikes(
    chapterId: string,
    commentId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<CommentReaction>> {
    return this.getCommentReactions(chapterId, commentId, {
      reactionType: "dislike",
      page,
      pageSize,
    });
  }
}
export interface StoryCommentsResponse {
  storyId: string;
  chapterFilterId: string | null;
  comments: PaginatedResponse<ChapterComment>;
}
export const chapterCommentService = new ChapterCommentService();
