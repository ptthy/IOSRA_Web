// components/comments/CommentItem.tsx
"use client";

import React, { useState } from "react";
import { ChapterComment } from "@/services/chapterCommentService";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  ThumbsUp,
  ThumbsDown,
  Reply,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  X,
  MessageSquare,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactionsPopup } from "./ReactionsPopup";
import { useAuth } from "@/context/AuthContext";

interface CommentItemProps {
  comment: ChapterComment;
  showChapterTag: boolean;
  chapterId?: string;
  storyId?: string;
  onUpdateComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onLike?: (commentId: string) => Promise<void>;
  onDislike?: (commentId: string) => Promise<void>;
  onRemoveReaction?: (commentId: string) => Promise<void>;
  currentUserId?: string;
  onReplySubmit?: (content: string, parentId: string) => Promise<void>;
  theme?: any;
}

export function CommentItem({
  comment,
  showChapterTag,
  chapterId,
  storyId,
  onUpdateComment,
  onDeleteComment,
  onLike,
  onDislike,
  onRemoveReaction,
  currentUserId,
  onReplySubmit,
  theme,
}: CommentItemProps) {
  const { user } = useAuth();

  const [showReply, setShowReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [liked, setLiked] = useState(comment.viewerReaction === "like");
  const [disliked, setDisliked] = useState(
    comment.viewerReaction === "dislike"
  );
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [dislikeCount, setDislikeCount] = useState(comment.dislikeCount || 0);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const isOwner = currentUserId === comment.readerId;
  const isDarkTheme = theme?.text === "#f0ead6";

  // Màu nền tĩnh (Static): Trắng mờ 5% (tối) hoặc Đen mờ 3% (sáng)
  const itemBgColor = theme
    ? isDarkTheme
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(0, 0, 0, 0.03)"
    : undefined;

  // Màu viền
  const borderColor = theme
    ? isDarkTheme
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.08)"
    : undefined;

  // Style cho chữ
  const textStyle = theme ? { color: theme.text } : {};
  const subTextStyle = theme ? { color: theme.text, opacity: 0.7 } : {};

  // Class container: Xóa bg-card và hover effects để tránh đổi màu lung tung
  const containerClass = "transition-colors border rounded-lg p-4";

  const handleSendReply = async () => {
    if (!replyText.trim() || !onReplySubmit) return;
    setIsReplying(true);
    try {
      await onReplySubmit(replyText, comment.commentId);
      setReplyText("");
      setShowReply(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsReplying(false);
    }
  };

  // ... (Các hàm handle khác giữ nguyên)
  const handleLike = async () => {
    if (!onLike) return;
    setLoading(true);
    try {
      if (liked) {
        await onRemoveReaction?.(comment.commentId);
        setLiked(false);
        setLikeCount((p) => p - 1);
      } else {
        await onLike(comment.commentId);
        setLiked(true);
        if (disliked) setDislikeCount((p) => p - 1);
        setDisliked(false);
        setLikeCount((p) => p + 1);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };
  const handleDislike = async () => {
    if (!onDislike) return;
    setLoading(true);
    try {
      if (disliked) {
        await onRemoveReaction?.(comment.commentId);
        setDisliked(false);
        setDislikeCount((p) => p - 1);
      } else {
        await onDislike(comment.commentId);
        setDisliked(true);
        if (liked) setLikeCount((p) => p - 1);
        setLiked(false);
        setDislikeCount((p) => p + 1);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = async () => {
    if (!onUpdateComment) return;
    setEditLoading(true);
    try {
      await onUpdateComment(comment.commentId, editContent);
      setIsEditing(false);
    } catch (e) {
    } finally {
      setEditLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!onDeleteComment) return;
    setDeleteLoading(true);
    try {
      await onDeleteComment(comment.commentId);
    } catch (e) {
    } finally {
      setDeleteLoading(false);
    }
  };
  const showReactionsPopup = () => {
    if (likeCount > 0 || dislikeCount > 0) setShowReactions(true);
  };
  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };
  const hasReactions = likeCount > 0 || dislikeCount > 0;
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "Vừa xong";
    if (min < 60) return `${min} phút trước`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} giờ trước`;
    return `${Math.floor(h / 24)} ngày trước`;
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div
        className={containerClass}
        // 🔥 Áp dụng style cứng
        style={{
          backgroundColor: itemBgColor,
          borderColor: borderColor,
        }}
      >
        <div className="flex gap-3">
          <Avatar
            className="h-10 w-10 border"
            style={{ borderColor: borderColor }}
          >
            <AvatarImage src={comment.avatarUrl || ""} />
            <AvatarFallback
              style={{ backgroundColor: theme?.bg, color: theme?.text }}
            >
              U
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={textStyle}>
                  {comment.username}
                </span>
                <span className="text-xs" style={subTextStyle}>
                  {timeAgo(comment.createdAt)}
                </span>
                {showChapterTag && comment.chapterNo && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded border"
                    style={{
                      backgroundColor: isDarkTheme
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                      color: theme?.text,
                      borderColor: borderColor,
                    }}
                  >
                    Ch.{comment.chapterNo}
                  </span>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    style={{ color: theme?.text, opacity: 0.7 }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && (
                    <>
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Xóa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setShowReply(!showReply)}>
                    <Reply className="mr-2 h-4 w-4" /> Trả lời
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] text-sm"
                  style={{
                    backgroundColor: itemBgColor,
                    color: theme?.text,
                    borderColor: borderColor,
                  }}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEdit}
                    style={{ color: theme?.text }}
                  >
                    Hủy
                  </Button>
                  <Button size="sm" onClick={handleEdit} disabled={editLoading}>
                    Lưu
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p
                  className="text-sm mb-2 whitespace-pre-wrap"
                  style={textStyle}
                >
                  {comment.content}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-1 transition-colors hover:opacity-80"
                    style={{
                      color: liked ? "#16a34a" : theme?.text,
                      opacity: liked ? 1 : 0.7,
                    }}
                  >
                    <ThumbsUp
                      className="h-3.5 w-3.5"
                      fill={liked ? "currentColor" : "none"}
                    />
                    Thích
                  </button>
                  <button
                    onClick={handleDislike}
                    className="flex items-center gap-1 transition-colors hover:opacity-80"
                    style={{
                      color: disliked ? "#dc2626" : theme?.text,
                      opacity: disliked ? 1 : 0.7,
                    }}
                  >
                    <ThumbsDown
                      className="h-3.5 w-3.5"
                      fill={disliked ? "currentColor" : "none"}
                    />
                    Không thích
                  </button>
                  <button
                    onClick={() => setShowReply(!showReply)}
                    className="flex items-center gap-1 transition-colors hover:opacity-80"
                    style={subTextStyle}
                  >
                    <Reply className="h-3.5 w-3.5" /> Trả lời
                  </button>
                  {hasReactions && (
                    <span
                      onClick={showReactionsPopup}
                      className="cursor-pointer ml-auto flex items-center gap-1 hover:opacity-80"
                      style={subTextStyle}
                    >
                      <ThumbsUp className="h-3 w-3" /> {likeCount}
                    </span>
                  )}
                </div>

                {showReply && (
                  <div
                    className="mt-3 pl-3 border-l-2"
                    style={{ borderColor: borderColor }}
                  >
                    <div className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar || ""} />
                        <AvatarFallback>Y</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Viết câu trả lời..."
                          className="min-h-[60px] text-sm"
                          style={{
                            backgroundColor: itemBgColor,
                            color: theme?.text,
                            borderColor: borderColor,
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowReply(false)}
                            style={{ color: theme?.text }}
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSendReply}
                            disabled={isReplying}
                          >
                            {isReplying ? (
                              <Loader2 className="animate-spin h-3 w-3" />
                            ) : (
                              "Gửi"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-8 md:pl-12 flex flex-col gap-2 relative w-full">
          <div
            className="absolute left-3.5 top-0 bottom-4 w-px"
            style={{ backgroundColor: borderColor }}
          />
          {comment.replies.map(
            (reply) =>
              reply?.commentId && (
                <CommentItem
                  key={reply.commentId}
                  comment={reply}
                  showChapterTag={false}
                  chapterId={chapterId}
                  storyId={storyId}
                  currentUserId={currentUserId}
                  onUpdateComment={onUpdateComment}
                  onDeleteComment={onDeleteComment}
                  onLike={onLike}
                  onDislike={onDislike}
                  onRemoveReaction={onRemoveReaction}
                  onReplySubmit={onReplySubmit}
                  theme={theme}
                />
              )
          )}
        </div>
      )}

      {comment.chapterId && (
        <ReactionsPopup
          chapterId={comment.chapterId}
          commentId={comment.commentId}
          isOpen={showReactions}
          onClose={() => setShowReactions(false)}
          likeCount={likeCount}
          dislikeCount={dislikeCount}
        />
      )}
    </div>
  );
}
