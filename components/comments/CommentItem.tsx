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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactionsPopup } from "./ReactionsPopup";

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
}: CommentItemProps) {
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
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  // Kiểm tra xem user hiện tại có phải là chủ sở hữu comment không
  const isOwner = currentUserId === comment.readerId;

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} ngày trước`;
    if (diffHours > 0) return `${diffHours} giờ trước`;
    if (diffMins > 0) return `${diffMins} phút trước`;
    return "Vừa xong";
  };

  const handleLike = async () => {
    if (!onLike || !onRemoveReaction) return;

    setLoading(true);
    try {
      if (liked) {
        await onRemoveReaction(comment.commentId);
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      } else if (disliked) {
        await onLike(comment.commentId);
        setLiked(true);
        setDisliked(false);
        setLikeCount((prev) => prev + 1);
        setDislikeCount((prev) => prev - 1);
      } else {
        await onLike(comment.commentId);
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error updating like:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!onDislike || !onRemoveReaction) return;

    setLoading(true);
    try {
      if (disliked) {
        await onRemoveReaction(comment.commentId);
        setDisliked(false);
        setDislikeCount((prev) => prev - 1);
      } else if (liked) {
        await onDislike(comment.commentId);
        setDisliked(true);
        setLiked(false);
        setDislikeCount((prev) => prev + 1);
        setLikeCount((prev) => prev - 1);
      } else {
        await onDislike(comment.commentId);
        setDisliked(true);
        setDislikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error updating dislike:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!onUpdateComment || !editContent.trim()) return;

    setEditLoading(true);
    try {
      await onUpdateComment(comment.commentId, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteComment) return;

    setDeleteLoading(true);
    try {
      await onDeleteComment(comment.commentId);
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    } finally {
      setDeleteLoading(false);
    }
  };

  const showReactionsPopup = () => {
    if (likeCount > 0 || dislikeCount > 0) {
      setShowReactions(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  // Tính toán text hiển thị tổng reactions (giống Facebook)
  const getReactionsText = () => {
    if (likeCount > 0 && dislikeCount > 0) {
      return `${likeCount + dislikeCount}`;
    } else if (likeCount > 0) {
      return `${likeCount}`;
    } else if (dislikeCount > 0) {
      return `${dislikeCount}`;
    }
    return null;
  };

  // Kiểm tra xem có reactions nào không
  const hasReactions = likeCount > 0 || dislikeCount > 0;

  return (
    <>
      <div className="p-4 rounded-lg border transition-colors bg-card hover:bg-card/80">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0 border">
            <AvatarImage src={comment.avatarUrl || ""} />
            <AvatarFallback className="text-sm bg-primary/10 text-primary">
              {comment.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header với username và thời gian */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-sm text-foreground">
                  {comment.username}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {timeAgo(comment.createdAt)}
                </span>
                {showChapterTag && comment.chapterNo && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border">
                    Ch.{comment.chapterNo}
                  </span>
                )}
              </div>

              {/* Dropdown menu 3 chấm - luôn hiển thị */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2 opacity-60 hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* Actions cho chủ sở hữu */}
                  {isOwner && onUpdateComment && (
                    <DropdownMenuItem
                      onClick={() => setIsEditing(true)}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Chỉnh sửa bình luận
                    </DropdownMenuItem>
                  )}

                  {isOwner && onDeleteComment && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteLoading ? "Đang xóa..." : "Xóa bình luận"}
                    </DropdownMenuItem>
                  )}

                  {/* Separator nếu có cả owner actions và reply */}
                  {isOwner && (onUpdateComment || onDeleteComment) && (
                    <DropdownMenuSeparator />
                  )}

                  {/* Action reply cho tất cả users */}
                  <DropdownMenuItem
                    onClick={() => setShowReply(!showReply)}
                    className="cursor-pointer"
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Trả lời
                  </DropdownMenuItem>

                  {/* Hiển thị reactions summary nếu có */}
                  {hasReactions && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={showReactionsPopup}
                        className="cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Xem lượt thích & không thích
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Nội dung comment */}
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px] resize-none text-sm"
                  placeholder="Nhập nội dung bình luận..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEdit}
                    disabled={editLoading}
                    className="h-9"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEdit}
                    disabled={!editContent.trim() || editLoading}
                    className="h-9"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {editLoading ? "Đang lưu..." : "Lưu"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap text-foreground">
                  {comment.content}
                </p>

                {/* Actions row với thiết kế giống Facebook */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Like button */}
                    <button
                      className={`flex items-center gap-1.5 transition-all ${
                        liked
                          ? "text-green-600 font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={handleLike}
                      disabled={loading}
                    >
                      <ThumbsUp
                        className="h-4 w-4"
                        fill={liked ? "currentColor" : "none"}
                      />
                      <span className="text-xs">Thích</span>
                    </button>

                    {/* Dislike button */}
                    <button
                      className={`flex items-center gap-1.5 transition-all ${
                        disliked
                          ? "text-red-600 font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={handleDislike}
                      disabled={loading}
                    >
                      <ThumbsDown
                        className="h-4 w-4"
                        fill={disliked ? "currentColor" : "none"}
                      />
                      <span className="text-xs">Không thích</span>
                    </button>

                    {/* Reply button */}
                    <button
                      className="flex items-center gap-1.5 transition-colors text-muted-foreground hover:text-foreground"
                      onClick={() => setShowReply(!showReply)}
                    >
                      <Reply className="h-4 w-4" />
                      <span className="text-xs">Trả lời</span>
                    </button>
                  </div>

                  {/* Reactions summary - Hiển thị tổng số reactions giống Facebook */}
                  {hasReactions && (
                    <button
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={showReactionsPopup}
                    >
                      <div className="flex items-center">
                        {/* Hiển thị icon tương ứng với loại reaction */}
                        {likeCount > 0 && dislikeCount === 0 && (
                          <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                        )}
                        {dislikeCount > 0 && likeCount === 0 && (
                          <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                        )}
                        {likeCount > 0 && dislikeCount > 0 && (
                          <div className="flex items-center -space-x-1">
                            <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                            <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                          </div>
                        )}
                      </div>
                      <span>{getReactionsText()}</span>
                    </button>
                  )}
                </div>

                {/* Reply input */}
                {showReply && (
                  <div className="mt-4 pl-4 border-l-2 border-border">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0 border">
                        <AvatarFallback className="text-xs bg-muted">
                          You
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Viết câu trả lời..."
                          className="text-sm min-h-[80px] mb-3 resize-none border-muted"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setShowReply(false)}
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-primary hover:bg-primary/90"
                            disabled={!replyText.trim()}
                          >
                            Gửi
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

      {/* Reactions Popup */}
      {comment.chapterId && (
        <ReactionsPopup
          chapterId={comment.chapterId}
          commentId={comment.commentId}
          likeCount={likeCount}
          dislikeCount={dislikeCount}
          isOpen={showReactions}
          onClose={() => setShowReactions(false)}
        />
      )}
    </>
  );
}
