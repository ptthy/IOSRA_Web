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

interface StoryRatingProps {
  storyId: string;
}

export function StoryRating({ storyId }: StoryRatingProps) {
  const [storyRating, setStoryRating] = useState<StoryRatingType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStoryRating = async () => {
    try {
      setIsLoading(true);
      const data = await storyRatingApi.getStoryRating(storyId);
      setStoryRating(data);
    } catch (error) {
      console.error("Error fetching story rating:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoryRating();
  }, [storyId]);

  if (isLoading) {
    return <div className="animate-pulse">Đang tải đánh giá...</div>;
  }

  if (!storyRating) {
    return <div>Không thể tải thông tin đánh giá</div>;
  }

  return (
    <div className="space-y-6">
      {/* Phần đánh giá của người dùng */}
      <StoryRatingActions
        storyId={storyId}
        currentRating={storyRating.viewerRating}
        onRatingUpdate={fetchStoryRating}
      />

      {/* Tổng quan đánh giá */}
      <StoryRatingSummary storyRating={storyRating} />

      {/* Danh sách đánh giá */}
      <StoryRatingList ratings={storyRating.ratings.items} />
    </div>
  );
}
