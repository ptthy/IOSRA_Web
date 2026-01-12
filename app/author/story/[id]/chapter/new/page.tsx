// app/author/story/[id]/chapter/new/page.tsx

/*
MỤC ĐÍCH: Trang tạo chương truyện mới với đầy đủ tính năng soạn thảo
CHỨC NĂNG CHÍNH:
1. Tạo chương mới với tiêu đề, nội dung và loại truy cập (miễn phí/trả phí)
2. Hỗ trợ nhập nội dung từ file Word (.docx) thông qua trình chuyển đổi mammoth
3. Tự động lưu bản nháp vào Local Storage để tránh mất dữ liệu khi user rời đi
4. Validation chi tiết: 
   - Tiêu đề: tối thiểu 10, tối đa 50 ký tự
   - Nội dung: bắt buộc, tối đa 10,000 ký tự
5. Sử dụng Tiptap Editor cho trải nghiệm soạn thảo phong phú (WYSIWYG)
6. Hiển thị cảnh báo khi có thay đổi chưa lưu và thông tin trạng thái bản nháp
7. Gọi API tạo chương và điều hướng về danh sách chương sau khi thành công
8. Có nút hủy với confirm khi có thay đổi chưa lưu
ĐỐI TƯỢNG SỬ DỤNG: Tác giả (Author) muốn thêm chương mới vào truyện hiện có
FLOW XỬ LÝ CHÍNH:
1. Lấy storyId từ URL params
2. Setup form với validation và auto-save draft
3. Xử lý import file Word (.docx) -> HTML
4. Submit form với validation chi tiết
5. Gọi API createChapter và xử lý response
6. Điều hướng về danh sách chương sau khi thành công
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
  Upload,
} from "lucide-react";
import { chapterService } from "@/services/chapterService";
import { toast } from "sonner";
import TiptapEditor from "@/components/editor/TiptapEditor";
/**
 * KEY CHO LOCAL STORAGE ĐỂ LƯU DRAFT TẠO CHƯƠNG MỚI:
 * Version v1 để có thể thay đổi cấu trúc trong tương lai mà không ảnh hưởng draft cũ
 */
const LOCAL_STORAGE_KEY = "create-chapter-draft-v1";

/**
 * Component CreateChapterPage: Trang tạo chương mới
 * Đặc điểm:
 * - Hỗ trợ nhập từ file Word (.docx)
 * - Tự động lưu draft vào Local Storage
 * - Validation chi tiết
 * - Sử dụng Tiptap Editor
 */
