// app/author/story/[id]/chapter/[chapterId]/view/page.tsx
/**
 * TRANG XEM CHƯƠNG TRUYỆN (CHẾ ĐỘ READONLY - VIEW ONLY)
 *
 * MỤC ĐÍCH:
 * - Hiển thị chi tiết chương truyện ở chế độ chỉ xem, không chỉnh sửa được
 * - Tập trung vào việc trình bày thông tin đầy đủ cho tác giả review
 *
 * CHỨC NĂNG CHÍNH:
 * 1. Hiển thị đầy đủ thông tin chương (tiêu đề, số chương, trạng thái, số từ/ký tự, ngày tạo/xuất bản)
 * 2. Tự động phát hiện và hiển thị định dạng nội dung (HTML, Markdown, Plain text)
 * 3. Hiển thị kết quả đánh giá AI với component AiModerationReport
 * 4. Tích hợp tính năng Voice AI (chỉ cho tác giả từ rank Bronze trở lên)
 * 5. Cho phép tải xuống nội dung chương dưới dạng file .txt
 * 6. Hiển thị thông tin kiểm duyệt từ Content Moderator
 *
 * ĐẶC ĐIỂM KHÁC BIỆT VỚI TRANG EDIT:
 * - Không có chức năng chỉnh sửa
 * - Có thêm tính năng Voice AI player
 * - Có thể tải xuống nội dung
 * - Hiển thị ribbon trạng thái trực quan
 *
 * ĐỐI TƯỢNG SỬ DỤNG: Tác giả (Author) muốn xem lại chương đã xuất bản hoặc đang chờ duyệt
 * LIÊN KẾT VỚI FILE KHÁC:
 * - Sử dụng `chapterService`, `profileService`, `voiceChapterService`
 * - Sử dụng component `VoiceChapterPlayer` và `AiModerationReport`
 * - Kế thừa UI components từ shadcn/ui
 */
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
  Gem,
  UserCheck,
} from "lucide-react";
import { chapterService } from "@/services/chapterService";
import type { ChapterDetails } from "@/services/apiTypes";
import { toast } from "sonner";
import VoiceChapterPlayer from "@/components/author/VoiceChapterPlayer";
import { profileService } from "@/services/profileService";
import { voiceChapterService } from "@/services/voiceChapterService";
import { AiModerationReport } from "@/components/AiModerationReport";
// Base URL cho R2 bucket (Cloudflare R2 storage) - nơi lưu file content
const R2_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev";

/**
 * HÀM TRÍCH XUẤT PHẦN TIẾNG VIỆT TỪ AI FEEDBACK
 *
 * MỤC ĐÍCH: AI feedback có thể chứa nhiều ngôn ngữ, cần lấy phần tiếng Việt
 * LOGIC: Tìm marker "Tiếng Việt:" và lấy phần sau đó
 * INPUT: feedback string (có thể null)
 * OUTPUT: string phần tiếng Việt hoặc null nếu không tìm thấy
 * VÍ DỤ: "English: Good. Tiếng Việt: Tốt." → "Tốt."
 */
const extractVietnameseFeedback = (feedback: string | null): string | null => {
  if (!feedback) return null;

  const vietnameseIndex = feedback.indexOf("Tiếng Việt:");
  if (vietnameseIndex !== -1) {
    return feedback.substring(vietnameseIndex + "Tiếng Việt:".length).trim();
  }

  return feedback; // Nếu không có marker, trả về toàn bộ
};

/**
 * CUSTOM COMPONENTS CHO REACT-MARKDOWN
 *
 * MỤC ĐÍCH: Style các thẻ markdown thành giao diện đẹp hơn
 * LOGIC: Mỗi component nhận props và trả về JSX với className tương ứng
 * SỬ DỤNG: Truyền vào ReactMarkdown thông qua prop "components"
 */
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

/**
 * HÀM PHÁT HIỆN NỘI DUNG CÓ PHẢI LÀ MARKDOWN KHÔNG
 *
 * MỤC ĐÍCH: Xác định định dạng nội dung để render phù hợp
 * LOGIC: Kiểm tra các pattern đặc trưng của Markdown bằng regex
 * PATTERNS KIỂM TRA:
 * - **bold**, *italic*, ~~strikethrough~~
 * - Headers (#, ##, ###)
 * - Lists (-, 1., 2.)
 * - Blockquotes (>)
 * - Links [text](url)
 *
 * INPUT: content string
 * OUTPUT: boolean (true nếu là markdown)
 */
