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
  Crown,
  Unlock,
  Gem,
} from "lucide-react";
import { storyCatalogApi } from "@/services/storyCatalog";
import { Story } from "@/services/apiTypes";
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
import { StatusRibbon } from "@/components/StatusRibbon";
/**
 * COMPONENT IMAGE WITH FALLBACK
 *
 * MỤC ĐÍCH: Hiển thị ảnh với cơ chế fallback khi lỗi
 * LOGIC XỬ LÝ:
 * 1. Theo dõi state imageError để biết ảnh có load được không
 * 2. Nếu lỗi -> hiển thị ảnh placeholder (base64 SVG)
 * 3. Nếu không lỗi -> hiển thị ảnh gốc
 * 4. Bắt sự kiện onError để cập nhật trạng thái lỗi
 *
 * THAM SỐ:
 * - src: URL ảnh gốc
 * - alt: Text thay thế khi ảnh lỗi
 * - className: CSS class tùy chỉnh
 */
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
/**
 * COMPONENT CHÍNH: TRANG CHI TIẾT TRUYỆN
 *
 * MỤC ĐÍCH: Hiển thị đầy đủ thông tin về một truyện cụ thể
 * CHỨC NĂNG CHÍNH:
 * 1. Hiển thị thông tin truyện (ảnh bìa, tiêu đề, tác giả, mô tả)
 * 2. Quản lý danh sách chương với sắp xếp (mới/cũ)
 * 3. Xử lý rating/đánh giá truyện
 * 4. Quản lý hệ thống bình luận (thêm, xóa, sửa, reply, like/dislike)
 * 5. Xử lý report (báo cáo truyện, chương, bình luận)
 * 6. Theo dõi trạng thái yêu thích
 *
 * FLOW DỮ LIỆU:
 * 1. Lấy storyId từ URL params
 * 2. Fetch dữ liệu truyện, chương, rating, comment (song song)
 * 3. Render giao diện với tabs (Chapters/Ratings/Comments)
 * 4. Xử lý tương tác người dùng (đọc truyện, bình luận, report)
 */
