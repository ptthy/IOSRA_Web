import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Play, Pause, Volume2, ChevronDown } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface VoicePlayerCompactProps {
  chapterTitle: string;
  isDarkTheme?: boolean;
  isTransparent?: boolean;
}

export function VoicePlayerCompact({
  chapterTitle,
  isDarkTheme = false,
  isTransparent = false,
}: VoicePlayerCompactProps) {
  const [settings, setSettings] = useState<VoiceSettings>(getVoiceSettings());
  const [showVolume, setShowVolume] = useState(false);

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

  // Dynamic colors based on theme
  const getColors = () => {
    if (isDarkTheme) {
      return {
        bg: "rgba(0, 52, 84, 0.95)",
        border: "rgba(240, 234, 214, 0.2)",
        text: "#f0ead6",
        textSecondary: "#d8cfc0",
        hover: "rgba(240, 234, 214, 0.1)",
      };
    } else if (isTransparent) {
      return {
        bg: "rgba(255, 255, 255, 0.95)",
        border: "rgba(0, 65, 106, 0.15)",
        text: "#00416a",
        textSecondary: "#666666",
        hover: "rgba(0, 65, 106, 0.05)",
      };
    } else {
      return {
        bg: "rgba(255, 255, 255, 0.98)",
        border: "rgba(0, 0, 0, 0.1)",
        text: "#1a1a1a",
        textSecondary: "#666666",
        hover: "rgba(0, 0, 0, 0.05)",
      };
    }
  };

  const colors = getColors();

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border-2"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        backdropFilter: "blur(20px)",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 py-3.5">
        <div className="flex items-center gap-3">
          {/* AI Voice Label */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0 min-w-[140px]">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colors.hover}` }}
            >
              <span className="text-lg">🎙️</span>
            </div>
            <div className="flex flex-col">
              <span
                className="text-xs font-semibold"
                style={{ color: colors.text }}
              >
                AI Voice
              </span>
              <span
                className="text-[10px]"
                style={{ color: colors.textSecondary }}
              >
                Đang phát
              </span>
            </div>
          </div>

          {/* Skip -10s */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => skipTime(-10)}
            className="h-8 px-2 hover:bg-opacity-10"
            style={{ color: colors.text }}
          >
            <span className="text-xs">-10s</span>
          </Button>

          {/* Play/Pause */}
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg flex-shrink-0"
            onClick={togglePlay}
          >
            {settings.isPlaying ? (
              <Pause className="h-4 w-4" fill="currentColor" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
            )}
          </Button>

          {/* Skip +10s */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => skipTime(10)}
            className="h-8 px-2 hover:bg-opacity-10"
            style={{ color: colors.text }}
          >
            <span className="text-xs">+10s</span>
          </Button>

          {/* Time */}
          <span
            className="text-xs font-mono flex-shrink-0"
            style={{ color: colors.textSecondary }}
          >
            {formatTime(settings.currentTime)}
          </span>

          {/* Progress Bar */}
          <div className="flex-1 min-w-[100px]">
            <Slider
              value={[settings.currentTime]}
              max={settings.duration || 100}
              step={1}
              className="w-full"
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, currentTime: value[0] }))
              }
            />
          </div>

          {/* Duration */}
          <span
            className="text-xs font-mono flex-shrink-0"
            style={{ color: colors.textSecondary }}
          >
            {formatTime(settings.duration)}
          </span>

          {/* Speed */}
          <Select
            value={settings.speed.toString()}
            onValueChange={(value) =>
              setSettings((prev) => ({ ...prev, speed: parseFloat(value) }))
            }
          >
            <SelectTrigger className="w-[70px] h-8 text-xs">
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

          {/* Voice */}
          <Select
            value={settings.voice}
            onValueChange={(value) =>
              setSettings((prev) => ({
                ...prev,
                voice: value as VoiceSettings["voice"],
              }))
            }
          >
            <SelectTrigger className="w-[95px] h-8 text-xs">
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

          {/* Volume */}
          <Popover open={showVolume} onOpenChange={setShowVolume}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                style={{ color: colors.text }}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              className="w-[200px] p-3"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-medium"
                    style={{ color: colors.text }}
                  >
                    Âm lượng
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {settings.volume}%
                  </span>
                </div>
                <Slider
                  value={[settings.volume]}
                  max={100}
                  step={1}
                  onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, volume: value[0] }))
                  }
                  className="w-full"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
