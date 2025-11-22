// import React, { useState } from "react";
// import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
// import { Button } from "../ui/button";
// import { Textarea } from "../ui/textarea";
// import { Highlight, saveHighlight } from "../../lib/readerSettings";
// import { Highlighter, MessageSquare, Check } from "lucide-react";

// interface HighlightPopoverProps {
//   selectedText: string;
//   chapterId: string;
//   onHighlightCreated: () => void;
//   position: { x: number; y: number };
// }

// const HIGHLIGHT_COLORS = [
//   { name: "Vàng", color: "#fef08a", value: "yellow" },
//   { name: "Xanh", color: "#a7f3d0", value: "green" },
//   { name: "Hồng", color: "#fbcfe8", value: "pink" },
//   { name: "Tím", color: "#ddd6fe", value: "purple" },
//   { name: "Cam", color: "#fed7aa", value: "orange" },
// ];

// export function HighlightPopover({
//   selectedText,
//   chapterId,
//   onHighlightCreated,
//   position,
// }: HighlightPopoverProps) {
//   const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
//   const [note, setNote] = useState("");
//   const [showNoteInput, setShowNoteInput] = useState(false);
//   const [open, setOpen] = useState(true);

//   const handleSave = () => {
//     const highlight: Highlight = {
//       id: Date.now().toString(),
//       chapterId,
//       text: selectedText,
//       color: selectedColor.value,
//       startOffset: 0, // In real app, calculate actual position
//       endOffset: selectedText.length,
//       note: note.trim() || undefined,
//       createdAt: new Date().toISOString(),
//     };

//     saveHighlight(highlight);
//     onHighlightCreated();
//     setOpen(false);
//   };

//   return (
//     <Popover open={open} onOpenChange={setOpen}>
//       <PopoverTrigger asChild>
//         <div
//           className="absolute pointer-events-none"
//           style={{
//             left: `${position.x}px`,
//             top: `${position.y}px`,
//             width: 1,
//             height: 1,
//           }}
//         />
//       </PopoverTrigger>
//       <PopoverContent
//         className="w-72 p-0 shadow-lg border-2"
//         align="center"
//         side="top"
//         sideOffset={10}
//       >
//         <div className="p-3 space-y-3">
//           {/* Header */}
//           <div className="flex items-center gap-2">
//             <Highlighter className="h-4 w-4 text-primary" />
//             <p className="text-sm font-semibold">Highlight & Note</p>
//           </div>

//           {/* Selected Text Preview */}
//           <div className="text-xs text-muted-foreground bg-muted p-2 rounded max-h-16 overflow-y-auto">
//             "{selectedText.substring(0, 100)}
//             {selectedText.length > 100 ? "..." : ""}"
//           </div>

//           {/* Color Picker */}
//           <div>
//             <p className="text-xs font-medium mb-2">Chọn màu highlight:</p>
//             <div className="flex gap-2">
//               {HIGHLIGHT_COLORS.map((colorOption) => (
//                 <button
//                   key={colorOption.value}
//                   onClick={() => setSelectedColor(colorOption)}
//                   className="relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
//                   style={{
//                     backgroundColor: colorOption.color,
//                     borderColor:
//                       selectedColor.value === colorOption.value
//                         ? "#000"
//                         : "transparent",
//                   }}
//                   title={colorOption.name}
//                 >
//                   {selectedColor.value === colorOption.value && (
//                     <Check
//                       className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-700"
//                       strokeWidth={3}
//                     />
//                   )}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Note Toggle */}
//           {!showNoteInput && (
//             <Button
//               variant="outline"
//               size="sm"
//               className="w-full"
//               onClick={() => setShowNoteInput(true)}
//             >
//               <MessageSquare className="h-3 w-3 mr-2" />
//               Thêm ghi chú
//             </Button>
//           )}

//           {/* Note Input */}
//           {showNoteInput && (
//             <div className="space-y-2">
//               <p className="text-xs font-medium">Ghi chú của bạn:</p>
//               <Textarea
//                 value={note}
//                 onChange={(e) => setNote(e.target.value)}
//                 placeholder="Viết ghi chú về đoạn này..."
//                 className="min-h-[80px] text-sm resize-none"
//                 autoFocus
//               />
//             </div>
//           )}

//           {/* Action Buttons */}
//           <div className="flex gap-2 pt-2">
//             <Button
//               variant="outline"
//               size="sm"
//               className="flex-1"
//               onClick={() => setOpen(false)}
//             >
//               Hủy
//             </Button>
//             <Button size="sm" className="flex-1" onClick={handleSave}>
//               <Highlighter className="h-3 w-3 mr-2" />
//               Lưu
//             </Button>
//           </div>
//         </div>
//       </PopoverContent>
//     </Popover>
//   );
// }
import React, { useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Highlight, saveHighlight } from "../../lib/readerSettings";
import { Highlighter, MessageSquare, Check, X } from "lucide-react";

interface HighlightPopoverProps {
  selectedText: string;
  chapterId: string;
  onHighlightCreated: () => void;
  position: { x: number; y: number };
}

const HIGHLIGHT_COLORS = [
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
}: HighlightPopoverProps) {
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [open, setOpen] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Đóng popover khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    if (!selectedText.trim()) return;

    const highlight: Highlight = {
      id: Date.now().toString(),
      chapterId,
      text: selectedText,
      color: selectedColor.value,
      startOffset: 0,
      endOffset: selectedText.length,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      saveHighlight(highlight);
      console.log("✅ Highlight saved successfully:", highlight);
      onHighlightCreated();
      handleClose();
    } catch (error) {
      console.error("❌ Error saving highlight:", error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setNote("");
    setShowNoteInput(false);

    // Clear selection sau khi đóng
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  };

  // Tính toán vị trí cho popover
  const popoverStyle: React.CSSProperties = {
    position: "fixed",
    left: `${Math.max(10, position.x - 140)}px`,
    top: `${Math.max(10, position.y - 10)}px`,
    zIndex: 9999,
  };

  return (
    <div ref={popoverRef} style={popoverStyle}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="absolute" style={{ width: 1, height: 1 }} />
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-4 shadow-2xl border-2 bg-background"
          align="start"
          side="top"
          sideOffset={5}
          avoidCollisions={true}
        >
          {/* Header với nút đóng */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Highlighter className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Highlight & Note</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Selected Text Preview */}
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded mb-3 max-h-20 overflow-y-auto border">
            "{selectedText.substring(0, 150)}
            {selectedText.length > 150 ? "..." : ""}"
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

          {/* Note Toggle */}
          {!showNoteInput && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mb-3"
              onClick={() => setShowNoteInput(true)}
            >
              <MessageSquare className="h-3 w-3 mr-2" />
              Thêm ghi chú
            </Button>
          )}

          {/* Note Input */}
          {showNoteInput && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-medium">Ghi chú của bạn:</p>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Viết ghi chú về đoạn này..."
                className="min-h-[80px] text-sm resize-none"
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
              disabled={!selectedText.trim()}
            >
              <Highlighter className="h-3 w-3 mr-2" />
              Lưu
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
