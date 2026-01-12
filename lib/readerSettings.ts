// lib/readerSettings.ts
/**
 * READER SETTINGS MANAGER - QUẢN LÝ CÀI ĐẶT TRÌNH ĐỌC TRUYỆN
 * MỤC ĐÍCH: Lưu trữ và quản lý cài đặt đọc truyện trong localStorage
 * CHỨC NĂNG CHÍNH:
 * 1. Lưu/load cài đặt trình đọc (font, theme, mode)
 * 2. Lưu/load cài đặt giọng đọc (voice, speed, volume)
 * 3. Quản lý highlight (đánh dấu văn bản) theo chapter
 * 4. Áp dụng highlight vào văn bản với logic học thuật
 * ĐẶC BIỆT: Logic xử lý highlight phức tạp, tránh chồng chéo
 */

/**
 * Interface cho cài đặt đọc truyện
 * - fontSize: Kích thước chữ (px)
 * - lineHeight: Chiều cao dòng (tỷ lệ)
 * - fontFamily: Kiểu font chữ
 * - theme: Giao diện đọc
 * - readingMode: Chế độ đọc (cuộn hoặc sách)
 */
export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: "serif" | "sans-serif" | "monospace";
  theme: "light" | "sepia" | "dark-blue" | "transparent";
  readingMode: "scroll" | "book";
}

/**
 * Interface cho cài đặt giọng đọc
 * - volume: Âm lượng (0-100)
 * - speed: Tốc độ đọc
 * - voice: Loại giọng đọc
 * - isPlaying: Trạng thái phát
 * - currentTime: Thời gian hiện tại
 * - duration: Tổng thời lượng
 */
export interface VoiceSettings {
  volume: number;
  speed: number;
  voice: "male-high" | "male-low" | "female-high" | "female-low";
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

/**
 * Interface cho highlight (đánh dấu văn bản)
 * - id: ID duy nhất của highlight
 * - chapterId: ID chương chứa highlight
 * - text: Đoạn văn bản được highlight
 * - color: Màu highlight
 * - startOffset: Vị trí bắt đầu trong văn bản
 * - endOffset: Vị trí kết thúc trong văn bản
 * - note: Ghi chú (optional)
 * - createdAt: Thời gian tạo
 */
export interface Highlight {
  id: string;
  chapterId: string;
  text: string;
  color: string;
  startOffset: number;
  endOffset: number;
  note?: string;
  createdAt: string;
}
/**
 * Key lưu trữ trong localStorage
 * TẠI SAO DÙNG PREFIX "tora-": Để tránh conflict với key của app khác
 */
const SETTINGS_KEY = "tora-reader-settings";
const VOICE_KEY = "tora-voice-settings";
const HIGHLIGHT_KEY = "reader_highlights";

/**
 * Cài đặt mặc định cho trình đọc
 * DÙNG KHI: User chưa có cài đặt, hoặc reset settings
 */
export const defaultReaderSettings: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "serif",
  theme: "light",
  readingMode: "scroll",
};
/**
 * Cài đặt mặc định cho giọng đọc
 */
export const defaultVoiceSettings: VoiceSettings = {
  volume: 70,
  speed: 1.0,
  voice: "female-high",
  isPlaying: false,
  currentTime: 0,
  duration: 0,
};

/**
 * Lấy cài đặt trình đọc từ localStorage
 * LOGIC XỬ LÝ HỌC THUẬT:
 * 1. Kiểm tra môi trường có localStorage không (server vs client)
 * 2. Lấy dữ liệu từ localStorage
 * 3. Validate và migrate dữ liệu cũ nếu cần
 * 4. Merge với cài đặt mặc định
 * QUAN TRỌNG: Migration theme từ "dark" cũ sang "dark-blue" mới
 */
export const getReaderSettings = (): ReaderSettings => {
  if (typeof window === "undefined") return defaultReaderSettings;

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return defaultReaderSettings;

    const parsed = JSON.parse(stored);

    // Validate and migrate old theme values
    const validThemes: ReaderSettings["theme"][] = [
      "light",
      "sepia",
      "dark-blue",
      "transparent",
    ];
    if (!validThemes.includes(parsed.theme)) {
      if (parsed.theme === "dark" || parsed.theme === "night") {
        // Migrate theme "dark" hoặc "night" cũ sang "dark-blue"
        parsed.theme = "dark-blue";
      } else {
        parsed.theme = "light";
      }
    }

    // Validate fontFamily
    const validFonts: ReaderSettings["fontFamily"][] = [
      "serif",
      "sans-serif",
      "monospace",
    ];
    if (!validFonts.includes(parsed.fontFamily)) {
      parsed.fontFamily = "serif";
    }

    return { ...defaultReaderSettings, ...parsed };
  } catch (error) {
    console.error("Error loading reader settings:", error);
    return defaultReaderSettings;
  }
};
/**
 * Lưu cài đặt trình đọc vào localStorage
 */
