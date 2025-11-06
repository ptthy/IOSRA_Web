// app/author/story/[id]/chapter/new/page.tsx
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
  Bookmark,
} from "lucide-react";
import { chapterService } from "@/services/chapterService";
import { toast } from "sonner";

const LOCAL_STORAGE_KEY = "create-chapter-draft-v1";

export default function CreateChapterPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  // 1. Tải state từ Local Storage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const draft = JSON.parse(savedData);

        // Chỉ khôi phục và thông báo nếu thực sự có dữ liệu
        const hasActualData = draft.title?.trim() || draft.content?.trim();

        if (hasActualData) {
          setFormData(draft);
          setCharacterCounts({
            title: draft.title?.length || 0,
            content: draft.content?.length || 0,
          });
          setHasUnsavedChanges(true);
          toast.info("Đã khôi phục bản nháp từ lần chỉnh sửa trước");
        } else {
          // Nếu chỉ có dữ liệu rỗng, xóa bản nháp
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to load draft from local storage", e);
    }
  }, []);

  // 2. Lưu state vào Local Storage khi có thay đổi
  useEffect(() => {
    // Chỉ set hasUnsavedChanges nếu thực sự có dữ liệu
    const hasActualData = formData.title?.trim() || formData.content?.trim();
    if (hasActualData) {
      setHasUnsavedChanges(true);
    }
  }, [formData]);

  const handleBackToChapters = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?"
      );
      if (!confirmLeave) return;
    }
    router.push(`/author/story/${storyId}/chapters`);
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
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = () => {
    const hasActualData = formData.title?.trim() || formData.content?.trim();

    if (!hasActualData) {
      toast.info("Không có nội dung để lưu nháp");
      return;
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
      setHasUnsavedChanges(false);
      toast.success("Đã lưu nháp thành công!");
    } catch (e) {
      console.error("Failed to save draft to local storage", e);
      toast.error("Lỗi khi lưu nháp");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề chương");
      return;
    }

    if (formData.title.length > LIMITS.TITLE) {
      toast.error(`Tiêu đề không được vượt quá ${LIMITS.TITLE} ký tự`);
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Vui lòng nhập nội dung chương");
      return;
    }

    if (formData.content.length > LIMITS.CONTENT) {
      toast.error(`Nội dung không được vượt quá ${LIMITS.CONTENT} ký tự`);
      return;
    }

    setIsSubmitting(true);
    try {
      await chapterService.createChapter(storyId, {
        title: formData.title,
        content: formData.content,
        languageCode: formData.languageCode,
      });

      // Xóa draft sau khi tạo thành công
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setHasUnsavedChanges(false);

      toast.success("Tạo chương mới thành công!");
      router.push(`/author/story/${storyId}/chapters`);
    } catch (error: any) {
      console.error("Error creating chapter:", error);
      toast.error(error.message || "Có lỗi xảy ra khi tạo chương");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.title.trim() &&
    formData.content.trim() &&
    formData.title.length <= LIMITS.TITLE &&
    formData.content.length <= LIMITS.CONTENT;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBackToChapters}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Đăng Chương Mới</h1>
          <p className="text-muted-foreground">
            Thêm chương mới vào truyện của bạn
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Chapter Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chương</CardTitle>
              <CardDescription>
                Nhập thông tin cơ bản cho chương mới
              </CardDescription>
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
                  value={formData.title}
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
                Nhập nội dung chương truyện của bạn
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
                  value={formData.content}
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
                    formData.content
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
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu chương
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveDraft}
                  variant="outline"
                  disabled={
                    isSubmitting ||
                    !(formData.title?.trim() || formData.content?.trim())
                  }
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Lưu nháp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToChapters}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              </div>

              {hasUnsavedChanges && (
                <Alert className="mt-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm">
                    Bạn có thay đổi chưa lưu. Nhấn <strong>"Lưu nháp"</strong>{" "}
                    để lưu lại.
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  Sau khi tạo, chương sẽ ở trạng thái <strong>bản nháp</strong>
                  Bạn có thể chỉnh sửa và gửi cho AI đánh giá sau.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
