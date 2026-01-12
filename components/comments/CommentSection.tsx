// components/comments/CommentSection.tsx
/**
 * MỤC ĐÍCH: Component chính quản lý toàn bộ section bình luận của chương/truyện
 * CHỨC NĂNG CỐT LÕI:
 * 1. Hiển thị danh sách comments và replies (dạng tree)
 * 2. Form thêm comment mới (root comment)
 * 3. Filter comments theo chương (nếu có nhiều chương)
 * 4. Phân trang (load more) cho comments
 * 5. Tích hợp theme động (cho reader mode)
 * 6. Quản lý state cục bộ để cập nhật UI ngay lập tức
 *
 * KIẾN TRÚC DATA FLOW:
 * - Nhận comments từ props (từ parent component)
 * - Quản lý local state để xử lý thêm/sửa/xóa ngay trên UI
 * - Gọi callbacks để thông báo cho parent xử lý API
 */
"use client";

import React, { useState, useEffect } from "react";
import { ChapterComment } from "@/services/chapterCommentService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { CommentItem } from "./CommentItem";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Interface cho Theme (từ reader)
interface ReaderTheme {
  bg: string; // Màu nền
  text: string; // Màu chữ
  secondary?: string; // Màu phụ
}

interface CommentSectionProps {
  // Data
  comments: ChapterComment[]; // Danh sách comments từ API
  // Callbacks - parent component xử lý API
  onAddComment: (
    content: string,
    parentCommentId?: string
  ) => Promise<ChapterComment | any>; // Thêm comment hoặc reply
  onUpdateComment?: (commentId: string, content: string) => Promise<void>; // Sửa comment
  onDeleteComment?: (commentId: string) => Promise<void>; // Xóa comment
  onLikeComment?: (commentId: string) => Promise<void>; // Like comment
  onDislikeComment?: (commentId: string) => Promise<void>; // Dislike comment
  onRemoveReaction?: (commentId: string) => Promise<void>; // Bỏ reaction
  // UI States
  loading?: boolean; // Loading khi fetch comments
  hasMore?: boolean; // Có thêm comments để load không
  onLoadMore?: () => void; // Callback load more
  // Filter theo chương
  showChapterFilter?: boolean; // Có hiển thị filter không
  chapters?: Array<{ chapterId: string; chapterNo: number; title: string }>; // Danh sách chương
  selectedChapter?: string; // Chương đang chọn filter
  onChapterFilterChange?: (chapterId: string) => void; // Callback thay đổi filter
  // IDs cho context
  chapterId?: string; // ID chương hiện tại
  storyId?: string; // ID truyện
  currentUserId?: string; // ID user hiện tại
  totalCount?: number; // Tổng số comments (cho pagination)
  // Theme
  theme?: ReaderTheme; // Theme object từ reader
  // Report
  onReport?: (comment: ChapterComment) => void; // Callback báo cáo comment
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
  theme,
  onReport,
}: CommentSectionProps) {
  /**
   * STATE QUẢN LÝ COMMENTS CỤC BỘ:
   * Dùng để cập nhật UI ngay lập tức khi thêm/sửa/xóa
   * Không phụ thuộc vào re-fetch từ API mỗi lần có thay đổi
   */
  const [localComments, setLocalComments] =
    useState<ChapterComment[]>(initialComments);
  const [newComment, setNewComment] = useState(""); // Nội dung comment mới
  const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái submit
  const { user } = useAuth(); // Lấy thông tin user hiện tại từ AuthContext

  /**
   * EFFECT ĐỒNG BỘ COMMENTS TỪ PROPS VÀO STATE CỤC BỘ:
   * Khi initialComments thay đổi (tải thêm, filter, refresh), cập nhật localComments
   * Quan trọng: Giữ cho UI luôn đồng bộ với data từ parent
   */
  useEffect(() => {
    setLocalComments(initialComments);
  }, [initialComments]);
  /**
   * HÀM ĐỆ QUY THÊM REPLY VÀO ĐÚNG VỊ TRÍ TRONG CÂY COMMENTS:
   * @param comments - Mảng comments hiện tại
   * @param parentId - ID comment cha (nơi reply thuộc về)
   * @param newReply - Reply object mới từ API
   * @returns Mảng comments mới với reply được thêm vào đúng vị trí
   *
   * Logic:
   * 1. Tìm comment có commentId = parentId → thêm reply vào đầu mảng replies
   * 2. Nếu không tìm thấy → đệ quy tìm trong replies của từng comment
   * 3. Duyệt qua toàn bộ cây comments cho đến khi tìm thấy parent
   */
  const addReplyToState = (
    comments: ChapterComment[],
    parentId: string,
    newReply: ChapterComment
  ): ChapterComment[] => {
    return comments.map((c) => {
      if (c.commentId === parentId) {
        // Tìm thấy comment cha → thêm reply vào đầu mảng
        return {
          ...c,
          replies: c.replies ? [newReply, ...c.replies] : [newReply],
        };
      } else if (c.replies && c.replies.length > 0) {
        // Tìm đệ quy trong replies
        return {
          ...c,
          replies: addReplyToState(c.replies, parentId, newReply),
        };
      }
      return c;
    });
  };
  /**
   * WRAPPER HÀM XỬ LÝ GỬI REPLY:
   * 1. Gọi API gửi reply qua callback onAddComment
   * 2. Cập nhật state cục bộ nếu thành công
   * 3. Thông báo lỗi nếu có
   *
   * @param content - Nội dung reply
   * @param parentId - ID comment cha
   */
  const handleReplySubmitWrapper = async (
    content: string,
    parentId: string
  ) => {
    try {
      const newReplyData = await onAddComment(content, parentId);
      if (!newReplyData || !newReplyData.commentId) return;
      // Cập nhật UI ngay lập tức bằng cách thêm reply vào tree
      setLocalComments((prev) => addReplyToState(prev, parentId, newReplyData));
    } catch (error) {
      console.error("Lỗi khi reply:", error);
      throw error;
    }
  };
  /**
   * HÀM XỬ LÝ GỬI COMMENT MỚI (KHÔNG PHẢI REPLY):
   * 1. Ngăn form submit mặc định
   * 2. Validate input không rỗng
   * 3. Gọi API thêm comment qua callback
   * 4. Thêm comment mới vào đầu danh sách (optimistic update)
   * 5. Reset input và loading state
   *
   * @param e - React form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await onAddComment(newComment, undefined);
      if (created && created.commentId)
        // Optimistic update: Thêm comment mới vào đầu danh sách
        setLocalComments([created, ...localComments]);
      setNewComment(""); // Reset input
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * CÁC HÀM WRAPPER ĐỂ GỌI CALLBACK TỪ PROPS:
   * Đóng gói các callback để truyền xuống CommentItem
   * Giữ nguyên signature của callback gốc
   */
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

  // --- STYLE LOGIC ---
  /**
   * TẠO STYLE ĐỘNG DỰA TRÊN THEME:
   * - dynamicTextStyle: Màu chữ chính
   * - dynamicSubTextStyle: Màu chữ phụ (với opacity)
   * - inputBgColor: Màu nền input (khác nhau cho theme sáng/tối)
   * - inputBorderColor: Màu viền input
   *
   * Logic theme:
   * - Nếu theme tối (text #f0ead6) → nền input sáng mờ (rgba(255,255,255,0.08))
   * - Nếu theme sáng → nền đen mờ (rgba(0,0,0,0.04))
   */
  const dynamicTextStyle = theme ? { color: theme.text } : {};
  const dynamicSubTextStyle = theme ? { color: theme.text, opacity: 0.7 } : {};

  // Nếu theme tối (text #f0ead6) -> nền input sáng mờ. Theme sáng -> nền đen mờ.
  const isDarkTheme = theme?.text === "#f0ead6";
  const inputBgColor = theme
    ? isDarkTheme
      ? "rgba(255, 255, 255, 0.08)" // Nền sáng mờ cho theme tối
      : "rgba(0, 0, 0, 0.04)" // Nền đen mờ cho theme sáng
    : undefined;

  const inputBorderColor = theme
    ? isDarkTheme
      ? "rgba(255, 255, 255, 0.15)" // Viền sáng cho theme tối
      : "rgba(0, 0, 0, 0.1)" // Viền đen cho theme sáng
    : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Header với số lượng comments */}
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" style={dynamicTextStyle} />
          <h3 className="text-lg font-semibold" style={dynamicTextStyle}>
            Bình luận
          </h3>
          <span className="text-sm" style={dynamicSubTextStyle}>
            ({totalCount > 0 ? totalCount : localComments.length})
          </span>
        </div>
        {/* Filter theo chapter (nếu có) */}
        {showChapterFilter && chapters.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm" style={dynamicSubTextStyle}>
              Lọc theo chương:
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => onChapterFilterChange?.(e.target.value)}
              className="border rounded-md px-3 py-1 text-sm"
              style={{
                backgroundColor: inputBgColor || "transparent",
                color: theme?.text,
                borderColor: inputBorderColor,
              }}
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
        {/* Form thêm comment mới */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <Avatar
              className="h-10 w-10 border"
              style={{ borderColor: inputBorderColor }}
            >
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback
                style={{ color: theme?.text, backgroundColor: inputBgColor }}
              >
                U
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  user
                    ? `Bình luận dưới tên ${user.displayName}...`
                    : "Viết bình luận..."
                }
                className="min-h-[100px] resize-none focus-visible:ring-1 focus-visible:ring-offset-0 border"
                style={{
                  backgroundColor: inputBgColor,
                  color: theme?.text,
                  borderColor: inputBorderColor,
                }}
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none"
                >
                  <Send className="h-4 w-4 mr-2" />{" "}
                  {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
      {/* Danh sách comments */}
      <div className="space-y-4">
        {loading && localComments.length === 0 ? (
          // Loading state khi chưa có comment nào
          <div className="flex justify-center py-8">
            <Loader2
              className="h-6 w-6 animate-spin"
              style={dynamicTextStyle}
            />
          </div>
        ) : localComments.length === 0 ? (
          // Empty state
          <div className="text-center py-8" style={dynamicSubTextStyle}>
            <p>Chưa có bình luận nào</p>
          </div>
        ) : (
          <>
            {/* Render từng comment */}
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
                theme={theme}
                onReport={onReport}
              />
            ))}
            {/* Nút tải thêm comments */}
            {hasMore && onLoadMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={onLoadMore}
                  disabled={loading}
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: "transparent",
                    color: theme?.text,
                    borderColor: inputBorderColor,
                  }}
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
