// app/author/story/[id]/chapter/[chapterId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowLeft,
  Edit,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Star,
  MessageSquare,
  Download,
  Save,
  X,
  Pencil,
  XCircle,
  Globe,
} from "lucide-react";
import { chapterService } from "@/services/chapterService";
import type { ChapterDetails } from "@/services/apiTypes";
import { toast } from "sonner";
import TiptapEditor from "@/components/editor/TiptapEditor";
import VoiceChapterPlayer from "@/components/author/VoiceChapterPlayer";
// Hàm trích xuất phần tiếng Việt từ AI Feedback
const extractVietnameseFeedback = (feedback: string | null): string | null => {
  if (!feedback) return null;

  // Tìm phần tiếng Việt sau "Tiếng Việt:"
  const vietnameseIndex = feedback.indexOf("Tiếng Việt:");
  if (vietnameseIndex !== -1) {
    return feedback.substring(vietnameseIndex + "Tiếng Việt:".length).trim();
  }

  // Nếu không tìm thấy marker tiếng Việt, trả về toàn bộ feedback
  return feedback;
};

// Custom components để style markdown
const markdownComponents = {
  // Style cho các thẻ HTML cơ bản
  h1: ({ node, ...props }: any) => (
    <h1
      className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-white"
      {...props}
    />
  ),
  h2: ({ node, ...props }: any) => (
    <h2
      className="text-xl font-bold mt-5 mb-3 text-gray-800 dark:text-gray-100"
      {...props}
    />
  ),
  h3: ({ node, ...props }: any) => (
    <h3
      className="text-lg font-bold mt-4 mb-2 text-gray-700 dark:text-gray-200"
      {...props}
    />
  ),
  p: ({ node, ...props }: any) => (
    <p
      className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300"
      {...props}
    />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-bold text-gray-900 dark:text-white" {...props} />
  ),
  em: ({ node, ...props }: any) => (
    <em className="italic text-gray-800 dark:text-gray-200" {...props} />
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 italic"
      {...props}
    />
  ),
  ul: ({ node, ...props }: any) => (
    <ul
      className="list-disc list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300"
      {...props}
    />
  ),
  ol: ({ node, ...props }: any) => (
    <ol
      className="list-decimal list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300"
      {...props}
    />
  ),
  li: ({ node, ...props }: any) => <li className="mb-1 ml-2" {...props} />,
  a: ({ node, ...props }: any) => (
    <a
      className="text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  del: ({ node, ...props }: any) => (
    <del className="line-through text-gray-500" {...props} />
  ),
  hr: ({ node, ...props }: any) => (
    <hr className="my-6 border-gray-300 dark:border-gray-600" {...props} />
  ),
};

// Hàm phát hiện xem nội dung có phải là Markdown không
const isMarkdownContent = (content: string): boolean => {
  if (!content) return false;

  // Các pattern phổ biến của Markdown
  const markdownPatterns = [
    /\*\*.+?\*\*/, // **bold**
    /\*.+?\*/, // *italic*
    /~~.+?~~/, // ~~strikethrough~~
    /^#+\s+.+/m, // headers
    /^-\s+.+/m, // unordered lists
    /^\d+\.\s+.+/m, // ordered lists
    /^>\s+.+/m, // blockquotes
    /\[.+\]\(.+\)/, // links
  ];

  return markdownPatterns.some((pattern) => pattern.test(content));
};

