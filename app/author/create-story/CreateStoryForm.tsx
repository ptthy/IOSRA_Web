// app/author/create-story/CreateStoryForm.tsx
/* 
MỤC ĐÍCH: Component form tạo/chỉnh sửa truyện (reusable)
CHỨC NĂNG CHÍNH:
- Form nhập thông tin truyện: tiêu đề, mô tả, dàn ý, thể loại, ảnh bìa
- Hỗ trợ 2 chế độ: tạo mới (create) và chỉnh sửa (edit)
- Hai phương thức upload ảnh bìa: upload từ máy hoặc tạo bằng AI
- Giới hạn chỉ tạo ảnh AI 1 lần duy nhất (trong create mode)
- Validation realtime với đếm ký tự (character counters)
- Chọn nhiều thể loại qua dialog
- Xử lý ngôn ngữ cho truyện (tiếng Việt, Anh, Trung, Nhật)

ĐẶC ĐIỂM QUAN TRỌNG:
- Là COMPONENT REUSABLE: dùng cho cả trang tạo mới và trang chỉnh sửa
- OPTIMISTIC UPDATE (edit mode): chỉ gửi những field thay đổi, không gửi toàn bộ
- AI COVER LIMIT: user chỉ được tạo ảnh AI 1 lần duy nhất trong create mode
- EDIT MODE RESTRICTION: trong edit mode, chỉ cho upload ảnh, không cho tạo AI

QUAN HỆ VỚI CÁC FILE KHÁC:
- Được sử dụng bởi: app/author/create-story/page.tsx (create mode)
- Được sử dụng bởi: app/author/story/[id]/edit/page.tsx (edit mode)
- Service: @/services/storyService
- Types: @/services/apiTypes
*/
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

/**
 * OPTIONS CHO ĐỘ DÀI DỰ KIẾN CỦA TRUYỆN
 * LÝ DO DÙNG CONST ARRAY VỚI as const:
 * - Type safety: TypeScript biết chính xác giá trị nào được phép
 * - Không thể thay đổi giá trị tại runtime (immutable)
 * - Dễ iterate và render trong JSX
 * - Tái sử dụng ở nhiều nơi (không cần copy-paste)
 */
const LENGTH_PLAN_OPTIONS = [
  { value: "super_short", label: "Siêu ngắn (từ 1-5 chương)" },
  { value: "short", label: "Ngắn (từ 6-20 chương)" },
  { value: "novel", label: "Dài (trên 20 chương)" },
] as const; // as const để TypeScript biết đây là readonly tuple

/**
 * INTERFACE CHO PROPS CỦA COMPONENT
 * LÝ DO DÙNG OPTIONAL PROPS:
 * - Component có thể dùng cho cả create và edit mode
 * - initialData: dữ liệu khởi tạo khi edit (truyện đã có)
 * - isEditMode: flag xác định chế độ (mặc định false = create)
 * - storyId: ID truyện khi edit (bắt buộc nếu isEditMode = true)
 * - onSuccess: callback khi submit thành công (dùng trong edit mode để close modal/redirect)
 */
interface CreateStoryFormProps {
  initialData?: {
    title?: string;
    description?: string;
    outline?: string;
    lengthPlan?: "super_short" | "short" | "novel";
    selectedTagIds?: string[];
    coverMode?: "upload" | "generate";
    coverPrompt?: string;
    hasUsedAICover?: boolean; // QUAN TRỌNG: đã dùng AI chưa?
    createdStoryId?: string | null;
    currentCoverUrl?: string; // URL ảnh hiện tại (edit mode)
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
  /**
   * SỬ DỤNG useRef ĐỂ LƯU INITIAL DATA (EDIT MODE OPTIMIZATION)
   * LÝ DO QUAN TRỌNG (PERFORMANCE):
   * - So sánh initialData với current state để chỉ gửi những field THAY ĐỔI
   * - Tránh gửi toàn bộ data mỗi lần update (optimistic update)
   * - Giữ nguyên reference giữa các lần render (không bị recreate)
   * - Chỉ update API với delta (sự thay đổi)
   */
  const initialDataRef = useRef<typeof initialData | null>(null);
  // ================ STATE DECLARATIONS ================

  /**
   * STATE QUẢN LÝ DATA VÀ UI
   */
  const [tags, setTags] = useState<Tag[]>([]); // Danh sách thể loại từ API
  const [isLoading, setIsLoading] = useState(true); // Loading khi fetch tags
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading khi submit form
  const [showAIWarning, setShowAIWarning] = useState(false); // Dialog cảnh báo AI
  const [showAIPreview, setShowAIPreview] = useState(false); // Dialog preview ảnh AI
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false); // Dialog chọn thể loại

