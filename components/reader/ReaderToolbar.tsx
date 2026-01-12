// components/reader/ReaderToolbar.tsx
/*
 * MỤC ĐÍCH CHÍNH:
 * Thanh công cụ điều khiển toàn diện cho trải nghiệm đọc truyện, tích hợp đa chức năng:
 *
 * CHỨC NĂNG CORE:
 * 1. ĐIỀU HƯỚNG CHƯƠNG:
 *    - Dropdown danh sách chương với trạng thái (đã mua/khóa/free)
 *    - Nút Back về trang trước
 *    - Hiển thị thông tin chương hiện tại
 *
 * 2. HỆ THỐNG AUDIO ĐA LỚP:
 *    a) GIỌNG ĐỌC (Voice Narration):
 *       - Play/Pause/Tua (seek) audio giọng đọc
 *       - Điều chỉnh âm lượng, tốc độ (0.5x-2.0x)
 *       - Progress bar hiển thị thời gian
 *       - Chọn giọng đọc từ nhiều options
 *
 *    b) NHẠC NỀN (Background Music):
 *       - Premium feature chỉ cho subscribers
 *       - Multiple tracks theo mood/chapter
 *       - Điều khiển volume riêng biệt
 *       - Loop tự động
 *
 * 3. BUSINESS MODEL & MONETIZATION:
 *    a) VOICE PURCHASE FLOW:
 *       - Hiển thị giọng đọc có giá (gem/dias)
 *       - Xác nhận mua dialog
 *       - Xử lý thanh toán + error handling
 *       - Auto-play sau khi mua thành công
 *
 *    b) PREMIUM SUBSCRIPTION:
 *       - Check subscription status
 *       - Restrict nhạc nền cho non-premium
 *       - Upsell modal integration
 *
 * 4. UTILITY FEATURES:
 *    - Báo cáo chương (ReportModal)
 *    - Mở cài đặt đọc (onSettings callback)
 *    - TranslationControl integration (qua children)
 *    - Theme support (dark/light/transparent)
 *
 * KIẾN TRÚC KỸ THUẬT:
 * - Fixed position toolbar với responsive design
 * - 2 HTML5 Audio elements độc lập (voice + music)
 * - State management với React hooks
 * - API integration với backend services
 * - Toast notifications cho user feedback
 * - Error boundary & retry logic
 *
 * INTEGRATION POINTS:
 * - Parent: ChapterReader (nhận props và callbacks)
 * - Children: TranslationControl (dịch thuật)
 * - Services: chapterCatalogApi, chapterPurchaseApi
 * - Components: ReportModal, TopUpModal
 *
 * BUSINESS LOGIC PHỨC TẠP:
 * 1. Chapter Access Logic: isOwned vs isLocked vs accessType
 * 2. Voice Ownership: Đã mua vs chưa mua (priceDias)
 * 3. Premium Requirement: hasActiveSubscription check
 * 4. Auto-play Strategy: Sau unlock/purchase
 */
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
import { cn } from "@/lib/utils"; // Helper để gộp và xử lý className Tailwind CSS một cách linh hoạt
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

/**
 * URL base cho Cloudflare R2 storage nơi lưu audio files
 * Định dạng: https://<bucket>.<account>.r2.dev/
 */
const AUDIO_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev/";
/**
 * Map language code -> display name (cho hiển thị UI)
 * Key: language code theo chuẩn BCP 47 (vi-VN, en-US, etc.)
 * Value: Tên ngôn ngữ hiển thị (có thể có cả native name)
 */ const languageNames: Record<string, string> = {
  "vi-VN": "Tiếng Việt",
  "ja-JP": "日本語 (Tiếng Nhật)",
  "en-US": "English (Tiếng Anh)",
  "zh-CN": "中文 (Tiếng Trung)",
};

