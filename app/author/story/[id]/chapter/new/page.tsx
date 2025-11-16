// app/author/story/[id]/chapter/new/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Bold,
  Italic,
  Strikethrough,
  List,
  Quote,
  Link,
  Eye,
  X,
} from "lucide-react";
import { chapterService } from "@/services/chapterService";
import { toast } from "sonner";
import TurndownService from "turndown";

import { marked } from "marked";
const LOCAL_STORAGE_KEY = "create-chapter-draft-v1";
const gfm = require("turndown-plugin-gfm").gfm;

// Khởi tạo TurndownService
const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});
turndownService.use(gfm);

// Hàm chuyển HTML sang Markdown
const convertHtmlToMarkdown = (html: string): string => {
  if (!html) return "";
  try {
    // Clean HTML trước khi chuyển đổi
    const cleanHtml = html
      .replace(/<div><br><\/div>/g, "")
      .replace(/<p><br><\/p>/g, "")
      .replace(/<h[1-6]><br><\/h[1-6]>/g, "")
      .replace(/<blockquote><br><\/blockquote>/g, "")
      .trim();

    if (!cleanHtml) return "";

    return turndownService.turndown(cleanHtml);
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

// Hàm phát hiện HTML content
const isHTMLContent = (content: string): boolean => {
  if (!content) return false;
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
  ];
  return htmlPatterns.some((pattern) => pattern.test(content));
};

// Hàm phát hiện Markdown content
const isMarkdownContent = (content: string): boolean => {
  if (!content) return false;
  const markdownPatterns = [
    /\*\*.+?\*\*/,
    /\*.+?\*/,
    /~~.+?~~/,
    /^#+\s+.+/m,
    /^-\s+.+/m,
    /^\d+\.\s+.+/m,
    /^>\s+.+/m,
    /\[.+\]\(.+\)/,
  ];
  return markdownPatterns.some((pattern) => pattern.test(content));
};

// Hàm xử lý danh sách cho Markdown
const formatMarkdownList = (content: string): string => {
  const lines = content.split("\n");
  let inList = false;
  let listType: "bullet" | "number" | null = null;

  const processedLines = lines.map((line) => {
    const trimmedLine = line.trim();

    // Kiểm tra danh sách không thứ tự
    if (
      trimmedLine.startsWith("- ") ||
      trimmedLine.startsWith("* ") ||
      trimmedLine.startsWith("+ ")
    ) {
      if (!inList || listType !== "bullet") {
        inList = true;
        listType = "bullet";
      }
      return line; // Giữ nguyên định dạng
    }

    // Kiểm tra danh sách có thứ tự
    if (/^\d+\.\s/.test(trimmedLine)) {
      if (!inList || listType !== "number") {
        inList = true;
        listType = "number";
      }
      return line; // Giữ nguyên định dạng
    }

    // Kết thúc danh sách
    if (inList && trimmedLine === "") {
      inList = false;
      listType = null;
    }

    return line;
  });

  return processedLines.join("\n");
};

export default function CreateChapterPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);

  // State của Form với giới hạn ký tự
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    languageCode: "vi-VN" as "vi-VN" | "en-US" | "zh-CN" | "ja-JP",
  });

  const [characterCounts, setCharacterCounts] = useState({
    title: 0,
    content: 0,
  });

  const LIMITS = {
    TITLE: 200,
    CONTENT: 50000,
  };

  // Ref và state cho rich text editor
  const editorRef = useRef<HTMLDivElement>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // ========== CÁC HÀM XỬ LÝ ĐỊNH DẠNG CHO RICH TEXT EDITOR ==========

  // Hàm restore selection - FIXED
  const restoreSelection = (range: Range) => {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      // Sử dụng type assertion để tránh lỗi TypeScript
      (selection as any).addRange(range);
    }
  };

  // Hàm wrap selection với tag - CẢI THIỆN
  const wrapSelectionWithTag = (tagName: string, className?: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    const selection = window.getSelection();
    const range =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (!range) {
      toast.info("Hãy chọn văn bản trước khi định dạng");
      return;
    }

    if (range.collapsed) {
      toast.info("Hãy bôi đen văn bản trước khi định dạng");
      return;
    }

    try {
      const selectedContent = range.extractContents();
      const wrapper = document.createElement(tagName);
      if (className) {
        wrapper.className = className;
      }
      wrapper.appendChild(selectedContent);
      range.insertNode(wrapper);

      // Cập nhật nội dung
      updateContentFromEditor();
    } catch (error) {
      console.error("Error applying formatting:", error);
      toast.error("Lỗi khi áp dụng định dạng");
    }
  };

  // Hàm xử lý block-level formatting (heading, blockquote) - FIXED
  const applyBlockFormatting = (tagName: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    const selection = window.getSelection();
    const range =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (!range) {
      // Nếu không có selection, tạo element mới ở cuối
      const element = document.createElement(tagName);
      element.innerHTML = tagName.startsWith("h")
        ? `Tiêu đề ${tagName.charAt(1)}`
        : "Trích dẫn";

      // Thêm vào cuối editor
      editorRef.current.appendChild(element);

      // Di chuyển cursor vào element mới - FIXED
      const newRange = document.createRange();
      newRange.setStart(element, 0);
      newRange.collapse(true);
      restoreSelection(newRange);
    } else {
      // Nếu có selection, wrap với element
      const selectedContent = range.extractContents();
      const element = document.createElement(tagName);
      element.appendChild(selectedContent);
      range.insertNode(element);
    }

    updateContentFromEditor();
  };

  // Hàm xử lý danh sách - SỬ DỤNG EXECCOMMAND ĐƠN GIẢN HƠN
  const handleList = (type: "bullet" | "number") => {
    if (!editorRef.current) return;

    editorRef.current.focus();

    // Sử dụng execCommand cho đơn giản và ổn định
    if (type === "bullet") {
      document.execCommand("insertUnorderedList", false);
    } else {
      document.execCommand("insertOrderedList", false);
    }

    updateContentFromEditor();
  };

  // Các hàm xử lý định dạng cụ thể
  const handleBold = () => {
    wrapSelectionWithTag("strong");
  };

  const handleItalic = () => {
    wrapSelectionWithTag("em");
  };

  const handleStrikethrough = () => {
    wrapSelectionWithTag("s");
  };

  const handleHeading = (level: number) => {
    applyBlockFormatting(`h${level}`);
  };

  const handleQuote = () => {
    applyBlockFormatting("blockquote");
  };

  // Cập nhật state từ nội dung editor
  const updateContentFromEditor = () => {
    if (!editorRef.current) return;

    const newContent = editorRef.current.innerHTML;

    // Kiểm tra xem editor có nội dung không
    const hasContent =
      newContent &&
      newContent !== "<br>" &&
      newContent !== "<div><br></div>" &&
      newContent !== "<p><br></p>" &&
      !newContent.startsWith("<h1><br></h1>") &&
      !newContent.startsWith("<h2><br></h2>") &&
      !newContent.startsWith("<h3><br></h3>") &&
      !newContent.startsWith("<blockquote><br></blockquote>") &&
      !newContent.startsWith("<ul><li><br></li></ul>") &&
      !newContent.startsWith("<ol><li><br></li></ol>");

    setShowPlaceholder(!hasContent);

    setFormData((prev) => ({ ...prev, content: newContent }));
    setCharacterCounts((prev) => ({ ...prev, content: newContent.length }));
    setHasUnsavedChanges(true);
  };

  // Hàm xử lý focus vào editor
  const handleEditorFocus = () => {
    setShowPlaceholder(false);
  };

  // Hàm xử lý blur khỏi editor
  const handleEditorBlur = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      const hasContent =
        newContent &&
        newContent !== "<br>" &&
        newContent !== "<div><br></div>" &&
        newContent !== "<p><br></p>";
      setShowPlaceholder(!hasContent);
    }
  };

  // Hàm xử lý input cho rich text editor
  const handleEditorInput = () => {
    updateContentFromEditor();
  };

  // Hàm xử lý paste để giữ định dạng đơn giản
  const handleEditorPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  // Thêm các hàm chuyển đổi chế độ - CẢI THIỆN
  const handleSwitchToMarkdown = () => {
    if (!isMarkdownMode) {
      const currentContent = formData.content;

      if (currentContent && isHTMLContent(currentContent)) {
        const markdownContent = convertHtmlToMarkdown(currentContent);
        const formattedMarkdown = formatMarkdownList(markdownContent);
        setFormData((prev) => ({ ...prev, content: formattedMarkdown }));
        setCharacterCounts((prev) => ({
          ...prev,
          content: formattedMarkdown.length,
        }));
      }

      setIsMarkdownMode(true);
      toast.info("Đã chuyển sang chế độ Markdown");
    }
  };

  const handleSwitchToRichText = () => {
    if (isMarkdownMode) {
      const currentContent = formData.content;

      if (currentContent) {
        const htmlContent = convertMarkdownToHtml(currentContent);
        setFormData((prev) => ({ ...prev, content: htmlContent }));
        setCharacterCounts((prev) => ({
          ...prev,
          content: htmlContent.length,
        }));

        // Cập nhật editor sau khi state đã được set
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = htmlContent;
            const hasContent =
              htmlContent &&
              htmlContent !== "<br>" &&
              htmlContent !== "<div><br></div>" &&
              htmlContent !== "<p><br></p>";
            setShowPlaceholder(!hasContent);
          }
        }, 0);
      }

      setIsMarkdownMode(false);
      toast.info("Đã chuyển sang trình soạn thảo trực quan");
    }
  };

  // ========== EFFECT VÀ CÁC HÀM XỬ LÝ KHÁC ==========

  // 1. Tải state từ Local Storage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const draft = JSON.parse(savedData);
        const hasActualData = draft.title?.trim() || draft.content?.trim();

        if (hasActualData) {
          setFormData(draft);
          setCharacterCounts({
            title: draft.title?.length || 0,
            content: draft.content?.length || 0,
          });
          setHasUnsavedChanges(true);

          if (draft.content?.trim()) {
            setShowPlaceholder(false);
          }

          toast.info("Đã khôi phục bản nháp từ lần chỉnh sửa trước");
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to load draft from local storage", e);
    }
  }, []);

  // 2. Lưu state vào Local Storage khi có thay đổi
  useEffect(() => {
    const hasActualData = formData.title?.trim() || formData.content?.trim();
    if (hasActualData && hasUnsavedChanges) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
      } catch (e) {
        console.error("Failed to save draft to local storage", e);
      }
    }
  }, [formData, hasUnsavedChanges]);

  // 3. Đồng bộ editor khi chuyển chế độ hoặc nội dung thay đổi
  useEffect(() => {
    if (!isMarkdownMode && editorRef.current && formData.content) {
      if (editorRef.current.innerHTML !== formData.content) {
        editorRef.current.innerHTML = formData.content;
        const hasContent =
          formData.content &&
          formData.content !== "<br>" &&
          formData.content !== "<div><br></div>" &&
          formData.content !== "<p><br></p>";
        setShowPlaceholder(!hasContent);
      }
    }
  }, [isMarkdownMode, formData.content]);

  const handleBackToChapters = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?"
      );
      if (!confirmLeave) return;
    }
    router.push(`/author/story/${storyId}/chapters`);
  };

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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = () => {
    const hasActualData = formData.title?.trim() || formData.content?.trim();

    if (!hasActualData) {
      toast.info("Không có nội dung để lưu nháp");
      return;
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
      setHasUnsavedChanges(false);
      toast.success("Đã lưu nháp thành công!");
    } catch (e) {
      console.error("Failed to save draft to local storage", e);
      toast.error("Lỗi khi lưu nháp");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề chương");
      return;
    }

    if (formData.title.length > LIMITS.TITLE) {
      toast.error(`Tiêu đề không được vượt quá ${LIMITS.TITLE} ký tự`);
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Vui lòng nhập nội dung chương");
      return;
    }

    if (formData.content.length > LIMITS.CONTENT) {
      toast.error(`Nội dung không được vượt quá ${LIMITS.CONTENT} ký tự`);
      return;
    }

    setIsSubmitting(true);
    try {
      await chapterService.createChapter(storyId, {
        title: formData.title,
        content: formData.content,
        languageCode: formData.languageCode,
      });

      // Xóa draft sau khi tạo thành công
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setHasUnsavedChanges(false);

      toast.success("Tạo chương mới thành công!");
      router.push(`/author/story/${storyId}/chapters`);
    } catch (error: any) {
      console.error("Error creating chapter:", error);
      toast.error(error.message || "Có lỗi xảy ra khi tạo chương");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.title.trim() &&
    formData.content.trim() &&
    formData.title.length <= LIMITS.TITLE &&
    formData.content.length <= LIMITS.CONTENT;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
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
                  <span
                    className={`text-xs ${
                      characterCounts.title > LIMITS.TITLE
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {characterCounts.title}/{LIMITS.TITLE}
                  </span>
                </div>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Chương 1: Khởi đầu mới"
                  required
                  disabled={isSubmitting}
                  className={`border-2 ${
                    characterCounts.title > LIMITS.TITLE
                      ? "border-red-500 focus-visible:border-red-500"
                      : "border-primary/30 focus-visible:border-primary"
                  }`}
                  maxLength={LIMITS.TITLE}
                />
                {characterCounts.title > LIMITS.TITLE && (
                  <p className="text-xs text-red-500">
                    Tiêu đề không được vượt quá {LIMITS.TITLE} ký tự
                  </p>
                )}
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="languageCode">Ngôn ngữ</Label>
                <Select
                  value={formData.languageCode}
                  onValueChange={(
                    value: "vi-VN" | "en-US" | "zh-CN" | "ja-JP"
                  ) => handleSelectChange("languageCode", value)}
                  disabled={isSubmitting}
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
              </div>

              {/* Editor Mode Toggle */}
              <div className="space-y-2">
                <Label>Chế độ soạn thảo</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isMarkdownMode ? "default" : "outline"}
                    size="sm"
                    onClick={handleSwitchToMarkdown}
                    disabled={isSubmitting}
                  >
                    Markdown Mode
                  </Button>
                  <Button
                    type="button"
                    variant={!isMarkdownMode ? "default" : "outline"}
                    size="sm"
                    onClick={handleSwitchToRichText}
                    disabled={isSubmitting}
                  >
                    Rich Text Editor
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isMarkdownMode
                    ? "Đang sử dụng Markdown - định dạng văn bản bằng ký tự"
                    : "Đang sử dụng trình soạn thảo trực quan - định dạng bằng công cụ"}
                </p>

                {isMarkdownMode && (
                  <div className="p-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <strong>Bạn đang ở chế độ Markdown.</strong> Định dạng
                          văn bản bằng các ký tự đặc biệt.
                          <button
                            onClick={() => setShowMarkdownHelp(true)}
                            className="ml-1 text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            Nhấp vào đây để xem hướng dẫn
                          </button>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSwitchToRichText}
                        className="text-blue-600 hover:text-blue-800 h-8 px-2"
                      >
                        Chuyển sang Rich Text
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content */}
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="content">Nội dung</Label>
                  <span
                    className={`text-xs ${
                      characterCounts.content > LIMITS.CONTENT
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {characterCounts.content}/{LIMITS.CONTENT}
                  </span>
                </div>

                {/* Rich Text Toolbar - hiển thị khi KHÔNG ở chế độ Markdown */}
                {!isMarkdownMode && (
                  <div className="border rounded-lg p-3 bg-muted/20">
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleBold}
                        title="In đậm"
                        className="h-8 w-8 p-0"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleItalic}
                        title="In nghiêng"
                        className="h-8 w-8 p-0"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleStrikethrough}
                        title="Gạch ngang"
                        className="h-8 w-8 p-0"
                      >
                        <Strikethrough className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleHeading(1)}
                        title="Tiêu đề 1"
                        className="h-8 px-2"
                      >
                        H1
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleHeading(2)}
                        title="Tiêu đề 2"
                        className="h-8 px-2"
                      >
                        H2
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleHeading(3)}
                        title="Tiêu đề 3"
                        className="h-8 px-2"
                      >
                        H3
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleList("bullet")}
                        title="Danh sách không thứ tự"
                        className="h-8 w-8 p-0"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleList("number")}
                        title="Danh sách có thứ tự"
                        className="h-8 px-2"
                      >
                        1.
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleQuote}
                        title="Trích dẫn"
                        className="h-8 w-8 p-0"
                      >
                        <Quote className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Bôi đen văn bản trước khi nhấn nút định dạng
                    </div>
                  </div>
                )}

                {/* Editor Area */}
                {!isMarkdownMode ? (
                  // Rich Text Editor (contentEditable div) với placeholder
                  <div className="relative">
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={handleEditorInput}
                      onFocus={handleEditorFocus}
                      onBlur={handleEditorBlur}
                      onPaste={handleEditorPaste}
                      className={`min-h-[400px] resize-y border-2 p-3 rounded-md overflow-auto ${
                        characterCounts.content > LIMITS.CONTENT
                          ? "border-red-500 focus-visible:border-red-500"
                          : "border-primary/30 focus-visible:border-primary"
                      }`}
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
                  // Markdown Editor (Textarea)
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Nhập nội dung chương tại đây..."
                    className={`min-h-[400px] resize-y border-2 ${
                      characterCounts.content > LIMITS.CONTENT
                        ? "border-red-500 focus-visible:border-red-500"
                        : "border-primary/30 focus-visible:border-primary"
                    }`}
                    disabled={isSubmitting}
                    required
                    maxLength={LIMITS.CONTENT}
                  />
                )}

                {characterCounts.content > LIMITS.CONTENT && (
                  <p className="text-xs text-red-500">
                    Nội dung không được vượt quá {LIMITS.CONTENT} ký tự
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Số từ ước tính:{" "}
                  {Math.ceil(
                    formData.content
                      .split(/\s+/)
                      .filter((word) => word.length > 0).length
                  )}{" "}
                  từ
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3 flex-wrap">
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

                <Button
                  type="button"
                  onClick={handleSaveDraft}
                  variant="outline"
                  disabled={
                    isSubmitting ||
                    !(formData.title?.trim() || formData.content?.trim())
                  }
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Lưu nháp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToChapters}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              </div>

              {hasUnsavedChanges && (
                <Alert className="mt-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm">
                    Bạn có thay đổi chưa lưu. Nhấn <strong>"Lưu nháp"</strong>{" "}
                    để lưu lại.
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="mt-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  Sau khi tạo, chương sẽ ở trạng thái <strong>bản nháp</strong>.
                  Bạn có thể chỉnh sửa và gửi cho AI đánh giá sau.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Markdown Help Dialog */}
      {showMarkdownHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Hướng dẫn Markdown</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMarkdownHelp(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Cú pháp định dạng văn bản bằng Markdown
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Tiêu đề</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <code># Tiêu đề 1</code>
                      <span className="text-muted-foreground">H1</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <code>## Tiêu đề 2</code>
                      <span className="text-muted-foreground">H2</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <code>### Tiêu đề 3</code>
                      <span className="text-muted-foreground">H3</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Định dạng văn bản</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <code>**in đậm**</code>
                      <span className="font-bold">in đậm</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <code>*in nghiêng*</code>
                      <span className="italic">in nghiêng</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <code>~~gạch ngang~~</code>
                      <span className="line-through">gạch ngang</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Danh sách</h3>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-muted/50 rounded">
                      <code className="block">- Mục 1</code>
                      <code className="block">- Mục 2</code>
                      <code className="block">- Mục 3</code>
                      <span className="text-muted-foreground mt-1 block">
                        Danh sách không thứ tự
                      </span>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <code className="block">1. Mục 1</code>
                      <code className="block">2. Mục 2</code>
                      <code className="block">3. Mục 3</code>
                      <span className="text-muted-foreground mt-1 block">
                        Danh sách có thứ tự
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Trích dẫn</h3>
                  <div className="p-2 bg-muted/50 rounded text-sm">
                    <code>{"> Đây là trích dẫn"}</code>
                    <div className="mt-2 p-2 border-l-4 border-muted-foreground bg-background">
                      <span className="text-muted-foreground">
                        Đây là trích dẫn
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="border-t p-4 bg-muted/20">
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowMarkdownHelp(false)}
                  className="min-w-[100px]"
                >
                  Đã hiểu
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
