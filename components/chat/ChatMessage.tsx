//components/chat/ChatMessage.tsx
import { TigerAvatar } from "./TigerAvatar";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  text: string;
  sender: "bot" | "user";
  timestamp: string | Date;
}

export function ChatMessage({ message }: { message: Message }) {
  const isBot = message.sender === "bot";

  const timeString = new Date(message.timestamp).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex gap-3 mb-4", !isBot && "flex-row-reverse")}>
      {isBot && (
        <div className="flex-shrink-0">
          <TigerAvatar className="w-8 h-8 md:w-10 md:h-10" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base border",
          isBot
            ? "bg-card text-card-foreground border-border rounded-tl-sm" // Bot: Nền Card
            : "bg-primary text-primary-foreground border-primary rounded-tr-sm" // User: Nền Primary
        )}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {message.text}
        </p>
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
