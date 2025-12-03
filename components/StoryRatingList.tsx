// components/StoryRatingList.tsx
"use client";

import React from "react";
import { RatingItem } from "@/services/storyRatingService";
import { Star } from "lucide-react";
// 1. Import useRouter từ next/navigation
import { useRouter } from "next/navigation";

interface StoryRatingListProps {
  ratings: RatingItem[];
}

export function StoryRatingList({ ratings }: StoryRatingListProps) {
  // 2. Khởi tạo router
  const router = useRouter();

  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chưa có đánh giá nào
      </div>
    );
  }

  // Hàm xử lý chuyển trang
  const handleUserClick = (readerId: string) => {
    router.push(`/profile/${readerId}`);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">
        Đánh giá từ độc giả ({ratings.length})
      </h3>

      {ratings.map((rating) => (
        <div
          key={`${rating.readerId}-${rating.ratedAt}`}
          // 3. Thêm sự kiện onClick và style con trỏ chuột
          onClick={() => handleUserClick(rating.readerId)}
          className="flex gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        >
          {/* Avatar với logic đơn giản giống trang profile */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border/50 bg-muted">
              {rating.avatarUrl ? (
                <img
                  src={rating.avatarUrl}
                  alt={rating.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = document.createElement("div");
                      fallback.className =
                        "w-full h-full flex items-center justify-center";
                      fallback.innerHTML = `<span class="text-sm font-bold text-primary-foreground">${rating.username
                        .charAt(0)
                        .toUpperCase()}</span>`;
                      parent.appendChild(fallback);
                      (e.target as HTMLImageElement).style.display = "none";
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {rating.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium hover:text-primary transition-colors">
                {rating.username}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= rating.score
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-sm font-medium ml-1">
                  {rating.score}.0
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(rating.ratedAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
