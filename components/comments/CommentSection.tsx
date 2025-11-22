// components/comments/CommentSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import { ChapterComment } from "@/services/chapterCommentService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { CommentItem } from "./CommentItem";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CommentSectionProps {
  comments: ChapterComment[];
  onAddComment: (
    content: string,
    parentCommentId?: string
  ) => Promise<ChapterComment | any>;
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
  // ❌ KHÔNG CẦN isDarkTheme
  chapterId?: string;
  storyId?: string;
  currentUserId?: string;
  totalCount?: number;
}

export function CommentSection({
  comments: initialComments,
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
  chapterId,
  storyId,
  currentUserId,
  totalCount = 0,
}: CommentSectionProps) {
  const [localComments, setLocalComments] =
    useState<ChapterComment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setLocalComments(initialComments);
  }, [initialComments]);

  const addReplyToState = (
    comments: ChapterComment[],
    parentId: string,
    newReply: ChapterComment
  ): ChapterComment[] => {
    return comments.map((c) => {
      if (c.commentId === parentId) {
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

  const handleReplySubmitWrapper = async (
    content: string,
    parentId: string
  ) => {
    try {
      const newReplyData = await onAddComment(content, parentId);
      if (!newReplyData || !newReplyData.commentId) return;
      setLocalComments((prev) => addReplyToState(prev, parentId, newReplyData));
    } catch (error) {
      console.error("Lỗi khi reply:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await onAddComment(newComment, undefined);
      if (created && created.commentId)
        setLocalComments([created, ...localComments]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 CLASS TAILWIND CHUẨN (Tự đổi màu theo theme hệ thống)
  const textClass = "text-foreground"; // Tự động đen/trắng
  const subTextClass = "text-muted-foreground"; // Tự động xám đậm/nhạt
  const inputClass =
    "bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring";
  const selectClass = "bg-background border-input text-foreground";

  // Handler giữ nguyên...
  const handleUpdateComment = async (commentId: string, content: string) => {
    if (onUpdateComment) await onUpdateComment(commentId, content);
  };
  const handleDeleteComment = async (commentId: string) => {
    if (onDeleteComment) await onDeleteComment(commentId);
  };
  const handleLike = async (commentId: string) => {
    if (onLikeComment) await onLikeComment(commentId);
  };
  const handleDislike = async (commentId: string) => {
    if (onDislikeComment) await onDislikeComment(commentId);
  };
  const handleRemoveReaction = async (commentId: string) => {
    if (onRemoveReaction) await onRemoveReaction(commentId);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className={`h-5 w-5 ${textClass}`} />
          <h3 className={`text-lg font-semibold ${textClass}`}>Bình luận</h3>
          <span className={`text-sm ${subTextClass}`}>
            ({totalCount > 0 ? totalCount : localComments.length})
          </span>
        </div>

        {showChapterFilter && chapters.length > 0 && (
          <div className="flex items-center gap-2">
            <label className={`text-sm ${subTextClass}`}>
              Lọc theo chương:
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => onChapterFilterChange?.(e.target.value)}
              className={`border rounded-md px-3 py-1 text-sm ${selectClass}`}
            >
              {chapters.map((chapter) => (
                <option
                  key={chapter.chapterId}
                  value={chapter.chapterId}
                  className="text-foreground bg-background"
                >
                  Ch.{chapter.chapterNo} - {chapter.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {/* 🔥 Input dùng class chuẩn */}
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  user
                    ? `Bình luận dưới tên ${user.displayName}...`
                    : "Viết bình luận..."
                }
                className={`min-h-[100px] resize-none ${inputClass}`}
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />{" "}
                  {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {loading && localComments.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className={`h-6 w-6 animate-spin ${textClass}`} />
          </div>
        ) : localComments.length === 0 ? (
          <div className={`text-center py-8 ${subTextClass}`}>
            <p>Chưa có bình luận nào</p>
          </div>
        ) : (
          <>
            {localComments.map((comment) => (
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
                currentUserId={currentUserId}
                onReplySubmit={handleReplySubmitWrapper}
              />
            ))}
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
                  ) : null}{" "}
                  Tải thêm
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
