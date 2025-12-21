"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Settings,
  ChevronDown,
  Lock,
  Check,
  ShoppingCart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  Gem,
  Music, // Thêm icon nhạc
  Music2,
  Crown,
  Unlock,
  Flag,
} from "lucide-react";
import { ReportModal } from "@/components/report/ReportModal";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChapterSummary,
  chapterCatalogApi,
  ChapterVoice,
} from "@/services/chapterCatalogService";
import { cn } from "@/lib/utils";
import {
  VoiceSettings,
  getVoiceSettings,
  saveVoiceSettings,
  voiceNames,
  speedOptions,
} from "@/lib/readerSettings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chapterPurchaseApi } from "@/services/chapterPurchaseService";
import { toast } from "sonner";
import { TopUpModal } from "@/components/payment/TopUpModal";
const AUDIO_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev/";
const languageNames: Record<string, string> = {
  "vi-VN": "Tiếng Việt",
  "ja-JP": "日本語 (Tiếng Nhật)",
  "en-US": "English (Tiếng Anh)",
  "zh-CN": "中文 (Tiếng Trung)",
};
interface ReaderToolbarProps {
  chapterNo: number;
  chapterTitle: string;
  chapterId: string;
  storyId: string;
  chapters: ChapterSummary[];
  isDarkTheme?: boolean;
  isTransparent?: boolean;
  onBack: () => void;
  onSettings: () => void;
  onChapterChange: (chapterId: string) => void;
  children?: React.ReactNode;
  autoPlayAfterUnlock?: boolean; //  PROP MỚI: Tự động phát sau khi mở khóa
  setShowTopUpModal: (show: boolean) => void;
  mood?: { code: string; name: string };
  moodMusicPaths?: { title: string; storagePath: string }[];
  hasActiveSubscription?: boolean;
  languageCode?: string;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  chapterNo,
  chapterTitle,
  chapterId,
  storyId,
  chapters,
  isDarkTheme,
  isTransparent,
  onBack,
  onSettings,
  onChapterChange,
  children,
  autoPlayAfterUnlock = false, //  Mặc định là false
  setShowTopUpModal,
  mood,
  moodMusicPaths = [],
  hasActiveSubscription = false,
  languageCode,
}) => {
  const [openChapterList, setOpenChapterList] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(
    getVoiceSettings()
  );
  const [showVolume, setShowVolume] = useState(false);

  const [voices, setVoices] = useState<ChapterVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<ChapterVoice | null>(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  const [voiceToBuy, setVoiceToBuy] = useState<ChapterVoice | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [activeMusicPath, setActiveMusicPath] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(30);
  const [showMusicVolume, setShowMusicVolume] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  // const getFullAudioUrl = (path: string | undefined | null) => {
  //   if (!path) return "";
  //   if (path.startsWith("http")) return path;
  //   const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  //   return `${AUDIO_BASE_URL}${cleanPath}`;
  // };
  const getFullAudioUrl = (path: any) => {
    // Kiểm tra nếu path không phải string hoặc rỗng thì thoát sớm
    if (typeof path !== "string" || !path) return "";

    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${AUDIO_BASE_URL}${cleanPath}`;
  };

  const fetchVoices = async () => {
    setIsLoadingVoice(true);
    try {
      const data = await chapterCatalogApi.getChapterVoices(chapterId);

      // SỬA TẠI ĐÂY: Ưu tiên hiện voice đã sở hữu (owned)
      const visibleVoices = data.filter((v) => {
        if (v.owned) return true; // Nếu là tác giả hoặc đã mua -> Luôn hiện
        return true; // Voice chưa mua cũng hiện để bán
      });

      setVoices(visibleVoices);

      // Logic autoplay giữ nguyên
      if (autoPlayAfterUnlock && visibleVoices.length > 0) {
        const firstOwnedVoice = visibleVoices.find((v) => v.owned);
        if (firstOwnedVoice) {
          setCurrentVoice(firstOwnedVoice);
          setVoiceSettings((prev) => ({ ...prev, isPlaying: true }));
        }
      } else if (!currentVoice) {
        const owned = visibleVoices.find((v) => v.owned);
        if (owned) setCurrentVoice(owned);
      }
    } catch (error) {
      console.error("Lỗi tải giọng:", error);
    } finally {
      setIsLoadingVoice(false);
    }
  };

  useEffect(() => {
    if (chapterId) fetchVoices();
    setVoiceSettings((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setCurrentVoice(null);
  }, [chapterId]);

  //  EFFECT: Xử lý auto play sau khi mở khóa chapter
  useEffect(() => {
    if (autoPlayAfterUnlock && chapterId) {
      console.log("🎯 AUTO PLAY TRIGGERED, reloading voices...");
      fetchVoices(); // Reload voices để có dữ liệu mới nhất
    }
  }, [autoPlayAfterUnlock, chapterId]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setVoiceSettings((prev) => ({ ...prev, isPlaying: false }));
    setAudioCurrentTime(0);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (voiceSettings.isPlaying && currentVoice?.audioUrl) {
        audio.play().catch((e) => {
          console.error("Play error:", e);
          setVoiceSettings((prev) => ({ ...prev, isPlaying: false }));
        });
      } else {
        audio.pause();
      }
    }
  }, [voiceSettings.isPlaying, currentVoice]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = voiceSettings.volume / 100;
    }
  }, [voiceSettings.volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = voiceSettings.speed;
    }
  }, [voiceSettings.speed]);

  const togglePlay = () => {
    if (!currentVoice) {
      toast.info("Vui lòng mua hoặc chọn giọng đọc trước.");
      return;
    }
    setVoiceSettings((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setAudioCurrentTime(value[0]);
    }
  };

  const onVoiceSelect = (voiceId: string) => {
    const selectedVoice = voices.find((v) => v.voiceId === voiceId);
    if (!selectedVoice) return;

    if (selectedVoice.owned) {
      // ✅ Đã sở hữu -> Chọn và PHÁT LUÔN
      setCurrentVoice(selectedVoice);
      setVoiceSettings((prev) => ({ ...prev, isPlaying: true }));
    } else {
      // ❌ Chưa sở hữu -> Mở Dialog xác nhận mua
      setVoiceToBuy(selectedVoice);
    }
  };

  const confirmBuyVoice = async () => {
    if (!voiceToBuy) return;

    setIsBuying(true);
    try {
      await chapterPurchaseApi.buyVoice(chapterId, [voiceToBuy.voiceId]);

      toast.success(`Đã mua giọng ${voiceToBuy.voiceName}`, {
        description: (
          <span className="flex items-center gap-1">
            Đã trừ {voiceToBuy.priceDias}
            <Gem className="h-4 w-4 text-blue-500 fill-blue-500 opacity-80" />
            trong ví.
          </span>
        ),
      });

      await refreshAndPlay(voiceToBuy.voiceId);
    } catch (error: any) {
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = error.response?.data?.error?.message;

      //  XỬ LÝ CÁC LOẠI LỖI
      switch (true) {
        case error.response?.status === 409:
          toast.success("Bạn đã sở hữu giọng đọc này!", {
            description: "Đang cập nhật lại trạng thái...",
            icon: <Check className="w-4 h-4 text-green-500" />,
          });
          await refreshAndPlay(voiceToBuy.voiceId);
          break;

        case error.response?.status === 400 &&
          errorCode === "InsufficientBalance":
          toast.error("Số dư không đủ", {
            description: (
              <span className="flex items-center gap-1 flex-wrap">
                Bạn cần thêm {voiceToBuy?.priceDias}
                <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                để mua giọng đọc này.
              </span>
            ),
            action: {
              label: (
                <span className="flex items-center gap-1">
                  Nạp <Gem className="h-3 w-3 fill-white" />
                </span>
              ),
              onClick: () => setShowTopUpModal(true),
            },
          });
          break;

        case error.response?.status === 400:
          toast.error("Giao dịch thất bại", {
            description: errorMessage || "Yêu cầu không hợp lệ.",
          });
          break;

        default:
          const msg =
            errorMessage ||
            error.response?.data?.message ||
            "Không thể mua giọng đọc này.";
          toast.error("Giao dịch thất bại", { description: msg });
      }
    } finally {
      setIsBuying(false);
      setVoiceToBuy(null);
    }
  };

  const refreshAndPlay = async (targetVoiceId: string) => {
    try {
      const data = await chapterCatalogApi.getChapterVoices(chapterId);

      // SỬA TẠI ĐÂY: Xóa bỏ điều kiện v.status === "ready"
      const visibleVoices = data.filter((v) => {
        return true; // Hiện tất cả để đảm bảo không bị mất voice vừa mua
      });

      setVoices(visibleVoices);

      const newOwned = visibleVoices.find((v) => v.voiceId === targetVoiceId);
      if (newOwned && newOwned.owned) {
        setCurrentVoice(newOwned);
        setVoiceSettings((prev) => ({ ...prev, isPlaying: true }));
      }
    } catch (e) {
      console.error("Reload error", e);
    }
  };
  // 1. Reset khi đổi chương
  useEffect(() => {
    setIsMusicPlaying(false);
    if (moodMusicPaths && moodMusicPaths.length > 0) {
      // Mặc định chọn storagePath của bài đầu tiên
      setActiveMusicPath(moodMusicPaths[0].storagePath);
    } else {
      setActiveMusicPath(null);
    }
  }, [chapterId, moodMusicPaths]);

  // 2. Điều khiển Audio Element
  useEffect(() => {
    const bgAudio = bgMusicRef.current;
    if (bgAudio) {
      bgAudio.volume = musicVolume / 100;
      if (isMusicPlaying && activeMusicPath) {
        bgAudio.play().catch((e) => {
          console.error("Music Play Error:", e);
          setIsMusicPlaying(false);
        });
      } else {
        bgAudio.pause();
      }
    }
  }, [isMusicPlaying, activeMusicPath, musicVolume]);

  const handleMusicSelect = (path: string) => {
    // 1. Xử lý tắt nhạc
    if (path === "turn_off") {
      setActiveMusicPath(null);
      setIsMusicPlaying(false);
      toast.info("Đã tắt nhạc nền");
      return;
    }

    // 2. Chặn và hiện thông báo yêu cầu mua gói Premium
    if (!hasActiveSubscription) {
      toast.error("Tính năng Hội viên", {
        description: "Để nghe nhạc bạn phải mua gói Premium.",
        icon: <Crown className="w-4 h-4 text-orange-500" />,
        action: {
          label: (
            <span className="flex items-center gap-1">
              Nâng cấp <Crown className="h-3 w-3 fill-white" />
            </span>
          ),
          onClick: () => setShowTopUpModal(true), // Mở popup nạp tiền/mua gói
        },
      });
      setIsMusicPlaying(false);
      return;
    }

    // 3. Phát nhạc thành công cho Hội viên (VIP)
    setActiveMusicPath(path);
    setIsMusicPlaying(true);

    toast.success("Đang phát nhạc nền Premium", {
      icon: <Music2 className="w-4 h-4 text-pink-500" />,
    });
  };
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const sortedChapters = [...chapters].sort(
    (a, b) => a.chapterNo - b.chapterNo
  );

  const themeClasses = {
    bg: isTransparent
      ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-white/20"
      : isDarkTheme
      ? "bg-[#0f172a] border-b border-slate-800"
      : "bg-white border-b border-gray-200 shadow-sm",
    text: isDarkTheme ? "text-slate-100" : "text-slate-800",
    textMuted: isDarkTheme ? "text-slate-400" : "text-slate-500",
    hover: isDarkTheme ? "hover:bg-slate-800" : "hover:bg-slate-100",
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 transition-all duration-300 gap-4",
          themeClasses.bg
        )}
      >
        {currentVoice?.audioUrl && (
          <audio
            ref={audioRef}
            src={getFullAudioUrl(currentVoice.audioUrl)}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={(e) => console.error("Audio Load Error:", e)}
          />
        )}
        {activeMusicPath && (
          <audio
            ref={bgMusicRef}
            src={getFullAudioUrl(activeMusicPath)}
            loop={true}
            preload="auto"
          />
        )}

        <div className="flex items-center gap-2 w-1/4 min-w-[200px] shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className={cn(
              "h-10 w-10 shrink-0 rounded-full",
              themeClasses.hover,
              themeClasses.text
            )}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex flex-col min-w-0 overflow-hidden">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                themeClasses.textMuted
              )}
            >
              Chương {chapterNo}
            </span>

            <Popover open={openChapterList} onOpenChange={setOpenChapterList}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  className={cn(
                    "p-0 h-auto font-bold text-sm md:text-base justify-start hover:bg-transparent w-full truncate",
                    themeClasses.text
                  )}
                >
                  <span className="truncate">{chapterTitle}</span>
                  <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[360px] sm:w-[500px] p-0"
                align="start"
              >
                <div className="p-3 border-b bg-muted/20">
                  <h4 className="font-semibold text-sm">Danh sách chương</h4>
                  <p className="text-xs text-muted-foreground">
                    Chọn chương để đọc
                  </p>
                </div>

                <ScrollArea className="h-[300px] overflow-y-auto">
                  {sortedChapters.map((ch) => {
                    const isReading = ch.chapterId === chapterId;
                    // const isLocked = ch.isLocked;
                    // const showOwnedBadge = ch.isOwned === true;
                    // //  FIX LOGIC: Đã mua = Không bị khóa VÀ accessType là 'dias'
                    // const isPurchased = !isLocked && ch.accessType === "dias";
                    // const isOwnedState = ch.isOwned === true || isPurchased;
                    // const isFree = ch.accessType === "free";
                    // Dựa vào JSON: isLocked vẫn là true dù đã mua, nên phải check isOwned trước
                    const isOwned = ch.isOwned === true;
                    const isLocked = ch.isLocked && !isOwned; // Chỉ coi là locked nếu chưa owned
                    const isFree = ch.accessType === "free";

                    return (
                      <div
                        key={ch.chapterId}
                        onClick={() => {
                          onChapterChange(ch.chapterId);
                          setOpenChapterList(false);
                        }}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center px-4 py-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground border-b border-border/40 last:border-0",
                          isReading && "bg-blue-50 dark:bg-blue-900/20"
                        )}
                      >
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex flex-col overflow-hidden flex-1">
                            <span
                              className={cn(
                                "truncate font-medium flex items-center gap-2",
                                isReading
                                  ? "text-blue-600"
                                  : isLocked
                                  ? "text-gray-900 font-bold"
                                  : ""
                              )}
                            >
                              {/* Logic icon bên cạnh tên chương */}
                              {isLocked && (
                                <Lock className="w-3 h-3 text-orange-500" />
                              )}
                              {isOwned && (
                                <Check className="w-3 h-3 text-green-500" />
                              )}
                              Chương {ch.chapterNo}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {ch.title}
                            </span>
                          </div>

                          <div className="shrink-0">
                            {isReading ? (
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                              >
                                Đang đọc
                              </Badge>
                            ) : isOwned ? (
                              // Case 1: Đã sở hữu -> Hiện badge Crown "Đã mở"
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 hover:bg-green-200 gap-1"
                              >
                                <Unlock className="w-3 h-3" /> Đã mở
                              </Badge>
                            ) : isLocked ? (
                              // Case 2: Bị khóa (chưa mua) -> Hiện giá
                              <Badge
                                variant="outline"
                                className="border-orange-500 text-orange-600 bg-orange-50 font-bold flex items-center gap-1"
                              >
                                {ch.priceDias}
                                <Gem className="h-4 w-4 text-blue-500 fill-blue-500 opacity-80" />
                              </Badge>
                            ) : (
                              // Case 3: Free
                              <span className="text-xs text-muted-foreground/70">
                                Free
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2 md:gap-6 px-2 w-full max-w-5xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skipTime(-10)}
            className={cn(
              "hidden sm:flex h-8 w-8 text-xs shrink-0",
              themeClasses.textMuted,
              themeClasses.hover
            )}
            title="Lùi 10s"
          >
            -10s
          </Button>

          <Button
            size="icon"
            className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0 transition-transform hover:scale-105"
            onClick={togglePlay}
            disabled={!currentVoice}
          >
            {voiceSettings.isPlaying ? (
              <Pause className="h-5 w-5 md:h-6 md:w-6 fill-current" />
            ) : (
              <Play className="h-5 w-5 md:h-6 md:w-6 fill-current ml-1" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => skipTime(10)}
            className={cn(
              "hidden sm:flex h-8 w-8 text-xs shrink-0",
              themeClasses.textMuted,
              themeClasses.hover
            )}
            title="Tua 10s"
          >
            +10s
          </Button>

          <div className="flex flex-1 items-center gap-3 min-w-[100px]">
            <span
              className={cn(
                "text-xs font-mono w-10 text-right hidden md:block",
                themeClasses.textMuted
              )}
            >
              {formatTime(audioCurrentTime)}
            </span>
            <Slider
              value={[audioCurrentTime]}
              max={audioDuration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1 cursor-pointer py-2"
            />
            <span
              className={cn(
                "text-xs font-mono w-10 hidden md:block",
                themeClasses.textMuted
              )}
            >
              {formatTime(audioDuration)}
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-2 shrink-0">
            <Select
              value={voiceSettings.speed.toString()}
              onValueChange={(val) =>
                setVoiceSettings((p) => ({ ...p, speed: parseFloat(val) }))
              }
            >
              <SelectTrigger className="h-8 w-[65px] text-xs bg-transparent border-0 hover:bg-black/5 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {speedOptions.map((s) => (
                  <SelectItem key={s} value={s.toString()}>
                    {s}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currentVoice?.voiceId || ""}
              onValueChange={onVoiceSelect}
              // Nếu không có voice nào, disable select luôn hoặc để mở ra xem thông báo
              disabled={isLoadingVoice}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs bg-black/5 dark:bg-white/10 border-0 rounded-full px-3 truncate">
                <SelectValue
                  //  CẬP NHẬT 1: Thay đổi placeholder dựa trên trạng thái dữ liệu
                  placeholder={
                    isLoadingVoice
                      ? "Đang tải..."
                      : voices.length === 0
                      ? "Không có audio"
                      : "Chọn giọng"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {isLoadingVoice ? (
                  <div className="p-2 text-xs text-center">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  </div>
                ) : voices.length === 0 ? (
                  //  CẬP NHẬT 2: Hiển thị thông báo khi mảng rỗng
                  <div className="p-4 text-xs text-center text-muted-foreground flex flex-col items-center gap-2">
                    <VolumeX className="w-6 h-6 opacity-50" />
                    <span>
                      Tác giả chưa tạo voice
                      <br />
                      cho chương này
                    </span>
                  </div>
                ) : (
                  voices.map((v) => (
                    <SelectItem key={v.voiceId} value={v.voiceId}>
                      <div className="flex items-center justify-between w-full min-w-[140px] gap-2">
                        <span>{v.voiceName}</span>
                        {v.owned ? (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> <span>Sở hữu</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                            {v.priceDias}
                            <Gem className="h-3 w-3 fill-blue-500 text-blue-600" />
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="flex items-center">
              <Select
                value={activeMusicPath || ""}
                onValueChange={handleMusicSelect}
              >
                <SelectTrigger className="h-8 w-[140px] text-xs bg-black/5 dark:bg-white/10 border-0 rounded-full px-3 truncate">
                  <div className="flex items-center gap-2 truncate">
                    {isMusicPlaying ? (
                      <Music className="w-3 h-3 text-pink-500 animate-pulse" />
                    ) : (
                      <Music2 className="w-3 h-3 opacity-50" />
                    )}
                    <span className="truncate">
                      {activeMusicPath
                        ? moodMusicPaths.find(
                            (m) => m.storagePath === activeMusicPath
                          )?.title || "Đang phát..."
                        : mood?.name
                        ? `Nhạc: ${mood.name}`
                        : "Nhạc nền Premium"}
                    </span>
                  </div>
                </SelectTrigger>

                <SelectContent className="w-64 p-0 overflow-hidden">
                  {/* Tiêu đề Menu */}
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30 flex items-center justify-between border-b">
                    <div className="flex flex-col">
                      <span className="text-[10px] opacity-70 uppercase">
                        Nhạc nền Premium
                      </span>
                      <span className="text-blue-600 ">
                        Cảm xúc: {mood?.name || "Mặc định"}
                      </span>
                    </div>
                    <Crown className="w-3 h-3 text-orange-500" />
                  </div>

                  {!hasActiveSubscription ? (
                    /* --- TRƯỜNG HỢP 1: CHƯA CÓ PREMIUM (HIỆN THÔNG BÁO DỤ MUA) --- */
                    <div className="p-6 flex flex-col items-center text-center gap-3 bg-white dark:bg-slate-900">
                      {/* Icon Vương miện mờ mờ giống icon loa bên voice */}
                      <Crown className="w-12 h-12 text-orange-400 opacity-20" />

                      <div className="space-y-1">
                        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                          Tính năng Premium
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Bạn cần mua gói Premium để nghe nhạc
                          <br />
                          cho chương này
                        </p>
                      </div>

                      <Button
                        size="sm"
                        className="w-full h-9 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-full mt-2 font-bold shadow-md transition-all hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTopUpModal(true);
                          // THÊM DÒNG NÀY: Giả lập phím Escape để đóng cái Dropdown đang mở
                          document.dispatchEvent(
                            new KeyboardEvent("keydown", { key: "Escape" })
                          );
                        }}
                      >
                        <Crown className="w-3 h-3 mr-2 fill-current" />
                        Nâng cấp ngay
                      </Button>
                    </div>
                  ) : (
                    /* --- TRƯỜNG HỢP 2: ĐÃ CÓ PREMIUM (HIỆN DANH SÁCH NHẠC THẬT) --- */
                    <>
                      <div className="px-3 py-3 border-b space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase opacity-70">
                          <span>Âm lượng nhạc</span>
                          <span>{musicVolume}%</span>
                        </div>
                        <Slider
                          value={[musicVolume]}
                          max={100}
                          onValueChange={(val) => setMusicVolume(val[0])}
                        />
                      </div>

                      <SelectItem value="turn_off">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <VolumeX className="w-3 h-3" />
                          <span>Tắt nhạc</span>
                        </div>
                      </SelectItem>

                      {moodMusicPaths.length > 0 ? (
                        moodMusicPaths.map((music, index) => (
                          <SelectItem
                            key={music.storagePath}
                            value={music.storagePath}
                          >
                            <div className="flex items-center gap-2">
                              <Music2 className="w-3 h-3" />
                              {/* Hiển thị title thật từ API thay vì "Giai điệu + index" */}
                              <span>{music.title}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-xs text-center text-muted-foreground italic">
                          Đang cập nhật nhạc...
                        </div>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 w-fit shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReportModal(true)}
            className={cn(
              "h-9 w-9 text-destructive hover:bg-destructive/10", // Màu đỏ nhẹ cho nút báo cáo
              themeClasses.textMuted
            )}
            title="Báo cáo chương này"
          >
            <Flag className="h-5 w-5" />
          </Button>
          {/* Popover chỉnh âm lượng nhạc nền (Chỉ hiện khi đã là VIP và đang có nhạc) */}
          {activeMusicPath && hasActiveSubscription && (
            <Popover open={showMusicVolume} onOpenChange={setShowMusicVolume}>
              <PopoverTrigger asChild>
                <span className="sr-only">Chỉnh âm lượng nhạc</span>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="end" className="w-32 p-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Nhạc nền</span>
                    <span>{musicVolume}%</span>
                  </div>
                  <Slider
                    value={[musicVolume]}
                    max={100}
                    step={1}
                    onValueChange={(val) => setMusicVolume(val[0])}
                  />
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Popover open={showVolume} onOpenChange={setShowVolume}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "flex h-9 w-9",
                  themeClasses.textMuted,
                  themeClasses.hover
                )}
              >
                {voiceSettings.volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end" className="w-32 p-3">
              <Slider
                value={[voiceSettings.volume]}
                max={100}
                step={1}
                onValueChange={(val) =>
                  setVoiceSettings((p) => ({ ...p, volume: val[0] }))
                }
              />
            </PopoverContent>
          </Popover>

          {children}

          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            className={cn(
              "h-9 w-9",
              themeClasses.textMuted,
              themeClasses.hover
            )}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="chapter"
        targetId={chapterId}
        targetTitle={`Chương ${chapterNo}: ${chapterTitle}`}
      />
      <Dialog
        open={!!voiceToBuy}
        onOpenChange={(open) => !open && setVoiceToBuy(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Xác nhận mua giọng đọc
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1 flex-wrap">
              Bạn có muốn sử dụng
              <span className="font-bold flex items-center gap-1 text-blue-600">
                {voiceToBuy?.priceDias}
                <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
              </span>
              để mở khóa vĩnh viễn giọng đọc:
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg flex items-center gap-4 my-2 border border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{voiceToBuy?.voiceName}</h4>
              <p className="text-xs text-muted-foreground">
                {voiceToBuy?.voiceCode}
              </p>
            </div>
            <div className="ml-auto">
              <Badge
                variant="outline"
                className="border-orange-200 text-orange-600 bg-orange-50 flex items-center gap-1"
              >
                {voiceToBuy?.priceDias}
                <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
              </Badge>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setVoiceToBuy(null)}>
              Hủy bỏ
            </Button>
            <Button
              onClick={confirmBuyVoice}
              disabled={isBuying}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isBuying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử
                  lý...
                </>
              ) : (
                "Xác nhận mua"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
