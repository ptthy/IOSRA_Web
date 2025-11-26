// app/author/story/[id]/chapter/[chapterId]/view/page.tsx
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
import {
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle,
  FileText,
  Star,
  MessageSquare,
  Download,
  Eye,
} from "lucide-react";
import { chapterService } from "@/services/chapterService";
import type { ChapterDetails } from "@/services/apiTypes";
import { toast } from "sonner";

// Base URL cho R2 bucket
const R2_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev";

// Hàm trích xuất phần tiếng Việt từ AI Feedback
const extractVietnameseFeedback = (feedback: string | null): string | null => {
  if (!feedback) return null;

  const vietnameseIndex = feedback.indexOf("Tiếng Việt:");
  if (vietnameseIndex !== -1) {
    return feedback.substring(vietnameseIndex + "Tiếng Việt:".length).trim();
  }

  return feedback;
};

// Custom components để style markdown
const markdownComponents = {
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

// Hàm phát hiện xem nội dung có phải là HTML từ Rich Text Editor không
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
    /<span[^>]*>/i,
    /<font[^>]*>/i,
    /<code[^>]*>/i,
    /<pre[^>]*>/i,
  ];

  const hasHTMLTag = htmlPatterns.some((pattern) => pattern.test(content));
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
  if (isHTMLContent(content)) {
    return renderHTMLContent(content);
  } else if (isMarkdownContent(content)) {
    return (
      <div className="max-w-none">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    );
  } else {
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

export default function AuthorChapterViewPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const chapterId = params.chapterId as string;

  const [chapter, setChapter] = useState<ChapterDetails | null>(null);
  const [chapterContent, setChapterContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

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

      // ƯU TIÊN SỬ DỤNG NỘI DUNG TỪ DATABASE TRƯỚC
      if (chapterData.content) {
        setChapterContent(chapterData.content);
      } else if (chapterData.contentPath) {
        await loadChapterContent(chapterData.contentPath);
      } else {
        setChapterContent("");
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

      const response = await fetch(apiUrl);

      if (!response.ok) {
        if (response.status === 404) {
          if (chapter?.content) {
            setChapterContent(chapter.content);
            return;
          } else {
            setChapterContent("");
            return;
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setChapterContent(data.content);
    } catch (error: any) {
      console.error("Error loading chapter content:", error);

      if (
        error.message.includes("404") ||
        error.message.includes("not found") ||
        error.message.includes("Không tìm thấy")
      ) {
        if (chapter?.content) {
          setChapterContent(chapter.content);
          toast.warning("Sử dụng nội dung từ database");
        } else {
          setChapterContent("");
          toast.warning("Chương chưa có nội dung");
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

  const handleBackToChapters = () => {
    router.push(`/author/story/${storyId}/chapters`);
  };

  const handleBackToStory = () => {
    router.push(`/author/story/${storyId}`);
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
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBackToStory}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại truyện
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Xem Chương</h1>
          <p className="text-muted-foreground">
            Chế độ xem - Không thể chỉnh sửa
          </p>
        </div>
        <Badge className="ml-auto bg-blue-500 hover:bg-blue-600 text-white border-none flex items-center gap-x-2 px-3 py-1.5 text-sm font-medium transition-all">
          <Eye className="h-4 w-4" />
          <span>Chỉ xem</span>
        </Badge>
      </div>

      {/* Chapter Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="w-full">
              <CardTitle className="text-xl">{chapter?.title}</CardTitle>
              <CardDescription>Chương {chapter?.chapterNo}</CardDescription>
            </div>
            <Badge
              variant={
                chapter.status === "published"
                  ? "default"
                  : chapter.status === "completed"
                  ? "default"
                  : chapter.status === "pending"
                  ? "secondary"
                  : "outline"
              }
            >
              {chapter.status === "published"
                ? "Đã xuất bản"
                : chapter.status === "completed"
                ? "Đã hoàn thành"
                : chapter.status === "pending"
                ? "Chờ duyệt"
                : "Bản nháp"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-x-4 gap-y-6">
          {/* Cột 1 */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Số từ</p>
              <p className="font-medium">{chapter?.wordCount} từ</p>
            </div>
            <div className="text-sm">
              <p className="text-slate-400 mb-1">Tạo lúc</p>
              <p>
                {chapter && new Date(chapter.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Cột 2 */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Số kí tự</p>
              <p className="font-medium">{chapter?.charCount} từ</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Ngôn ngữ</p>
              <p className="font-medium">{chapter?.languageName}</p>
            </div>
            {chapter.publishedAt && (
              <div className="text-sm">
                <p className="text-slate-400 mb-1">Xuất bản lúc</p>
                <p>{new Date(chapter.publishedAt).toLocaleString("vi-VN")}</p>
              </div>
            )}
          </div>

          {/* Cột 3 */}
          <div className="space-y-6">
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

      {/* Status Info */}
      <Card>
        {/* <CardHeader>
          <CardTitle>Trạng thái chương</CardTitle>
        </CardHeader> */}
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {chapter.status === "completed" && (
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription>
                  Chương đã hoàn thành và không thể chỉnh sửa
                </AlertDescription>
              </Alert>
            )}

            {chapter.status === "pending" && (
              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription>
                  Chương đang chờ được AI đánh giá và duyệt
                </AlertDescription>
              </Alert>
            )}

            {chapter.status === "published" && (
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription>
                  Chương đã được xuất bản thành công
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Nội dung chương
              </CardTitle>
              <CardDescription>{getContentType()}</CardDescription>
            </div>
            <div className="flex gap-2">
              {chapterContent && (
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
          </div>
        </CardHeader>
        <CardContent>
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
                  Chương chưa có nội dung
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