const isMarkdownContent = (content: string): boolean => {
  if (!content) return false;

  const markdownPatterns = [
    /\*\*.+?\*\*/, // **bold**
    /\*.+?\*/, // *italic*
    /~~.+?~~/, // ~~strikethrough~~
    /^#+\s+.+/m, // headers (#, ##, ###)
    /^-\s+.+/m, // unordered lists
    /^\d+\.\s+.+/m, // ordered lists
    /^>\s+.+/m, // blockquotes
    /\[.+\]\(.+\)/, // links
  ];
  // Nếu có bất kỳ pattern nào match → là markdown
  return markdownPatterns.some((pattern) => pattern.test(content));
};

/**
 * HÀM PHÁT HIỆN NỘI DUNG CÓ PHẢI LÀ HTML TỪ RICH TEXT EDITOR
 *
 * MỤC ĐÍCH: Phân biệt HTML từ editor với plain text/markdown
 * LOGIC: Kiểm tra sự tồn tại của các thẻ HTML cơ bản
 * PATTERNS: Các thẻ HTML phổ biến từ Rich Text Editor (div, p, br, strong, etc.)
 *
 * INPUT: content string
 * OUTPUT: boolean (true nếu là HTML)
 */
const isHTMLContent = (content: string): boolean => {
  if (!content) return false;
  // Các thẻ HTML phổ biến từ Rich Text Editor
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
  // Nếu có thẻ HTML hoặc thẻ đóng → là HTML
  return hasHTMLTag || hasClosingTag;
};

/**
 * HÀM HIỂN THỊ NỘI DUNG HTML TỪ RICH TEXT EDITOR
 *
 * MỤC ĐÍCH: Render HTML content an toàn với dangerouslySetInnerHTML
 * LOGIC: Sử dụng dangerouslySetInnerHTML nhưng đã được xác nhận an toàn từ backend
 * CẢNH BÁO: Chỉ dùng với nội dung đã được sanitize từ backend
 *
 * INPUT: HTML content string
 * OUTPUT: JSX element với HTML rendered
 */
const renderHTMLContent = (content: string) => {
  return (
    <div
      className="rich-text-content prose prose-lg max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
      dangerouslySetInnerHTML={{
        __html: content,
      }}
      style={{
        whiteSpace: "pre-wrap", // Giữ ngắt dòng
        wordWrap: "break-word", // Giữ ngắt dòng
      }}
    />
  );
};

/**
 * HÀM HIỂN THỊ NỘI DUNG VỚI ĐỊNH DẠNG PHÙ HỢP
 *
 * MỤC ĐÍCH: Tự động detect và render nội dung theo đúng format
 * LOGIC PHÂN LOẠI ƯU TIÊN:
 * 1. HTML → từ rich text editor (ưu tiên cao nhất)
 * 2. Markdown → có các pattern đặc trưng
 * 3. Plain text → cuối cùng nếu không phải 2 loại trên
 *
 * INPUT: content string
 * OUTPUT: JSX element được render phù hợp
 */
const renderContent = (content: string) => {
  // Ưu tiên 1: Kiểm tra HTML (từ rich text editor)
  if (isHTMLContent(content)) {
    return renderHTMLContent(content);
    // Ưu tiên 2: Kiểm tra Markdown
  } else if (isMarkdownContent(content)) {
    return (
      <div className="max-w-none">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    );
    // Cuối cùng: Plain text
  } else {
    // Chia thành các đoạn văn (paragraphs) dựa trên \n\n
    const paragraphs = content.split("\n\n").filter((p) => p.trim().length > 0);

    return (
      <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-4">
            {/* Xử lý ngắt dòng trong đoạn văn (\n → <br/>) */}
            {paragraph.split("\n").map((line, lineIndex, lines) => (
              <span key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 && <br />}{" "}
                {/* Thêm <br> nếu không phải dòng cuối */}
              </span>
            ))}
          </p>
        ))}
      </div>
    );
  }
};
/**
 * COMPONENT CHÍNH: AuthorChapterViewPage
 *
 * MỤC ĐÍCH: Trang xem chương ở chế độ readonly
 * KHÁC BIỆT VỚI TRANG EDIT:
 * - Không có chức năng edit
 * - Có thể mua voice AI
 * - Có ribbon trạng thái đẹp
 */
