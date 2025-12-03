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

interface StoryRatingActionsProps {
  storyId: string;
  currentRating?: ViewerRating | null;
  onRatingUpdate: () => void;
}

export function StoryRatingActions({
  storyId,
  currentRating,
  onRatingUpdate,
}: StoryRatingActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.log(
      "Current rating received:",
      currentRating,
      "Type:",
      typeof currentRating
    );

    // Xử lý currentRating là object (ViewerRating)
    if (
      currentRating &&
      typeof currentRating === "object" &&
      "score" in currentRating
    ) {
      const score = currentRating.score;
      if (typeof score === "number" && score >= 1 && score <= 5) {
        setUserRating(score);
      } else {
        console.warn("Invalid score in currentRating:", score);
        setUserRating(null);
      }
    } else if (
      typeof currentRating === "number" &&
      currentRating >= 1 &&
      currentRating <= 5
    ) {
      setUserRating(currentRating);
    } else if (currentRating === null || currentRating === undefined) {
      setUserRating(null);
    } else {
      console.warn("Invalid currentRating format:", currentRating);
      setUserRating(null);
    }
  }, [currentRating]);

  const handleRate = async (score: number) => {
    if (!isAuthenticated) {
      alert("Bạn cần đăng nhập để đánh giá");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting rating:", score);
      const response = await storyRatingApi.submitRating(storyId, { score });

      console.log("Rating response:", response);
      setUserRating(score);

      alert("Đánh giá thành công!");
      onRatingUpdate();
    } catch (error: any) {
      console.error("Rating error:", error);
      // Lấy dữ liệu lỗi từ API trả về
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

  const handleDeleteRating = async () => {
    if (!isAuthenticated) {
      alert("Bạn cần đăng nhập để xóa đánh giá");
      return;
    }

    setIsDeleting(true);
    try {
      await storyRatingApi.deleteRating(storyId);
      setUserRating(null);
      alert("Đã xóa đánh giá!");
      onRatingUpdate();
    } catch (error: any) {
      console.error("Delete rating error:", error);
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
      {/* Phần sao đánh giá */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium whitespace-nowrap">Đánh giá:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              disabled={isSubmitting}
              className={`p-1 transition-all ${
                userRating !== null && star <= userRating
                  ? "text-yellow-500 scale-110"
                  : "text-gray-300 hover:text-yellow-400"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Star
                className={`w-5 h-5 ${
                  userRating !== null && star <= userRating
                    ? "fill-current"
                    : ""
                }`}
              />
            </button>
          ))}
        </div>
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
