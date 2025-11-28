// app/author/story/[id]/chapter/[chapterId]/edit/page.tsx
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

// Key cho Local Storage, dựa trên chapterId để mỗi chương có draft riêng
const getStorageKey = (chapterId: string) => `edit-chapter-draft-${chapterId}`;

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const chapterId = params.chapterId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State của Form với giới hạn ký tự - chỉ các trường cơ bản
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    languageCode: "vi-VN" as "vi-VN" | "en-US" | "zh-CN" | "ja-JP",
  });

  const [characterCounts, setCharacterCounts] = useState({
    title: 0,
    content: 0,
  });

  const LIMITS = {
    TITLE: 200,
    CONTENT: 50000, // 50k ký tự cho nội dung chương
  };

  // 1. Tải chapter cũ và draft từ Local Storage
  useEffect(() => {
    const loadChapter = async () => {
      setIsLoading(true);
      try {
        // Thử tải draft từ Local Storage trước
        const storageKey = getStorageKey(chapterId);
        const savedDraft = localStorage.getItem(storageKey);
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          setFormData(draft);
          setCharacterCounts({
            title: draft.title?.length || 0,
            content: draft.content?.length || 0,
          });
        } else {
          // Nếu không có draft, tải dữ liệu chapter từ API
          const chapterData = await chapterService.getChapterDetails(
            storyId,
            chapterId
          );

          // Xử lý dữ liệu an toàn, tránh undefined
          const safeTitle = chapterData.title || "";
          const safeContent = chapterData.content || "";
          const safeLanguageCode =
            (chapterData.languageCode as
              | "vi-VN"
              | "en-US"
              | "zh-CN"
              | "ja-JP") || "vi-VN";

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
        console.error("Error loading chapter:", error);
        toast.error(error.message || "Không thể tải thông tin chương");

        // Đặt giá trị mặc định nếu có lỗi
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
        setIsLoading(false);
      }
    };

    loadChapter();
  }, [storyId, chapterId]);

  // 2. Lưu state vào Local Storage mỗi khi formData thay đổi
  useEffect(() => {
    if (isLoading) return;
    const storageKey = getStorageKey(chapterId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    } catch (e) {
      console.error("Failed to save draft to local storage", e);
    }
  }, [formData, chapterId, isLoading]);

  const handleBackToChapter = () => {
    router.push(`/author/story/${storyId}/chapter/${chapterId}`);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCharacterCounts((prev) => ({
      ...prev,
      [name]: value.length,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - sử dụng safe access với optional chaining
    if (!formData.title?.trim()) {
      toast.error("Vui lòng nhập tiêu đề chương");
      return;
    }

    if (formData.title.length > LIMITS.TITLE) {
      toast.error(`Tiêu đề không được vượt quá ${LIMITS.TITLE} ký tự`);
      return;
    }

    if (!formData.content?.trim()) {
      toast.error("Vui lòng nhập nội dung chương");
      return;
    }

    if (formData.content.length > LIMITS.CONTENT) {
      toast.error(`Nội dung không được vượt quá ${LIMITS.CONTENT} ký tự`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Gọi API cập nhật chương
      // Lưu ý: Hiện tại trong chapterService chưa có hàm updateChapter, nên cần bổ sung
      await chapterService.updateChapter(storyId, chapterId, {
        title: formData.title,
        content: formData.content,
        languageCode: formData.languageCode,
      });

      // Xóa draft sau khi cập nhật thành công
      const storageKey = getStorageKey(chapterId);
      localStorage.removeItem(storageKey);

      toast.success("✅ Cập nhật chương thành công!");
      router.push(`/author/story/${storyId}/chapter/${chapterId}`);
    } catch (error: any) {
      console.error("Error updating chapter:", error);
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật chương");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sửa validation để xử lý trường hợp undefined
  const isFormValid =
    formData.title?.trim() &&
    formData.content?.trim() &&
    formData.title.length <= LIMITS.TITLE &&
    formData.content.length <= LIMITS.CONTENT;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
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

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Chapter Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chương</CardTitle>
              <CardDescription>Chỉnh sửa thông tin chương</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title với bộ đếm */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="title">Tiêu đề chương *</Label>
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
                  className={`border-2 ${
                    characterCounts.title > LIMITS.TITLE
                      ? "border-red-500 focus-visible:border-red-500"
                      : "border-primary/30 focus-visible:border-primary"
                  }`}
                  maxLength={LIMITS.TITLE}
                />
                {characterCounts.title > LIMITS.TITLE && (
                  <p className="text-xs text-red-500">
                    Tiêu đề không được vượt quá {LIMITS.TITLE} ký tự
                  </p>
                )}
              </div>

              {/* Language */}
              <div className="space-y-2">
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
              </div>
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
                {characterCounts.content > LIMITS.CONTENT && (
                  <p className="text-xs text-red-500">
                    Nội dung không được vượt quá {LIMITS.CONTENT} ký tự
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Số từ ước tính:{" "}
                  {Math.ceil(
                    (formData.content || "")
                      .split(/\s+/)
                      .filter((word) => word.length > 0).length
                  )}{" "}
                  từ
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3 flex-wrap">
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

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToChapter}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              </div>

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
