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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Sparkles,
  AlertCircle,
  Gem,
  UserCheck,
} from "lucide-react";
import { chapterService } from "@/services/chapterService";
import type { ChapterDetails } from "@/services/apiTypes";
import { toast } from "sonner";
import TiptapEditor from "@/components/editor/TiptapEditor";
import VoiceChapterPlayer from "@/components/author/VoiceChapterPlayer";
import { profileService } from "@/services/profileService";
import { voiceChapterService } from "@/services/voiceChapterService";
import { AiModerationReport } from "@/components/AiModerationReport";
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
  const [authorRank, setAuthorRank] = useState<string>("Casual");
  const [rankLoading, setRankLoading] = useState(true);
  const [voicePrice, setVoicePrice] = useState<number | null>(null);
  // State mới cho chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    content: "",
    languageCode: "vi-VN" as "vi-VN" | "en-US" | "zh-CN" | "ja-JP",
    accessType: "free" as "free" | "dias",
  });
  const TITLE_MIN_LENGTH = 20;
  const TITLE_MAX_LENGTH = 50;
  // State theo dõi thay đổi chưa lưu
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
      // } catch (error: any) {
      //   console.error("Error reloading chapter:", error);
      //   toast.error(error.message || "Không thể tải thông tin chương");
      // }
    } catch (error: any) {
      console.error("Error reloading chapter:", error);
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải thông tin chương");
    }
  };
  useEffect(() => {
    profileService.getAuthorRank().then((rank) => {
      setAuthorRank(rank);
      setRankLoading(false);
    });
  }, []);
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
      const voiceData = await voiceChapterService
        .getVoiceChapter(chapterId)
        .catch(() => null);
      // Lấy giá của giọng đầu tiên (nếu có)
      setVoicePrice(voiceData?.voices?.[0]?.priceDias ?? null);

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
      // } catch (error: any) {
      //   console.error("Error loading chapter:", error);
      //   toast.error(error.message || "Không thể tải thông tin chương");
      // } finally {
      //   setIsLoading(false);
      // }
    } catch (error: any) {
      console.error("Error loading chapter:", error);
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải thông tin chương");
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
      // } catch (error: any) {
      //   console.error("Error submitting chapter:", error);

      //   // QUAN TRỌNG: RELOAD LẠI CHAPTER KHI CÓ LỖI
      //   await reloadChapter();

      //   // Hiển thị thông báo lỗi cụ thể
      //   if (error.response?.data?.error?.code === "InvalidChapterState") {
      //     toast.error(
      //       "Chương không ở trạng thái có thể gửi. Chỉ chương ở trạng thái bản nháp mới được gửi."
      //     );
      //   } else if (error.response?.data?.error?.code === "ChapterRejectedByAi") {
      //     toast.error(
      //       "Chương bị từ chối bởi hệ thống kiểm duyệt tự động của ToraNovel"
      //     );
      //   } else {
      //     toast.error(error.message || "Có lỗi xảy ra khi gửi chương");
      //   }
      // } finally {
      //   setIsSubmitting(false);
      // }
    } catch (error: any) {
      console.error("Error submitting chapter:", error);

      // QUAN TRỌNG: RELOAD LẠI CHAPTER KHI CÓ LỖI
      await reloadChapter();

      // --- DÙNG HELPER ---
      handleApiError(error, "Có lỗi xảy ra khi gửi chương");
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
      // 1. Gọi API rút chương
      await chapterService.withdrawChapter(chapterId);

      // 2. Tự tay lấy lại dữ liệu mới nhất (Không dùng reloadChapter để tránh lằng nhằng)
      const freshChapterData = await chapterService.getChapterDetails(
        storyId,
        chapterId
      );

      // 3. Tải nội dung mới nhất (nếu có path)
      let freshContent = "";
      if (freshChapterData.contentPath) {
        // Gọi api tải content trực tiếp ở đây
        const res = await fetch(
          `/api/chapter-content?path=${encodeURIComponent(
            freshChapterData.contentPath
          )}`
        );
        if (res.ok) {
          const data = await res.json();
          freshContent = data.content || "";
        }
      } else {
        freshContent = freshChapterData.content || "";
      }

      // 4. CẬP NHẬT ĐỒNG LOẠT UI (Quan trọng nhất bước này)
      setChapter(freshChapterData); // Cập nhật state gốc
      setChapterContent(freshContent); // Cập nhật state hiển thị
      setShowModeratorAlert(false); // Tắt cảnh báo

      // 5. Nạp dữ liệu vào Form Edit TRƯỚC khi bật chế độ edit
      setEditFormData({
        title: freshChapterData.title,
        content: freshContent, // <--- Đảm bảo content mới nhất được nạp vào đây
        languageCode: freshChapterData.languageCode as any,
        accessType: (freshChapterData.accessType as "free" | "dias") || "free",
      });

      // 6. Cuối cùng mới bật màn hình Edit
      setIsEditing(true);

      toast.success("Đã rút chương về bản nháp thành công!");
      // } catch (err: any) {
      //   console.error("Error withdrawing chapter:", err);
      //   // Nếu lỗi thì mới dùng reloadChapter để cứu vớt UI
      //   await reloadChapter();

      //   if (err.response?.data?.error?.code === "WithdrawNotAllowed") {
      //     toast.error("Chỉ có thể rút chương khi bị từ chối");
      //   } else {
      //     toast.error(err.message || "Không thể rút chương");
      //   }
      // } finally {
      //   setIsWithdrawing(false);
      // }
    } catch (err: any) {
      console.error("Error withdrawing chapter:", err);
      // Nếu lỗi thì mới dùng reloadChapter để cứu vớt UI
      await reloadChapter();

      // --- DÙNG HELPER ---
      handleApiError(err, "Không thể rút chương");
    } finally {
      setIsWithdrawing(false);
    }
  };
  // HÀM LƯU ĐÃ ĐƯỢC TỐI ƯU
  const handleSaveEdit = async () => {
    if (!chapter) return;

    // Validation
    const titleTrimmed = editFormData.title.trim();

    if (!titleTrimmed) {
      toast.error("Vui lòng nhập tiêu đề chương");
      return;
    }

    if (titleTrimmed.length < TITLE_MIN_LENGTH) {
      toast.error(`Tiêu đề quá ngắn (tối thiểu ${TITLE_MIN_LENGTH} ký tự)`);
      return;
    }

    if (titleTrimmed.length > TITLE_MAX_LENGTH) {
      toast.error(`Tiêu đề vượt quá giới hạn (${TITLE_MAX_LENGTH} ký tự)`);
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
      // } catch (error: any) {
      //   console.error("Error updating chapter:", error);
      //   toast.error(error.message || "Có lỗi xảy ra khi cập nhật chương");
      // } finally {
      //   setIsSaving(false);
      // }
    } catch (error: any) {
      console.error("Error updating chapter:", error);
      // --- DÙNG HELPER ---
      handleApiError(error, "Có lỗi xảy ra khi cập nhật chương");
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
                  <div className="flex justify-between items-end">
                    <Label
                      htmlFor="title"
                      className="flex items-center gap-1 font-semibold"
                    >
                      Tiêu đề chương <span className="text-red-500">*</span>
                    </Label>
                    {/* Bộ đếm số ký tự: Chuyển sang màu đỏ nếu không hợp lệ */}
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border transition-colors ${
                        editFormData.title.length < TITLE_MIN_LENGTH ||
                        editFormData.title.length > TITLE_MAX_LENGTH
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-emerald-50 text-emerald-600 border-emerald-200"
                      }`}
                    >
                      {editFormData.title.length}/{TITLE_MAX_LENGTH} ký tự
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="title"
                      name="title"
                      value={editFormData.title}
                      onChange={handleInputChange}
                      placeholder="Nhập tiêu đề chương..."
                      required
                      maxLength={TITLE_MAX_LENGTH} // Ngăn nhập quá giới hạn vật lý
                      className={`w-full pr-10 transition-all ${
                        editFormData.title.length > 0 &&
                        editFormData.title.length < TITLE_MIN_LENGTH
                          ? "border-orange-400 focus-visible:ring-orange-400 bg-orange-50/30"
                          : ""
                      }`}
                    />
                    {/* Icon trạng thái nhanh: Tích xanh khi đạt độ dài tối thiểu */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {editFormData.title.length >= TITLE_MIN_LENGTH ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 animate-in zoom-in" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-slate-300" />
                      )}
                    </div>
                  </div>
                  {/* Thông báo nhắc nhở khi quá ngắn */}
                  {editFormData.title.length > 0 &&
                    editFormData.title.length < TITLE_MIN_LENGTH && (
                      <p className="text-[11px] text-orange-600 font-medium flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                        <AlertTriangle className="h-3 w-3" />
                        Tiêu đề tối thiểu {TITLE_MIN_LENGTH} ký tự (Hiện tại:{" "}
                        {editFormData.title.length})
                      </p>
                    )}
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
                  <CardDescription className="flex items-center gap-6 text-base mt-1">
                    {/* Cụm Số chương */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Số chương:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {chapter?.chapterNo}
                      </span>
                    </div>

                    {/* Đường kẻ dọc ngăn cách */}
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800" />

                    {/* Cụm Cảm xúc chương */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Cảm xúc:</span>
                      {!chapter?.mood ? (
                        // CHỈ HIỆN CHỮ MÀU ĐỎ KHI CHƯA CÓ DỮ LIỆU
                        <span className="font-bold text-red-600 uppercase tracking-tight">
                          Chưa xác định
                        </span>
                      ) : (
                        // HIỆN CHỮ BÌNH THƯỜNG (KHÔNG MÀU MÈ) KHI ĐÃ CÓ
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {chapter.mood.name}
                          </span>
                          <span className="text-xs text-slate-400 font-normal">
                            ({chapter.mood.code})
                          </span>
                        </div>
                      )}
                    </div>
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
            {/* <div>
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
            </div> */}

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
                  {chapter.accessType === "free" ? "Miễn phí" : "Trả phí"}
                </p>
              )}
            </div>
          </div>

          {/* === CỘT 3 === */}
          <div className="space-y-6">
            {/* Giá */}
            <div>
              <p className="text-sm text-slate-400 mb-1">
                Giá cho 1 chương nếu mất phí
              </p>

              <div className="font-medium flex items-center gap-1">
                {chapter?.priceDias}{" "}
                <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Giá bán Audio AI</p>
              <div className="font-medium min-h-[24px] flex items-center">
                {voicePrice !== null ? (
                  <span className="flex items-center gap-1">
                    {voicePrice}{" "}
                    <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                  </span>
                ) : (
                  <span className="text-slate-500 text-sm italic">
                    Chưa có audio
                  </span>
                )}
              </div>
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
      {/* CHỈ HIỆN KHI: Đã xuất bản VÀ Rank không phải là Casual */}
      {chapter && chapter.status === "published" && (
        <>
          {rankLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : authorRank !== "Casual" ? (
            <VoiceChapterPlayer chapterId={chapterId} />
          ) : (
            <Card className="my-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
              <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* PHẦN TRÁI: Tiêu đề + Nội dung text */}
                <div className="flex items-center gap-3 text-sm text-orange-900 dark:text-orange-100 w-full sm:w-auto">
                  <div className="flex items-center gap-2 font-bold text-orange-700 whitespace-nowrap shrink-0">
                    <Sparkles className="h-5 w-5" />
                    Tính năng Audio AI
                  </div>

                  {/* Dấu gạch đứng ngăn cách (chỉ hiện trên desktop) */}
                  <div className="hidden sm:block h-4 w-[1px] bg-orange-300 dark:bg-orange-700 mx-1" />

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <AlertCircle className="h-4 w-4 text-orange-600 shrink-0" />
                    <span>
                      Chưa đủ điều kiện. Chỉ tác giả từ{" "}
                      <strong>rank Bronze</strong> trở lên.
                    </span>
                  </div>
                </div>

                {/* PHẦN PHẢI: Nút bấm */}
                <Button
                  size="sm"
                  onClick={() => router.push("/author/author-upgrade-rank")}
                  className="bg-orange-600 hover:bg-orange-700 shrink-0 w-full sm:w-auto"
                >
                  <Sparkles className="h-3 w-3 mr-2" />
                  Nâng cấp ngay
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
      {/* Chapter Summary - Styled like AI Assessment */}
      {chapter && chapter.summary && (
        <Card className="border-indigo-200 dark:border-indigo-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <FileText className="h-5 w-5" />
              Tóm tắt chương
            </CardTitle>
            <CardDescription>
              Nội dung tóm tắt sơ lược của chương truyện
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
                {renderContent(chapter.summary)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* AI Assessment */}
      {/* Khối báo cáo kiểm duyệt AI mới */}
      {chapter && (chapter.aiScore !== undefined || chapter.aiFeedback) && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Star className="h-5 w-5" />
              Đánh giá AI
            </CardTitle>
            <CardDescription>
              Phân tích và đánh giá tự động từ hệ thống AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 1. Hiển thị điểm số dạng thanh tiến trình */}
            {chapter.aiScore != null && (
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Điểm AI:</span>
                </div>
                <Badge
                  variant={chapter.aiScore >= 7 ? "default" : "destructive"}
                  className="text-lg px-3 py-1"
                >
                  {chapter.aiScore.toFixed(1)}/10
                </Badge>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        chapter.aiScore >= 7 ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${(chapter.aiScore / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Component chi tiết vi phạm và phản hồi */}
            <AiModerationReport
              aiFeedback={chapter.aiFeedback}
              aiViolations={chapter.aiViolations}
              contentType="chương"
            />
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    <h3 className="font-bold text-xs uppercase tracking-wider">
                      Trạng thái kiểm duyệt từ ContentMod
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`px-3 py-1 text-xs font-bold ${
                        chapter?.moderatorStatus === "approved"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : chapter?.moderatorStatus === "rejected"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {chapter?.moderatorStatus === "approved"
                        ? "ĐÃ DUYỆT"
                        : chapter?.moderatorStatus === "rejected"
                        ? "BỊ TỪ CHỐI"
                        : "KHÔNG CÓ"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <h3 className="font-bold text-xs uppercase tracking-wider">
                      Ghi chú từ ContentMod
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground italic bg-white/40 p-3 rounded-lg border border-slate-100">
                    {chapter?.moderatorNote ||
                      "Nội dung không có ghi chú vi phạm."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-0">
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
                {chapter.status === "pending" && (
                  <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription>
                      Trạng thái: Chương đang chờ được Content mod đánh giá và
                      duyệt
                    </AlertDescription>
                  </Alert>
                )}

                {/* Chương published - đã xuất bản */}
                {chapter.status === "published" && (
                  <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />

                    <AlertDescription>
                      Trạng thái: Chương đã được xuất bản thành công
                    </AlertDescription>
                  </Alert>
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
              maxLength={10000}
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
