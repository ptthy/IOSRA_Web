// app/author/create-story/CreateStoryForm.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    languageCode?: "vi-VN" | "en-US" | "zh-CN" | "ja-JP"; // Thêm
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

  // Lưu initialData ban đầu để so sánh
  const initialDataRef = useRef<typeof initialData | null>(null);

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
  const [languageCode, setLanguageCode] = useState<
    "vi-VN" | "en-US" | "zh-CN" | "ja-JP"
  >("vi-VN");
  const LIMITS = {
    TITLE_MIN: 10,
    TITLE_MAX: 50,
    DESC_MIN: 6,
    DESC_MAX: 1000,
    OUTLINE_MIN: 20,
    OUTLINE_MAX: 5000,
    PROMPT: 500,
  };
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

  // Load initial data
  useEffect(() => {
    if (initialData) {
      // Lưu initialData vào ref để so sánh sau này
      initialDataRef.current = initialData;

      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setOutline(initialData.outline || "");
      setLengthPlan(initialData.lengthPlan || "short");
      setSelectedTagIds(initialData.selectedTagIds || []);
      setLanguageCode(initialData.languageCode || "vi-VN");

      // Trong edit mode, luôn dùng upload và khóa AI
      if (isEditMode) {
        setCoverMode("upload");
        setHasUsedAICover(true);
        if (initialData.currentCoverUrl) {
          setGeneratedAICover(initialData.currentCoverUrl);
        }
      } else {
        setCoverMode(
          initialData.hasUsedAICover
            ? "upload"
            : initialData.coverMode || "upload"
        );
        setHasUsedAICover(initialData.hasUsedAICover || false);
        if (initialData.currentCoverUrl) {
          setGeneratedAICover(initialData.currentCoverUrl);
        }
      }

      setCoverPrompt(initialData.coverPrompt || "");
      setCreatedStoryId(initialData.createdStoryId || null);
    }
    // else {
    //   // Chỉ load draft khi không phải edit mode
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
    // }
  }, [initialData, isEditMode]);

  // // Save draft (chỉ khi không phải edit mode)
  // useEffect(() => {
  //   if (!isEditMode) {
  //     const draft = {
  //       title,
  //       description,
  //       outline,
  //       lengthPlan,
  //       selectedTagIds,
  //       coverMode,
  //       coverPrompt,
  //       hasUsedAICover,
  //       createdStoryId,
  //     };
  //     localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
  //   }
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
  //   isEditMode,
  // ]);

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
    if (isEditMode) {
      toast.error("Chế độ chỉnh sửa chỉ cho phép upload ảnh");
      return;
    }
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
      // Tạo URL tạm thời để preview
      setGeneratedAICover(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên truyện");
      return;
    }
    if (!outline.trim()) {
      toast.error("Vui lòng nhập dàn ý cốt truyện");
      return;
    }
    if (title.length < LIMITS.TITLE_MIN || title.length > LIMITS.TITLE_MAX) {
      toast.error(
        `Tiêu đề phải từ ${LIMITS.TITLE_MIN} đến ${LIMITS.TITLE_MAX} ký tự`
      );
      return;
    }
    if (
      outline.length < LIMITS.OUTLINE_MIN ||
      outline.length > LIMITS.OUTLINE_MAX
    ) {
      toast.error(
        `Dàn ý phải từ ${LIMITS.OUTLINE_MIN} đến ${LIMITS.OUTLINE_MAX} ký tự`
      );
      return;
    }
    // Mô tả không bắt buộc, nhưng nếu nhập thì phải đúng độ dài
    if (
      description &&
      (description.length < LIMITS.DESC_MIN ||
        description.length > LIMITS.DESC_MAX)
    ) {
      toast.error(
        `Mô tả phải từ ${LIMITS.DESC_MIN} đến ${LIMITS.DESC_MAX} ký tự`
      );
      return;
    }
    if (selectedTagIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 thể loại");
      return;
    }

    //  FIX QUAN TRỌNG: Trong edit mode, không bắt buộc phải có coverFile mới
    if (
      coverMode === "upload" &&
      !coverFile &&
      !generatedAICover &&
      !isEditMode
    ) {
      toast.error("Vui lòng chọn ảnh bìa");
      return;
    }
    if (coverMode === "generate" && !coverPrompt.trim()) {
      toast.error("Vui lòng nhập mô tả ảnh AI");
      return;
    }

    setIsSubmitting(true);

    //   try {
    //     //  FIX LỖI 400 & LỖI TYPESCRIPT:
    //     // Trong edit mode, nếu không có coverFile mới, gửi coverFile là undefined
    //     // Đảm bảo kiểu dữ liệu phù hợp với CreateStoryRequest
    //     const finalCoverFile =
    //       isEditMode && !coverFile ? undefined : coverFile || undefined;

    //     // Trong edit mode, chỉ gửi những field đã thay đổi
    //     let requestData: Partial<CreateStoryRequest>;

    //     if (isEditMode && initialDataRef.current) {
    //       const initial = initialDataRef.current;
    //       requestData = {}; // Khởi tạo object rỗng

    //       // Chỉ thêm field nếu có thay đổi
    //       if (title.trim() !== (initial.title || "").trim()) {
    //         requestData.title = title;
    //       }
    //       if ((description || "").trim() !== (initial.description || "").trim()) {
    //         requestData.description = description || "";
    //       }
    //       if (outline.trim() !== (initial.outline || "").trim()) {
    //         requestData.outline = outline;
    //       }
    //       if (lengthPlan !== (initial.lengthPlan || "short")) {
    //         requestData.lengthPlan = lengthPlan;
    //       }

    //       // So sánh tags
    //       const initialTagIds = (initial.selectedTagIds || [])
    //         .slice()
    //         .sort()
    //         .join(",");
    //       const currentTagIds = [...selectedTagIds].slice().sort().join(",");
    //       if (initialTagIds !== currentTagIds) {
    //         requestData.tagIds = selectedTagIds;
    //       }

    //       // Chỉ gửi coverMode và coverFile nếu có file mới
    //       if (coverFile instanceof File) {
    //         requestData.coverMode = coverMode;
    //         requestData.coverFile = coverFile;
    //       }
    //     } else {
    //       // CREATE MODE: Gửi tất cả field
    //       requestData = {
    //         title,
    //         description: description || "",
    //         outline,
    //         lengthPlan,
    //         languageCode, // Thêm
    //         tagIds: selectedTagIds,
    //         coverMode,
    //         coverFile: coverMode === "upload" ? finalCoverFile : undefined,
    //         coverPrompt: coverMode === "generate" ? coverPrompt : undefined,
    //       };
    //     }
    //     if (isEditMode && storyId) {
    //       // 1. Lấy dữ liệu cũ từ Ref để so sánh chính xác
    //       const initial = initialDataRef.current;

    //       // 2. Khởi tạo DUY NHẤT một object chứa các thay đổi
    //       let updateFields: Partial<CreateStoryRequest> = {};

    //       // Kiểm tra từng trường và add vào updateFields
    //       if (languageCode !== initial?.languageCode) {
    //         updateFields.languageCode = languageCode;
    //       }

    //       // 4. Bổ sung kiểm tra các trường khác để không bị mất dữ liệu khi lưu
    //       if (title.trim() !== (initial?.title || "").trim())
    //         updateFields.title = title;
    //       if (outline.trim() !== (initial?.outline || "").trim())
    //         updateFields.outline = outline;
    //       if (
    //         (description || "").trim() !== (initial?.description || "").trim()
    //       ) {
    //         updateFields.description = description || "";
    //       }

    //       // 5. Kiểm tra xem có thực sự có thay đổi nào không
    //       if (Object.keys(updateFields).length > 0 || coverFile instanceof File) {
    //         // Truyền ĐÚNG biến updateFields vào hàm updateDraft
    //         await storyService.updateDraft(storyId, updateFields);

    //         // QUAN TRỌNG: Cập nhật lại Ref sau khi lưu thành công để lần edit tiếp theo
    //         // không bị coi là "có thay đổi" nếu người dùng bấm lưu 2 lần liên tiếp.
    //         if (initialDataRef.current) {
    //           initialDataRef.current = {
    //             ...initialDataRef.current,
    //             ...updateFields,
    //           };
    //         }

    //         toast.success("Cập nhật truyện thành công!");
    //         onSuccess?.();
    //       } else {
    //         toast.info("Không có thay đổi nào để cập nhật");
    //       }
    //     }
    //   } catch (error: any) {
    //     console.error("Submit error:", error);

    //     // --- LOGIC BẮT HẾT LỖI TỪ BACKEND ---
    //     if (error.response && error.response.data && error.response.data.error) {
    //       const { message, details } = error.response.data.error;

    //       // 1. Nếu có 'details' (Lỗi validation như: Tiêu đề, Mô tả, Dàn ý...)
    //       if (details) {
    //         // Lấy tất cả các key bị lỗi (Title, Description, Outline...)
    //         const errorKeys = Object.keys(details);

    //         errorKeys.forEach((key) => {
    //           // Duyệt qua mảng các câu thông báo lỗi của từng key và hiện toast
    //           details[key].forEach((msg: string) => {
    //             toast.error(msg);
    //           });
    //         });
    //         return; // Dừng lại sau khi đã hiện hết lỗi chi tiết
    //       }

    //       // 2. Nếu không có details nhưng có message chung (Lỗi logic)
    //       if (message) {
    //         toast.error(message);
    //         return;
    //       }
    //     }

    //     // 3. Fallback cho các lỗi khác (lỗi mạng, server sập...)
    //     const fallbackMessage =
    //       error.response?.data?.message || error.message || "Có lỗi xảy ra";
    //     toast.error(fallbackMessage);
    //     // --------------------------------------
    //   } finally {
    //     setIsSubmitting(false);
    //   }
    // };

    setIsSubmitting(true);

    try {
      // GIỮ NGUYÊN LOGIC CỦA BẠN: Xử lý file ảnh bìa để tránh lỗi 400
      const finalCoverFile =
        isEditMode && !coverFile ? undefined : coverFile || undefined;

      if (isEditMode && storyId) {
        const initial = initialDataRef.current;

        // CHỈ DÙNG 1 OBJECT DUY NHẤT để gom tất cả thay đổi
        let updateFields: Partial<CreateStoryRequest> = {};

        // 1. Kiểm tra Ngôn ngữ (Dòng này giúp cập nhật en-US thành công)
        if (languageCode !== initial?.languageCode) {
          updateFields.languageCode = languageCode;
        }

        // 2. Kiểm tra các trường văn bản
        if (title.trim() !== (initial?.title || "").trim())
          updateFields.title = title.trim();
        if (outline.trim() !== (initial?.outline || "").trim())
          updateFields.outline = outline.trim();
        if (
          (description || "").trim() !== (initial?.description || "").trim()
        ) {
          updateFields.description = description?.trim() || "";
        }
        if (lengthPlan !== initial?.lengthPlan)
          updateFields.lengthPlan = lengthPlan;

        // 3. Kiểm tra Thể loại (Tags)
        const initialTags = [...(initial?.selectedTagIds || [])]
          .sort()
          .join(",");
        const currentTags = [...selectedTagIds].sort().join(",");
        if (initialTags !== currentTags) {
          updateFields.tagIds = selectedTagIds;
        }

        // 4. Kiểm tra Ảnh bìa mới (Sử dụng finalCoverFile bạn yêu cầu)
        if (coverFile instanceof File) {
          updateFields.coverMode = "upload";
          updateFields.coverFile = finalCoverFile;
        }

        // 5. Chỉ gọi API nếu thực sự có thay đổi
        if (Object.keys(updateFields).length > 0) {
          await storyService.updateDraft(storyId, updateFields);

          // Cập nhật lại Ref để đồng bộ dữ liệu cho lần bấm tiếp theo
          if (initialDataRef.current) {
            initialDataRef.current = {
              ...initialDataRef.current,
              ...updateFields,
            };
          }

          toast.success("Cập nhật truyện thành công!");
          onSuccess?.();
        } else {
          toast.info("Không có thay đổi nào để cập nhật");
        }
      } else {
        // LOGIC CHO CHẾ ĐỘ TẠO MỚI (CREATE MODE)
        const createData: CreateStoryRequest = {
          title: title.trim(),
          description: description?.trim() || "",
          outline: outline.trim(),
          lengthPlan,
          languageCode,
          tagIds: selectedTagIds,
          coverMode,
          coverFile: coverMode === "upload" ? finalCoverFile : undefined,
          coverPrompt: coverMode === "generate" ? coverPrompt : undefined,
        };

        const newStory = await storyService.createStory(createData);
        toast.success("Tạo truyện thành công!");
        router.push(`/author/story/${newStory.storyId}`);
      }
    } catch (error: any) {
      console.error("Submit error:", error);

      // --- GIỮ NGUYÊN LOGIC BẮT LỖI BACKEND CỦA BẠN ---
      if (error.response?.data?.error) {
        const { message, details } = error.response.data.error;
        if (details) {
          Object.keys(details).forEach((key) => {
            details[key].forEach((msg: string) => toast.error(msg));
          });
          return;
        }
        if (message) {
          toast.error(message);
          return;
        }
      }
      toast.error(
        error.response?.data?.message || error.message || "Có lỗi xảy ra"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleAcceptAICover = () => {
    setShowAIPreview(false);
    setHasUsedAICover(true);
    //localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast.success("Đã dùng ảnh bìa AI");
    if (createdStoryId) {
      router.push(`/author/story/${createdStoryId}`);
    }
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
    //   localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDraft));
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
              : "Tất cả các trường đánh dấu (*) là bắt buộc"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* === Tên truyện === */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-base font-bold ">
                Tên truyện <span className="text-red-500 text-xl ">*</span>
              </Label>
              {/* <span
                className={`text-xs ${
                  titleLength > LIMITS.TITLE
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {titleLength}/{LIMITS.TITLE}
              </span> */}
              <span
                className={`text-xs font-medium ${
                  title.length < LIMITS.TITLE_MIN ||
                  title.length > LIMITS.TITLE_MAX
                    ? "text-red-500"
                    : "text-emerald-600"
                }`}
              >
                {title.length < LIMITS.TITLE_MIN
                  ? `Tối thiểu ${LIMITS.TITLE_MIN}`
                  : `${title.length}/${LIMITS.TITLE_MAX}`}
              </span>
            </div>
            {/* <Input
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
          </div> */}
            <Input
              placeholder="Nhập tên truyện từ 10-50 ký tự..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`transition-all ${
                title.length > 0 &&
                (title.length < LIMITS.TITLE_MIN ||
                  title.length > LIMITS.TITLE_MAX)
                  ? "border-red-500 focus-visible:ring-red-500"
                  : title.length >= LIMITS.TITLE_MIN
                  ? "border-emerald-500 focus-visible:ring-emerald-500"
                  : "dark:border-[#f0ead6]"
              }`}
            />
          </div>

          {/* === Mô tả === */}
          {/* <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              placeholder="Giới thiệu nội dung truyện của bạn..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="dark:border-[#f0ead6]"
            />
          </div> */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-base font-bold">Mô tả</Label>
              <span
                className={`text-xs font-medium ${
                  description.length > 0 &&
                  (description.length < LIMITS.DESC_MIN ||
                    description.length > LIMITS.DESC_MAX)
                    ? "text-red-500"
                    : description.length >= LIMITS.DESC_MIN
                    ? "text-emerald-600"
                    : "text-muted-foreground"
                }`}
              >
                {description.length > 0 && description.length < LIMITS.DESC_MIN
                  ? `Tối thiểu ${LIMITS.DESC_MIN}`
                  : `${description.length}/${LIMITS.DESC_MAX}`}
              </span>
            </div>
            <Textarea
              placeholder="Giới thiệu nội dung truyện (6-1000 ký tự)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className={`transition-all ${
                description.length > 0 &&
                (description.length < LIMITS.DESC_MIN ||
                  description.length > LIMITS.DESC_MAX)
                  ? "border-red-500 focus-visible:ring-red-500"
                  : description.length >= LIMITS.DESC_MIN
                  ? "border-emerald-500 focus-visible:ring-emerald-500"
                  : "dark:border-[#f0ead6]"
              }`}
            />
          </div>

          {/* === Dàn ý cốt truyện === */}
          {/* <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-base font-bold">
                Dàn ý cốt truyện <span className="text-red-500 text-xl">*</span>
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
              className={
                outlineLength > LIMITS.OUTLINE
                  ? "border-red-500"
                  : "dark:border-[#f0ead6]"
              }
            />
          </div> */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-base font-bold">
                Dàn ý cốt truyện <span className="text-red-500 text-xl">*</span>
              </Label>
              <span
                className={`text-xs font-medium ${
                  outline.length < LIMITS.OUTLINE_MIN ||
                  outline.length > LIMITS.OUTLINE_MAX
                    ? "text-red-500"
                    : "text-emerald-600"
                }`}
              >
                {outline.length < LIMITS.OUTLINE_MIN
                  ? `Tối thiểu ${LIMITS.OUTLINE_MIN}`
                  : `${outline.length}/${LIMITS.OUTLINE_MAX}`}
              </span>
            </div>
            <Textarea
              placeholder="Viết dàn ý chi tiết (20-5000 ký tự)..."
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              rows={8}
              className={`transition-all ${
                outline.length > 0 &&
                (outline.length < LIMITS.OUTLINE_MIN ||
                  outline.length > LIMITS.OUTLINE_MAX)
                  ? "border-red-500 focus-visible:ring-red-500"
                  : outline.length >= LIMITS.OUTLINE_MIN
                  ? "border-emerald-500 focus-visible:ring-emerald-500"
                  : "dark:border-[#f0ead6]"
              }`}
            />
          </div>

          {/* === Độ dài dự kiến === */}
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
          {/* === Ngôn ngữ === */}
          <div className="space-y-2">
            <Label className="text-base font-bold">
              Ngôn ngữ <span className="text-red-500 text-xl">*</span>
            </Label>
            <Select
              value={languageCode}
              onValueChange={(value: "vi-VN" | "en-US" | "zh-CN" | "ja-JP") =>
                setLanguageCode(value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full max-w-xs dark:border-[#f0ead6]">
                <SelectValue placeholder="Chọn ngôn ngữ cho truyện" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi-VN">Tiếng Việt</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
                <SelectItem value="zh-CN">中文</SelectItem>
                <SelectItem value="ja-JP">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* === Thể loại === */}
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
                <div className="max-h-[400px] overflow-y-auto pr-2 ">
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

          {/* === Ảnh bìa - LAYOUT MỚI 2 CỘT === */}
          <div className="space-y-4">
            <Label className="text-base font-bold">
              Ảnh bìa <span className="text-red-500 text-xl ">*</span>
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cột trái: Hiển thị ảnh preview */}
              <div className="md:col-span-1">
                {generatedAICover && (
                  <div className="flex flex-col items-center">
                    <div className="relative w-full max-w-[200px] aspect-[2/3] border rounded-lg overflow-hidden shadow-lg">
                      <ImageWithFallback
                        src={generatedAICover}
                        alt="Preview cover"
                        className="w-full h-full object-cover"
                      />
                      {coverMode === "generate" && (
                        <Badge className="absolute top-2 right-2 bg-primary text-white">
                          AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      {isEditMode ? "Ảnh hiện tại" : "Xem trước"}
                    </p>
                  </div>
                )}
              </div>

              {/* Cột phải: Các tùy chọn ảnh bìa */}
              <div className="md:col-span-2">
                <RadioGroup
                  value={coverMode}
                  onValueChange={handleCoverModeChange}
                >
                  {/* Upload ảnh */}
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
                              <p className="font-medium">
                                Upload ảnh từ máy tính
                              </p>
                            </div>
                            {coverMode === "upload" && (
                              <div className="mt-4">
                                {/* Ẩn input gốc đi, dùng Label để tạo giao diện hiển thị tên file */}
                                <div className="relative group">
                                  <Label
                                    htmlFor="file-upload-input"
                                    className="flex items-center w-full h-10 px-3 py-2 text-sm border rounded-md cursor-pointer bg-background hover:bg-accent/50 transition-colors"
                                  >
                                    {/* Giả lập cái nút "Chọn tệp" màu xám */}
                                    <span className="px-3 py-1 mr-3 text-xs font-medium border rounded bg-secondary text-secondary-foreground whitespace-nowrap group-hover:bg-secondary/80">
                                      Chọn tệp
                                    </span>

                                    {/* Phần hiển thị tên file hoặc trạng thái */}
                                    <span
                                      className={`truncate ${
                                        coverFile
                                          ? "text-foreground font-medium"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {coverFile
                                        ? coverFile.name // Nếu vừa chọn file mới thì hiện tên file
                                        : (isEditMode && generatedAICover) ||
                                          generatedAICover
                                        ? "Đang dùng ảnh hiện tại (Bấm để thay đổi)"
                                        : "Không có tệp nào được chọn"}
                                    </span>
                                  </Label>

                                  {/* Input thật bị ẩn đi bằng className="hidden" */}
                                  <Input
                                    id="file-upload-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                  />
                                </div>

                                {/* Dòng thông báo trạng thái màu xanh bên dưới */}
                                {(coverFile ||
                                  ((isEditMode || generatedAICover) &&
                                    generatedAICover)) && (
                                  <p className="text-sm text-emerald-600 mt-2 font-medium">
                                    {coverFile
                                      ? "Đã chọn ảnh mới thành công"
                                      : "Đang sử dụng ảnh bìa cũ"}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </label>

                  {/* AI - Bị disable trong edit mode */}
                  <label
                    className={
                      isEditMode || hasUsedAICover
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  >
                    <Card
                      className={`${
                        coverMode === "generate"
                          ? "ring-2 ring-primary border-primary bg-primary/5"
                          : ""
                      } ${isEditMode || hasUsedAICover ? "opacity-50" : ""}`}
                    >
                      <CardContent className="pt-6 pb-6">
                        <div className="flex items-start gap-3">
                          <RadioGroupItem
                            value="generate"
                            id="generate"
                            disabled={isEditMode || hasUsedAICover}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              <p className="font-medium">Tạo ảnh bằng AI</p>
                              {(isEditMode || hasUsedAICover) && (
                                <Badge variant="secondary">
                                  {isEditMode ? "Đã khóa" : "Đã dùng"}
                                </Badge>
                              )}
                            </div>
                            {coverMode === "generate" &&
                              !isEditMode &&
                              !hasUsedAICover && (
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
            </div>
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
    </>
  );
}
