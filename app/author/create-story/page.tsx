// app/author/create-story/page.tsx
/* 
MỤC ĐÍCH: Trang tạo truyện mới (standalone page, không reusable)
CHỨC NĂNG CHÍNH:
- Giao diện đầy đủ để tác giả tạo truyện mới
- Form nhập thông tin tương tự CreateStoryForm nhưng độc lập
- Xử lý tạo ảnh bìa AI và preview
- Logic đặc biệt cho trường hợp từ chối ảnh AI (state management)
- Điều hướng sau khi tạo thành công
- Xử lý lỗi tài khoản bị hạn chế đăng bài (AccountRestricted)

KHÁC BIỆT VỚI CreateStoryForm COMPONENT:
- Đây là STANDALONE PAGE: có routing, không có props
- Xử lý logic AI cover từ chối PHỨC TẠP HƠN
- Có xử lý lỗi AccountRestricted đặc biệt
- Redirect flow khác biệt

LOGIC FLOW CHÍNH:
1. User điền form → submit
2. Nếu chọn upload ảnh → tạo truyện → redirect
3. Nếu chọn AI → tạo truyện → hiển thị preview
4. User chấp nhận AI → redirect
5. User từ chối AI → chuyển sang upload mode (vẫn giữ storyId)

QUAN HỆ VỚI HỆ THỐNG:
- Kế thừa layout: app/author/layout.tsx
- Service: @/services/storyService
- API: POST /story/draft (tạo truyện), PUT /story/draft/{id}/cover (update ảnh)
*/
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/**
 * OPTIONS CHO ĐỘ DÀI DỰ KIẾN - copy từ CreateStoryForm
 * LÝ DO COPY LẠI:
 * - Page này độc lập với CreateStoryForm component
 * - Tránh import phức tạp (circular dependency)
 * - Đơn giản hóa kiến trúc: page standalone
 */
const LENGTH_PLAN_OPTIONS = [
  { value: "super_short", label: "Siêu ngắn (từ 1-5 chương)" },
  { value: "short", label: "Ngắn (từ 6-20 chương)" },
  { value: "novel", label: "Dài (trên 20 chương)" },
] as const;