// Hàm phát hiện xem nội dung có phải là HTML từ Rich Text Editor không
const isHTMLContent = (content: string): boolean => {
  if (!content) return false;

  // Kiểm tra các thẻ HTML cơ bản từ Rich Text Editor - MỞ RỘNG ĐIỀU KIỆN
  const htmlPatterns = [
    /<div[^>]*>/i,
    /<p[^>]*>/i,
    /<br[^>]*>/i,
    /<strong[^>]*>/i,
    /<b[^>]*>/i,
    /<em[^>]*>/i,
    /<i[^>]*>/i,
    /<u[^>]*>/i,
    /<s[^>]*>/i,
    /<strike[^>]*>/i,
    /<h[1-6][^>]*>/i,
    /<blockquote[^>]*>/i,
    /<ul[^>]*>/i,
    /<ol[^>]*>/i,
    /<li[^>]*>/i,
    /<a[^>]*>/i,
    /<span[^>]*>/i,
    /<font[^>]*>/i,
    /<code[^>]*>/i,
    /<pre[^>]*>/i,
  ];

  const hasHTMLTag = htmlPatterns.some((pattern) => pattern.test(content));

  // Thêm điều kiện: nếu có thẻ đóng </...> cũng coi là HTML
  const hasClosingTag = /<\/[a-z][a-z0-9]*>/i.test(content);

  return hasHTMLTag || hasClosingTag;
};

// Hàm hiển thị nội dung HTML từ Rich Text Editor
const renderHTMLContent = (content: string) => {
  return (
    <div
      className="rich-text-content prose prose-lg max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
      dangerouslySetInnerHTML={{
        __html: content,
      }}
      style={{
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
      }}
    />
  );
};

