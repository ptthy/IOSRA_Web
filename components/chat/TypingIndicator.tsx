//components/chat/TypingIndicator.tsx
import { TigerAvatar } from "./TigerAvatar";
/**
 * Component hiển thị hiệu ứng "bot đang soạn tin nhắn"
 * Gồm avatar + 3 chấm nhảy lên xuống (bounce animation)
 */
export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4 animate-in fade-in duration-300">
      {/* Avatar bot (giống với tin nhắn bot) */}
      <div className="flex-shrink-0">
        <TigerAvatar className="w-8 h-8 md:w-10 md:h-10" />
      </div>
      {/* Bubble với 3 chấm nhảy */}
      {/* Nền Card, viền Border */}
      <div className="bg-card text-card-foreground px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-border">
        <div className="flex gap-1.5 items-center h-full min-h-[1.5rem]">
          {/* 3 chấm với animation bounce, delay khác nhau để tạo hiệu ứng lượn sóng */}
          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
