//components/chat/TypingIndicator.tsx
import { TigerAvatar } from "./TigerAvatar";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4 animate-in fade-in duration-300">
      <div className="flex-shrink-0">
        <TigerAvatar className="w-8 h-8 md:w-10 md:h-10" />
      </div>

      {/* Nền Card, viền Border */}
      <div className="bg-card text-card-foreground px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-border">
        <div className="flex gap-1.5 items-center h-full min-h-[1.5rem]">
          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
