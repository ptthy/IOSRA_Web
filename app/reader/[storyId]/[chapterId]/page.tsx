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
import { profileService } from "@/services/profileService"; // 🔥 THÊM IMPORT NÀY
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
  // --- FIX LỖI SCROLL: Luôn cuộn lên đầu khi đổi chương hoặc có nội dung mới ---
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [chapterId, content]);

  // --- HELPER: Xử lý lỗi API (Dùng chung) ---
  const handleApiError = (err: any, defaultMessage: string) => {
    // 1. Check lỗi Validation (Details)
    if (err.response && err.response.data && err.response.data.error) {
      const { message, details } = err.response.data.error;
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          toast.error(details[firstKey].join(" "));
          return;
        }
      }
      // 2. Message từ Backend
      if (message) {
        toast.error(message);
        return;
      }
    }
    // 3. Fallback
    const fallbackMsg = err.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // --- 1. LOAD DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // A. Lấy chi tiết chương
        const detail = await chapterCatalogApi.getChapterDetail(chapterId);
        setChapter(detail);
        console.log("🔥 CHI TIẾT CHAPTER API TRẢ VỀ:", detail);
        setOriginalContentUrl(detail.contentUrl);

        // B. Lấy danh sách tất cả chương
        const chaptersRes = await chapterCatalogApi.getChapters({
          StoryId: storyId,
          Page: 1,
          PageSize: 100,
        });
        setAllChapters(chaptersRes.items);

        //  LOGIC MỚI: XỬ LÝ THEO isOwned
        console.log("🎯 Chapter data:", {
          chapterId: detail.chapterId,
          isLocked: detail.isLocked,
          isOwned: detail.isOwned,
          accessType: detail.accessType,
          contentUrl: detail.contentUrl,
        });

        // CASE 1: isOwned = true -> ĐÃ SỞ HỮU, HIỂN THỊ NỘI DUNG
        if (detail.isOwned === true) {
          console.log("✅ Chapter đã được sở hữu, tải nội dung...");
          if (detail.contentUrl) {
            try {
              const text = await chapterCatalogApi.getChapterContent(
                detail.contentUrl
              );
              setContent(text);
              console.log(
                "✅ Đã tải nội dung thành công, độ dài:",
                text.length
              );
            } catch (err) {
              console.error("❌ Lỗi tải nội dung:", err);
              setError("Không thể tải nội dung văn bản.");
            }
          }
        }
        // CASE 2: isOwned = false -> CHƯA SỞ HỮU
        else if (detail.isOwned === false) {
          console.log("🔒 Chapter chưa sở hữu, kiểm tra điều kiện mở khóa...");

          // Nếu là chapter free và không bị khóa -> HIỂN THỊ NỘI DUNG
          if (detail.accessType === "free" && !detail.isLocked) {
            console.log("📖 Chapter free, tải nội dung...");
            if (detail.contentUrl) {
              try {
                const text = await chapterCatalogApi.getChapterContent(
                  detail.contentUrl
                );
                setContent(text);
              } catch (err) {
                console.error("❌ Lỗi tải nội dung free:", err);
                setError("Không thể tải nội dung văn bản.");
              }
            }
          }
          // Nếu là chapter trả phí -> KHÔNG tải nội dung, hiện overlay khóa
          else if (detail.accessType === "dias" && detail.isLocked) {
            console.log("💰 Chapter trả phí chưa mua, hiện overlay khóa");
            setContent(""); // Đảm bảo không hiện nội dung
          }
        }
        // CASE 3: isOwned = undefined (API cũ) -> Fallback logic cũ
        else {
          console.log("🔄 Sử dụng logic cũ vì isOwned không xác định");
          const shouldLoadContent = !detail.isLocked;
          if (shouldLoadContent && detail.contentUrl) {
            try {
              const text = await chapterCatalogApi.getChapterContent(
                detail.contentUrl
              );
              setContent(text);
            } catch (err) {
              console.error("❌ Lỗi tải text:", err);
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
  }, [chapterId, storyId, refreshKey]);

  //  2. LOAD BALANCE KHI USER ĐÃ ĐĂNG NHẬP
  useEffect(() => {
    const loadWallet = async () => {
      //     if (user?.id) {
      //       try {
      //         const res = await profileService.getWallet();
      //         if (res.data) {
      //           setBalance(res.data.diaBalance || 0);
      //         }
      //       } catch (error) {
      //         console.error("Không thể tải thông tin ví:", error);
      //         setBalance(0);
      //       }
      //     } else {
      //       setBalance(0); // Reset về 0 nếu chưa đăng nhập
      //     }
      //   };

      //   loadWallet();
      // }, [user?.id]); // Chạy lại khi user thay đổi
      if (user?.id) {
        try {
          // SỬA: Thay res bằng data, bỏ .data

          const res: any = await profileService.getWallet(); // Đổi tên thành res cho đỡ lộn

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

  // --- 3. AUTO PLAY SAU KHI MỞ KHÓA ---
  useEffect(() => {
    if (autoPlayAfterUnlock && chapter && !chapter.isLocked) {
      setAutoPlayAfterUnlock(false);
    }
  }, [autoPlayAfterUnlock, chapter]);

  // THÊM: useEffect kiểm tra Subscription
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

  // --- 4. LOAD COMMENTS ---
  useEffect(() => {
    if (chapterId && activeTab === "comments") {
      loadComments(1);
    }
  }, [chapterId, activeTab]);

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
        setComments(response.items);
        setTotalComments(response.total || response.items.length);
      } else {
        setComments((prev) => [...prev, ...response.items]);
      }
      setHasMoreComments(response.items.length === 20);
      setCommentsPage(page);
    } catch (error) {
      console.error(error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // --- COMMENT HANDLERS ---
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
        setComments((prev) => [newComment, ...prev]);
        setTotalComments((prev) => prev + 1);
      } else {
        const addReplyRecursive = (
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
      // } catch (error) {
      //   console.error(error);
      //   throw error;
      // }
    } catch (error: any) {
      //  Gọi hàm xử lý lỗi
      handleApiError(error, "Gửi bình luận thất bại.");
      throw error;
    }
  };

  const handleUpdateComment = async (id: string, content: string) => {
    if (!chapterId) return;
    try {
      await chapterCommentService.updateComment(chapterId, id, { content });
      // } catch (e) {
      //   console.error(e);
      // }
      toast.success("Đã chỉnh sửa bình luận.");
    } catch (e: any) {
      //  Gọi hàm xử lý lỗi
      handleApiError(e, "Chỉnh sửa thất bại.");
      throw e;
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!chapterId) return;
    try {
      await chapterCommentService.deleteComment(chapterId, id);
      // } catch (e) {}
      toast.success("Đã xóa bình luận.");
    } catch (e: any) {
      //  Gọi hàm xử lý lỗi
      handleApiError(e, "Xóa bình luận thất bại.");
    }
  };

  const handleLikeComment = async (id: string) => {
    try {
      await chapterCommentService.likeComment(chapterId, id);
      //loadComments(1);
      loadComments(commentsPage); // Reload lại trang hiện tại để cập nhật số like
    } catch (e: any) {
      handleApiError(e, "Không thể Like bình luận.");
    }
  };
  const handleDislikeComment = async (id: string) => {
    // await chapterCommentService.dislikeComment(chapterId, id);
    // loadComments(1);
    try {
      await chapterCommentService.dislikeComment(chapterId, id);
      loadComments(commentsPage);
    } catch (e: any) {
      handleApiError(e, "Không thể Dislike bình luận.");
    }
  };
  const handleRemoveReaction = async (id: string) => {
    // await chapterCommentService.removeCommentReaction(chapterId, id);
    // loadComments(1);
    try {
      await chapterCommentService.removeCommentReaction(chapterId, id);
      loadComments(commentsPage);
    } catch (e: any) {
      handleApiError(e, "Lỗi khi gỡ cảm xúc.");
    }
  };
  const handleLoadMoreComments = () => loadComments(commentsPage + 1);

  // --- SCROLL ---
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
      setShowScrollTop(scrollTop > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- HELPERS ---
  const handleNavigate = (path: string, sId?: string, cId?: string) => {
    if (path === "/story" && sId) router.push(`/story/${sId}`);
    else if (path === "/reader" && sId && cId)
      router.push(`/reader/${sId}/${cId}`);
    else router.push("/");
  };

  //  CALLBACK KHI MỞ KHÓA CHAPTER THÀNH CÔNG
  const handleChapterUnlockSuccess = () => {
    console.log("🎯 Chapter unlocked, refreshing data...");
    setRefreshKey((prev) => prev + 1);
    setAutoPlayAfterUnlock(true);
  };

  const theme = themeConfigs[settings.theme] || themeConfigs.light;
  const isDarkTheme = settings.theme === "dark-blue";
  const isTransparent = settings.theme === "transparent";
  const getBorder = () =>
    isDarkTheme
      ? "rgba(240, 234, 214, 0.15)"
      : isTransparent
      ? "rgba(0, 65, 106, 0.1)"
      : "rgba(0, 65, 106, 0.08)";

  //  LOGIC HIỂN THỊ CHÍNH THEO isOwned
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
  if (loading)
    return (
      <div className="flex h-screen justify-center items-center bg-background">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  if (!chapter)
    return (
      <div className="flex h-screen justify-center items-center flex-col gap-4">
        <h1>Không tìm thấy chương</h1>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    );

  const currentChapterSummary = allChapters.find(
    (c) => c.chapterId === chapterId
  );
  const realPrice = currentChapterSummary?.priceDias ?? chapter.priceDias ?? 0;

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

      {/* Toolbar */}
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
        hasActiveSubscription={hasActiveSubscription}
      >
        {!shouldShowLockedOverlay() && (
          <TranslationControl
            chapterId={chapterId}
            originalContentUrl={originalContentUrl}
            onContentChange={setContent}
            setShowTopUpModal={setShowTopUpModal}
          />
        )}
      </ReaderToolbar>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full"
      >
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
