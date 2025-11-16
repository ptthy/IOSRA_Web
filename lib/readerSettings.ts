// lib/readerSettings.ts
export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: "serif" | "sans-serif" | "monospace"; // Cập nhật để khớp với component
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
const HIGHLIGHTS_KEY = "tora-highlights";

// Default Settings - Cập nhật fontFamily mặc định
export const defaultReaderSettings: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "serif", // Khớp với giá trị trong component
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

// LocalStorage Functions - Giữ nguyên
export const getReaderSettings = (): ReaderSettings => {
  if (typeof window === "undefined") return defaultReaderSettings;
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
    // Migrate old values
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
};

export const saveReaderSettings = (settings: ReaderSettings) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Các hàm còn lại giữ nguyên...
export const getVoiceSettings = (): VoiceSettings => {
  if (typeof window === "undefined") return defaultVoiceSettings;
  const stored = localStorage.getItem(VOICE_KEY);
  return stored
    ? { ...defaultVoiceSettings, ...JSON.parse(stored) }
    : defaultVoiceSettings;
};

export const saveVoiceSettings = (settings: VoiceSettings) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOICE_KEY, JSON.stringify(settings));
};

export const getHighlights = (chapterId: string): Highlight[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(HIGHLIGHTS_KEY);
  const all: Highlight[] = stored ? JSON.parse(stored) : [];
  return all.filter((h) => h.chapterId === chapterId);
};

export const saveHighlight = (highlight: Highlight) => {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(HIGHLIGHTS_KEY);
  const all: Highlight[] = stored ? JSON.parse(stored) : [];
  all.push(highlight);
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(all));
};

export const deleteHighlight = (id: string) => {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(HIGHLIGHTS_KEY);
  const all: Highlight[] = stored ? JSON.parse(stored) : [];
  const filtered = all.filter((h) => h.id !== id);
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(filtered));
};

export const updateHighlight = (id: string, updates: Partial<Highlight>) => {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(HIGHLIGHTS_KEY);
  const all: Highlight[] = stored ? JSON.parse(stored) : [];
  const updated = all.map((h) => (h.id === id ? { ...h, ...updates } : h));
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(updated));
};

// Theme Configs - Cập nhật để khớp với component
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
