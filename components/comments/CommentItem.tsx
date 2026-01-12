// components/comments/CommentItem.tsx
/**
 * MỤC ĐÍCH: Component hiển thị một comment và các chức năng liên quan
 * CHỨC NĂNG CHÍNH:
 * 1. Hiển thị thông tin comment (avatar, tên, nội dung, thời gian)
 * 2. Xử lý tương tác (like, dislike, reply, edit, delete, report)
 * 3. Hiển thị replies (comment con) dưới dạng nested tree
 * 4. Tích hợp theme (màu sắc động theo theme đọc truyện)
 * 5. Popup hiển thị chi tiết phản ứng (reactions)
 *
 * KẾT NỐI VỚI:
 * - CommentSection.tsx (component cha)
 * - chapterCommentService (API calls)
 * - AuthContext (lấy thông tin user hiện tại)
 */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  Flag,
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
  comment: ChapterComment; // Dữ liệu comment từ API
  showChapterTag: boolean; // Có hiển thị tag chương không
  chapterId?: string; // ID chương (cho popup reactions)
  storyId?: string; // ID truyện (nếu cần)
  onUpdateComment?: (commentId: string, content: string) => Promise<void>; // Callback sửa comment
  onDeleteComment?: (commentId: string) => Promise<void>; // Callback xóa comment
  onLike?: (commentId: string) => Promise<void>; // Callback like
  onDislike?: (commentId: string) => Promise<void>; // Callback dislike
  onRemoveReaction?: (commentId: string) => Promise<void>; // Callback bỏ reaction
  currentUserId?: string; // ID user hiện tại (để kiểm tra chủ comment)
  onReplySubmit?: (content: string, parentId: string) => Promise<void>; // Callback gửi reply
  theme?: any; // Theme object (bg, text color)
  onReport?: (comment: ChapterComment) => void; // Callback báo cáo comment
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
  onReport,
}: CommentItemProps) {
  /**
   * Lấy thông tin user từ context auth
   * Dùng để hiển thị avatar user hiện tại khi reply
   */
  const { user } = useAuth();
  const router = useRouter();
  // --- STATE QUẢN LÝ UI VÀ TƯƠNG TÁC ---
  /**
   * Các state local quản lý trạng thái UI:
   * - showReply: Hiển thị/ẩn form reply
   * - isEditing: Đang ở chế độ chỉnh sửa comment
   * - editContent: Nội dung khi edit (copy từ comment.content)
   * - liked/disliked: Trạng thái reaction của user hiện tại
   * - likeCount/dislikeCount: Số lượng reactions (đồng bộ từ props)
   * - replyText: Nội dung reply đang nhập
   * - loading states: Quản lý trạng thái loading cho các action
   * - showReactions: Hiển thị/ẩn popup reactions
   */
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
  /**
   * Kiểm tra xem user hiện tại có phải chủ comment không
   * Dùng để hiển thị nút sửa/xóa chỉ cho chủ comment
   */
  const isOwner = currentUserId === comment.readerId;
  /**
   * Kiểm tra theme tối (màu text là #f0ead6)
   * Dùng để điều chỉnh style động cho theme đọc truyện
   */
  const isDarkTheme = theme?.text === "#f0ead6";
  /**
   * Style động theo theme:
   * - borderColor: Viền mờ theo theme (sáng/tối)
   * - textStyle/subTextStyle: Màu chữ chính và phụ
   */
  const borderColor = theme
    ? isDarkTheme
      ? "rgba(255, 255, 255, 0.1)" // Viền cho theme tối
      : "rgba(0, 0, 0, 0.08)" // Viền cho theme sáng
    : undefined;

  // Style cho chữ
  const textStyle = theme ? { color: theme.text } : {};
  const subTextStyle = theme ? { color: theme.text, opacity: 0.7 } : {};

  // Class container: Xóa bg-card và hover effects để tránh đổi màu lung tung
  const containerClass = "transition-colors border rounded-lg p-4";
  /**
   * HÀM XỬ LÝ CHUYỂN TRANG PROFILE:
   * Khi click vào avatar hoặc tên user
   * @param e - React mouse event
   * Logic:
   * 1. e.stopPropagation() để ngăn sự kiện click lan ra ngoài
   * 2. router.push đến trang profile với readerId
   */
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn sự kiện lan ra ngoài (nếu có click cha)
    if (comment.readerId) {
      router.push(`/profile/${comment.readerId}`);
    }
  };

  /**
   * HÀM GỬI REPLY CHO COMMENT:
   * Flow:
   * 1. Kiểm tra replyText không rỗng và có callback onReplySubmit
   * 2. Gọi API gửi reply qua callback
   * 3. Reset form và ẩn khung reply nếu thành công
   * 4. Xử lý lỗi nếu có
   */
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

  /**
   * HÀM XỬ LÝ LIKE COMMENT:
   * Logic toggle:
   * 1. Nếu đã like → bỏ like (gọi onRemoveReaction)
   * 2. Nếu chưa like → like (gọi onLike)
   * 3. Nếu đang dislike thì bỏ dislike trước (tính năng exclusive)
   * 4. Cập nhật UI state ngay lập tức (optimistic update)
   */
  const handleLike = async () => {
    if (!onLike) return;
    setLoading(true);
    try {
      if (liked) {
        // Đã like → bỏ like
        await onRemoveReaction?.(comment.commentId);
        setLiked(false);
        setLikeCount((p) => p - 1);
      } else {
        // Chưa like → like
        await onLike(comment.commentId);
        setLiked(true);
        if (disliked) setDislikeCount((p) => p - 1); // Bỏ dislike nếu có
        setDisliked(false);
        setLikeCount((p) => p + 1);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };
  /**
   * Hàm xử lý dislike comment
   * Logic tương tự handleLike nhưng ngược lại
   */
  const handleDislike = async () => {
    if (!onDislike) return;
    setLoading(true);
    try {
      if (disliked) {
        // Đã dislike → bỏ dislike
        await onRemoveReaction?.(comment.commentId);
        setDisliked(false);
        setDislikeCount((p) => p - 1);
      } else {
        // Chưa dislike → dislike
        await onDislike(comment.commentId);
        setDisliked(true);
        if (liked) setLikeCount((p) => p - 1); // Bỏ like nếu có
        setLiked(false);
        setDislikeCount((p) => p + 1);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };
  /**
   * HÀM XỬ LÝ CHỈNH SỬA COMMENT:
   * 1. Gọi callback onUpdateComment với commentId và nội dung mới
   * 2. Thoát chế độ edit nếu thành công
   */
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
  /**
   * HÀM XỬ LÝ XÓA COMMENT:
   * 1. Gọi callback onDeleteComment với commentId
   * 2. Component cha sẽ xử lý xóa khỏi danh sách
   */
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

  /**
   * HIỂN THỊ POPUP PHẢN ỨNG:
   * Chỉ mở popup nếu comment có lượt like/dislike > 0
   */
  const showReactionsPopup = () => {
    if (likeCount > 0 || dislikeCount > 0) setShowReactions(true);
  };

  /**
   * HỦY CHỈNH SỬA:
   * Reset về nội dung gốc và thoát chế độ edit
   */
  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };
  /**
   * KIỂM TRA COMMENT CÓ PHẢN ỨNG NÀO KHÔNG:
   * Dùng để hiển thị tổng số reactions
   */
  const hasReactions = likeCount > 0 || dislikeCount > 0;
  /**
   * HÀM FORMAT THỜI GIAN ĐĂNG COMMENT:
   * @param d - String thời gian từ API
   * @returns String định dạng "5 phút trước", "2 giờ trước",...
   * Logic: Tính khoảng cách thời gian từ lúc đăng đến hiện tại
   */
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const min = Math.floor(diff / 60000); // Chuyển từ ms sang phút
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
        //  Áp dụng style cứng
        style={
          {
            // backgroundColor: itemBgColor,
            // borderColor: borderColor,
          }
        }
      >
        <div className="flex gap-3">
          {/*  Thêm onClick và cursor-pointer vào Avatar */}
          {/* Avatar với onClick để chuyển trang profile */}
          <Avatar
            className="h-10 w-10 border"
            style={{ borderColor: borderColor }}
            onClick={handleProfileClick}
          >
            <AvatarImage src={comment.avatarUrl || ""} />
            <AvatarFallback
              style={{ backgroundColor: theme?.bg, color: theme?.text }}
            >
              {comment.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                {/*  Thêm onClick và hiệu ứng hover vào Tên người dùng */}
                <span
                  className="text-sm font-semibold"
                  style={textStyle}
                  onClick={handleProfileClick}
                >
                  {comment.username}
                </span>
                <span className="text-xs" style={subTextStyle}>
                  {timeAgo(comment.createdAt)}
                </span>
                {/* Hiển thị tag chapter nếu cần */}
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
              {/* Dropdown menu với các tùy chọn (sửa, xóa, trả lời, báo cáo) */}
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
                  {/* Chỉ hiện sửa/xóa nếu là chủ comment */}
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
                  {/* Luôn hiện để test lỗi "không thể report chính mình" */}
                  <DropdownMenuItem onClick={() => onReport?.(comment)}>
                    <Flag className="mr-2 h-4 w-4" /> Báo cáo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Hiển thị form chỉnh sửa hoặc nội dung comment */}
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] text-sm"
                  style={{
                    // backgroundColor: itemBgColor,
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
                {/* Các nút tương tác (like, dislike, reply) */}
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
                  {/* Hiển thị tổng số like nếu có */}
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
                {/* Hiển thị tổng số like nếu có */}
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
                            // backgroundColor: itemBgColor,
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

      {/* Hiển thị các reply (bình luận con) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-8 md:pl-12 flex flex-col gap-2 relative w-full">
          {/* Đường kẻ dọc nối các reply */}
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
                  onReport={onReport}
                />
              )
          )}
        </div>
      )}
      {/* Popup hiển thị chi tiết phản ứng */}
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
