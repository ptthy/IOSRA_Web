// components/favorite-story-card.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { User, Bell, BellOff, Trash2, Calendar } from "lucide-react";
import { FavoriteStoryItem } from "@/services/favoriteStoryService";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils"; // Helper để gộp và xử lý className Tailwind CSS một cách linh hoạt
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FavoriteStoryCardProps {
  story: FavoriteStoryItem;
  onClick: () => void;
  onToggleNotification: (storyId: string, currentState: boolean) => void;
  onRemove: (storyId: string) => void;
  isUpdating?: boolean;
}
/**
 * FavoriteStoryCard Component - Hiển thị truyện yêu thích của người dùng
 * Có các chức năng: bật/tắt thông báo, xóa khỏi danh sách yêu thích
 *
 * Logic xử lý:
 * 1. Hiển thị thông tin cơ bản của truyện yêu thích
 * 2. Xử lý toggle thông báo chapter mới
 * 3. Xử lý xóa truyện khỏi danh sách yêu thích
 * 4. Hiển thị trạng thái thông báo (bật/tắt)
 */
export function FavoriteStoryCard({
  story,
  onClick,
  onToggleNotification,
  onRemove,
  isUpdating = false,
}: FavoriteStoryCardProps) {
  const router = useRouter();
  /**
   * Xử lý click vào tên tác giả
   * Chuyển hướng đến trang profile của tác giả
   */
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (story.authorId) {
      router.push(`/profile/${story.authorId}`);
    }
  };

  /**
   * Xử lý click vào nút chuông thông báo
   * Gọi callback để toggle trạng thái thông báo
   */
  const handleBellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleNotification(story.storyId, story.notiNewChapter);
  };
  /**
   * Xử lý click vào nút xóa
   * Gọi callback để xóa truyện khỏi danh sách yêu thích
   */
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(story.storyId);
  };

  return (
    <div
      className="group relative cursor-pointer flex-shrink-0 w-full h-[380px] transition-all duration-500 hover:-translate-y-2"
      onClick={onClick}
    >
      <div className="relative bg-background rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 border border-border/50 w-full h-full group-hover:border-primary/40 flex flex-col">
        {/* --- 1. COVER IMAGE --- */}
        <div className="relative w-full h-[240px] overflow-hidden bg-muted flex-shrink-0">
          <ImageWithFallback
            src={story.coverUrl}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Gradient overlay cho ảnh bìa */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

          {/* Action Buttons (Top Right) */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
            {/* Nút Xóa */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onClick={handleRemoveClick}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Bỏ theo dõi</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Nút Chuông Thông Báo (Bottom Right của ảnh) */}
          <div className="absolute bottom-2 right-2 z-20">
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                "h-9 w-9 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
                // Conditional styling dựa trên trạng thái thông báo
                story.notiNewChapter
                  ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                  : "bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400"
              )}
              onClick={handleBellClick}
              disabled={isUpdating}
            >
              {/* Hiển thị icon chuông tương ứng với trạng thái */}
              {story.notiNewChapter ? (
                <Bell
                  className={cn("h-5 w-5", isUpdating && "animate-pulse")}
                />
              ) : (
                <BellOff
                  className={cn("h-5 w-5", isUpdating && "animate-pulse")}
                />
              )}
            </Button>
          </div>
        </div>

        {/* --- 2. INFO SECTION --- */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-foreground text-base leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {story.title}
            </h3>
            {/* Tên tác giả với click handler */}
            <div
              className="flex items-center gap-2 text-muted-foreground text-xs hover:text-primary transition-colors duration-300 cursor-pointer mb-2"
              onClick={handleAuthorClick}
            >
              <User className="h-3 w-3" />
              <span className="truncate">{story.authorUsername}</span>
            </div>
          </div>
          {/* Footer với ngày thêm và trạng thái thông báo */}
          <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {/* Format ngày theo định dạng Việt Nam */}
                {new Date(story.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            {/* Badge hiển thị trạng thái thông báo */}
            {story.notiNewChapter ? (
              <Badge
                variant="outline"
                className="border-yellow-500 text-yellow-600 bg-yellow-50 text-[10px] px-1.5 py-0"
              >
                Bật thông báo
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Tắt thông báo
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
