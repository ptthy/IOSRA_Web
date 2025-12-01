//components/chat/ChatBotWidget.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  MoreVertical,
  X,
  Minimize2,
  Moon,
  Sun,
  Lock,
  Sparkles,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useModal } from "@/context/ModalContext";
import { ChatMessage, Message } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { TigerAvatar } from "./TigerAvatar";
import { aiChatService } from "@/services/aiChatService";
import { subscriptionService } from "@/services/subscriptionService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ChatBotWidget() {
  const { openTopUpModal } = useModal();
  const { theme, setTheme } = useTheme();

  // 🔥 isOpen: false = Hiện bong bóng tròn | true = Hiện cửa sổ chat
  const [isOpen, setIsOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  // Click outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check Premium khi mở chat
  useEffect(() => {
    if (isOpen) {
      checkPremiumAndInit();
    }
  }, [isOpen]);

  const checkPremiumAndInit = async () => {
    if (messages.length > 0 && isPremium) return;

    setCheckingPremium(true);
    try {
      const subRes = await subscriptionService.getStatus();
      const hasSub = subRes.data.hasActiveSubscription;
      setIsPremium(hasSub);

      if (hasSub) {
        const histRes = await aiChatService.getHistory();
        const mappedMessages: Message[] = histRes.messages.map((msg, idx) => ({
          id: `hist-${idx}`,
          text: msg.content,
          sender: msg.role === "assistant" ? "bot" : "user",
          timestamp: msg.timestamp,
        }));

        if (mappedMessages.length === 0) {
          setMessages([
            {
              id: "welcome",
              text: "Xin chào! Tôi là ToraNovel Bot 🐯\nTôi có thể giúp gì cho bạn hôm nay?",
              sender: "bot",
              timestamp: new Date().toISOString(),
            },
          ]);
        } else {
          setMessages(mappedMessages);
        }
      }
    } catch (error) {
      console.error("Init Error:", error);
      setIsPremium(false);
    } finally {
      setCheckingPremium(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;
    if (!isPremium) {
      toast.error("Vui lòng nâng cấp Premium để chat!");
      return;
    }

    const userText = inputText;
    setInputText("");

    const tempUserMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const response = await aiChatService.sendMessage(userText);
      const syncedMessages: Message[] = response.messages.map((msg, idx) => ({
        id: `msg-${idx}`,
        text: msg.content,
        sender: msg.role === "assistant" ? "bot" : "user",
        timestamp: msg.timestamp,
      }));
      setMessages(syncedMessages);
    } catch (error) {
      toast.error("Tora đang bận, thử lại sau nhé!");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- TRẠNG THÁI 1: BONG BÓNG TRÒN (KHI ĐÓNG) ---
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground z-50 animate-bounce-subtle transition-all duration-300 hover:scale-110 p-0 overflow-hidden border-2 border-white dark:border-gray-800"
      >
        <div className="relative w-full h-full">
          <TigerAvatar className="w-full h-full" />
          {/* Badge thông báo đỏ (nếu cần) */}
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
          </span>
        </div>
      </Button>
    );
  }

  // --- TRẠNG THÁI 2: CỬA SỔ CHAT FULL (KHI MỞ) ---
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={cn(
          "w-[95vw] md:w-[400px] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[80vh]"
        )}
      >
        {/* HEADER */}
        <div className="bg-primary text-primary-foreground px-5 py-3 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <TigerAvatar className="w-10 h-10 border-2 border-primary-foreground/20" />
            <div>
              <h2 className="font-bold text-sm md:text-base">ToraNovel Bot</h2>
              <p className="text-xs opacity-80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Đổi giao diện"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Nút Thu nhỏ -> Quay về dạng bong bóng */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Thu nhỏ"
            >
              <Minimize2 className="w-5 h-5" />
            </button>

            {/* <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-10 bg-popover text-popover-foreground rounded-lg shadow-lg overflow-hidden z-50 min-w-[150px] border border-border">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 hover:bg-muted text-left text-sm transition-colors"
                  >
                    Đóng chat
                  </button>
                </div>
              )}
            </div> */}
          </div>
        </div>

        {/* BODY */}
        <>
          {checkingPremium ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-muted/20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-2">
                Đang kết nối Tora AI...
              </p>
            </div>
          ) : !isPremium ? (
            // LOCKED UI
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-muted/20 space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2 animate-bounce-subtle">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Tính năng Premium
              </h3>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                Nâng cấp ngay để trò chuyện không giới hạn với Tora Bot!
              </p>
              <Button
                onClick={() => openTopUpModal()}
                className="w-full max-w-[200px] bg-primary text-primary-foreground hover:opacity-90 shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" /> Nâng cấp ngay
              </Button>
            </div>
          ) : (
            // CHAT UI
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-muted/20 scrollbar-thin scrollbar-thumb-border">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* INPUT AREA */}
          <div className="px-4 py-3 bg-card border-t border-border shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={!isPremium || isTyping}
                placeholder={
                  !isPremium ? "Mở khóa Premium để chat..." : "Nhập tin nhắn..."
                }
                className="w-full pl-5 pr-12 py-3 rounded-full bg-muted text-foreground placeholder:text-muted-foreground border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || !isPremium}
                className="absolute right-1 top-1 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}
