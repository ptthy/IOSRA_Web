// components/comments/CommentSection.tsx
"use client";

import React, { useState } from "react";
import { ChapterComment } from "@/services/chapterCommentService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { CommentItem } from "./CommentItem";

interface CommentSectionProps {
  comments: ChapterComment[];
  onAddComment: (content: string) => Promise<void>;
  onUpdateComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onLikeComment?: (commentId: string) => Promise<void>;
  onDislikeComment?: (commentId: string) => Promise<void>;
  onRemoveReaction?: (commentId: string) => Promise<void>;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  showChapterFilter?: boolean;
  chapters?: Array<{ chapterId: string; chapterNo: number; title: string }>;
  selectedChapter?: string;
  onChapterFilterChange?: (chapterId: string) => void;
  isDarkTheme?: boolean;
  chapterId?: string;
  storyId?: string;
  currentUserId?: string; // Thêm prop để xác định user hiện tại
}

export function CommentSection({
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onLikeComment,
  onDislikeComment,
  onRemoveReaction,
  loading = false,
  hasMore = false,
  onLoadMore,
  showChapterFilter = false,
  chapters = [],
  selectedChapter = "all",
  onChapterFilterChange,
  isDarkTheme = false,
  chapterId,
  storyId,
  currentUserId, // Nhận currentUserId
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đảm bảo tất cả các hàm xử lý được truyền xuống CommentItem
  const handleUpdateComment = async (commentId: string, content: string) => {
    if (onUpdateComment) {
      try {
        await onUpdateComment(commentId, content);
        // Có thể thêm toast notification ở đây
      } catch (error) {
        console.error("Error updating comment:", error);
        // Hiển thị thông báo lỗi cho user
        throw error;
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (onDeleteComment) {
      try {
        await onDeleteComment(commentId);
        // Có thể thêm toast notification ở đây
      } catch (error) {
        console.error("Error deleting comment:", error);
        // Hiển thị thông báo lỗi cho user
        throw error;
      }
    }
  };

  const handleLike = async (commentId: string) => {
    if (onLikeComment) {
      try {
        await onLikeComment(commentId);
      } catch (error) {
        console.error("Error liking comment:", error);
        throw error;
      }
    }
  };

  const handleDislike = async (commentId: string) => {
    if (onDislikeComment) {
      try {
        await onDislikeComment(commentId);
      } catch (error) {
        console.error("Error disliking comment:", error);
        throw error;
      }
    }
  };

  const handleRemoveReaction = async (commentId: string) => {
    if (onRemoveReaction) {
      try {
        await onRemoveReaction(commentId);
      } catch (error) {
        console.error("Error removing reaction:", error);
        throw error;
      }
    }
  };

  return (
    <div className={`space-y-6 ${isDarkTheme ? "text-white" : ""}`}>
      {/* Comment Input */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Bình luận</h3>
          <span className="text-sm text-muted-foreground">
            ({comments.length})
          </span>
        </div>

        {/* Chapter Filter */}
        {showChapterFilter && chapters.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">
              Lọc theo chương:
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => onChapterFilterChange?.(e.target.value)}
              className="border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground border-input"
            >
              <option value="all">Tất cả chương</option>
              {chapters.map((chapter) => (
                <option key={chapter.chapterId} value={chapter.chapterId}>
                  Ch.{chapter.chapterNo} - {chapter.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                className="min-h-[100px] resize-none border-muted"
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có bình luận nào</p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                showChapterTag={showChapterFilter}
                chapterId={chapterId}
                storyId={storyId}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onLike={handleLike}
                onDislike={handleDislike}
                onRemoveReaction={handleRemoveReaction}
                currentUserId={currentUserId} // Truyền currentUserId xuống
              />
            ))}

            {/* Load More Button */}
            {hasMore && onLoadMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={onLoadMore}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Tải thêm bình luận
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
