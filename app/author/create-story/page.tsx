// app/author/create-story/page.tsx
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

//const LOCAL_STORAGE_KEY = "create-story-draft-v5";

const LENGTH_PLAN_OPTIONS = [
  { value: "super_short", label: "Siêu ngắn (từ 1-5 chương)" },
  { value: "short", label: "Ngắn (từ 6-20 chương)" },
  { value: "novel", label: "Dài (trên 20 chương)" },
] as const;

export default function CreateStoryPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIWarning, setShowAIWarning] = useState(false);
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

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
  const handleApiError = (error: any, defaultMessage: string) => {
    if (error.response?.data?.error) {
      const { code, message, details } = error.response.data.error;
      // 1. Check lỗi Validation/Logic từ Backend
      // --- A. Xử lý riêng cho AccountRestricted (để format ngày cho đẹp) ---
      if (code === "AccountRestricted") {
        // Backend trả: "Your account is restricted from posting until 2025-12-19T08:25:29..."
        // Ta format lại tiếng Việt cho thân thiện
        const dateMatch = message.match(
          /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/
        );
        if (dateMatch) {
          const date = new Date(dateMatch[0]);
          const dateStr = date.toLocaleString("vi-VN"); // Ra dạng: 08:25:29 19/12/2025
          toast.error(`Tài khoản bị hạn chế đăng bài đến: ${dateStr}`);
          return;
        }
        // Nếu không parse được ngày thì hiển thị luôn message gốc
        toast.error(message);
        return;
      }

      // --- B. Nếu có message từ Backend -> HIỂN THỊ LUÔN ---
      // Đây là chỗ giúp "lỗi gì cũng trả ra được message"
      if (message) {
        toast.error(message);
        return;
      }

      // --- C. Nếu là lỗi Validation (có details) ---
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          toast.error(details[firstKey].join(" "));
          return;
        }
      }
    }

    // 2. Các lỗi khác (Mất mạng, Server sập, 401 không có body...)
    const fallbackMsg = error.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // -------------------
  // Load tags
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const data = await storyService.getAllTags();
      setTags(data);
      // } catch (error) {
      //   toast.error("Không thể tải danh sách thể loại");
      // } finally {
      //   setIsLoading(false);
      // }
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải danh sách thể loại");
    } finally {
      setIsLoading(false);
    }
  };

  // // Load draft
  // useEffect(() => {
  //   const draft = localStorage.getItem(LOCAL_STORAGE_KEY);
  //   if (draft) {
  //     try {
  //       const data = JSON.parse(draft);
  //       setTitle(data.title || "");
  //       setDescription(data.description || "");
  //       setOutline(data.outline || "");
  //       setLengthPlan(data.lengthPlan || "short");
  //       setSelectedTagIds(data.selectedTagIds || []);
  //       setCoverMode(data.coverMode || "upload");
  //       setCoverPrompt(data.coverPrompt || "");
  //       setHasUsedAICover(data.hasUsedAICover || false);
  //       setCreatedStoryId(data.createdStoryId || null);
  //     } catch (e) {
  //       console.error("Error loading draft:", e);
  //     }
  //   }
  // }, []);

  // // Save draft
  // useEffect(() => {
  //   const draft = {
  //     title,
  //     description,
  //     outline,
  //     lengthPlan,
  //     selectedTagIds,
  //     coverMode,
  //     coverPrompt,
  //     hasUsedAICover,
  //     createdStoryId,
  //   };
  //   localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
  // }, [
  //   title,
  //   description,
  //   outline,
  //   lengthPlan,
  //   selectedTagIds,
  //   coverMode,
  //   coverPrompt,
  //   hasUsedAICover,
  //   createdStoryId,
  // ]);

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

  const handleAcceptAICover = () => {
    setShowAIPreview(false);
    setHasUsedAICover(true);
    // localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast.success("Đã dùng ảnh bìa AI");
    router.push(`/author/story/${createdStoryId}/submit-ai`);
  };

  const handleRejectAICover = () => {
    setShowAIPreview(false);
    setShowAIPreview(false);
    setGeneratedAICover(null);
    setCoverMode("upload");
    setHasUsedAICover(true); // <<<--- THÊM DÒNG NÀY VÀO!!!

    // Xóa draft cũ nhưng lưu lại createdStoryId để không bị mất khi reload
    const newDraft = {
      title,
      description,
      outline,
      lengthPlan,
      selectedTagIds,
      coverMode: "upload",
      coverPrompt: "",
      hasUsedAICover: true,
      createdStoryId, // giữ lại cái quan trọng nhất
    };
    // localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDraft));

    toast.info("Đã từ chối ảnh AI → Vui lòng upload ảnh mới");
  };

  // const handleSubmit = async () => {
  //   if (!title.trim()) return toast.error("Vui lòng nhập tên truyện");
  //   if (!outline.trim()) return toast.error("Vui lòng nhập dàn ý cốt truyện");
  //   if (selectedTagIds.length === 0)
  //     return toast.error("Vui lòng chọn ít nhất 1 thể loại");
  //   if (coverMode === "upload" && !coverFile && !createdStoryId)
  //     return toast.error("Vui lòng chọn ảnh bìa");
  //   if (coverMode === "generate" && !coverPrompt.trim())
  //     return toast.error("Vui lòng nhập mô tả ảnh AI");

  //   setIsSubmitting(true);

  //   try {
  //     if (!createdStoryId) {
  //       // Dùng CreateStoryRequest object – sạch sẽ, không cần FormData thủ công
  //       const requestData: CreateStoryRequest = {
  //         title,
  //         description: description || "",
  //         outline,
  //         lengthPlan,
  //         tagIds: selectedTagIds,
  //         coverMode,
  //         coverFile: coverMode === "upload" ? coverFile! : undefined,
  //         coverPrompt: coverMode === "generate" ? coverPrompt : undefined,
  //       };

  //       const res = await storyService.createStory(requestData);

  //       setCreatedStoryId(res.storyId);
  //       localStorage.removeItem(LOCAL_STORAGE_KEY);

  //       if (coverMode === "generate" && res.coverUrl) {
  //         setGeneratedAICover(res.coverUrl);
  //         setHasUsedAICover(true);
  //         setShowAIPreview(true);
  //       } else {
  //         toast.success("Tạo truyện thành công!");
  //         router.push(`/author/story/${res.storyId}/submit-ai`);
  //       }
  //     }
  //     // Từ chối AI → upload ảnh mới
  //     else if (createdStoryId && coverMode === "upload" && coverFile) {
  //       await storyService.replaceDraftCover(createdStoryId, coverFile);
  //       localStorage.removeItem(LOCAL_STORAGE_KEY);
  //       toast.success("Cập nhật ảnh bìa thành công!");
  //       router.push(`/author/story/${createdStoryId}/submit-ai`);
  //     }
  //   } catch (err: any) {
  //     toast.error(err.message || "Có lỗi xảy ra");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  const handleSubmit = async () => {
    // Validation cơ bản
    if (!title.trim()) return toast.error("Vui lòng nhập tên truyện");
    if (!outline.trim()) return toast.error("Vui lòng nhập dàn ý cốt truyện");
    if (selectedTagIds.length === 0)
      return toast.error("Vui lòng chọn ít nhất 1 thể loại");
    if (coverMode === "upload" && !coverFile && !createdStoryId)
      return toast.error("Vui lòng chọn ảnh bìa");
    if (coverMode === "generate" && !coverPrompt.trim())
      return toast.error("Vui lòng nhập mô tả ảnh AI");

    setIsSubmitting(true);

    try {
      // TRƯỜNG HỢP 1: Tạo mới hoàn toàn (Chưa có ID)
      if (!createdStoryId) {
        const requestData: CreateStoryRequest = {
          title,
          description: description || "",
          outline,
          lengthPlan,
          tagIds: selectedTagIds,
          coverMode,
          coverFile: coverMode === "upload" ? coverFile! : undefined,
          coverPrompt: coverMode === "generate" ? coverPrompt : undefined,
        };

        const res = await storyService.createStory(requestData);

        setCreatedStoryId(res.storyId);
        //  localStorage.removeItem(LOCAL_STORAGE_KEY);

        if (coverMode === "generate" && res.coverUrl) {
          setGeneratedAICover(res.coverUrl);
          setHasUsedAICover(true);
          setShowAIPreview(true);
        } else {
          toast.success("Tạo truyện thành công!");
          router.push(`/author/story/${res.storyId}/submit-ai`);
        }
      }
      // TRƯỜNG HỢP 2: Đã có ID (do từ chối AI trước đó) -> Gọi Update ảnh bìa
      else if (createdStoryId && coverMode === "upload" && coverFile) {
        await storyService.replaceDraftCover(createdStoryId, coverFile);

        //  localStorage.removeItem(LOCAL_STORAGE_KEY);
        toast.success("Cập nhật ảnh bìa thành công!");
        router.push(`/author/story/${createdStoryId}/submit-ai`);
      }
      // } catch (err: any) {
      //   console.error(err);

      //   // === XỬ LÝ LOGIC NẾU ID BỊ LỖI (NOT FOUND) ===
      //   if (
      //     err.code === "STORY_NOT_FOUND" ||
      //     err.message === "Truyện không tồn tại"
      //   ) {
      //     toast.error(
      //       "Truyện cũ không tìm thấy. Hệ thống sẽ tạo truyện mới khi bạn lưu lại."
      //     );

      //     // Reset ID để lần sau bấm nút sẽ nhảy vào TRƯỜNG HỢP 1 (Tạo mới)
      //     setCreatedStoryId(null);

      //     // Cập nhật lại localStorage để xóa ID lỗi đi
      //     const currentDraft = JSON.parse(
      //       localStorage.getItem(LOCAL_STORAGE_KEY) || "{}"
      //     );
      //     delete currentDraft.createdStoryId;
      //     localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentDraft));
      //   } else {
      //     // Các lỗi khác thì hiển thị bình thường
      //     toast.error(err.message || "Có lỗi xảy ra");
      //   }
      // } finally {
      //   setIsSubmitting(false);
      // }
    } catch (error: any) {
      // Đổi tên biến thành error cho đồng bộ
      console.error(error);

      // === GIỮ NGUYÊN LOGIC NẾU ID BỊ LỖI (NOT FOUND) ===
      // if (
      //   error.code === "STORY_NOT_FOUND" ||
      //   error.message === "Truyện không tồn tại"
      // ) {
      //   toast.error(
      //     "Truyện cũ không tìm thấy. Hệ thống sẽ tạo truyện mới khi bạn lưu lại."
      //   );
      //   // Reset ID để lần sau bấm nút sẽ nhảy vào TRƯỜNG HỢP 1
      //   setCreatedStoryId(null);

      //   // // Cập nhật lại localStorage
      //   // const currentDraft = JSON.parse(
      //   //   localStorage.getItem(LOCAL_STORAGE_KEY) || "{}"
      //   // );
      //   // delete currentDraft.createdStoryId;
      //   // localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentDraft));
      // } else {
      // --- DÙNG HELPER CHO CÁC LỖI KHÁC ---
      handleApiError(error, "Có lỗi xảy ra khi tạo truyện");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl mb-2">Tạo Truyện Mới</h1>
        <p className="text-sm text-muted-foreground">
          Điền thông tin để tạo bản nháp truyện của bạn
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin truyện</CardTitle>
          <CardDescription>
            Tất cả các trường đánh dấu (*) là bắt buộc
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tên truyện */}
          <div className="space-y-2 ">
            <div className="flex justify-between items-center ">
              <Label className="text-base font-bold">
                Tên truyện <span className="text-red-500 text-xl">*</span>
              </Label>
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
              placeholder="Nhập tên truyện của bạn..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleLength(e.target.value.length);
              }}
              maxLength={LIMITS.TITLE}
              className={
                titleLength > LIMITS.TITLE
                  ? "border-red-500"
                  : "dark:border-[#f0ead6]"
              }
            />
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              placeholder="Giới thiệu nội dung truyện của bạn..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="dark:border-[#f0ead6]"
            />
          </div>

          {/* Dàn ý cốt truyện */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-base font-bold">
                Dàn ý cốt truyện<span className="text-red-500 text-xl">*</span>
              </Label>
              <span
                className={`text-xs ${
                  outlineLength > LIMITS.OUTLINE
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {outlineLength}/{LIMITS.OUTLINE}
              </span>
            </div>
            <Textarea
              placeholder="Viết dàn ý chi tiết dự kiến của truyện..."
              value={outline}
              onChange={(e) => {
                setOutline(e.target.value);
                setOutlineLength(e.target.value.length);
              }}
              rows={8}
              maxLength={LIMITS.OUTLINE}
              className="dark:border-[#f0ead6]"
            />
          </div>

          {/* Độ dài dự kiến */}
          <div className="space-y-2">
            <Label className="text-base font-bold">
              Độ dài dự kiến <span className="text-red-500 text-xl">*</span>
            </Label>
            <RadioGroup
              value={lengthPlan}
              onValueChange={(v) => setLengthPlan(v as any)}
            >
              {LENGTH_PLAN_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  className="flex items-center space-x-2 mt-2"
                >
                  <RadioGroupItem
                    value={opt.value}
                    id={opt.value}
                    className="dark:border-[#f0ead6]"
                  />
                  <Label
                    htmlFor={opt.value}
                    className="cursor-pointer font-normal"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Thể loại */}
          <div className="space-y-2">
            <Label className="text-base font-bold">
              Thể loại <span className="text-red-500 text-xl">*</span>
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (Chọn ít nhất 1)
              </span>
            </Label>
            <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full justify-between border-2 border-primary/30 dark:border-[#f0ead6]"
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

          {/* Ảnh bìa */}
          <div className="space-y-4">
            <Label className="text-base font-bold">
              Ảnh bìa <span className="text-red-500 text-xl">*</span>
            </Label>
            <RadioGroup value={coverMode} onValueChange={handleCoverModeChange}>
              {/* Upload */}
              <label className="cursor-pointer">
                <Card
                  className={
                    coverMode === "upload"
                      ? "ring-2 ring-primary border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }
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
                          <div className="mt-4">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                e.target.files?.[0] &&
                                setCoverFile(e.target.files[0])
                              }
                            />
                            {coverFile && (
                              <p className="text-sm text-emerald-600 mt-2">
                                Đã chọn: {coverFile.name}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </label>

              {/* AI */}
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

      {/* Preview ảnh AI */}
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
    </div>
  );
}
