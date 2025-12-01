// components/StoryFavoriteAction.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Bell, BellOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { favoriteStoryService } from "@/services/favoriteStoryService";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StoryFavoriteActionProps {
  storyId: string;
}

export function StoryFavoriteAction({ storyId }: StoryFavoriteActionProps) {
  const { isAuthenticated } = useAuth();

  // State quản lý trạng thái
  const [isFavorite, setIsFavorite] = useState(false);
  const [isNotiEnabled, setIsNotiEnabled] = useState(false);

  // State loading cho từng hành động
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isTogglingNoti, setIsTogglingNoti] = useState(false);

  // 1. Kiểm tra trạng thái khi component mount
  useEffect(() => {
    if (isAuthenticated && storyId) {
      checkFavoriteStatus();
    } else {
      setIsLoadingInitial(false);
    }
  }, [storyId, isAuthenticated]);

  const checkFavoriteStatus = async () => {
    try {
      // Gọi API lấy danh sách yêu thích (lấy 100 items để check cho chắc)
      const response = await favoriteStoryService.getFavorites(1, 100);

      // Tìm xem truyện hiện tại có trong list không
      const foundStory = response.items.find(
        (item) => item.storyId === storyId
      );

      if (foundStory) {
        setIsFavorite(true);
        setIsNotiEnabled(foundStory.notiNewChapter);
      } else {
        setIsFavorite(false);
      }
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái yêu thích:", error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  // 2. Xử lý Click Tim (Thêm/Xóa)
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
      return;
    }

    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        // --- LOGIC XÓA (DELETE) ---
        await favoriteStoryService.removeFavorite(storyId);
        setIsFavorite(false);
        setIsNotiEnabled(false); // Xóa rồi thì tắt chuông luôn
        toast.success("Đã xóa khỏi danh sách yêu thích");
      } else {
        // --- LOGIC THÊM (POST) ---
        const response = await favoriteStoryService.addFavorite(storyId);
        setIsFavorite(true);
        setIsNotiEnabled(response.notiNewChapter); // Cập nhật trạng thái chuông mặc định từ server
        toast.success("Đã thêm vào yêu thích ❤️");
      }
    } catch (error: any) {
      // Xử lý lỗi đặc biệt (VD: Tác giả tự like)
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === "CannotFavoriteOwnStory") {
        toast.error(
          "Bạn không thể thêm yêu thích truyện do chính bạn sáng tác!"
        );
      } else {
        toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
      }
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // 3. Xử lý Click Chuông (Bật/Tắt thông báo)
  const handleToggleNotification = async () => {
    if (!isFavorite) return; // Phải like rồi mới bật chuông được

    setIsTogglingNoti(true);
    try {
      const newState = !isNotiEnabled;
      // Gọi API PUT
      await favoriteStoryService.toggleNotification(storyId, newState);

      setIsNotiEnabled(newState);
      toast.success(
        newState ? "Đã bật thông báo chương mới 🔔" : "Đã tắt thông báo 🔕"
      );
    } catch (error) {
      toast.error("Không thể cập nhật cài đặt thông báo");
    } finally {
      setIsTogglingNoti(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <Button variant="ghost" disabled>
        <Loader2 className="w-5 h-5 animate-spin" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* --- NÚT TIM --- */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              variant={isFavorite ? "secondary" : "outline"}
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              className={`
                transition-all duration-300 border-red-200 
                ${
                  isFavorite
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-300 dark:bg-red-900/20 dark:text-red-400"
                    : "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/10"
                }
              `}
            >
              {isTogglingFavorite ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Heart
                  className={`mr-2 h-5 w-5 transition-all ${
                    isFavorite ? "fill-current scale-110" : ""
                  }`}
                />
              )}
              {isFavorite ? "Đã yêu thích" : "Yêu thích"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFavorite ? "Bấm để bỏ theo dõi" : "Thêm vào tủ truyện"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* --- NÚT CHUÔNG (Chỉ hiện khi đã Favorite) --- */}
      {isFavorite && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon" // Nút tròn nhỏ
                variant="outline"
                onClick={handleToggleNotification}
                disabled={isTogglingNoti}
                className={`
                  rounded-full w-10 h-10 transition-all duration-300 border shadow-sm
                  ${
                    isNotiEnabled
                      ? "bg-yellow-50 border-yellow-400 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-600"
                      : "bg-background border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground/50"
                  }
                `}
              >
                {isTogglingNoti ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isNotiEnabled ? (
                  <Bell className="h-5 w-5 fill-current animate-bounce-subtle" />
                ) : (
                  <BellOff className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isNotiEnabled
                  ? "Tắt thông báo chương mới"
                  : "Bật thông báo chương mới"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
