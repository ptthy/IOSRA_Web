// app/reader/[storyId]/[chapterId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  chapterCatalogApi,
  ChapterDetail,
  ChapterSummary,
} from "@/services/chapterCatalogService";
import {
  chapterCommentService,
  ChapterComment,
} from "@/services/chapterCommentService";
import { profileService } from "@/services/profileService"; //  THÊM IMPORT NÀY
import {
  ReaderSettings,
  getReaderSettings,
  themeConfigs,
} from "@/lib/readerSettings";

// Components
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { ReaderSettingsDialog } from "@/components/reader/ReaderSettings";
import { CommentSection } from "@/components/comments/CommentSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageSquare, Loader2, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// New Components
import { LockedOverlay } from "@/components/reader/LockedOverlay";
import { TranslationControl } from "@/components/reader/TranslationControl";
import { ReaderContent } from "@/components/reader/ReaderContent";
import { TopUpModal } from "@/components/payment/TopUpModal";
import { subscriptionService } from "@/services/subscriptionService";
import { toast } from "sonner";

/**
 * TRANG ĐỌC TRUYỆN CHÍNH - XỬ LÝ ĐỌC CHƯƠNG TRUYỆN
 *
 * MỤC ĐÍCH:
 * - Hiển thị nội dung chương truyện với các tính năng: đọc, dịch, bình luận
 * - Xử lý mua chương, mở khóa chương trả phí
 * - Quản lý cài đặt đọc (theme, font, khoảng cách)
 * - Tích hợp thanh toán và subscription
 *
 * FLOW CHÍNH:
 * 1. Lấy params từ URL (storyId, chapterId)
 * 2. Fetch thông tin chương và kiểm tra trạng thái (free/paid, đã mua/chưa)
 * 3. Xác định hiển thị nội dung hay overlay khóa
 * 4. Xử lý mở khóa chương và cập nhật UI
 * 5. Quản lý bình luận và cài đặt đọc
 *
 * ĐIỂM QUAN TRỌNG:
 * - Xử lý 3 case về quyền sở hữu chương (isOwned = true/false/undefined)
 * - Đồng bộ số dư ví và trạng thái subscription
 * - Debounce và caching cho nội dung chương
 */
