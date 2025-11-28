// components/author/VoiceChapterPlayer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { voiceChapterService } from "@/services/voiceChapterService";
import { profileService } from "@/services/profileService";
import { VoiceAudio, VoiceItem } from "@/services/apiTypes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Loader2,
  Volume2,
  Mic,
  Sparkles,
  CheckCircle,
  Wallet,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { VoiceTopupModal } from "@/components/payment/VoiceTopupModal";

// --- CẤU HÌNH DOMAIN AUDIO R2 ---
const AUDIO_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev/";

interface VoiceChapterPlayerProps {
  chapterId: string;
}

export default function VoiceChapterPlayer({
  chapterId,
}: VoiceChapterPlayerProps) {
  // --- Data States ---
  const [createdVoices, setCreatedVoices] = useState<VoiceAudio[]>([]);
  const [availableVoices, setAvailableVoices] = useState<VoiceItem[]>([]);
  const [charCount, setCharCount] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // --- UI States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVoiceIds, setSelectedVoiceIds] = useState<string[]>([]);
  const [isVoiceTopupOpen, setIsVoiceTopupOpen] = useState(false);

  // --- Player States ---
  const [currentVoiceId, setCurrentVoiceId] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Helper: Ghép Link Audio Full ---
  const getFullAudioUrl = (path: string | undefined | null) => {
    if (!path) return "";
    // Nếu API đã trả về full http... thì giữ nguyên, nếu không thì ghép với Base URL
    if (path.startsWith("http")) return path;

    // Xử lý trường hợp path bắt đầu bằng dấu / (ví dụ: /voices/...)
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${AUDIO_BASE_URL}${cleanPath}`;
  };

  // --- 1. Load Data ---
  useEffect(() => {
    if (chapterId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  useEffect(() => {
    if (!isVoiceTopupOpen) {
      fetchWallet();
    }
  }, [isVoiceTopupOpen]);

  const fetchWallet = async () => {
    try {
      const res = await profileService.getWallet();
      if (res.data) {
        setWalletBalance(res.data.voiceCharBalance || 0);
      }
    } catch (error) {
      console.error("Lỗi lấy ví:", error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      await fetchWallet();

      const chapterData = await voiceChapterService.getVoiceChapter(chapterId);

      if (chapterData.voices && chapterData.voices.length > 0) {
        setCreatedVoices(chapterData.voices);
        setCurrentVoiceId(chapterData.voices[0].voiceId);
      } else {
        const [voicesList, count] = await Promise.all([
          voiceChapterService.getVoiceList(),
          voiceChapterService.getCharCount(chapterId),
        ]);
        setAvailableVoices(voicesList);
        setCharCount(count);
        setSelectedVoiceIds(voicesList.map((v) => v.voiceId));
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu Voice:", error);
      toast.error("Không thể tải thông tin Audio AI");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. Logic Player Controls ---
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
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

  const handleSpeedChange = (speed: string) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(speed);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    setCurrentVoiceId(voiceId);
    setIsPlaying(false);
    // Khi đổi source, audio sẽ tự reset, đợi user bấm play lại
  };

  // --- 3. Logic Tạo Voice & Tính Toán ---
  const handleToggleSelectVoice = (voiceId: string) => {
    setSelectedVoiceIds((prev) =>
      prev.includes(voiceId)
        ? prev.filter((id) => id !== voiceId)
        : [...prev, voiceId]
    );
  };

  const totalCost = charCount * selectedVoiceIds.length;
  const isEnoughBalance = walletBalance >= totalCost;

  const handleCreateVoices = async () => {
    if (selectedVoiceIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 giọng đọc");
      return;
    }

    if (!isEnoughBalance) {
      toast.error("Số dư ký tự không đủ. Vui lòng nạp thêm!");
      setIsVoiceTopupOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await voiceChapterService.orderVoice(
        chapterId,
        selectedVoiceIds
      );

      toast.success(
        `Tạo thành công! Đã trừ ${result.charactersCharged.toLocaleString()} ký tự.`
      );

      if (result.walletBalance !== undefined) {
        setWalletBalance(result.walletBalance);
      } else {
        fetchWallet();
      }

      setCreatedVoices(result.voices);
      if (result.voices.length > 0) {
        setCurrentVoiceId(result.voices[0].voiceId);
      }
    } catch (error: any) {
      console.error("Lỗi tạo voice:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể tạo giọng đọc. Vui lòng thử lại."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // --- RENDER ---
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="py-10 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Đang tải dữ liệu Audio...</p>
        </CardContent>
      </Card>
    );
  }

  // === CASE 1: ĐÃ CÓ VOICE => HIỂN THỊ PLAYER ===
  if (createdVoices.length > 0) {
    const currentVoiceData = createdVoices.find(
      (v) => v.voiceId === currentVoiceId
    );

    // TẠO LINK FULL TẠI ĐÂY
    const fullAudioUrl = getFullAudioUrl(currentVoiceData?.audioUrl);

    return (
      <Card className="border-blue-100 dark:border-blue-900 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Volume2 className="h-5 w-5 text-blue-600" />
              Audio AI (Dành cho Tác giả)
            </CardTitle>
          </div>
          <CardDescription>
            Nghe lại bản Audio đã tạo. Bạn có thể chọn các giọng khác nhau để
            kiểm tra.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Audio Element với SRC đã được fix */}
          <audio
            ref={audioRef}
            src={fullAudioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={(e) => {
              console.error("Audio Load Error:", e);
              // toast.error("Không tải được file Audio");
            }}
          />

          <div className="flex flex-col gap-4">
            {/* Control Bar */}
            <div className="flex items-center gap-4 select-none">
              <button
                onClick={() => skipTime(-10)}
                className="text-slate-500 hover:text-blue-600 dark:text-slate-400 font-bold text-xs w-8 transition-colors"
              >
                -10s
              </button>

              <button
                onClick={togglePlay}
                className="flex items-center justify-center h-12 w-12 rounded-full bg-[#1e3a5f] hover:bg-[#2a4d7a] text-white shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={() => skipTime(10)}
                className="text-slate-500 hover:text-blue-600 dark:text-slate-400 font-bold text-xs w-8 transition-colors"
              >
                +10s
              </button>

              <span className="text-xs text-slate-500 font-mono w-10 text-right">
                {formatTime(currentTime)}
              </span>

              <div className="flex-1 mx-2">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
              </div>

              <span className="text-xs text-slate-500 font-mono w-10">
                {formatTime(duration)}
              </span>
            </div>

            {/* Bottom Bar: Speed & Voice Select */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 border-[#00416a]/20 dark:border-[#f0ead6]/20">
              <div className="flex items-center gap-3">
                <Select value={playbackSpeed} onValueChange={handleSpeedChange}>
                  <SelectTrigger
                    className="h-9 w-[80px] text-xs focus:ring-0 font-medium
                    bg-[#f0ead6] text-[#00416a] border border-[#00416a]/20
                    dark:bg-[#00416a] dark:text-[#f0ead6] dark:border-[#f0ead6]/20"
                  >
                    <SelectValue placeholder="Tốc độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1.0">1.0x</SelectItem>
                    <SelectItem value="1.25">1.25x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2.0">2.0x</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={currentVoiceId}
                  onValueChange={handleVoiceChange}
                >
                  <SelectTrigger
                    className="h-9 w-auto min-w-[200px] text-xs focus:ring-0 font-medium 
                    bg-[#f0ead6] text-[#00416a] border-[#00416a]/20
                    dark:bg-[#00416a] dark:text-[#f0ead6] dark:border-[#f0ead6]/20"
                  >
                    <SelectValue placeholder="Đổi giọng đọc" />
                  </SelectTrigger>
                  <SelectContent>
                    {createdVoices.map((voice) => (
                      <SelectItem key={voice.voiceId} value={voice.voiceId}>
                        {voice.voiceName} (
                        {voice.voiceCode === "male_high"
                          ? "Nam cao"
                          : voice.voiceCode === "female_low"
                          ? "Nữ trầm"
                          : "Giọng khác"}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // === CASE 2: CHƯA CÓ VOICE => HIỂN THỊ FORM TẠO ===
  return (
    <>
      <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Tạo bản Audio cho chương này
          </CardTitle>
          <CardDescription>
            Chương này chưa có phiên bản Audio. Vui lòng chọn các giọng đọc bạn
            muốn hệ thống AI tạo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* --- CỘT 1: THÔNG TIN CHI PHÍ --- */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg border p-5 h-fit">
              <h4 className="font-semibold text-sm mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Wallet className="h-4 w-4 text-slate-500" />
                Thông tin thanh toán
              </h4>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Độ dài chương:</span>
                  <span className="font-medium">
                    {charCount.toLocaleString()} ký tự
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Số giọng đã chọn:
                  </span>
                  <span className="font-medium">
                    x {selectedVoiceIds.length}
                  </span>
                </div>

                <div className="h-[1px] bg-slate-200 dark:bg-slate-700 my-2"></div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Tổng chi phí:
                  </span>
                  <span className="font-bold text-blue-600 text-lg">
                    {totalCost.toLocaleString()} chars
                  </span>
                </div>

                {/* Box Số dư & Nút Nạp */}
                <div
                  className={`mt-4 p-3 rounded-md border flex flex-col gap-2 ${
                    isEnoughBalance
                      ? "bg-green-50/50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                      : "bg-red-50/50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold uppercase opacity-70">
                      Số dư hiện tại
                    </span>
                    <span className="font-bold">
                      {walletBalance.toLocaleString()} chars
                    </span>
                  </div>

                  {!isEnoughBalance && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full mt-1"
                      onClick={() => setIsVoiceTopupOpen(true)}
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                      Nạp thêm ký tự
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* --- CỘT 2: CHỌN GIỌNG --- */}
            <div className="flex-[2] space-y-3">
              <p className="text-sm font-medium flex justify-between">
                <span>Chọn giọng đọc muốn tạo:</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Đã chọn: {selectedVoiceIds.length}
                </span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableVoices.map((voice) => (
                  <div
                    key={voice.voiceId}
                    className={`
                            flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all relative
                            ${
                              selectedVoiceIds.includes(voice.voiceId)
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500 shadow-sm"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800"
                            }
                            `}
                    onClick={() => handleToggleSelectVoice(voice.voiceId)}
                  >
                    <Checkbox
                      checked={selectedVoiceIds.includes(voice.voiceId)}
                      onCheckedChange={() =>
                        handleToggleSelectVoice(voice.voiceId)
                      }
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {voice.voiceName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {voice.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t mt-4">
            <Button
              onClick={handleCreateVoices}
              disabled={isProcessing || selectedVoiceIds.length === 0}
              className="w-full md:w-auto min-w-[220px] h-11 text-base shadow-lg transition-all font-medium
                    bg-[#1e3a5f] text-white hover:bg-[#2a4d7a]
                    dark:bg-[#f0ead6] dark:text-[#00416a] dark:hover:bg-[#e6dfc8]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  Tạo Audio ngay
                  {/* Đã bỏ opacity-90 để chữ rõ nét hơn */}
                  <span className="ml-1 font-normal">
                    ({totalCost.toLocaleString()} chars)
                  </span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <VoiceTopupModal
        isOpen={isVoiceTopupOpen}
        onClose={() => setIsVoiceTopupOpen(false)}
        currentTextBalance={walletBalance}
      />
    </>
  );
}
