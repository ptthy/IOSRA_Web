// services/apiTypes.ts

export interface Story {
  storyId: string;
  title: string;
  description: string;
  shortDescription?: string;
  coverUrl?: string;
  tagIds?: string[];
  tags?: Tag[];
  authorId: string;
  authorUsername?: string; // Thêm trường này
  authorName?: string;
  status: "draft" | "pending" | "rejected" | "published" | "completed";
  aiScore?: number;
  aiResult?: string;
  aiNote?: string;
  aiMessage?: string;
  moderatorStatus?: string | null;
  aiFeedback?: string | null;
  moderatorNote?: string | null;
  totalChapters?: number;
  isPremium?: boolean;
  publishedAt: string;
  lengthPlan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryRequest {
  title: string;
  description: string;
  tagIds: string[];
  coverMode: "upload" | "ai";
  coverFile?: File;
  coverPrompt?: string;
}

// --- Tag Types ---
export interface Tag {
  tagId: string;
  tagName: string;
  description?: string;
}

// --- Chapter Types ---
export interface Chapter {
  chapterId: string;
  tags: Tag[];
  storyId: string;
  chapterNo: number;
  title: string;
  wordCount: number;
  languageCode: string;
  languageName: string;
  priceDias: number;
  status: "draft" | "pending" | "rejected" | "published";
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  publishedAt?: string | null;
}

// Sửa: Gộp hai interface ChapterDetails thành một
export interface ChapterDetails extends Chapter {
  // Các trường từ Chapter đã có, bổ sung thêm:
  content: string;
  orderIndex: number;
  aiScore?: number;
  aiNote?: string;
  aiFeedback?: string | null;
  summary?: string | null;
  accessType?: string;
  contentPath?: string;
  readingTime?: number;
}

export interface CreateChapterRequest {
  title: string;
  languageCode: "vi-VN" | "en-US" | "zh-CN" | "ja-JP";
  content: string;
}
// --- Public Profile Types ---
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

// --- Author Follow Types ---
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

export interface PublicStoriesResponse {
  items: Story[];
  total: number;
  page: number;
  pageSize: number;
}
export * from "./storyCatalog";
export * from "./storyRatingService";
