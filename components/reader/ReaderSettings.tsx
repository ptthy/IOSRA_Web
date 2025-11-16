// components/reader/ReaderSettings.tsx
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

interface ReaderSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange: (settings: Settings) => void;
}

export function ReaderSettingsDialog({
  open,
  onOpenChange,
  onSettingsChange,
}: ReaderSettingsProps) {
  const [settings, setSettings] = useState<Settings>(getReaderSettings());
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(
    getVoiceSettings()
  );

  useEffect(() => {
    if (open) {
      setSettings(getReaderSettings());
      setVoiceSettings(getVoiceSettings());
    }
  }, [open]);

  const handleSettingChange = (key: keyof Settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveReaderSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleVoiceSettingChange = (key: keyof VoiceSettings, value: any) => {
    const newVoiceSettings = { ...voiceSettings, [key]: value };
    setVoiceSettings(newVoiceSettings);
    saveVoiceSettings(newVoiceSettings);
  };

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
          {/* Font Size */}
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
            <p className="text-xs text-muted-foreground">
              Aa <span className="mx-2">→</span>
              <span style={{ fontSize: `${settings.fontSize}px` }}>Aa</span>
            </p>
          </div>

          {/* Line Height */}
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

          {/* Font Family */}
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

          {/* Theme Color */}
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
                        ? "border-primary ring-2 ring-primary/20 shadow-lg"
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

          {/* Reading Mode */}
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
