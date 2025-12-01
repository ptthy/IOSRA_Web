// app/story/[storyId]/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { favoriteStoryService } from "@/services/favoriteStoryService";
import { StoryRatingActions } from "@/components/StoryRatingActions";
import { StoryRatingSummary } from "@/components/StoryRatingSummary";
import { StoryRatingList } from "@/components/StoryRatingList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommentSection } from "@/components/comments/CommentSection";
import {
  BookOpen,
  Clock,
  Eye,
  Loader2,
  MessageSquare,
  Star,
  ArrowUpDown,
  Heart,
  Lock,
  Flag,
  AlertCircle,
  FileText,
} from "lucide-react";
import { storyCatalogApi, Story } from "@/services/storyCatalog";
import {
  chapterCatalogApi,
  ChapterSummary,
} from "@/services/chapterCatalogService";
import {
  storyRatingApi,
  type StoryRating,
} from "@/services/storyRatingService";
import {
  chapterCommentService,
  ChapterComment,
} from "@/services/chapterCommentService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { StoryFavoriteAction } from "@/components/StoryFavoriteAction";
import { ReportModal } from "@/components/report/ReportModal";
import { ReportChapterSelector } from "@/components/report/ReportChapterSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Component ImageWithFallback
function ImageWithFallback({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const ERROR_IMG_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${
          className || ""
        }`}
      >
        <img
          src={ERROR_IMG_SRC}
          alt="Error loading image"
          className="w-20 h-20 opacity-50"
        />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
    />
  );
}

type SortOption = "newest" | "oldest";

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.storyId as string;
  const { user } = useAuth();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [storyRating, setStoryRating] = useState<StoryRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chapters");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [totalComments, setTotalComments] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: "story" | "chapter";
    id: string;
    title: string;
  } | null>(null);
  //  THÊM: State để kiểm tra chế độ tối
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    // Logic đơn giản để check theme (bạn có thể thay bằng hook theme của bạn)
    // Kiểm tra class 'dark' trên html hoặc system preference
    const checkTheme = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkTheme(isDark);
    };
    checkTheme();
    // Lắng nghe thay đổi (optional)
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // --- Helper Recursive Functions ---
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

  const addReplyToState = (
    comments: ChapterComment[],
    parentId: string,
    newReply: ChapterComment
  ): ChapterComment[] => {
    return comments.map((c) => {
      if (c.commentId === parentId) {
        // 🔥 FIX: Thêm vào đầu mảng replies
        return {
          ...c,
          replies: c.replies ? [newReply, ...c.replies] : [newReply],
        };
      } else if (c.replies && c.replies.length > 0) {
        return {
          ...c,
          replies: addReplyToState(c.replies, parentId, newReply),
        };
      }
      return c;
    });
  };

  const findCommentById = (
    comments: ChapterComment[],
    id: string
  ): ChapterComment | null => {
    for (const comment of comments) {
      if (comment.commentId === id) return comment;
      if (comment.replies && comment.replies.length > 0) {
        const found = findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  };
  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [storyData, chaptersData, ratingData] = await Promise.all([
          storyCatalogApi.getStoryById(storyId),
          chapterCatalogApi.getChapters({
            StoryId: storyId,
            Page: 1,
            PageSize: 50,
          }),
          storyRatingApi.getStoryRating(storyId),
        ]);

        setStory(storyData);
        setChapters(chaptersData.items);
        setStoryRating(ratingData);

        try {
          const commentsResponse =
            await chapterCommentService.getCommentsByStory(storyId, {
              page: 1,
              pageSize: 1,
            });
          setTotalComments(commentsResponse.comments.total || 0);
        } catch (e) {
          console.error(e);
        }
      } catch (error) {
        console.error("Error loading story:", error);
      } finally {
        setLoading(false);
      }
    };
    if (storyId) loadData();
  }, [storyId]);

  useEffect(() => {
    if (storyId && activeTab === "comments") loadComments();
  }, [storyId, activeTab, selectedChapter]);

  const loadComments = async (page: number = 1) => {
    if (!storyId) return;
    setCommentsLoading(true);
    try {
      const options: any = { page, pageSize: 20 };
      if (selectedChapter !== "all") options.chapterId = selectedChapter;

      const response = await chapterCommentService.getCommentsByStory(
        storyId,
        options
      );

      if (page === 1) {
        setComments(response.comments.items);
        setTotalComments(
          response.comments.total || response.comments.items.length
        );
      } else {
        setComments((prev) => [...prev, ...response.comments.items]);
      }
      setHasMoreComments(response.comments.items.length === 20);
      setCommentsPage(page);
    } catch (error) {
      console.error(error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // 🔥 FIX QUAN TRỌNG: Handle Add Comment có hỗ trợ ParentId (Reply)
  const handleAddComment = async (
    content: string,
    parentCommentId?: string
  ) => {
    if (!storyId || chapters.length === 0) return;

    try {
      // Trường hợp 1: Trả lời bình luận (Reply) -> Sơ đồ con
      if (parentCommentId) {
        const parentComment = findCommentById(comments, parentCommentId);
        if (!parentComment) throw new Error("Parent comment not found");

        const newReply = await chapterCommentService.createComment(
          parentComment.chapterId,
          { content, parentCommentId }
        );

        // Cập nhật state đệ quy để hiển thị ngay lập tức
        setComments((prev) => addReplyToState(prev, parentCommentId, newReply));
        setTotalComments((prev) => prev + 1);

        // Quan trọng: Return để CommentSection biết đã thành công
        return newReply;
      }

      // Trường hợp 2: Bình luận gốc (Root)
      else {
        let targetChapterId: string;
        if (selectedChapter !== "all") {
          targetChapterId = selectedChapter;
        } else {
          const firstChapter = getFirstChapter();
          if (!firstChapter) throw new Error("No chapters available");
          targetChapterId = firstChapter.chapterId;
        }

        const newComment = await chapterCommentService.createComment(
          targetChapterId,
          { content }
        );

        setComments((prev) => [newComment, ...prev]);
        setTotalComments((prev) => prev + 1);
        return newComment;
      }
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      const comment = findCommentById(comments, commentId);
      if (!comment) return;
      await chapterCommentService.updateComment(comment.chapterId, commentId, {
        content,
      });
      setComments((prev) => updateCommentRecursive(prev, commentId, content));
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const comment = findCommentById(comments, commentId);
      if (!comment) return;
      await chapterCommentService.deleteComment(comment.chapterId, commentId);
      setComments((prev) => deleteCommentRecursive(prev, commentId));
      setTotalComments((prev) => (prev > 0 ? prev - 1 : 0));
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Reaction Logic (Giữ nguyên logic recursive của bạn)
  const updateReactionRecursive = (
    list: ChapterComment[],
    commentId: string,
    reactionType: "like" | "dislike" | null
  ): ChapterComment[] => {
    return list.map((comment) => {
      if (comment.commentId === commentId) {
        let newLike = comment.likeCount || 0;
        let newDislike = comment.dislikeCount || 0;
        const current = comment.viewerReaction;

        if (reactionType === "like") {
          if (current === "like") newLike--;
          else if (current === "dislike") {
            newLike++;
            newDislike--;
          } else newLike++;
        } else if (reactionType === "dislike") {
          if (current === "dislike") newDislike--;
          else if (current === "like") {
            newDislike++;
            newLike--;
          } else newDislike++;
        } else {
          // Remove reaction
          if (current === "like") newLike--;
          if (current === "dislike") newDislike--;
        }
        return {
          ...comment,
          likeCount: newLike,
          dislikeCount: newDislike,
          viewerReaction: reactionType,
        };
      }
      if (comment.replies?.length)
        return {
          ...comment,
          replies: updateReactionRecursive(
            comment.replies,
            commentId,
            reactionType
          ),
        };
      return comment;
    });
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const comment = findCommentById(comments, commentId);
      if (!comment) return;
      await chapterCommentService.likeComment(comment.chapterId, commentId);
      setComments((prev) =>
        updateReactionRecursive(
          prev,
          commentId,
          comment.viewerReaction === "like" ? null : "like"
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleDislikeComment = async (commentId: string) => {
    try {
      const comment = findCommentById(comments, commentId);
      if (!comment) return;
      await chapterCommentService.dislikeComment(comment.chapterId, commentId);
      setComments((prev) =>
        updateReactionRecursive(
          prev,
          commentId,
          comment.viewerReaction === "dislike" ? null : "dislike"
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveReaction = async (commentId: string) => {
    try {
      const comment = findCommentById(comments, commentId);
      if (!comment) return;
      await chapterCommentService.removeCommentReaction(
        comment.chapterId,
        commentId
      );
      setComments((prev) => updateReactionRecursive(prev, commentId, null));
    } catch (error) {
      console.error(error);
    }
  };

  const handleLoadMoreComments = () => loadComments(commentsPage + 1);
  const handleChapterFilterChange = (id: string) => {
    setSelectedChapter(id);
    setCommentsPage(1);
  };

  const getFirstChapter = () => {
    if (chapters.length === 0) return null;
    return [...chapters].sort((a, b) => a.chapterNo - b.chapterNo)[0];
  };

  const sortedChapters = useMemo(() => {
    const copy = [...chapters];
    return sortOption === "newest"
      ? copy.sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
      : copy.sort(
          (a, b) =>
            new Date(a.publishedAt).getTime() -
            new Date(b.publishedAt).getTime()
        );
  }, [chapters, sortOption]);

  const handleRatingUpdate = async () => {
    try {
      setStoryRating(await storyRatingApi.getStoryRating(storyId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigate = (page: string, sId?: string, cId?: string) => {
    if (page === "/reader" && sId && cId) router.push(`/reader/${sId}/${cId}`);
    else if (page === "/") router.push("/");
  };

  const handleReadFromStart = () => {
    const first = getFirstChapter();
    if (first) handleNavigate("/reader", storyId, first.chapterId);
  };
  const handleReportStory = () => {
    if (!story) return;
    setReportTarget({
      type: "story",
      id: story.storyId,
      title: story.title,
    });
    setShowReportModal(true);
  };

  const handleReportChapter = () => {
    setShowChapterSelector(true);
  };

  const handleChapterSelected = (chapter: ChapterSummary) => {
    setShowChapterSelector(false);
    setReportTarget({
      type: "chapter",
      id: chapter.chapterId,
      title: `Chương ${chapter.chapterNo}: ${chapter.title}`,
    });
    setShowReportModal(true); // Mở form báo cáo sau khi chọn chương
  };
  // Render Loading/Error/Empty...
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  if (!story)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Không tìm thấy truyện</p>
      </div>
    );

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6 pb-16 pt-6 px-4">
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/20">
          <CardContent className="p-0 relative">
            {" "}
            {/* 🔥 QUAN TRỌNG: Thêm 'relative' ở đây */}
            {/* 👇 KHỐI NÚT BÁO CÁO (Nằm ngay đầu CardContent) 👇 */}
            <div className="absolute top-4 right-4 z-20">
              {" "}
              {/* Tăng z-index lên 20 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 transition-colors"
                  >
                    <Flag className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={handleReportStory}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Báo cáo truyện
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleReportChapter}
                    className="cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Báo cáo chương
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* 👆 KẾT THÚC KHỐI NÚT BÁO CÁO 👆 */}
            <div className="flex flex-col md:flex-row gap-8 p-6 md:p-8">
              <div className="flex-shrink-0">
                <div className="relative w-full md:w-64 group">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-2 border-border/50 bg-muted">
                    <ImageWithFallback
                      src={story.coverUrl || ""}
                      alt={story.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-5">
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold mb-3">
                    {story.title}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium">Tác giả:</span>
                    <span
                      className="text-foreground font-semibold cursor-pointer"
                      onClick={() =>
                        story.authorId &&
                        router.push(`/profile/${story.authorId}`)
                      }
                    >
                      {story.authorUsername || "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {story.tags?.map((tag) => (
                    <Badge
                      key={tag.tagId}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      {tag.tagName}
                    </Badge>
                  ))}
                  {story.isPremium && (
                    <Badge className="px-3 py-1 bg-primary">Premium</Badge>
                  )}
                </div>
                <div className="flex items-center gap-6 py-4 border-y border-border/50">
                  {/* Stats content... */}
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Số chương</p>
                      <p className="font-semibold">{story.totalChapters}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Xuất bản</p>
                      <p className="font-semibold">
                        {new Date(story.publishedAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* ... more stats ... */}
                </div>
                <div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {story.description}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                  <Button
                    size="lg"
                    onClick={handleReadFromStart}
                    className="bg-primary text-primary-foreground shadow-lg"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Đọc từ đầu
                  </Button>
                  <StoryFavoriteAction storyId={storyId} />
                  <StoryRatingActions
                    storyId={storyId}
                    currentRating={storyRating?.viewerRating}
                    onRatingUpdate={handleRatingUpdate}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="border-b">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="chapters"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Danh sách chương
                  <Badge variant="secondary" className="ml-2">
                    {chapters.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="ratings"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Đánh giá
                  <Badge variant="secondary" className="ml-2">
                    {storyRating?.totalRatings || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Bình luận
                  <Badge variant="secondary" className="ml-2">
                    {totalComments}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-0">
              <TabsContent value="chapters" className="m-0 p-6">
                {/* Chapters list... (Keep original) */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Danh sách chương</h3>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={sortOption}
                      onChange={(e) =>
                        setSortOption(e.target.value as SortOption)
                      }
                      className="border rounded-md px-3 py-1 text-sm focus:outline-none bg-background"
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="oldest">Cũ nhất</option>
                    </select>
                  </div>
                </div>
                {sortedChapters.length > 0 ? (
                  <div className="space-y-2">
                    {sortedChapters.map((chapter) => (
                      <div
                        key={chapter.chapterId}
                        onClick={() =>
                          handleNavigate("/reader", storyId, chapter.chapterId)
                        }
                        className="group flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary">
                            {chapter.chapterNo}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium group-hover:text-primary truncate">
                            {chapter.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>
                              <Eye className="h-3 w-3 inline mr-1" />
                              {chapter.wordCount.toLocaleString()} từ
                            </span>
                            <span>
                              •{" "}
                              {new Date(chapter.publishedAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          </div>
                        </div>
                        {chapter.isLocked && (
                          <Lock className="h-4 w-4 text-orange-500" />
                        )}

                        {/* 2. Hiển thị Badge: Miễn phí hoặc Giá tiền */}
                        {chapter.accessType === "dias" ? (
                          <Badge
                            variant="outline"
                            className="border-yellow-500 text-yellow-600 font-bold"
                          >
                            {chapter.priceDias} Dias
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            Miễn phí
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">Chưa có chương nào</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ratings" className="m-0 p-6">
                {storyRating ? (
                  <>
                    <StoryRatingSummary storyRating={storyRating} />
                    <StoryRatingList ratings={storyRating.ratings.items} />
                  </>
                ) : (
                  <p>Đang tải...</p>
                )}
              </TabsContent>

              <TabsContent value="comments" className="m-0 p-6">
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
                  showChapterFilter={true}
                  chapters={[
                    {
                      chapterId: "all",
                      chapterNo: 0,
                      title: "Hiển thị tất cả",
                    },
                    ...chapters.map((ch) => ({
                      chapterId: ch.chapterId,
                      chapterNo: ch.chapterNo,
                      title: `Ch${ch.chapterNo} - ${ch.title}`,
                    })),
                  ]}
                  selectedChapter={selectedChapter}
                  onChapterFilterChange={handleChapterFilterChange}
                  storyId={storyId}
                  currentUserId={user?.id}
                  totalCount={totalComments}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType={reportTarget?.type || "story"}
        targetId={reportTarget?.id || ""}
        targetTitle={reportTarget?.title}
      />

      <ReportChapterSelector
        isOpen={showChapterSelector}
        onClose={() => setShowChapterSelector(false)}
        chapters={chapters}
        onSelectChapter={handleChapterSelected}
      />
    </div>
  );
}