// Hàm hiển thị nội dung với định dạng phù hợp
const renderContent = (content: string) => {
  // Kiểm tra nếu là HTML từ Rich Text Editor
  if (isHTMLContent(content)) {
    // Nếu là HTML từ Rich Text Editor, hiển thị trực tiếp
    return renderHTMLContent(content);
  } else if (isMarkdownContent(content)) {
    // Nếu là Markdown, sử dụng ReactMarkdown
    return (
      <div className="max-w-none">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    );
  } else {
    // Nếu là plain text, hiển thị với định dạng paragraph
    const paragraphs = content.split("\n\n").filter((p) => p.trim().length > 0);

    return (
      <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph.split("\n").map((line, lineIndex, lines) => (
              <span key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
      </div>
    );
  }
};

export default function AuthorChapterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const chapterId = params.chapterId as string;
  const [showModeratorAlert, setShowModeratorAlert] = useState(false);
  const [chapter, setChapter] = useState<ChapterDetails | null>(null);
  const [chapterContent, setChapterContent] = useState<string>("");
  const [isContentReady, setIsContentReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  // State mới cho chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    content: "",
    languageCode: "vi-VN" as "vi-VN" | "en-US" | "zh-CN" | "ja-JP",
    accessType: "free" as "free" | "dias",
  });

  // State theo dõi thay đổi chưa lưu
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Hàm xử lý thay đổi từ Tiptap Editor
  const handleEditorChange = (html: string) => {
    setEditFormData((prev) => ({ ...prev, content: html }));
    setHasUnsavedChanges(true);
  };

  // Hàm reload không hiển thị loading - ĐÃ ĐƯỢC TỐI ƯU
  const reloadChapter = async () => {
    try {
      const chapterData = await chapterService.getChapterDetails(
        storyId,
        chapterId
      );
      setChapter(chapterData);

      // Cập nhật form data
      setEditFormData({
        title: chapterData.title,
        content: chapterData.content || "",
        languageCode: chapterData.languageCode as
          | "vi-VN"
          | "en-US"
          | "zh-CN"
          | "ja-JP",
        accessType: (chapterData.accessType as "free" | "dias") || "free",
      });

      // Cập nhật content
      if (chapterData.content) {
        setChapterContent(chapterData.content);
      } else if (chapterData.contentPath) {
        await loadChapterContent(chapterData.contentPath);
      } else {
        setChapterContent("");
      }

      if (chapterData.moderatorNote) {
        setShowModeratorAlert(true);
      }
    } catch (error: any) {
      console.error("Error reloading chapter:", error);
      toast.error(error.message || "Không thể tải thông tin chương");
    }
  };

  useEffect(() => {
    loadChapter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, chapterId]);

  const loadChapter = async () => {
    setIsLoading(true);
    setIsContentReady(false);
    try {
      const chapterData = await chapterService.getChapterDetails(
        storyId,
        chapterId
      );
      setChapter(chapterData);

      // Khởi tạo form edit (dùng title, language... trước)
      setEditFormData({
        title: chapterData.title,
        content: "", // để trống trước, lát sẽ load từ file
        languageCode: chapterData.languageCode as any,
        accessType: (chapterData.accessType as "free" | "dias") || "free",
      });

      if (chapterData.moderatorNote) {
        setShowModeratorAlert(true);
      }

      // ƯU TIÊN CAO NHẤT: DÙ CÓ content TRONG DB HAY KHÔNG → VẪN LẤY TỪ contentPath NẾU CÓ
      if (chapterData.contentPath) {
        await loadChapterContent(chapterData.contentPath);
        setIsContentReady(true);
      }
      // Chỉ fallback về content trong DB nếu KHÔNG có contentPath
      else if (chapterData.content) {
        setChapterContent(chapterData.content);
        setIsContentReady(true);
      }
      // Không có gì cả
      else {
        setChapterContent("");
        setIsContentReady(true);
      }
    } catch (error: any) {
      console.error("Error loading chapter:", error);
      toast.error(error.message || "Không thể tải thông tin chương");
    } finally {
      setIsLoading(false);
    }
  };
  const loadChapterContent = async (contentPath: string) => {
    setIsLoadingContent(true);
    try {
      const response = await fetch(
        `/api/chapter-content?path=${encodeURIComponent(contentPath)}`
      );

      if (!response.ok) {
        throw new Error(`Lỗi tải file: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const fileContent = data.content || "";

      setChapterContent(fileContent);

      // <<< QUAN TRỌNG: Nếu đang edit → cập nhật luôn vào editor >>>
      if (isEditing) {
        setEditFormData((prev) => ({ ...prev, content: fileContent }));
      }
    } catch (error: any) {
      console.error("Load content từ file thất bại:", error);

      // Fallback về content trong DB (nếu có)
      if (chapter?.content) {
        setChapterContent(chapter.content);
        if (isEditing) {
          setEditFormData((prev) => ({ ...prev, content: chapter.content }));
        }
        toast.warning("Không tải được file → dùng nội dung từ database");
      } else {
        setChapterContent("");
        toast.error("Không thể tải nội dung chương");
      }
    } finally {
      setIsLoadingContent(false);
      setIsContentReady(true);
    }
  };

  const handleDownloadContent = () => {
    if (!chapterContent || !chapter) return;

    const blob = new Blob([chapterContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chapter.title}.txt` || `chapter-${chapter.chapterNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // HÀM SUBMIT ĐÃ ĐƯỢC SỬA - TỰ ĐỘNG RELOAD KHI CÓ LỖI
  const handleSubmitForReview = async () => {
    if (!chapter) return;

    setIsSubmitting(true);
    try {
      await chapterService.submitChapterForReview(chapterId);
      toast.success("Đã gửi chương cho AI đánh giá thành công!");

      // RELOAD LẠI CHAPTER SAU KHI SUBMIT THÀNH CÔNG
      await reloadChapter();
    } catch (error: any) {
      console.error("Error submitting chapter:", error);

      // QUAN TRỌNG: RELOAD LẠI CHAPTER KHI CÓ LỖI
      await reloadChapter();

      // Hiển thị thông báo lỗi cụ thể
      if (error.response?.data?.error?.code === "InvalidChapterState") {
        toast.error(
          "Chương không ở trạng thái có thể gửi. Chỉ chương ở trạng thái bản nháp mới được gửi."
        );
      } else {
        toast.error(error.message || "Có lỗi xảy ra khi gửi chương");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditChapter = () => {
    const currentContent = chapterContent || chapter?.content || "";

    setEditFormData({
      title: chapter?.title || "",
      content: currentContent, // ← luôn luôn dùng nội dung đã load
      languageCode: chapter?.languageCode as any,
      accessType: (chapter?.accessType as "free" | "dias") || "free",
    });

    setIsEditing(true);
    setHasUnsavedChanges(false);
  };
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn hủy?"
      );
      if (!confirmLeave) return;
    }
    setIsEditing(false);
    // Khôi phục dữ liệu gốc từ chapter hiện tại
    if (chapter) {
      setEditFormData({
        title: chapter.title,
        content: chapter.content || "",
        languageCode: chapter.languageCode as
          | "vi-VN"
          | "en-US"
          | "zh-CN"
          | "ja-JP",
        accessType: (chapter.accessType as "free" | "dias") || "free",
      });
    }
    setHasUnsavedChanges(false);
  };

  // HÀM WITHDRAW ĐÃ ĐƯỢC SỬA - TỰ ĐỘNG RELOAD
  const handleWithdraw = async () => {
    if (chapter?.status !== "rejected") {
      toast.error("Chỉ có thể rút chương khi bị từ chối");
      return;
    }

    if (
      !confirm("Bạn có chắc muốn rút chương này về bản nháp để sửa lại không?")
    ) {
      return;
    }

    setIsWithdrawing(true);
    try {
      await chapterService.withdrawChapter(chapterId);

      // RELOAD LẠI TOÀN BỘ DỮ LIỆU CHAPTER
      await reloadChapter();

      toast.success("Đã rút chương về bản nháp thành công!");
      setIsEditing(true); // tự động vào chế độ chỉnh sửa
      setShowModeratorAlert(false);
    } catch (err: any) {
      console.error("Error withdrawing chapter:", err);

      // RELOAD LẠI KHI CÓ LỖI
      await reloadChapter();

      if (err.response?.data?.error?.code === "WithdrawNotAllowed") {
        toast.error("Chỉ có thể rút chương khi bị từ chối");
      } else {
        toast.error(err.message || "Không thể rút chương");
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  // HÀM LƯU ĐÃ ĐƯỢC TỐI ƯU
  const handleSaveEdit = async () => {
    if (!chapter) return;

    // Validation
    if (!editFormData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề chương");
      return;
    }

    if (!editFormData.content.trim() || editFormData.content === "<p></p>") {
      toast.error("Vui lòng nhập nội dung chương");
      return;
    }

    setIsSaving(true);
    try {
      const updatedChapter = await chapterService.updateChapter(
        storyId,
        chapterId,
        {
          title: editFormData.title,
          content: editFormData.content,
          languageCode: editFormData.languageCode,
          accessType: editFormData.accessType,
        }
      );

      // CẬP NHẬT STATE NGAY LẬP TỨC
      setChapter(updatedChapter);
      setChapterContent(editFormData.content);

      toast.success("Cập nhật chương thành công!");
      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error("Error updating chapter:", error);
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật chương");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleBackToChapters = () => {
    router.push(`/author/story/${storyId}/chapters`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Không tìm thấy chương</p>
        <Button onClick={handleBackToChapters}>
          Quay lại danh sách chương
        </Button>
      </div>
    );
  }

  const canEdit = chapter?.status === "draft";
  const canSubmit = chapter?.status === "draft";
  const isPending = chapter?.status === "pending";
  const isPublished = chapter?.status === "published";
  const isRejected = chapter?.status === "rejected";

  // Trích xuất phần tiếng Việt từ AI Feedback
  const vietnameseFeedback = chapter
    ? extractVietnameseFeedback(chapter.aiFeedback ?? null)
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header - Thêm trạng thái chỉnh sửa */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBackToChapters}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Chỉnh sửa Chương" : "Chi tiết Chương"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Chỉnh sửa thông tin chương truyện"
              : "Quản lý và xem thông tin chi tiết chương truyện"}
          </p>
        </div>
        {isEditing && (
          <Badge className="ml-auto bg-orange-500 hover:bg-orange-600 text-white border-none flex items-center gap-x-2 px-3 py-1.5 text-sm font-medium transition-all">
            <Pencil className="h-4 w-4" />
            <span>Đang chỉnh sửa</span>
          </Badge>
        )}
      </div>
      {/* Thông báo Moderator Rejection - HIỂN THỊ KHI CÓ moderatorNote */}
      {chapter?.status === "completed" && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Chương đã được duyệt
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Chương này đã vượt qua kiểm duyệt và đang hiển thị công khai với
              độc giả.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bạn không cần thực hiện thêm hành động nào.
            </p>
          </CardContent>
        </Card>
      )}
      {/* Nút rút lại chương - HIỂN THỊ KHI BỊ REJECTED (cả AI và Moderator) */}
      {chapter?.status === "rejected" && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="h-5 w-5" />
              Chương bị từ chối
            </CardTitle>
            <CardDescription>
              Chương này đã bị từ chối. Bạn có thể rút về bản nháp để chỉnh sửa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="destructive"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="min-w-[160px]"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang rút...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Rút về bản nháp để sửa
                  </>
                )}
              </Button>
            </div>

            {chapter.moderatorNote && (
              <Alert className="mt-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <AlertDescription className="text-sm">
                  <strong>Góp ý từ Moderator:</strong> {chapter.moderatorNote}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      {/* Chapter Info - Chuyển thành form khi chỉnh sửa */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pt-0 pb-2">
          {/* Bỏ relative ở đây đi */}
          <div className="flex items-start justify-between">
            <div className="w-full pr-24">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề chương *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={editFormData.title}
                    onChange={handleInputChange}
                    placeholder="Nhập tiêu đề chương"
                    required
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  {" "}
                  {/* Thêm space-y-1 để khoảng cách giữa 2 dòng khít hơn */}
                  {/* Dòng Tên truyện */}
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="text-base font-normal text-slate-400">
                      Tên truyện:
                    </span>
                    <span>{chapter.title}</span>
                  </CardTitle>
                  {/* Dòng Số chương */}
                  <CardDescription className="flex items-center gap-2 text-base">
                    <span className="text-slate-400">Số chương:</span>
                    <span className="text-l flex items-center gap-2">
                      {chapter.chapterNo}
                    </span>
                  </CardDescription>
                </div>
              )}
            </div>

            {/* === PHẦN RUY BĂNG (RIBBON) === */}
            {!isEditing &&
              (() => {
                let statusConfig = {
                  label: "Bản nháp",
                  bgColor: "bg-slate-500",
                  shadowColor: "text-slate-700",
                  Icon: FileText,
                };

                if (chapter.status === "published") {
                  statusConfig = {
                    label: "Đã xuất bản",
                    bgColor: "bg-green-600",
                    shadowColor: "text-blue-800",
                    Icon: Globe,
                  };
                } else if (chapter.status === "pending") {
                  statusConfig = {
                    label: "Chờ duyệt",
                    bgColor: "bg-yellow-500",
                    shadowColor: "text-yellow-700",
                    Icon: Clock,
                  };
                } else if (chapter.status === "rejected") {
                  statusConfig = {
                    label: "Bị từ chối",
                    bgColor: "bg-red-600",
                    shadowColor: "text-red-800",
                    Icon: XCircle,
                  };
                }

                return (
                  // Đã sửa: top-0 và right-8 (cách lề phải 32px)
                  <div className="absolute top-0 right-8 drop-shadow-md z-10">
                    {/* Phần thân ruy băng */}
                    <div
                      className={`
                relative px-3 pt-3 pb-5 flex flex-col items-center justify-center gap-1 
                text-white font-bold text-xs shadow-lg transition-all
                ${statusConfig.bgColor}
              `}
                      // Cắt hình đuôi cá
                      style={{
                        clipPath:
                          "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
                        minWidth: "70px",
                      }}
                    >
                      <statusConfig.Icon className="h-5 w-5 mb-0.5" />
                      <span className="text-center leading-tight uppercase tracking-wider text-[10px]">
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                );
              })()}
          </div>
        </CardHeader>
        <div className="w-full h-[1px] -mt-6 bg-[#00416a] dark:bg-[#f0ead6]" />
        <CardContent className="grid md:grid-cols-3 gap-x-4 gap-y-6">
          {/* === CỘT 1 === */}
          <div className="space-y-6">
            {/* Số từ */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Số từ</p>
              <p className="font-medium">{chapter.wordCount} từ</p>
            </div>
            {/* Tạo lúc */}
            <div className="text-sm">
              <p className="text-slate-400 mb-1">Tạo lúc</p>
              <p>{new Date(chapter.createdAt).toLocaleString("vi-VN")}</p>
            </div>

            {/* Xuất bản lúc */}
            {chapter.publishedAt && (
              <div className="text-sm">
                <p className="text-slate-400 mb-1">Xuất bản lúc</p>
                <p>{new Date(chapter.publishedAt).toLocaleString("vi-VN")}</p>
              </div>
            )}
          </div>
          {/* === CỘT 2 === */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Số kí tự</p>
              <p className="font-medium">{chapter.charCount} từ</p>
            </div>
            {/* Ngôn ngữ */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Ngôn ngữ</p>
              {isEditing ? (
                <Select
                  value={editFormData.languageCode}
                  onValueChange={(
                    value: "vi-VN" | "en-US" | "zh-CN" | "ja-JP"
                  ) => handleSelectChange("languageCode", value)}
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
              ) : (
                <p className="font-medium">{chapter.languageName}</p>
              )}
            </div>

            {/* Loại truy cập */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Loại truy cập</p>
              {isEditing ? (
                <Select
                  value={editFormData.accessType}
                  onValueChange={(v: "free" | "dias") =>
                    setEditFormData((prev) => ({ ...prev, accessType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Miễn phí</SelectItem>
                    <SelectItem value="dias">Trả phí (Kim cương)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium">
                  {chapter.accessType === "free"
                    ? "Miễn phí"
                    : "Trả phí (Kim cương)"}
                </p>
              )}
            </div>
          </div>

          {/* === CỘT 3 === */}
          <div className="space-y-6">
            {/* Giá */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Giá</p>
              <p className="font-medium">
                {chapter.accessType === "free"
                  ? "Miễn phí"
                  : `${chapter.priceDias} Dias`}
              </p>
            </div>

            {/* Trạng thái AI */}
            {chapter.aiResult && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Trạng thái chương</p>

                {(() => {
                  // Cấu hình mặc định (Đang chờ - Màu vàng)
                  let statusConfig = {
                    label: "Đang chờ",
                    className: "bg-yellow-500 hover:bg-yellow-600 text-white",
                    Icon: Clock,
                  };

                  // Cấu hình khi Đã duyệt (Màu xanh lá)
                  if (chapter.aiResult === "approved") {
                    statusConfig = {
                      label: "Đã duyệt",
                      className: "bg-green-500 hover:bg-green-600 text-white",
                      Icon: CheckCircle,
                    };
                  }
                  // Cấu hình khi Từ chối (Màu đỏ)
                  else if (chapter.aiResult === "rejected") {
                    statusConfig = {
                      label: "Từ chối",
                      className: "bg-red-500 hover:bg-red-600 text-white",
                      Icon: XCircle,
                    };
                  }

                  return (
                    <Badge
                      className={`border-none px-3 py-1.5 text-sm font-medium flex items-center w-fit gap-x-2 transition-all ${statusConfig.className}`}
                    >
                      <statusConfig.Icon className="h-4 w-4" />
                      <span>{statusConfig.label}</span>
                    </Badge>
                  );
                })()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Chapter Voice - Tác giả chọn số lượng giọng */}
      {chapter &&
        (chapter.status === "published" || chapter.status === "completed") && (
          <VoiceChapterPlayer chapterId={chapterId} />
        )}{" "}
      {/* AI Assessment */}
      {chapter && (chapter.aiScore !== undefined || vietnameseFeedback) && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Star className="h-5 w-5" />
              Đánh giá AI
            </CardTitle>
            <CardDescription>
              Phân tích và đánh giá tự động từ hệ thống AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Điểm số */}
            {chapter.aiScore != null && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Điểm AI:</span>
                </div>
                <Badge
                  variant={
                    chapter.aiScore >= 8
                      ? "default"
                      : chapter.aiScore >= 6
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-lg px-3 py-1"
                >
                  {chapter.aiScore.toFixed(1)}/10
                </Badge>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        chapter.aiScore >= 8
                          ? "bg-green-500"
                          : chapter.aiScore >= 6
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${(chapter.aiScore / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Feedback tiếng Việt - HIỂN THỊ ĐẦY ĐỦ */}
            {vietnameseFeedback && (
              <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
                  Góp ý chi tiết từ AI:
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
                  {renderContent(vietnameseFeedback)}{" "}
                  {/* Dùng renderContent để hỗ trợ xuống dòng, in đậm... */}
                </div>
              </div>
            )}

            {/* Nếu không có feedback tiếng Việt */}
            {!vietnameseFeedback && chapter?.aiFeedback && (
              <Alert>
                <AlertDescription className="text-sm">
                  AI đã đánh giá chương nhưng chưa có phản hồi tiếng Việt.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trạng thái</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {!isEditing && (
              <>
                {/* Chương draft - có thể chỉnh sửa và gửi duyệt */}
                {chapter?.status === "draft" && (
                  <>
                    <Button onClick={handleEditChapter}>
                      <Edit className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                    <Button
                      onClick={handleSubmitForReview}
                      disabled={isSubmitting}
                      variant="default"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Gửi kiểm duyệt
                    </Button>
                  </>
                )}

                {/* Chương rejected - có thể rút về draft */}
                {chapter?.status === "rejected" && (
                  <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <strong>Hướng dẫn:</strong>
                    </p>
                    <p>
                      Hãy lên đầu trang và bấm nút{" "}
                      <strong>"Rút về bản nháp"</strong> để chỉnh sửa chương và
                      gửi lại.
                    </p>
                  </div>
                )}

                {/* Chương pending - đang chờ duyệt */}
                {chapter?.status === "pending" && (
                  <Button variant="secondary" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Đang chờ duyệt từ Content mod của ToraNovel
                  </Button>
                )}

                {/* Chương published - đã xuất bản */}
                {chapter?.status === "published" && (
                  <Button variant="secondary" disabled>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Đã xuất bản
                  </Button>
                )}
              </>
            )}

            {/* Khi đang chỉnh sửa */}
            {isEditing && (
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  variant="default"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu thay đổi
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Content Preview/Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {isEditing ? "Chỉnh sửa nội dung" : "Nội dung chương"}
              </CardTitle>
              <CardDescription>
                {isEditing
                  ? "Sử dụng Tiptap Editor chuyên nghiệp"
                  : "Xem trước nội dung chương"}
              </CardDescription>
            </div>
            {!isEditing && chapterContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadContent}
              >
                <Download className="h-4 w-4 mr-2" />
                Tải xuống
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            // EDITOR MODE - Sử dụng TiptapEditor
            <TiptapEditor
              content={editFormData.content}
              onChange={handleEditorChange}
              placeholder="Nhập nội dung chương tại đây..."
              maxLength={50000}
              disabled={isSaving}
            />
          ) : (
            // PREVIEW MODE
            <div className="bg-muted/50 rounded-lg p-6 min-h-[200px] max-h-[600px] overflow-y-auto">
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Đang tải nội dung...
                  </span>
                </div>
              ) : chapterContent ? (
                renderContent(chapterContent)
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    {isPublished
                      ? "Nội dung đã được xuất bản và có thể xem bởi độc giả"
                      : "Không thể tải nội dung chương"}
                  </p>
                  {chapter?.contentPath && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        chapter.contentPath &&
                        loadChapterContent(chapter.contentPath!)
                      }
                    >
                      Thử tải lại
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
