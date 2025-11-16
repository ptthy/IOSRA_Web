// app/story/[storyId]/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
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
// Component ImageWithFallback tạm thời - DI CHUYỂN RA NGOÀI
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

// Định nghĩa các tùy chọn sắp xếp (chỉ giữ 2 option)
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
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  // Load story data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [storyData, chaptersData, ratingData] = await Promise.all([
          storyCatalogApi.getStoryById(storyId),
          chapterCatalogApi.getChapters({ storyId, page: 1, pageSize: 50 }),
          storyRatingApi.getStoryRating(storyId),
        ]);

        setStory(storyData);
        setChapters(chaptersData.items);
        setStoryRating(ratingData);
      } catch (error) {
        console.error("Error loading story:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      loadData();
    }
  }, [storyId]);

  // Load comments khi storyId, activeTab hoặc filter thay đổi
  useEffect(() => {
    if (storyId && activeTab === "comments") {
      loadComments();
    }
  }, [storyId, activeTab, selectedChapter]);

  // Load comments từ API
  const loadComments = async (page: number = 1) => {
    if (!storyId) return;

    setCommentsLoading(true);
    try {
      const options: any = { page, pageSize: 20 };
      if (selectedChapter !== "all") {
        options.chapterId = selectedChapter;
      }

      const response = await chapterCommentService.getCommentsByStory(
        storyId,
        options
      );

      if (page === 1) {
        setComments(response.comments.items);
      } else {
        setComments((prev) => [...prev, ...response.comments.items]);
      }

      setHasMoreComments(response.comments.items.length === 20);
      setCommentsPage(page);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Thêm comment mới
  const handleAddComment = async (content: string) => {
    if (!storyId || chapters.length === 0) return;

    try {
      // Tìm chapterId đầu tiên để gán comment
      const firstChapter = chapters[0];
      if (!firstChapter) {
        throw new Error("No chapters available for commenting");
      }

      const newComment = await chapterCommentService.createComment(
        firstChapter.chapterId,
        { content }
      );

      setComments((prev) => [newComment, ...prev]);
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      // Tìm chapterId của comment
      const comment = comments.find((c) => c.commentId === commentId);
      if (!comment) return;

      await chapterCommentService.updateComment(comment.chapterId, commentId, {
        content,
      });

      // Update local state
      setComments((prev) =>
        prev.map((comment) =>
          comment.commentId === commentId
            ? { ...comment, content, updatedAt: new Date().toISOString() }
            : comment
        )
      );
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      // Tìm chapterId của comment
      const comment = comments.find((c) => c.commentId === commentId);
      if (!comment) return;

      await chapterCommentService.deleteComment(comment.chapterId, commentId);

      // Update local state
      setComments((prev) =>
        prev.filter((comment) => comment.commentId !== commentId)
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  };

  // Like comment
  const handleLikeComment = async (commentId: string) => {
    try {
      // Tìm chapterId của comment
      const comment = comments.find((c) => c.commentId === commentId);
      if (!comment) return;

      await chapterCommentService.likeComment(comment.chapterId, commentId);

      // Update local state
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.commentId === commentId) {
            const newLikeCount =
              comment.viewerReaction === "like"
                ? comment.likeCount - 1
                : comment.viewerReaction === "dislike"
                ? comment.likeCount + 1
                : comment.likeCount + 1;

            const newDislikeCount =
              comment.viewerReaction === "dislike"
                ? comment.dislikeCount - 1
                : comment.dislikeCount;

            return {
              ...comment,
              likeCount: newLikeCount,
              dislikeCount: newDislikeCount,
              viewerReaction: comment.viewerReaction === "like" ? null : "like",
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error("Error liking comment:", error);
      throw error;
    }
  };

  // Dislike comment
  const handleDislikeComment = async (commentId: string) => {
    try {
      // Tìm chapterId của comment
      const comment = comments.find((c) => c.commentId === commentId);
      if (!comment) return;

      await chapterCommentService.dislikeComment(comment.chapterId, commentId);

      // Update local state
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.commentId === commentId) {
            const newDislikeCount =
              comment.viewerReaction === "dislike"
                ? comment.dislikeCount - 1
                : comment.viewerReaction === "like"
                ? comment.dislikeCount + 1
                : comment.dislikeCount + 1;

            const newLikeCount =
              comment.viewerReaction === "like"
                ? comment.likeCount - 1
                : comment.likeCount;

            return {
              ...comment,
              likeCount: newLikeCount,
              dislikeCount: newDislikeCount,
              viewerReaction:
                comment.viewerReaction === "dislike" ? null : "dislike",
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error("Error disliking comment:", error);
      throw error;
    }
  };

  // Remove reaction
  const handleRemoveReaction = async (commentId: string) => {
    try {
      // Tìm chapterId của comment
      const comment = comments.find((c) => c.commentId === commentId);
      if (!comment) return;

      await chapterCommentService.removeCommentReaction(
        comment.chapterId,
        commentId
      );

      // Update local state
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.commentId === commentId) {
            const newLikeCount =
              comment.viewerReaction === "like"
                ? comment.likeCount - 1
                : comment.likeCount;

            const newDislikeCount =
              comment.viewerReaction === "dislike"
                ? comment.dislikeCount - 1
                : comment.dislikeCount;

            return {
              ...comment,
              likeCount: newLikeCount,
              dislikeCount: newDislikeCount,
              viewerReaction: null,
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error("Error removing reaction:", error);
      throw error;
    }
  };

  const handleLoadMoreComments = () => {
    loadComments(commentsPage + 1);
  };

  const handleChapterFilterChange = (chapterId: string) => {
    setSelectedChapter(chapterId);
    setCommentsPage(1);
  };

  // Sắp xếp chapters dựa trên tùy chọn (chỉ 2 option)
  const sortedChapters = useMemo(() => {
    const chaptersCopy = [...chapters];

    switch (sortOption) {
      case "newest":
        return chaptersCopy.sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        );
      case "oldest":
        return chaptersCopy.sort(
          (a, b) =>
            new Date(a.publishedAt).getTime() -
            new Date(b.publishedAt).getTime()
        );
      default:
        return chaptersCopy;
    }
  }, [chapters, sortOption]);

  const handleRatingUpdate = async () => {
    try {
      const ratingData = await storyRatingApi.getStoryRating(storyId);
      setStoryRating(ratingData);
    } catch (error) {
      console.error("Lỗi khi cập nhật đánh giá:", error);
    }
  };

  const handleNavigate = (
    page: string,
    storyId?: string,
    chapterId?: string
  ) => {
    if (page === "/reader" && storyId && chapterId) {
      router.push(`/reader/${storyId}/${chapterId}`);
    } else if (page === "/") {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <BookOpen className="h-16 w-16 mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Không tìm thấy truyện</p>
          <Button onClick={() => handleNavigate("/")}>
            Quay lại Trang Chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto space-y-6 pb-16 pt-6 px-4">
        {/* Hero Section */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/20">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-8 p-6 md:p-8">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                <div className="relative w-full md:w-64 group">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-2 border-border/50 bg-muted">
                    <ImageWithFallback
                      src={story.coverUrl || ""}
                      alt={story.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  {/* Decorative glow */}
                  <div className="absolute -inset-4 bg-primary/5 rounded-2xl blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>

              {/* Story Info */}
              <div className="flex-1 space-y-5">
                {/* Title */}
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    {story.title}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium">Tác giả:</span>
                      <span className="text-foreground font-semibold">
                        {story.authorUsername || "Unknown"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {story.tags?.map((tag) => (
                    <Badge
                      key={tag.tagId}
                      variant="secondary"
                      className="px-3 py-1 bg-secondary/60 hover:bg-secondary transition-colors cursor-pointer"
                    >
                      {tag.tagName}
                    </Badge>
                  ))}
                  {story.isPremium && (
                    <Badge className="px-3 py-1 bg-primary text-primary-foreground">
                      Premium
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 py-4 border-y border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Số chương</p>
                      <p className="font-semibold">{story.totalChapters}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cập nhật</p>
                      <p className="font-semibold text-sm">
                        {new Date(story.publishedAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Rating Stats */}
                  {storyRating && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Đánh giá
                        </p>
                        <p className="font-semibold">
                          {storyRating.averageScore?.toFixed(1) || "0.0"} (
                          {storyRating.totalRatings})
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {story.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                  <Button
                    size="lg"
                    onClick={() => {
                      const firstChapter = sortedChapters[0];
                      if (firstChapter) {
                        handleNavigate(
                          "/reader",
                          storyId,
                          firstChapter.chapterId
                        );
                      }
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Đọc từ đầu
                  </Button>
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

        {/* Tabs Section */}
        <Card className="shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="border-b">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="chapters"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Danh sách chương
                  <Badge variant="secondary" className="ml-2">
                    {chapters.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="ratings"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Đánh giá
                  <Badge variant="secondary" className="ml-2">
                    {storyRating?.totalRatings || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Bình luận
                  <Badge variant="secondary" className="ml-2">
                    {comments.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-0">
              <TabsContent value="chapters" className="m-0 p-6">
                {/* Bộ lọc sắp xếp đơn giản */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Danh sách chương</h3>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={sortOption}
                      onChange={(e) =>
                        setSortOption(e.target.value as SortOption)
                      }
                      className="border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground border-input"
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="oldest">Cũ nhất</option>
                    </select>
                  </div>
                </div>

                {sortedChapters.length > 0 ? (
                  <div className="space-y-2">
                    {sortedChapters.map((chapter, index) => (
                      <div
                        key={chapter.chapterId}
                        onClick={() =>
                          handleNavigate("/reader", storyId, chapter.chapterId)
                        }
                        className="group flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer"
                      >
                        {/* Chapter Number */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                          <span className="font-semibold text-primary">
                            {chapter.chapterNo}
                          </span>
                        </div>

                        {/* Chapter Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium group-hover:text-primary transition-colors truncate">
                            {chapter.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {chapter.wordCount.toLocaleString()} từ
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(chapter.publishedAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Lock Icon */}
                        {chapter.isLocked && (
                          <div className="flex-shrink-0">
                            <Badge variant="secondary" className="bg-muted">
                              <BookOpen className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">
                      Chưa có chương nào
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tác giả đang chuẩn bị nội dung...
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* TAB RATING */}
              <TabsContent value="ratings" className="m-0 p-6">
                {storyRating ? (
                  <div className="space-y-6">
                    <StoryRatingSummary storyRating={storyRating} />
                    <StoryRatingList ratings={storyRating.ratings.items} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Đang tải thông tin đánh giá...
                  </div>
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
                  chapters={chapters.map((ch) => ({
                    chapterId: ch.chapterId,
                    chapterNo: ch.chapterNo,
                    title: ch.title,
                  }))}
                  selectedChapter={selectedChapter}
                  onChapterFilterChange={handleChapterFilterChange}
                  storyId={storyId}
                  currentUserId={user?.id}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
