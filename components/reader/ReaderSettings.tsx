// components/reader/ReaderSettings.tsx

/* 

 * 
 * MỤC ĐÍCH CHÍNH:
 * Dialog/Popup cài đặt tùy chỉnh trải nghiệm đọc truyện
 * 
 * CHỨC NĂNG CHÍNH:
 * - Điều chỉnh cỡ chữ (14-28px) với preview trực quan
 * - Điều chỉnh khoảng cách dòng (1.2-2.5)
 * - Chọn font chữ (Serif/Sans-serif)
 * - Chọn theme màu (4 theme: Sáng, Vàng, Xanh đậm, Trong suốt)
 * - Chọn chế độ đọc (Scroll mode / Book mode)
 * - Lưu và tải cài đặt từ localStorage
 * - Hiển thị preview cho từng theme
 * 
 * UI COMPONENTS:
 * - Dialog: Container chính
 * - Slider: Điều chỉnh giá trị số
 * - Select: Dropdown chọn option
 * - Button: Chọn chế độ đọc
 * - Card: Preview theme
 * 
 * DATA MANAGEMENT:
 * - Đồng bộ với lib/readerSettings.ts
 * - Auto-save khi thay đổi
 * - Truyền cài đặt mới lên parent qua onSettingsChange
 * 
 * UX FEATURES:
 * - Visual preview cho mỗi setting
 * - Emoji và mô tả cho từng theme
 * - Responsive grid cho theme selection
 * - Auto-close khi click outside
 */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  ReaderSettings as Settings,
  VoiceSettings,
  getReaderSettings,
  saveReaderSettings,
  getVoiceSettings,
  saveVoiceSettings,
  voiceNames,
  speedOptions,
} from "../../lib/readerSettings";
/**
 * Interface cho props của ReaderSettingsDialog
 * @prop open: boolean - Dialog có đang mở không
 * @prop onOpenChange: function - Callback khi trạng thái mở/đóng thay đổi
 * @prop onSettingsChange: function - Callback khi settings thay đổi (để cập nhật UI)
 */
interface ReaderSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange: (settings: Settings) => void;
}
/**
 * COMPONENT: ReaderSettingsDialog
 * Chức năng: Hiển thị modal cài đặt đọc truyện
 * Bao gồm:
 * 1. Cỡ chữ, khoảng cách dòng, font chữ
 * 2. Theme màu sắc (light, sepia, dark-blue, transparent)
 * 3. Chế độ đọc (scroll, book)
 * 4. Voice settings (tốc độ, volume) - phần này đã được di chuyển sang toolbar
 */
