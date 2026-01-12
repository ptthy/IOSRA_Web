// components/StoryRatingActions.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  storyRatingApi,
  type ViewerRating,
} from "@/services/storyRatingService";

/**
 * Props interface cho component StoryRatingActions
 * Cho phép người dùng đánh giá hoặc xóa đánh giá của họ
 */
interface StoryRatingActionsProps {
  storyId: string; // ID của truyện cần đánh giá
  currentRating?: ViewerRating | null; // Đánh giá hiện tại của người dùng (nếu có)
  onRatingUpdate: () => void; // Callback khi đánh giá được cập nhật
}

/**
 * Component cho phép người dùng thực hiện các hành động đánh giá:
 * - Chọn điểm số (1-5 sao)
 * - Gửi đánh giá lên server
 * - Xóa đánh giá đã có
 *
 * Logic chính:
 * 1. Kiểm tra trạng thái đăng nhập
 * 2. Đồng bộ điểm số hiện tại từ props
 * 3. Xử lý gửi/xóa đánh giá với API
 */
export function StoryRatingActions({
  storyId,
  currentRating,
  onRatingUpdate,
}: StoryRatingActionsProps) {
  // State quản lý trạng thái loading
  const [isSubmitting, setIsSubmitting] = useState(false); // Đang gửi đánh giá
  const [isDeleting, setIsDeleting] = useState(false); // Đang xóa đánh giá
  // State lưu điểm số người dùng đã chọn
  const [userRating, setUserRating] = useState<number | null>(null);
  // Kiểm tra trạng thái đăng nhập
  const { isAuthenticated } = useAuth();

  /**
   * useEffect để đồng bộ currentRating từ props vào state
   * Chạy mỗi khi currentRating thay đổi
   */
  useEffect(() => {
    console.log(
      "Current rating received:",
      currentRating,
      "Type:",
      typeof currentRating
    );

    /**
     * Xử lý nhiều trường hợp của currentRating:
     * 1. Là object ViewerRating có property "score"
     * 2. Là number trực tiếp
     * 3. Là null/undefined (chưa đánh giá)
     * 4. Định dạng không hợp lệ
     */
    if (
      currentRating &&
      typeof currentRating === "object" &&
      "score" in currentRating
    ) {
      // Trường hợp 1: currentRating là object
      const score = currentRating.score;
      if (typeof score === "number" && score >= 1 && score <= 5) {
        setUserRating(score); // Cập nhật điểm hợp lệ
      } else {
        console.warn("Invalid score in currentRating:", score);
        setUserRating(null); // Reset nếu điểm không hợp lệ
      }
    } else if (
      typeof currentRating === "number" &&
      currentRating >= 1 &&
      currentRating <= 5
    ) {
      // Trường hợp 2: currentRating là number
      setUserRating(currentRating);
    } else if (currentRating === null || currentRating === undefined) {
      // Trường hợp 3: chưa có đánh giá
      setUserRating(null);
    } else {
      // Trường hợp 4: định dạng không xác định
      console.warn("Invalid currentRating format:", currentRating);
      setUserRating(null);
    }
  }, [currentRating]);

  /**
   * Hàm xử lý khi người dùng chọn một mức sao
   *
   * @param score - Điểm số từ 1-5
   */
  const handleRate = async (score: number) => {
    if (!isAuthenticated) {
      // Kiểm tra đăng nhập trước khi đánh giá
      alert("Bạn cần đăng nhập để đánh giá");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting rating:", score);

      // Gọi API submit đánh giá
      const response = await storyRatingApi.submitRating(storyId, { score });

      console.log("Rating response:", response);
      // Cập nhật state với điểm mới
      setUserRating(score);
      // Thông báo thành công
      alert("Đánh giá thành công!");
      onRatingUpdate();
    } catch (error: any) {
      console.error("Rating error:", error);

      /**
       * Xử lý các lỗi từ API:
       * 1. Lỗi 401: Chưa đăng nhập
       * 2. Lỗi 400 với code "CannotRateOwnStory": Không thể tự đánh giá truyện của mình
       * 3. Lỗi khác: Thông báo chung
       */
      const responseData = error.response?.data;
      const errorCode = responseData?.error?.code;
      if (error.response?.status === 401) {
        alert("Bạn cần đăng nhập để đánh giá");
      } else if (
        error.response?.status === 400 &&
        errorCode === "CannotRateOwnStory"
      ) {
        alert("Bạn không thể tự đánh giá truyện của mình!");
      } else {
        alert("Có lỗi xảy ra khi gửi đánh giá");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Hàm xử lý xóa đánh giá
   */
  const handleDeleteRating = async () => {
    if (!isAuthenticated) {
      alert("Bạn cần đăng nhập để xóa đánh giá");
      return;
    }

    setIsDeleting(true);
    try {
      // Gọi API xóa đánh giá
      await storyRatingApi.deleteRating(storyId);
      // Reset điểm về null
      setUserRating(null);
      // Gọi callback refresh dữ liệu
      alert("Đã xóa đánh giá!");
      onRatingUpdate();
    } catch (error: any) {
      console.error("Delete rating error:", error);
      // Xử lý lỗi
      if (error.response?.status === 401) {
        alert("Bạn cần đăng nhập để xóa đánh giá");
      } else {
        alert("Có lỗi xảy ra khi xóa đánh giá");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Phần chọn sao đánh giá */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium whitespace-nowrap">Đánh giá:</span>
        <div className="flex gap-1">
          {/*
            Tạo 5 nút sao cho người dùng chọn
            Mỗi sao là một button với sự kiện onClick
          */}
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              disabled={isSubmitting} // Disable khi đang gửi
              className={`p-1 transition-all ${
                // Highlight các sao đã được chọn
                userRating !== null && star <= userRating
                  ? "text-yellow-500 scale-110" // Sao được chọn: màu vàng và phóng to nhẹ
                  : "text-gray-300 hover:text-yellow-400" // Sao chưa chọn: màu xám, hover vàng
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Star
                className={`w-5 h-5 ${
                  // Fill màu cho các sao đã chọn
                  userRating !== null && star <= userRating
                    ? "fill-current"
                    : ""
                }`}
              />
            </button>
          ))}
        </div>
        {/* Hiển thị điểm số hiện tại nếu có */}
        {userRating !== null && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            ({userRating}/5)
          </span>
        )}
      </div>

      {/* Nút xóa đánh giá - cùng hàng với sao trên desktop, xuống dòng trên mobile
      {userRating !== null && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteRating}
          disabled={isDeleting}
          className="whitespace-nowrap"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          Xóa đánh giá
        </Button>
      )} */}
    </div>
  );
}
