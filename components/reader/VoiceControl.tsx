//components/reader/VoiceControl.tsx
"use client";

"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  X,
  Headphones,
  ShoppingCart,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  chapterCatalogApi,
  ChapterVoice,
} from "@/services/chapterCatalogService";
import { chapterPurchaseApi } from "@/services/chapterPurchaseService";
import { toast } from "sonner";

// Helper format giây -> mm:ss
const formatSeconds = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
};

interface VoiceControlProps {
  chapterId: string;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ chapterId }) => {
  // --- STATE DỮ LIỆU ---
  const [voices, setVoices] = useState<ChapterVoice[]>([]);
  const [currentVoice, setCurrentVoice] = useState<ChapterVoice | null>(null);
  const [loadingList, setLoadingList] = useState(true);

  // --- STATE PLAYER ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Mở rộng playlist

  // --- STATE MUA BÁN ---
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [voiceToBuy, setVoiceToBuy] = useState<ChapterVoice | null>(null); // Để hiện Dialog confirm

  const audioRef = useRef<HTMLAudioElement>(null);

  // 1. Load danh sách giọng khi vào chương
  useEffect(() => {
    loadVoices();
    // Reset player khi đổi chương
    setCurrentVoice(null);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [chapterId]);

  const loadVoices = async () => {
    try {
      setLoadingList(true);
      const data = await chapterCatalogApi.getChapterVoices(chapterId);
      setVoices(data);
      // Tự động chọn giọng đầu tiên đã mua (nếu có) để sẵn sàng phát
      const owned = data.find((v) => v.owned);
      if (owned) {
        // Không auto play ngay để tránh làm phiền, chỉ set state
        // setCurrentVoice(owned);
      }
    } catch (error) {
      console.error("Lỗi tải giọng:", error);
    } finally {
      setLoadingList(false);
    }
  };

  // 2. Xử lý Audio Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentVoice]);

  // 3. Effect xử lý Play/Pause/Volume/Speed
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying)
        audioRef.current.play().catch((e) => console.error("Play error:", e));
      else audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // --- HANDLERS ---

  const handleSelectVoice = (voice: ChapterVoice) => {
    if (voice.owned) {
      // Nếu đã sở hữu -> Phát luôn
      setCurrentVoice(voice);
      setIsPlaying(true);
      // Đóng playlist nếu đang ở mobile cho đỡ che
      // setIsExpanded(false);
    } else {
      // Nếu chưa sở hữu -> Mở dialog mua
      setVoiceToBuy(voice);
    }
  };

  const confirmBuyVoice = async () => {
    if (!voiceToBuy) return;
    setBuyingId(voiceToBuy.voiceId);
    try {
      await chapterPurchaseApi.buyVoice(chapterId, [voiceToBuy.voiceId]);

      // Sử dụng toast.success từ sonner
      toast.success("Mua thành công!", {
        description: `Đã mở khóa giọng ${voiceToBuy.voiceName}.`,
      });

      // Reload list và tự động phát giọng vừa mua
      const newData = await chapterCatalogApi.getChapterVoices(chapterId);
      setVoices(newData);
      const updatedVoice = newData.find(
        (v) => v.voiceId === voiceToBuy.voiceId
      );
      if (updatedVoice) {
        setCurrentVoice(updatedVoice);
        setIsPlaying(true);
      }
      setVoiceToBuy(null);
    } catch (error: any) {
      // Sử dụng toast.error từ sonner
      toast.error("Giao dịch thất bại", {
        description:
          error.response?.data?.message || "Không đủ Dias hoặc lỗi hệ thống.",
      });
    } finally {
      setBuyingId(null);
    }
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  // Nếu không có voice nào hoặc đang loading thì ẩn, TRỪ KHI đã chọn 1 giọng để hiện player
  if ((!voices.length && !loadingList) || (!currentVoice && !isExpanded)) {
    // Hiển thị nút kích hoạt nhỏ nếu chưa mở player
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          className="rounded-full h-12 w-12 shadow-xl bg-primary text-white hover:scale-110 transition-transform"
          onClick={() => setIsExpanded(true)}
        >
          <Headphones className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* 1. AUDIO ELEMENT ẨN */}
      {currentVoice?.audioUrl && (
        <audio ref={audioRef} src={currentVoice.audioUrl} preload="metadata" />
      )}

      {/* 2. DIALOG MUA GIỌNG */}
      <Dialog
        open={!!voiceToBuy}
        onOpenChange={(open) => !open && setVoiceToBuy(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mua giọng đọc AI</DialogTitle>
            <DialogDescription>
              Bạn có muốn dùng <strong>{voiceToBuy?.priceDias} Dias</strong> để
              mở khóa giọng đọc
              <span className="font-bold text-primary">
                {" "}
                {voiceToBuy?.voiceName}
              </span>{" "}
              không?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
            <Headphones className="w-8 h-8 mr-3 text-primary" />
            <div className="text-sm">
              Giọng đọc chất lượng cao, tự nhiên và truyền cảm.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoiceToBuy(null)}>
              Hủy
            </Button>
            <Button onClick={confirmBuyVoice} disabled={!!buyingId}>
              {buyingId ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ShoppingCart className="w-4 h-4 mr-2" />
              )}
              Xác nhận mua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. PLAYER BAR CHÍNH (FULL WIDTH) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
          isExpanded || currentVoice ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Playlist Panel (Hiện khi bấm mở rộng) */}
        {isExpanded && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-border p-4 max-h-[300px] shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Headphones className="w-4 h-4" /> Danh sách giọng đọc
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pb-4">
                {voices.map((voice) => (
                  <div
                    key={voice.voiceId}
                    onClick={() => handleSelectVoice(voice)}
                    className={`
                                    cursor-pointer p-3 rounded-lg border flex items-center justify-between transition-all hover:bg-accent
                                    ${
                                      currentVoice?.voiceId === voice.voiceId
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-border"
                                    }
                                `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          voice.owned
                            ? "bg-blue-100 text-blue-600"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {voice.owned ? (
                          <Play className="w-3 h-3" />
                        ) : (
                          <ShoppingCart className="w-3 h-3" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{voice.voiceName}</p>
                        <p className="text-xs text-muted-foreground">
                          {voice.voiceCode}
                        </p>
                      </div>
                    </div>
                    {!voice.owned && (
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-200"
                      >
                        {voice.priceDias} Dias
                      </Badge>
                    )}
                    {currentVoice?.voiceId === voice.voiceId && (
                      <div className="flex gap-1 h-3 items-end">
                        <span className="w-1 bg-primary animate-[music-bar_1s_ease-in-out_infinite] h-full"></span>
                        <span className="w-1 bg-primary animate-[music-bar_1.2s_ease-in-out_infinite] h-2/3"></span>
                        <span className="w-1 bg-primary animate-[music-bar_0.8s_ease-in-out_infinite] h-1/2"></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Player Controls Bar */}
        <div className="bg-white dark:bg-slate-950 border-t border-border shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-3 md:px-6 md:py-4">
          <div className="max-w-7xl mx-auto flex flex-col gap-3">
            {/* Thanh Seek Bar (Top) */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatSeconds(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1 cursor-pointer"
              />
              <span className="text-xs text-muted-foreground w-10">
                {formatSeconds(duration)}
              </span>
            </div>

            {/* Controls (Bottom) */}
            <div className="flex items-center justify-between">
              {/* Left: Info Voice */}
              <div className="flex items-center gap-3 w-1/3 overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </Button>
                <div className="hidden md:block truncate">
                  <p className="font-semibold text-sm truncate">
                    {currentVoice ? currentVoice.voiceName : "Chọn giọng đọc"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentVoice ? "Đang phát..." : "Nhấn mũi tên để chọn"}
                  </p>
                </div>
              </div>

              {/* Center: Main Buttons */}
              <div className="flex items-center justify-center gap-2 md:gap-4 w-1/3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skipTime(-10)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>

                <Button
                  size="icon"
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
                  onClick={() => {
                    if (!currentVoice) setIsExpanded(true);
                    else setIsPlaying(!isPlaying);
                  }}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-1" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skipTime(10)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              {/* Right: Settings (Volume, Speed) */}
              <div className="flex items-center justify-end gap-2 md:gap-4 w-1/3">
                {/* Speed Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden md:flex font-mono text-xs border border-transparent hover:border-border"
                    >
                      {playbackRate}x
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-12 p-1 flex flex-col gap-1"
                    side="top"
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <Button
                        key={rate}
                        variant={playbackRate === rate ? "secondary" : "ghost"}
                        size="sm"
                        className="h-6 text-xs px-1"
                        onClick={() => setPlaybackRate(rate)}
                      >
                        {rate}x
                      </Button>
                    ))}
                  </PopoverContent>
                </Popover>

                {/* Volume Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-3" side="top">
                    <div className="flex items-center gap-2">
                      <VolumeX
                        className="w-4 h-4 cursor-pointer"
                        onClick={() => setIsMuted(!isMuted)}
                      />
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.1}
                        onValueChange={(val) => {
                          setVolume(val[0]);
                          setIsMuted(val[0] === 0);
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