  /**
   * FORM STATE - TẤT CẢ CÁC FIELD CỦA FORM
   * Mỗi field tương ứng với một input trong form
   */
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

  /**
   * AI STATE - QUẢN LÝ ẢNH BÌA AI
   */
  const [generatedAICover, setGeneratedAICover] = useState<string | null>(null); // URL ảnh AI tạo
  const [hasUsedAICover, setHasUsedAICover] = useState(false); // Flag đã dùng AI (CHỈ 1 LẦN)
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null); // ID truyện đã tạo (dùng khi từ chối ảnh AI)

  /**
   * CHARACTER COUNTERS - HIỂN THỊ SỐ KÝ TỰ REALTIME
   * Tính toán và hiển thị số ký tự đã nhập / giới hạn
   */
  const [titleLength, setTitleLength] = useState(0);
  const [outlineLength, setOutlineLength] = useState(0);
  const [promptLength, setPromptLength] = useState(0);
  const [languageCode, setLanguageCode] = useState<
    "vi-VN" | "en-US" | "zh-CN" | "ja-JP"
  >("vi-VN");

  /**
   * LIMITS CHO CÁC TRƯỜNG INPUT - VALIDATION CONSTANTS
   * LÝ DO DÙNG OBJECT CONST:
   * - Tránh magic number trong code
   * - Dễ quản lý và thay đổi giới hạn
   * - Tái sử dụng ở nhiều nơi (validation, hiển thị counter)
   */
  const LIMITS = {
    TITLE_MIN: 10,
    TITLE_MAX: 50,
    DESC_MIN: 6,
    DESC_MAX: 1000,
    OUTLINE_MIN: 20,
    OUTLINE_MAX: 5000,
    PROMPT: 500,
  };
  // ================ EFFECTS ================

  /**
   * useEffect: LOAD TAGS KHI COMPONENT MOUNT
   * Chạy 1 lần duy nhất khi component được render lần đầu
   * Fetch danh sách thể loại từ API để hiển thị trong dialog
   */
  useEffect(() => {
    loadTags();
  }, []); // Empty dependency array = chỉ chạy 1 lần
  /**
   * HÀM LOAD TAGS TỪ API
   * Tách riêng để có thể gọi lại khi cần refresh
   */
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

  /**
   * useEffect: LOAD INITIAL DATA KHI CÓ PROPS initialData
   * LOGIC QUAN TRỌNG:
   * 1. Lưu initialData vào ref (để so sánh sau này)
   * 2. Set các state từ initialData (populate form)
   * 3. Xử lý đặc biệt cho edit mode: luôn dùng upload, khóa AI
   *
   * Chạy khi initialData hoặc isEditMode thay đổi
   */
  useEffect(() => {
    if (initialData) {
      // 1. Lưu initialData vào ref để so sánh sau này
      initialDataRef.current = initialData;
      // 2. Set các state từ initialData
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setOutline(initialData.outline || "");
      setLengthPlan(initialData.lengthPlan || "short");
      setSelectedTagIds(initialData.selectedTagIds || []);
      setLanguageCode(initialData.languageCode || "vi-VN");

      /**
       * 3. LOGIC ĐẶC BIỆT CHO EDIT MODE:
       * - Trong edit mode: luôn dùng upload và khóa AI
       * - Ngoài edit mode: giữ nguyên mode từ initialData
       */
      if (isEditMode) {
        // EDIT MODE: chỉ cho upload, không cho AI
        setCoverMode("upload");
        setHasUsedAICover(true); // Khóa AI trong edit mode
        // Nếu có ảnh hiện tại → hiển thị preview
        if (initialData.currentCoverUrl) {
          setGeneratedAICover(initialData.currentCoverUrl);
        }
      } else {
        // CREATE MODE: giữ nguyên config từ initialData
        setCoverMode(
          initialData.hasUsedAICover
            ? "upload" // Nếu đã dùng AI thì chuyển sang upload
            : initialData.coverMode || "upload"
        );
        setHasUsedAICover(initialData.hasUsedAICover || false);
        // Nếu có ảnh hiện tại (từ draft) → hiển thị
        if (initialData.currentCoverUrl) {
          setGeneratedAICover(initialData.currentCoverUrl);
        }
      }
      // Set các state khác
      setCoverPrompt(initialData.coverPrompt || "");
      setCreatedStoryId(initialData.createdStoryId || null);
    }
  }, [initialData, isEditMode]);

  /**
   * useEffect: UPDATE CHARACTER COUNTERS REALTIME
   * Tính toán độ dài mỗi khi content thay đổi
   * Hiển thị feedback ngay lập tức cho user
   */
  useEffect(() => {
    setTitleLength(title.length);
    setOutlineLength(outline.length);
    setPromptLength(coverPrompt.length);
  }, [title, outline, coverPrompt]);
  // ================ EVENT HANDLERS ================

  /**
   * HÀM TOGGLE TAG SELECTION
   * Xử lý thêm/xóa tag trong dialog chọn thể loại
   *
   * LOGIC:
   * - Nếu tagId đã có trong selectedTagIds → remove
   * - Nếu chưa có → add
   *
   * LÝ DO DÙNG FUNCTIONAL UPDATE (prev => ...):
   * - Đảm bảo luôn lấy state mới nhất
   * - Tránh race condition khi setState
   */
  const toggleTag = (tagId: string) => {
    setSelectedTagIds(
      (prev) =>
        prev.includes(tagId)
          ? prev.filter((id) => id !== tagId) // Remove
          : [...prev, tagId] // Add
    );
  };
  /**
   * XỬ LÝ THAY ĐỔI COVER MODE (upload/generate)
   * LOGIC ĐẶC BIỆT:
   * - Trong edit mode: chỉ cho phép upload (toast error)
   * - Nếu đã dùng AI: không cho chọn lại (toast error)
   * - Nếu chọn generate → hiển thị cảnh báo AI
   */
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
  /**
   * XỬ LÝ CHỌN FILE ẢNH TỪ MÁY TÍNH
   * KIỂM TRA 3 BƯỚC:
   * 1. File có phải là ảnh không? (MIME type startsWith "image/")
   * 2. File size có vượt quá 10MB không?
   * 3. Tạo URL tạm (ObjectURL) để preview ngay lập tức
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Kiểm tra MIME type
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh");
        return;
      }
      // 2. Kiểm tra file size (10MB = 10 * 1024 * 1024 bytes)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ảnh không được vượt quá 10MB");
        return;
      }
      // 3. Lưu file và tạo preview URL
      setCoverFile(file);
      // Tạo URL tạm thời để preview
      setGeneratedAICover(URL.createObjectURL(file));
    }
  };
  /**
   * HÀM SUBMIT CHÍNH - XỬ LÝ CẢ CREATE VÀ UPDATE
   * LOGIC PHÂN BIỆT:
   * - isEditMode = true: gọi updateDraft API (chỉ gửi field thay đổi)
   * - isEditMode = false: gọi createStory API (gửi toàn bộ data)
   *
   * FLOW CHUNG:
   * 1. Validation tất cả các field
   * 2. Xử lý coverFile đặc biệt cho edit mode
   * 3. Gọi API tương ứng
   * 4. Xử lý response/thành công
   */
  const handleSubmit = async () => {
    // ===== VALIDATION =====

    // 1. Required fields
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên truyện");
      return;
    }
    if (!outline.trim()) {
      toast.error("Vui lòng nhập dàn ý cốt truyện");
      return;
    }
    // 2. Length validation với LIMITS
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
    // 3. Description (optional nhưng nếu nhập thì phải đúng độ dài)
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
    // 4. Tags validation
    if (selectedTagIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 thể loại");
      return;
    }

    /**
     * 5. Cover validation - QUAN TRỌNG: Xử lý khác nhau cho edit mode
     * - Edit mode: không bắt buộc phải có coverFile mới (có thể giữ ảnh cũ)
     * - Create mode: bắt buộc phải có coverFile hoặc generatedAICover
     */
    if (
      coverMode === "upload" &&
      !coverFile &&
      !generatedAICover &&
      !isEditMode // Chỉ validate cho create mode
    ) {
      toast.error("Vui lòng chọn ảnh bìa");
      return;
    }
    // 6. AI prompt validation
    if (coverMode === "generate" && !coverPrompt.trim()) {
      toast.error("Vui lòng nhập mô tả ảnh AI");
      return;
    }

    setIsSubmitting(true);

    setIsSubmitting(true);

    try {
      /**
       * XỬ LÝ COVER FILE CHO EDIT MODE - TRÁNH LỖI 400
       * LOGIC:
       * - Nếu là edit mode và không có file mới → undefined (giữ ảnh cũ)
       * - Nếu có file mới → dùng file đó
       */
      const finalCoverFile =
        isEditMode && !coverFile ? undefined : coverFile || undefined;
      // ===== EDIT MODE =====
      if (isEditMode && storyId) {
        const initial = initialDataRef.current;

        /**
         * OPTIMISTIC UPDATE: CHỈ GỬI NHỮNG FIELD THAY ĐỔI
         * 1. Tạo object updateFields rỗng
         * 2. So sánh từng field với initial data
         * 3. Chỉ thêm vào updateFields nếu có thay đổi
         * 4. Nếu không có thay đổi nào → không gọi API
         */
        let updateFields: Partial<CreateStoryRequest> = {};

        // 1. Kiểm tra Ngôn ngữ (Dòng này giúp cập nhật mã ngôn ngữ thành công)
        if (languageCode !== initial?.languageCode) {
          updateFields.languageCode = languageCode;
        }

        // 2. Các trường văn bản (so sánh sau khi trim)
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

        // 3. Thể loại - so sánh theo string đã sort để tránh false positive
        const initialTags = [...(initial?.selectedTagIds || [])]
          .sort()
          .join(",");
        const currentTags = [...selectedTagIds].sort().join(",");
        if (initialTags !== currentTags) {
          updateFields.tagIds = selectedTagIds;
        }

        // 4. Kiểm tra Ảnh bìa mới (Sử dụng finalCoverFile  yêu cầu)- chỉ khi user chọn file mới
        if (coverFile instanceof File) {
          updateFields.coverMode = "upload";
          updateFields.coverFile = finalCoverFile;
        }

        /**
         * 5. CHỈ GỌI API NẾU CÓ THAY ĐỔI
         * Kiểm tra số lượng key trong updateFields
         */
        if (Object.keys(updateFields).length > 0) {
          await storyService.updateDraft(storyId, updateFields);

          // Cập nhật lại Ref để đồng bộ cho lần bấm tiếp theo
          if (initialDataRef.current) {
            initialDataRef.current = {
              ...initialDataRef.current,
              ...updateFields,
            };
          }

          toast.success("Cập nhật truyện thành công!");
          onSuccess?.(); // Gọi callback nếu có (ví dụ: close modal)
        } else {
          toast.info("Không có thay đổi nào để cập nhật");
        }
      } else {
        // ===== CREATE MODE =====
        // Gửi toàn bộ data tạo mới
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
        // Redirect đến trang chi tiết truyện vừa tạo
        router.push(`/author/story/${newStory.storyId}`);
      }
    } catch (error: any) {
      console.error("Submit error:", error);

      /**
       * XỬ LÝ LỖI TỪ BACKEND - STRUCTURED ERROR
       * Backend trả về format: { error: { message, details } }
       * - details: object với key là field name, value là array error messages
       * - message: error message chung
       */
      if (error.response?.data?.error) {
        const { message, details } = error.response.data.error;
        // Ưu tiên hiển thị validation errors (details)
        if (details) {
          Object.keys(details).forEach((key) => {
            details[key].forEach((msg: string) => toast.error(msg));
          });
          return;
        }
        // Hiển thị message chung
        if (message) {
          toast.error(message);
          return;
        }
      }
      // Fallback error handling
      toast.error(
        error.response?.data?.message || error.message || "Có lỗi xảy ra"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  /**
   * XỬ LÝ KHI USER CHẤP NHẬN ẢNH AI
   * LOGIC:
   * 1. Đóng dialog preview
   * 2. Đánh dấu đã dùng AI (setHasUsedAICover = true)
   * 3. Thông báo thành công
   * 4. Redirect đến trang tiếp theo (nếu có createdStoryId)
   */
  const handleAcceptAICover = () => {
    setShowAIPreview(false);
    setHasUsedAICover(true); // QUAN TRỌNG: đánh dấu đã dùng AI

    toast.success("Đã dùng ảnh bìa AI");
    if (createdStoryId) {
      router.push(`/author/story/${createdStoryId}`);
    }
  };
  /**
   * XỬ LÝ KHI USER TỪ CHỐI ẢNH AI
   * LOGIC QUAN TRỌNG:
   * 1. Đóng dialog preview
   * 2. Reset generatedAICover về null
   * 3. Chuyển sang upload mode
   * 4. ĐÁNH DẤU ĐÃ DÙNG AI (quan trọng: không được dùng lại)
   * 5. Thông báo user upload ảnh mới
   */
  const handleRejectAICover = () => {
    setShowAIPreview(false);
    setGeneratedAICover(null);
    setCoverMode("upload");
    setHasUsedAICover(true); // Quan trọng: đánh dấu đã dùng AI
    // Có thể lưu draft state nếu cần
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

    toast.info("Đã từ chối ảnh AI → Vui lòng upload ảnh mới");
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
          {/* === Thể loại ===  với Dialog cho chọn nhiều tag*/}
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
