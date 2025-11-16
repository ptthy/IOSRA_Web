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
          <img
            src={rating.avatarUrl}
            alt={rating.username}
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjEuNSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiLz48cGF0aCBkPSJtMTQgMjYgMi0yIDIgMiA0LTQiLz48Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSIyIi8+PGNpcmNsZSBjeD0iMjUiIGN5PSIxNSIgcj0iMiIvPjwvc3ZnPg==";
            }}
          />
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
