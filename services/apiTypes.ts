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
  status:
    | "draft"
    | "pending"
    | "rejected"
    | "published"
    | "completed"
    | "hidden";
  aiScore?: number;
  aiResult?: string;
  aiNote?: string;
  aiMessage?: string;
  moderatorStatus?: string | null;
  aiFeedback?: string | null;
  moderatorNote?: string | null;
  totalChapters?: number;
  isPremium?: boolean;
  publishedAt: string | null;
  lengthPlan?: "super_short" | "short" | "novel";
  outline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryRequest {
  title: string;
  description: string;
  tagIds: string[];
  outline: string;
  lengthPlan: "super_short" | "short" | "novel";
  coverMode: "upload" | "generate";
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
  charCount: number;
  languageCode: string;
  languageName: string;
  priceDias: number;
  status: "draft" | "pending" | "rejected" | "published" | "hidden";
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  publishedAt?: string | null;
  aiResult?: string | null;
  moderatorStatus?: string | null;
  moderatorNote?: string | null;
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

  rankName?: "Casual" | "Bronze" | "Gold" | "Diamond" | string;
  mood?: {
    code: string;
    name: string;
  } | null;
}

export interface CreateChapterRequest {
  title: string;
  languageCode: "vi-VN" | "en-US" | "zh-CN" | "ja-JP";
  content: string;
  accessType?: "free" | "dias";
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
// --- Voice Chapter Types ---

export interface VoiceItem {
  voiceId: string;
  voiceName: string;
  voiceCode: string;
  providerVoiceId: string;
  description: string;
}

export interface VoiceAudio {
  voiceId: string;
  voiceName: string;
  voiceCode: string;
  status: "processing" | "ready" | "failed" | "pending";
  audioUrl: string;
  requestedAt: string;
  completedAt?: string;
  charCost: number;
  priceDias: number;
  errorMessage?: string | null;
}

export interface VoiceChapterResponse {
  chapterId: string;
  storyId: string;
  chapterTitle: string;
  voices: VoiceAudio[];
}

export interface VoiceCharCountResponse {
  chapterId: string;
  storyId: string;
  chapterTitle: string;
  wordCount: number;
  characterCount: number; // API trả về cái này
  charCount?: number; // Có thể API trả về cái này (logic ưu tiên)
}

export interface OrderVoiceRequest {
  voiceIds: string[];
}

export interface OrderVoiceResponse {
  charactersCharged: number;
  walletBalance: number;
  chapterId: string;
  storyId: string;
  chapterTitle: string;
  voices: VoiceAudio[];
}
export * from "./storyCatalog";
export * from "./storyRatingService";
