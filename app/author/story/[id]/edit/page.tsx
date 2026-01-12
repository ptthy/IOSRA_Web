// app/author/story/[id]/edit/page.tsx
/**
 * MỤC ĐÍCH:
 * - Cho phép tác giả chỉnh sửa thông tin truyện khi ở trạng thái bản nháp
 * - Sử dụng lại form tạo truyện với chế độ chỉnh sửa
 *
 * CHỨC NĂNG CHÍNH:
 * 1. Load dữ liệu truyện hiện tại từ API
 * 2. Kiểm tra điều kiện chỉnh sửa (chỉ cho phép khi truyện là draft)
 * 3. Truyền dữ liệu vào CreateStoryForm với mode edit
 * 4. Xử lý lỗi và chuyển hướng phù hợp
 *
 * ĐẶC ĐIỂM:
 * - Chỉ cho phép edit khi story.status === "draft"
 * - Giữ nguyên cover hiện tại (không cho tạo AI cover mới)
 * - Sử dụng helper function xử lý lỗi thống nhất
 * - Tái sử dụng CreateStoryForm component
 */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { storyService } from "@/services/storyService";
import { toast } from "sonner";
import CreateStoryForm from "@/app/author/create-story/CreateStoryForm";

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * HÀM XỬ LÝ LỖI API THỐNG NHẤT
   *
   * LOGIC XỬ LÝ:
   * 1. Ưu tiên kiểm tra lỗi validation từ backend trước
   * 2. Nếu có details (validation errors) -> lấy lỗi đầu tiên và hiển thị
   * 3. Nếu có message từ backend -> hiển thị message đó
   * 4. Fallback: dùng message mặc định hoặc từ response
   *
   * TẠI SAO CẦN HELPER NÀY:
   * - Đảm bảo consistency trong error handling toàn ứng dụng
   * - Xử lý được nhiều loại lỗi: validation, logic, network
   * - Ưu tiên hiển thị lỗi chi tiết nhất cho người dùng
   */
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
   * LOAD DỮ LIỆU TRUYỆN KHI COMPONENT MOUNT
   *
   * FLOW XỬ LÝ:
   * 1. Gọi API getStoryDetails để lấy thông tin chi tiết truyện
   * 2. Kiểm tra trạng thái: chỉ cho edit khi story.status === "draft"
   * 3. Nếu không phải draft -> hiển thị lỗi và redirect về trang chi tiết
   * 4. Format dữ liệu để truyền vào CreateStoryForm
   * 5. Xử lý lỗi bằng helper function và redirect khi cần
   *
   * TẠI SAO PHẢI KIỂM TRA STATUS:
   * - Đảm bảo business logic: chỉ chỉnh sửa được khi truyện chưa gửi đi
   * - Tránh conflict với quy trình xuất bản (pending/published)
   * - Ngăn người dùng sửa truyện đã được duyệt
   */
  useEffect(() => {
    const loadStory = async () => {
      try {
        // 1. Gọi API lấy thông tin truyện chi tiết
        const story = await storyService.getStoryDetails(storyId);
        // 2. Kiểm tra trạng thái truyện - chỉ cho edit khi là draft
        if (story.status !== "draft") {
          toast.error(
            "Chỉ có thể chỉnh sửa khi truyện đang ở trạng thái bản nháp"
          );
          router.replace(`/author/story/${storyId}`);
          return;
        }
        // 3. Format dữ liệu để truyền vào form
        // QUAN TRỌNG: Cấu trúc dữ liệu phải khớp với CreateStoryForm
        setInitialData({
          title: story.title,
          description: story.description,
          outline: story.outline || "",
          lengthPlan: story.lengthPlan || "short",
          languageCode: story.languageCode,
          selectedTagIds: story.tags?.map((t) => t.tagId) || [],
          coverMode: "upload", // Luôn là upload trong edit mode
          hasUsedAICover: true, // không cho tạo lại AI
          createdStoryId: storyId, // ID truyện để update
          currentCoverUrl: story.coverUrl, //  QUAN TRỌNG: Lấy URL ảnh từ API
        });
      } catch (error: any) {
        // 4. Xử lý lỗi bằng helper function
        handleApiError(error, "Không tải được thông tin truyện");
        // 5. Redirect về trang chi tiết khi lỗi
        router.replace(`/author/story/${storyId}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId, router]);
  // Hiển thị loading spinner khi đang tải dữ liệu
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  // Không render nếu không có dữ liệu (trường hợp lỗi đã redirect)
  if (!initialData) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Chỉnh sửa truyện</h1>
        <p className="text-muted-foreground mt-2">
          Bạn có thể chỉnh sửa thông tin truyện khi còn ở trạng thái bản nháp
        </p>
      </div>
      {/*
       * SỬ DỤNG LẠI COMPONENT CreateStoryForm VỚI MODE EDIT
       *
       * TẠI SAO TÁI SỬ DỤNG:
       * - Tránh duplicate code: form tạo và form edit gần giống nhau
       * - Đảm bảo consistency: validation, UI, logic giống nhau
       * - Dễ bảo trì: sửa 1 chỗ, cả 2 chức năng đều được cập nhật
       *
       * PROPS TRUYỀN VÀO:
       * - initialData: Dữ liệu hiện tại của truyện để pre-fill form
       * - isEditMode: true để bật chế độ chỉnh sửa
       * - storyId: ID truyện cần update
       * - onSuccess: Callback khi update thành công
       */}
      <CreateStoryForm
        initialData={initialData} // Truyền dữ liệu hiện tại của truyện
        isEditMode={true} // Bật chế độ edit
        storyId={storyId} // ID truyện cần edit
        onSuccess={() => {
          //  toast.success("Cập nhật truyện thành công!");
          router.push(`/author/story/${storyId}`);
        }}
      />
    </div>
  );
}
