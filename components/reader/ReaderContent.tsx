//components/reader/ReaderContent.tsx

/* 
 
 * 
 * MỤC ĐÍCH CHÍNH:
 * Component hiển thị nội dung chương truyện với hai chế độ đọc:
 * 1. Scroll Mode (cuộn dọc) - Hiển thị toàn bộ nội dung theo chiều dọc
 * 2. Book Mode (chế độ sách) - Hiển thị nội dung dạng trang sách với layout 2 cột
 * 
 * CHỨC NĂNG CHÍNH:
 * - Hiển thị nội dung chương ở các định dạng: HTML, Markdown, Plain text
 * - Áp dụng highlight (đánh dấu) lên nội dung văn bản
 * - Quản lý chế độ đọc (Scroll/Book) theo cài đặt người dùng
 * - Xử lý phân trang cho Book Mode (500 từ/trang)
 * - Điều hướng giữa các chương (prev/next chapter)
 * - Hiển thị thông tin chương (số chương, tiêu đề, ngày đăng, số từ)
 * - Áp dụng theme và cài đặt hiển thị (font, cỡ chữ, khoảng cách dòng)
 * - Tích hợp hệ thống highlight (tạo, xem, chỉnh sửa highlight)
 * 
 * COMPONENT CON:
 * - ContentRenderer: Sub-component xử lý render nội dung theo định dạng
 * 
 * DATA FLOW:
 * - Nhận dữ liệu từ parent component (Reader page)
 * - Nhận cài đặt từ ReaderSettings
 * - Quản lý state highlight cục bộ
 * - Gọi hàm onNavigate để điều hướng chương
 * 
 * KEY FEATURES:
 * - Text selection và highlight creation
 * - Highlight hover và click để chỉnh sửa
 * - CSS Column layout cho Book Mode
 * - Responsive design cho mobile/desktop
 * - Animation fade-in khi load content
 */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChapterDetail,
  ChapterSummary,
} from "@/services/chapterCatalogService";
import {
  ReaderSettings,
  Highlight,
  applyHighlightsToText,
  getHighlights,
} from "@/lib/readerSettings";
import { HighlightPopover } from "@/components/reader/HightLightPopover";
import HighlightTooltip from "@/components/reader/HighlightTooltip";
// --- START: ContentRenderer Logic ---
/**
 * Component xử lý render nội dung với hỗ trợ 3 định dạng: HTML, Markdown, Plain Text
 * ĐẶC BIỆT: Có tích hợp highlight (đánh dấu văn bản) trước khi render
 */
