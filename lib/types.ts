//lib/types.ts
/**
 * TYPE DEFINITIONS - ĐỊNH NGHĨA KIỂU DỮ LIỆU CHO TOÀN ỨNG DỤNG
 * MỤC ĐÍCH: Đảm bảo type safety, dễ maintain, tự động gợi ý code
 * CHỨC NĂNG: Định nghĩa interface cho các đối tượng chính trong app
 * LỢI ÍCH:
 * 1. Phát hiện lỗi type tại compile time
 * 2. IDE auto-completion
 * 3. Dễ hiểu cấu trúc dữ liệu
 * 4. Dễ refactor khi API thay đổi
 */

/**
 * Interface tóm tắt truyện (hiển thị trong danh sách)
 */
export interface StorySummary {
  storyId: string;
  title: string;
  authorUsername: string;
  authorId?: string;
  coverUrl: string;
  shortDescription: string;
  totalChapters: number;
  isPremium: boolean;
  tags: Tag[];
  languageCode: string;
}
/**
 * Interface tóm tắt truyện (hiển thị trong danh sách)
 */
export interface Tag {
  tagId: string;
  tagName: string;
}
/**
 * Interface chi tiết truyện (khi xem trang truyện)
 * Kế thừa từ StorySummary và thêm các thuộc tính chi tiết
 * DÙNG CHO: Story detail page
 */
export interface StoryDetail extends StorySummary {
  longDescription: string;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
  status: "Ongoing" | "Completed" | "Hiatus";
  lastUpdated: string;
  chapters: ChapterSummary[];
}
/**
 * Interface tóm tắt chương
 * DÙNG CHO: Chapter list trong story detail
 */
export interface ChapterSummary {
  chapterId: string;
  chapterNo: number;
  title: string;
  publishedAt: string;
  wordCount: number;
  charCount: number;
  isPremium: boolean;
  accessType: "free" | "dias";
  priceDias: number;
}
/**
 * Interface chi tiết chương (khi đọc chương)
 * Kế thừa từ ChapterSummary và thêm content
 * DÙNG CHO: Reader page
 */
export interface ChapterDetail extends ChapterSummary {
  storyId: string;
  content: string;
}
/**
 * Interface cho truyện top tuần
 * DÙNG CHO: Weekly ranking display
 */
export interface TopWeeklyStory {
  story: StorySummary;
  weeklyViews: number;
  rank: number;
}

/**
 * Interface cho bình luận
 * DÙNG CHO: Comment system
 */
export interface Comment {
  commentId: string;
  storyId: string;
  chapterId: string;
  chapterNo?: number;
  chapterTitle?: string;
  readerId: string;
  username: string;
  avatarUrl: string;
  content: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  dislikeCount: number;
  viewerReaction: "like" | "dislike" | null;
  replies?: Comment[];
  likes?: number; // Alias cho likeCount (để tương thích)
}
/**
 * Interface thống kê bình luận
 * DÙNG CHO: Comment statistics display
 */
export interface CommentStats {
  totalComments: number;
  byChapter: { [chapterNo: number]: number };
}

/**
 * Interface bộ lọc tìm kiếm
 * DÙNG CHO: Search functionality
 */
export interface SearchFilters {
  query?: string;
  tagIds?: string[];
  status?: "Ongoing" | "Completed" | "Hiatus";
  sortBy?: "newest" | "popular" | "rating";
  isPremium?: boolean;
}
/**
 * Interface kết quả phân trang
 * Generic type T để tái sử dụng cho nhiều loại dữ liệu
 * DÙNG CHO: Paginated API responses
 */
export interface PaginatedResult<T> {
  items: T[]; // Danh sách items trên trang hiện tại
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
