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

/**
 * Props interface cho component StoryFavoriteAction
 * Chỉ cần storyId để xác định truyện cần thao tác
 */
interface StoryFavoriteActionProps {
  storyId: string;
}

/**
 * Component quản lý chức năng yêu thích truyện và thông báo chương mới
 * Bao gồm 2 nút chính:
 * 1. Nút tim: Thêm/xóa khỏi danh sách yêu thích
 * 2. Nút chuông: Bật/tắt thông báo chương mới (chỉ hiện khi đã yêu thích)
 *
 * Logic chính:
 * 1. Kiểm tra trạng thái yêu thích ban đầu khi component mount
 * 2. Xử lý toggle yêu thích (thêm/xóa)
 * 3. Xử lý toggle thông báo (bật/tắt)
 * 4. Quản lý loading state cho từng hành động riêng biệt
 */
export function StoryFavoriteAction({ storyId }: StoryFavoriteActionProps) {
  // Lấy trạng thái đăng nhập từ AuthContext
  const { isAuthenticated } = useAuth();

  // State quản lý trạng thái yêu thích
  const [isFavorite, setIsFavorite] = useState(false);
  // State quản lý trạng thái thông báo
  const [isNotiEnabled, setIsNotiEnabled] = useState(false);

  // State quản lý loading cho từng hành động
  const [isLoadingInitial, setIsLoadingInitial] = useState(true); // Kiểm tra trạng thái ban đầu
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false); // Đang toggle yêu thích
  const [isTogglingNoti, setIsTogglingNoti] = useState(false); // Đang toggle thông báo

  /**
   * useEffect kiểm tra trạng thái yêu thích ban đầu
   * Chạy khi:
   * 1. Component mount
   * 2. storyId thay đổi
   * 3. isAuthenticated thay đổi
   */
  useEffect(() => {
    if (isAuthenticated && storyId) {
      // Chỉ kiểm tra nếu đã đăng nhập và có storyId
      checkFavoriteStatus();
    } else {
      // Nếu chưa đăng nhập, không cần kiểm tra
      setIsLoadingInitial(false);
    }
  }, [storyId, isAuthenticated]);

  /**
   * Hàm kiểm tra trạng thái yêu thích hiện tại
   * Gọi API lấy danh sách yêu thích và tìm truyện hiện tại trong đó
   */
  const checkFavoriteStatus = async () => {
    try {
      // Gọi API lấy danh sách yêu thích (lấy 100 items để đảm bảo tìm thấy nếu có)
      const response = await favoriteStoryService.getFavorites(1, 100);

      // Tìm xem truyện hiện tại có trong list không
      const foundStory = response.items.find(
        (item) => item.storyId === storyId
      );

      if (foundStory) {
        // Nếu tìm thấy: cập nhật cả trạng thái yêu thích và thông báo
        setIsFavorite(true);
        setIsNotiEnabled(foundStory.notiNewChapter);
      } else {
        // Nếu không tìm thấy: reset về mặc định
        setIsFavorite(false);
      }
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái yêu thích:", error);
    } finally {
      setIsLoadingInitial(false); // Kết thúc loading
    }
  };

  /**
   * Hàm xử lý khi click nút tim (thêm/xóa yêu thích)
   * Logic:
   * - Nếu đã yêu thích: xóa khỏi danh sách
   * - Nếu chưa yêu thích: thêm vào danh sách
   */
  const handleToggleFavorite = async () => {
    // Kiểm tra đăng nhập
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
      // Xử lý lỗi đặc biệt từ API
      const errorCode = error.response?.data?.error?.code;
      // Xử lý lỗi đặc biệt (VD: Tác giả tự like)
      if (errorCode === "CannotFavoriteOwnStory") {
        toast.error(
          "Bạn không thể thêm yêu thích truyện do chính bạn sáng tác!"
        );
      } else {
        // Lỗi chung
        toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
      }
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  /**
   * Hàm xử lý khi click nút chuông (bật/tắt thông báo)
   * Chỉ hoạt động khi đã yêu thích truyện (isFavorite = true)
   */
  const handleToggleNotification = async () => {
    if (!isFavorite) return; // Chỉ bật/tắt thông báo khi đã yêu thích
    setIsTogglingNoti(true);
    try {
      const newState = !isNotiEnabled;
      // Gọi API cập nhật trạng thái thông báo
      await favoriteStoryService.toggleNotification(storyId, newState);
      // Cập nhật state
      setIsNotiEnabled(newState);
      // Thông báo thành công
      toast.success(
        newState ? "Đã bật thông báo chương mới 🔔" : "Đã tắt thông báo 🔕"
      );
    } catch (error) {
      toast.error("Không thể cập nhật cài đặt thông báo");
    } finally {
      setIsTogglingNoti(false);
    }
  };

  /**
   * Hiển thị loading khi đang kiểm tra trạng thái ban đầu
   */
  if (isLoadingInitial) {
    return (
      <Button variant="ghost" disabled>
        <Loader2 className="w-5 h-5 animate-spin" />
      </Button>
    );
  }
  /**
   * Render component với 2 nút chính
   */
  return (
    <div className="flex items-center gap-2">
      {/* --- NÚT TIM --- */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              // Thay đổi variant dựa trên trạng thái yêu thích
              variant={isFavorite ? "secondary" : "outline"}
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              // Dynamic class dựa trên trạng thái
              className={`
                transition-all duration-300 border-red-200 
                ${
                  isFavorite
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-300 dark:bg-red-900/20 dark:text-red-400"
                    : "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/10"
                }
              `}
            >
              {/* Hiển thị icon loading hoặc icon tim */}
              {isTogglingFavorite ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Heart
                  className={`mr-2 h-5 w-5 transition-all ${
                    isFavorite ? "fill-current scale-110" : "" // Fill và phóng to khi đã yêu thích
                  }`}
                />
              )}
              {/* Thay đổi text dựa trên trạng thái */}
              {isFavorite ? "Đã yêu thích" : "Yêu thích"}
            </Button>
          </TooltipTrigger>
          {/* Tooltip hướng dẫn */}
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
                // Dynamic class dựa trên trạng thái thông báo
                className={`
                  rounded-full w-10 h-10 transition-all duration-300 border shadow-sm
                  ${
                    isNotiEnabled
                      ? "bg-yellow-50 border-yellow-400 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-600"
                      : "bg-background border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground/50"
                  }
                `}
              >
                {/* Hiển thị icon loading, chuông bật, hoặc chuông tắt */}
                {isTogglingNoti ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isNotiEnabled ? (
                  <Bell className="h-5 w-5 fill-current animate-bounce-subtle" />
                ) : (
                  <BellOff className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            {/* Tooltip hướng dẫn */}
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
