//lib/types.ts
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

export interface Tag {
  tagId: string;
  tagName: string;
}

export interface StoryDetail extends StorySummary {
  longDescription: string;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
  status: "Ongoing" | "Completed" | "Hiatus";
  lastUpdated: string;
  chapters: ChapterSummary[];
}

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

export interface ChapterDetail extends ChapterSummary {
  storyId: string;
  content: string;
}

export interface TopWeeklyStory {
  story: StorySummary;
  weeklyViews: number;
  rank: number;
}

// Comment Types
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
  // Legacy field for compatibility
  likes?: number;
}

export interface CommentStats {
  totalComments: number;
  byChapter: { [chapterNo: number]: number };
}

// Search & Filter Types
export interface SearchFilters {
  query?: string;
  tagIds?: string[];
  status?: "Ongoing" | "Completed" | "Hiatus";
  sortBy?: "newest" | "popular" | "rating";
  isPremium?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