export function ReaderSettingsDialog({
  open,
  onOpenChange,
  onSettingsChange,
}: ReaderSettingsProps) {
  /**
   * STATE 1: Lưu trữ cài đặt đọc (ReaderSettings)
   * Khởi tạo bằng getReaderSettings() từ localStorage
   */
  const [settings, setSettings] = useState<Settings>(getReaderSettings());
  /**
   * STATE 2: Lưu trữ cài đặt voice (VoiceSettings)
   * Khởi tạo bằng getVoiceSettings() từ localStorage
   * LƯU Ý: Phần voice đã được di chuyển sang ReaderToolbar
   */
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(
    getVoiceSettings()
  );

  /**
   * EFFECT: Khi dialog mở, reload settings từ localStorage
   * Đảm bảo luôn hiển thị giá trị mới nhất
   */
  useEffect(() => {
    if (open) {
      setSettings(getReaderSettings());
      setVoiceSettings(getVoiceSettings());
    }
  }, [open]);
  /**
   * Hàm xử lý thay đổi setting chính
   * Flow:
   * 1. Tạo newSettings object với giá trị mới
   * 2. Cập nhật state
   * 3. Lưu vào localStorage
   * 4. Gọi callback để component cha cập nhật UI
   */
  const handleSettingChange = (key: keyof Settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveReaderSettings(newSettings); // Lưu vào localStorage
    onSettingsChange(newSettings); // Thông báo cho component cha
  };
  /**
   * Hàm xử lý thay đổi voice setting
   * Lưu ý: Voice setting không ảnh hưởng đến ReaderContent
   * Chỉ lưu vào localStorage cho lần sử dụng sau
   */
  const handleVoiceSettingChange = (key: keyof VoiceSettings, value: any) => {
    const newVoiceSettings = { ...voiceSettings, [key]: value };
    setVoiceSettings(newVoiceSettings);
    saveVoiceSettings(newVoiceSettings);
  };
  /**
   * Mảng theme options - định nghĩa các theme có sẵn
   * Mỗi theme có:
   * - value: key để lưu vào settings
   * - label: tên hiển thị
   * - emoji: icon đại diện
   * - bg: màu nền (có thể là hex hoặc gradient)
   * - text: màu chữ
   * - desc: mô tả ngắn
   */
  const themeOptions = [
    {
      value: "light",
      label: "Sáng",
      emoji: "☀️",
      bg: "#ffffff",
      text: "#1a1a1a",
      desc: "Nền trắng, chữ đen",
    },
    {
      value: "sepia",
      label: "Vàng",
      emoji: "📄",
      bg: "#f4f1ea",
      text: "#5c4a3a",
      desc: "Dịu mắt, giống sách",
    },
    {
      value: "dark-blue",
      label: "Xanh Đậm",
      emoji: "🌙",
      bg: "#00416a",
      text: "#f0ead6",
      desc: "Tối, bảo vệ mắt",
    },
    {
      value: "transparent",
      label: "Trong Suốt",
      emoji: "💎",
      bg: "linear-gradient(135deg, rgba(0,65,106,0.05) 0%, rgba(240,234,214,0.05) 100%)",
      text: "#1a1a1a",
      desc: "Hiện đại, mờ kính",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>⚙️ Cài đặt đọc truyện</DialogTitle>
          <DialogDescription>
            Tùy chỉnh trải nghiệm đọc của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ========== FONT SIZE ========== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Cỡ chữ</label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.fontSize}px
              </span>
            </div>
            <Slider
              value={[settings.fontSize]}
              min={14}
              max={28}
              step={1}
              onValueChange={(value) =>
                handleSettingChange("fontSize", value[0])
              }
            />
            {/* Preview font size */}
            <p className="text-xs text-muted-foreground">
              Aa <span className="mx-2">→</span>
              <span style={{ fontSize: `${settings.fontSize}px` }}>Aa</span>
            </p>
          </div>

          {/* ========== LINE HEIGHT ========== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Khoảng cách dòng</label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.lineHeight.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[settings.lineHeight]}
              min={1.2}
              max={2.5}
              step={0.1}
              onValueChange={(value) =>
                handleSettingChange("lineHeight", value[0])
              }
            />
          </div>

          {/* ========== FONT FAMILY ========== */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Phông chữ</label>
            <Select
              value={settings.fontFamily}
              onValueChange={(value) =>
                handleSettingChange("fontFamily", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serif">
                  {/* Preview font trong option */}
                  <span style={{ fontFamily: "'Times New Roman', serif" }}>
                    Times New Roman (Chữ có chân)
                  </span>
                </SelectItem>
                <SelectItem value="sans-serif">
                  <span style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Poppins (Không chân)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ========== THEME COLOR ========== */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Chủ đề màu sắc</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themeOptions.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => handleSettingChange("theme", theme.value)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all text-left
                    ${
                      settings.theme === theme.value
                        ? "border-primary ring-2 ring-primary/20 shadow-lg" // Highlight theme đang chọn
                        : "border-border hover:border-primary/50"
                    }
                  `}
                  style={{
                    background: theme.bg.includes("linear")
                      ? theme.bg
                      : theme.bg,
                    backdropFilter:
                      theme.value === "transparent" ? "blur(10px)" : "none",
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{theme.emoji}</span>
                      {/* Checkmark cho theme đang chọn */}
                      {settings.theme === theme.value && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <p
                      className="font-semibold text-sm"
                      style={{ color: theme.text }}
                    >
                      {theme.label}
                    </p>
                    <p
                      className="text-xs opacity-70"
                      style={{ color: theme.text }}
                    >
                      {theme.desc}
                    </p>
                    {/* Preview box với màu theme */}
                    <div
                      className="h-12 rounded-lg flex items-center justify-center mt-2 text-sm"
                      style={{
                        backgroundColor:
                          theme.value === "transparent"
                            ? "rgba(255,255,255,0.5)"
                            : "rgba(0,0,0,0.05)",
                        color: theme.text,
                      }}
                    >
                      Mẫu văn bản
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ========== READING MODE ========== */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Chế độ đọc</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={
                  settings.readingMode === "scroll" ? "default" : "outline"
                }
                onClick={() => handleSettingChange("readingMode", "scroll")}
                className="h-auto py-4 flex-col gap-2"
              >
                <div className="text-3xl">📜</div>
                <div>
                  <div className="font-semibold">Đọc xuôi</div>
                  <div className="text-xs opacity-80">Cuộn dọc</div>
                </div>
              </Button>
              <Button
                variant={
                  settings.readingMode === "book" ? "default" : "outline"
                }
                onClick={() => handleSettingChange("readingMode", "book")}
                className="h-auto py-4 flex-col gap-2"
              >
                <div className="text-3xl">📖</div>
                <div>
                  <div className="font-semibold">Như sách</div>
                  <div className="text-xs opacity-80">Lật trang</div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
