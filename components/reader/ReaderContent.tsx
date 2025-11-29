//components/reader/VoiceControl.tsx
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

// --- START: ContentRenderer Logic  ---
const ContentRenderer: React.FC<{
  content: string;
  className?: string;
  style?: React.CSSProperties;
  chapterId?: string;
  highlights: Highlight[]; // Pass highlights as prop
}> = ({ content, className = "", style, chapterId, highlights }) => {
  const safeContent = content || "";
  const detectContentType = (text: string): "html" | "markdown" | "plain" => {
    if (!text) return "plain";
    const htmlRegex = /<(?!!--)[^>]*>/;
    if (htmlRegex.test(text)) return "html";
    const markdownRegex =
      /(^#{1,6}\s|\*\*.*\*\*|\*.*\*|~~.*~~|> |\- |\d\. |\[.*\]\(.*\))/;
    if (markdownRegex.test(text)) return "markdown";
    return "plain";
  };

  // 🔥 Áp dụng highlight trước khi render
  const processedContent = chapterId
    ? applyHighlightsToText(safeContent, highlights)
    : safeContent;

  const contentType = detectContentType(processedContent);

  const renderHTML = (html: string) => {
    return (
      <div
        className="html-content"
        dangerouslySetInnerHTML={{ __html: html }}
        style={style}
      />
    );
  };

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
        if (!paragraph.match(/^<(\/)?(h[1-6]|blockquote)/)) {
          return `<p>${paragraph}</p>`;
        }
        return paragraph;
      })
      .join("");

    return renderHTML(processed);
  };

  switch (contentType) {
    case "html":
      return (
        <div
          className={`html-content ${className}`}
          dangerouslySetInnerHTML={{ __html: processedContent }}
          style={style}
        />
      );

    case "markdown":
      const htmlFromMarkdown = renderMarkdown(safeContent);
      const finalHtml = applyHighlightsToText(
        htmlFromMarkdown.props.dangerouslySetInnerHTML.__html,
        highlights
      );
      return (
        <div
          className={`markdown-content ${className}`}
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
          className={`plain-content ${className}`}
          dangerouslySetInnerHTML={{ __html: highlightedPlain }}
          style={style}
        />
      );
  }
};
// --- END: ContentRenderer Logic ---

