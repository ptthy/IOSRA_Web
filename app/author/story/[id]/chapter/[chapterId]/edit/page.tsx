// app/author/story/[id]/chapter/[chapterId]/edit/page.tsx
/**
 * TRANG CHỈNH SỬA CHI TIẾT CHƯƠNG TRUYỆN (EDITOR MODE)
 *
 * MỤC ĐÍCH:
 * - Cung cấp giao diện chỉnh sửa toàn diện cho một chương truyện
 * - Tập trung vào tính năng autosave vào Local Storage để tránh mất dữ liệu
 *
 * CHỨC NĂNG CHÍNH:
 * 1. Tải và hiển thị thông tin chương hiện tại (tiêu đề, nội dung, ngôn ngữ)
 * 2. Tự động lưu bản nháp vào Local Storage khi người dùng nhập (mỗi 2 giây)
 * 3. Validate dữ liệu đầu vào real-time (giới hạn ký tự, trường bắt buộc)
 * 4. Cho phép cập nhật chương thông qua API call
 * 5. Hiển thị bộ đếm ký tự real-time cho tiêu đề và nội dung
 * 6. Hỗ trợ đa ngôn ngữ (Tiếng Việt, English, 中文, 日本語)
 *
 * FLOW XỬ LÝ CHÍNH:
 * 1. Khi vào trang → load dữ liệu từ API (hoặc từ draft nếu có)
 * 2. Người dùng chỉnh sửa → tự động save vào localStorage
 * 3. Khi submit → validate → gọi API → xóa draft → redirect
 *
 * ĐỐI TƯỢNG SỬ DỤNG: Tác giả (Author) muốn chỉnh sửa nội dung chương truyện
 * LIÊN KẾT VỚI FILE KHÁC:
 * - Sử dụng `chapterService` để gọi API
 * - Kế thừa component UI từ `@/components/ui/`
 * - Sử dụng `toast` từ sonner để hiển thị thông báo
 */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ArrowLeft,
  FileText,
  AlertTriangle,
  Save,
} from "lucide-react";
import { chapterService } from "@/services/chapterService";
import { toast } from "sonner";

/**
 * HÀM TẠO KEY CHO LOCAL STORAGE
 *
 * MỤC ĐÍCH: Tạo key duy nhất cho mỗi chapter để lưu draft
 * LOGIC: Dùng chapterId để tạo key, đảm bảo mỗi chapter có draft riêng
 * OUTPUT: String có dạng "edit-chapter-draft-{chapterId}"
 * VÍ DỤ: chapterId="abc123" → key="edit-chapter-draft-abc123"
 */
const getStorageKey = (chapterId: string) => `edit-chapter-draft-${chapterId}`;

/**
 * COMPONENT CHÍNH: EditChapterPage
 *
 * FLOW XỬ LÝ TỔNG QUAN:
 * 1. Tải thông tin chương hiện tại từ API
 * 2. Tự động lưu draft vào Local Storage khi formData thay đổi
 * 3. Validate dữ liệu khi submit form
 * 4. Gọi API cập nhật chương và xử lý response
 * 5. Điều hướng về trang chi tiết sau khi thành công
 */
