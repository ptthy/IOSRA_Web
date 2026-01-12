//components/reader/HightLightPopover.tsx
/*
MỤC ĐÍCH & CHỨC NĂNG:
────────────────────────────────────────────────────────────────────────────
Component HighlightPopover hiển thị popover để tạo mới hoặc chỉnh sửa highlight.
Nó xuất hiện khi user chọn text trong ContentRenderer.

CHỨC NĂNG CHÍNH:
1. Cho phép chọn màu highlight từ 6 tùy chọn (kể cả "không màu")
2. Nhập ghi chú cho highlight
3. Tự động điền thông tin cũ khi edit highlight
4. Hỗ trợ kéo di chuyển popover
5. Đóng tự động khi click bên ngoài
6. Lưu highlight vào localStorage thông qua lib

CÁCH HOẠT ĐỘNG:
- Nhận selected text và vị trí từ mouse event
- Lưu text vào state để tránh mất khi selection clear
- Tự động detect nếu đang edit highlight cũ
- Gọi saveHighlight để lưu vào localStorage
- Gọi callback để component cha refresh UI

LIÊN KẾT VỚI CÁC COMPONENT KHÁC:
- Được mở từ ContentRenderer khi user chọn text
- Gọi hàm saveHighlight và getHighlights từ lib/readerSettings
- Truyền callback onHighlightCreated để ChapterReader re-render
- Nhận highlight từ HighlightTooltip khi edit mode
*/
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Highlight,
  saveHighlight,
  getHighlights,
} from "../../lib/readerSettings";
import { Highlighter, MessageSquare, Check, X } from "lucide-react";
import { motion } from "framer-motion"; // thư viện animation kéo thả

/**
 * Props interface cho HighlightPopover
 * @param {string} selectedText - Text được chọn từ nội dung
 * @param {string} chapterId - ID của chapter hiện tại
 * @param {() => void} onHighlightCreated - Callback khi tạo highlight thành công
 * @param {{ x: number; y: number }} position - Vị trí hiển thị popover
 * @param {() => void} onClose - Callback đóng popover
 */
interface HighlightPopoverProps {
  selectedText: string;
  chapterId: string;
  onHighlightCreated: () => void;
  position: { x: number; y: number };
  onClose?: () => void; // callback để parent biết popover đóng
}

/**
 * Danh sách màu highlight có sẵn
 * Mỗi màu có: tên, mã màu hex, và giá trị string
 */
const HIGHLIGHT_COLORS = [
  { name: "Không màu", color: "transparent", value: "none" },
  { name: "Vàng", color: "#fef08a", value: "yellow" },
  { name: "Xanh", color: "#a7f3d0", value: "green" },
  { name: "Hồng", color: "#fbcfe8", value: "pink" },
  { name: "Tím", color: "#ddd6fe", value: "purple" },
  { name: "Cam", color: "#fed7aa", value: "orange" },
];
/**
 * Component HighlightPopover: Popover để tạo hoặc chỉnh sửa highlight
 * - Cho phép chọn màu highlight
 * - Thêm/sửa ghi chú
 * - Tự động điền thông tin cũ nếu đang edit
 * - Có thể kéo di chuyển popover
 */
