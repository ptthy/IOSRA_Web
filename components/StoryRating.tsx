// components/StoryRating.tsx
"use client";

import React, { useState, useEffect } from "react";
import { StoryRatingActions } from "./StoryRatingActions";
import { StoryRatingSummary } from "./StoryRatingSummary";
import { StoryRatingList } from "./StoryRatingList";
import {
  storyRatingApi,
  type StoryRating as StoryRatingType,
} from "@/services/storyRatingService";

/**
 * Props interface cho component StoryRating
 * Chỉ cần storyId để fetch dữ liệu đánh giá
 */
interface StoryRatingProps {
  storyId: string;
}

/**
 * Component chính quản lý toàn bộ chức năng đánh giá cho một truyện
 * Bao gồm 3 phần:
 * 1. StoryRatingActions: Cho người dùng đánh giá
 * 2. StoryRatingSummary: Tổng quan điểm số
 * 3. StoryRatingList: Danh sách đánh giá chi tiết
 *
 * Logic chính:
 * 1. Fetch dữ liệu đánh giá từ API khi component mount hoặc storyId thay đổi
 * 2. Quản lý state loading và error
 * 3. Truyền dữ liệu và callback xuống các component con
 */
export function StoryRating({ storyId }: StoryRatingProps) {
  // State lưu dữ liệu đánh giá từ API
  const [storyRating, setStoryRating] = useState<StoryRatingType | null>(null);
  // State quản lý trạng thái loading
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Hàm fetch dữ liệu đánh giá từ API
   * Được gọi khi:
   * 1. Component mount lần đầu
   * 2. storyId thay đổi
   * 3. Khi có callback onRatingUpdate từ component con
   */
  const fetchStoryRating = async () => {
    try {
      setIsLoading(true); // Bắt đầu loading
      // Gọi API lấy dữ liệu đánh giá
      const data = await storyRatingApi.getStoryRating(storyId);
      // Cập nhật state với dữ liệu mới
      setStoryRating(data);
    } catch (error) {
      // Không set state để giữ lại dữ liệu cũ nếu có
      console.error("Error fetching story rating:", error);
    } finally {
      setIsLoading(false); // Kết thúc loading
    }
  };

  /**
   * useEffect để fetch dữ liệu khi component mount
   * Dependency: storyId - fetch lại khi storyId thay đổi
   */
  useEffect(() => {
    fetchStoryRating();
  }, [storyId]);

  /**
   * Hiển thị loading state
   * Sử dụng Tailwind animate-pulse cho hiệu ứng mờ dần
   */
  if (isLoading) {
    return <div className="animate-pulse">Đang tải đánh giá...</div>;
  }
  /**
   * Hiển thị error state
   * Nếu không thể fetch dữ liệu (storyRating vẫn null)
   */
  if (!storyRating) {
    return <div>Không thể tải thông tin đánh giá</div>;
  }
  /**
   * Render component chính với 3 phần con
   */
  return (
    <div className="space-y-6">
      {/*
        Phần 1: Component cho người dùng thực hiện đánh giá
        - Truyền storyId để xác định truyện cần đánh giá
        - Truyền currentRating từ dữ liệu API (viewerRating)
        - Truyền callback fetchStoryRating để refresh dữ liệu sau khi đánh giá
      */}
      <StoryRatingActions
        storyId={storyId}
        currentRating={storyRating.viewerRating}
        onRatingUpdate={fetchStoryRating}
      />

      {/*
        Phần 2: Component hiển thị tổng quan đánh giá
        - Truyền toàn bộ dữ liệu storyRating
        - Component này chỉ đọc dữ liệu, không có tương tác
      */}
      <StoryRatingSummary storyRating={storyRating} />

      {/*
        Phần 3: Component hiển thị danh sách đánh giá chi tiết
        - Truyền mảng ratings từ storyRating.ratings.items
        - Mỗi rating item chứa thông tin người đánh giá, điểm số, thời gian
      */}
      <StoryRatingList ratings={storyRating.ratings.items} />
    </div>
  );
}
