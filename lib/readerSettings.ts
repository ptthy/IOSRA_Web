// // lib/readerSettings.ts
// export interface ReaderSettings {
//   fontSize: number;
//   lineHeight: number;
//   fontFamily: "serif" | "sans-serif" | "monospace"; // Cập nhật để khớp với component
//   theme: "light" | "sepia" | "dark-blue" | "transparent";
//   readingMode: "scroll" | "book";
// }

// export interface VoiceSettings {
//   volume: number;
//   speed: number;
//   voice: "male-high" | "male-low" | "female-high" | "female-low";
//   isPlaying: boolean;
//   currentTime: number;
//   duration: number;
// }

// export interface Highlight {
//   id: string;
//   chapterId: string;
//   text: string;
//   color: string;
//   startOffset: number;
//   endOffset: number;
//   note?: string;
//   createdAt: string;
// }

// const SETTINGS_KEY = "tora-reader-settings";
// const VOICE_KEY = "tora-voice-settings";
// const HIGHLIGHT_KEY = "reader_highlights";
// // Default Settings - Cập nhật fontFamily mặc định
// export const defaultReaderSettings: ReaderSettings = {
//   fontSize: 18,
//   lineHeight: 1.8,
//   fontFamily: "serif", // Khớp với giá trị trong component
//   theme: "light",
//   readingMode: "scroll",
// };

// export const defaultVoiceSettings: VoiceSettings = {
//   volume: 70,
//   speed: 1.0,
//   voice: "female-high",
//   isPlaying: false,
//   currentTime: 0,
//   duration: 0,
// };

// // LocalStorage Functions - Giữ nguyên
// export const getReaderSettings = (): ReaderSettings => {
//   if (typeof window === "undefined") return defaultReaderSettings;
//   const stored = localStorage.getItem(SETTINGS_KEY);
//   if (!stored) return defaultReaderSettings;

//   const parsed = JSON.parse(stored);

//   // Validate and migrate old theme values
//   const validThemes: ReaderSettings["theme"][] = [
//     "light",
//     "sepia",
//     "dark-blue",
//     "transparent",
//   ];
//   if (!validThemes.includes(parsed.theme)) {
//     // Migrate old values
//     if (parsed.theme === "dark" || parsed.theme === "night") {
//       parsed.theme = "dark-blue";
//     } else {
//       parsed.theme = "light";
//     }
//   }

//   // Validate fontFamily
//   const validFonts: ReaderSettings["fontFamily"][] = [
//     "serif",
//     "sans-serif",
//     "monospace",
//   ];
//   if (!validFonts.includes(parsed.fontFamily)) {
//     parsed.fontFamily = "serif";
//   }

//   return { ...defaultReaderSettings, ...parsed };
// };

// export const saveReaderSettings = (settings: ReaderSettings) => {
//   if (typeof window === "undefined") return;
//   localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
// };

// // Các hàm còn lại giữ nguyên...
// export const getVoiceSettings = (): VoiceSettings => {
//   if (typeof window === "undefined") return defaultVoiceSettings;
//   const stored = localStorage.getItem(VOICE_KEY);
//   return stored
//     ? { ...defaultVoiceSettings, ...JSON.parse(stored) }
//     : defaultVoiceSettings;
// };

// export const saveVoiceSettings = (settings: VoiceSettings) => {
//   if (typeof window === "undefined") return;
//   localStorage.setItem(VOICE_KEY, JSON.stringify(settings));
// };

// export const saveHighlight = (highlight: Highlight) => {
//   const existing = getHighlights(highlight.chapterId);
//   existing.push(highlight);
//   localStorage.setItem(HIGHLIGHT_KEY, JSON.stringify(existing));
// };

// export const getHighlights = (chapterId: string): Highlight[] => {
//   try {
//     const all = JSON.parse(
//       localStorage.getItem(HIGHLIGHT_KEY) || "[]"
//     ) as Highlight[];
//     return all.filter((h) => h.chapterId === chapterId);
//   } catch {
//     return [];
//   }
// };
// export const applyHighlightsToText = (
//   text: string,
//   highlights: Highlight[]
// ): string => {
//   if (!highlights.length) return text;

//   // Sắp xếp highlight theo thứ tự xuất hiện trong văn bản (quan trọng!)
//   const sorted = [...highlights].sort((a, b) => {
//     // Nếu bạn lưu offset thì dùng offset, còn chưa có thì tìm bằng text
//     const aIndex = text.indexOf(a.text);
//     const bIndex = text.indexOf(b.text);
//     return aIndex - bIndex;
//   });

//   let result = text;
//   let offset = 0;

//   for (const h of sorted) {
//     const startIndex = result.indexOf(h.text, offset);
//     if (startIndex === -1) continue;

//     const endIndex = startIndex + h.text.length;

//     const colorMap: Record<string, string> = {
//       yellow: "#fef08a",
//       green: "#a7f3d0",
//       pink: "#fbcfe8",
//       purple: "#ddd6fe",
//       orange: "#fed7aa",
//     };

//     const bg = colorMap[h.color] || "#fef08a";

//     const marked = `<mark style="background-color: ${bg}; padding: 0 2px; border-radius: 2px;" data-highlight-id="${h.id}">${h.text}</mark>`;