export function HighlightPopover({
  selectedText,
  chapterId,
  onHighlightCreated,
  position,
  onClose,
}: HighlightPopoverProps) {
  //  Lưu selectedText vào state để tránh bị mất khi selection clear
  const [savedText, setSavedText] = useState(selectedText);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [open, setOpen] = useState(true); // State kiểm soát mở/đóng popover
  const popoverRef = useRef<HTMLDivElement>(null);

  /**
   * Hàm đóng popover - useCallback để tránh re-render không cần thiết
   * - Reset tất cả state về giá trị ban đầu
   * - Clear text selection
   * - Gọi callback onClose nếu có
   */
  const handleClose = useCallback(() => {
    setOpen(false);
    setNote("");
    setShowNoteInput(false);
    // Clear text selection trên trình duyệt
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    // Gọi callback đóng popover ở component cha
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  /**
   * Effect lưu selectedText khi có giá trị mới
   * - Chỉ lưu khi selectedText có giá trị và không rỗng
   * - Giải quyết vấn đề mất selection khi click ra ngoài
   */
  useEffect(() => {
    if (selectedText && selectedText.trim()) {
      setSavedText(selectedText);
      console.log("📌 Saved selected text:", selectedText);
    }
  }, [selectedText]);

  /**
   * Effect xử lý click outside để đóng popover
   * - Tương tự như HighlightTooltip
   * - Delay 100ms trước khi thêm event listener
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Kiểm tra xem click có phải bên ngoài popover không
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        console.log("🔴 Clicked outside popover, closing...");
        handleClose();
      } else {
        console.log("🟢 Clicked inside popover, keeping open");
      }
    };

    // Delay để tránh đóng ngay khi popover mới mở
    const timerId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClose]);

  /**
   * Xử lý lưu highlight (tạo mới hoặc cập nhật)
   * - Kiểm tra nếu đã có highlight cũ với cùng nội dung → thực hiện edit
   * - Nếu mới → tạo ID mới
   * - Lưu vào localStorage thông qua lib
   * - Gọi callback refresh UI
   *
   * @param {React.MouseEvent} e - Mouse event để preventDefault
   */
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Validate text không rỗng
    if (!savedText || !savedText.trim()) return;
    // Lấy danh sách highlight hiện có
    const existingHighlights = getHighlights(chapterId);
    // Tìm highlight cũ có cùng nội dung text để thực hiện Edit
    const oldHighlight = existingHighlights.find(
      (h) => h.text === savedText.trim()
    );
    // Tạo highlight object
    const highlight: Highlight = {
      // Nếu có highlight cũ, giữ nguyên ID để ghi đè, nếu không thì tạo ID mới
      id: oldHighlight
        ? oldHighlight.id
        : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chapterId,
      text: savedText.trim(),
      color: selectedColor.value,
      startOffset: 0,
      endOffset: savedText.trim().length,
      note: note.trim() || undefined,
      createdAt: oldHighlight
        ? oldHighlight.createdAt // Giữ nguyên thời gian tạo nếu edit
        : new Date().toISOString(), // Tạo mới nếu là highlight mới
    };

    try {
      // Nếu là edit, xóa highlight cũ trước
      if (oldHighlight) {
        const key = `highlights_${chapterId}`;
        const filtered = existingHighlights.filter(
          (h) => h.id !== oldHighlight.id
        );
        localStorage.setItem(key, JSON.stringify(filtered));
      }
      // Lưu highlight mới
      saveHighlight(highlight);
      // Delay một chút để đảm bảo state được cập nhật
      setTimeout(() => {
        onHighlightCreated(); // Callback refresh UI
        handleClose(); // Đóng popover
      }, 100);
    } catch (error) {
      console.error("❌ Error saving highlight:", error);
    }
  };

  /**
   * Effect tự động điền thông tin cũ khi mở popover edit
   * - Tìm highlight cũ dựa trên nội dung text
   * - Điền màu và ghi chú nếu có
   */
  useEffect(() => {
    const existing = getHighlights(chapterId);
    const hl = existing.find((h) => h.text === savedText.trim());
    if (hl) {
      // Điền màu từ highlight cũ
      const colorObj = HIGHLIGHT_COLORS.find((c) => c.value === hl.color);
      if (colorObj) setSelectedColor(colorObj);
      // Điền ghi chú nếu có
      if (hl.note) {
        setNote(hl.note);
        setShowNoteInput(true);
      }
    }
  }, [savedText, chapterId]);

  // Không render nếu popover đã đóng hoặc không có text
  if (!open || !savedText) return null;

  /**
   * Tính toán vị trí popover để không bị overflow màn hình
   * - Giới hạn left để không tràn ra ngoài màn hình bên phải
   * - Giới hạn top để không tràn ra ngoài màn hình trên cùng
   */
  const popoverStyle: React.CSSProperties = {
    position: "fixed",
    left: `${Math.max(
      10,
      Math.min(position.x - 160, window.innerWidth - 340)
    )}px`,
    top: `${Math.max(10, position.y - 10)}px`,
    zIndex: 9999,
  };

  return (
    <motion.div
      drag // Kích hoạt tính năng kéo
      dragMomentum={false} // Dừng ngay khi thả chuột
      ref={popoverRef}
      style={popoverStyle}
      className="w-80 p-4 shadow-2xl border-2 bg-background rounded-lg cursor-move z-[9999]"
    >
      {/* Header: Vùng chính để nắm và kéo */}
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <div className="flex items-center gap-2">
          <Highlighter className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Highlight & Note</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-6 w-6 p-0 cursor-pointer"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Nội dung bên dưới: Thêm stopPropagation để không bị kéo khi đang thao tác input */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="cursor-default"
      >
        {/* Preview text được chọn (giới hạn 150 ký tự) */}
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded mb-3 max-h-20 overflow-y-auto border">
          &quot;{savedText.substring(0, 150)}
          {savedText.length > 150 ? "..." : ""}&quot;
        </div>

        {/* Color Picker */}
        <div className="mb-3">
          <p className="text-xs font-medium mb-2">Chọn màu highlight:</p>
          <div className="flex gap-2">
            {HIGHLIGHT_COLORS.map((colorOption) => (
              <button
                key={colorOption.value}
                onClick={() => setSelectedColor(colorOption)}
                className="relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                style={{
                  backgroundColor: colorOption.color,
                  borderColor:
                    selectedColor.value === colorOption.value
                      ? "#000" // Border đen cho màu được chọn
                      : "transparent",
                }}
                title={colorOption.name}
              >
                {/* Check icon hiển thị khi màu được chọn */}
                {selectedColor.value === colorOption.value && (
                  <Check
                    className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-700"
                    strokeWidth={3}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Ghi chú: toggle hiển thị input */}
        {!showNoteInput ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-3"
            onClick={() => setShowNoteInput(true)}
          >
            <MessageSquare className="h-3 w-3 mr-2" />
            Thêm ghi chú
          </Button>
        ) : (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-medium">Ghi chú của bạn:</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Viết ghi chú về đoạn này..."
              className="min-h-20 text-sm resize-none"
              autoFocus // Tự động focus vào textarea khi mở
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleClose}
          >
            Hủy
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleSave}
            disabled={!savedText || !savedText.trim()} // Disable nếu không có text
          >
            <Highlighter className="h-3 w-3 mr-2" />
            Lưu
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
