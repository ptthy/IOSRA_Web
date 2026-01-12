//components/chat/ChatMessage.tsx
import { TigerAvatar } from "./TigerAvatar";
import { cn } from "@/lib/utils"; // Helper để gộp và xử lý className Tailwind CSS một cách linh hoạt

export interface Message {
  id: string;
  text: string;
  sender: "bot" | "user";
  timestamp: string | Date;
}
/**
 * Component hiển thị một tin nhắn trong chat
 * Phân biệt tin nhắn bot (bên trái) và user (bên phải)
 */
export function ChatMessage({ message }: { message: Message }) {
  const isBot = message.sender === "bot";

  /**
   * Format timestamp thành chuỗi giờ/phút/ngày/tháng/năm theo định dạng Việt Nam
   * Ví dụ: "14:30 20/03/2024"
   */
  const timeString = new Date(message.timestamp).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className={cn("flex gap-3 mb-4", !isBot && "flex-row-reverse")}>
      {/* Avatar chỉ hiện cho tin nhắn bot (bên trái) */}
      {isBot && (
        <div className="flex-shrink-0">
          <TigerAvatar className="w-8 h-8 md:w-10 md:h-10" />
        </div>
      )}
      {/* Bubble tin nhắn */}
      <div
        className={cn(
          "max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base border",
          isBot
            ? "bg-card text-card-foreground border-border rounded-tl-sm" // Bot: Nền Card, bo góc trái trên
            : "bg-primary text-primary-foreground border-primary rounded-tr-sm" // User: Nền Primary, bo góc phải trên
        )}
      >
        {/* Nội dung tin nhắn - dùng whitespace-pre-wrap để giữ xuống dòng */}
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {message.text}
        </p>
        {/* Thời gian - nhỏ và mờ hơn */}
        <span
          className={cn(
            "text-[10px] mt-1 block opacity-60",
            !isBot && "text-primary-foreground/80" // Chỉnh màu giờ cho dễ đọc
          )}
        >
          {timeString}
        </span>
      </div>
    </div>
  );
}
