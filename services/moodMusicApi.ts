/**
 * @file moodMusicApi.ts
 * @description Service quản lý các yêu cầu API liên quan đến nhạc nền AI (Mood Music).
 * Sử dụng Cloud Storage R2 để lưu trữ và truy xuất file âm thanh (.mp3).
 */
import apiClient from "@/services/apiClient";

// 1. CẤU HÌNH URL CLOUD STORAGE (R2)
const R2_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev";

// --- Interfaces ---

export interface Mood {
  moodCode: string;
  moodName: string;
  description: string;
  trackCount: number;
}

export interface Track {
  trackId: string;
  moodCode: string;
  moodName?: string;
  title: string;
  durationSeconds: number;
  publicUrl: string; // URL đầy đủ dẫn đến file MP3
  createdAt: string;
}

export interface GenerateTrackRequest {
  moodCode: string;
  title: string;
  prompt: string;
}

// --- Helper Function: Xử lý Link R2 ---
// Hàm này ghép Base URL vào nếu đường dẫn là tương đối
function resolveR2Url(path: string): string {
  if (!path) return "";
  
  // Nếu đã là link full (có http) thì giữ nguyên
  if (path.startsWith("http")) return path;

  // Xử lý bỏ dấu / ở đầu nếu có để tránh lỗi double slash //
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  
  // Ghép chuỗi: https://...r2.dev/mood_music/...
  return `${R2_BASE_URL}/${cleanPath}`;
}

// --- API Functions ---

export const moodMusicApi = {
// Lấy danh sách các loại tâm trạng/thể loại nhạc
  getMoods: async (): Promise<Mood[]> => {
    const response = await apiClient.get("/api/ContentModMoodMusic/moods");
    return response.data;
  },

 // Lấy danh sách các bài nhạc thuộc một mã tâm trạng cụ thể
  getTracks: async (moodCode: string): Promise<Track[]> => {
    const response = await apiClient.get("/api/ContentModMoodMusic/tracks", {
      params: { moodCode },
    });

    // Duyệt qua danh sách để đảm bảo mọi bài nhạc đều có URL hợp lệ
    const tracks = response.data.map((track: any) => ({
      ...track,
      publicUrl: resolveR2Url(track.publicUrl) // <--- QUAN TRỌNG: Ghép link tại đây
    }));

    return tracks;
  },
  
// Gửi yêu cầu cho AI sáng tác bài nhạc mới dựa trên prompt (mô tả)
  generateTrack: async (data: GenerateTrackRequest): Promise<Track> => {
    const response = await apiClient.post("/api/ContentModMoodMusic/tracks", data);
    const track = response.data;
    return {
      ...track,
      publicUrl: resolveR2Url(track.publicUrl)
    };
  },

  // 4. Cập nhật tên bài hát
  updateTrack: async (trackId: string, title: string): Promise<void> => {
    await apiClient.put(`/api/ContentModMoodMusic/tracks/${trackId}`, { title });
  },

  // 5. Xóa bài hát
  deleteTrack: async (trackId: string): Promise<void> => {
    await apiClient.delete(`/api/ContentModMoodMusic/tracks/${trackId}`);
  },
};