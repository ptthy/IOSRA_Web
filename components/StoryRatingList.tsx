// components/StoryRatingList.tsx
"use client";

import React from "react";
import { RatingItem } from "@/services/storyRatingService";
import { Star } from "lucide-react";

interface StoryRatingListProps {
  ratings: RatingItem[];
}

export function StoryRatingList({ ratings }: StoryRatingListProps) {
  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chưa có đánh giá nào
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">
        Đánh giá từ độc giả ({ratings.length})
      </h3>

      {ratings.map((rating) => (
        <div
          key={`${rating.readerId}-${rating.ratedAt}`}
          className="flex gap-3 p-4 border rounded-lg"
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
                    // Khi ảnh lỗi, thay thế bằng fallback
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = document.createElement("div");
                      fallback.className =
                        "w-full h-full  flex items-center justify-center";
                      fallback.innerHTML = `<span class="text-sm font-bold text-primary-foreground">${rating.username
                        .charAt(0)
                        .toUpperCase()}</span>`;
                      parent.appendChild(fallback);
                      (e.target as HTMLImageElement).style.display = "none";
                    }
                  }}
                />
              ) : (
                // Fallback khi không có avatarUrl
                <div className="w-full h-full  flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {rating.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{rating.username}</span>
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