export default function CreateStoryPage() {
  const router = useRouter();

  // ================ STATE DECLARATIONS ================

  /**
   * STATE MANAGEMENT - tương tự CreateStoryForm nhưng có thêm logic đặc biệt
   */
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

  // AI state - QUAN TRỌNG: xử lý từ chối AI
  const [generatedAICover, setGeneratedAICover] = useState<string | null>(null);
  const [hasUsedAICover, setHasUsedAICover] = useState(false);
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null); // Lưu storyId khi từ chối AI

  // Character counters
  const [titleLength, setTitleLength] = useState(0);
  const [outlineLength, setOutlineLength] = useState(0);
  const [promptLength, setPromptLength] = useState(0);

  const [languageCode, setLanguageCode] = useState<
    "vi-VN" | "en-US" | "zh-CN" | "ja-JP"
  >("vi-VN");
  // Validation limits
  const LIMITS = {
    TITLE_MIN: 10,
    TITLE_MAX: 50,
    DESC_MIN: 6,
    DESC_MAX: 1000,
    OUTLINE_MIN: 20,
    OUTLINE_MAX: 5000,
    PROMPT: 500,
  };
  /**
   * HÀM XỬ LÝ LỖI TỪ API - CÓ THÊM XỬ LÝ AccountRestricted ĐẶC BIỆT
   * LÝ DO THÊM TRANG NÀY:
   * - Trang create story có thể bị lỗi AccountRestricted (tài khoản bị ban)
   * - Cần format ngày tiếng Việt cho thông báo dễ hiểu
   *
   * FLOW XỬ LÝ LỖI:
   * 1. Ưu tiên: AccountRestricted (format ngày VN)
   * 2. Validation details
   * 3. Message chung
   * 4. Fallback
   */
  const handleApiError = (error: any, defaultMessage: string) => {
    // 1. Kiểm tra cấu trúc lỗi từ Backend
    if (error.response && error.response.data && error.response.data.error) {
      const { code, message, details } = error.response.data.error;

      // --- A. GIỮ LẠI: Xử lý AccountRestricted (Format ngày tiếng Việt) ---
      if (code === "AccountRestricted") {
        // Regex tìm date string ISO trong message
        const dateMatch = message.match(
          /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/
        );
        if (dateMatch) {
          const date = new Date(dateMatch[0]);
          const dateStr = date.toLocaleString("vi-VN"); // Format: "dd/MM/yyyy, HH:mm:ss"
          toast.error(`Tài khoản bị hạn chế đăng bài đến: ${dateStr}`);
          return;
        }
        toast.error(message);
        return;
      }

      // --- B. Ưu tiên Validation chi tiết (details) ---
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          const msg = details[firstKey].join(" ");
          toast.error(msg);
          return;
        }
      }

      // --- C. Message chung từ Backend ---
      if (message) {
        toast.error(message);
        return;
      }
    }

    // 2. Fallback cho các lỗi mạng hoặc server không phản hồi
    const fallbackMsg = error.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // ================ EFFECTS ================

  /**
   * useEffect: LOAD TAGS KHI COMPONENT MOUNT
   * Tương tự CreateStoryForm
   */
  // Load tags khi componentvừa hiện lên lần đầu tiên
  useEffect(() => {
    loadTags();
  }, []);
  /**
   * Hàm load tags từ API
   * LÝ DO TÁCH RIÊNG:
   * - Có thể gọi lại khi cần refresh
   * - Dùng helper handleApiError để xử lý lỗi thống nhất
   */
  const loadTags = async () => {
    setIsLoading(true);
    try {
      const data = await storyService.getAllTags();
      setTags(data);
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải danh sách thể loại");
    } finally {
      setIsLoading(false);
    }
  };
  /**
   * Hàm toggle tag selection - giống CreateStoryForm
   */
  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };
  /**
   * Xử lý thay đổi cover mode
   * LOGIC ĐƠN GIẢN HƠN CreateStoryForm (không có edit mode):
   * - Chỉ check đã dùng AI chưa
   * - Hiển thị cảnh báo khi chọn AI
   */
  const handleCoverModeChange = (value: "upload" | "generate") => {
    if (value === "generate" && hasUsedAICover) {
      toast.error("Bạn đã dùng lượt tạo ảnh AI. Không thể chọn lại.");
      return;
    }
    setCoverMode(value);
    if (value === "generate") setShowAIWarning(true);
  };
  /**
   * Xử lý khi user chấp nhận ảnh AI
   * LOGIC:
   * - Đánh dấu đã dùng AI
   * - Redirect đến trang submit AI (bước tiếp theo)
   */
  const handleAcceptAICover = () => {
    setShowAIPreview(false);
    setHasUsedAICover(true);

    toast.success("Đã dùng ảnh bìa AI");
    router.push(`/author/story/${createdStoryId}/submit-ai`);
  };
  /**
   * XỬ LÝ KHI USER TỪ CHỐI ẢNH AI - LOGIC QUAN TRỌNG
   * FLOW:
   * 1. Reset preview
   * 2. Chuyển sang upload mode
   * 3. ĐÁNH DẤU ĐÃ DÙNG AI (quan trọng: không được dùng lại)
   * 4. Thông báo cho user upload ảnh mới
   *
   * LƯU Ý: createdStoryId vẫn được giữ lại để update cover sau
   */
  const handleRejectAICover = () => {
    setShowAIPreview(false);
    setShowAIPreview(false);
    setGeneratedAICover(null);
    setCoverMode("upload");
    setHasUsedAICover(true); // <<<--- THÊM DÒNG NÀY VÀO!!!
    // Có thể lưu draft state nếu cần (cho UX)
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
    toast.info("Đã từ chối ảnh AI → Vui lòng upload ảnh mới");
  };
  /**
   * HÀM SUBMIT CHÍNH - CHỈ XỬ LÝ CREATE MODE (không có edit mode)
   * LOGIC PHÂN BIỆT 2 TRƯỜNG HỢP:
   * 1. Tạo mới hoàn toàn (chưa có createdStoryId)
   * 2. Đã có storyId (do từ chối AI trước đó) → chỉ update ảnh bìa
   *
   * FLOW CHI TIẾT:
   * A. Tạo mới:
   *    - Gọi API createStory
   *    - Nếu AI: hiển thị preview
   *    - Nếu upload: redirect
   * B. Đã có ID (từ chối AI):
   *    - Gọi API replaceDraftCover
   *    - Redirect
   */
  const handleSubmit = async () => {
    // ===== VALIDATION =====
    if (!title.trim()) return toast.error("Vui lòng nhập tên truyện");
    if (!outline.trim()) return toast.error("Vui lòng nhập dàn ý cốt truyện");
    if (title.length < LIMITS.TITLE_MIN || title.length > LIMITS.TITLE_MAX) {
      return toast.error(
        `Tên truyện phải từ ${LIMITS.TITLE_MIN} đến ${LIMITS.TITLE_MAX} ký tự`
      );
    }
    if (
      outline.length < LIMITS.OUTLINE_MIN ||
      outline.length > LIMITS.OUTLINE_MAX
    ) {
      return toast.error(
        `Dàn ý phải từ ${LIMITS.OUTLINE_MIN} đến ${LIMITS.OUTLINE_MAX} ký tự`
      );
    }
    if (
      description &&
      (description.length < LIMITS.DESC_MIN ||
        description.length > LIMITS.DESC_MAX)
    ) {
      return toast.error(
        `Mô tả phải từ ${LIMITS.DESC_MIN} đến ${LIMITS.DESC_MAX} ký tự`
      );
    }
    if (selectedTagIds.length === 0)
      return toast.error("Vui lòng chọn ít nhất 1 thể loại");
    // Cover validation đặc biệt: nếu đã có createdStoryId (từ chối AI) thì không require coverFile
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
          languageCode,
          tagIds: selectedTagIds,
          coverMode,
          coverFile: coverMode === "upload" ? coverFile! : undefined, // Non-null assertion vì đã validate
          coverPrompt: coverMode === "generate" ? coverPrompt : undefined,
        };
        // Gọi API tạo truyện
        const res = await storyService.createStory(requestData);
        // Lưu storyId để dùng sau này (khi từ chối AI)
        setCreatedStoryId(res.storyId);
        // ===== XỬ LÝ RESPONSE =====
        // Nếu dùng AI và có coverUrl → hiển thị preview
        if (coverMode === "generate" && res.coverUrl) {
          setGeneratedAICover(res.coverUrl);
          setHasUsedAICover(true); // Đánh dấu đã dùng AI
          setShowAIPreview(true); // Hiển thị dialog preview
        } else {
          // Nếu upload ảnh thường -> redirect thẳng
          toast.success("Tạo truyện thành công!");
          router.push(`/author/story/${res.storyId}/submit-ai`);
        }
      }
      // ===== TRƯỜNG HỢP 2: ĐÃ CÓ ID (do từ chối AI trước đó) → UPDATE COVER =====
      else if (createdStoryId && coverMode === "upload" && coverFile) {
        // Chỉ update ảnh bìa (giữ nguyên các field khác)
        await storyService.replaceDraftCover(createdStoryId, coverFile);

        toast.success("Cập nhật ảnh bìa thành công!");
        router.push(`/author/story/${createdStoryId}/submit-ai`);
      }
    } catch (error: any) {
      // Đổi tên biến thành error cho đồng bộ
      console.error(error);

      // --- DÙNG HELPER CHO CÁC LỖI KHÁC ---
      handleApiError(error, "Có lỗi xảy ra khi tạo truyện");
    } finally {
      setIsSubmitting(false);
    }
  };
  // ================ UI RENDERING ================

  /**
   * LOADING STATE: Hiển thị khi đang fetch tags
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl mb-2">Tạo Truyện Mới</h1>
        <p className="text-sm text-muted-foreground">
          Điền thông tin để tạo bản nháp truyện của bạn
        </p>
      </div>
      {/* Main Form Card */}
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
            <div className="flex justify-between items-center">
              <Label className="text-base font-bold">
                Tên truyện <span className="text-red-500 text-xl">*</span>
              </Label>
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

          {/* Mô tả */}
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

          {/* Dàn ý cốt truyện */}
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