//     result =
//       result.slice(0, startIndex + offset) +
//       marked +
//       result.slice(endIndex + offset);
//     offset += marked.length - h.text.length;
//   }

//   return result;
// };
// export const deleteHighlight = (id: string) => {
//   if (typeof window === "undefined") return;
//   const stored = localStorage.getItem(HIGHLIGHT_KEY);
//   const all: Highlight[] = stored ? JSON.parse(stored) : [];
//   const filtered = all.filter((h) => h.id !== id);
//   localStorage.setItem(HIGHLIGHT_KEY, JSON.stringify(filtered));
// };

// export const updateHighlight = (id: string, updates: Partial<Highlight>) => {
//   if (typeof window === "undefined") return;
//   const stored = localStorage.getItem(HIGHLIGHT_KEY);
//   const all: Highlight[] = stored ? JSON.parse(stored) : [];
//   const updated = all.map((h) => (h.id === id ? { ...h, ...updates } : h));
//   localStorage.setItem(HIGHLIGHT_KEY, JSON.stringify(updated));
// };

// // Theme Configs - Cập nhật để khớp với component
// export const themeConfigs = {
//   light: {
//     bg: "#ffffff",
//     text: "#1a1a1a",
//     secondary: "#666666",
//     card: "#ffffff",
//   },
//   sepia: {
//     bg: "#f4f1ea",
//     text: "#5c4a3a",
//     secondary: "#8b7355",
//     card: "#faf8f3",
//   },
//   "dark-blue": {
//     bg: "#00416a",
//     text: "#f0ead6",
//     secondary: "#d8cfc0",
//     card: "#003454",
//   },
//   transparent: {
//     bg: "rgba(0, 65, 106, 0.05)",
//     text: "#1a1a1a",
//     secondary: "#666666",
//     card: "rgba(255, 255, 255, 0.8)",
//   },
// };

// // Voice Names
// export const voiceNames = {
//   "male-high": "Nam Cao",
//   "male-low": "Nam Trầm",
//   "female-high": "Nữ Cao",
//   "female-low": "Nữ Trầm",
// };

// // Speed Options
// export const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
// lib/readerSettings.ts
export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: "serif" | "sans-serif" | "monospace";
  theme: "light" | "sepia" | "dark-blue" | "transparent";
  readingMode: "scroll" | "book";
}

export interface VoiceSettings {
  volume: number;
  speed: number;
  voice: "male-high" | "male-low" | "female-high" | "female-low";
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

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

const SETTINGS_KEY = "tora-reader-settings";
const VOICE_KEY = "tora-voice-settings";
const HIGHLIGHT_KEY = "reader_highlights";

// Default Settings
export const defaultReaderSettings: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "serif",
  theme: "light",
  readingMode: "scroll",
};

export const defaultVoiceSettings: VoiceSettings = {
  volume: 70,
  speed: 1.0,
  voice: "female-high",
  isPlaying: false,
  currentTime: 0,
  duration: 0,
};

// Reader Settings Functions
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

export const saveReaderSettings = (settings: ReaderSettings) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving reader settings:", error);
  }
};

// Voice Settings Functions
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

export const saveVoiceSettings = (settings: VoiceSettings) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(VOICE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving voice settings:", error);
  }
};

// 🔥 QUAN TRỌNG: Sửa lỗi hàm saveHighlight
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

// 🔥 QUAN TRỌNG: Sửa lỗi hàm getHighlights
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

export const applyHighlightsToText = (
  text: string,
  highlights: Highlight[]
): string => {
  if (!highlights.length) return text;

  // Sắp xếp highlight theo độ dài giảm dần để tránh lỗi chồng chéo
  const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length);

  let result = text;

  for (const h of sorted) {
    const searchText = h.text.trim();
    if (!searchText) continue;

    // Tìm tất cả vị trí xuất hiện của đoạn text (bỏ qua khoảng trắng thừa và xuống dòng)
    const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedText.replace(/[\s\n]+/g, "[\\s\\n]+"), "g");

    let match;
    const appliedIndices: number[] = [];

    while ((match = regex.exec(result)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      // Tránh bôi chồng
      if (appliedIndices.some((i) => i >= start && i < end)) continue;

      const colorMap: Record<string, string> = {
        yellow: "#fef08a",
        green: "#a7f3d0",
        pink: "#fbcfe8",
        purple: "#ddd6fe",
        orange: "#fed7aa",
      };
      const bg = colorMap[h.color] || "#fef08a";

      const marked = `<mark style="background-color: ${bg}; padding: 0 4px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);" data-highlight-id="${
        h.id
      }">${result.slice(start, end)}</mark>`;

      result = result.slice(0, start) + marked + result.slice(end);
      appliedIndices.push(start);

      // Cập nhật vị trí regex để tiếp tục tìm
      regex.lastIndex = start + marked.length;
    }
  }

  return result;
};
// 🔥 QUAN TRỌNG: Sửa lỗi hàm deleteHighlight
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

// Theme Configs
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

// Voice Names
export const voiceNames = {
  "male-high": "Nam Cao",
  "male-low": "Nam Trầm",
  "female-high": "Nữ Cao",
  "female-low": "Nữ Trầm",
};

// Speed Options
export const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
