import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  VoiceSettings,
  voiceNames,
  speedOptions,
  getVoiceSettings,
  saveVoiceSettings,
} from "../../lib/readerSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface VoicePlayerBottomProps {
  chapterTitle: string;
  isDarkTheme?: boolean;
}

export function VoicePlayerBottom({
  chapterTitle,
  isDarkTheme = false,
}: VoicePlayerBottomProps) {
  const [settings, setSettings] = useState<VoiceSettings>(getVoiceSettings());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    saveVoiceSettings(settings);
  }, [settings]);

  const togglePlay = () => {
    setSettings((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const skipTime = (seconds: number) => {
    setSettings((prev) => ({
      ...prev,
      currentTime: Math.max(
        0,
        Math.min(prev.duration, prev.currentTime + seconds)
      ),
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 shadow-2xl border-t transition-all ${
        isExpanded ? "h-auto" : "h-auto"
      }`}
      style={{
        backgroundColor: isDarkTheme ? "#003454" : "rgba(255,255,255,0.98)",
        borderColor: isDarkTheme ? "rgba(240,234,214,0.2)" : "rgba(0,0,0,0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4">
        {/* Expand/Collapse Button */}
        <div className="flex justify-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-8 rounded-t-lg hover:bg-primary/10"
            style={{ color: isDarkTheme ? "#f0ead6" : "#1a1a1a" }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="pb-4">
          {/* Main Controls */}
          <div className="flex items-center gap-4 mb-3">
            {/* Play Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => skipTime(-10)}
                title="Lùi 10 giây"
              >
                <div className="flex flex-col items-center justify-center">
                  <SkipBack className="h-4 w-4" />
                  <span className="text-[9px]">10s</span>
                </div>
              </Button>

              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                onClick={togglePlay}
              >
                {settings.isPlaying ? (
                  <Pause className="h-5 w-5" fill="currentColor" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => skipTime(10)}
                title="Tua 10 giây"
              >
                <div className="flex flex-col items-center justify-center">
                  <SkipForward className="h-4 w-4" />
                  <span className="text-[9px]">10s</span>
                </div>
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 space-y-1">
              <Slider
                value={[settings.currentTime]}
                max={settings.duration || 100}
                step={1}
                className="w-full"
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, currentTime: value[0] }))
                }
              />
              <div
                className="flex justify-between text-xs font-mono"
                style={{ color: isDarkTheme ? "#d8cfc0" : "#666" }}
              >
                <span>{formatTime(settings.currentTime)}</span>
                <span>{formatTime(settings.duration)}</span>
              </div>
            </div>

            {/* Volume & Settings */}
            <div className="hidden md:flex items-center gap-2 min-w-[140px]">
              <Volume2
                className="h-4 w-4 flex-shrink-0"
                style={{ color: isDarkTheme ? "#f0ead6" : "#666" }}
              />
              <Slider
                value={[settings.volume]}
                max={100}
                step={1}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, volume: value[0] }))
                }
                className="w-24"
              />
              <span
                className="text-xs w-8 text-right"
                style={{ color: isDarkTheme ? "#d8cfc0" : "#666" }}
              >
                {settings.volume}%
              </span>
            </div>
          </div>

          {/* Extended Controls */}
          {isExpanded && (
            <div
              className="space-y-3 pt-3 border-t"
              style={{
                borderColor: isDarkTheme
                  ? "rgba(240,234,214,0.2)"
                  : "rgba(0,0,0,0.1)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: isDarkTheme ? "#f0ead6" : "#1a1a1a" }}
                  >
                    🎙️ AI Voice
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: isDarkTheme ? "#d8cfc0" : "#666" }}
                  >
                    {chapterTitle}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Speed */}
                <div className="space-y-1">
                  <label
                    className="text-xs"
                    style={{ color: isDarkTheme ? "#d8cfc0" : "#666" }}
                  >
                    Tốc độ đọc
                  </label>
                  <Select
                    value={settings.speed.toString()}
                    onValueChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        speed: parseFloat(value),
                      }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {speedOptions.map((speed) => (
                        <SelectItem key={speed} value={speed.toString()}>
                          {speed}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice */}
                <div className="space-y-1">
                  <label
                    className="text-xs"
                    style={{ color: isDarkTheme ? "#d8cfc0" : "#666" }}
                  >
                    Giọng đọc
                  </label>
                  <Select
                    value={settings.voice}
                    onValueChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        voice: value as VoiceSettings["voice"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(voiceNames).map(([key, name]) => (
                        <SelectItem key={key} value={key}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mobile Volume */}
                <div className="md:hidden col-span-2 space-y-1">
                  <label
                    className="text-xs"
                    style={{ color: isDarkTheme ? "#d8cfc0" : "#666" }}
                  >
                    Âm lượng
                  </label>
                  <div className="flex items-center gap-2">
                    <Volume2
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: isDarkTheme ? "#f0ead6" : "#666" }}
                    />
                    <Slider
                      value={[settings.volume]}
                      max={100}
                      step={1}
                      onValueChange={(value) =>
                        setSettings((prev) => ({ ...prev, volume: value[0] }))
                      }
                      className="flex-1"
                    />
                    <span
                      className="text-xs w-10 text-right"
                      style={{ color: isDarkTheme ? "#d8cfc0" : "#666" }}
                    >
                      {settings.volume}%
                    </span>
                  </div>
                </div>
              </div>

              <p
                className="text-xs text-center italic"
                style={{ color: isDarkTheme ? "#d8cfc0" : "#666" }}
              >
                Công nghệ AI đọc tự nhiên, nhận diện cảm xúc và điều chỉnh ngữ
                điệu
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
