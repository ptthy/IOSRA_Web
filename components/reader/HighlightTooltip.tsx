//components/reader/HighlightTooltip.tsx
/*
MỤC ĐÍCH & CHỨC NĂNG:
────────────────────────────────────────────────────────────────────────────
Component HighlightTooltip hiển thị thông tin chi tiết của một highlight khi user click vào.
Nó cho phép xem, chỉnh sửa và xóa highlight đã tạo.

CHỨC NĂNG CHÍNH:
1. Hiển thị thông tin highlight: màu sắc, nội dung, ghi chú, thời gian tạo
2. Cung cấp nút chức năng: Edit, Delete, Close
3. Hỗ trợ kéo di chuyển tooltip (drag & drop)
4. Tự động đóng khi click bên ngoài (click outside)
5. Format ngày tháng theo định dạng Việt Nam

CÁCH HOẠT ĐỘNG:
- Nhận highlight object và vị trí từ component cha
- Hiển thị tooltip tại vị trí được chỉ định
- Xử lý events: click nút, drag tooltip, click outside
- Gọi callback functions để thông báo cho component cha

LIÊN KẾT VỚI CÁC COMPONENT KHÁC:
- Được mở từ ContentRenderer khi user click vào highlight-mark
- Gọi hàm deleteHighlight từ lib/readerSettings để xóa
- Truyền highlight sang HighlightPopover khi edit
- Nhận callback từ ChapterReader để refresh UI
*/

"use client";
import React, { useEffect, useRef } from "react";
//import { Highlight } from "../../lib/readerSettings";
import { Trash2, X, Pencil } from "lucide-react"; // Import thêm icon
import { deleteHighlight, Highlight } from "../../lib/readerSettings";
import { motion } from "framer-motion"; // dùng để kéo thả animation
/**
 * Props interface cho HighlightTooltip
 * @param {Highlight | null} highlight - Highlight object cần hiển thị
 * @param {{ x: number; y: number } | null} position - Vị trí hiển thị tooltip (tọa độ màn hình)
 * @param {string} chapterId - ID của chapter chứa highlight (dùng để xóa đúng chapter)
 * @param {() => void} onClose - Callback khi đóng tooltip
 * @param {() => void} onRefresh - Callback để refresh UI sau khi xóa highlight
 * @param {(highlight: Highlight) => void} onEdit - Callback khi edit highlight
 */

interface HighlightTooltipProps {
  highlight: Highlight | null;
  position: { x: number; y: number } | null;
  chapterId: string; // Thêm prop này để xóa đúng chapter
  onClose?: () => void;
  onRefresh: () => void; // Callback để load lại UI sau khi xóa
  onEdit: (highlight: Highlight) => void; // THÊM
}

/**
 * Format date từ ISO string sang định dạng Việt Nam
 * Format: "dd/mm/yyyy, hh:mm"
 *
 * @param {string} iso - ISO date string
 * @returns {string} - Date string đã format
 */
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
    return iso; // Fallback nếu parse lỗi
  }
};
/**
 * Component HighlightTooltip: Hiển thị thông tin chi tiết của highlight khi click vào
 * - Hiển thị màu, nội dung, ghi chú, thời gian tạo
 * - Có nút xóa và sửa
 * - Có thể kéo di chuyển tooltip
 * - Tự động đóng khi click bên ngoài
 */
export const HighlightTooltip: React.FC<HighlightTooltipProps> = ({
  highlight,
  position,
  chapterId,
  onClose,
  onRefresh,
  onEdit,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  /**
   * Effect xử lý click outside để đóng tooltip
   * - Thêm event listener khi component mount
   * - Loại bỏ event listener khi component unmount
   * - Delay 100ms để tránh đóng ngay khi vừa mở
   * - Kiểm tra click có phải vào highlight-mark không (nếu có thì không đóng)
   */
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
  // Không render nếu không có highlight hoặc position
  if (!highlight || !position) return null;

  /**
   * Xử lý xóa highlight
   * - Hiển thị confirm dialog
   * - Gọi API xóa từ lib
   * - Refresh UI thông qua callback
   * - Đóng tooltip sau khi xóa
   */
  const handleDelete = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa highlight này?")) {
      deleteHighlight(chapterId, highlight.id); // Gọi hàm xóa từ lib
      onRefresh(); // Cập nhật lại state ở component cha
      onClose?.(); // Sửa lỗi ở đây: Thêm dấu ? để gọi hàm an toàn
    }
  };
  // Map màu từ string sang hex code
  const colorMap: Record<string, string> = {
    yellow: "#fef08a",
    green: "#a7f3d0",
    pink: "#fbcfe8",
    purple: "#ddd6fe",
    orange: "#fed7aa",
  };
  const bg = colorMap[highlight.color] || "#fef08a"; // Default màu vàng

  /**
   * Tính toán style cho tooltip
   * - Đảm bảo tooltip không bị overflow khỏi màn hình
   * - Math.min/max để giới hạn vị trí
   * - z-index cao để hiển thị trên tất cả các element khác
   */
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.max(8, Math.min(position.x - 160, window.innerWidth - 320)), // Giới hạn chiều ngang
    top: Math.max(8, position.y - 12), // Giới hạn chiều dọc
    zIndex: 9999,
    width: 320,
  };

  return (
    <motion.div
      drag // Kích hoạt tính năng kéo từ framer-motion
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
          {/* Nút Edit - gọi callback onEdit với highlight hiện tại */}
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
          {/* Nút Xóa - gọi hàm handleDelete */}
          <button
            onPointerDown={(e) => e.stopPropagation()} // Chặn sự kiện kéo khi click nút
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-50 text-red-500 rounded-md border border-red-100 transition-colors shadow-sm"
            title="Xóa highlight"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {/* Nút Đóng - chỉ hiển thị nếu có onClose callback */}
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
      {/* Nội dung tooltip */}
      {/* Vùng nội dung bên dưới: Chặn sự kiện kéo để có thể bôi đen text bên trong tooltip nếu cần */}
      <div
        onPointerDown={(e) => e.stopPropagation()} //</motion.div>Ngăn kéo khi tương tác với nội dung
        className="cursor-default mt-3"
      >
        <div className="space-y-3">
          {/* Hiển thị ghi chú nếu có */}
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
          {/* Hiển thị nội dung highlight (giới hạn 120 ký tự) */}
          <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border border-dashed leading-relaxed">
            <span className="font-semibold text-primary/80">Nội dung:</span> “
            {highlight.text.substring(0, 120)}
            {highlight.text.length > 120 ? "..." : ""}”
          </div>
          {/* Footer với màu và thời gian tạo */}
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