export default function AuthorChapterViewPage() {
  // Lấy params từ URL
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const chapterId = params.chapterId as string;
  // STATE QUẢN LÝ
  const [authorRank, setAuthorRank] = useState<string>("Casual"); // Rank của tác giả
  const [rankLoading, setRankLoading] = useState(true); // Đang tải rank
  const [chapter, setChapter] = useState<ChapterDetails | null>(null); // Dữ liệu chapter
  const [chapterContent, setChapterContent] = useState<string | null>(null); // Nội dung chapter
  const [isLoading, setIsLoading] = useState(true); // Đang tải chính

  const [isLoadingContent, setIsLoadingContent] = useState(false); // Đang tải content
  const [voicePrice, setVoicePrice] = useState<number | null>(null); // Giá voice AI

  /**
   * HÀM XỬ LÝ LỖI API THỐNG NHẤT (giống file edit)
   *
   * MỤC ĐÍCH: Xử lý lỗi từ API response theo cấu trúc thống nhất
   * FLOW: Tương tự hàm trong file edit
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
   * useEffect 1: LẤY RANK CỦA TÁC GIẢ
   *
   * MỤC ĐÍCH: Xác định quyền sử dụng tính năng Audio AI
   * LOGIC: Chỉ tác giả từ rank Bronze trở lên mới được dùng Voice AI
   * DEPENDENCIES: [] → chỉ chạy 1 lần khi component mount
   */
  useEffect(() => {
    profileService.getAuthorRank().then((rank) => {
      setAuthorRank(rank);
      setRankLoading(false);
    });
  }, []);
  /**
   * useEffect 2: TẢI THÔNG TIN CHƯƠNG KHI storyId HOẶC chapterId THAY ĐỔI
   *
   * MỤC ĐÍCH: Load dữ liệu chapter khi vào trang hoặc chuyển chapter
   * DEPENDENCIES: [storyId, chapterId] → chạy lại khi ID thay đổi
   */
  useEffect(() => {
    loadChapter();
  }, [storyId, chapterId]);

  /**
   * HÀM TẢI THÔNG TIN CHƯƠNG CHÍNH
   *
   * MỤC ĐÍCH: Load tất cả dữ liệu liên quan đến chapter
   * LOGIC ƯU TIÊN TẢI NỘI DUNG:
   * 1. Lấy thông tin chương từ API (metadata)
   * 2. Lấy giá voice AI nếu có
   * 3. Tải nội dung: ưu tiên từ database, fallback từ contentPath
   */
  const loadChapter = async () => {
    setIsLoading(true);
    try {
      // --- (1) Lấy thông tin chương ---
      const chapterData = await chapterService.getChapterDetails(
        storyId,
        chapterId
      );
      setChapter(chapterData);

      // Đoạn này chèn vào giữa lúc lấy thông tin chương và lúc xử lý nội dung
      // --- (2) Lấy thông tin voice AI ---
      const voiceData = await voiceChapterService
        .getVoiceChapter(chapterId)
        .catch(() => null); // Bắt lỗi nếu không có voice
      setVoicePrice(voiceData?.voices?.[0]?.priceDias ?? null);

      // --- (3) Tải nội dung với logic ưu tiên ---
      // ƯU TIÊN 1: Nội dung từ database
      if (chapterData.content) {
        setChapterContent(chapterData.content);
        // ƯU TIÊN 2: Nội dung từ file (contentPath)
      } else if (chapterData.contentPath) {
        await loadChapterContent(chapterData.contentPath);
        // Không có nội dung
      } else {
        setChapterContent("");
      }
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải thông tin chương");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * HÀM TẢI NỘI DUNG CHƯƠNG TỪ FILE (contentPath)
   *
   * MỤC ĐÍCH: Load content từ external storage (R2 bucket) thông qua API proxy
   * LOGIC:
   * 1. Gọi API proxy `/api/chapter-content` với path parameter
   * 2. Xử lý HTTP errors (404, 500, etc.)
   * 3. Fallback về content trong DB nếu file không tìm thấy
   *
   * INPUT: contentPath (string) - đường dẫn file trong storage
   */
  const loadChapterContent = async (contentPath: string) => {
    setIsLoadingContent(true);
    try {
      // Gọi API proxy để lấy nội dung từ file (tránh CORS)
      const apiUrl = `/api/chapter-content?path=${encodeURIComponent(
        contentPath
      )}`;

      const response = await fetch(apiUrl);
      // Xử lý HTTP errors
      if (!response.ok) {
        // Nếu 404 và có nội dung trong DB → dùng nội dung DB
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
      // Xử lý lỗi từ API response
      if (data.error) {
        throw new Error(data.error);
      }
      // Cập nhật nội dung
      setChapterContent(data.content);
    } catch (error: any) {
      console.error("Error loading chapter content:", error);
      // Xử lý các loại lỗi
      if (
        error.message.includes("404") ||
        error.message.includes("not found") ||
        error.message.includes("Không tìm thấy")
      ) {
        // Fallback về nội dung trong database
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

  /**
   * HÀM TẢI NỘI DUNG CHƯƠNG VỀ MÁY
   *
   * MỤC ĐÍCH: Export nội dung chương thành file .txt để download
   * LOGIC:
   * 1. Tạo Blob từ nội dung với type "text/plain"
   * 2. Tạo URL object từ Blob
   * 3. Tạo thẻ <a> ẩn để trigger download
   * 4. Cleanup sau khi download
   */
  const handleDownloadContent = () => {
    if (!chapterContent || !chapter) return;

    // Tạo blob từ nội dung với MIME type text/plain
    const blob = new Blob([chapterContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Tạo thẻ a ẩn để trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chapter.title}.txt` || `chapter-${chapter.chapterNo}.txt`;
    document.body.appendChild(a);
    a.click(); // Trigger download

    // Dọn dẹp DOM và revoke URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  /**
   * HÀM ĐIỀU HƯỚNG QUAY LẠI DANH SÁCH CHƯƠNG
   */
  const handleBackToChapters = () => {
    router.push(`/author/story/${storyId}/chapters`);
  };
  /**
   * HÀM ĐIỀU HƯỚNG QUAY LẠI TRANG TRUYỆN
   */
  const handleBackToStory = () => {
    router.push(`/author/story/${storyId}`);
  };
  /**
   * HIỂN THỊ LOADING SPINNER KHI ĐANG TẢI DỮ LIỆU CHÍNH
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /**
   * HIỂN THỊ THÔNG BÁO NẾU KHÔNG TÌM THẤY CHƯƠNG
   */
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
  /**
   * TRÍCH XUẤT PHẦN TIẾNG VIỆT TỪ AI FEEDBACK
   */
  const vietnameseFeedback = chapter
    ? extractVietnameseFeedback(chapter.aiFeedback ?? null)
    : null;

  /**
   * HÀM XÁC ĐỊNH LOẠI NỘI DUNG ĐỂ HIỂN THỊ THÔNG BÁO
   *
   * MỤC ĐÍCH: Hiển thị cho user biết content đang được render ở chế độ nào
   * OUTPUT: String mô tả định dạng content
   */
  const getContentType = () => {
    if (!chapterContent) return "";
    if (isMarkdownContent(chapterContent))
      return "Đang hiển thị ở chế độ Markdown";
    if (isHTMLContent(chapterContent))
      return "Đang hiển thị ở chế độ Rich Text";
    return "Đang hiển thị ở chế độ văn bản thuần";
  };
  // RENDER GIAO DIỆN CHÍNH
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* HEADER với nút quay lại */}
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
      {/* CARD THÔNG TIN CHƯƠNG với ribbon trạng thái */}
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
                      // HIỆN CHỮ BÌNH THƯỜNG  KHI ĐÃ CÓ
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {chapter.mood.name}
                        </span>
                        <span className="text-xs text-slate-400 font-normal ">
                          ({chapter.mood.code})
                        </span>
                      </div>
                    )}
                  </div>
                </CardDescription>
              </div>
            </div>

            {/* === PHẦN RUY BĂNG (RIBBON) === */}
            {(() => {
              // Cấu hình mặc định: Bản nháp
              let statusConfig = {
                label: "Bản nháp",
                bgColor: "bg-slate-500",
                shadowColor: "text-slate-700",
                Icon: FileText,
              };
              // Thay đổi cấu hình theo trạng thái
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
                    // CSS clip-path tạo hình ruy băng (đuôi cá)
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
        {/* Nội dung chi tiết chương - 3 cột */}
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
                {chapter?.accessType === "free" ? "Miễn phí" : "Trả phí"}
              </p>
            </div>
          </div>

          {/* === CỘT 3 === */}
          <div className="space-y-6">
            {/* 1. Giá chương truyện */}
            <div>
              <p className="text-sm text-slate-400 mb-1">
                Giá cho 1 chương nếu mất phí
              </p>

              <div className="font-medium flex items-center gap-1">
                {chapter?.priceDias}{" "}
                <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
              </div>
            </div>

            {/* 2. Giá bán Voice Audio AI */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Giá bán Audio AI</p>
              <div className="font-medium min-h-[24px] flex items-center">
                {voicePrice !== null ? (
                  <span className="flex items-center gap-1">
                    {voicePrice}{" "}
                    <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                  </span>
                ) : (
                  // Nếu không thì hiện text
                  "Chưa có audio"
                )}
              </div>
            </div>
            {/* Trạng thái AI  */}
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

      {/* AI Assessment - Sử dụng AiModerationReport để đồng bộ UI */}
      {chapter && (chapter.aiScore !== undefined || chapter.aiFeedback) && (
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
            {/* 1. Thanh hiển thị điểm số AI (Giữ lại giao diện cũ) */}
            {chapter.aiScore != null && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-sm">Điểm AI:</span>
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
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        chapter.aiScore >= 7 ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${(chapter.aiScore / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Sử dụng component mới để hiển thị Feedback (khối đặc) và Vi phạm chi tiết */}
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
                        : "KHÔNG CÓ "}
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