export default function EditChapterPage() {
  // Lấy params từ URL (Next.js App Router)
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const chapterId = params.chapterId as string;
  // STATE QUẢN LÝ TRẠNG THÁI
  const [isLoading, setIsLoading] = useState(true); // Đang tải dữ liệu ban đầu
  const [isSubmitting, setIsSubmitting] = useState(false); // Đang gửi form

  /**
   * STATE FORM DATA - CHỨA DỮ LIỆU FORM
   *
   * CẤU TRÚC:
   * - title: Tiêu đề chương (string, required)
   * - content: Nội dung chương (string, required)
   * - languageCode: Mã ngôn ngữ (enum, hiện đang comment vì không dùng trong update)
   *
   * LƯU Ý: languageCode bị comment vì API update không cần field này
   */
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    languageCode: "vi-VN" as "vi-VN" | "en-US" | "zh-CN" | "ja-JP",
  });
  /**
   * STATE ĐẾM KÝ TỰ - THEO DÕI ĐỘ DÀI REAL-TIME
   *
   * MỤC ĐÍCH: Hiển thị số ký tự đã nhập / giới hạn
   * CẤU TRÚC:
   * - title: Số ký tự tiêu đề
   * - content: Số ký tự nội dung
   */
  const [characterCounts, setCharacterCounts] = useState({
    title: 0,
    content: 0,
  });

  /**
   * HÀM XỬ LÝ LỖI API THỐNG NHẤT
   *
   * MỤC ĐÍCH: Xử lý lỗi từ API response theo cấu trúc thống nhất
   * FLOW XỬ LÝ ƯU TIÊN:
   * 1. Ưu tiên hiển thị lỗi validation từ details (nếu có)
   * 2. Hiển thị message từ backend
   * 3. Fallback về message mặc định
   *
   * INPUT: error object từ axios/API call
   * OUTPUT: Hiển thị toast error với message phù hợp
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
  // -------------------
  const LIMITS = {
    TITLE: 200,
    CONTENT: 10000, // 50k ký tự cho nội dung chương
  };

  /**
   * useEffect 1: TẢI DỮ LIỆU CHAPTER KHI VÀO TRANG
   *
   * MỤC ĐÍCH: Load dữ liệu chapter khi component mount
   * FLOW ƯU TIÊN:
   * 1. Ưu tiên tải draft từ Local Storage (nếu có) → người dùng đang edit dở
   * 2. Nếu không có draft thì tải từ API → lấy dữ liệu gốc
   * 3. Xử lý dữ liệu an toàn (safe access với optional chaining)
   *
   * DEPENDENCIES: [storyId, chapterId] → chạy lại khi ID thay đổi
   */
  useEffect(() => {
    const loadChapter = async () => {
      setIsLoading(true);
      try {
        // Thử tải draft từ Local Storage trước (ưu tiên phiên làm việc cũ)
        const storageKey = getStorageKey(chapterId);
        const savedDraft = localStorage.getItem(storageKey);
        if (savedDraft) {
          // Nếu có draft → dùng draft (người dùng đang edit dở)
          const draft = JSON.parse(savedDraft);
          setFormData(draft);
          setCharacterCounts({
            title: draft.title?.length || 0,
            content: draft.content?.length || 0,
          });
        } else {
          // Nếu không có draft → tải dữ liệu chapter từ API
          const chapterData = await chapterService.getChapterDetails(
            storyId,
            chapterId
          );

          // Xử lý dữ liệu an toàn, tránh undefined với optional chaining
          const safeTitle = chapterData.title || "";
          const safeContent = chapterData.content || "";
          const safeLanguageCode =
            (chapterData.languageCode as
              | "vi-VN"
              | "en-US"
              | "zh-CN"
              | "ja-JP") || "vi-VN";
          // Cập nhật state với dữ liệu đã xử lý
          setFormData({
            title: safeTitle,
            content: safeContent,
            languageCode: safeLanguageCode,
          });
          setCharacterCounts({
            title: safeTitle.length,
            content: safeContent.length,
          });
        }
      } catch (error: any) {
        // --- DÙNG HELPER ---
        handleApiError(error, "Không thể tải thông tin chương");

        //  reset form để tránh lỗi UI nếu cần thiết
        // Reset form về trạng thái rỗng nếu có lỗi
        setFormData({
          title: "",
          content: "",
          languageCode: "vi-VN",
        });
        setCharacterCounts({
          title: 0,
          content: 0,
        });
      } finally {
        setIsLoading(false); // Kết thúc loading
      }
    };

    loadChapter();
  }, [storyId, chapterId]); // Chạy lại khi storyId hoặc chapterId thay đổi

  /**
   * useEffect 2: TỰ ĐỘNG LƯU DRAFT KHI FORMDATA THAY ĐỔI
   *
   * MỤC ĐÍCH: Autosave vào Local Storage để tránh mất dữ liệu
   * LOGIC:
   * 1. Chỉ lưu khi không đang loading (tránh lưu dữ liệu ban đầu)
   * 2. Dùng try-catch để tránh lỗi localStorage (quota, disabled)
   * 3. Mỗi lần formData thay đổi sẽ tự động lưu
   *
   * DEPENDENCIES: [formData, chapterId, isLoading]
   */
  useEffect(() => {
    if (isLoading) return; // Không lưu khi đang tải dữ liệu ban đầu
    const storageKey = getStorageKey(chapterId);
    try {
      // Lưu toàn bộ formData dưới dạng JSON string
      localStorage.setItem(storageKey, JSON.stringify(formData));
    } catch (e) {
      console.error("Failed to save draft to local storage", e);
      // Lưu toàn bộ formData dưới dạng JSON string
    }
  }, [formData, chapterId, isLoading]);

  /**
   * HÀM QUAY LẠI TRANG CHI TIẾT CHƯƠNG
   *
   * MỤC ĐÍCH: Điều hướng về trang xem chương (non-edit mode)
   * ROUTE: /author/story/{storyId}/chapter/{chapterId}
   */
  const handleBackToChapter = () => {
    router.push(`/author/story/${storyId}/chapter/${chapterId}`);
  };

  /**
   * HÀM XỬ LÝ THAY ĐỔI INPUT/TEXTAREA
   *
   * MỤC ĐÍCH: Cập nhật formData và characterCounts khi người dùng nhập
   * LOGIC:
   * 1. Lấy name và value từ event target
   * 2. Cập nhật formData với spread operator để giữ các field khác
   * 3. Cập nhật characterCounts với độ dài mới
   *
   * INPUT: React.ChangeEvent từ input hoặc textarea
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Cập nhật formData
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Cập nhật character counts
    setCharacterCounts((prev) => ({
      ...prev,
      [name]: value.length,
    }));
  };

  /**
   * HÀM XỬ LÝ THAY ĐỔI SELECT
   *
   * MỤC ĐÍCH: Cập nhật formData khi người dùng chọn giá trị từ dropdown
   * LOGIC: Tương tự handleInputChange nhưng cho select component
   *
   * INPUT:
   * - name: Tên field trong formData (ví dụ: "languageCode")
   * - value: Giá trị được chọn từ select
   */
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * HÀM SUBMIT FORM CẬP NHẬT CHƯƠNG
   *
   * MỤC ĐÍCH: Xử lý khi người dùng nhấn "Lưu thay đổi"
   * FLOW XỬ LÝ:
   * 1. Validation các trường bắt buộc và giới hạn ký tự
   * 2. Gọi API updateChapter với dữ liệu đã validate
   * 3. Xóa draft từ Local Storage sau khi thành công
   * 4. Điều hướng về trang chi tiết chương
   * 5. Xử lý lỗi nếu có
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn reload trang

    // VALIDATION - Sử dụng safe access với optional chaining
    // 1. Check tiêu đề không rỗng
    if (!formData.title?.trim()) {
      toast.error("Vui lòng nhập tiêu đề chương");
      return;
    }
    // 2. Check giới hạn ký tự tiêu đề
    if (formData.title.length > LIMITS.TITLE) {
      toast.error(`Tiêu đề không được vượt quá ${LIMITS.TITLE} ký tự`);
      return;
    }
    // 3. Check nội dung không rỗng
    if (!formData.content?.trim()) {
      toast.error("Vui lòng nhập nội dung chương");
      return;
    }
    // 4. Check giới hạn ký tự nội dung
    if (formData.content.length > LIMITS.CONTENT) {
      toast.error(`Nội dung không được vượt quá ${LIMITS.CONTENT} ký tự`);
      return;
    }
    // Bắt đầu submit
    setIsSubmitting(true);
    try {
      // Gọi API cập nhật chương

      await chapterService.updateChapter(storyId, chapterId, {
        title: formData.title,
        content: formData.content,
        // languageCode: formData.languageCode,
      });

      // Xóa draft sau khi cập nhật thành công (dữ liệu đã lưu lên server)
      const storageKey = getStorageKey(chapterId);
      localStorage.removeItem(storageKey);
      // Thông báo thành công
      toast.success("✅ Cập nhật chương thành công!");
      // Điều hướng về trang chi tiết chương
      router.push(`/author/story/${storyId}/chapter/${chapterId}`);
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Có lỗi xảy ra khi cập nhật chương");
    } finally {
      setIsSubmitting(false); // Kết thúc trạng thái submitting
    }
  };
  // KIỂM TRA FORM HỢP LỆ (cho disable nút submit)
  // Kiểm tra form hợpđể xử lý trường hợp undefined
  const isFormValid =
    formData.title?.trim() &&
    formData.content?.trim() &&
    formData.title.length <= LIMITS.TITLE &&
    formData.content.length <= LIMITS.CONTENT;
  /**
   * HIỂN THỊ LOADING SPINNER KHI ĐANG TẢI DỮ LIỆU
   *
   * MỤC ĐÍCH: Cho người dùng biết đang tải dữ liệu
   * ĐIỀU KIỆN: isLoading === true
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  // RENDER GIAO DIỆN CHÍNH
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* HEADER với nút quay lại */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBackToChapter}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chỉnh sửa Chương</h1>
          <p className="text-muted-foreground">Chỉnh sửa chương của bạn</p>
        </div>
      </div>
      {/* FORM CHÍNH */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Chapter Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chương</CardTitle>
              <CardDescription>Chỉnh sửa thông tin chương</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title với bộ đếm ký tự */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="title">Tiêu đề chương *</Label>
                  {/* Hiển thị số ký tự đã nhập, đổi màu khi vượt giới hạn */}
                  <span
                    className={`text-xs ${
                      characterCounts.title > LIMITS.TITLE
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {characterCounts.title}/{LIMITS.TITLE}
                  </span>
                </div>
                <Input
                  id="title"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Chương 1: Khởi đầu mới"
                  required
                  disabled={isSubmitting}
                  // Đổi màu border khi vượt giới hạn
                  className={`border-2 ${
                    characterCounts.title > LIMITS.TITLE
                      ? "border-red-500 focus-visible:border-red-500"
                      : "border-primary/30 focus-visible:border-primary"
                  }`}
                  maxLength={LIMITS.TITLE}
                />
                {/* Hiển thị cảnh báo khi vượt giới hạn */}
                {characterCounts.title > LIMITS.TITLE && (
                  <p className="text-xs text-red-500">
                    Tiêu đề không được vượt quá {LIMITS.TITLE} ký tự
                  </p>
                )}
              </div>

              {/* Language */}
              {/* <div className="space-y-2">
                <Label htmlFor="languageCode">Ngôn ngữ</Label>
                <Select
                  value={formData.languageCode}
                  onValueChange={(
                    value: "vi-VN" | "en-US" | "zh-CN" | "ja-JP"
                  ) => handleSelectChange("languageCode", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi-VN">Tiếng Việt</SelectItem>
                    <SelectItem value="en-US">English</SelectItem>
                    <SelectItem value="zh-CN">中文</SelectItem>
                    <SelectItem value="ja-JP">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Nội dung chương *
              </CardTitle>
              <CardDescription>
                Chỉnh sửa nội dung chương truyện của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="content">Nội dung</Label>
                  {/* Bộ đếm ký tự cho nội dung */}
                  <span
                    className={`text-xs ${
                      characterCounts.content > LIMITS.CONTENT
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {characterCounts.content}/{LIMITS.CONTENT}
                  </span>
                </div>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content || ""}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung chương tại đây..."
                  className={`min-h-[400px] resize-y border-2 ${
                    characterCounts.content > LIMITS.CONTENT
                      ? "border-red-500 focus-visible:border-red-500"
                      : "border-primary/30 focus-visible:border-primary"
                  }`}
                  disabled={isSubmitting}
                  required
                  maxLength={LIMITS.CONTENT}
                />
                {/* Cảnh báo khi vượt giới hạn nội dung */}
                {characterCounts.content > LIMITS.CONTENT && (
                  <p className="text-xs text-red-500">
                    Nội dung không được vượt quá {LIMITS.CONTENT} ký tự
                  </p>
                )}
                {/* Hiển thị số từ ước tính (tính bằng cách split khoảng trắng) */}
                <p className="text-xs text-muted-foreground">
                  Số từ ước tính:{" "}
                  {Math.ceil(
                    (formData.content || "")
                      .split(/\s+/) // Split bằng khoảng trắng (space, tab, newline)
                      .filter((word) => word.length > 0).length // Lọc từ rỗng
                  )}{" "}
                  từ
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CARD ACTION BUTTONS */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3 flex-wrap">
                {/* Nút lưu thay đổi */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>

                {/* Nút hủy */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToChapter}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              </div>
              {/* ALERT THÔNG BÁO VỀ BẢN NHÁP */}
              <Alert className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  Thay đổi được lưu tự động vào bản nháp. Sau khi lưu, chương
                  vẫn ở trạng thái <strong>bản nháp</strong>.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