const ContentRenderer: React.FC<{
  content: string;
  className?: string;
  style?: React.CSSProperties;
  chapterId?: string;
  highlights: Highlight[]; // Nhận danh sách highlight từ component cha
}> = ({ content, className = "", style, chapterId, highlights }) => {
  const safeContent = content || "";

  /**
   * Hàm phát hiện loại nội dung dựa trên regex pattern:
   * - HTML: có chứa thẻ HTML (trừ comment)
   * - Markdown: có chứa cú pháp markdown (#, **, *, ~~, >, -, số.)
   * - Plain: văn bản thuần
   */
  const detectContentType = (text: string): "html" | "markdown" | "plain" => {
    if (!text) return "plain";
    const htmlRegex = /<(?!!--)[^>]*>/;
    if (htmlRegex.test(text)) return "html";
    const markdownRegex =
      /(^#{1,6}\s|\*\*.*\*\*|\*.*\*|~~.*~~|> |\- |\d\. |\[.*\]\(.*\))/;
    if (markdownRegex.test(text)) return "markdown";
    return "plain";
  };

  /**
   * QUAN TRỌNG: Áp dụng highlight vào text TRƯỚC KHI RENDER
   * Hàm applyHighlightsToText sẽ wrap các đoạn được highlight bằng <mark> và thêm class
   * Nếu có chapterId thì mới áp dụng highlight (vì highlight được lưu theo chapter)
   */
  const processedContent = chapterId
    ? applyHighlightsToText(safeContent, highlights)
    : safeContent;

  const contentType = detectContentType(processedContent);
  /**
   * Render HTML content - sử dụng dangerouslySetInnerHTML để chèn HTML trực tiếp
   * CẢNH BÁO: Chỉ dùng khi dữ liệu đã được làm sạch (sanitized)
   */
  const renderHTML = (html: string) => {
    return (
      <div
        className="html-content"
        dangerouslySetInnerHTML={{ __html: html }}
        style={style}
      />
    );
  };
  /**
   * Convert Markdown sang HTML bằng regex replace
   * Quy trình:
   * 1. Thay thế heading (# -> h1-h6)
   * 2. Thay thế bold/italic/strikethrough
   * 3. Xử lý blockquote
   * 4. Thêm <p> cho các đoạn chưa có thẻ block
   */
  const renderMarkdown = (markdown: string) => {
    const processed = markdown
      .replace(/^###### (.*$)/gim, "<h6>$1</h6>")
      .replace(/^##### (.*$)/gim, "<h5>$1</h5>")
      .replace(/^#### (.*$)/gim, "<h4>$1</h4>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/~~(.*?)~~/gim, "<del>$1</del>")
      .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
      .replace(/\n$/gim, "<br />")
      .split("\n\n")
      .map((paragraph) => {
        // Chỉ thêm <p> cho các đoạn chưa phải là heading hoặc blockquote
        if (!paragraph.match(/^<(\/)?(h[1-6]|blockquote)/)) {
          return `<p>${paragraph}</p>`;
        }
        return paragraph;
      })
      .join("");

    return renderHTML(processed);
  };

  /**
   * Switch-case xử lý 3 loại content khác nhau:
   * 1. HTML: render trực tiếp với highlight đã được áp dụng
   * 2. Markdown: convert -> HTML -> áp dụng highlight -> render
   * 3. Plain: thay \n bằng <br> -> áp dụng highlight -> render
   *
   * QUAN TRỌNG: Thêm [&_*]:!leading-[inherit] để đảm bảo line-height kế thừa
   * Điều này fix lỗi line-height bị override bởi thẻ <mark> của highlight
   */
  switch (contentType) {
    case "html":
      return (
        <div
          // CLASS QUAN TRỌNG: Đảm bảo tất cả element con kế thừa line-height

          className={`html-content ${className} [&_*]:!leading-[inherit]`}
          dangerouslySetInnerHTML={{ __html: processedContent }}
          style={style}
        />
      );

    case "markdown":
      const htmlFromMarkdown = renderMarkdown(safeContent);
      // Lấy HTML từ markdown rồi mới áp dụng highlight
      const finalHtml = applyHighlightsToText(
        htmlFromMarkdown.props.dangerouslySetInnerHTML.__html,
        highlights
      );
      return (
        <div
          // Plain text: thay newline bằng <br> để giữ format
          className={`markdown-content ${className} [&_*]:!leading-[inherit]`}
          dangerouslySetInnerHTML={{ __html: finalHtml }}
          style={style}
        />
      );

    case "plain":
    default:
      const plainWithBreaks = safeContent.replace(/\n/g, "<br />");
      const highlightedPlain = applyHighlightsToText(
        plainWithBreaks,
        highlights
      );
      return (
        <div
          // THÊM: [&_*]:!leading-[inherit]
          className={`plain-content ${className} [&_*]:!leading-[inherit]`}
          dangerouslySetInnerHTML={{ __html: highlightedPlain }}
          style={style}
        />
      );
  }
};
// --- END: ContentRenderer Logic ---
/**
 * Interface định nghĩa props cho ReaderContent
 * QUAN TRỌNG: Các props này được truyền từ Page/Container cha
 */
interface ReaderContentProps {
  content: string; // Nội dung chương
  chapterId: string; // ID chương hiện tại
  storyId: string; // ID truyện
  chapter: ChapterDetail; // Chi tiết chương
  allChapters: ChapterSummary[]; // Danh sách tất cả chương để navigation
  settings: ReaderSettings; // Cài đặt người dùng (font size, theme, mode)
  theme: any; // Theme object (màu sắc)
  onNavigate: (path: string, storyId?: string, chapterId?: string) => void; // Hàm điều hướng
  // Các hàm tiện ích từ component cha:
  formatDate: (date: string) => string;
  formatWordCount: (count: number) => string;
  getBorder: () => string; // Lấy màu border theo theme
}
/**
 * COMPONENT CHÍNH: ReaderContent
 * Chịu trách nhiệm:
 * 1. Hiển thị nội dung chương với 2 mode: Scroll và Book
 * 2. Quản lý highlight (tạo, hiển thị, chỉnh sửa)
 * 3. Xử lý navigation giữa các chương
 * 4. Áp dụng settings (font, line-height, theme)
 */
export const ReaderContent: React.FC<ReaderContentProps> = ({
  content,
  chapterId,
  storyId,
  chapter,
  allChapters,
  settings,
  theme,
  onNavigate,
  formatDate,
  formatWordCount,
  getBorder,
}) => {
  // STATE QUẢN LÝ TRANG (chỉ dùng cho Book Mode)
  const [currentPage, setCurrentPage] = useState(0);

  // ========== HIGHLIGHT STATES ==========
  // Tất cả state highlight được chuyển từ Page vào đây để xử lý cục bộ
  const [highlights, setHighlights] = useState<Highlight[]>([]); // Danh sách highlight của chương
  const [selectedText, setSelectedText] = useState(""); // Text đang được select
  const [selectionPosition, setSelectionPosition] = useState<{
    // Vị trí selection (cho popover)
    x: number;
    y: number;
  } | null>(null);
  const [showHighlightPopover, setShowHighlightPopover] = useState(false); // Hiển thị popover tạo highlight
  const [tooltipHighlight, setTooltipHighlight] = useState<Highlight | null>(
    null
  ); // Highlight đang hiển thị tooltip
  const [tooltipPosition, setTooltipPosition] = useState<{
    // Vị trí tooltip
    x: number;
    y: number;
  } | null>(null);
  const [hoveredHighlight, setHoveredHighlight] = useState<{
    // Highlight đang hover (hiện icon "i")
    id: string;
    position: { x: number; y: number };
  } | null>(null);

  // Load highlights ban đầu
  /**
   * EFFECT 1: Load highlights từ localStorage khi chapter thay đổi
   * Sử dụng hàm getHighlights từ readerSettings để lấy highlight theo chapterId
   */
  useEffect(() => {
    if (chapterId) {
      setHighlights(getHighlights(chapterId));
    }
  }, [chapterId]);

  // Handle Text Selection (Moved from Page)
  /**
   * EFFECT 2: Xử lý text selection để tạo highlight
   * Logic:
   * 1. Lắng nghe sự kiện mouseup/touchend trên document
   * 2. Lấy selection text từ window.getSelection()
   * 3. Nếu có text được chọn: hiển thị popover tại vị trí selection
   * 4. Nếu không có text và popover đang mở: giữ nguyên trạng thái
   * 5. Nếu không có text: reset state
   */
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        setSelectedText(text);
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          const position = {
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          };
          setSelectionPosition(position);
        }
        setShowHighlightPopover(true);
      } else if (!text && showHighlightPopover) {
        // Keep logic: Empty selection but popover open -> ignore
      } else {
        // Trường hợp đặc biệt: selection rỗng nhưng popover đang mở → giữ nguyên
        setSelectedText("");
        setSelectionPosition(null);
        setShowHighlightPopover(false);
      }
    };

    const container = document.querySelector(".reader-container-root"); // Scope listener nếu cần, ở đây dùng document cho chắc
    // Lắng nghe trên document để bắt selection toàn trang
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, [showHighlightPopover]);

  // Handle Highlight Hover (Tooltip)
  /**
   * EFFECT 3: Xử lý click vào highlight để EDIT
   * Logic:
   * 1. Khi click vào thẻ .highlight-mark (vùng được highlight)
   * 2. VÀ không click vào icon "i" (tránh conflict với hover tooltip)
   * 3. Lấy highlight ID → tìm highlight → mở popover edit
   */
  useEffect(() => {
    const handleMarkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest(".highlight-mark") as HTMLElement | null;

      // QUAN TRỌNG: Kiểm tra không click vào icon "i"
      if (mark && !target.closest(".highlight-info-icon")) {
        const id = mark.getAttribute("data-highlight-id");
        const hl = highlights.find((h) => h.id === id);
        if (hl) {
          setSelectedText(hl.text);
          const rect = mark.getBoundingClientRect();
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
          setShowHighlightPopover(true); // Mở popover với text hiện tại để edit
        }
      }
    };

    document.addEventListener("click", handleMarkClick);
    return () => document.removeEventListener("click", handleMarkClick);
  }, [highlights]);

  /**
   * EFFECT 4: Xử lý hover highlight để hiển thị icon "i"
   * CẢI TIẾN: Thêm timer delay 300ms trước khi ẩn icon
   * Mục đích: Người dùng có thời gian di chuột từ highlight sang icon
   */
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest(".highlight-mark") as HTMLElement | null;
      const icon = target.closest(".highlight-info-icon") as HTMLElement | null;

      if (mark || icon) {
        clearTimeout(hideTimer); // Nếu đang hover thì cancel timer ẩn
        const activeMark =
          mark ||
          (icon
            ? document.querySelector(
                `[data-highlight-id="${hoveredHighlight?.id}"]`
              )
            : null);

        if (activeMark) {
          const id = activeMark.getAttribute("data-highlight-id");
          if (id) {
            const rect = activeMark.getBoundingClientRect();
            setHoveredHighlight({
              id,
              position: { x: rect.right + 4, y: rect.top + rect.height / 2 },
            });
          }
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      // Thêm delay 300ms trước khi ẩn để người dùng kịp di chuyển chuột sang icon
      hideTimer = setTimeout(() => {
        setHoveredHighlight(null);
      }, 300);
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [hoveredHighlight?.id]);

  // ========== BOOK MODE LOGIC ==========
  /**
   * Tính toán phân trang cho Book Mode:
   * - wordsPerPage: 500 từ/trang (có thể điều chỉnh)
   * - totalPages: tổng số trang = tổng từ / wordsPerPage (làm tròn lên)
   */
  const wordsPerPage = 500;
  const words = (content || "").split(/\s+/);
  const totalPages = Math.ceil(words.length / wordsPerPage);
  /**
   * Hàm lấy nội dung cho trang cụ thể (Book Mode)
   * Tính theo index từ start đến end dựa trên wordsPerPage
   */
  const getPageContent = (pageIndex: number) => {
    const start = pageIndex * wordsPerPage;
    const end = start + wordsPerPage;
    return words.slice(start, end).join(" ");
  };
  /**
   * Map font family từ setting string sang CSS font stack
   */
  const fontFamilyMap: Record<string, string> = {
    serif: "'Times New Roman', Times, serif",
    "sans-serif": "'Poppins', Arial, sans-serif",
  };
  /**
   * Tạo style object dựa trên settings người dùng
   * QUAN TRỌNG: Style này được áp dụng cho toàn bộ nội dung
   */
  const readerStyle = {
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    fontFamily: fontFamilyMap[settings.fontFamily] || fontFamilyMap.serif,
    color: theme.text,
  };
  /**
   * Xác định theme type để áp dụng style background
   */
  const isDarkTheme = settings.theme === "dark-blue";
  const isTransparent = settings.theme === "transparent";

  /**
   * Hàm tìm chương trước/sau dựa trên chapterNo
   * Logic:
   * 1. Sort danh sách chương theo chapterNo
   * 2. Tìm index của chương hiện tại
   * 3. Lấy chương ở index-1 (prev) và index+1 (next)
   */
  const getAdjacentChapters = () => {
    if (!chapter || allChapters.length === 0) return { prev: null, next: null };
    const sorted = [...allChapters].sort((a, b) => a.chapterNo - b.chapterNo);
    const idx = sorted.findIndex((ch) => ch.chapterId === chapterId);
    return {
      prev: idx > 0 ? sorted[idx - 1] : null,
      next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
    };
  };
  const { prev: prevChapter, next: nextChapter } = getAdjacentChapters();

  return (
    <div className="reader-container-root w-full">
      {/* ========== POPOVERS & TOOLTIPS ========== */}

      {/* Popover tạo/sửa highlight */}
      {showHighlightPopover && selectionPosition && (
        <HighlightPopover
          selectedText={selectedText}
          chapterId={chapterId}
          position={selectionPosition}
          onHighlightCreated={() => {
            // Khi tạo highlight thành công:
            // 1. Reload highlights từ localStorage
            const newHighlights = getHighlights(chapterId);
            setHighlights(newHighlights);
            // 2. Reset selection state
            setSelectedText("");
            setSelectionPosition(null);
            setShowHighlightPopover(false);
            // 3. Clear browser selection
            if (window.getSelection) window.getSelection()?.removeAllRanges();
          }}
          onClose={() => {
            // Đóng popover không tạo highlight
            setShowHighlightPopover(false);
            setSelectedText("");
            setSelectionPosition(null);
          }}
        />
      )}
      {/* Icon "i" hiển thị khi hover vào highlight */}
      {hoveredHighlight && !tooltipHighlight && (
        <div
          className="highlight-info-icon fixed z-[9998] cursor-pointer transition-all duration-200 hover:scale-110"
          style={{
            left: hoveredHighlight.position.x,
            top: hoveredHighlight.position.y,
            transform: "translate(0, -50%)",
          }}
          onClick={() => {
            // Khi click icon "i": mở tooltip với thông tin highlight
            const hl = highlights.find((h) => h.id === hoveredHighlight.id);
            if (hl) {
              setTooltipHighlight(hl);
              setTooltipPosition(hoveredHighlight.position);
              setHoveredHighlight(null);
            }
          }}
        >
          <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
            {/* Icon Info */}
            <span className="text-xs font-bold">i</span>
          </div>
        </div>
      )}
      {/* Tooltip hiển thị chi tiết highlight */}
      <HighlightTooltip
        highlight={tooltipHighlight}
        position={tooltipPosition}
        chapterId={chapterId} // Truyền chapterId để tooltip có thể xóa highlight
        onClose={() => {
          setTooltipHighlight(null);
          setTooltipPosition(null);
        }}
        onRefresh={() => {
          // Cập nhật lại danh sách highlight (sau khi xóa)
          const updated = getHighlights(chapterId);
          setHighlights(updated);
        }}
        // QUAN TRỌNG: Hàm edit từ tooltip
        onEdit={(hl) => {
          setSelectedText(hl.text);
          // Đặt vị trí popover tại vị trí tooltip hiện tại
          setSelectionPosition(tooltipPosition);
          setShowHighlightPopover(true);
          // Đóng tooltip hiện tại
          setTooltipHighlight(null);
          setTooltipPosition(null);
        }}
      />

      {/* ========== MAIN RENDER ========== */}
      {settings.readingMode === "scroll" ? (
        // --- SCROLL MODE: Cuộn dọc như web thông thường ---
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Header */}
          <div className="text-center py-12 relative">
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${getBorder()}, transparent)`,
              }}
            />
            <div className="w-full max-w-6xl mx-auto px-4">
              <p
                className="text-xs uppercase tracking-[0.2em] mb-3 font-medium"
                style={{ color: theme.secondary }}
              >
                Chương {chapter.chapterNo}
              </p>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl mb-6 leading-tight"
                style={{
                  color: theme.text,
                  fontWeight: 400,
                  fontFamily: readerStyle.fontFamily,
                }}
              >
                {chapter.title}
              </h1>
              {/* Metadata: ngày đăng + số từ */}
              <div className="flex justify-center items-center gap-6 mb-6">
                <div
                  className="flex items-center gap-2"
                  style={{ color: theme.secondary }}
                >
                  <Calendar className="h-4 w-4" />{" "}
                  <span className="text-sm">
                    {formatDate(chapter.publishedAt)}
                  </span>
                </div>
                <div
                  className="flex items-center gap-2"
                  style={{ color: theme.secondary }}
                >
                  <FileText className="h-4 w-4" />{" "}
                  <span className="text-sm">
                    {formatWordCount(chapter.wordCount)} từ
                  </span>
                </div>
              </div>
              {/* Divider trang trí */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div
                  className="w-16 h-px"
                  style={{ backgroundColor: getBorder() }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#00416A" }}
                />
                <div
                  className="w-16 h-px"
                  style={{ backgroundColor: getBorder() }}
                />
              </div>
            </div>
            {/* Bottom border gradient */}
            <div
              className="absolute inset-x-0 bottom-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${getBorder()}, transparent)`,
              }}
            />
          </div>

          {/* Content */}
          <div className="reader-content px-4 md:px-0" style={readerStyle}>
            <ContentRenderer
              content={content}
              chapterId={chapterId}
              highlights={highlights}
              className="w-full max-w-full content-text"
              style={{
                color: theme.text,
                textAlign: "justify" as const,
                lineHeight: settings.lineHeight,
              }}
            />
          </div>

          {/* Navigation */}
          <div className="pt-16 pb-12 mt-16 relative">
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${getBorder()}, transparent)`,
              }}
            />
            <div className="flex justify-between items-center gap-4 w-full max-w-6xl mx-auto mt-12 px-4">
              {/* Previous chapter button */}
              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  prevChapter &&
                  onNavigate("/reader", storyId, prevChapter.chapterId)
                }
                disabled={!prevChapter}
                className="group flex-1 max-w-[240px] h-14"
                style={{
                  borderColor: getBorder(),
                  color: theme.text,
                  backgroundColor: "transparent",
                }}
              >
                <ChevronLeft className="mr-2 h-6 w-6 group-hover:-translate-x-1 transition-transform" />{" "}
                <span className="font-semibold">Chương trước</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  nextChapter &&
                  onNavigate("/reader", storyId, nextChapter.chapterId)
                }
                disabled={!nextChapter}
                className="group flex-1 max-w-[240px] h-14"
                style={{
                  borderColor: getBorder(),
                  color: theme.text,
                  backgroundColor: "transparent",
                }}
              >
                <span className="font-semibold">Chương sau</span>{" "}
                <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // --- BOOK MODE (ĐÃ SỬA LỖI TRANG TRẮNG & SETTINGS) ---
        <div className="space-y-8 animate-in fade-in duration-500">
          <div
            className="relative group transition-all duration-500 w-full"
            style={{ perspective: "2000px" }}
          >
            <div
              // SỬA 1: Đặt chiều cao cố định (ví dụ 85% màn hình) để sách không bị dài vô tận
              className="h-[85vh] rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-500 w-full relative"
              style={{
                backgroundColor: isDarkTheme
                  ? "rgba(0, 52, 84, 0.5)"
                  : isTransparent
                  ? "rgba(255, 255, 255, 0.7)"
                  : theme.card,
                border: `2px solid ${getBorder()}`,
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
              }}
            >
              <div className="p-8 lg:p-12 w-full h-full box-border flex flex-col">
                {/* Header (Chỉ hiện ở trang đầu của chương) */}
                {currentPage === 0 && (
                  <div
                    className="flex-none mb-6 pb-6 border-b w-full"
                    style={{ borderColor: getBorder() }}
                  >
                    <p
                      className="text-xs uppercase tracking-[0.15em] mb-2 font-medium"
                      style={{ color: theme.secondary }}
                    >
                      Chương {chapter.chapterNo}
                    </p>
                    <h2
                      className="text-2xl mb-2"
                      style={{
                        color: theme.text,
                        fontFamily: readerStyle.fontFamily,
                      }}
                    >
                      {chapter.title}
                    </h2>
                    {/* ... (Giữ nguyên phần thông tin ngày tháng) ... */}
                  </div>
                )}

                {/* --- PHẦN CONTENT QUAN TRỌNG NHẤT --- */}
                <div
                  // SỬA 2: columns-2: Tự chia cột.
                  // overflow-y-auto: Cho phép cuộn nế chữ quá to (tránh mất chữ)
                  className="flex-1 w-full columns-1 lg:columns-2 gap-12 lg:gap-16 text-justify overflow-y-auto no-scrollbar"
                  style={{
                    height: "100%",
                    columnFill: "balance", // SỬA 3: Cân bằng chiều cao 2 cột (KHẮC PHỤC LỖI TRỐNG CHÂN TRANG)
                    widows: 2,
                    orphans: 2,
                  }}
                >
                  {/* CSS ẩn thanh cuộn */}
                  <style jsx>{`
                    .no-scrollbar::-webkit-scrollbar {
                      display: none;
                    }
                    .no-scrollbar {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}</style>

                  <ContentRenderer
                    // SỬA 4: Lấy nội dung gộp (Spread) thay vì lấy từng trang lẻ
                    // Lưu ý: Bạn cần thêm hàm getSpreadContent ở trên (xem hướng dẫn bên dưới code này)
                    content={(() => {
                      const start = currentPage * wordsPerPage;
                      const end = start + wordsPerPage * 2;
                      return words.slice(start, end).join(" ");
                    })()}
                    chapterId={chapterId}
                    highlights={highlights}
                    className="w-full block"
                    // SỬA 5: Truyền style trực tiếp vào đây để Settings (Dãn dòng, Cỡ chữ) hoạt động
                    style={{
                      color: theme.text,
                      textAlign: "justify" as const,
                      fontSize: `${settings.fontSize}px`,
                      lineHeight: settings.lineHeight,
                      fontFamily: readerStyle.fontFamily,
                    }}
                  />
                </div>
              </div>

              {/* Hiệu ứng gáy sách (Giữ nguyên) */}
              <div
                className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-16 pointer-events-none -ml-8"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)`,
                }}
              />
              <div
                className="hidden lg:block absolute left-1/2 top-8 bottom-8 w-px opacity-20"
                style={{ backgroundColor: theme.text }}
              />
            </div>
          </div>

          {/* Navigation (Giữ nguyên logic của bạn) */}
          <div className="flex justify-between items-center gap-4 w-full max-w-6xl mx-auto px-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 2))}
              disabled={currentPage === 0}
              className="group h-14"
              style={{ borderColor: getBorder(), color: theme.text }}
            >
              <ChevronLeft className="mr-2 h-6 w-6 group-hover:-translate-x-1 transition-transform" />{" "}
              <span className="font-semibold">Trang trước</span>
            </Button>

            <div className="flex flex-col items-center gap-2">
              <span
                className="text-lg px-6 py-3 rounded-full font-semibold"
                style={{
                  color: theme.text,
                  backgroundColor: `${theme.text}10`,
                }}
              >
                {currentPage + 1}-{Math.min(currentPage + 2, totalPages)} /{" "}
                {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 2))
              }
              disabled={currentPage >= totalPages - 2}
              className="group h-14"
              style={{ borderColor: getBorder(), color: theme.text }}
            >
              <span className="font-semibold">Trang sau</span>{" "}
              <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
