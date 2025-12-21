// components/author/VoiceChapterPlayer.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { voiceChapterService } from "@/services/voiceChapterService";
import { profileService } from "@/services/profileService";
import { authorRevenueService } from "@/services/authorRevenueService"; // <--- Thêm dòng này thay thế luồng cũ
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
import {
  Play,
  Pause,
  Loader2,
  Volume2,
  Mic,
  Sparkles,
  Wallet,
  PlusCircle,
  ArrowLeft,
  Check,
  AlertCircle,
  RefreshCw,
  Gem,
} from "lucide-react";
import { toast } from "sonner";
import { VoiceTopupModal } from "@/components/payment/VoiceTopupModal";
import { Badge } from "@/components/ui/badge";
import { PricingRule } from "@/services/voiceChapterService";
// --- CẤU HÌNH DOMAIN AUDIO R2 ---
const AUDIO_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev/";

interface VoiceChapterPlayerProps {
  chapterId: string;
}

export default function VoiceChapterPlayer({
  chapterId,
}: VoiceChapterPlayerProps) {
  // --- Data States ---
  const router = useRouter();
  const [createdVoices, setCreatedVoices] = useState<VoiceAudio[]>([]);
  const [availableVoices, setAvailableVoices] = useState<VoiceItem[]>([]);
  const [charCount, setCharCount] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]); // <--- State mới

  // --- UI States ---
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVoiceIds, setSelectedVoiceIds] = useState<string[]>([]);
  const [isVoiceTopupOpen, setIsVoiceTopupOpen] = useState(false);

  // State mới: Chế độ mua thêm voice
  const [isAddingVoice, setIsAddingVoice] = useState(false);

  // --- Player States ---
  const [currentVoiceId, setCurrentVoiceId] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [authorRank, setAuthorRank] = useState<string>("");
  const [isRankRestricted, setIsRankRestricted] = useState(false);

  // --- THÊM: Ref cho Polling ---
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- THÊM: Logic Polling (Tự động cập nhật) ---
  useEffect(() => {
    // Nếu có voice nào đang "processing" thì bắt đầu polling
    const hasProcessing = createdVoices.some(
      (v) => v.status === "processing" || v.status === "pending"
    );
    if (hasProcessing) {
      startPolling();
    } else {
      stopPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdVoices]);

  // Cleanup khi thoát trang
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const startPolling = () => {
    if (pollingIntervalRef.current) return;

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const chapterData = await voiceChapterService.getVoiceChapter(
          chapterId
        );
        if (chapterData && chapterData.voices) {
          setCreatedVoices(chapterData.voices);

          // Kiểm tra nếu xong hết thì dừng
          const stillProcessing = chapterData.voices.some(
            (v: VoiceAudio) =>
              v.status === "processing" || v.status === "pending"
          );
          if (!stillProcessing) {
            toast.success("Đã cập nhật trạng thái giọng đọc!");
            stopPolling();
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 4000); // 4 giây gọi 1 lần
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };
  // --- Helper: Ghép Link Audio Full ---
  const getFullAudioUrl = (path: string | undefined | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
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
      // const res = await profileService.getWallet();
      // SỬA: Dùng service doanh thu thay vì profile
      const res = await authorRevenueService.getSummary();
      if (res.data) {
        // setWalletBalance(res.data.voiceCharBalance || 0);
        // SỬA: Lấy revenueBalance theo đúng cấu trúc  mới
        setWalletBalance(res.data.revenueBalance || 0);
      }
    } catch (error) {
      console.error("Lỗi lấy ví:", error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load song song tất cả dữ liệu cần thiết
      const [walletRes, chapterData, voiceList, count, rules, profileRes] =
        await Promise.all([
          // profileService.getWallet(),
          authorRevenueService.getSummary(), // <--- SỬA: Gọi API Summary
          voiceChapterService.getVoiceChapter(chapterId),
          voiceChapterService.getVoiceList(),
          voiceChapterService.getCharCount(chapterId),
          voiceChapterService.getPricingRules(), // <--- Gọi thêm cái này
          profileService.getProfile(),
        ]);
      setPricingRules(rules || []); // <--- Lưu vào state

      // Kiểm tra hạng tác giả
      const rank = profileRes.data.author?.rankName || "Tân Thủ";
      setAuthorRank(rank);
      if (rank === "Tân Thủ") {
        setIsRankRestricted(true);
      }
      // Set Wallet
      if (walletRes.data) {
        //  setWalletBalance(walletRes.data.voiceCharBalance || 0);
        // SỬA: Map vào revenueBalance
        setWalletBalance(walletRes.data.revenueBalance || 0);
      }

      // Set Voices & Chapter info
      setAvailableVoices(voiceList);
      setCharCount(count);

      if (chapterData.voices && chapterData.voices.length > 0) {
        setCreatedVoices(chapterData.voices);
        setCurrentVoiceId(chapterData.voices[0].voiceId);
        setIsAddingVoice(false); // Mặc định vào mode Player nếu đã có voice
      } else {
        // Nếu chưa có voice nào, tự động chọn tất cả (hoặc 1 cái tùy logic cũ)
        // setSelectedVoiceIds(voiceList.map((v) => v.voiceId));
        setSelectedVoiceIds([]); // BỎ MẶC ĐỊNH CHỌN HẾT
        setIsAddingVoice(true); // Vào mode Add Voice
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
  };

  // --- 3. Logic Tạo Voice & Tính Toán ---
  const handleToggleSelectVoice = (voiceId: string) => {
    setSelectedVoiceIds((prev) =>
      prev.includes(voiceId)
        ? prev.filter((id) => id !== voiceId)
        : [...prev, voiceId]
    );
  };
  // Tìm rule phù hợp với số ký tự hiện tại
  const currentRule = pricingRules.find(
    (r) =>
      charCount >= r.minCharCount &&
      (r.maxCharCount === null || charCount <= r.maxCharCount)
  );

  // Giá per voice (nếu không tìm thấy rule thì mặc định 0)
  const costPerVoice = currentRule ? currentRule.generationCostDias : 0;

  // Tổng chi phí = Giá 1 voice * số lượng voice đã chọn
  const totalCost = costPerVoice * selectedVoiceIds.length;
  // const totalCost = charCount * selectedVoiceIds.length;
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
      //const result = await voiceChapterService.orderVoice(
      // Vì TS chưa cập nhật type nên ta dùng "as any" hoặc truy cập trực tiếp để tránh lỗi IDE tạm thời
      const result: any = await voiceChapterService.orderVoice(
        chapterId,
        selectedVoiceIds
      );
      //     // SỬA: Thêm || 0 để phòng trường hợp backend trả về null/undefined
      //     const charged = result.charactersCharged || 0;
      //     toast.success(
      //       `Tạo thành công! Đã trừ ${result.charactersCharged.toLocaleString()} ký tự.`
      //     );

      //     if (result.walletBalance !== undefined) {
      //       setWalletBalance(result.walletBalance);
      //     } else {
      //       fetchWallet();
      //     }

      //     // Cập nhật lại danh sách voices (kết hợp cái cũ và mới nếu API trả về full,
      //     // nhưng thường API trả về full list voices của chapter đó, nên set thẳng)
      //     setCreatedVoices(result.voices);

      //     // Chọn voice mới nhất vừa tạo làm mặc định phát
      //     if (result.voices.length > 0) {
      //       // Tìm voice đầu tiên trong danh sách vừa chọn mua để play
      //       const newVoice = result.voices.find((v) =>
      //         selectedVoiceIds.includes(v.voiceId)
      //       );
      //       if (newVoice) setCurrentVoiceId(newVoice.voiceId);
      //       else setCurrentVoiceId(result.voices[0].voiceId);
      //     }

      //     // Quay về màn hình Player
      //     setIsAddingVoice(false);
      //     // Reset selection cho lần sau
      //     setSelectedVoiceIds([]);
      //   } catch (error: any) {
      //     console.error("Lỗi tạo voice:", error);
      //     toast.error(
      //       error.response?.data?.message ||
      //         "Không thể tạo giọng đọc. Vui lòng thử lại."
      //     );
      //   } finally {
      //     setIsProcessing(false);
      //   }
      // };
      // 1. Lấy cost từ "totalGenerationCostDias" thay vì "charactersCharged"
      const charged =
        result.totalGenerationCostDias || result.charactersCharged || 0;

      toast.success(
        <div className="flex items-center gap-2 flex-wrap">
          Tạo thành công! Đã trừ {charged.toLocaleString()}
          <div className="relative inline-flex items-center">
            <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
            <span className="absolute -bottom-3 -right-2 text-yellow-500 text-lg font-bold leading-none">
              *
            </span>
          </div>
        </div>
      );

      // 2. Lấy số dư mới từ "authorRevenueBalanceAfter" thay vì "walletBalance"
      if (result.authorRevenueBalanceAfter !== undefined) {
        setWalletBalance(result.authorRevenueBalanceAfter);
      } else if (result.walletBalance !== undefined) {
        setWalletBalance(result.walletBalance);
      } else {
        fetchWallet();
      }

      // 3. Cập nhật danh sách voices
      if (result.voices) {
        setCreatedVoices(result.voices);

        // Chọn voice mới nhất vừa tạo làm mặc định phát
        if (result.voices.length > 0) {
          const newVoice = result.voices.find((v: VoiceAudio) =>
            selectedVoiceIds.includes(v.voiceId)
          );
          if (newVoice) setCurrentVoiceId(newVoice.voiceId);
          else setCurrentVoiceId(result.voices[0].voiceId);
        }
      }

      // Quay về màn hình Player
      setIsAddingVoice(false);
      // Reset selection cho lần sau
      setSelectedVoiceIds([]);
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

  // Helper: Check if voice is already purchased
  const isVoicePurchased = (voiceId: string) => {
    return createdVoices.some((v) => v.voiceId === voiceId);
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

  // === CASE 1: HIỂN THỊ PLAYER (Khi có voice VÀ không ở chế độ thêm mới) ===
  if (createdVoices.length > 0 && !isAddingVoice) {
    const currentVoiceData = createdVoices.find(
      (v) => v.voiceId === currentVoiceId
    );

    // 1. Xác định trạng thái
    const status = currentVoiceData?.status || "processing";
    const isReady = status === "ready";
    const isFailed = status === "failed";
    const isProcessingVoice = status === "processing" || status === "pending";

    // 2. Chỉ lấy link audio khi Ready để tránh lỗi src=""
    const fullAudioUrl = isReady
      ? getFullAudioUrl(currentVoiceData?.audioUrl)
      : undefined;

    return (
      <Card className="border-blue-100 dark:border-blue-900 overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Volume2 className="h-5 w-5 text-blue-600" />
                Audio AI (Tác giả)
                {/* Badge trạng thái cạnh tiêu đề */}
                {isProcessingVoice && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 animate-pulse ml-2"
                  >
                    Xử lý
                  </Badge>
                )}
                {isFailed && (
                  <Badge variant="destructive" className="ml-2">
                    Lỗi
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isProcessingVoice
                  ? "Đang tạo giọng đọc..."
                  : isFailed
                  ? "Tạo thất bại"
                  : "Nghe lại audio đã tạo"}
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedVoiceIds([]);
                setIsAddingVoice(true);
              }}
              className="gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 border-dashed border-blue-300 text-blue-700 dark:text-blue-400"
            >
              <PlusCircle className="h-4 w-4" />
              Mua thêm giọng
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <audio
            ref={audioRef}
            src={fullAudioUrl} // React tự hiểu undefined là không render src
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={(e) => console.error("Audio Load Error:", e)}
          />

          {/* --- KHU VỰC HIỂN THỊ CHÍNH (Thay đổi theo Status) --- */}

          {/* TRƯỜNG HỢP 1: ĐANG XỬ LÝ -> Hiện vòng xoay */}
          {isProcessingVoice && (
            <div className="py-10 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Đang khởi tạo Audio...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Vui lòng đợi giây lát.
              </p>
            </div>
          )}

          {/* TRƯỜNG HỢP 2: THẤT BẠI -> Hiện thông báo lỗi từ Backend */}
          {isFailed && (
            <div className="py-8 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <h3 className="font-semibold text-red-700">Tạo thất bại</h3>

              {/* SỬA: Hiển thị đúng errorMessage lấy từ JSON  gửi */}
              <p className="text-sm text-red-600/80 mt-1 mb-4 px-4 text-center font-medium">
                {currentVoiceData?.errorMessage ||
                  "Lỗi không xác định từ hệ thống AI."}
              </p>

              <Button variant="outline" size="sm" onClick={() => loadData()}>
                <RefreshCw className="h-3 w-3 mr-2" /> Thử tải lại
              </Button>
            </div>
          )}

          {/* TRƯỜNG HỢP 3: THÀNH CÔNG -> Hiện Player cũ của bạn */}
          {isReady && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              {/* Control Bar (Nút Play, Slider...) */}
              <div className="flex items-center gap-4 select-none">
                <button
                  onClick={() => skipTime(-10)}
                  className="text-slate-500 hover:text-blue-600 font-bold text-xs w-8"
                >
                  -10s
                </button>

                <button
                  onClick={togglePlay}
                  className="flex items-center justify-center h-12 w-12 rounded-full bg-[#1e3a5f] hover:bg-[#2a4d7a] text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="h-5 w-5 fill-current ml-1" />
                  )}
                </button>

                <button
                  onClick={() => skipTime(10)}
                  className="text-slate-500 hover:text-blue-600 font-bold text-xs w-8"
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
            </div>
          )}

          {/* Bottom Bar (Select Voice & Speed) - Luôn hiển thị */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 mt-4 border-[#00416a]/20 dark:border-[#f0ead6]/20">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select
                value={playbackSpeed}
                onValueChange={handleSpeedChange}
                disabled={!isReady}
              >
                <SelectTrigger className="h-9 w-[80px] text-xs bg-[#f0ead6] text-[#00416a] border border-[#00416a]/20 dark:bg-[#00416a] dark:text-[#f0ead6] dark:border-[#f0ead6]/20">
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

              <Select value={currentVoiceId} onValueChange={handleVoiceChange}>
                <SelectTrigger className="h-9 w-auto min-w-[200px] text-xs font-medium bg-[#f0ead6] text-[#00416a] border-[#00416a]/20 dark:bg-[#00416a] dark:text-[#f0ead6] dark:border-[#f0ead6]/20">
                  <SelectValue placeholder="Đổi giọng đọc" />
                </SelectTrigger>
                <SelectContent>
                  {createdVoices.map((voice) => (
                    <SelectItem key={voice.voiceId} value={voice.voiceId}>
                      <div className="flex items-center gap-2">
                        {voice.voiceName} ({voice.voiceCode})
                        {voice.status === "processing" && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {voice.status === "failed" && (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // === CASE 2: FORM TẠO / MUA THÊM VOICE ===
  // Tính toán những voice chưa mua để hiển thị logic phù hợp
  const unpurchasedCount = availableVoices.filter(
    (v) => !isVoicePurchased(v.voiceId)
  ).length;

  return (
    <>
      <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                {createdVoices.length > 0
                  ? "Mua thêm giọng đọc"
                  : "Tạo bản Audio cho chương"}
              </CardTitle>
              <CardDescription>
                {createdVoices.length > 0
                  ? "Chọn thêm các giọng đọc khác để tạo audio."
                  : "Vui lòng chọn các giọng đọc bạn muốn hệ thống AI tạo."}
              </CardDescription>
            </div>

            {/* Nút Quay lại Player nếu đã có voice */}
            {createdVoices.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingVoice(false)}
                className="text-slate-500"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Quay lại Player
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isRankRestricted ? (
            // HIỂN THỊ THÔNG BÁO KHÓA HẠNG
            <div className="py-12 flex flex-col items-center justify-center text-center bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200">
              <Gem className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                Chức năng giới hạn
              </h3>
              <p className="max-w-md text-amber-800/80 dark:text-amber-200/80 mt-2 px-6">
                Bạn hiện đang là hạng tác giả{" "}
                <span className="font-bold ">"{authorRank}"</span>. Bạn chỉ có
                thể tạo Voice cho chương khi đạt hạng{" "}
                <span className="font-bold">Đồng</span> trở lên.
              </p>
              <Button
                variant="outline"
                className="mt-6 border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => router.push("/author/author-upgrade-rank")}
              >
                Tìm hiểu về Cấp bậc Tác giả
              </Button>
            </div>
          ) : unpurchasedCount === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <Check className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Bạn đã sở hữu tất cả giọng đọc
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Hiện tại không còn giọng nào khác để mua cho chương này.
              </p>
              <Button variant="outline" onClick={() => setIsAddingVoice(false)}>
                Quay lại nghe
              </Button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* --- CỘT 1: THÔNG TIN CHI PHÍ --- */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg border p-5 h-fit">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Wallet className="h-4 w-4 text-slate-500" />
                  Thông tin thanh toán
                </h4>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Độ dài chương:
                    </span>
                    <span className="font-medium">
                      {charCount.toLocaleString()} ký tự
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Số giọng chọn thêm:
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
                    {/* <span className="font-bold text-blue-600 text-lg">
                      {totalCost.toLocaleString()} chars
                    </span> */}
                    <span className="font-bold text-blue-600 text-lg flex items-center gap-1">
                      {totalCost.toLocaleString()}
                      <span className="relative inline-flex items-center">
                        <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                        <span className="absolute -bottom-2 -right-2 text-yellow-500 text-lg font-bold leading-none">
                          *
                        </span>
                      </span>
                    </span>
                  </div>

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
                      {/* <span className="font-bold">
                        {walletBalance.toLocaleString()} chars
                      </span> */}
                      <span className="font-bold flex items-center gap-1">
                        {walletBalance.toLocaleString()}
                        <span className="relative inline-flex items-center">
                          <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                          <span className="absolute -bottom-2 -right-2 text-yellow-500 text-lg font-bold leading-none">
                            *
                          </span>
                        </span>
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
                  <span>Chọn giọng đọc muốn mua thêm:</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Đã chọn: {selectedVoiceIds.length}
                  </span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableVoices.map((voice) => {
                    const isPurchased = isVoicePurchased(voice.voiceId);
                    return (
                      <div
                        key={voice.voiceId}
                        className={`
                                    flex items-start space-x-3 p-3 rounded-lg border transition-all relative
                                    ${
                                      isPurchased
                                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 opacity-60 cursor-not-allowed" // Style cho đã mua
                                        : selectedVoiceIds.includes(
                                            voice.voiceId
                                          )
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500 shadow-sm cursor-pointer"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 cursor-pointer"
                                    }
                                    `}
                        onClick={() => {
                          if (!isPurchased)
                            handleToggleSelectVoice(voice.voiceId);
                        }}
                      >
                        <Checkbox
                          checked={
                            isPurchased ||
                            selectedVoiceIds.includes(voice.voiceId)
                          }
                          disabled={isPurchased}
                          onCheckedChange={() => {
                            if (!isPurchased)
                              handleToggleSelectVoice(voice.voiceId);
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                              {voice.voiceName}
                            </p>
                            {isPurchased && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                                Đã sở hữu
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {voice.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {unpurchasedCount > 0 && (
            <div className="flex justify-end pt-2 border-t mt-4 gap-3">
              {/* Nút hủy ở dưới cùng mobile cho tiện (optional) */}
              {createdVoices.length > 0 && (
                <Button variant="ghost" onClick={() => setIsAddingVoice(false)}>
                  Hủy
                </Button>
              )}

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
                    <span className="ml-1 font-normal flex items-center gap-1">
                      ({totalCost.toLocaleString()}
                      {/* Bọc Gem vào span relative để hiện hoa thị */}
                      <span className="relative inline-flex items-center ml-0.5">
                        <Gem className="h-3 w-3 fill-current" />
                        <span className="absolute -bottom-2 -right-2 text-yellow-400 text-xl font-black leading-none drop-shadow-sm">
                          *
                        </span>
                      </span>
                      )
                    </span>
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <VoiceTopupModal
        isOpen={isVoiceTopupOpen}
        onClose={() => setIsVoiceTopupOpen(false)}
      />
    </>
  );
}
