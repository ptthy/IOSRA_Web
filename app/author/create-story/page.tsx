//app/author/create-story/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Save,
  AlertTriangle,
  Sparkles,
  Upload,
  ChevronDown,
  X,
  CheckCircle2,
} from "lucide-react";
import { storyService } from "@/services/storyService";
import type { Tag, CreateStoryRequest } from "@/services/apiTypes";
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
const LOCAL_STORAGE_KEY = "create-story-draft-v1";

export default function CreateStoryPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIWarning, setShowAIWarning] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  // State của Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [coverMode, setCoverMode] = useState<"upload" | "ai">("upload");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPrompt, setCoverPrompt] = useState("");

  // State của Popup AI
  const [generatedAICover, setGeneratedAICover] = useState<string | null>(null);
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [aiCoverLocked, setAiCoverLocked] = useState(false);
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);
  // Thêm các state mới để theo dõi độ dài
  const [titleLength, setTitleLength] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [coverPromptLength, setCoverPromptLength] = useState(0);

  // Giới hạn ký tự (có thể điều chỉnh)
  const LIMITS = {
    TITLE: 100,
    DESCRIPTION: 2000,
    COVER_PROMPT: 500,
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    setTitleLength(value.length);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setDescription(value);
    setDescriptionLength(value.length);
  };

  const handleCoverPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setCoverPrompt(value);
    setCoverPromptLength(value.length);
  };

  // 1. Tải state từ Local Storage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const draft = JSON.parse(savedData);
        setTitle(draft.title || "");
        setDescription(draft.description || "");
        setSelectedTagIds(draft.selectedTagIds || []);
        setCoverMode(draft.coverMode || "upload");
        setCoverPrompt(draft.coverPrompt || "");
      }
    } catch (e) {
      console.error("Failed to load draft from local storage", e);
    }
  }, []);

  // 2. Lưu state vào Local Storage
  useEffect(() => {
    if (isLoading) return;
    try {
      const draft = {
        title,
        description,
        selectedTagIds,
        coverMode,
        coverPrompt,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error("Failed to save draft to local storage", e);
    }
  }, [title, description, selectedTagIds, coverMode, coverPrompt, isLoading]);

  // 3. Tải danh sách Tags
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const data = await storyService.getAllTags();
      setTags(data);
    } catch (error) {
      toast.error("Không thể tải danh sách thể loại");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- CÁC HÀM XỬ LÝ (ĐÃ DỌN DẸP) ---

  const handleCoverModeChange = (value: string) => {
    const newMode = value as "upload" | "ai";
    setCoverMode(newMode);
    if (newMode === "ai" && !aiCoverLocked) setShowAIWarning(true);
  };

  const handleAcceptAICover = () => {
    setShowAIPreview(false);
    setAiCoverLocked(true);
    toast.success("Đã chọn ảnh bìa từ AI");
    // Chuyển trang sau khi chấp nhận
    if (createdStoryId) {
      router.push(`/author/story/${createdStoryId}/submit-ai`);
    }
  };

  const handleRejectAICover = () => {
    setShowAIPreview(false);
    setGeneratedAICover(null);
    setCoverMode("upload");
    setAiCoverLocked(true);

    toast.info("Đã từ chối ảnh AI. Vui lòng upload ảnh bìa mới từ máy tính.");

    // KHÔNG chuyển trang ở đây - để người dùng upload ảnh mới
    // và submit lại với endpoint số 3
  };
  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setCoverFile(e.target.files[0]);
  };

  // Hàm Submit chính (gọi API)
  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) return toast.error("Vui lòng nhập tên truyện");
    if (!description.trim()) return toast.error("Vui lòng nhập mô tả truyện");
    if (!selectedTagIds.length)
      return toast.error("Vui lòng chọn ít nhất một thể loại");
    if (coverMode === "upload" && !coverFile)
      return toast.error("Vui lòng upload ảnh bìa");
    if (coverMode === "ai" && !coverPrompt.trim())
      return toast.error("Vui lòng nhập prompt để tạo ảnh bìa AI");

    setIsSubmitting(true);
    try {
      // TRƯỜNG HỢP 1: Tạo truyện mới HOÀN TOÀN (chưa có storyId)
      if (!createdStoryId) {
        const storyData: CreateStoryRequest = {
          title,
          description,
          tagIds: selectedTagIds,
          coverMode,
          coverFile: coverMode === "upload" ? (coverFile as File) : undefined,
          coverPrompt: coverMode === "ai" ? coverPrompt : undefined,
        };

        const newStory = await storyService.createStory(storyData);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        toast.success("Tạo truyện nháp thành công!");

        // Xử lý AI cover preview
        if (coverMode === "ai" && newStory.coverUrl) {
          setGeneratedAICover(newStory.coverUrl);
          setCreatedStoryId(newStory.storyId);
          setShowAIPreview(true);
        } else {
          // Upload mode hoặc AI không có coverUrl -> chuyển trang
          router.push(`/author/story/${newStory.storyId}/submit-ai`);
        }
      }
      // TRƯỜNG HỢP 2: ĐÃ CÓ STORYID (đã từ chối ảnh AI) và giờ upload ảnh mới
      else if (createdStoryId && coverMode === "upload" && coverFile) {
        // Gọi endpoint số 3 để cập nhật ảnh bìa (thay thế ảnh AI bằng ảnh upload)
        await storyService.updateStoryCover(createdStoryId, coverFile);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        toast.success("Cập nhật ảnh bìa thành công!");
        router.push(`/author/story/${createdStoryId}/submit-ai`);
      }
      // TRƯỜNG HỢP 3: ĐÃ CÓ STORYID nhưng vẫn dùng AI mode (không nên xảy ra)
      else if (createdStoryId && coverMode === "ai") {
        toast.error(
          "Không thể tạo lại ảnh AI. Vui lòng upload ảnh từ máy tính."
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi tạo truyện");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  // --- PHẦN JSX (ĐÃ DỌN DẸP) ---
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl mb-2">Tạo Truyện Mới</h1>
        <p className="text-sm text-muted-foreground">
          Điền thông tin để tạo bản nháp truyện của bạn
        </p>
      </div>

      {/* === FORM === */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin truyện</CardTitle>
          <CardDescription>
            Tất cả các trường đánh dấu (*) là bắt buộc
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Title */}
          {/* Title với bộ đếm */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="title">Tên truyện *</Label>
              <span
                className={`text-xs ${
                  titleLength > LIMITS.TITLE
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {titleLength}/{LIMITS.TITLE}
              </span>
            </div>
            <Input
              id="title"
              placeholder="Nhập tên truyện của bạn..."
              value={title}
              onChange={handleTitleChange}
              disabled={isSubmitting}
              className={`border-2 ${
                titleLength > LIMITS.TITLE
                  ? "border-red-500 focus-visible:border-red-500"
                  : "border-primary/30 focus-visible:border-primary"
              }`}
              maxLength={LIMITS.TITLE}
            />
            {titleLength > LIMITS.TITLE && (
              <p className="text-xs text-red-500">
                Tên truyện không được vượt quá {LIMITS.TITLE} ký tự
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description">Mô tả *</Label>
              <span
                className={`text-xs ${
                  descriptionLength > LIMITS.DESCRIPTION
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {descriptionLength}/{LIMITS.DESCRIPTION}
              </span>
            </div>
            <Textarea
              id="description"
              placeholder="Giới thiệu nội dung truyện của bạn..."
              value={description}
              onChange={handleDescriptionChange}
              disabled={isSubmitting}
              rows={5}
              className={`border-2 resize-none ${
                descriptionLength > LIMITS.DESCRIPTION
                  ? "border-red-500 focus-visible:border-red-500"
                  : "border-primary/30 focus-visible:border-primary"
              }`}
              maxLength={LIMITS.DESCRIPTION}
            />
            {descriptionLength > LIMITS.DESCRIPTION && (
              <p className="text-xs text-red-500">
                Mô tả không được vượt quá {LIMITS.DESCRIPTION} ký tự
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Thể loại * (Chọn ít nhất 1)</Label>
            <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full justify-between border-2 border-primary/30"
                >
                  <div className="flex flex-wrap gap-1.5 flex-1 items-center">
                    {selectedTagIds.length ? (
                      selectedTagIds.map((id) => {
                        const tag = tags.find((t) => t.tagId === id);
                        return tag ? (
                          <Badge key={id} variant="default" className="text-xs">
                            {tag.tagName}
                          </Badge>
                        ) : null;
                      })
                    ) : (
                      <span className="text-muted-foreground">
                        Chọn thể loại...
                      </span>
                    )}
                  </div>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[600px]">
                <DialogHeader>
                  <DialogTitle>Chọn Thể Loại Truyện</DialogTitle>
                  <DialogDescription>
                    Chọn một hoặc nhiều thể loại phù hợp
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-3">
                    {tags.map((tag) => (
                      <div
                        key={tag.tagId}
                        className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer ${
                          selectedTagIds.includes(tag.tagId)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => toggleTag(tag.tagId)}
                      >
                        <Checkbox
                          checked={selectedTagIds.includes(tag.tagId)}
                          onCheckedChange={() => toggleTag(tag.tagId)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{tag.tagName}</p>
                          {tag.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {tag.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => setIsTagDialogOpen(false)}
                    className="w-full"
                  >
                    Xong ({selectedTagIds.length} đã chọn)
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Cover mode */}
          <div className="space-y-4">
            <Label>Ảnh bìa *</Label>
            <RadioGroup
              value={coverMode}
              onValueChange={handleCoverModeChange}
              disabled={isSubmitting}
              className="flex flex-col gap-4"
            >
              {/* Upload */}
              <label htmlFor="upload" className="cursor-pointer">
                <Card
                  className={`transition-all ${
                    coverMode === "upload"
                      ? "ring-2 ring-primary border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value="upload"
                        id="upload"
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Upload className="h-5 w-5 text-primary" />
                          <p className="font-medium">Upload ảnh từ máy tính</p>
                        </div>
                        {coverMode === "upload" && (
                          <div className="mt-4 space-y-2">
                            <Input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleFileChange}
                              disabled={isSubmitting}
                            />
                            {coverFile && (
                              <p className="text-sm text-emerald-600">
                                ✓ Đã chọn: {coverFile.name}
                              </p>
                            )}
                          </div>
                        )}
                        {coverMode === "upload" && aiCoverLocked && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Lưu ý:</strong> Bạn đã từ chối ảnh AI. Vui
                              lòng upload ảnh bìa từ máy tính và nhấn "Lưu và
                              Tiếp tục" để cập nhật.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </label>

              {/* AI option với bộ đếm */}
              <label
                htmlFor="ai"
                className={
                  aiCoverLocked && coverMode === "upload"
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }
              >
                <Card
                  className={`transition-all ${
                    coverMode === "ai"
                      ? "ring-2 ring-primary border-primary bg-primary/5"
                      : aiCoverLocked
                      ? "opacity-50 border-muted"
                      : "hover:border-primary/50"
                  }`}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value="ai"
                        id="ai"
                        className="mt-1"
                        disabled={aiCoverLocked && coverMode !== "ai"}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <p className="font-medium">Tạo ảnh bằng AI</p>
                          {aiCoverLocked && coverMode !== "ai" && (
                            <Badge variant="outline" className="text-xs">
                              Đã khóa
                            </Badge>
                          )}
                        </div>
                        {coverMode === "ai" && !generatedAICover && (
                          <div className="mt-4 space-y-3">
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Mô tả ảnh bìa bạn muốn AI tạo (tối đa 500 ký tự)..."
                                value={coverPrompt}
                                onChange={handleCoverPromptChange}
                                disabled={isSubmitting}
                                rows={6}
                                className={`border-2 resize-none ${
                                  coverPromptLength > LIMITS.COVER_PROMPT
                                    ? "border-red-500 focus-visible:border-red-500"
                                    : "border-primary/30 focus-visible:border-primary"
                                }`}
                                maxLength={LIMITS.COVER_PROMPT}
                              />
                              <div className="flex justify-between items-center">
                                <span
                                  className={`text-xs ${
                                    coverPromptLength > LIMITS.COVER_PROMPT
                                      ? "text-red-500"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {coverPromptLength}/{LIMITS.COVER_PROMPT} ký
                                  tự
                                </span>
                                {coverPromptLength > LIMITS.COVER_PROMPT && (
                                  <span className="text-xs text-red-500">
                                    Vượt quá giới hạn cho phép
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {coverMode === "ai" && generatedAICover && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle2 className="h-5 w-5" />
                              <p className="font-medium">
                                Đã tạo ảnh bìa thành công!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </label>
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              titleLength > LIMITS.TITLE ||
              descriptionLength > LIMITS.DESCRIPTION ||
              (coverMode === "ai" && coverPromptLength > LIMITS.COVER_PROMPT)
            }
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu và Tiếp tục
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Dialog cảnh báo AI */}
      <AlertDialog open={showAIWarning} onOpenChange={setShowAIWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Lưu ý quan trọng
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chỉ được <strong>TẠO ẢNH AI 1 LẦN DUY NHẤT</strong>. Sau khi
              tạo, bạn sẽ không thể thay đổi lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đã hiểu</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog xem trước AI */}
      <Dialog open={showAIPreview} onOpenChange={setShowAIPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Xem Trước Ảnh Bìa Từ AI
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Sử dụng ảnh AI này hoặc chuyển sang upload
            </DialogDescription>
          </DialogHeader>

          {generatedAICover && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative w-full max-w-[200px] aspect-[2/3] border rounded-lg overflow-hidden shadow-lg">
                  <ImageWithFallback
                    src={generatedAICover}
                    alt="AI Generated Cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-primary text-white px-2 py-0.5 rounded-full text-xs flex items-center gap-1 shadow-md">
                    <Sparkles className="h-3 w-3" /> AI
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <p>
                  Nếu từ chối, bạn sẽ <strong>không thể tạo lại bằng AI</strong>{" "}
                  và phải upload ảnh thủ công.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={handleRejectAICover}>
              <X className="mr-2 h-4 w-4" />
              Không Ưng Ý
            </Button>
            <Button onClick={handleAcceptAICover}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Sử Dụng Ảnh Này
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