export default function CreateChapterPage() {
  // Xử lý import file Word
  /**
   * Hàm xử lý import file Word (.docx)
   * Sử dụng thư viện mammoth để chuyển docx → html
   */
  /**
   * HÀM XỬ LÝ IMPORT FILE WORD (.DOCX):
   * Sử dụng thư viện mammoth để chuyển docx → html
   *
   * FLOW XỬ LÝ:
   * 1. Lấy file từ input (chỉ chấp nhận .docx)
   * 2. Dynamic import mammoth (chỉ load khi cần để optimize bundle)
   * 3. Đọc file dưới dạng ArrayBuffer
   * 4. Chuyển đổi docx sang HTML bằng mammoth
   * 5. Cập nhật state với nội dung đã import
   *
   * LƯU Ý: Mammoth chỉ hỗ trợ .docx, không hỗ trợ .doc cũ
   */
  const handleImportWord = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Chỉ hỗ trợ file .docx
    if (!file.name.endsWith(".docx")) {
      toast.error("Chỉ hỗ trợ file .docx");
      return;
    }
    try {
      // Dynamic import thư viện mammoth (chỉ load khi cần để giảm bundle size)
      // Dynamic import thư viện mammoth (chỉ load khi cần)
      const mammoth = (await import("mammoth/mammoth.browser")).default;
      // Đọc file dưới dạng ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      // Chuyển đổi docx sang HTML bằng mammoth
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      // Cập nhật state với nội dung đã import
      setFormData((prev) => ({ ...prev, content: html }));
      setCharacterCounts((prev) => ({ ...prev, content: html.length }));
      setHasUnsavedChanges(true); // Đánh dấu có thay đổi chưa lưu
      toast.success("Đã nhập nội dung từ file Word!");
    } catch (err) {
      toast.error("Lỗi khi nhập file Word");
      console.error(err);
    }
  };
  /**
   * HOOKS VÀ STATE:
   * - useParams: Lấy storyId từ URL dynamic route [id]
   * - useRouter: Để điều hướng về danh sách chương
   * - isSubmitting: State khi đang submit form (disable button)
   * - hasUnsavedChanges: State theo dõi có thay đổi chưa lưu (cho confirm khi rời trang)
   */
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  /**
   * State của Form với giới hạn ký tự
   * Chú ý: languageCode bị comment trong API call
   */
  /**
   * STATE FORM DỮ LIỆU VỚI GIỚI HẠN KÝ TỰ:
   * - title: Tiêu đề chương (required, min 10, max 50)
   * - content: Nội dung chương HTML từ Tiptap (required)
   * - languageCode: Mã ngôn ngữ (cố định "vi-VN", bị comment trong API call)
   * - accessType: Loại truy cập ("free" hoặc "dias") - miễn phí hoặc trả phí
   */
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    languageCode: "vi-VN" as "vi-VN" | "en-US" | "zh-CN" | "ja-JP",
    accessType: "free" as "free" | "dias",
  });
  /**
   * STATE THEO DÕI SỐ KÝ TỰ ĐÃ NHẬP:
   * - title: Số ký tự tiêu đề (để hiển thị counter)
   * - content: Số ký tự nội dung (để hiển thị counter và validation)
   */
  const [characterCounts, setCharacterCounts] = useState({
    title: 0,
    content: 0,
  });

  /**
   * HELPER XỬ LÝ LỖI API THỐNG NHẤT (giống các file khác):
   * Xử lý error response từ backend với ưu tiên: details -> message -> fallback
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
  /**
   * CÁC GIỚI HẠN (LIMITS) CHO VALIDATION:
   * - TITLE_MIN: Tối thiểu 10 ký tự (để đảm bảo tiêu đề có ý nghĩa)
   * - TITLE_MAX: Tối đa 50 ký tự (giới hạn UI và database)
   * - CONTENT: Tối đa 10,000 ký tự (giới hạn performance và storage)
   */
  const LIMITS = {
    TITLE_MIN: 10, // Thêm giới hạn tối thiểu
    TITLE_MAX: 50,
    CONTENT: 10000,
  };

  /**
   * Hàm xử lý thay đổi nội dung từ Tiptap Editor
   * Cập nhật cả content và character count
   */
  /**
   * HÀM XỬ LÝ THAY ĐỔI NỘI DUNG TỪ TIPTAP EDITOR:
   * @param html - Chuỗi HTML từ Tiptap Editor
   *
   * Được truyền vào TiptapEditor component như callback
   * Cập nhật cả content và character count
   */
  const handleEditorChange = (html: string) => {
    setFormData((prev) => ({ ...prev, content: html }));
    setCharacterCounts((prev) => ({ ...prev, content: html.length }));
    setHasUnsavedChanges(true);
  };

  /**
   * useEffect: TỰ ĐỘNG LƯU STATE VÀO LOCAL STORAGE KHI CÓ THAY ĐỔI:
   *
   * LOGIC AUTO-SAVE:
   * 1. Chỉ lưu khi có dữ liệu thực sự (title hoặc content không rỗng)
   * 2. Chỉ lưu khi có thay đổi chưa lưu (hasUnsavedChanges = true)
   * 3. Dùng try-catch để tránh lỗi localStorage (quota exceeded, disabled, etc.)
   * 4. Dependency array [formData, hasUnsavedChanges] -> chạy lại khi 2 state này thay đổi
   *
   * MỤC ĐÍCH: Tránh mất dữ liệu khi user accidentally refresh hoặc rời trang
   */
  useEffect(() => {
    const hasActualData = formData.title?.trim() || formData.content?.trim();
    if (hasActualData && hasUnsavedChanges) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
      } catch (e) {
        console.error("Failed to save draft to local storage", e);
        // Không toast error vì có thể làm phiền user
      }
    }
  }, [formData, hasUnsavedChanges]);

  /**
   * HÀM QUAY LẠI DANH SÁCH CHƯƠNG:
   * Hiển thị confirm nếu có thay đổi chưa lưu để tránh mất dữ liệu
   */
  const handleBackToChapters = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?"
      );
      if (!confirmLeave) return;
    }
    router.push(`/author/story/${storyId}/chapters`);
  };

  /**
   * HÀM XỬ LÝ THAY ĐỔI INPUT/TEXTAREA (CHO TITLE):
   * @param e - React.ChangeEvent từ input/textarea
   *
   * Cập nhật cả formData và characterCounts
   * Đánh dấu hasUnsavedChanges = true
   */
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
    setHasUnsavedChanges(true);
  };

  /**
   * HÀM XỬ LÝ THAY ĐỔI SELECT (CHO ACCESS TYPE):
   * @param name - Tên field (accessType)
   * @param value - Giá trị mới ("free" hoặc "dias")
   */
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasUnsavedChanges(true);
  };

  /**
   * HÀM LƯU DRAFT VÀO LOCAL STORAGE (MANUAL SAVE):
   * Cho phép user chủ động lưu tạm để tiếp tục sau
   * Khác với auto-save: user có feedback (toast) khi lưu thành công
   */
  const handleSaveDraft = () => {
    const hasActualData = formData.title?.trim() || formData.content?.trim();

    if (!hasActualData) {
      toast.info("Không có nội dung để lưu nháp");
      return;
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
      setHasUnsavedChanges(false); // Reset unsaved changes flag
      toast.success("Đã lưu nháp thành công!");
    } catch (e) {
      console.error("Failed to save draft to local storage", e);
      toast.error("Lỗi khi lưu nháp");
    }
  };

  /**
   * HÀM SUBMIT FORM TẠO CHƯƠNG MỚI:
   * @param e - React.FormEvent từ form submit
   *
   * FLOW XỬ LÝ CHI TIẾT:
   * 1. Ngăn chặn form submit default behavior (reload page)
   * 2. Validation chi tiết:
   *    - Tiêu đề: required, min 10, max 50 ký tự
   *    - Nội dung: required, max 10,000 ký tự
   * 3. Gọi API createChapter với storyId và formData
   * 4. Nếu thành công:
   *    - Xóa draft khỏi localStorage
   *    - Reset unsaved changes flag
   *    - Hiển thị toast success
   *    - Điều hướng về danh sách chương
   * 5. Xử lý lỗi với helper handleApiError
   * 6. Luôn tắt isSubmitting state ở finally
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDATION CHI TIẾT:

    // Tiêu đề không được rỗng
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề chương");
      return;
    }

    // Tiêu đề tối thiểu 10 ký tự
    if (formData.title.trim().length < LIMITS.TITLE_MIN) {
      toast.error(`Tiêu đề chương phải có ít nhất ${LIMITS.TITLE_MIN} ký tự`);
      return;
    }
    // Tiêu đề tối đa 50 ký tự
    if (formData.title.length > LIMITS.TITLE_MAX) {
      toast.error(`Tiêu đề không được vượt quá ${LIMITS.TITLE_MAX} ký tự`);
      return;
    }
    // Nội dung không được rỗng
    if (!formData.content.trim()) {
      toast.error("Vui lòng nhập nội dung chương");
      return;
    }
    // Nội dung tối đa 10,000 ký tự
    if (formData.content.length > LIMITS.CONTENT) {
      toast.error(`Nội dung không được vượt quá ${LIMITS.CONTENT} ký tự`);
      return;
    }
    // Bắt đầu submit
    setIsSubmitting(true);
    try {
      // Gọi API tạo chương mới
      await chapterService.createChapter(storyId, {
        title: formData.title,
        content: formData.content,
        //languageCode: formData.languageCode,
        accessType: formData.accessType,
      });

      // Xóa draft sau khi tạo thành công
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setHasUnsavedChanges(false);
      // Thông báo thành công và điều hướng
      toast.success("Tạo chương mới thành công!");
      router.push(`/author/story/${storyId}/chapters`);
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Có lỗi xảy ra khi tạo chương");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Kiểm tra form hợp lệ để enable/disable submit button
   *  * Form hợp lệ khi:
   * 1. Tiêu đề >= 10 ký tự
   * 2. Tiêu đề <= 50 ký tự
   * 3. Nội dung không rỗng
   * 4. Nội dung <= 10,000 ký tự
   */
  const isFormValid =
    formData.title.trim().length >= LIMITS.TITLE_MIN && //
    formData.content.trim() &&
    formData.title.length <= LIMITS.TITLE_MAX && //
    formData.content.length <= LIMITS.CONTENT;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header với nút quay lại và tiêu đề trang */}
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
      {/* Form chính */}
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
                  {/* 
                   Hiển thị thông báo ký tự:
                    - Nếu chưa đủ tối thiểu: hiển thị yêu cầu "Tối thiểu X"
                    - Nếu đã đủ: hiển thị số ký tự "X/50"
                    - Màu sắc thay đổi theo trạng thái (đỏ/xanh lá/xám)
                  */}
                  <span
                    className={`text-xs ${
                      characterCounts.title > 0 &&
                      (characterCounts.title < LIMITS.TITLE_MIN ||
                        characterCounts.title > LIMITS.TITLE_MAX)
                        ? "text-red-500"
                        : characterCounts.title >= LIMITS.TITLE_MIN
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {characterCounts.title < LIMITS.TITLE_MIN
                      ? `Tối thiểu ${LIMITS.TITLE_MIN}`
                      : `${characterCounts.title}/${LIMITS.TITLE_MAX}`}
                  </span>
                </div>
                {/* Input tiêu đề */}
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Chương 1: Cuộc hành trình bắt đầu (tối thiểu 10 ký tự)"
                  required
                  disabled={isSubmitting}
                  // Đổi màu border theo trạng thái:
                  // - Đỏ: vượt giới hạn hoặc quá ngắn
                  // - Xanh lá: đạt yêu cầu
                  // - Mặc định: chưa nhập
                  className={`border-2 transition-all ${
                    characterCounts.title > 0 &&
                    (characterCounts.title < LIMITS.TITLE_MIN ||
                      characterCounts.title > LIMITS.TITLE_MAX)
                      ? "border-red-500 focus-visible:border-red-500"
                      : characterCounts.title >= LIMITS.TITLE_MIN
                      ? "border-emerald-500 focus-visible:border-emerald-500"
                      : "border-primary/30 focus-visible:border-primary"
                  }`}
                  maxLength={LIMITS.TITLE_MAX}
                />
                {/* Thông báo lỗi khi chưa đủ độ dài (chỉ hiện khi đã nhập) */}
                {characterCounts.title > 0 &&
                  characterCounts.title < LIMITS.TITLE_MIN && (
                    <p className="text-xs text-red-500">
                      Tiêu đề phải có ít nhất {LIMITS.TITLE_MIN} ký tự.
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
          {/* Card loại truy cập */}
          <Card>
            <CardHeader>
              <CardTitle>Loại truy cập</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.accessType}
                onValueChange={(value: "free" | "dias") =>
                  setFormData((prev) => ({ ...prev, accessType: value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="dark:border-[#f0ead6]">
                  <SelectValue placeholder="Chọn loại truy cập" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Miễn phí</SelectItem>
                  <SelectItem value="dias">Trả phí</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Card nội dung chương với Tiptap Editor */}
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
                {/* Label và nút import file Word */}
                <div className="flex items-center gap-2 justify-between">
                  <Label>Nội dung chương</Label>

                  {/* Nút import file Word - styled như link */}
                  {/* 
                    Nút import file Word - styled như link
                    Thực tế là label cho hidden file input
                  */}
                  <label className="inline-flex items-center gap-1 cursor-pointer text-sm font-medium text-blue-700 hover:underline">
                    <Upload className="h-4 w-4" />
                    Nhập từ file Word
                    {/* Hidden file input chỉ accept .docx */}
                    <input
                      type="file"
                      accept=".docx"
                      onChange={handleImportWord}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
                {/* 
                  TIPTAP EDITOR cho nhập nội dung phong phú:
                  - content: Nội dung hiện tại (HTML)
                  - onChange: Callback khi nội dung thay đổi
                  - placeholder: Placeholder text
                  - maxLength: Giới hạn ký tự (10,000)
                  - disabled: Disable khi đang submitting
                */}
                <TiptapEditor
                  content={formData.content}
                  onChange={handleEditorChange}
                  placeholder="Nhập nội dung chương tại đây..."
                  maxLength={LIMITS.CONTENT}
                  disabled={isSubmitting}
                />
                {/* Hiển thị cảnh báo khi vượt giới hạn nội dung */}
                {characterCounts.content > LIMITS.CONTENT && (
                  <p className="text-xs text-red-500">
                    Nội dung không được vượt quá {LIMITS.CONTENT} ký tự
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card actions (buttons và alerts) */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3 flex-wrap">
                {/* Nút submit tạo chương - disabled khi không valid hoặc đang submitting */}
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
                {/* Nút hủy - điều hướng về danh sách chương */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToChapters}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              </div>
              {/* 
                Alert cảnh báo có thay đổi chưa lưu:
                - Chỉ hiện khi hasUnsavedChanges = true
                - Màu amber (cảnh báo)
              */}
              {hasUnsavedChanges && (
                <Alert className="mt-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm">
                    Bạn có thay đổi chưa lưu. Nhấn{" "}
                    <strong>&quot;Lưu chương&quot;</strong> để lưu lại.
                  </AlertDescription>
                </Alert>
              )}
              {/* 
                Alert thông tin về trạng thái bản nháp:
                - Luôn hiện để thông báo cho user về workflow
                - Màu xanh dương (thông tin)
                - Giải thích: chương mới tạo sẽ ở trạng thái "bản nháp"
              */}
              <Alert className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  Sau khi tạo, chương sẽ ở trạng thái <strong>bản nháp.</strong>
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
