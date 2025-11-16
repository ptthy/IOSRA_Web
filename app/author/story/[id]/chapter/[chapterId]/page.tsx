// app/author/story/[id]/chapter/[chapterId]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Bold,
  Italic,
  Strikethrough,
  List,
  Quote,
} from "lucide-react";
import { chapterService } from "@/services/chapterService";
import type { ChapterDetails } from "@/services/apiTypes";
import { toast } from "sonner";
import TurndownService from "turndown";
import { marked } from "marked";

// Base URL cho R2 bucket - có thể move ra file config sau
const R2_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev";
// Khởi tạo TurndownService
const turndownService = new TurndownService();

// Hàm chuyển HTML sang Markdown
const convertHtmlToMarkdown = (html: string): string => {
  if (!html) return "";
  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error("Error converting HTML to Markdown:", error);
    return html;
  }
};

// Hàm chuyển Markdown sang HTML
const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return "";
  try {
    return marked.parse(markdown) as string;
  } catch (error) {
    console.error("Error converting Markdown to HTML:", error);
    return markdown;
  }
};

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

  const [chapter, setChapter] = useState<ChapterDetails | null>(null);
  const [chapterContent, setChapterContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State mới cho chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    content: "",
    languageCode: "vi-VN" as "vi-VN" | "en-US" | "zh-CN" | "ja-JP",
  });
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);

  // Ref và state cho rich text editor
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // ========== CÁC HÀM XỬ LÝ EDITOR (lấy từ trang new) ==========
  useEffect(() => {
    if (
      isEditing &&
      editorRef.current &&
      editFormData.content &&
      !isMarkdownMode
    ) {
      console.log("🔍 [DEBUG] useEffect: Initializing editor with content");

      // Chỉ set nội dung nếu editor đang trống
      if (
        editorRef.current.innerHTML === "" ||
        editorRef.current.innerHTML === "<br>" ||
        editorRef.current.innerHTML.includes("Nhập nội dung")
      ) {
        editorRef.current.innerHTML = editFormData.content;
        setShowPlaceholder(!editFormData.content);
      }
    }
  }, [isEditing, isMarkdownMode, editFormData.content]);
  const applyFormatting = (command: string, value: string = "") => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateContentFromEditor();
  };

  const updateContentFromEditor = () => {
    if (!editorRef.current) return;
    const newContent = editorRef.current.innerHTML;
    const hasContent =
      newContent !== "<br>" &&
      newContent !== "" &&
      newContent !== "<div><br></div>";
    setShowPlaceholder(!hasContent);
    setEditFormData((prev) => ({ ...prev, content: newContent }));
    setHasUnsavedChanges(true);
  };

  const handleEditorFocus = () => {
    setShowPlaceholder(false);
  };

  const handleEditorBlur = () => {
    if (editorRef.current) {
      const hasContent =
        editorRef.current.innerHTML !== "<br>" &&
        editorRef.current.innerHTML !== "" &&
        editorRef.current.innerHTML !== "<div><br></div>";
      setShowPlaceholder(!hasContent);
    }
  };

  // Các hàm xử lý định dạng
  // Các hàm xử lý định dạng
  const handleBold = () => {
    applyFormatting("bold");
    setActiveFormat(activeFormat === "bold" ? null : "bold");
  };

  const handleItalic = () => {
    applyFormatting("italic");
    setActiveFormat(activeFormat === "italic" ? null : "italic");
  };

  const handleStrikethrough = () => {
    applyFormatting("strikethrough");
    setActiveFormat(activeFormat === "strikethrough" ? null : "strikethrough");
  };

  const handleHeading = (level: number) => {
    applyFormatting("formatBlock", `<h${level}>`);
    setActiveFormat(activeFormat === `h${level}` ? null : `h${level}`);
  };

  const handleList = (type: "bullet" | "number") => {
    applyFormatting(
      type === "bullet" ? "insertUnorderedList" : "insertOrderedList"
    );
    setActiveFormat(activeFormat === type ? null : type);
  };

  const handleQuote = () => {
    applyFormatting("formatBlock", "<blockquote>");
    setActiveFormat(activeFormat === "quote" ? null : "quote");
  };

  const handleEditorInput = () => {
    updateContentFromEditor();
  };

  // Thêm hàm chuyển đổi chế độ
  const handleSwitchToMarkdown = () => {
    if (!isMarkdownMode) {
      // Đang từ Rich Text -> Markdown
      const currentContent = editFormData.content;

      if (currentContent && isHTMLContent(currentContent)) {
        const markdownContent = convertHtmlToMarkdown(currentContent);
        setEditFormData((prev) => ({ ...prev, content: markdownContent }));
      }

      setIsMarkdownMode(true);
      setHasUnsavedChanges(true);
    }
  };

  const handleSwitchToRichText = () => {
    if (isMarkdownMode) {
      // Đang từ Markdown -> Rich Text
      const currentContent = editFormData.content;

      if (currentContent && isMarkdownContent(currentContent)) {
        const htmlContent = convertMarkdownToHtml(currentContent);
        setEditFormData((prev) => ({ ...prev, content: htmlContent }));

        // Cập nhật editor
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = htmlContent;
            setShowPlaceholder(!htmlContent);
          }
        }, 0);
      }

      setIsMarkdownMode(false);
      setHasUnsavedChanges(true);
    }
  };
  // State theo dõi thay đổi chưa lưu
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeFormat, setActiveFormat] = useState<string | null>(null);
  // Đồng bộ editor khi chuyển chế độ hoặc nội dung thay đổi
  useEffect(() => {
    if (!isMarkdownMode && editorRef.current && editFormData.content) {
      // Chỉ cập nhật nếu nội dung khác với hiện tại
      if (editorRef.current.innerHTML !== editFormData.content) {
        editorRef.current.innerHTML = editFormData.content;
        setShowPlaceholder(!editFormData.content);
      }
    }
  }, [isMarkdownMode, editFormData.content]);
  useEffect(() => {
    loadChapter();
  }, [storyId, chapterId]);

  const loadChapter = async () => {
    setIsLoading(true);
    try {
      const chapterData = await chapterService.getChapterDetails(
        storyId,
        chapterId
      );
      setChapter(chapterData);

      // KHỞI TẠO FORM DATA TỪ CHAPTER HIỆN TẠI
      setEditFormData({
        title: chapterData.title,
        content: chapterData.content || "",
        languageCode: chapterData.languageCode as
          | "vi-VN"
          | "en-US"
          | "zh-CN"
          | "ja-JP",
      });

      // ƯU TIÊN SỬ DỤNG NỘI DUNG TỪ DATABASE TRƯỚC
      if (chapterData.content) {
        setChapterContent(chapterData.content);
        console.log("✅ [DEBUG] Using content from database");
      } else if (chapterData.contentPath) {
        // Chỉ load từ file nếu không có content trong database
        console.log("📁 [DEBUG] Loading content from file path");
        await loadChapterContent(chapterData.contentPath);
      } else {
        console.warn("⚠️ [DEBUG] No content available, setting empty content");
        setChapterContent(""); // Đặt thành chuỗi rỗng thay vì null
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
      const apiUrl = `/api/chapter-content?path=${encodeURIComponent(
        contentPath
      )}`;
      console.log("🔍 [DEBUG] Loading chapter content via API:", apiUrl);

      const response = await fetch(apiUrl);

      console.log("🔍 [DEBUG] API response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        // XỬ LÝ LỖI 404 CỤ THỂ
        if (response.status === 404) {
          console.warn(
            "⚠️ [DEBUG] Content file not found in R2, using database content"
          );
          // Sử dụng nội dung từ database thay vì từ file
          if (chapter?.content) {
            setChapterContent(chapter.content);
            return; // Thoát sớm để không xử lý tiếp
          } else {
            // NẾU KHÔNG CÓ NỘI DUNG TRONG DATABASE, ĐẶT THÀNH CHUỖI RỖNG
            console.warn(
              "⚠️ [DEBUG] No content in database either, setting empty content"
            );
            setChapterContent("");
            return; // Thoát sớm, không ném lỗi
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("🔍 [DEBUG] Content loaded via API:", {
        contentLength: data.content.length,
        first100Chars: data.content.substring(0, 100),
        hasContent: data.content.length > 0,
      });

      // ========== ĐẶT DEBUG CONTENT ANALYSIS Ở ĐÂY ==========
      console.log("🔍 [DEBUG] Content analysis:", {
        contentLength: data.content.length,
        first200Chars: data.content.substring(0, 200),
        isHTML: isHTMLContent(data.content),
        isMarkdown: isMarkdownContent(data.content),
        containsDiv: /<div[^>]*>/i.test(data.content),
        containsP: /<p[^>]*>/i.test(data.content),
        containsStrong: /<strong[^>]*>/i.test(data.content),
        containsBr: /<br[^>]*>/i.test(data.content),
        containsH1: /<h1[^>]*>/i.test(data.content),
        containsBlockquote: /<blockquote[^>]*>/i.test(data.content),
      });
      // ========== END DEBUG ==========

      setChapterContent(data.content);

      // CẬP NHẬT EDIT FORM DATA KHI CÓ NỘI DUNG MỚI
      if (isEditing) {
        setEditFormData((prev) => ({ ...prev, content: data.content }));
        // Cập nhật editor nếu đang trong chế độ chỉnh sửa
        setTimeout(() => {
          if (editorRef.current && !isMarkdownMode) {
            editorRef.current.innerHTML = data.content;
            setShowPlaceholder(!data.content);
          }
        }, 100);
      }
    } catch (error: any) {
      console.error("❌ [DEBUG] Error loading chapter content:", {
        error: error,
        message: error.message,
        stack: error.stack,
      });

      // HIỂN THỊ THÔNG BÁO LỖI CỤ THỂ
      if (
        error.message.includes("404") ||
        error.message.includes("not found") ||
        error.message.includes("Không tìm thấy")
      ) {
        // THỬ SỬ DỤNG NỘI DUNG TỪ DATABASE HOẶC ĐẶT THÀNH RỖNG
        if (chapter?.content) {
          setChapterContent(chapter.content);
          toast.warning("Sử dụng nội dung từ database");
        } else {
          setChapterContent("");
          toast.warning(
            "Chương chưa có nội dung, bạn có thể thêm nội dung mới"
          );
        }
      } else {
        toast.error("Không thể tải nội dung chương");
        setChapterContent("");
      }
    } finally {
      setIsLoadingContent(false);
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

  const handleSubmitForReview = async () => {
    if (!chapter) return;

    setIsSubmitting(true);
    try {
      await chapterService.submitChapterForReview(chapterId);
      toast.success("Đã gửi chương cho AI đánh giá thành công!");
      // Reload để cập nhật trạng thái mới
      loadChapter();
    } catch (error: any) {
      console.error("Error submitting chapter:", error);
      toast.error(error.message || "Có lỗi xảy ra khi gửi chương");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditChapter = () => {
    setIsEditing(true);
    setHasUnsavedChanges(false);

    // ĐẢM BẢO KHỞI TẠO ĐÚNG NỘI DUNG CHO EDITOR
    if (chapter) {
      // Sử dụng chapterContent nếu có, nếu không thì dùng chapter.content
      const currentContent = chapterContent || chapter.content || "";

      // Xác định chế độ mặc định dựa trên loại nội dung
      const shouldStartWithMarkdown =
        isMarkdownContent(currentContent) && !isHTMLContent(currentContent);
      setIsMarkdownMode(shouldStartWithMarkdown);

      // Cập nhật form data với nội dung hiện tại
      setEditFormData({
        title: chapter.title,
        content: currentContent,
        languageCode: chapter.languageCode as
          | "vi-VN"
          | "en-US"
          | "zh-CN"
          | "ja-JP",
      });

      // Đợi một chút để đảm bảo editor đã render rồi mới set nội dung
      setTimeout(() => {
        if (editorRef.current && currentContent && !shouldStartWithMarkdown) {
          console.log("🔍 [DEBUG] Setting editor content:", {
            contentLength: currentContent.length,
            first100Chars: currentContent.substring(0, 100),
          });

          // Set nội dung cho rich text editor
          editorRef.current.innerHTML = currentContent;
          setShowPlaceholder(!currentContent);
        }
      }, 100);
    }
  };
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn hủy?"
      );
      if (!confirmLeave) return;
    }
    setIsEditing(false);
    // Khôi phục dữ liệu gốc
    if (chapter) {
      setEditFormData({
        title: chapter.title,
        content: chapter.content || "",
        languageCode: chapter.languageCode as
          | "vi-VN"
          | "en-US"
          | "zh-CN"
          | "ja-JP",
      });
    }
    setHasUnsavedChanges(false);
  };

  const handleSaveEdit = async () => {
    if (!chapter) return;

    // Validation
    if (!editFormData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề chương");
      return;
    }

    if (!editFormData.content.trim()) {
      toast.error("Vui lòng nhập nội dung chương");
      return;
    }

    setIsSaving(true);
    try {
      await chapterService.updateChapter(storyId, chapterId, {
        title: editFormData.title,
        content: editFormData.content,
        languageCode: editFormData.languageCode,
      });

      toast.success("Cập nhật chương thành công!");
      setIsEditing(false);
      setHasUnsavedChanges(false);

      // RELOAD LẠI DỮ LIỆU - CÁCH NÀY ĐƠN GIẢN VÀ AN TOÀN HƠN
      await loadChapter();
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

  // Trích xuất phần tiếng Việt từ AI Feedback
  const vietnameseFeedback = chapter
    ? extractVietnameseFeedback(chapter.aiFeedback ?? null)
    : null;

  // Xác định loại nội dung để hiển thị thông báo
  const getContentType = () => {
    if (!chapterContent) return "";
    if (isMarkdownContent(chapterContent))
      return "Đang hiển thị ở chế độ Markdown";
    if (isHTMLContent(chapterContent))
      return "Đang hiển thị ở chế độ Rich Text";
    return "Đang hiển thị ở chế độ văn bản thuần";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
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
          <Badge variant="destructive" className="ml-auto">
            Đang chỉnh sửa
          </Badge>
        )}
      </div>

      {/* Chapter Info - Chuyển thành form khi chỉnh sửa */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="w-full">
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
                <>
                  <CardTitle className="text-xl">{chapter?.title}</CardTitle>
                  <CardDescription>Chương {chapter?.chapterNo}</CardDescription>
                </>
              )}
            </div>
            {!isEditing && (
              <Badge
                variant={
                  chapter.status === "published"
                    ? "default"
                    : chapter.status === "pending"
                    ? "secondary"
                    : "outline"
                }
              >
                {chapter.status === "published"
                  ? "Đã xuất bản"
                  : chapter.status === "pending"
                  ? "Chờ duyệt"
                  : "Bản nháp"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-x-4 gap-y-6">
          {/* === CỘT 1 === */}
          <div className="space-y-6">
            {/* Số từ */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Số từ</p>
              <p className="font-medium">{chapter?.wordCount} từ</p>
            </div>
            {/* Tạo lúc */}
            <div className="text-sm">
              <p className="text-slate-400 mb-1">Tạo lúc</p>
              <p>
                {chapter && new Date(chapter.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          {/* === CỘT 2 === */}
          <div className="space-y-6">
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
                <p className="font-medium">{chapter?.languageName}</p>
              )}
            </div>
            {/* Xuất bản lúc */}
            {chapter.publishedAt && (
              <div className="text-sm">
                <p className="text-slate-400 mb-1">Xuất bản lúc</p>
                <p>{new Date(chapter.publishedAt).toLocaleString("vi-VN")}</p>
              </div>
            )}
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
          </div>
        </CardContent>
      </Card>

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
          <CardContent className="space-y-4">
            {chapter.aiScore != null && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Điểm AI:</span>
                </div>
                {/* Chuyển đổi từ thang 0-1 sang 1-10 */}
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    {/* Chuyển đổi phần trăm từ thang 1-10 */}
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(chapter.aiScore / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            {vietnameseFeedback && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Nhận xét AI:</span>
                </div>
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <AlertDescription className="whitespace-pre-wrap text-sm">
                    {vietnameseFeedback}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái chương</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {!isEditing && canEdit && !isLoadingContent && (
              <Button onClick={handleEditChapter}>
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            )}

            {isEditing && (
              <>
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
              </>
            )}

            {!isEditing && canSubmit && (
              <Button
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                variant="outline"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Gửi cho AI đánh giá
                  </>
                )}
              </Button>
            )}

            {isPending && (
              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription>
                  Chương đang chờ được AI đánh giá và duyệt
                </AlertDescription>
              </Alert>
            )}

            {isPublished && (
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription>
                  Chương đã được xuất bản thành công
                </AlertDescription>
              </Alert>
            )}
          </div>

          {isEditing && hasUnsavedChanges && (
            <Alert className="mt-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                Bạn có thay đổi chưa lưu. Nhấn <strong>"Lưu thay đổi"</strong>{" "}
                để lưu lại.
              </AlertDescription>
            </Alert>
          )}
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
                  ? isMarkdownMode
                    ? "Đang sử dụng Markdown"
                    : "Đang sử dụng Rich Text Editor"
                  : getContentType()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
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
              {isEditing && (
                <Button
                  type="button"
                  variant={isMarkdownMode ? "default" : "outline"}
                  size="sm"
                  onClick={
                    isMarkdownMode
                      ? handleSwitchToRichText
                      : handleSwitchToMarkdown
                  }
                >
                  {isMarkdownMode
                    ? "Chuyển sang Rich Text"
                    : "Chuyển sang Markdown"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-6 min-h-[200px] max-h-[600px] overflow-y-auto">
            {isEditing ? (
              // EDITOR MODE
              <div className="space-y-4">
                {/* Rich Text Toolbar */}
                {!isMarkdownMode && (
                  <div className="border rounded-lg p-3 bg-background">
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Button
                        type="button"
                        variant={
                          activeFormat === "bold" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={handleBold}
                        title="In đậm"
                        className="h-8 w-8 p-0"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={
                          activeFormat === "italic" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={handleItalic}
                        title="In nghiêng"
                        className="h-8 w-8 p-0"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={
                          activeFormat === "strikethrough"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={handleStrikethrough}
                        title="Gạch ngang"
                        className="h-8 w-8 p-0"
                      >
                        <Strikethrough className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={activeFormat === "h1" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleHeading(1)}
                        title="Tiêu đề 1"
                        className="h-8 px-2"
                      >
                        H1
                      </Button>
                      <Button
                        type="button"
                        variant={activeFormat === "h2" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleHeading(2)}
                        title="Tiêu đề 2"
                        className="h-8 px-2"
                      >
                        H2
                      </Button>
                      <Button
                        type="button"
                        variant={activeFormat === "h3" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleHeading(3)}
                        title="Tiêu đề 3"
                        className="h-8 px-2"
                      >
                        H3
                      </Button>
                      <Button
                        type="button"
                        variant={
                          activeFormat === "bullet" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleList("bullet")}
                        title="Danh sách không thứ tự"
                        className="h-8 w-8 p-0"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={
                          activeFormat === "number" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleList("number")}
                        title="Danh sách có thứ tự"
                        className="h-8 px-2"
                      >
                        1.
                      </Button>
                      <Button
                        type="button"
                        variant={
                          activeFormat === "quote" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={handleQuote}
                        title="Trích dẫn"
                        className="h-8 w-8 p-0"
                      >
                        <Quote className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Editor Area */}
                {!isMarkdownMode ? (
                  // Rich Text Editor
                  <div className="relative">
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={handleEditorInput}
                      onFocus={handleEditorFocus}
                      onBlur={handleEditorBlur}
                      className="min-h-[400px] resize-y border-2 p-3 rounded-md overflow-auto bg-background border-primary/30 focus-visible:border-primary"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                      }}
                    />
                    {showPlaceholder && (
                      <div className="absolute top-3 left-3 text-muted-foreground pointer-events-none">
                        Nhập nội dung chương tại đây...
                      </div>
                    )}
                  </div>
                ) : (
                  // Markdown Editor
                  <Textarea
                    value={editFormData.content}
                    onChange={handleInputChange}
                    name="content"
                    placeholder="Nhập nội dung chương tại đây..."
                    className="min-h-[400px] resize-y border-2 border-primary/30 focus-visible:border-primary"
                  />
                )}
              </div>
            ) : (
              // PREVIEW MODE (giữ nguyên)
              <>
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
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
