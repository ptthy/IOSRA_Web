// components/StoryRatingSummary.tsx
"use client";

import React from "react";
import { StoryRating } from "@/services/storyRatingService";

/**
 * Props interface cho component StoryRatingSummary
 * Nhận dữ liệu tổng quan đánh giá của một truyện
 */
interface StoryRatingSummaryProps {
  storyRating: StoryRating;
}

/**
 * Component hiển thị tổng quan đánh giá:
 * - Điểm trung bình
 * - Tổng số lượt đánh giá
 * - Phân phối điểm theo sao (5-1 sao)
 *
 * Logic chính:
 * 1. Lấy các giá trị từ props: averageScore, totalRatings, distribution
 * 2. Hiển thị điểm trung bình với 1 chữ số thập phân
 * 3. Vẽ biểu đồ phân phối điểm với thanh tiến trình cho mỗi mức sao
 */
export function StoryRatingSummary({ storyRating }: StoryRatingSummaryProps) {
  // Destructuring để lấy dữ liệu từ props
  const { averageScore, totalRatings, distribution } = storyRating;

  /**
   * Helper function để lấy giá trị phân phối an toàn
   * Vì distribution có thể là object với keys là string ("1", "2", "3", "4", "5")
   *
   * @param star - Số sao (1-5)
   * @returns Số lượng đánh giá cho mức sao đó, mặc định là 0 nếu không tồn tại
   */
  const getDistributionValue = (star: number): number => {
    const key = star.toString() as keyof typeof distribution;
    return distribution[key] || 0; // Trả về 0 nếu key không tồn tại
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      {/* Phần chính chứa điểm trung bình và phân phối */}
      <div className="flex items-center gap-4">
        {/* Điểm trung bình và tổng số đánh giá */}
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-600">
            {/* Hiển thị điểm trung bình với 1 chữ số thập phân, mặc định "0.0" nếu không có */}
            {averageScore?.toFixed(1) || "0.0"}
          </div>
          <div className="text-sm text-muted-foreground">
            {totalRatings} đánh giá
          </div>
        </div>

        {/* Phân phối điểm theo sao */}
        <div className="flex-1 space-y-1">
          {/*
            Hiển thị từ 5 sao xuống 1 sao
            Mảng [5, 4, 3, 2, 1] để hiển thị theo thứ tự từ cao xuống thấp
          */}
          {[5, 4, 3, 2, 1].map((star) => {
            // Lấy số lượng đánh giá cho mức sao hiện tại
            const count = getDistributionValue(star);
            /**
             * Tính tỷ lệ phần trăm:
             * - Nếu có đánh giá: (số lượng mức sao / tổng số đánh giá) * 100
             * - Mặc định 0% nếu chưa có đánh giá nào
             */
            const percentage =
              totalRatings > 0 ? (count / totalRatings) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-2">
                {/* Nhãn số sao */}
                <span className="text-sm w-8">{star} sao</span>
                {/* Thanh tiến trình */}
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      // Độ rộng thanh dựa trên tỷ lệ phần trăm
                      width: `${percentage}%`,
                    }}
                  />
                </div>
                {/* Số lượng đánh giá cụ thể */}
                <span className="text-sm w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