interface ReaderContentProps {
  content: string;
  chapterId: string;
  storyId: string;
  chapter: ChapterDetail;
  allChapters: ChapterSummary[]; // Để điều hướng prev/next
  settings: ReaderSettings;
  theme: any;
  onNavigate: (path: string, storyId?: string, chapterId?: string) => void;
  // Các hàm tiện ích
  formatDate: (date: string) => string;
  formatWordCount: (count: number) => string;
  getBorder: () => string;
}

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
  const [currentPage, setCurrentPage] = useState(0);

  // Highlight States (Chuyển từ Page cha vào đây để xử lý cục bộ)
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showHighlightPopover, setShowHighlightPopover] = useState(false);
  const [tooltipHighlight, setTooltipHighlight] = useState<Highlight | null>(
    null
  );
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredHighlight, setHoveredHighlight] = useState<{
    id: string;
    position: { x: number; y: number };
  } | null>(null);

  // Load highlights ban đầu
  useEffect(() => {
    if (chapterId) {
      setHighlights(getHighlights(chapterId));
    }
  }, [chapterId]);

  // Handle Text Selection (Moved from Page)
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
        setSelectedText("");
        setSelectionPosition(null);
        setShowHighlightPopover(false);
      }
    };

    const container = document.querySelector(".reader-container-root"); // Scope listener nếu cần, ở đây dùng document cho chắc
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, [showHighlightPopover]);

  // Handle Highlight Hover (Tooltip)
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest(".highlight-mark") as HTMLElement | null;
      if (mark) {
        const id = mark.getAttribute("data-highlight-id");
        if (id) {
          const rect = mark.getBoundingClientRect();
          setHoveredHighlight({
            id,
            position: { x: rect.right + 4, y: rect.top + rect.height / 2 },
          });
          return;
        }
      }
      if (!target.closest(".highlight-info-icon")) {
        setHoveredHighlight(null);
      }
    };
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (relatedTarget?.closest(".highlight-info-icon")) return;
      if (target.classList.contains("highlight-mark")) {
        setTimeout(() => setHoveredHighlight(null), 100);
      }
    };
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [highlights]);

  // Logic phân trang cho Book Mode
  const wordsPerPage = 500;
  const words = (content || "").split(/\s+/);
  const totalPages = Math.ceil(words.length / wordsPerPage);

  const getPageContent = (pageIndex: number) => {
    const start = pageIndex * wordsPerPage;
    const end = start + wordsPerPage;
    return words.slice(start, end).join(" ");
  };

  const fontFamilyMap: Record<string, string> = {
    serif: "'Times New Roman', Times, serif",
    "sans-serif": "'Poppins', Arial, sans-serif",
  };

  const readerStyle = {
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    fontFamily: fontFamilyMap[settings.fontFamily] || fontFamilyMap.serif,
    color: theme.text,
  };

  const isDarkTheme = settings.theme === "dark-blue";
  const isTransparent = settings.theme === "transparent";

  // Tìm chương trước/sau
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
      {/* Popovers & Tooltips */}
      {showHighlightPopover && selectionPosition && (
        <HighlightPopover
          selectedText={selectedText}
          chapterId={chapterId}
          position={selectionPosition}
          onHighlightCreated={() => {
            const newHighlights = getHighlights(chapterId);
            setHighlights(newHighlights);
            setSelectedText("");
            setSelectionPosition(null);
            setShowHighlightPopover(false);
            if (window.getSelection) window.getSelection()?.removeAllRanges();
          }}
          onClose={() => {
            setShowHighlightPopover(false);
            setSelectedText("");
            setSelectionPosition(null);
          }}
        />
      )}

      {hoveredHighlight && !tooltipHighlight && (
        <div
          className="highlight-info-icon fixed z-[9998] cursor-pointer transition-all duration-200 hover:scale-110"
          style={{
            left: hoveredHighlight.position.x,
            top: hoveredHighlight.position.y,
            transform: "translate(0, -50%)",
          }}
          onClick={() => {
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

      <HighlightTooltip
        highlight={tooltipHighlight}
        position={tooltipPosition}
        onClose={() => {
          setTooltipHighlight(null);
          setTooltipPosition(null);
        }}
      />

      {/* RENDER CHÍNH */}
      {settings.readingMode === "scroll" ? (
        // --- SCROLL MODE ---
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
              {/* Divider */}
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
        // --- BOOK MODE ---
        <div className="space-y-8 animate-in fade-in duration-500">
          <div
            className="relative group transition-all duration-500 hover:shadow-2xl w-full"
            style={{ perspective: "2000px" }}
          >
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[700px] rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-500 w-full"
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
              {/* Left Page */}
              <div
                className="p-8 lg:p-12 select-text relative transition-all duration-300 w-full"
                style={readerStyle}
              >
                <div className="w-full h-full flex flex-col">
                  {currentPage === 0 && (
                    <div
                      className="mb-8 pb-6 border-b"
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
                          fontWeight: 400,
                          fontFamily: readerStyle.fontFamily,
                        }}
                      >
                        {chapter.title}
                      </h2>
                      <div
                        className="flex items-center gap-4 text-xs"
                        style={{ color: theme.secondary }}
                      >
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{" "}
                          <span>{formatDate(chapter.publishedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />{" "}
                          <span>{formatWordCount(chapter.wordCount)} từ</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="reader-content flex-1" style={readerStyle}>
                    <ContentRenderer
                      content={getPageContent(currentPage)}
                      chapterId={chapterId}
                      highlights={highlights}
                      className="w-full"
                      style={{
                        color: theme.text,
                        textAlign: "justify" as const,
                        lineHeight: settings.lineHeight,
                      }}
                    />
                  </div>
                  <div
                    className="flex justify-center mt-6 pt-4 border-t"
                    style={{ borderColor: getBorder() }}
                  >
                    <span
                      className="text-xs font-medium"
                      style={{ color: theme.secondary }}
                    >
                      {currentPage + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Binding Shadow */}
              <div
                className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-8 pointer-events-none -ml-4"
                style={{
                  background: `linear-gradient(90deg, transparent, ${
                    isDarkTheme ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)"
                  } 50%, transparent)`,
                }}
              />

              {/* Right Page */}
              {currentPage < totalPages - 1 && (
                <div
                  className="p-8 lg:p-12 select-text hidden lg:block border-l relative transition-all duration-300 w-full"
                  style={{ borderColor: getBorder(), ...readerStyle }}
                >
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-1 w-full">
                      <ContentRenderer
                        content={getPageContent(currentPage + 1)}
                        chapterId={chapterId}
                        highlights={highlights}
                        className="w-full"
                        style={{
                          color: theme.text,
                          textAlign: "justify" as const,
                          lineHeight: settings.lineHeight,
                        }}
                      />
                    </div>
                    <div
                      className="flex justify-center mt-6 pt-4 border-t"
                      style={{ borderColor: getBorder() }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: theme.secondary }}
                      >
                        {currentPage + 2}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Book Navigation */}
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
