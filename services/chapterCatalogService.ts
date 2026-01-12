// services/chapterCatalogService.ts
import apiClient from "./apiClient";
export interface Mood {
  code: string;
  name: string;
}
export interface ChapterVoice {
  voiceId: string;
  voiceName: string;
  voiceCode: string; // vd: "male_high"
  status: string; // vd: "ready"
  priceDias: number;
  hasAudio: boolean;
  owned: boolean; // Quan trọng: true = hiện nút Play, false = hiện nút Mua
  audioUrl: string | null;
}
export interface ChapterSummary {
  chapterId: string;
  chapterNo: number;
  title: string;
  isLocked: boolean;
  isOwned?: boolean;
  wordCount: number;
  charCount: number;
  publishedAt: string;
  languageCode: string;
  accessType: "free" | "dias"; // "free" hoặc "dias"
  priceDias: number;
  mood?: Mood;
  moodMusicPaths?: { title: string; storagePath: string }[];
}

export interface ChapterDetail {
  chapterId: string;
  storyId: string;
  chapterNo: number;
  title: string;
  contentUrl: string;
  wordCount: number;
  charCount: number;
  publishedAt: string;
  isLocked: boolean;
  isOwned?: boolean;
  languageCode: string;
  accessType: "free" | "dias";
  priceDias: number;
  voices?: ChapterVoice[];
  mood?: Mood;
  moodMusicPaths?: { title: string; storagePath: string }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChapterCatalogParams {
  StoryId: string;
  Page?: number;
  PageSize?: number;
}

export const chapterCatalogApi = {
  // Lấy danh sách chương
  getChapters: (
    params: ChapterCatalogParams
  ): Promise<PaginatedResponse<ChapterSummary>> => {
    return apiClient
      .get(`/api/ChapterCatalog?_t=${new Date().getTime()}`, { params })
      .then((response) => response.data);
  },

  getChapterDetail: async (chapterId: string): Promise<ChapterDetail> => {
    try {
      // Thêm timestamp để tránh cache trình duyệt
      const response = await apiClient.get(
        `/api/ChapterCatalog/${chapterId}?_t=${new Date().getTime()}`
      );
      return response.data;
    } catch (error: any) {
      // XỬ LÝ LỖI 403 - CHAPTER BỊ KHÓA
      if (
        error.response?.status === 403 &&
        error.response?.data?.error?.code === "ChapterLocked"
      ) {
        const errorData = error.response.data.error;
        const details = errorData.details;

        console.warn(
          "🎯 Chapter bị khóa: Đang lấy thông tin cơ bản từ lỗi 403"
        );

        // Tạo object ChapterDetail giả để giao diện vẫn có thông tin hiển thị
        const lockedChapter: ChapterDetail = {
          chapterId: chapterId,
          storyId: details?.storyId || "",
          // Lấy số chương và tiêu đề thật từ details nếu backend cung cấp
          chapterNo: details?.chapterNo || 0,
          title: details?.title || "Chương bị khóa",
          contentUrl: "", // Không có nội dung khi bị khóa
          wordCount: details?.wordCount || 0,
          charCount: details?.charCount || 0,
          publishedAt: details?.publishedAt || "",
          isLocked: true,
          isOwned: false,
          languageCode: details?.languageCode || "vi-VN",
          accessType: "dias",
          priceDias: details?.price || 0, // Giá để hiển thị ở Overlay
          voices: [],
          mood: details?.mood,
          moodMusicPaths: details?.moodMusicPaths || [],
        };

        return lockedChapter;
      }

      // Các lỗi nghiêm trọng khác (500, 404, mất mạng) thì ném ra cho UI xử lý
      console.error("❌ Lỗi hệ thống khi tải chapter:", error);
      throw error;
    }
  },
  // Lấy danh sách giọng đọc
  getChapterVoices: (chapterId: string): Promise<ChapterVoice[]> => {
    return apiClient
      .get(`/api/ChapterCatalog/${chapterId}/voices?_t=${new Date().getTime()}`)
      .then((response) => response.data);
  },

  // Lấy chi tiết 1 giọng
  getChapterVoiceDetail: (
    chapterId: string,
    voiceId: string
  ): Promise<ChapterVoice> => {
    return apiClient
      .get(`/api/ChapterCatalog/${chapterId}/voices/${voiceId}`)
      .then((response) => response.data);
  },

  getChapterContent: async (contentUrl: string): Promise<string> => {
    try {
      let fullUrl = contentUrl;
      if (!contentUrl.startsWith("http")) {
        const R2_BASE_URL =
          "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev";
        fullUrl = `${R2_BASE_URL}/${contentUrl}`;
      }

      if (fullUrl.includes("?")) {
        fullUrl += `&_t=${new Date().getTime()}`;
      } else {
        fullUrl += `?_t=${new Date().getTime()}`;
      }

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Accept: "text/plain, */*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const content = await response.text();
      return content;
    } catch (error) {
      console.error("❌ [Service] Error fetching chapter content:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Không thể tải nội dung: ${errorMessage}`);
    }
  },
};
