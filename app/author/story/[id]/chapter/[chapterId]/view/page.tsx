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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  XCircle,
  Globe,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { chapterService } from "@/services/chapterService";
import type { ChapterDetails } from "@/services/apiTypes";
import { toast } from "sonner";
import VoiceChapterPlayer from "@/components/author/VoiceChapterPlayer";
import { profileService } from "@/services/profileService";

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
  const [authorRank, setAuthorRank] = useState<string>("Casual");
  const [rankLoading, setRankLoading] = useState(true);
  const [chapter, setChapter] = useState<ChapterDetails | null>(null);
  const [chapterContent, setChapterContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isLoadingContent, setIsLoadingContent] = useState(false);
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

  useEffect(() => {
    profileService.getAuthorRank().then((rank) => {
      setAuthorRank(rank);
      setRankLoading(false);
    });
  }, []);
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
      // } catch (error: any) {
      //   console.error("Error loading chapter:", error);
      //   toast.error(error.message || "Không thể tải thông tin chương");
      // } finally {
      //   setIsLoading(false);
      // }
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải thông tin chương");
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
            Chế độ xem - Không thể chỉnh sửa nội dung nhưng có thể mua voice AI
            cho chap
          </p>
        </div>
      </div>
      {/* Chapter Info */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pt-0 pb-2">
          <div className="flex items-start justify-between">
            <div className="w-full pr-24">
              <div className="space-y-1">
                {/* Dòng Tên chương */}
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="text-base font-normal text-slate-400">
                    Tên chương:
                  </span>
                  <span>{chapter?.title}</span>
                </CardTitle>
                {/* Dòng Số chương */}
                <CardDescription className="flex items-center gap-2 text-base">
                  <span className="text-slate-400">Số chương:</span>
                  <span className="text-l flex items-center gap-2">
                    {chapter?.chapterNo}
                  </span>
                </CardDescription>
              </div>
            </div>

            {/* === PHẦN RUY BĂNG (RIBBON) === */}
            {(() => {
              let statusConfig = {
                label: "Bản nháp",
                bgColor: "bg-slate-500",
                shadowColor: "text-slate-700",
                Icon: FileText,
              };

              if (chapter?.status === "published") {
                statusConfig = {
                  label: "Đã xuất bản",
                  bgColor: "bg-green-600",
                  shadowColor: "text-blue-800",
                  Icon: Globe,
                };
              } else if (chapter?.status === "pending") {
                statusConfig = {
                  label: "Chờ duyệt",
                  bgColor: "bg-yellow-500",
                  shadowColor: "text-yellow-700",
                  Icon: Clock,
                };
              } else if (chapter?.status === "rejected") {
                statusConfig = {
                  label: "Bị từ chối",
                  bgColor: "bg-red-600",
                  shadowColor: "text-red-800",
                  Icon: XCircle,
                };
              }

              return (
                <div className="absolute top-0 right-8 drop-shadow-md z-10">
                  <div
                    className={`
                      relative px-3 pt-3 pb-5 flex flex-col items-center justify-center gap-1 
                      text-white font-bold text-xs shadow-lg transition-all
                      ${statusConfig.bgColor}
                    `}
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

        {/* Đường kẻ phân cách */}
        <div className="w-full h-[1px] -mt-6 bg-[#00416a] dark:bg-[#f0ead6]" />

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
            {/* Xuất bản lúc */}
            {chapter?.publishedAt && (
              <div className="text-sm">
                <p className="text-slate-400 mb-1">Xuất bản lúc</p>
                <p>{new Date(chapter.publishedAt).toLocaleString("vi-VN")}</p>
              </div>
            )}
          </div>

          {/* === CỘT 2 === */}
          <div className="space-y-6">
            {/* Số kí tự */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Số kí tự</p>
              <p className="font-medium">{chapter?.charCount} kí tự</p>
            </div>
            {/* Ngôn ngữ */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Ngôn ngữ</p>
              <p className="font-medium">{chapter?.languageName}</p>
            </div>
            {/* Loại truy cập (Thêm vào cho giống mẫu) */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Loại truy cập</p>
              <p className="font-medium">
                {chapter?.accessType === "free"
                  ? "Miễn phí"
                  : "Trả phí (Kim cương)"}
              </p>
            </div>
          </div>

          {/* === CỘT 3 === */}
          <div className="space-y-6">
            {/* Giá */}
            <div>
              <p className="text-sm text-slate-400 mb-1">
                Giá cho 1 chương nếu mất phí (Dias)
              </p>
              <p className="font-medium">{chapter?.priceDias} Dias</p>
            </div>

            {/* Trạng thái AI (Thêm vào cho giống mẫu) */}
            {chapter?.aiResult && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Trạng thái AI</p>
                {(() => {
                  let statusConfig = {
                    label: "Đang chờ",
                    className: "bg-yellow-500 hover:bg-yellow-600 text-white",
                    Icon: Clock,
                  };

                  if (chapter.aiResult === "approved") {
                    statusConfig = {
                      label: "Đã duyệt",
                      className: "bg-green-500 hover:bg-green-600 text-white",
                      Icon: CheckCircle,
                    };
                  } else if (chapter.aiResult === "rejected") {
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
            {chapter.status === "pending" && (
              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription>
                  Chương đang chờ được Content mod đánh giá và duyệt
                </AlertDescription>
              </Alert>
            )}

            {chapter.status === "published" && (
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription>
                  Trạng thái: Chương đã được xuất bản thành công
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