export const saveReaderSettings = (settings: ReaderSettings) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving reader settings:", error);
  }
};

/**
 * Lấy cài đặt giọng đọc từ localStorage
 */
export const getVoiceSettings = (): VoiceSettings => {
  if (typeof window === "undefined") return defaultVoiceSettings;

  try {
    const stored = localStorage.getItem(VOICE_KEY);
    return stored
      ? { ...defaultVoiceSettings, ...JSON.parse(stored) }
      : defaultVoiceSettings;
  } catch (error) {
    console.error("Error loading voice settings:", error);
    return defaultVoiceSettings;
  }
};
/**
 * Lưu cài đặt giọng đọc vào localStorage
 */
export const saveVoiceSettings = (settings: VoiceSettings) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(VOICE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving voice settings:", error);
  }
};

/**
 * QUAN TRỌNG: Lưu highlight vào localStorage
 * LOGIC XỬ LÝ HỌC THUẬT:
 * 1. Tạo key dựa trên chapterId: highlights_{chapterId}
 * 2. Lấy danh sách highlight hiện tại của chapter
 * 3. Thêm highlight mới vào cuối mảng
 * 4. Lưu lại toàn bộ mảng vào localStorage
 * TẠI SAO DÙNG CHAPTER ID TRONG KEY: Để phân tách highlight theo chapter
 */
export const saveHighlight = (highlight: Highlight) => {
  if (typeof window === "undefined") return;

  try {
    const key = `highlights_${highlight.chapterId}`;
    const existingHighlights = getHighlights(highlight.chapterId);
    const updatedHighlights = [...existingHighlights, highlight];

    localStorage.setItem(key, JSON.stringify(updatedHighlights));
    console.log("✅ Highlight saved:", highlight);
  } catch (error) {
    console.error("❌ Error saving highlight:", error);
    throw error;
  }
};

/**
 * QUAN TRỌNG: Lấy danh sách highlight của chapter từ localStorage
 */
