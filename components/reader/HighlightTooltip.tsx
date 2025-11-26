"use client";
import React, { useEffect, useRef } from "react";
import { Highlight } from "../../lib/readerSettings";

interface HighlightTooltipProps {
  highlight: Highlight | null;
  position: { x: number; y: number } | null;
  onClose?: () => void;
}

// Simple utility to format date consistently
const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const HighlightTooltip: React.FC<HighlightTooltipProps> = ({
  highlight,
  position,
  onClose,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlight || !onClose) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Kiểm tra xem click có phải bên ngoài tooltip không
      if (tooltipRef.current && !tooltipRef.current.contains(target)) {
        // Kiểm tra xem có phải đang click vào highlight-mark không
        const clickedElement = event.target as HTMLElement;
        if (!clickedElement.closest(".highlight-mark")) {
          onClose();
        }
      }
    };

    // Delay để tránh đóng ngay khi tooltip mới mở
    const timerId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [highlight, onClose]);

  if (!highlight || !position) return null;

  const colorMap: Record<string, string> = {
    yellow: "#fef08a",
    green: "#a7f3d0",
    pink: "#fbcfe8",
    purple: "#ddd6fe",
    orange: "#fed7aa",
  };
  const bg = colorMap[highlight.color] || "#fef08a";

  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.max(8, Math.min(position.x - 160, window.innerWidth - 320)),
    top: Math.max(8, position.y - 12),
    zIndex: 9999,
    width: 320,
  };

  return (
    <div
      ref={tooltipRef}
      style={style}
      className="animate-fade-in p-4 w-80 shadow-2xl border-2 bg-background rounded-lg pointer-events-auto"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full border"
            style={{ backgroundColor: bg, borderColor: "rgba(0,0,0,0.15)" }}
          />
          <p className="text-sm font-semibold">Highlight Info</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded border bg-muted hover:bg-muted/70 pointer-events-auto"
          >
            Đóng
          </button>
        )}
      </div>
      <div className="text-xs space-y-2">
        <div className="bg-muted p-2 rounded border max-h-24 overflow-y-auto">
          <span className="font-medium">Đoạn văn:</span> “
          {highlight.text.substring(0, 150)}
          {highlight.text.length > 150 ? "..." : ""}”
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-[11px]">
            <span className="font-medium">Màu:</span> {highlight.color}
          </div>
          <div className="text-[11px]">
            <span className="font-medium">Ngày:</span>{" "}
            {formatDate(highlight.createdAt)}
          </div>
        </div>
        <div className="text-[11px]">
          <span className="font-medium">Ghi chú:</span>{" "}
          {highlight.note ? highlight.note : <em>Không có</em>}
        </div>
      </div>
    </div>
  );
};

export default HighlightTooltip;
