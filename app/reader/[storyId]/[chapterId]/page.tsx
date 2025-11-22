// app/reader/[storyId]/[chapterId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Loader2,
  ArrowUp,
  Calendar,
  FileText,
} from "lucide-react";
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { ReaderSettingsDialog } from "@/components/reader/ReaderSettings";
import { HighlightPopover } from "@/components/reader/HightLightPopover";
import { CommentSection } from "@/components/comments/CommentSection";
import {
  ReaderSettings,
  getReaderSettings,
  themeConfigs,
  getHighlights,
  Highlight,
  applyHighlightsToText,
} from "@/lib/readerSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  chapterCatalogApi,
  ChapterDetail,
  ChapterSummary,
} from "@/services/chapterCatalogService";
import {
  chapterCommentService,
  ChapterComment,
} from "@/services/chapterCommentService";
import { useAuth } from "@/context/AuthContext";

// --- ContentRenderer Component ---
const ContentRenderer: React.FC<{
  content: string;
  className?: string;
  style?: React.CSSProperties;
  chapterId?: string; // ← Thêm prop này
}> = ({ content, className = "", style, chapterId }) => {
  const detectContentType = (text: string): "html" | "markdown" | "plain" => {
    if (!text) return "plain";
    const htmlRegex = /<(?!!--)[^>]*>/;
    if (htmlRegex.test(text)) return "html";
    const markdownRegex =
      /(^#{1,6}\s|\*\*.*\*\*|\*.*\*|~~.*~~|> |\- |\d\. |\[.*\]\(.*\))/;
    if (markdownRegex.test(text)) return "markdown";
    return "plain";
  };

  // 🔥 QUAN TRỌNG: Áp dụng highlight trước khi render
  const processedContent = chapterId
    ? applyHighlightsToText(content, getHighlights(chapterId))
    : content;

  const contentType = detectContentType(processedContent);

  // Render HTML với highlight đã được chèn
  const renderHTML = (html: string) => {
    return (
      <div
        className="html-content"
        dangerouslySetInnerHTML={{ __html: html }}
        style={style}
      />
    );
  };

  // Markdown và Plain text cũng cần xử lý highlight → dùng HTML
  const renderMarkdown = (markdown: string) => {
    const processed = markdown
      .replace(/^###### (.*$)/gim, "<h6>$1</h6>")
      .replace(/^##### (.*$)/gim, "<h5>$1</h5>")
      .replace(/^#### (.*$)/gim, "<h4>$1</h4>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/~~(.*?)~~/gim, "<del>$1</del>")
      .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
      .replace(/\n$/gim, "<br />")
      .split("\n\n")
      .map((paragraph) => {
        if (!paragraph.match(/^<(\/)?(h[1-6]|blockquote)/)) {
          return `<p>${paragraph}</p>`;
        }
        return paragraph;
      })
      .join("");

    return renderHTML(processed);
  };

  const formatPlainText = (text: string) => {
    return text.split("\n\n").map((paragraph, index) => (
      <div
        key={index}
        className="mb-6 leading-relaxed transition-opacity duration-300 hover:opacity-90"
        style={style}
        dangerouslySetInnerHTML={{
          __html: paragraph.replace(/\n/g, "<br />"),
        }}
      />
    ));
  };

  switch (contentType) {
    case "html":
      return (
        <div
          className={`html-content ${className}`}
          dangerouslySetInnerHTML={{ __html: processedContent }}
          style={style}
        />
      );

    case "markdown":
      const htmlFromMarkdown = renderMarkdown(content); // content gốc, chưa có highlight
      const finalHtml = applyHighlightsToText(
        htmlFromMarkdown.props.dangerouslySetInnerHTML.__html,
        getHighlights(chapterId || "")
      );
      return (
        <div
          className={`markdown-content ${className}`}
          dangerouslySetInnerHTML={{ __html: finalHtml }}
          style={style}
        />
      );

    case "plain":
    default:
      const plainWithBreaks = content.replace(/\n/g, "<br />");
      const highlightedPlain = applyHighlightsToText(
        plainWithBreaks,
        getHighlights(chapterId || "")
      );
      return (
        <div
          className={`plain-content ${className}`}
          dangerouslySetInnerHTML={{ __html: highlightedPlain }}
          style={style}
        />
      );
  }
};

// --- Main Page Component ---
export default function ReaderPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const storyId = params.storyId as string;
  const chapterId = params.chapterId as string;

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [chapterContent, setChapterContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ReaderSettings>(getReaderSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  const [activeTab, setActiveTab] = useState<"content" | "comments">("content");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [allChapters, setAllChapters] = useState<ChapterSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (chapterId) {
      const loadedHighlights = getHighlights(chapterId);
      console.log(
        `Loaded ${loadedHighlights.length} highlights cho chapter ${chapterId}`
      );
      setHighlights(loadedHighlights);
    }
  }, [chapterId]);
  // Load chapter data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Bước 1: Lấy thông tin chương
        const chapterData = await chapterCatalogApi.getChapterDetail(chapterId);
        setChapter(chapterData);

        // Bước 2: Lấy danh sách tất cả chương để điều hướng
        const chaptersResponse = await chapterCatalogApi.getChapters({
          storyId: storyId,
          page: 1,
          pageSize: 100,
        });
        setAllChapters(chaptersResponse.items);

        // Bước 3: Lấy nội dung từ contentUrl - với xử lý lỗi chi tiết
        if (chapterData.contentUrl && !chapterData.isLocked) {
          try {
            console.log(
              "📖 [Component] Loading content from:",
              chapterData.contentUrl
            );
            const content = await chapterCatalogApi.getChapterContent(
              chapterData.contentUrl
            );
            setChapterContent(content);
            console.log("✅ [Component] Content loaded successfully");
          } catch (contentError) {
            console.error(
              "❌ [Component] Error loading chapter content:",
              contentError
            );
            const errorMessage =
              contentError instanceof Error
                ? contentError.message
                : "Unknown error";
            setError(`Lỗi tải nội dung: ${errorMessage}`);
            setChapterContent(
              "Không thể tải nội dung chương. Vui lòng thử lại sau."
            );
          }
        } else if (chapterData.isLocked) {
          setChapterContent("Nội dung này yêu cầu tài khoản premium để đọc.");
        } else {
          setChapterContent("Nội dung chương hiện không khả dụng.");
        }

        setHighlights(getHighlights(chapterId));
      } catch (error) {
        console.error("❌ [Component] Error loading chapter:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError("Đã xảy ra lỗi khi tải thông tin chương.");
      } finally {
        setLoading(false);
      }
    };

    if (storyId && chapterId) {
      loadData();
    }
  }, [chapterId, storyId]);

  // Load comments khi chapterId hoặc activeTab thay đổi
  useEffect(() => {
    if (chapterId && activeTab === "comments") {
      loadComments();
    }
  }, [chapterId, activeTab]);

  useEffect(() => {
    const savedSettings = getReaderSettings();
    setSettings(savedSettings);
  }, []);

  // 🔥 FIX: Hàm loadComments sửa lỗi đếm comment
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
        // 🔥 FIX: Sử dụng total từ response
        setTotalComments(response.total || response.items.length);
      } else {
        setComments((prev) => [...prev, ...response.items]);
      }

      setHasMoreComments(response.items.length === 20);
      setCommentsPage(page);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Thêm comment mới với hỗ trợ reply
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
        // Nếu là comment gốc
        setComments((prev) => [newComment, ...prev]);
        setTotalComments((prev) => prev + 1);
      } else {
        // Nếu là reply, cập nhật comment cha
        const addReplyRecursive = (
          comments: ChapterComment[]
        ): ChapterComment[] => {
          return comments.map((comment) => {
            if (comment.commentId === parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment],
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: addReplyRecursive(comment.replies),
              };
            }
            return comment;
          });
        };

        setComments((prev) => addReplyRecursive(prev));
      }

      return newComment;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  };

  // Update comment với hỗ trợ recursive
  const updateCommentRecursive = (
    list: ChapterComment[],
    id: string,
    content: string
  ): ChapterComment[] => {
    return list.map((c) => {
      if (c.commentId === id)
        return { ...c, content, updatedAt: new Date().toISOString() };
      if (c.replies && c.replies.length > 0)
        return {
          ...c,
          replies: updateCommentRecursive(c.replies, id, content),
        };
      return c;
    });
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    if (!chapterId) return;

    try {
      await chapterCommentService.updateComment(chapterId, commentId, {
        content,
      });

      setComments((prev) => updateCommentRecursive(prev, commentId, content));
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  };

  // Delete comment với hỗ trợ recursive
  const deleteCommentRecursive = (
    list: ChapterComment[],
    id: string
  ): ChapterComment[] => {
    return list
      .filter((c) => c.commentId !== id)
      .map((c) => {
        if (c.replies && c.replies.length > 0)
          return { ...c, replies: deleteCommentRecursive(c.replies, id) };
        return c;
      });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!chapterId) return;

    try {
      await chapterCommentService.deleteComment(chapterId, commentId);

      // Đếm số comment sẽ bị xóa (bao gồm cả replies)
      const countDeletedComments = (
        comments: ChapterComment[],
        targetId: string
      ): number => {
        let count = 0;
        const findAndCount = (commentList: ChapterComment[]) => {
          commentList.forEach((comment) => {
            if (comment.commentId === targetId) {
              count += 1 + (comment.replies ? comment.replies.length : 0);
            } else if (comment.replies) {
              findAndCount(comment.replies);
            }
          });
        };
        findAndCount(comments);
        return count;
      };

      const deletedCount = countDeletedComments(comments, commentId);
      setComments((prev) => deleteCommentRecursive(prev, commentId));
      setTotalComments((prev) => Math.max(0, prev - deletedCount));
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  };

  // Like comment - tối ưu với reload comments
  const handleLikeComment = async (commentId: string) => {
    if (!chapterId) return;

    try {
      await chapterCommentService.likeComment(chapterId, commentId);
      // Reload comments để có data mới nhất
      loadComments(1);
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  // Dislike comment - tối ưu với reload comments
  const handleDislikeComment = async (commentId: string) => {
    if (!chapterId) return;

    try {
      await chapterCommentService.dislikeComment(chapterId, commentId);
      // Reload comments để có data mới nhất
      loadComments(1);
    } catch (error) {
      console.error("Error disliking comment:", error);
    }
  };

  // Remove reaction - tối ưu với reload comments
  const handleRemoveReaction = async (commentId: string) => {
    if (!chapterId) return;

    try {
      await chapterCommentService.removeCommentReaction(chapterId, commentId);
      // Reload comments để có data mới nhất
      loadComments(1);
    } catch (error) {
      console.error("Error removing reaction:", error);
    }
  };

  const handleLoadMoreComments = () => {
    loadComments(commentsPage + 1);
  };

  // Scroll progress tracking
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

  useEffect(() => {
    //   const handleSelection = () => {
    //     const selection = window.getSelection();
    //     const text = selection?.toString().trim();

    //     if (text && text.length > 0 && activeTab === "content") {
    //       setSelectedText(text);
    //       const range = selection?.getRangeAt(0);
    //       const rect = range?.getBoundingClientRect();

    //       if (rect) {
    //         setSelectionPosition({
    //           x: rect.left + rect.width / 2,
    //           y: rect.top - 10,
    //         });
    //       }
    //     } else {
    //       setSelectedText("");
    //       setSelectionPosition(null);
    //     }
    //   };

    //   document.addEventListener("mouseup", handleSelection);
    //   document.addEventListener("touchend", handleSelection);

    //   return () => {
    //     document.removeEventListener("mouseup", handleSelection);
    //     document.removeEventListener("touchend", handleSelection);
    //   };
    // }, [activeTab]);
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      console.log("🔍 Selection detected:", {
        text,
        hasText: !!text,
        activeTab,
        selectionLength: text?.length,
      });

      if (text && text.length > 0 && activeTab === "content") {
        setSelectedText(text);
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          // Tính toán vị trí chính xác hơn
          const position = {
            x: rect.left + window.scrollX + rect.width / 2,
            y: rect.top + window.scrollY - 50, // Đưa lên trên một chút
          };

          setSelectionPosition(position);
          console.log("🎯 Popover position set:", position);
        }
      } else {
        setSelectedText("");
        setSelectionPosition(null);
      }
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, [activeTab]);
  const handleNavigate = (
    page: string,
    storyId?: string,
    chapterId?: string
  ) => {
    if (page === "/story" && storyId) {
      router.push(`/story/${storyId}`);
    } else if (page === "/reader" && storyId && chapterId) {
      router.push(`/reader/${storyId}/${chapterId}`);
    } else if (page === "/") {
      router.push("/");
    }
  };

  // Tìm chương trước và chương tiếp theo
  const getAdjacentChapters = () => {
    if (!chapter || allChapters.length === 0) return { prev: null, next: null };

    const sortedChapters = [...allChapters].sort(
      (a, b) => a.chapterNo - b.chapterNo
    );
    const currentIndex = sortedChapters.findIndex(
      (ch) => ch.chapterId === chapterId
    );

    return {
      prev: currentIndex > 0 ? sortedChapters[currentIndex - 1] : null,
      next:
        currentIndex < sortedChapters.length - 1
          ? sortedChapters[currentIndex + 1]
          : null,
    };
  };

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Format word count function
  const formatWordCount = (wordCount: number) => {
    return new Intl.NumberFormat("vi-VN").format(wordCount);
  };

  const { prev: prevChapter, next: nextChapter } = getAdjacentChapters();

  if (loading) {
    return (
      <div className="min-h-screen">
        <div
          className="flex items-center justify-center min-h-[60vh]"
          style={{ backgroundColor: themeConfigs.light.bg }}
        >
          <div className="text-center">
            <Loader2
              className="h-12 w-12 animate-spin mx-auto mb-4"
              style={{ color: "#00416A" }}
            />
            <p className="text-sm" style={{ color: "#666" }}>
              Đang tải chương...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Thêm phần hiển thị lỗi
  if (error && !loading) {
    return (
      <div className="min-h-screen">
        <div
          className="flex flex-col items-center justify-center min-h-[60vh]"
          style={{ backgroundColor: themeConfigs.light.bg }}
        >
          <BookOpen
            className="h-16 w-16 mb-4"
            style={{ color: "#00416A", opacity: 0.5 }}
          />
          <p className="mb-4 text-center max-w-md" style={{ color: "#666" }}>
            {error}
          </p>
          <div className="flex gap-4">
            <Button onClick={() => handleNavigate("/")} className="bg-primary">
              Quay lại Trang Chủ
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Thử Lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen">
        <div
          className="flex flex-col items-center justify-center min-h-[60vh]"
          style={{ backgroundColor: themeConfigs.light.bg }}
        >
          <BookOpen
            className="h-16 w-16 mb-4"
            style={{ color: "#00416A", opacity: 0.5 }}
          />
          <p className="mb-4" style={{ color: "#666" }}>
            Không tìm thấy chương
          </p>
          <Button onClick={() => handleNavigate("/")} className="bg-primary">
            Quay lại Trang Chủ
          </Button>
        </div>
      </div>
    );
  }

  const theme = themeConfigs[settings.theme] || themeConfigs.light;

  const wordsPerPage = 500;
  const words = chapterContent.split(/\s+/);
  const totalPages = Math.ceil(words.length / wordsPerPage);

  const getPageContent = (pageIndex: number) => {
    const start = pageIndex * wordsPerPage;
    const end = start + wordsPerPage;
    return words.slice(start, end).join(" ");
  };

  // Cập nhật font chữ theo yêu cầu
  const fontFamilyMap: Record<string, string> = {
    serif: "'Times New Roman', Times, serif", // Times New Roman cho chữ có chân
    "sans-serif": "'Poppins', Arial, sans-serif", // Poppins cho chữ không chân
  };

  const readerStyle = {
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    fontFamily: fontFamilyMap[settings.fontFamily] || fontFamilyMap.serif,
    color: theme.text,
  };

  //   const contentOverrideStyle = `
  //   .reader-content p,
  //   .reader-content div,
  //   .reader-content h1,
  //   .reader-content h2,
  //   .reader-content h3,
  //   .reader-content h4,
  //   .reader-content blockquote,
  //   .plain-content > div,
  //   .markdown-content p,
  //   .html-content p {
  //     line-height: ${settings.lineHeight} !important;
  //     margin-bottom: 1.5em !important;
  //   }
  //   .plain-content > div {
  //     margin-bottom: 1.5em !important;
  //   }
  // `;
  const contentOverrideStyle = `
  .reader-content * {
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
  }
  
  .reader-content p,
  .reader-content div,
  .reader-content h1,
  .reader-content h2,
  .reader-content h3,
  .reader-content h4,
  .reader-content blockquote,
  .plain-content > div,
  .markdown-content p,
  .html-content p {
    line-height: ${settings.lineHeight} !important;
    margin-bottom: 1.5em !important;
    user-select: text !important;
    -webkit-user-select: text !important;
  }
  
  .plain-content > div {
    margin-bottom: 1.5em !important;
    user-select: text !important;
    -webkit-user-select: text !important;
  }
  
  /* Đảm bảo popover hiển thị trên cùng */
  .fixed {
    z-index: 9999 !important;
  }
`;
  const isTransparent = settings.theme === "transparent";
  const isDarkTheme = settings.theme === "dark-blue";

  const getBorder = () => {
    if (isDarkTheme) return "rgba(240, 234, 214, 0.15)";
    if (isTransparent) return "rgba(0, 65, 106, 0.1)";
    return "rgba(0, 65, 106, 0.08)";
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen relative transition-colors duration-300"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
      }}
    >
      <style>{contentOverrideStyle}</style>
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-0.5 z-50 transition-all duration-300"
        style={{
          width: `${scrollProgress}%`,
          backgroundColor: "#00416A",
          boxShadow: "0 0 8px rgba(0, 65, 106, 0.5)",
        }}
      />

      {/* Main Navbar */}

      <ReaderToolbar
        chapterNo={chapter.chapterNo}
        chapterTitle={chapter.title}
        chapterId={chapterId}
        isDarkTheme={isDarkTheme}
        isTransparent={isTransparent}
        onBack={() => handleNavigate("/story", storyId)}
        onSettings={() => setShowSettings(true)}
      />

      {/* Elegant Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value: string) =>
          setActiveTab(value as "content" | "comments")
        }
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
                className="data-[state=active]:shadow-none data-[state=active]:border-b-2 rounded-none px-8 py-4 transition-all duration-200 relative group"
                style={{
                  color: activeTab === "content" ? theme.text : theme.secondary,
                  borderColor:
                    activeTab === "content" ? "#00416a" : "transparent",
                  backgroundColor: "transparent",
                }}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                <span className="font-medium">Nội dung</span>
              </TabsTrigger>

              <TabsTrigger
                value="comments"
                className="data-[state=active]:shadow-none data-[state=active]:border-b-2 rounded-none px-8 py-4 transition-all duration-200 relative group"
                style={{
                  color:
                    activeTab === "comments" ? theme.text : theme.secondary,
                  borderColor:
                    activeTab === "comments" ? "#00416a" : "transparent",
                  backgroundColor: "transparent",
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="font-medium">Bình luận</span>
                {totalComments > 0 && (
                  <Badge
                    className="ml-2 px-2 py-0.5 text-xs font-medium transition-colors duration-200 border"
                    style={{
                      backgroundColor:
                        activeTab === "comments"
                          ? "#00416a"
                          : isDarkTheme
                          ? "rgba(255, 255, 255, 0.15)"
                          : "rgba(0, 0, 0, 0.05)",
                      color: activeTab === "comments" ? "#FFFFFF" : theme.text,
                      borderColor: isDarkTheme
                        ? "rgba(255,255,255,0.1)"
                        : "transparent",
                    }}
                  >
                    {totalComments}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Container chính - sử dụng toàn bộ chiều rộng */}
        <div className="w-full px-4 py-8 md:py-12">
          <TabsContent value="content" className="m-0 p-0 focus-visible:ring-0">
            {settings.readingMode === "scroll" ? (
              <div className="space-y-8">
                {/* Premium Chapter Header */}
                <div className="text-center py-12 relative">
                  <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${getBorder()}, transparent)`,
                    }}
                  />

                  <div className="w-full max-w-6xl mx-auto">
                    <p
                      className="text-xs uppercase tracking-[0.2em] mb-3 font-medium"
                      style={{ color: theme.secondary }}
                    >
                      Chương {chapter.chapterNo}
                    </p>
                    <h1
                      className="text-3xl md:text-4xl lg:text-5xl mb-6 leading-tight px-4"
                      style={{
                        color: theme.text,
                        fontWeight: 400,
                        fontFamily: readerStyle.fontFamily,
                      }}
                    >
                      {chapter.title}
                    </h1>

                    {/* Thông tin ngày đăng và số từ */}
                    <div className="flex justify-center items-center gap-6 mb-6">
                      <div
                        className="flex items-center gap-2"
                        style={{ color: theme.secondary }}
                      >
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {formatDate(chapter.publishedAt)}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        style={{ color: theme.secondary }}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">
                          {formatWordCount(chapter.wordCount)} từ
                        </span>
                      </div>
                    </div>

                    {/* Decorative Divider */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div
                        className="w-16 h-px"
                        style={{ backgroundColor: getBorder() }}
                      />
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: "#00416A" }}
                      />
                      <div
                        className="w-16 h-px"
                        style={{ backgroundColor: getBorder() }}
                      />
                    </div>
                  </div>

                  <div
                    className="absolute inset-x-0 bottom-0 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${getBorder()}, transparent)`,
                    }}
                  />
                </div>

                {/* Premium Content - Chiếm toàn bộ chiều rộng có sẵn */}
                <div className="reader-content" style={readerStyle}>
                  <ContentRenderer
                    content={chapterContent}
                    chapterId={chapterId}
                    className="w-full max-w-full content-text"
                    style={{
                      color: theme.text,
                      textAlign: "justify" as const,
                      lineHeight: settings.lineHeight,
                      // fontSize: `${settings.fontSize}px`,
                    }}
                  />
                </div>

                {/* Premium Navigation */}
                <div className="pt-16 pb-12 mt-16 relative">
                  <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${getBorder()}, transparent)`,
                    }}
                  />

                  <div className="flex justify-between items-center gap-4 w-full max-w-6xl mx-auto mt-12">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() =>
                        prevChapter &&
                        handleNavigate(
                          "/reader",
                          storyId,
                          prevChapter.chapterId
                        )
                      }
                      disabled={!prevChapter}
                      className="group flex-1 max-w-[240px] h-14 text-lg transition-all duration-300 hover:scale-105"
                      style={{
                        borderColor: getBorder(),
                        color: theme.text,
                        backgroundColor: "transparent",
                      }}
                    >
                      <ChevronLeft className="mr-2 h-6 w-6 transition-transform group-hover:-translate-x-1" />
                      <span className="font-semibold">Chương trước</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() =>
                        nextChapter &&
                        handleNavigate(
                          "/reader",
                          storyId,
                          nextChapter.chapterId
                        )
                      }
                      disabled={!nextChapter}
                      className="group flex-1 max-w-[240px] h-14 text-lg transition-all duration-300 hover:scale-105"
                      style={{
                        borderColor: getBorder(),
                        color: theme.text,
                        backgroundColor: "transparent",
                      }}
                    >
                      <span className="font-semibold">Chương sau</span>
                      <ChevronRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Premium Book Mode - Chiếm toàn bộ chiều rộng */}
                <div
                  className="relative group transition-all duration-500 hover:shadow-2xl w-full"
                  style={{
                    perspective: "2000px",
                  }}
                >
                  <div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[700px] rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-500 w-full"
                    style={{
                      backgroundColor: isDarkTheme
                        ? "rgba(0, 52, 84, 0.5)"
                        : isTransparent
                        ? "rgba(255, 255, 255, 0.7)"
                        : theme.card,
                      border: `2px solid ${getBorder()}`,
                      boxShadow:
                        "0 20px 60px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {/* Left Page */}
                    <div
                      className="p-8 lg:p-12 select-text relative transition-all duration-300 w-full"
                      style={readerStyle}
                    >
                      <div className="w-full h-full flex flex-col">
                        {currentPage === 0 && (
                          <div
                            className="mb-8 pb-6 border-b"
                            style={{ borderColor: getBorder() }}
                          >
                            <p
                              className="text-xs uppercase tracking-[0.15em] mb-2 font-medium"
                              style={{ color: theme.secondary }}
                            >
                              Chương {chapter.chapterNo}
                            </p>
                            <h2
                              className="text-2xl mb-2"
                              style={{
                                color: theme.text,
                                fontWeight: 400,
                                fontFamily: readerStyle.fontFamily,
                              }}
                            >
                              {chapter.title}
                            </h2>

                            {/* Thông tin ngày đăng và số từ */}
                            <div
                              className="flex items-center gap-4 text-xs"
                              style={{ color: theme.secondary }}
                            >
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(chapter.publishedAt)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>
                                  {formatWordCount(chapter.wordCount)} từ
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="reader-content" style={readerStyle}>
                          <ContentRenderer
                            content={getPageContent(currentPage)}
                            chapterId={chapterId}
                            className="w-full"
                            style={{
                              color: theme.text,
                              textAlign: "justify" as const,
                              lineHeight: settings.lineHeight,
                            }}
                          />
                        </div>

                        {/* Page Number - Left */}
                        <div
                          className="flex justify-center mt-6 pt-4 border-t"
                          style={{ borderColor: getBorder() }}
                        >
                          <span
                            className="text-xs font-medium"
                            style={{ color: theme.secondary }}
                          >
                            {currentPage + 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Center Binding Shadow */}
                    <div
                      className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-8 pointer-events-none -ml-4"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${
                          isDarkTheme
                            ? "rgba(0, 0, 0, 0.2)"
                            : "rgba(0, 0, 0, 0.05)"
                        } 50%, transparent)`,
                      }}
                    />

                    {/* Right Page */}
                    {currentPage < totalPages - 1 && (
                      <div
                        className="p-8 lg:p-12 select-text hidden lg:block border-l relative transition-all duration-300 w-full"
                        style={{ borderColor: getBorder(), ...readerStyle }}
                      >
                        <div className="w-full h-full flex flex-col">
                          <div className="flex-1 w-full">
                            <ContentRenderer
                              content={getPageContent(currentPage + 1)}
                              chapterId={chapterId}
                              className="w-full"
                              style={{
                                color: theme.text,
                                textAlign: "justify" as const,
                                lineHeight: settings.lineHeight,
                              }}
                            />
                          </div>

                          {/* Page Number - Right */}
                          <div
                            className="flex justify-center mt-6 pt-4 border-t"
                            style={{ borderColor: getBorder() }}
                          >
                            <span
                              className="text-xs font-medium"
                              style={{ color: theme.secondary }}
                            >
                              {currentPage + 2}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Book Navigation */}
                <div className="flex justify-between items-center gap-4 w-full max-w-6xl mx-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 2))}
                    disabled={currentPage === 0}
                    className="group h-14 text-lg transition-all duration-300 hover:scale-105"
                    style={{
                      borderColor: getBorder(),
                      color: theme.text,
                    }}
                  >
                    <ChevronLeft className="mr-2 h-6 w-6 transition-transform group-hover:-translate-x-1" />
                    <span className="font-semibold">Trang trước</span>
                  </Button>

                  <div className="flex flex-col items-center gap-2">
                    <span
                      className="text-lg px-6 py-3 rounded-full font-semibold"
                      style={{
                        color: theme.text,
                        backgroundColor: `${theme.text}10`,
                      }}
                    >
                      {currentPage + 1}-{Math.min(currentPage + 2, totalPages)}{" "}
                      / {totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages - 1, p + 2))
                    }
                    disabled={currentPage >= totalPages - 2}
                    className="group h-14 text-lg transition-all duration-300 hover:scale-105"
                    style={{
                      borderColor: getBorder(),
                      color: theme.text,
                    }}
                  >
                    <span className="font-semibold">Trang sau</span>
                    <ChevronRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="comments"
            className="m-0 p-0 focus-visible:ring-0"
          >
            {/* Phần bình luận chiếm toàn bộ chiều rộng */}
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

      {/* Floating Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
          style={{
            backgroundColor: "#00416A",
            color: "#FFFFFF",
          }}
        >
          <ArrowUp className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
        </button>
      )}

      {/* {selectedText && selectionPosition && activeTab === "content" && (
        <HighlightPopover
          selectedText={selectedText}
          chapterId={chapterId}
          position={selectionPosition}
          onHighlightCreated={() => {
            setHighlights(getHighlights(chapterId));
            setSelectedText("");
            setSelectionPosition(null);
            window.getSelection()?.removeAllRanges();
          }}
        />
      )} */}
      {selectedText && selectionPosition && activeTab === "content" && (
        <HighlightPopover
          selectedText={selectedText}
          chapterId={chapterId}
          position={selectionPosition}
          onHighlightCreated={() => {
            console.log("🟡 Highlight created, refreshing highlights...");
            const newHighlights = getHighlights(chapterId);
            setHighlights(newHighlights);
            console.log("🟡 New highlights:", newHighlights);

            setSelectedText("");
            setSelectionPosition(null);

            // Clear selection
            if (window.getSelection) {
              window.getSelection()?.removeAllRanges();
            }
          }}
        />
      )}
      <ReaderSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        onSettingsChange={(newSettings) => {
          setSettings(newSettings);
          if (newSettings.readingMode === "book") {
            setCurrentPage(0);
          }
        }}
      />
    </div>
  );
}
