// components/StoryRatingList.tsx
"use client";

import React from "react";
import { RatingItem } from "@/services/storyRatingService";
import { Star } from "lucide-react";
// 1. Import useRouter từ next/navigation
import { useRouter } from "next/navigation";

/**
 * Props interface cho component StoryRatingList
 * Nhận danh sách các đánh giá chi tiết
 */
interface StoryRatingListProps {
  ratings: RatingItem[];
}

/**
 * Component hiển thị danh sách đánh giá chi tiết từ độc giả
 *
 * Logic chính:
 * 1. Hiển thị danh sách đánh giá với avatar, tên, điểm số, ngày đánh giá
 * 2. Khi click vào một đánh giá sẽ điều hướng đến trang profile của người đánh giá
 * 3. Xử lý fallback avatar nếu ảnh lỗi
 */
export function StoryRatingList({ ratings }: StoryRatingListProps) {
  // 2. Khởi tạo router điều hướng trang
  const router = useRouter();

  /**
   * Xử lý trường hợp không có đánh giá nào
   * Hiển thị thông báo thay vì danh sách rỗng
   */
  if (ratings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chưa có đánh giá nào
      </div>
    );
  }

  /**
   * Hàm xử lý khi click vào một đánh giá
   * Điều hướng đến trang profile của người đọc
   *
   * @param readerId - ID của người đọc (người đã đánh giá)
   */
  const handleUserClick = (readerId: string) => {
    router.push(`/profile/${readerId}`);
  };

  return (
    <div className="space-y-4">
      {/* Tiêu đề với số lượng đánh giá */}
      <h3 className="font-semibold text-lg">
        Đánh giá từ độc giả ({ratings.length})
      </h3>

      {/* Danh sách các đánh giá */}
      {ratings.map((rating) => (
        <div
          key={`${rating.readerId}-${rating.ratedAt}`}
          // Thêm sự kiện onClick để điều hướng đến profile
          onClick={() => handleUserClick(rating.readerId)}
          // Thêm hiệu ứng hover và cursor pointer cho trải nghiệm người dùng
          className="flex gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        >
          {/* Avatar của người đánh giá */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border/50 bg-muted">
              {rating.avatarUrl ? (
                /**
                 * Nếu có avatarUrl: hiển thị ảnh
                 * Thêm fallback khi ảnh lỗi bằng sự kiện onError
                 */
                <img
                  src={rating.avatarUrl}
                  alt={rating.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Lấy phần tử cha (div chứa ảnh)
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      // Tạo div fallback hiển thị chữ cái đầu tên
                      const fallback = document.createElement("div");
                      fallback.className =
                        "w-full h-full flex items-center justify-center";
                      fallback.innerHTML = `<span class="text-sm font-bold text-primary-foreground">${rating.username
                        .charAt(0)
                        .toUpperCase()}</span>`;
                      // Thêm fallback vào DOM và ẩn ảnh lỗi
                      parent.appendChild(fallback);
                      (e.target as HTMLImageElement).style.display = "none";
                    }
                  }}
                />
              ) : (
                /**
                 * Nếu không có avatarUrl: hiển thị chữ cái đầu tên
                 */
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {rating.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Thông tin đánh giá */}
          <div className="flex-1">
            {/* Dòng đầu: tên người dùng và điểm số */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium hover:text-primary transition-colors">
                {rating.username}
              </span>
              {/* Hiển thị sao đánh giá */}

              <div className="flex items-center gap-1">
                {/*
                  Tạo 5 ngôi sao, fill màu cho các sao <= điểm đánh giá
                  Ví dụ: rating.score = 4 => fill 4 sao đầu, sao thứ 5 rỗng
                */}
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= rating.score
                        ? "fill-yellow-500 text-yellow-500" // Sao được chọn
                        : "text-gray-300" // Sao không được chọn
                    }`}
                  />
                ))}
                {/* Hiển thị điểm số dạng số */}
                <span className="text-sm font-medium ml-1">
                  {rating.score}.0
                </span>
              </div>
            </div>
            {/* Ngày đánh giá - định dạng theo tiếng Việt */}
            <div className="text-sm text-muted-foreground">
              {new Date(rating.ratedAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long", // Hiển thị tên tháng (vd: "tháng 1")
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
