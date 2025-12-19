"use client";
import React, { useEffect, useRef } from "react";
//import { Highlight } from "../../lib/readerSettings";
import { Trash2, X, Pencil } from "lucide-react"; // Import thêm icon
import { deleteHighlight, Highlight } from "../../lib/readerSettings";
import { motion } from "framer-motion"; // 1. Import motion
interface HighlightTooltipProps {
  highlight: Highlight | null;
  position: { x: number; y: number } | null;
  chapterId: string; // Thêm prop này để xóa đúng chapter
  onClose?: () => void;
  onRefresh: () => void; // Callback để load lại UI sau khi xóa
  onEdit: (highlight: Highlight) => void; // THÊM
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
  chapterId,
  onClose,
  onRefresh,
  onEdit,
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
  const handleDelete = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa highlight này?")) {
      deleteHighlight(chapterId, highlight.id); // Gọi hàm xóa từ lib
      onRefresh(); // Cập nhật lại state ở component cha
      onClose?.(); // Sửa lỗi ở đây: Thêm dấu ? để gọi hàm an toàn
    }
  };

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
    <motion.div
      drag // Kích hoạt tính năng kéo
      dragMomentum={false} // Dừng lại ngay khi thả chuột
      ref={tooltipRef}
      style={style}
      // Thêm cursor-move để người dùng biết có thể kéo, z-index cao để không bị che
      className="animate-fade-in p-4 w-80 shadow-2xl border-2 bg-background rounded-lg pointer-events-auto cursor-move z-[9999]"
    >
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3.5 w-3.5 rounded-full border shadow-sm"
            style={{ backgroundColor: bg, borderColor: "rgba(0,0,0,0.1)" }}
          />
          <p className="text-sm font-bold text-primary">Thông tin Highlight</p>
        </div>
        <div className="flex items-center gap-1">
          {/* NÚT EDIT  */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (highlight) onEdit(highlight);
            }}
            className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-md border border-blue-100 transition-colors shadow-sm"
            title="Chỉnh sửa highlight"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {/* Nút Xóa */}
          <button
            onPointerDown={(e) => e.stopPropagation()} // Chặn sự kiện kéo khi click nút
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-50 text-red-500 rounded-md border border-red-100 transition-colors shadow-sm"
            title="Xóa highlight"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {onClose && (
            <button
              onPointerDown={(e) => e.stopPropagation()} // Chặn sự kiện kéo khi click nút
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded-md border bg-background transition-colors shadow-sm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Vùng nội dung bên dưới: Chặn sự kiện kéo để có thể bôi đen text bên trong tooltip nếu cần */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="cursor-default mt-3"
      >
        <div className="space-y-3">
          {highlight.note ? (
            <div className="text-xs p-2.5 bg-blue-50/50 border-l-2 border-blue-400 italic text-blue-900 rounded-r-md">
              <span className="font-bold not-italic block mb-1 text-[10px] text-blue-500 uppercase tracking-wider">
                Ghi chú của bạn:
              </span>
              "{highlight.note}"
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground italic px-1">
              Không có ghi chú nào.
            </div>
          )}

          <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border border-dashed leading-relaxed">
            <span className="font-semibold text-primary/80">Nội dung:</span> “
            {highlight.text.substring(0, 120)}
            {highlight.text.length > 120 ? "..." : ""}”
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-muted text-[10px] text-muted-foreground/70">
            <span className="flex items-center gap-1">
              Màu:{" "}
              <span className="capitalize font-medium">{highlight.color}</span>
            </span>
            <span>{formatDate(highlight.createdAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HighlightTooltip;
