import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Highlight,
  saveHighlight,
  getHighlights,
} from "../../lib/readerSettings";
import { Highlighter, MessageSquare, Check, X } from "lucide-react";
import { motion } from "framer-motion"; // 1. Import motion
interface HighlightPopoverProps {
  selectedText: string;
  chapterId: string;
  onHighlightCreated: () => void;
  position: { x: number; y: number };
  onClose?: () => void; // callback để parent biết popover đóng
}

const HIGHLIGHT_COLORS = [
  { name: "Không màu", color: "transparent", value: "none" },
  { name: "Vàng", color: "#fef08a", value: "yellow" },
  { name: "Xanh", color: "#a7f3d0", value: "green" },
  { name: "Hồng", color: "#fbcfe8", value: "pink" },
  { name: "Tím", color: "#ddd6fe", value: "purple" },
  { name: "Cam", color: "#fed7aa", value: "orange" },
];

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
  const [open, setOpen] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Hàm đóng popover (đặt trước useEffect để tránh lint warning)
  const handleClose = useCallback(() => {
    setOpen(false);
    setNote("");
    setShowNoteInput(false);

    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Cập nhật savedText khi selectedText thay đổi (chỉ khi có giá trị)
  useEffect(() => {
    if (selectedText && selectedText.trim()) {
      setSavedText(selectedText);
      console.log("📌 Saved selected text:", selectedText);
    }
  }, [selectedText]);

  // Đóng popover khi click bên ngoài
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

  // const handleSave = (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();

  //   console.log("🔵 handleSave được gọi!");

  //   // Sử dụng savedText thay vì selectedText
  //   if (!savedText || !savedText.trim()) {
  //     console.warn("⚠️ Không có text được chọn");
  //     return;
  //   }

  //   const highlight: Highlight = {
  //     id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  //     chapterId,
  //     text: savedText.trim(),
  //     color: selectedColor.value,
  //     startOffset: 0,
  //     endOffset: savedText.trim().length,
  //     note: note.trim() || undefined,
  //     createdAt: new Date().toISOString(),
  //   };

  //   try {
  //     console.log("💾 Đang lưu highlight:", highlight);
  //     console.log(`📝 Lưu vào key: highlights_${chapterId}`);

  //     saveHighlight(highlight);

  //     // Kiểm tra lại localStorage ngay sau khi lưu
  //     const saved = localStorage.getItem(`highlights_${chapterId}`);
  //     console.log("✅ Dữ liệu đã lưu trong localStorage:", saved);

  //     // Force re-render bằng cách gọi callback
  //     setTimeout(() => {
  //       console.log("🔄 Đang trigger callback onHighlightCreated...");
  //       onHighlightCreated();
  //       handleClose();
  //     }, 100);
  //   } catch (error) {
  //     console.error("❌ Error saving highlight:", error);
  //     alert("Lỗi khi lưu highlight. Vui lòng thử lại.");
  //   }
  // };
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!savedText || !savedText.trim()) return;

    const existingHighlights = getHighlights(chapterId);
    // Tìm highlight cũ có cùng nội dung text để thực hiện Edit
    const oldHighlight = existingHighlights.find(
      (h) => h.text === savedText.trim()
    );

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
        ? oldHighlight.createdAt
        : new Date().toISOString(),
    };

    try {
      // Lưu ý: hàm saveHighlight trong lib của bạn nên xử lý ghi đè nếu trùng ID.
      // Để chắc chắn, ta xóa cái cũ trong mảng trước nếu là Edit.
      if (oldHighlight) {
        const key = `highlights_${chapterId}`;
        const filtered = existingHighlights.filter(
          (h) => h.id !== oldHighlight.id
        );
        localStorage.setItem(key, JSON.stringify(filtered));
      }

      saveHighlight(highlight);

      setTimeout(() => {
        onHighlightCreated();
        handleClose();
      }, 100);
    } catch (error) {
      console.error("❌ Error saving highlight:", error);
    }
  };

  // THÊM: useEffect sau để tự động điền thông tin cũ vào Popover khi mở Edit
  useEffect(() => {
    const existing = getHighlights(chapterId);
    const hl = existing.find((h) => h.text === savedText.trim());
    if (hl) {
      const colorObj = HIGHLIGHT_COLORS.find((c) => c.value === hl.color);
      if (colorObj) setSelectedColor(colorObj);
      if (hl.note) {
        setNote(hl.note);
        setShowNoteInput(true);
      }
    }
  }, [savedText, chapterId]);

  //  Kiểm tra savedText thay vì selectedText
  if (!open || !savedText) return null;

  // Tính toán vị trí cho popover - đảm bảo không bị overflow
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
      drag
      dragMomentum={false}
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
        {/* Selected Text Preview */}
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
                      ? "#000"
                      : "transparent",
                }}
                title={colorOption.name}
              >
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

        {/* Note Toggle/Input */}
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
              autoFocus
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
            disabled={!savedText || !savedText.trim()}
          >
            <Highlighter className="h-3 w-3 mr-2" />
            Lưu
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
