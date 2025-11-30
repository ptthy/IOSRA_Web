// app/author/create-story/CreateStoryForm.tsx
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Save,
  AlertTriangle,
  Sparkles,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";

import { storyService } from "@/services/storyService";
import type { Tag } from "@/services/apiTypes";
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

const LOCAL_STORAGE_KEY = "create-story-draft-v5";

const LENGTH_PLAN_OPTIONS = [
  { value: "super_short", label: "Siêu ngắn (từ 1-5 chương)" },
  { value: "short", label: "Ngắn (từ 5-20 chương)" },
  { value: "novel", label: "Dài (trên 20 chương)" },
] as const;

interface CreateStoryFormProps {
  initialData?: {
    title?: string;
    description?: string;
    outline?: string;
    lengthPlan?: "super_short" | "short" | "novel";
    selectedTagIds?: string[];
    coverMode?: "upload" | "generate";
    coverPrompt?: string;
    hasUsedAICover?: boolean;
    createdStoryId?: string | null;
    currentCoverUrl?: string;
  };
  isEditMode?: boolean;
  storyId?: string;
  onSuccess?: () => void;
}

export default function CreateStoryForm({
  initialData,
  isEditMode = false,
  storyId,
  onSuccess,
}: CreateStoryFormProps) {
  const router = useRouter();

  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIWarning, setShowAIWarning] = useState(false);
  const [showAIPreview, setShowAIPreview] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [outline, setOutline] = useState("");
  const [lengthPlan, setLengthPlan] = useState<
    "super_short" | "short" | "novel"
  >("short");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [coverMode, setCoverMode] = useState<"upload" | "generate">("upload");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPrompt, setCoverPrompt] = useState("");

  // AI state
  const [generatedAICover, setGeneratedAICover] = useState<string | null>(null);
  const [hasUsedAICover, setHasUsedAICover] = useState(false);
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);

  // Character counters
  const [titleLength, setTitleLength] = useState(0);
  const [outlineLength, setOutlineLength] = useState(0);
  const [promptLength, setPromptLength] = useState(0);

  const LIMITS = { TITLE: 100, OUTLINE: 3000, PROMPT: 500 };

  // Load tags
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
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data (dùng cho cả draft localStorage và edit mode)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setOutline(initialData.outline || "");
      setLengthPlan(initialData.lengthPlan || "short");
      setSelectedTagIds(initialData.selectedTagIds || []);
      setCoverMode(
        initialData.hasUsedAICover
          ? "upload"
          : initialData.coverMode || "upload"
      );
      setCoverPrompt(initialData.coverPrompt || "");
      setHasUsedAICover(initialData.hasUsedAICover || false);
      setCreatedStoryId(initialData.createdStoryId || null);
      if (initialData.currentCoverUrl) {
        setGeneratedAICover(initialData.currentCoverUrl);
      }
    } else {
      // Chỉ load draft khi không phải edit mode
      const draft = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (draft) {
        try {
          const data = JSON.parse(draft);
          setTitle(data.title || "");
          setDescription(data.description || "");
          setOutline(data.outline || "");
          setLengthPlan(data.lengthPlan || "short");
          setSelectedTagIds(data.selectedTagIds || []);
          setCoverMode(data.coverMode || "upload");
          setCoverPrompt(data.coverPrompt || "");
          setHasUsedAICover(data.hasUsedAICover || false);
          setCreatedStoryId(data.createdStoryId || null);
        } catch (e) {
          console.error("Error loading draft:", e);
        }
      }
    }
  }, [initialData]);

  // Save draft (chỉ khi không phải edit mode)
  useEffect(() => {
    if (!isEditMode) {
      const draft = {
        title,
        description,
        outline,
        lengthPlan,
        selectedTagIds,
        coverMode,
        coverPrompt,
        hasUsedAICover,
        createdStoryId,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
    }
  }, [
    title,
    description,
    outline,
    lengthPlan,
    selectedTagIds,
    coverMode,
    coverPrompt,
    hasUsedAICover,
    createdStoryId,
    isEditMode,
  ]);

  useEffect(() => {
    setTitleLength(title.length);
    setOutlineLength(outline.length);
    setPromptLength(coverPrompt.length);
  }, [title, outline, coverPrompt]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCoverModeChange = (value: "upload" | "generate") => {
    if (value === "generate" && hasUsedAICover) {
      toast.error("Bạn đã dùng lượt tạo ảnh AI. Không thể chọn lại.");
      return;
    }
    setCoverMode(value);
    if (value === "generate") setShowAIWarning(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ảnh không được vượt quá 10MB");
        return;
      }
      setCoverFile(file);
      setGeneratedAICover(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    // 1. Validate dữ liệu đầu vào
    if (
      !title.trim() ||
      !description.trim() ||
      !outline.trim() ||
      selectedTagIds.length === 0
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (
      (coverMode === "upload" && !coverFile && !generatedAICover) ||
      (coverMode === "generate" && !coverPrompt.trim())
    ) {
      toast.error("Vui lòng chọn ảnh bìa hoặc nhập prompt AI");
      return;
    }

    setIsSubmitting(true);

    try {
      // 🔥 FIX 1: Chuyển đổi coverFile từ (File | null) sang (File | undefined) để khớp Interface
      const validCoverFile =
        coverMode === "upload" && coverFile ? coverFile : undefined;

      // 🔥 FIX 2: Tạo object data đầy đủ (bao gồm cả coverMode) để dùng cho cả Create và Update
      const requestData = {
        title,
        description,
        outline,
        lengthPlan,
        tagIds: selectedTagIds,
        coverMode, // <-- Thêm trường này vì Interface bắt buộc có
        coverFile: validCoverFile,
        coverPrompt: coverMode === "generate" ? coverPrompt : undefined,
      };

      if (isEditMode && storyId) {
        // EDIT MODE: Update draft
        // Truyền đủ requestData để không bị thiếu trường coverMode
        await storyService.updateDraft(storyId, requestData);

        localStorage.removeItem(LOCAL_STORAGE_KEY);
        toast.success("Cập nhật truyện thành công!");
        onSuccess?.();
      } else if (createdStoryId && coverMode === "upload" && coverFile) {
        // Đã tạo draft, giờ upload ảnh thay thế
        await storyService.replaceDraftCover(createdStoryId, coverFile);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        toast.success("Đã cập nhật ảnh bìa!");
        router.push(`/author/story/${createdStoryId}`);
      } else {
        // Tạo mới hoàn toàn
        // requestData ở đây đã khớp hoàn toàn với CreateStoryRequest
        const result = await storyService.createDraft(requestData);

        setCreatedStoryId(result.storyId);
        if (coverMode === "generate") {
          setGeneratedAICover(result.coverUrl || null);
          setShowAIPreview(true);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          router.push(`/author/story/${result.storyId}`);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptAICover = () => {
    setShowAIPreview(false);
    setHasUsedAICover(true);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast.success("Đã dùng ảnh bìa AI");
    router.push(`/author/story/${createdStoryId}/submit-ai`);
  };

  const handleRejectAICover = () => {
    setShowAIPreview(false);
    setGeneratedAICover(null);
    setCoverMode("upload");
    setHasUsedAICover(true);

    const newDraft = {
      title,
      description,
      outline,
      lengthPlan,
      selectedTagIds,
      coverMode: "upload",
      coverPrompt: "",
      hasUsedAICover: true,
      createdStoryId,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDraft));

    toast.info("Đã từ chối ảnh AI → Vui lòng upload ảnh mới");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Chỉnh sửa truyện" : "Tạo truyện mới"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Bạn có thể chỉnh sửa thông tin khi truyện còn ở trạng thái bản nháp"
              : "Điền thông tin chi tiết để tạo truyện mới"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* === Tiêu đề === */}
          <div>
            <Label htmlFor="title">Tiêu đề truyện *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề hấp dẫn..."
              maxLength={LIMITS.TITLE}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {titleLength}/{LIMITS.TITLE}
            </p>
          </div>

          {/* === Mô tả ngắn & Dàn ý === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="description">Mô tả ngắn *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn gọn, hấp dẫn..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="outline">Dàn ý chi tiết *</Label>
              <Textarea
                id="outline"
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                placeholder="Viết dàn ý chi tiết các chương..."
                rows={4}
                maxLength={LIMITS.OUTLINE}
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {outlineLength}/{LIMITS.OUTLINE}
              </p>
            </div>
          </div>

          {/* === Độ dài dự kiến === */}
          <div>
            <Label>Độ dài dự kiến *</Label>
            <RadioGroup
              value={lengthPlan}
              onValueChange={(v) => setLengthPlan(v as any)}
            >
              {LENGTH_PLAN_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  className="flex items-center space-x-2 mt-2"
                >
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <Label htmlFor={opt.value} className="cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* === Thể loại === */}
          <div>
            <Label>Thể loại *</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag) => (
                <Badge
                  key={tag.tagId}
                  variant={
                    selectedTagIds.includes(tag.tagId) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag.tagId)}
                >
                  {tag.tagName}
                </Badge>
              ))}
            </div>
            {selectedTagIds.length === 0 && (
              <p className="text-sm text-destructive mt-2">
                Vui lòng chọn ít nhất 1 thể loại
              </p>
            )}
          </div>

          {/* === Ảnh bìa === */}
          <div>
            <Label>Ảnh bìa *</Label>
            {generatedAICover && (
              <div className="mt-3 mb-4">
                <div className="relative inline-block">
                  <ImageWithFallback
                    src={generatedAICover}
                    alt="Preview bìa"
                    width={200}
                    height={300}
                    className="rounded-lg shadow-md object-cover aspect-[2/3]"
                  />
                  {coverMode === "generate" && (
                    <Badge className="absolute top-2 right-2">AI</Badge>
                  )}
                </div>
              </div>
            )}

            <RadioGroup value={coverMode} onValueChange={handleCoverModeChange}>
              <div className="space-y-4 mt-4">
                <label className="cursor-pointer">
                  <Card
                    className={
                      coverMode === "upload"
                        ? "ring-2 ring-primary border-primary bg-primary/5"
                        : ""
                    }
                  >
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem
                          value="upload"
                          id="upload"
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            <Upload className="h-5 w-5" /> Upload ảnh từ máy
                            tính
                          </p>
                          {coverMode === "upload" && (
                            <div className="mt-4">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </label>

                <label
                  className={
                    hasUsedAICover ? "cursor-not-allowed" : "cursor-pointer"
                  }
                >
                  <Card
                    className={`${
                      coverMode === "generate"
                        ? "ring-2 ring-primary border-primary bg-primary/5"
                        : ""
                    } ${hasUsedAICover ? "opacity-50" : ""}`}
                  >
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem
                          value="generate"
                          id="generate"
                          disabled={hasUsedAICover}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <p className="font-medium">Tạo ảnh bằng AI</p>
                            {hasUsedAICover && (
                              <Badge variant="secondary">Đã dùng</Badge>
                            )}
                          </div>
                          {coverMode === "generate" && !hasUsedAICover && (
                            <div className="mt-4 space-y-3">
                              <Textarea
                                placeholder="Mô tả ảnh bìa bạn muốn AI tạo..."
                                value={coverPrompt}
                                onChange={(e) => {
                                  setCoverPrompt(e.target.value);
                                  setPromptLength(e.target.value.length);
                                }}
                                rows={6}
                                maxLength={LIMITS.PROMPT}
                              />
                              <p className="text-xs text-muted-foreground text-right">
                                {promptLength}/{LIMITS.PROMPT} ký tự
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
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
                {isEditMode ? "Cập nhật truyện" : "Lưu và Tiếp tục"}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* AI Warning Dialog */}
      <AlertDialog open={showAIWarning} onOpenChange={setShowAIWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Lưu ý quan trọng
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chỉ được <strong>TẠO AI 1 LẦN DUY NHẤT</strong>. Sau khi tạo,
              bạn sẽ không thể thay đổi lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đã hiểu</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Preview Dialog */}
      <Dialog open={showAIPreview} onOpenChange={setShowAIPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Xem Trước Ảnh Bìa Từ AI
            </DialogTitle>
          </DialogHeader>
          {generatedAICover && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative w-full max-w-[200px] aspect-[2/3] border rounded-lg overflow-hidden shadow-lg">
                  <ImageWithFallback
                    src={generatedAICover}
                    alt="AI Cover"
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
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleRejectAICover}>
              <X className="mr-2 h-4 w-4" /> Không Ưng Ý
            </Button>
            <Button onClick={handleAcceptAICover}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Sử Dụng Ảnh Này
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