export default function ReaderPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const storyId = params.storyId as string;
  const chapterId = params.chapterId as string;

  // --- STATE DỮ LIỆU ---
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [content, setContent] = useState<string>("");
  const [originalContentUrl, setOriginalContentUrl] = useState<string>("");
  const [allChapters, setAllChapters] = useState<ChapterSummary[]>([]);
  const [balance, setBalance] = useState(0); // THÊM STATE BALANCE

  // --- STATE UI & SETTINGS ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ReaderSettings>(getReaderSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "comments">("content");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- STATE COMMENT ---
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  // --- STATE AUTO PLAY ---
  const [autoPlayAfterUnlock, setAutoPlayAfterUnlock] = useState(false);
  //  THÊM STATE: Trạng thái gói cước
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  /**
   * FIX LỖI SCROLL: Luôn cuộn lên đầu khi đổi chương hoặc có nội dung mới
   *
   * MỤC ĐÍCH: Đảm bảo user luôn bắt đầu đọc từ đầu chương
   * TRIGGER: Khi chapterId thay đổi (đổi chương) hoặc content thay đổi (load xong nội dung)
   */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [chapterId, content]);
  /**
   * HELPER: Xử lý lỗi API thống nhất cho toàn bộ component
   *
   * LOGIC XỬ LÝ LỖI THEO THỨ TỰ ƯU TIÊN:
   * 1. Chi tiết validation error từ backend (details)
   * 2. Message chung từ backend (message)
   * 3. Fallback message mặc định
   *
   * @param err - Error object từ axios/catch
   * @param defaultMessage - Message fallback nếu không parse được lỗi
   */
  const handleApiError = (err: any, defaultMessage: string) => {
    // 1. Check lỗi Validation (Details) - thường từ class-validator
    if (err.response && err.response.data && err.response.data.error) {
      const { message, details } = err.response.data.error;
      // Ưu tiên hiển thị lỗi validation chi tiết
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          toast.error(details[firstKey].join(" "));
          return;
        }
      }
      // 2. Message từ Backend nếu không có details
      if (message) {
        toast.error(message);
        return;
      }
    }
    // 3. Fallback: Lỗi chung hoặc lỗi mạng
    const fallbackMsg = err.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  /**
   * EFFECT CHÍNH: Fetch dữ liệu chương truyện
   *
   * FLOW XỬ LÝ:
   * 1. Lấy chi tiết chương từ API
   * 2. Lấy danh sách tất cả chương để backup thông tin
   * 3. Xử lý 3 TRƯỜNG HỢP về quyền sở hữu:
   *    a. isOwned = true: Đã mua -> hiển thị nội dung
   *    b. isOwned = false + free: Chương free -> hiển thị nội dung
   *    c. isOwned = false + paid: Chương trả phí -> hiện overlay khóa
   *    d. isOwned = undefined (API cũ): Fallback logic cũ
   * 4. Fetch nội dung text từ URL nếu có quyền đọc
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // A. Lấy chi tiết chương (Service đã xử lý catch lỗi 403)
        let detail = await chapterCatalogApi.getChapterDetail(chapterId);

        // B. Lấy danh sách tất cả chương để làm dữ liệu dự phòng
        // Khi chương bị khóa, API có thể trả về title rỗng -> cần backup
        const chaptersRes = await chapterCatalogApi.getChapters({
          StoryId: storyId,
          Page: 1,
          PageSize: 100,
        });
        const chapterList = chaptersRes.items;
        setAllChapters(chapterList);

        // --- LOGIC BỔ SUNG: CẬP NHẬT THÔNG TIN HIỂN THỊ KHI BỊ KHÓA ---
        // Nếu chương bị khóa và dữ liệu trả về từ API chi tiết bị trống
        if (
          detail.isLocked &&
          (detail.chapterNo === 0 || detail.title === "Chương bị khóa")
        ) {
          // Tìm thông tin chương từ danh sách backup
          const backupInfo = chapterList.find((c) => c.chapterId === chapterId);
          if (backupInfo) {
            detail = {
              // Merge thông tin từ backup vào detail
              ...detail,
              chapterNo: backupInfo.chapterNo,
              title: backupInfo.title,
            };
          }
        }

        // Cập nhật state chapter sau khi đã có đủ thông tin hiển thị
        setChapter(detail);
        setOriginalContentUrl(detail.contentUrl);

        // --- GIỮ NGUYÊN 3 CASE XỬ LÝ NỘI DUNG  ---

        // CASE 1: isOwned = true -> ĐÃ SỞ HỮU, HIỂN THỊ NỘI DUNG
        if (detail.isOwned === true) {
          if (detail.contentUrl) {
            try {
              const text = await chapterCatalogApi.getChapterContent(
                detail.contentUrl
              );
              setContent(text);
            } catch (err) {
              setError("Không thể tải nội dung văn bản.");
            }
          }
        }
        // CASE 2: isOwned = false -> CHƯA SỞ HỮU
        else if (detail.isOwned === false) {
          // Nếu là chapter free và không bị khóa -> HIỂN THỊ NỘI DUNG
          if (detail.accessType === "free" && !detail.isLocked) {
            if (detail.contentUrl) {
              try {
                const text = await chapterCatalogApi.getChapterContent(
                  detail.contentUrl
                );
                setContent(text);
              } catch (err) {
                setError("Không thể tải nội dung văn bản.");
              }
            }
          }
          // Nếu là chapter trả phí -> KHÔNG tải nội dung, hiện overlay khóa
          else if (detail.accessType === "dias" && detail.isLocked) {
            setContent("");
          }
        }
        // CASE 3: isOwned = undefined (API cũ) -> Fallback logic cũ
        else {
          const shouldLoadContent = !detail.isLocked;
          if (shouldLoadContent && detail.contentUrl) {
            try {
              const text = await chapterCatalogApi.getChapterContent(
                detail.contentUrl
              );
              setContent(text);
            } catch (err) {
              setError("Không thể tải nội dung văn bản.");
            }
          } else if (detail.isLocked) {
            setContent("");
          }
        }
      } catch (err: any) {
        console.error("Lỗi tải chương:", err);
        setError("Không thể tải thông tin chương truyện.");
      } finally {
        setLoading(false);
      }
    };

    if (storyId && chapterId) {
      fetchData();
    }
  }, [chapterId, storyId, refreshKey]); // refreshKey để trigger reload sau khi mua chương

  /**
   * EFFECT 2: LOAD BALANCE KHI USER ĐÃ ĐĂNG NHẬP
   *
   * MỤC ĐÍCH: Hiển thị số dư ví để user biết có đủ tiền mua chương không
   * TRIGGER: Khi user.id thay đổi (login/logout)
   */
  useEffect(() => {
    const loadWallet = async () => {
      if (user?.id) {
        try {
          const res: any = await profileService.getWallet();

          if (res && res.data) {
            // Lấy diaBalance từ trong res.data
            setBalance(res.data.diaBalance || 0);
          }
        } catch (error) {
          console.error("Không thể tải thông tin ví:", error);
          setBalance(0);
        }
      } else {
        setBalance(0);
      }
    };

    loadWallet();
  }, [user?.id]);
  /**
   * EFFECT 3: AUTO PLAY SAU KHI MỞ KHÓA
   *
   * MỤC ĐÍCH: Tự động bật chế độ đọc tự động (auto-play) sau khi mua chương thành công
   * LOGIC: Khi autoPlayAfterUnlock = true và chapter không còn bị khóa -> reset state
   */
  useEffect(() => {
    if (autoPlayAfterUnlock && chapter && !chapter.isLocked) {
      setAutoPlayAfterUnlock(false);
    }
  }, [autoPlayAfterUnlock, chapter]);

  /**
   * EFFECT 4: KIỂM TRA SUBSCRIPTION STATUS
   *
   * MỤC ĐÍCH: Xác định user có active subscription không
   * SUBSCRIPTION: Gói cước premium cho phép đọc không giới hạn
   * ẢNH HƯỞNG: Có thể ảnh hưởng đến giá chương hoặc hiển thị nút mua
   */
  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.id) {
        try {
          const res = await subscriptionService.getStatus();
          setHasActiveSubscription(res.data.hasActiveSubscription);
          console.log("Subscription Status:", res.data.hasActiveSubscription);
        } catch (error) {
          console.error("Lỗi check subscription:", error);
          setHasActiveSubscription(false); // Mặc định là false nếu lỗi
        }
      }
    };
    checkSubscription();
  }, [user?.id]);

  /**
   * EFFECT 5: LOAD COMMENTS KHI CHUYỂN TAB
   *
   * MỤC ĐÍCH: Chỉ load comments khi user click vào tab bình luận
   * OPTIMIZATION: Tránh load không cần thiết khi chỉ đọc nội dung
   */
  useEffect(() => {
    if (chapterId && activeTab === "comments") {
      loadComments(1);
    }
  }, [chapterId, activeTab]);
  /**
   * HÀM LOAD COMMENTS VỚI PHÂN TRANG
   *
   * FLOW:
   * 1. Set loading state
   * 2. Gọi API lấy comments theo page
   * 3. Xử lý phân trang:
   *    - Page 1: Replace toàn bộ comments
   *    - Page > 1: Append thêm vào cuối
   * 4. Kiểm tra hasMore (nếu trả về đủ 20 items = còn tiếp)
   */
  const loadComments = async (page: number = 1) => {
    if (!chapterId) return;
    setCommentsLoading(true);
    try {
      const response = await chapterCommentService.getCommentsByChapter(
        chapterId,
        page,
        20
      );
      if (page === 1) {
        // Trang đầu: reset comments
        setComments(response.items);
        setTotalComments(response.total || response.items.length);
      } else {
        // Trang tiếp: append comments
        setComments((prev) => [...prev, ...response.items]);
      }
      // Kiểm tra còn dữ liệu không (dựa trên số items trả về)
      setHasMoreComments(response.items.length === 20);
      setCommentsPage(page);
    } catch (error) {
      console.error(error);
    } finally {
      setCommentsLoading(false);
    }
  };

  /**
   * COMMENT HANDLER: THÊM BÌNH LUẬN MỚI
   *
   * XỬ LÝ 2 TRƯỜNG HỢP:
   * 1. Bình luận gốc (parentCommentId = undefined): Thêm vào đầu danh sách
   * 2. Reply comment (có parentCommentId): Thêm vào replies của comment cha
   *
   * THUẬT TOÁN: Dùng đệ quy để tìm đúng comment cha trong tree structure
   */
  const handleAddComment = async (
    content: string,
    parentCommentId?: string
  ) => {
    if (!chapterId) return;
    try {
      const newComment = await chapterCommentService.createComment(chapterId, {
        content,
        parentCommentId,
      });

      if (!parentCommentId) {
        // Bình luận gốc: thêm vào đầu
        setComments((prev) => [newComment, ...prev]);
        setTotalComments((prev) => prev + 1);
      } else {
        const addReplyRecursive = (
          // Reply: tìm comment cha và add vào replies
          list: ChapterComment[]
        ): ChapterComment[] => {
          return list.map((c) => {
            if (c.commentId === parentCommentId) {
              return { ...c, replies: [...(c.replies || []), newComment] };
            }
            if (c.replies?.length)
              return { ...c, replies: addReplyRecursive(c.replies) };
            return c;
          });
        };
        setComments((prev) => addReplyRecursive(prev));
      }
      return newComment;
    } catch (error: any) {
      //  Gọi hàm xử lý lỗi
      handleApiError(error, "Gửi bình luận thất bại.");
      throw error;
    }
  };
  /**
   * COMMENT HANDLER: UPDATE COMMENT
   *
   * LOGIC: Gọi API update -> toast success
   * LƯU Ý: UI sẽ tự cập nhật thông qua state management của CommentSection component
   */
  const handleUpdateComment = async (id: string, content: string) => {
    if (!chapterId) return;
    try {
      await chapterCommentService.updateComment(chapterId, id, { content });

      toast.success("Đã chỉnh sửa bình luận.");
    } catch (e: any) {
      //  Gọi hàm xử lý lỗi
      handleApiError(e, "Chỉnh sửa thất bại.");
      throw e;
    }
  };
  /**
   * COMMENT HANDLER: DELETE COMMENT
   *
   * FLOW: Gọi API delete -> toast success
   * LƯU Ý: CommentSection sẽ tự xử lý xóa trên UI
   */
  const handleDeleteComment = async (id: string) => {
    if (!chapterId) return;
    try {
      await chapterCommentService.deleteComment(chapterId, id);

      toast.success("Đã xóa bình luận.");
    } catch (e: any) {
      //  Gọi hàm xử lý lỗi
      handleApiError(e, "Xóa bình luận thất bại.");
    }
  };
  /**
   * COMMENT HANDLER: LIKE COMMENT
   *
   * FLOW: Gọi API like -> reload comments để cập nhật số like
   * OPTIMIZATION: Có thể optimize bằng cách update local state thay vì reload
   */
  const handleLikeComment = async (id: string) => {
    try {
      await chapterCommentService.likeComment(chapterId, id);

      loadComments(commentsPage); // Reload lại trang hiện tại để cập nhật số like
    } catch (e: any) {
      handleApiError(e, "Không thể Like bình luận.");
    }
  };
  /**
   * COMMENT HANDLER: DISLIKE COMMENT
   * Tương tự như like nhưng gọi API dislike
   */
  const handleDislikeComment = async (id: string) => {
    try {
      await chapterCommentService.dislikeComment(chapterId, id);
      loadComments(commentsPage);
    } catch (e: any) {
      handleApiError(e, "Không thể Dislike bình luận.");
    }
  };
  /**
   * COMMENT HANDLER: REMOVE REACTION
   * Xóa cả like/dislike đã thực hiện trước đó
   */
  const handleRemoveReaction = async (id: string) => {
    try {
      await chapterCommentService.removeCommentReaction(chapterId, id);
      loadComments(commentsPage);
    } catch (e: any) {
      handleApiError(e, "Lỗi khi gỡ cảm xúc.");
    }
  };
  const handleLoadMoreComments = () => loadComments(commentsPage + 1);

  /**
   * EFFECT 6: THEO DÕI SCROLL POSITION
   *
   * MỤC ĐÍCH:
   * 1. Hiển thị progress bar trên cùng
   * 2. Hiển thị nút "scroll to top" khi scroll xuống sâu
   *
   * CÔNG THỨC TÍNH PROGRESS:
   * scrollProgress = (scrollTop / (docHeight - windowHeight)) * 100
   */
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(progress, 100)); // Clamp max 100%
      setShowScrollTop(scrollTop > 500); // Hiện nút khi scroll > 500px
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * HELPER: NAVIGATE GIỮA CÁC TRANG
   *
   * XỬ LÝ 3 LOẠI NAVIGATION:
   * 1. Về trang chi tiết truyện
   * 2. Đổi chương khác trong cùng truyện
   * 3. Về trang chủ
   */
  const handleNavigate = (path: string, sId?: string, cId?: string) => {
    if (path === "/story" && sId) router.push(`/story/${sId}`);
    else if (path === "/reader" && sId && cId)
      router.push(`/reader/${sId}/${cId}`);
    else router.push("/");
  };

  /**
   * CALLBACK KHI MỞ KHÓA CHAPTER THÀNH CÔNG
   *
   * FLOW SAU KHI MUA CHƯƠNG:
   * 1. Tăng refreshKey -> trigger reload data
   * 2. Set autoPlayAfterUnlock = true -> bật chế độ đọc tự động
   * 3. Component sẽ tự động fetch lại chapter với trạng thái mới (isOwned = true)
   */
  const handleChapterUnlockSuccess = () => {
    console.log("🎯 Chapter unlocked, refreshing data...");
    setRefreshKey((prev) => prev + 1);
    setAutoPlayAfterUnlock(true);
  };
  /**
   * XỬ LÝ THEME VÀ STYLING
   *
   * themeConfigs: Object chứa config cho các theme (light, dark-blue, transparent)
   * getBorder(): Tính toán màu border dựa trên theme hiện tại
   */
  const theme = themeConfigs[settings.theme] || themeConfigs.light;
  const isDarkTheme = settings.theme === "dark-blue";
  const isTransparent = settings.theme === "transparent";
  const getBorder = () =>
    isDarkTheme
      ? "rgba(240, 234, 214, 0.15)"
      : isTransparent
      ? "rgba(0, 65, 106, 0.1)"
      : "rgba(0, 65, 106, 0.08)";

  /**
   * LOGIC HIỂN THỊ CHÍNH: QUYẾT ĐỊNH CÓ HIỆN OVERLAY KHÓA HAY KHÔNG
   *
   * 4 CASE XỬ LÝ:
   * 1. ĐÃ SỞ HỮU (isOwned = true) -> KHÔNG hiện overlay
   * 2. CHƯA SỞ HỮU + Chapter trả phí -> HIỆN overlay
   * 3. Free chapter -> KHÔNG hiện overlay
   * 4. Fallback cho API cũ (isOwned = undefined)
   */
  const shouldShowLockedOverlay = () => {
    if (!chapter) return false;

    // CASE 1: ĐÃ SỞ HỮU -> KHÔNG hiện overlay
    if (chapter.isOwned === true) {
      return false;
    }

    // CASE 2: CHƯA SỞ HỮU + Chapter trả phí -> HIỆN overlay
    if (
      chapter.isOwned === false &&
      chapter.accessType === "dias" &&
      chapter.isLocked
    ) {
      return true;
    }

    // CASE 3: Free chapter -> KHÔNG hiện overlay
    if (chapter.accessType === "free" && !chapter.isLocked) {
      return false;
    }

    // CASE 4: Fallback cho API cũ
    return chapter.isLocked && chapter.isOwned === false;
  };
  /**
   * HIỂN THỊ LOADING STATE
   * Khi đang fetch dữ liệu chương
   */
  if (loading)
    return (
      <div className="flex h-screen justify-center items-center bg-background">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  /**
   * HIỂN THỊ ERROR STATE
   * Khi không tìm thấy chương
   */
  if (!chapter)
    return (
      <div className="flex h-screen justify-center items-center flex-col gap-4">
        <h1>Không tìm thấy chương</h1>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  /**
   * TÍNH GIÁ THỰC TẾ CỦA CHƯƠNG
   *
   * LOGIC ƯU TIÊN:
   * 1. Lấy từ currentChapterSummary (danh sách chương) nếu có
   * 2. Fallback: lấy từ chapter detail
   * 3. Default: 0
   */
  const currentChapterSummary = allChapters.find(
    (c) => c.chapterId === chapterId
  );
  const realPrice = currentChapterSummary?.priceDias ?? chapter.priceDias ?? 0;
  /**
   * RENDER CHÍNH CỦA COMPONENT
   *
   * CẤU TRÚC GIAO DIỆN:
   * 1. Progress bar (top)
   * 2. Toolbar với navigation và settings
   * 3. Tabs (Content/Comments)
   * 4. Nội dung chính:
   *    - LockedOverlay nếu chương bị khóa
   *    - ReaderContent nếu có quyền đọc
   * 5. Scroll-to-top button
   * 6. Settings dialog và Top-up modal
   */
  return (
    <div
      className="min-h-screen relative transition-colors duration-300 pb-24"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Scroll Bar */}
      <div
        className="fixed top-0 left-0 h-0.5 z-50 transition-all duration-300"
        style={{
          width: `${scrollProgress}%`,
          backgroundColor: "#00416A",
          boxShadow: "0 0 8px rgba(0, 65, 106, 0.5)",
        }}
      />

      {/* Toolbar - Thanh công cụ đọc truyện */}
      <ReaderToolbar
        chapterNo={chapter.chapterNo}
        chapterTitle={chapter.title}
        chapterId={chapterId}
        storyId={storyId}
        chapters={allChapters}
        isDarkTheme={isDarkTheme}
        isTransparent={isTransparent}
        onBack={() => handleNavigate("/story", storyId)}
        onSettings={() => setShowSettings(true)}
        onChapterChange={(id) => handleNavigate("/reader", storyId, id)}
        autoPlayAfterUnlock={autoPlayAfterUnlock}
        setShowTopUpModal={setShowTopUpModal}
        mood={chapter.mood}
        moodMusicPaths={chapter.moodMusicPaths}
        languageCode={chapter.languageCode}
        hasActiveSubscription={hasActiveSubscription}
      >
        {/* Translation Control - Chỉ hiện khi có quyền đọc */}
        {!shouldShowLockedOverlay() && (
          <TranslationControl
            chapterId={chapterId}
            originalContentUrl={originalContentUrl}
            onContentChange={setContent}
            setShowTopUpModal={setShowTopUpModal}
            languageCode={chapter.languageCode}
          />
        )}
      </ReaderToolbar>

      {/* Main Tabs - Tab nội dung và bình luận */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full"
      >
        {/* Sticky Tab Header */}
        <div
          className="sticky z-40 backdrop-blur-xl transition-all duration-300"
          style={{
            top: "49px",
            backgroundColor: isDarkTheme
              ? "rgba(0, 52, 84, 0.98)"
              : "rgba(255, 255, 255, 0.98)",
            borderBottom: `1px solid ${getBorder()}`,
          }}
        >
          <div className="max-w-full mx-auto px-4">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-0">
              <TabsTrigger
                value="content"
                className="data-[state=active]:shadow-none data-[state=active]:border-b-2 rounded-none px-8 py-4"
                style={{
                  color: activeTab === "content" ? theme.text : theme.secondary,
                  borderColor:
                    activeTab === "content" ? "#00416a" : "transparent",
                }}
              >
                <BookOpen className="mr-2 h-4 w-4" />{" "}
                <span className="font-medium">Nội dung</span>
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="data-[state=active]:shadow-none data-[state=active]:border-b-2 rounded-none px-8 py-4"
                style={{
                  color:
                    activeTab === "comments" ? theme.text : theme.secondary,
                  borderColor:
                    activeTab === "comments" ? "#00416a" : "transparent",
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />{" "}
                <span className="font-medium">Bình luận</span>
                {totalComments > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white">
                    {totalComments}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        {/* Tab Content */}
        <div className="w-full px-4 py-8 md:py-12">
          <TabsContent value="content" className="m-0 p-0 focus-visible:ring-0">
            {/* LOGIC HIỂN THỊ CHÍNH */}
            {shouldShowLockedOverlay() ? (
              <LockedOverlay
                chapterId={chapterId}
                priceDias={realPrice}
                onUnlockSuccess={handleChapterUnlockSuccess}
                currentBalance={balance}
                setShowTopUpModal={setShowTopUpModal}
                chapterTitle={chapter?.title || ""}
                chapterNo={chapter?.chapterNo || 0}
                // Lấy tên truyện từ danh sách chương hoặc fallback text
                storyTitle={
                  currentChapterSummary?.title || "Đang tải tên truyện..."
                }
              />
            ) : (
              <ReaderContent
                content={content}
                chapterId={chapterId}
                storyId={storyId}
                chapter={chapter}
                allChapters={allChapters}
                settings={settings}
                theme={theme}
                onNavigate={handleNavigate}
                formatDate={(d) =>
                  new Intl.DateTimeFormat("vi-VN").format(new Date(d))
                }
                formatWordCount={(n) =>
                  new Intl.NumberFormat("vi-VN").format(n)
                }
                getBorder={getBorder}
              />
            )}
          </TabsContent>

          <TabsContent value="comments" className="m-0 p-0">
            {/* ... Code phần comment giữ nguyên ... */}
            <div className="py-4 w-full">
              <CommentSection
                comments={comments}
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onLikeComment={handleLikeComment}
                onDislikeComment={handleDislikeComment}
                onRemoveReaction={handleRemoveReaction}
                loading={commentsLoading}
                hasMore={hasMoreComments}
                onLoadMore={handleLoadMoreComments}
                chapterId={chapterId}
                storyId={storyId}
                currentUserId={user?.id}
                totalCount={totalComments}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-8 z-40 p-3 rounded-full shadow-2xl bg-blue-900 text-white hover:scale-110 transition-all"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      <ReaderSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        onSettingsChange={(newSettings) => setSettings(newSettings)}
      />
      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        currentBalance={balance}
      />
    </div>
  );
}