export const getHighlights = (chapterId: string): Highlight[] => {
  if (typeof window === "undefined") return [];

  try {
    const key = `highlights_${chapterId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("❌ Error getting highlights:", error);
    return [];
  }
};

/**
 * Áp dụng highlight vào văn bản
 * Logic xử lý học thuật:
 * 1. Sắp xếp highlight theo độ dài giảm dần để tránh chồng chéo
 * 2. Dùng regex để tìm tất cả vị trí xuất bản của đoạn text
 * 3. Kiểm tra xem vị trí đã được highlight chưa để tránh chồng chéo
 * 4. Thay thế đoạn text bằng thẻ <mark> với style highlight
 * 5. Cập nhật lại vị trí tìm kiếm sau khi thay thế
 */
export const applyHighlightsToText = (
  text: string,
  highlights: Highlight[]
): string => {
  if (!highlights.length) return text;
  // Sắp xếp highlight theo độ dài giảm dần để tránh lỗi chồng chéo
  // TẠI SAO: Highlight dài hơn có thể chứa highlight ngắn hơn bên trong
  // Sắp xếp highlight theo độ dài giảm dần để tránh lỗi chồng chéo
  const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length);

  let result = text;

  for (const h of sorted) {
    const searchText = h.text.trim();
    if (!searchText) continue;

    // Tìm tất cả vị trí xuất hiện của đoạn text (bỏ qua khoảng trắng thừa và xuống dòng)
    // Tạo regex để tìm text (escape special characters và xử lý khoảng trắng)
    const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedText.replace(/[\s\n]+/g, "[\\s\\n]+"), "g");

    let match;
    const appliedIndices: number[] = []; // Lưu các vị trí đã được highlight

    while ((match = regex.exec(result)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      // Kiểm tra chồng chéo: nếu vị trí này đã nằm trong một highlight khác
      if (appliedIndices.some((i) => i >= start && i < end)) continue;
      // Map màu từ string sang hex code
      const colorMap: Record<string, string> = {
        yellow: "#fef08a",
        green: "#a7f3d0",
        pink: "#fbcfe8",
        purple: "#ddd6fe",
        orange: "#fed7aa",
        none: "transparent",
      };
      // const bg = colorMap[h.color] || "#fef08a";
      const bg = colorMap[h.color] || "transparent";
      // Tạo icon ghi chú nếu có
      const noteIcon = h.note
        ? `<span class="ml-1 inline-flex items-center opacity-70" style="vertical-align: middle;" title="Có ghi chú">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="m15 5 3 3"/>
      </svg>
     </span>`
        : "";

      // Style cho highlight (đặc biệt xử lý "none" color)
      const markStyle =
        h.color === "none"
          ? `background-color: transparent; cursor: pointer;`
          : `background-color: ${bg}; padding: 0 2px; border-radius: 4px; cursor: pointer;`;
      // Tạo thẻ mark với highlight
      const marked = `<mark class="highlight-mark" 
  style="${markStyle}" 
  data-highlight-id="${h.id}"
>${result.slice(start, end)}${noteIcon}</mark>`;
      // Thay thế đoạn text bằng thẻ mark
      result = result.slice(0, start) + marked + result.slice(end);
      // Lưu vị trí đã highlight
      appliedIndices.push(start);
      // Cập nhật lại lastIndex của regex để tiếp tục tìm kiếm
      // TẠI SAO: Sau khi thay thế, độ dài string đã thay đổi
      regex.lastIndex = start + marked.length;
    }
  }
  return result;
};
/**
 * QUAN TRỌNG: Xóa highlight khỏi localStorage
 */
export const deleteHighlight = (chapterId: string, highlightId: string) => {
  if (typeof window === "undefined") return;

  try {
    const key = `highlights_${chapterId}`;
    const existingHighlights = getHighlights(chapterId);
    const updatedHighlights = existingHighlights.filter(
      (h) => h.id !== highlightId
    );

    localStorage.setItem(key, JSON.stringify(updatedHighlights));
    console.log("✅ Highlight deleted:", highlightId);
  } catch (error) {
    console.error("❌ Error deleting highlight:", error);
    throw error;
  }
};
/**
 * Cập nhật highlight trong localStorage
 * DÙNG KHI: User edit note hoặc thay đổi màu highlight
 */
export const updateHighlight = (
  chapterId: string,
  id: string,
  updates: Partial<Highlight>
) => {
  if (typeof window === "undefined") return;

  try {
    const key = `highlights_${chapterId}`;
    const existingHighlights = getHighlights(chapterId);
    const updatedHighlights = existingHighlights.map((h) =>
      h.id === id ? { ...h, ...updates } : h
    );

    localStorage.setItem(key, JSON.stringify(updatedHighlights));
    console.log("✅ Highlight updated:", id);
  } catch (error) {
    console.error("❌ Error updating highlight:", error);
    throw error;
  }
};

/**
 * Cấu hình theme với màu sắc tương ứng
 * DÙNG ĐỂ: Áp dụng CSS variables cho từng theme
 */
export const themeConfigs = {
  light: {
    bg: "#ffffff",
    text: "#1a1a1a",
    secondary: "#666666",
    card: "#ffffff",
  },
  sepia: {
    bg: "#f4f1ea",
    text: "#5c4a3a",
    secondary: "#8b7355",
    card: "#faf8f3",
  },
  "dark-blue": {
    bg: "#00416a",
    text: "#f0ead6",
    secondary: "#d8cfc0",
    card: "#003454",
  },
  transparent: {
    bg: "rgba(0, 65, 106, 0.05)",
    text: "#1a1a1a",
    secondary: "#666666",
    card: "rgba(255, 255, 255, 0.8)",
  },
};
/**
 * Mapping tên giọng đọc sang tên hiển thị
 * DÙNG ĐỂ: Hiển thị tên thân thiện trong UI thay vì ID
 */
export const voiceNames = {
  "male-high": "Nam Cao",
  "male-low": "Nam Trầm",
  "female-high": "Nữ Cao",
  "female-low": "Nữ Trầm",
};

/**
 * Các tùy chọn tốc độ đọc
 * DÙNG ĐỂ: Dropdown select trong voice settings
 */
export const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
