// app/favorite-story/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FavoriteStoryCard } from "@/components/favorite-story-card";
import { Loader2, Heart, Inbox } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  favoriteStoryService,
  FavoriteStoryItem,
} from "@/services/favoriteStoryService";
import { toast } from "sonner";
/**
 * FILE MÔ TẢ: Trang quản lý truyện yêu thích của người dùng
 *
 * CHỨC NĂNG:
 * 1. Hiển thị danh sách truyện đã thêm vào tủ truyện
 * 2. Bật/tắt thông báo chương mới cho từng truyện
 * 3. Xóa truyện khỏi danh sách yêu thích
 * 4. Phân trang danh sách truyện
 * 5. Click vào truyện để đi đến trang chi tiết
 *
 * LIÊN KẾT VỚI:
 * - favoriteStoryService: API lấy danh sách, toggle notification, xóa truyện
 * - FavoriteStoryCard: Component hiển thị card cho từng truyện
 * - Next Router: Điều hướng đến trang chi tiết truyện
 */
export default function FavoritePage() {
  const router = useRouter();
  const [data, setData] = useState<FavoriteStoryItem[]>([]);
  const [total, setTotal] = useState(0); // Tổng số truyện (cho phân trang)
  const [page, setPage] = useState(1); // Trang hiện tại
  const [pageSize] = useState(20); // Số truyện mỗi trang (fixed)
  const [loading, setLoading] = useState(true); // Loading khi fetch data
  const [updatingId, setUpdatingId] = useState<string | null>(null); // ID truyện đang update (toggle notification)
  // --- HELPER: Xử lý lỗi API ---
  const handleApiError = (error: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic từ Backend
    if (error.response && error.response.data && error.response.data.error) {
      const { message, details } = error.response.data.error;

      // Ưu tiên Validation (details)
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          // Nối các lỗi lại thành 1 câu
          const msg = details[firstKey].join(" ");
          toast.error(msg);
          return;
        }
      }

      // Message từ Backend
      if (message) {
        toast.error(message);
        return;
      }
    }

    // 2. Fallback
    const fallbackMsg = error.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };

  /**
   * useEffect: Load danh sách truyện yêu thích khi page thay đổi
   * Dependency: [page] → mỗi lần đổi trang sẽ reload data
   *
   * Tại sao chỉ có page? Vì pageSize fixed, không cần refetch khi thay đổi
   */
  useEffect(() => {
    loadFavorites();
  }, [page]);
  /**
   * HÀM LOAD DANH SÁCH TRUYỆN YÊU THÍCH
   * Flow:
   * 1. Set loading = true
   * 2. Gọi API với page và pageSize
   * 3. Lưu data và total vào state
   * 4. Xử lý lỗi nếu có
   * 5. Set loading = false
   */
  const loadFavorites = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách truyện yêu thích
      const response = await favoriteStoryService.getFavorites(page, pageSize);
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error("Lỗi tải danh sách yêu thích:", error);
      // toast.error("Không thể tải tủ truyện của bạn.");
      handleApiError(error, "Không thể tải tủ truyện của bạn.");
    } finally {
      setLoading(false);
    }
  };
  /**
   * HÀM XỬ LÝ CLICK VÀO TRUYỆN
   * Mục đích: Điều hướng đến trang chi tiết truyện
   * Input: storyId (string)
   * Output: Router push đến /story/{storyId}
   */
  const handleStoryClick = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  /**
   * HÀM BẬT/TẮT THÔNG BÁO CHƯƠNG MỚI
   * Flow:
   * 1. Set updatingId = storyId (để hiển thị loading trên card đó)
   * 2. Tính toán newState = !currentState (đảo ngược trạng thái)
   * 3. Gọi API toggleNotification với storyId và newState
   * 4. Nếu thành công: update local state, hiển thị toast
   * 5. Nếu lỗi: hiển thị thông báo lỗi
   * 6. Reset updatingId = null
   *
   * Tại sao không dùng response từ API?
   * Vì API chỉ trả về success/fail, không trả về data mới
   * Nên cần tính toán trước và update local
   */
  const handleToggleNotification = async (
    storyId: string,
    currentState: boolean
  ) => {
    setUpdatingId(storyId);
    try {
      // Gọi API đảo ngược trạng thái hiện tại (!currentState)
      const newState = !currentState;
      // Gọi API cập nhật
      await favoriteStoryService.toggleNotification(storyId, newState);

      // Cập nhật UI local: tìm story và update notiNewChapter
      setData((prev) =>
        prev.map((item) =>
          item.storyId === storyId
            ? { ...item, notiNewChapter: newState }
            : item
        )
      );
      // Hiển thị toast thông báo
      toast.success(
        newState ? "Đã bật thông báo chương mới" : "Đã tắt thông báo"
      );
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Lỗi cập nhật trạng thái thông báo.");
    } finally {
      setUpdatingId(null);
    }
  };

  /**
   * HÀM XÓA TRUYỆN KHỎI DANH SÁCH YÊU THÍCH
   * Flow:
   * 1. Confirm với user (tránh xóa nhầm)
   * 2. Gọi API removeFavorite(storyId)
   * 3. Nếu thành công: reload lại danh sách
   * 4. Nếu lỗi: hiển thị thông báo
   *
   * Tại sao reload toàn bộ thay vì xóa local?
   * Vì cần cập nhật lại total count và phân trang
   */
  const handleRemoveFavorite = async (storyId: string) => {
    if (!confirm("Bạn có chắc muốn bỏ theo dõi truyện này?")) return;

    try {
      await favoriteStoryService.removeFavorite(storyId);
      toast.success("Đã xóa khỏi tủ truyện");
      loadFavorites(); // Reload lại toàn bộ list
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Lỗi khi xóa truyện khỏi danh sách.");
    }
  };
  // Tính tổng số trang (dùng cho phân trang)
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8 pb-16 pt-6 px-4">
        {/* Header */}
        <div className="space-y-2 border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Heart className="h-8 w-8 text-red-600 dark:text-red-400 fill-red-600/20" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Tủ Truyện Yêu Thích
              </h1>
              <p className="text-muted-foreground mt-1">
                Quản lý truyện bạn đang theo dõi và nhận thông báo chương mới
              </p>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {loading ? (
                "Đang tải..."
              ) : (
                <>
                  Danh sách{" "}
                  <span className="text-primary">({total} truyện)</span>
                </>
              )}
            </h2>

            {!loading && totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang lấy dữ liệu...</p>
            </div>
          ) : data.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {data.map((story) => (
                  <FavoriteStoryCard
                    key={story.storyId}
                    story={story}
                    onClick={() => handleStoryClick(story.storyId)}
                    onToggleNotification={handleToggleNotification}
                    onRemove={handleRemoveFavorite}
                    isUpdating={updatingId === story.storyId}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={
                            page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {/* Logic phân trang đơn giản */}
                      <PaginationItem>
                        <span className="px-4 py-2 font-semibold text-primary">
                          {page}
                        </span>
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          className={
                            page === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Inbox className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-2">Tủ truyện trống</p>
              <p className="text-sm text-muted-foreground">
                Hãy thêm truyện vào danh sách yêu thích để theo dõi nhé!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