/**
 * Interface cho props của ReaderToolbar
 *
 * @property chapterNo: Số thứ tự chương hiện tại (1, 2, 3...)
 * @property chapterTitle: Tiêu đề chương
 * @property chapterId: ID duy nhất của chương (UUID từ backend)
 * @property storyId: ID truyện
 * @property chapters: Mảng tất cả chương của truyện (cho dropdown)
 * @property isDarkTheme: Theme tối/sáng
 * @property isTransparent: Toolbar có trong suốt không (blur effect)
 * @property onBack: Callback khi click nút back
 * @property onSettings: Callback mở settings
 * @property onChapterChange: Callback khi đổi chương (nhận chapterId)
 * @property autoPlayAfterUnlock: Tự động phát audio sau khi unlock chapter (tính năng mới)
 * @property setShowTopUpModal: Callback mở modal nạp tiền/mua gói (truyền từ parent lên)
 * @property mood: Thông tin mood/cảm xúc của chương (cho nhạc nền)
 * @property moodMusicPaths: Danh sách nhạc nền cho mood này
 * @property hasActiveSubscription: User có premium subscription không
 * @property languageCode: Ngôn ngữ gốc của chương (cho dịch thuật)
 */
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

/**
 * COMPONENT CHÍNH: ReaderToolbar
 *
 * Là thanh công cụ fixed ở top khi đọc truyện, chứa tất cả controls:
 * - Navigation: Chuyển chương, back
 * - Audio Player: Play/pause giọng đọc, tua, volume, speed
 * - Voice Selection: Chọn/mua giọng đọc
 * - Music Player: Nhạc nền (premium feature)
 * - Utilities: Report, settings, translation (thông qua children)
 *
 * State Management:
 * - Local state cho UI (openChapterList, showVolume, etc.)
 * - Voice settings từ localStorage (persist user preferences)
 * - Audio state (currentTime, duration, isPlaying)
 * - Business state (voices list, purchase flow)
 */
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
  // ========== STATE DECLARATIONS ==========

  /**
   * UI State: Mở/đóng dropdown danh sách chương
   */
  const [openChapterList, setOpenChapterList] = useState(false);
  /**
   * Voice settings từ localStorage (persisted user preferences)
   * Bao gồm: volume, speed, isPlaying
   * Được load lúc component mount
   */
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(
    getVoiceSettings()
  );
  /**
   * UI State: Hiển thị popover volume control
   */
  const [showVolume, setShowVolume] = useState(false);

  /**
   * Danh sách voices khả dụng cho chương này
   * Mỗi voice có: voiceId, voiceName, audioUrl, owned (boolean), priceDias
   */
  const [voices, setVoices] = useState<ChapterVoice[]>([]);
  /**
   * Voice đang được chọn để phát
   * Null nếu chưa chọn hoặc chưa mua
   */
  const [currentVoice, setCurrentVoice] = useState<ChapterVoice | null>(null);
  /**
   * Loading state khi fetch voices từ API
   */
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  /**
   * Thời lượng audio (seconds)
   */
  const [audioDuration, setAudioDuration] = useState(0);
  /**
   * Thời gian hiện tại của audio (seconds)
   * Update liên tục khi audio đang phát
   */
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  /**
   * Voice đang được xem xét mua (mở dialog confirm)
   */
  const [voiceToBuy, setVoiceToBuy] = useState<ChapterVoice | null>(null);
  /**
   * Loading state khi đang xử lý mua voice
   */
  const [isBuying, setIsBuying] = useState(false);
  /**
   * Đường dẫn nhạc nền đang được chọn
   * Null = tắt nhạc
   */
  const [activeMusicPath, setActiveMusicPath] = useState<string | null>(null);
  /**
   * Trạng thái phát nhạc nền
   */
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  /**
   * Âm lượng nhạc nền (0-100)
   */
  const [musicVolume, setMusicVolume] = useState(30);

  /**
   * UI State: Hiển thị popover volume nhạc
   */
  const [showMusicVolume, setShowMusicVolume] = useState(false);

  /**
   * Ref đến audio element nhạc nền
   * Dùng useRef để truy cập DOM element trực tiếp
   */
  const bgMusicRef = useRef<HTMLAudioElement>(null);

  /**
   * Ref đến audio element giọng đọc
   */
  const audioRef = useRef<HTMLAudioElement>(null);
  /**
   * UI State: Mở modal báo cáo
   */
  const [showReportModal, setShowReportModal] = useState(false);

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Hàm xử lý đường dẫn audio
   * Chuyển relative path từ API thành full URL với CDN
   *
   * Logic:
   * 1. Kiểm tra path hợp lệ (string, không rỗng)
   * 2. Nếu đã là full URL (http/https) → trả về nguyên
   * 3. Ngược lại → ghép với AUDIO_BASE_URL
   *
   * @param path - Đường dẫn từ API (có thể là relative hoặc full URL)
   * @returns Full URL đến audio file
   */
  const getFullAudioUrl = (path: any) => {
    // Kiểm tra nếu path không phải string hoặc rỗng thì thoát sớm
    if (typeof path !== "string" || !path) return "";

    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${AUDIO_BASE_URL}${cleanPath}`;
  };

  /**
   * Fetch danh sách voices từ API cho chapter hiện tại
   *
   * Flow:
   * 1. Set loading state
   * 2. Gọi API: chapterCatalogApi.getChapterVoices(chapterId)
   * 3. Filter voices: Hiện tất cả (owned + unowned)
   * 4. Xử lý auto-play nếu enabled
   * 5. Update state: voices, currentVoice
   *
   * Logic autoplayAfterUnlock:
   * - Chỉ kích hoạt khi prop autoPlayAfterUnlock = true
   * - Tìm voice đầu tiên đã owned
   * - Set currentVoice và play ngay
   */
  const fetchVoices = async () => {
    setIsLoadingVoice(true);
    try {
      const data = await chapterCatalogApi.getChapterVoices(chapterId);

      // Ưu tiên hiện voice đã sở hữu (owned)
      const visibleVoices = data.filter((v) => {
        if (v.owned) return true; // Nếu là tác giả hoặc đã mua -> Luôn hiện
        return true; // Voice chưa mua cũng hiện để bán
      });

      setVoices(visibleVoices);

      // Logic autoplay khi unlock chapter
      if (autoPlayAfterUnlock && visibleVoices.length > 0) {
        const firstOwnedVoice = visibleVoices.find((v) => v.owned);
        if (firstOwnedVoice) {
          setCurrentVoice(firstOwnedVoice);
          setVoiceSettings((prev) => ({ ...prev, isPlaying: true }));
        }
      } else if (!currentVoice) {
        // Nếu không có autoplay, chọn voice owned đầu tiên
        const owned = visibleVoices.find((v) => v.owned);
        if (owned) setCurrentVoice(owned);
      }
    } catch (error) {
      console.error("Lỗi tải giọng:", error);
    } finally {
      setIsLoadingVoice(false);
    }
  };

  // ========== EFFECTS FOR LIFECYCLE MANAGEMENT ==========

  /**
   * Effect chính: Reset state khi đổi chương
   *
   * Khi chapterId thay đổi:
   * 1. Fetch voices mới
   * 2. Reset audio state (pause, reset time)
   * 3. Reset current voice
   *
   * Dependencies: chapterId
   */
  useEffect(() => {
    if (chapterId) fetchVoices();
    setVoiceSettings((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setCurrentVoice(null);
  }, [chapterId]);

  /**
   * Effect cho auto-play sau unlock
   *
   * Kích hoạt khi:
   * - autoPlayAfterUnlock = true (prop từ parent)
   * - chapterId thay đổi
   *
   * Thực hiện reload voices để có data mới nhất từ API
   * (sau khi unlock, owned status thay đổi)
   */
  useEffect(() => {
    if (autoPlayAfterUnlock && chapterId) {
      console.log("🎯 AUTO PLAY TRIGGERED, reloading voices...");
      fetchVoices(); // Reload voices để có dữ liệu mới nhất
    }
  }, [autoPlayAfterUnlock, chapterId]);

  // ========== AUDIO EVENT HANDLERS ==========

  /**
   * Handler cho audio timeupdate event
   * Cập nhật audioCurrentTime mỗi khi audio tiến triển
   */
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };
  /**
   * Handler cho loadedmetadata event
   * Lấy duration của audio khi metadata loaded
   */
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  /**
   * Handler cho ended event
   * Reset playback state khi audio kết thúc
   */
  const handleEnded = () => {
    setVoiceSettings((prev) => ({ ...prev, isPlaying: false }));
    setAudioCurrentTime(0);
  };

  /**
   * Effect điều khiển play/pause audio element
   *
   * Logic:
   * - Nếu voiceSettings.isPlaying = true và có audioUrl → play()
   * - Ngược lại → pause()
   *
   * Error handling: Catch play() error (thường do autoplay policy)
   */
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
  /**
   * Effect cập nhật volume audio element
   * Chuyển đổi từ scale 0-100 sang 0.0-1.0 của HTML5 Audio
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = voiceSettings.volume / 100;
    }
  }, [voiceSettings.volume]);
  /**
   * Effect cập nhật playback speed
   * HTML5 Audio API cho phép thay đổi playbackRate (0.5-2.0)
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = voiceSettings.speed;
    }
  }, [voiceSettings.speed]);
  // ========== AUDIO CONTROL FUNCTIONS ==========

  /**
   * Toggle play/pause audio
   *
   * Flow:
   * 1. Kiểm tra có currentVoice không (nếu không → toast info)
   * 2. Toggle isPlaying state
   * 3. Audio element sẽ tự play/pause qua effect trên
   */
  const togglePlay = () => {
    if (!currentVoice) {
      toast.info("Vui lòng mua hoặc chọn giọng đọc trước.");
      return;
    }
    setVoiceSettings((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };
  /**
   * Tua audio theo số giây (+ tiến, - lùi)
   *
   * @param seconds - Số giây cần tua (dương: tiến, âm: lùi)
   */
  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  /**
   * Xử lý seek trên progress bar
   *
   * @param value - Array 1 phần tử [newTime] từ Slider component
   */
  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setAudioCurrentTime(value[0]);
    }
  };
  // ========== VOICE SELECTION & PURCHASE FLOW ==========

  /**
   * Xử lý khi user chọn voice từ dropdown
   *
   * Logic phân nhánh:
   * 1. Nếu voice đã owned → chọn và phát ngay
   * 2. Nếu chưa owned → mở dialog xác nhận mua
   *
   * @param voiceId - ID của voice được chọn
   */
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
  /**
   * Xác nhận mua voice (gọi API)
   *
   * Flow:
   * 1. Set loading state (isBuying)
   * 2. Gọi API: chapterPurchaseApi.buyVoice()
   * 3. Xử lý kết quả:
   *    - Success: Toast, refresh voices, play ngay
   *    - Error: Phân loại lỗi (409, 400, etc.)
   * 4. Reset loading và dialog
   */
  const confirmBuyVoice = async () => {
    if (!voiceToBuy) return;

    setIsBuying(true);
    try {
      // API call mua voice
      await chapterPurchaseApi.buyVoice(chapterId, [voiceToBuy.voiceId]);
      // Success toast với thông tin price
      toast.success(`Đã mua giọng ${voiceToBuy.voiceName}`, {
        description: (
          <span className="flex items-center gap-1">
            Đã trừ {voiceToBuy.priceDias}
            <Gem className="h-4 w-4 text-blue-500 fill-blue-500 opacity-80" />
            trong ví.
          </span>
        ),
      });
      // Refresh voices và phát ngay
      await refreshAndPlay(voiceToBuy.voiceId);
    } catch (error: any) {
      // Error handling với phân loại HTTP status
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = error.response?.data?.error?.message;

      //  XỬ LÝ CÁC LOẠI LỖI
      switch (true) {
        // Conflict: Đã sở hữu (có thể từ session khác)
        case error.response?.status === 409:
          toast.success("Bạn đã sở hữu giọng đọc này!", {
            description: "Đang cập nhật lại trạng thái...",
            icon: <Check className="w-4 h-4 text-green-500" />,
          });
          await refreshAndPlay(voiceToBuy.voiceId);
          break;

        case error.response?.status === 400 &&
          errorCode === "InsufficientBalance":
          // Không đủ tiền: Hiện toast với nút nạp
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
          // Bad request khác
          toast.error("Giao dịch thất bại", {
            description: errorMessage || "Yêu cầu không hợp lệ.",
          });
          break;

        default:
          // Lỗi không xác định
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
  /**
   * Refresh voices sau khi mua và phát ngay
   *
   * Flow:
   * 1. Gọi API lấy voices mới nhất
   * 2. Tìm voice vừa mua (theo targetVoiceId)
   * 3. Nếu đã owned → set currentVoice và play
   *
   * @param targetVoiceId - ID của voice vừa mua
   */
  const refreshAndPlay = async (targetVoiceId: string) => {
    try {
      const data = await chapterCatalogApi.getChapterVoices(chapterId);

      // Xóa bỏ điều kiện v.status === "ready"
      const visibleVoices = data.filter((v) => {
        return true; // Hiện tất cả để đảm bảo không bị mất voice vừa mua
      });

      setVoices(visibleVoices);
      // Tìm voice vừa mua và play
      const newOwned = visibleVoices.find((v) => v.voiceId === targetVoiceId);
      if (newOwned && newOwned.owned) {
        setCurrentVoice(newOwned);
        setVoiceSettings((prev) => ({ ...prev, isPlaying: true }));
      }
    } catch (e) {
      console.error("Reload error", e);
    }
  };

  // ========== BACKGROUND MUSIC CONTROL ==========

  /**
   * Effect reset music khi đổi chương
   *
   * Logic:
   * 1. Dừng nhạc
   * 2. Set activeMusicPath = bài đầu tiên trong list (nếu có)
   */
  useEffect(() => {
    setIsMusicPlaying(false);
    if (moodMusicPaths && moodMusicPaths.length > 0) {
      // Mặc định chọn storagePath của bài đầu tiên
      setActiveMusicPath(moodMusicPaths[0].storagePath);
    } else {
      setActiveMusicPath(null);
    }
  }, [chapterId, moodMusicPaths]);

  /**
   * Effect điều khiển audio element nhạc nền
   *
   * Logic:
   * - Cập nhật volume
   * - Play/pause dựa trên isMusicPlaying và activeMusicPath
   * - Error handling cho autoplay policy
   */
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
  /**
   * Xử lý chọn nhạc nền
   *
   * Logic phân nhánh:
   * 1. Nếu chọn "turn_off" → tắt nhạc
   * 2. Kiểm tra premium subscription:
   *    - Không có → toast error với upsell
   *    - Có → set path và play
   *
   * @param path - Đường dẫn nhạc hoặc "turn_off"
   */
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

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Format seconds thành MM:SS string
   *
   * @param seconds - Số giây cần format
   * @returns String dạng "MM:SS" hoặc "00:00" nếu invalid
   */
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };
  /**
   * Sort chapters theo số thứ tự (tăng dần)
   */
  const sortedChapters = [...chapters].sort(
    (a, b) => a.chapterNo - b.chapterNo
  );

  /**
   * Dynamic theme classes cho responsive styling
   * Dựa trên isDarkTheme và isTransparent props
   */
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
  // ========== JSX RENDER ==========
  return (
    <>
      {/* MAIN TOOLBAR CONTAINER */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 transition-all duration-300 gap-4",
          themeClasses.bg
        )}
      >
        {/* HIDDEN AUDIO ELEMENTS */}
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
        {/* LEFT SECTION: NAVIGATION */}
        <div className="flex items-center gap-2 w-1/4 min-w-[200px] shrink-0">
          {/* LEFT SECTION: NAVIGATION */}
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
          {/* CHAPTER INFO & DROPDOWN */}
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                themeClasses.textMuted
              )}
            >
              Chương {chapterNo}
            </span>
            {/* CHAPTER SELECTION POPOVER */}
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
                          {/* BADGE HIỂN THỊ TRẠNG THÁI CHƯƠNG */}
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
                              // Case 3: Free chương
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
        {/* CENTER SECTION: AUDIO CONTROLS */}
        <div className="flex-1 flex items-center justify-center gap-2 md:gap-6 px-2 w-full max-w-5xl">
          {/* REWIND 10s BUTTON (hidden on mobile) */}
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

          {/* PLAY/PAUSE BUTTON */}
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
          {/* FORWARD 10s BUTTON (hidden on mobile) */}
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
          {/* PROGRESS BAR & TIME DISPLAY */}
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
          {/* ADVANCED CONTROLS (hidden on small screens) */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            {/* PLAYBACK SPEED SELECT */}
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
            {/* VOICE SELECTION DROPDOWN */}
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
                  // Voices list
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
            {/* BACKGROUND MUSIC SELECTION */}
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
        {/* RIGHT SECTION: UTILITIES */}
        <div className="flex items-center justify-end gap-1 w-fit shrink-0">
          {/* REPORT BUTTON */}
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
          {/* VOICE VOLUME POPOVER */}
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
          {/* TRANSLATION CONTROL (passed as children) */}
          {children}
          {/* SETTINGS BUTTON */}
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

      {/* MODALS & DIALOGS */}

      {/* REPORT MODAL */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="chapter"
        targetId={chapterId}
        targetTitle={`Chương ${chapterNo}: ${chapterTitle}`}
      />
      {/* VOICE PURCHASE CONFIRMATION DIALOG */}
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
