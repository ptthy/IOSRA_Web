import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import {
  Play,
  Pause,
  Volume2,
  Highlighter,
  Settings,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Headphones,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import {
  VoiceSettings,
  voiceNames,
  speedOptions,
  getVoiceSettings,
  saveVoiceSettings,
  getHighlights,
} from "../../lib/readerSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface ReaderToolbarProps {
  chapterNo: number;
  chapterTitle: string;
  chapterId: string;
  storyId: string;
  chapters?: Array<{
    chapterId: string;
    chapterNo: number;
    title: string;
    isLocked: boolean;
  }>;
  isDarkTheme?: boolean;
  isTransparent?: boolean;
  onBack: () => void;
  onSettings: () => void;
  onChapterChange?: (chapterId: string) => void;
}

export function ReaderToolbar({
  chapterNo,
  chapterTitle,
  chapterId,
  storyId,
  chapters = [],
  isDarkTheme = false,
  isTransparent = false,
  onBack,
  onSettings,
  onChapterChange,
}: ReaderToolbarProps) {
  const [settings, setSettings] = useState<VoiceSettings>(getVoiceSettings());
  const [showVolume, setShowVolume] = useState(false);
  const [highlightCount, setHighlightCount] = useState(0);
  // Fake song data (title + artist)
  // Updated music list data from image
  const audioSources = [
    {
      id: "song_1",
      title: "Waterfall",
      artist: "William King",
      locked: false,
      number: 2,
    },
    {
      id: "song_2",
      title: "The Cradle Of Your Soul",
      artist: "Max Zansta",
      locked: false,
      number: 3,
    },
    {
      id: "song_3",
      title: "Science Documentary",
      artist: "RomanBelov",
      locked: false,
      number: 4,
    },
    {
      id: "song_4",
      title: "Sad Soul Chasing A Feeling",
      artist: "AlexGrohl",
      locked: false,
      number: 5,
    },
    {
      id: "song_5",
      title: "Price Of Freedom",
      artist: "Unknown Artist",
      locked: false,
      number: 6,
    },
    {
      id: "song_6",
      title: "Piano Moment",
      artist: "Tomomi Kato",
      locked: false,
      number: 7,
    },
  ];
  const [selectedAudio, setSelectedAudio] = useState<string>(
    audioSources[0].id
  );

  useEffect(() => {
    saveVoiceSettings(settings);
  }, [settings]);

  useEffect(() => {
    setHighlightCount(getHighlights(chapterId).length);
  }, [chapterId]);

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

  const getColors = () => {
    if (isDarkTheme) {
      return {
        bg: "#003454",
        border: "rgba(240, 234, 214, 0.15)",
        text: "#f0ead6",
        textSecondary: "rgba(240, 234, 214, 0.6)",
        hover: "rgba(240, 234, 214, 0.08)",
        accent: "#f0ead6",
      };
    } else if (isTransparent) {
      return {
        bg: "rgba(255, 255, 255, 0.95)",
        border: "rgba(0, 65, 106, 0.1)",
        text: "#00416a",
        textSecondary: "rgba(0, 65, 106, 0.5)",
        hover: "rgba(0, 65, 106, 0.05)",
        accent: "#00416a",
      };
    } else {
      return {
        bg: "#ffffff",
        border: "rgba(0, 0, 0, 0.08)",
        text: "#1a1a1a",
        textSecondary: "rgba(0, 0, 0, 0.5)",
        hover: "rgba(0, 0, 0, 0.04)",
        accent: "#00416a",
      };
    }
  };

  const colors = getColors();

  return (
    <div
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: colors.bg,
        backdropFilter: "blur(20px)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Left: Back + Chapter Info */}
          <div className="flex items-center gap-3 flex-5 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-9 w-9 rounded-lg transition-colors shrink-0"
              style={{
                color: colors.text,
                backgroundColor: "transparent",
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden md:flex items-center gap-2 min-w-0 h-9 px-3 rounded-lg hover:scale-[1.02] transition-all"
                  style={{
                    color: colors.text,
                    backgroundColor: `${colors.hover}80`,
                  }}
                >
                  <BookOpen
                    className="h-4 w-4 shrink-0"
                    style={{ color: colors.accent, opacity: 0.6 }}
                  />
                  <div className="min-w-0 flex items-baseline gap-2">
                    <span
                      className="text-xs font-medium truncate"
                      style={{ color: colors.textSecondary }}
                    >
                      Chương {chapterNo}
                    </span>
                    <span
                      className="text-xs truncate"
                      style={{ color: colors.textSecondary }}
                    >
                      •
                    </span>
                    <span
                      className="text-sm font-medium truncate max-w-[200px]"
                      style={{ color: colors.text }}
                    >
                      {chapterTitle}
                    </span>
                  </div>
                  <ChevronDown
                    className="h-3 w-3 flex-shrink-0"
                    style={{ color: colors.textSecondary }}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[400px]"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                <div
                  className="px-3 py-2 border-b"
                  style={{ borderColor: colors.border }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: colors.text }}
                  >
                    Danh sách chương
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {chapters.length} chương
                  </p>
                </div>
                <ScrollArea className="h-[400px]">
                  {chapters.map((chapter) => (
                    <DropdownMenuItem
                      key={chapter.chapterId}
                      className="px-3 py-2.5 cursor-pointer transition-colors"
                      style={{
                        backgroundColor:
                          chapter.chapterId === chapterId
                            ? `${colors.accent}15`
                            : "transparent",
                      }}
                      onClick={() => {
                        if (onChapterChange && !chapter.isLocked) {
                          onChapterChange(chapter.chapterId);
                        }
                      }}
                      disabled={chapter.isLocked}
                    >
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex items-baseline gap-2 min-w-0 flex-1">
                          <span
                            className="text-xs font-medium flex-shrink-0"
                            style={{
                              color:
                                chapter.chapterId === chapterId
                                  ? colors.accent
                                  : colors.textSecondary,
                            }}
                          >
                            {chapter.chapterNo}
                          </span>
                          <span
                            className="text-sm truncate"
                            style={{
                              color: chapter.isLocked
                                ? colors.textSecondary
                                : colors.text,
                              opacity: chapter.isLocked ? 0.5 : 1,
                            }}
                          >
                            {chapter.title}
                          </span>
                        </div>
                        {chapter.isLocked && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 flex-shrink-0">
                            Khóa
                          </span>
                        )}
                        {chapter.chapterId === chapterId && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: `${colors.accent}20`,
                              color: colors.accent,
                            }}
                          >
                            Đang đọc
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center: Voice Controls - Redesigned Layout */}
          <div className="flex items-center gap-4 flex-1 justify-center">
            {/* Skip Buttons - Moved to left of Play/Pause */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(-10)}
                className="h-8 px-3 rounded-md text-sm font-medium transition-all hover:scale-105"
                style={{
                  color: colors.text,
                  backgroundColor: `${colors.hover}60`,
                }}
              >
                -10s
              </Button>

              {/* Play/Pause - Central */}
              <Button
                size="icon"
                className="h-10 w-10 rounded-full shadow-md transition-all hover:scale-105 mx-2"
                style={{
                  backgroundColor: colors.accent,
                  color: isDarkTheme ? "#003454" : "#ffffff",
                }}
                onClick={togglePlay}
              >
                {settings.isPlaying ? (
                  <Pause className="h-4 w-4" fill="currentColor" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(10)}
                className="h-8 px-3 rounded-md text-sm font-medium transition-all hover:scale-105"
                style={{
                  color: colors.text,
                  backgroundColor: `${colors.hover}60`,
                }}
              >
                +10s
              </Button>
            </div>

            {/* Progress Bar - Improved spacing */}
            <div className="hidden lg:flex items-center gap-3 w-[200px]">
              <span
                className="text-sm font-mono tabular-nums min-w-[45px]"
                style={{ color: colors.textSecondary }}
              >
                {formatTime(settings.currentTime)}
              </span>
              <Slider
                value={[settings.currentTime]}
                max={settings.duration || 100}
                step={1}
                className="flex-1"
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, currentTime: value[0] }))
                }
              />
              <span
                className="text-sm font-mono tabular-nums min-w-[45px]"
                style={{ color: colors.textSecondary }}
              >
                {formatTime(settings.duration)}
              </span>
            </div>

            {/* Voice Settings - Improved spacing */}
            <div className="hidden md:flex items-center gap-2">
              <Select
                value={settings.speed.toString()}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, speed: parseFloat(value) }))
                }
              >
                <SelectTrigger
                  className="w-[70px] h-8 text-sm border rounded-lg"
                  style={{
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
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

              {/* Fixed width for voice selector */}
              <Select
                value={settings.voice}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    voice: value as VoiceSettings["voice"],
                  }))
                }
              >
                <SelectTrigger
                  className="w-[130px] h-8 text-sm border rounded-lg"
                  style={{
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
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

            {/* Volume - Moved to center section */}
            <Popover open={showVolume} onOpenChange={setShowVolume}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg transition-all hover:scale-105"
                  style={{ color: colors.text }}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                className="w-[200px] p-4"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.text }}
                    >
                      Âm lượng
                    </span>
                    <span
                      className="text-sm font-mono"
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
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right: Audio + Highlights + Settings */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Audio Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg transition-all hover:scale-105"
                  style={{ color: colors.text }}
                >
                  <Headphones className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[320px]"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                <div
                  className="px-3 py-2 border-b"
                  style={{ borderColor: colors.border }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: colors.text }}
                  >
                    Danh sách bài hát
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {audioSources.length} bài
                  </p>
                </div>
                <ScrollArea className="h-[300px]">
                  {audioSources.map((src) => {
                    const active = src.id === selectedAudio;
                    return (
                      <DropdownMenuItem
                        key={src.id}
                        className="px-3 py-2.5 cursor-pointer transition-colors"
                        style={{
                          backgroundColor: active
                            ? `${colors.accent}15`
                            : "transparent",
                          opacity: src.locked ? 0.6 : 1,
                        }}
                        disabled={src.locked}
                        // Prevent dropdown from closing on select
                        onSelect={(e) => {
                          e.preventDefault();
                          if (!src.locked) setSelectedAudio(src.id);
                        }}
                      >
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-baseline gap-2 min-w-0 flex-1">
                            <span
                              className="text-xs font-medium shrink-0"
                              style={{
                                color: active
                                  ? colors.accent
                                  : colors.textSecondary,
                              }}
                            >
                              {src.number}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-sm font-medium truncate"
                                style={{ color: colors.text }}
                              >
                                {src.title}
                              </div>
                              <div
                                className="text-xs truncate"
                                style={{ color: colors.textSecondary }}
                              >
                                {src.artist}
                              </div>
                            </div>
                          </div>
                          {active && (
                            <Play
                              className="h-3 w-3 flex-shrink-0"
                              style={{ color: colors.accent }}
                            />
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg relative transition-all hover:scale-105"
              style={{ color: colors.text }}
            >
              <Highlighter className="h-4 w-4" />
              {highlightCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{
                    backgroundColor: colors.accent,
                    color: isDarkTheme ? "#003454" : "#ffffff",
                  }}
                >
                  {highlightCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onSettings}
              className="h-8 w-8 rounded-lg transition-all hover:scale-105"
              style={{ color: colors.text }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Progress Bar - Show on smaller screens */}
        <div className="lg:hidden flex items-center gap-3 mt-3">
          <span
            className="text-xs font-mono tabular-nums min-w-[40px]"
            style={{ color: colors.textSecondary }}
          >
            {formatTime(settings.currentTime)}
          </span>
          <Slider
            value={[settings.currentTime]}
            max={settings.duration || 100}
            step={1}
            className="flex-1"
            onValueChange={(value) =>
              setSettings((prev) => ({ ...prev, currentTime: value[0] }))
            }
          />
          <span
            className="text-xs font-mono tabular-nums min-w-[40px]"
            style={{ color: colors.textSecondary }}
          >
            {formatTime(settings.duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