export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.storyId as string;
  /**
   * HÀM XỬ LÝ LỖI API THỐNG NHẤT
   *
   * LOGIC XỬ LÝ LỖI THEO THỨ TỰ ƯU TIÊN:
   * 1. Kiểm tra lỗi validation từ backend (có details)
   *    -> Lấy lỗi đầu tiên từ object details
   * 2. Kiểm tra message từ backend
   * 3. Fallback: Lấy message từ response hoặc dùng defaultMessage
   *
   * VÍ DỤ RESPONSE LỖI TỪ BACKEND:
   * {
   *   error: {
   *     message: "Invalid input",
   *     details: {
   *       content: ["Nội dung không được để trống"]
   *     }
   *   }
   * }
   */
  const handleApiError = (err: any, defaultMessage: string) => {
    if (err.response && err.response.data && err.response.data.error) {
      const { message, details } = err.response.data.error;
      // Lỗi chi tiết (Validation)
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          toast.error(details[firstKey].join(" "));
          return;
        }
      }
      // Thông báo message từ backend
      if (message) {
        toast.error(message);
        return;
      }
    }
    // Lỗi mạng hoặc lỗi 500
    toast.error(err.response?.data?.message || defaultMessage);
  };
  const { user } = useAuth();
  // STATE QUẢN LÝ DỮ LIỆU VÀ TRẠNG THÁI
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
    type: "story" | "chapter" | "comment";
    id: string;
    title: string;
  } | null>(null);
  //  State để kiểm tra chế độ tối
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  /**
   * EFFECT KIỂM TRA CHẾ ĐỘ TỐI
   *
   * LOGIC:
   * 1. Kiểm tra class 'dark' trên thẻ html
   * 2. Hoặc kiểm tra system preference (prefers-color-scheme: dark)
   * 3. Lắng nghe thay đổi class của html để cập nhật real-time
   * 4. Sử dụng MutationObserver để theo dõi thay đổi
   */
  useEffect(() => {
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
  /**
   * EFFECT CUỘN LÊN ĐẦU KHI VÀO TRANG
   *
   * MỤC ĐÍCH: Đảm bảo khi người dùng vào trang hoặc chuyển truyện
   *           luôn bắt đầu từ đầu trang
   *
   * CHẠY KHI: storyId thay đổi (người dùng xem truyện khác)
   */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [storyId]);
  /**
   * HÀM XỬ LÝ REPORT COMMENT
   *
   * FLOW:
   * 1. Nhận comment object từ CommentItem
   * 2. Set reportTarget với type="comment"
   * 3. Mở modal report
   */
  const handleReportComment = (comment: ChapterComment) => {
    setReportTarget({
      type: "comment",
      id: comment.commentId,
      title: `Bình luận của ${comment.username}`,
    });
    setShowReportModal(true);
  };

  // --- HELPER RECURSIVE FUNCTIONS CHO COMMENTS ---

  /**
   * HÀM ĐỆ QUY CẬP NHẬT COMMENT
   *
   * MỤC ĐÍCH: Tìm và cập nhật nội dung comment trong cây comments
   *
   * THUẬT TOÁN:
   * 1. Duyệt qua từng comment trong list
   * 2. Nếu tìm thấy commentId trùng -> cập nhật content
   * 3. Nếu comment có replies -> gọi đệ quy để tìm trong replies
   * 4. Trả về list mới với comment đã cập nhật
   */
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
  /**
   * HÀM ĐỆ QUY XÓA COMMENT
   *
   * THUẬT TOÁN:
   * 1. Filter bỏ comment có id trùng khớp
   * 2. Với các comment còn lại, kiểm tra nếu có replies
   * 3. Gọi đệ quy để xóa comment trong replies
   */
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

  /**
   * HÀM ĐỆ QUY THÊM REPLY VÀO COMMENT
   *
   * MỤC ĐÍCH: Thêm reply mới vào đúng vị trí parent comment
   *
   * LOGIC:
   * 1. Duyệt qua list comments
   * 2. Tìm parentId trùng -> thêm newReply vào đầu mảng replies
   * 3. Nếu không tìm thấy -> tiếp tục tìm trong replies (đệ quy)
   *
   * LƯU Ý: Thêm vào đầu mảng để hiển thị reply mới nhất lên trước
   */
  const addReplyToState = (
    comments: ChapterComment[],
    parentId: string,
    newReply: ChapterComment
  ): ChapterComment[] => {
    return comments.map((c) => {
      if (c.commentId === parentId) {
        //  FIX: Thêm vào đầu mảng replies
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
  /**
   * HÀM TÌM COMMENT THEO ID (ĐỆ QUY)
   *
   * THUẬT TOÁN TÌM KIẾM THEO CHIỀU SÂU (DFS):
   * 1. Duyệt qua từng comment
   * 2. Nếu commentId trùng -> return comment
   * 3. Nếu có replies -> gọi đệ quy để tìm trong replies
   * 4. Return null nếu không tìm thấy
   */
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
  /**
   * EFFECT LOAD DỮ LIỆU CHÍNH (TRUYỆN, CHƯƠNG, RATING)
   *
   * FLOW:
   * 1. Set loading = true
   * 2. Gọi 3 API song song (Promise.all):
   *    - Lấy thông tin truyện
   *    - Lấy danh sách chương
   *    - Lấy rating truyện
   * 3. Thử lấy tổng số comment (optional)
   * 4. Set state và loading = false
   *
   * CHẠY KHI: storyId thay đổi
   */
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
        // Lấy tổng số comments (optional, có thể bỏ qua nếu lỗi)
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
  /**
   * EFFECT LOAD COMMENTS KHI CHUYỂN TAB
   *
   * CHẠY KHI:
   * - storyId thay đổi
   * - activeTab = "comments"
   * - selectedChapter thay đổi
   */
  useEffect(() => {
    if (storyId && activeTab === "comments") loadComments();
  }, [storyId, activeTab, selectedChapter]);
  /**
   * HÀM LOAD COMMENTS PHÂN TRANG
   *
   * LOGIC PHÂN TRANG:
   * 1. Nếu page = 1 -> reset comments (load mới)
   * 2. Nếu page > 1 -> append thêm comments vào cuối
   * 3. Kiểm tra hasMoreComments: nếu API trả về đủ pageSize (20) -> còn dữ liệu
   *
   * FILTER THEO CHAPTER:
   * - Nếu selectedChapter !== "all" -> thêm chapterId vào query
   */
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

  /**
   * FIX QUAN TRỌNG: XỬ LÝ THÊM COMMENT VÀ REPLY
   *
   * 2 TRƯỜNG HỢP:
   * 1. REPLY COMMENT (có parentCommentId):
   *    - Tìm parent comment trong state
   *    - Gọi API tạo reply với parentCommentId
   *    - Cập nhật state bằng addReplyToState (đệ quy)
   *
   * 2. ROOT COMMENT (không có parent):
   *    - Xác định chapterId mục tiêu:
   *        + Nếu đã chọn chapter cụ thể -> dùng chapter đó
   *        + Nếu "all" -> dùng chapter đầu tiên của truyện
   *    - Gọi API tạo comment root
   *    - Thêm vào đầu mảng comments
   */
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
      //console.error("Error creating comment:", error);
      handleApiError(error, "Gửi bình luận thất bại.");
      throw error;
    }
  };
  /**
   * HÀM CẬP NHẬT COMMENT
   *
   * FLOW:
   * 1. Tìm comment trong state
   * 2. Gọi API update
   * 3. Cập nhật state với updateCommentRecursive
   * 4. Throw error nếu lỗi để CommentSection xử lý UI
   */
  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      const comment = findCommentById(comments, commentId);
      if (!comment) return;
      await chapterCommentService.updateComment(comment.chapterId, commentId, {
        content,
      });
      // Cập nhật giao diện
      setComments((prev) => updateCommentRecursive(prev, commentId, content));
      toast.success("Đã cập nhật bình luận."); // (Tuỳ chọn) Thêm thông báo thành công
    } catch (error: any) {
      //  Gọi hàm xử lý lỗi chung (đã viết ở trên)
      handleApiError(error, "Chỉnh sửa bình luận thất bại.");

      // Vẫn cần throw error để Component con (CommentSection) biết là lỗi
      // và tắt trạng thái loading/đóng form edit
      throw error;
    }
  };
  /**
   * HÀM XÓA COMMENT
   *
   * FLOW:
   * 1. Tìm comment trong state
   * 2. Gọi API delete
   * 3. Cập nhật state với deleteCommentRecursive
   * 4. Giảm totalComments
   */
  const handleDeleteComment = async (commentId: string) => {
    try {
      const comment = findCommentById(comments, commentId);
      if (!comment) return;
      await chapterCommentService.deleteComment(comment.chapterId, commentId);
      setComments((prev) => deleteCommentRecursive(prev, commentId));
      setTotalComments((prev) => (prev > 0 ? prev - 1 : 0));
      toast.success("Đã xóa bình luận."); // Thêm thông báo thành công
    } catch (error: any) {
      //  Gọi hàm xử lý lỗi
      handleApiError(error, "Xóa bình luận thất bại.");
      throw error; // Ném lỗi để component con xử lý (nếu cần)
    }
  };

  /**
   * HÀM ĐỆ QUY CẬP NHẬT REACTION (LIKE/DISLIKE)
   *
   * LOGIC TOGGLE REACTION:
   * 1. Like hiện tại:
   *    - Đang like -> bỏ like (giảm likeCount)
   *    - Đang dislike -> chuyển sang like (tăng likeCount, giảm dislikeCount)
   *    - Chưa có reaction -> tăng likeCount
   *
   * 2. Dislike hiện tại: tương tự
   *
   * 3. Remove reaction: giảm count tương ứng
   */ const updateReactionRecursive = (
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
  // Các hàm xử lý reaction (like, dislike, remove)
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
    } catch (error: any) {
      //  Gọi hàm xử lý lỗi
      handleApiError(error, "Thao tác Like thất bại.");
      // Với reaction, thường không cần throw error để tránh làm phiền UI quá mức,
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
    } catch (error: any) {
      // Gọi hàm xử lý lỗi
      handleApiError(error, "Thao tác Dislike thất bại.");
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
    } catch (error: any) {
      //  Gọi hàm xử lý lỗi
      handleApiError(error, "Không thể gỡ cảm xúc.");
    }
  };

  const handleLoadMoreComments = () => loadComments(commentsPage + 1);
  const handleChapterFilterChange = (id: string) => {
    setSelectedChapter(id);
    setCommentsPage(1);
  };
  /**
   * HÀM LẤY CHAPTER ĐẦU TIÊN
   *
   * LOGIC: Sắp xếp theo chapterNo tăng dần, lấy phần tử đầu tiên
   */
  const getFirstChapter = () => {
    if (chapters.length === 0) return null;
    return [...chapters].sort((a, b) => a.chapterNo - b.chapterNo)[0];
  };
  /**
   * SẮP XẾP CHAPTERS VỚI useMemo
   *
   * TỐI ƯU HIỆU NĂNG: Chỉ tính toán lại khi chapters hoặc sortOption thay đổi
   *
   * LOGIC SẮP XẾP:
   * - newest: Theo publishedAt giảm dần (mới nhất lên đầu)
   * - oldest: Theo publishedAt tăng dần (cũ nhất lên đầu)
   */
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
  /**
   * HÀM CẬP NHẬT RATING SAU KHI NGƯỜI DÙNG ĐÁNH GIÁ
   */
  const handleRatingUpdate = async () => {
    try {
      setStoryRating(await storyRatingApi.getStoryRating(storyId));
    } catch (e) {
      console.error(e);
    }
  };
  /**
   * HÀM ĐIỀU HƯỚNG ĐẾN TRANG ĐỌC TRUYỆN
   */
  const handleNavigate = (page: string, sId?: string, cId?: string) => {
    if (page === "/reader" && sId && cId) router.push(`/reader/${sId}/${cId}`);
    else if (page === "/") router.push("/");
  };

  const handleReadFromStart = () => {
    const first = getFirstChapter();
    if (first) handleNavigate("/reader", storyId, first.chapterId);
  };
  /**
   * HÀM XỬ LÝ REPORT
   */
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
        {/* CARD CHÍNH HIỂN THỊ THÔNG TIN TRUYỆN */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/20">
          <CardContent className="p-0 relative">
            <StatusRibbon status={story.status} /> {/* KHỐI NÚT BÁO CÁO */}
            <div className="absolute top-4 right-4 z-20">
              {" "}
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
            {/*  KẾT THÚC KHỐI NÚT BÁO CÁO  */}
            {/* LAYOUT 2 CỘT: ẢNH BÌA + THÔNG TIN */}
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
              {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
              <div className="flex-1 space-y-5">
                {/* TIÊU ĐỀ VÀ TÁC GIẢ */}
                <div>
                  <h1 className="text-xl md:text-3xl font-bold mb-3">
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
                {/* TAGS VÀ PREMIUM BADGE */}
                <div className="flex flex-wrap gap-2">
                  {story.tags?.map((tag: any) => (
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
                <div>
                  {/* Stats content... */}
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-y-4 gap-x-4 md:gap-x-8 py-4 border-y border-border/50">
                    {/* Ngôn ngữ */}
                    <div className="flex items-center gap-2.5 min-w-fit">
                      {/* Stats content... */}
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-primary uppercase">
                          {story.languageCode?.split("-")[0] || "VN"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] leading-none text-muted-foreground mb-1 whitespace-nowrap">
                          Ngôn ngữ
                        </p>
                        <p className="font-semibold text-sm truncate">
                          {story.languageCode === "vi-VN" && "Tiếng Việt"}
                          {story.languageCode === "en-US" && "English"}
                          {story.languageCode === "zh-CN" && "中文"}
                          {story.languageCode === "ja-JP" && "日本語"}
                          {!["vi-VN", "en-US", "zh-CN", "ja-JP"].includes(
                            story.languageCode
                          ) && (story as any).languageName}
                        </p>
                      </div>
                    </div>

                    {/* Số chương */}
                    <div className="flex items-center gap-2.5 min-w-fit">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] leading-none text-muted-foreground mb-1">
                          Số chương
                        </p>
                        <p className="font-semibold text-sm">
                          {story.totalChapters}
                        </p>
                      </div>
                    </div>

                    {/* Độ dài dự kiến */}
                    <div className="flex items-center gap-2.5 min-w-fit">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] leading-none text-muted-foreground mb-1">
                          Độ dài
                        </p>
                        <p className="font-semibold text-sm">
                          {story.lengthPlan === "super_short" && "Siêu ngắn"}
                          {story.lengthPlan === "short" && "Ngắn"}
                          {story.lengthPlan === "novel" && "Dài"}
                          {!story.lengthPlan && "---"}
                        </p>
                      </div>
                    </div>

                    {/* Xuất bản */}
                    <div className="flex items-center gap-2.5 min-w-fit">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] leading-none text-muted-foreground mb-1">
                          Xuất bản
                        </p>
                        <p className="font-semibold text-sm">
                          {story.publishedAt
                            ? new Date(story.publishedAt).toLocaleDateString(
                                "vi-VN"
                              )
                            : "---"}
                        </p>
                      </div>
                    </div>

                    {/* Lượt đọc */}
                    <div className="flex items-center gap-2.5 min-w-fit">
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Eye className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] leading-none text-muted-foreground mb-1">
                          Lượt đọc
                        </p>
                        <p className="font-semibold text-sm">
                          {(story as any).totalViews?.toLocaleString("vi-VN") ||
                            0}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* ... more stats ... */}
                </div>
                {/* MÔ TẢ */}
                <div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {story.description}
                  </p>
                </div>
                {/* NÚT HÀNH ĐỘNG */}
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
        {/* TABS: CHAPTERS/RATINGS/COMMENTS */}
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
              {/* TAB 1: DANH SÁCH CHƯƠNG */}
              <TabsContent value="chapters" className="m-0 p-6">
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
                        {/* HIỂN THỊ TRẠNG THÁI CHAPTER */}
                        {/* Chỉ hiện icon khóa nếu bị khóa VÀ CHƯA SỞ HỮU */}
                        {chapter.isLocked && !chapter.isOwned && (
                          <Lock className="h-4 w-4 text-orange-500" />
                        )}
                        {/* Ưu tiên 1: Đã sở hữu (isOwned = true) -> Hiện badge "Đã mở" */}
                        {chapter.isOwned ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700 hover:bg-green-200 gap-1"
                          >
                            <Unlock className="w-3 h-3" /> Đã mở
                          </Badge>
                        ) : chapter.accessType === "dias" ? (
                          // Ưu tiên 2: Chưa mua nhưng tốn phí -> Hiện giá
                          <Badge
                            variant="outline"
                            className="border-yellow-500 text-yellow-600 font-bold"
                          >
                            {chapter.priceDias}{" "}
                            <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                          </Badge>
                        ) : (
                          // Ưu tiên 3: Miễn phí
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
              {/* TAB 2: ĐÁNH GIÁ */}
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
              {/* TAB 3: BÌNH LUẬN */}
              <TabsContent value="comments" className="m-0 p-6">
                <CommentSection
                  comments={comments}
                  onAddComment={handleAddComment}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                  onReport={handleReportComment}
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
      {/* MODALS */}
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
