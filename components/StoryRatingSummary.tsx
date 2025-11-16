// components/StoryRatingSummary.tsx
"use client";

import React from "react";
import { StoryRating } from "@/services/storyRatingService";

interface StoryRatingSummaryProps {
  storyRating: StoryRating;
}

export function StoryRatingSummary({ storyRating }: StoryRatingSummaryProps) {
  const { averageScore, totalRatings, distribution } = storyRating;

  // Helper function để lấy giá trị distribution an toàn
  const getDistributionValue = (star: number): number => {
    const key = star.toString() as keyof typeof distribution;
    return distribution[key] || 0;
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      {/* Điểm trung bình và tổng số đánh giá */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-600">
            {averageScore?.toFixed(1) || "0.0"}
          </div>
          <div className="text-sm text-muted-foreground">
            {totalRatings} đánh giá
          </div>
        </div>

        {/* Phân phối điểm */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = getDistributionValue(star);
            const percentage =
              totalRatings > 0 ? (count / totalRatings) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-sm w-8">{star} sao</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
                <span className="text-sm w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
