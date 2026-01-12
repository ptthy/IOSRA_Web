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
import { cn } from "@/lib/utils"; // Helper để gộp và xử lý className Tailwind CSS một cách linh hoạt
import { usePathname } from "next/navigation";
// Import hook useAuth để lấy thông tin người dùng từ AuthContext
import { useAuth } from "@/context/AuthContext";

export function ChatBotWidget() {
  // Lấy đường dẫn hiện tại để kiểm tra trang auth/management
  const pathname = usePathname();
  // Lấy thông tin user từ AuthContext (chứa roles, id, ...)
  const { user } = useAuth();
  // Modal context để mở modal nạp tiền/nâng cấp
  const { openTopUpModal } = useModal();
  // Theme context để toggle dark/light mode
  const { theme, setTheme } = useTheme();

  // State quản lý giao diện
  const [isOpen, setIsOpen] = useState(false); // false = bong bóng tròn, true = cửa sổ chat
  const [showMenu, setShowMenu] = useState(false); // menu cấu hình (hiện/ẩn)
  // State quản lý dữ liệu chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false); // hiệu ứng bot đang typing
  const [isPremium, setIsPremium] = useState(false); // trạng thái premium của user
  const [checkingPremium, setCheckingPremium] = useState(false); // loading khi check premium
  // Refs để scroll xuống cuối & xử lý click outside menu
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  /**
   * Hàm scroll xuống cuối danh sách tin nhắn
   * Dùng khi có tin nhắn mới, bot typing, hoặc mở cửa sổ chat
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // Scroll xuống cuối mỗi khi messages, isTyping, isOpen thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  /**
   * Xử lý click outside menu để đóng menu
   * Dùng event listener mousedown, kiểm tra click có nằm trong menuRef không
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Khi mở cửa sổ chat (isOpen = true), kiểm tra premium và load lịch sử chat
   * Chỉ chạy 1 lần khi mở chat nếu chưa có tin nhắn hoặc chưa check premium
   */
  useEffect(() => {
    if (isOpen) {
      checkPremiumAndInit();
    }
  }, [isOpen]);
  /**
   * Hàm kiểm tra premium và khởi tạo tin nhắn
   * Logic:
   * 1. Nếu đã có tin nhắn và đã là premium -> bỏ qua
   * 2. Gọi API kiểm tra subscription status
   * 3. Nếu là premium -> gọi API lấy lịch sử chat
   * 4. Map dữ liệu API thành định dạng Message
   * 5. Nếu không có lịch sử -> thêm tin nhắn chào mừng
   */
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
  /**
   * Hàm xử lý gửi tin nhắn
   * Logic:
   * 1. Validate input rỗng hoặc đang typing -> return
   * 2. Nếu không phải premium -> toast error
   * 3. Thêm tin nhắn user tạm thời vào state (optimistic update)
   * 4. Gọi API sendMessage
   * 5. Map response -> cập nhật state messages (sync với server)
   */
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
  /**
   * Xử lý phím Enter để gửi tin nhắn
   * Shift + Enter -> xuống dòng
   * Enter -> gửi tin nhắn
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  // --- ĐIỀU KIỆN ẨN CHATBOT (AUTH PAGE + ROLE + MANAGEMENT PAGE) ---

  /**
   * A. Kiểm tra role của user có trong danh sách ẩn không
   * hiddenRoles: ["omod", "cmod", "admin"] -> các role quản trị
   * isHiddenRole: true nếu user có ít nhất 1 role trong hiddenRoles
   */
  const hiddenRoles = ["omod", "cmod", "admin"];
  const isHiddenRole = user?.roles?.some((role: string) =>
    hiddenRoles.includes(role)
  );

  /**
   * B. Kiểm tra có đang ở trang auth không (login, register, OTP...)
   * isAuthPage: true nếu pathname nằm trong authPaths
   */
  const authPaths = [
    "/login",
    "/register",
    "/verify-otp",
    "/forgot-password",
    "/google-complete",
  ];
  const isAuthPage = authPaths.includes(pathname);

  /**
   * C. Kiểm tra có đang ở trang quản trị không (Admin, Op, Content)
   * Dùng .some() để check pathname có bắt đầu bằng bất kỳ prefix nào trong managementPrefixes
   */
  const managementPrefixes = ["/admin", "/op", "/content"];
  const isManagementPage = managementPrefixes.some((prefix) =>
    pathname.toLowerCase().startsWith(prefix)
  );

  /**
   * D. Tổng hợp điều kiện ẩn chatbot
   * Nếu user là quản trị HOẶC đang ở trang auth HOẶC đang ở trang quản trị -> return null (ẩn)
   */
  if (isHiddenRole || isAuthPage || isManagementPage) {
    return null;
  }
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
          {/* Nút toggle theme dark/light */}
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
          </div>
        </div>

        {/* BODY */}
        <>
          {checkingPremium ? (
            // Loading khi đang check premium
            <div className="flex-1 flex flex-col items-center justify-center bg-muted/20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-2">
                Đang kết nối Tora AI...
              </p>
            </div>
          ) : !isPremium ? (
            // UI khi chưa nâng cấp premium (khóa)
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
            // UI chat chính (đã mua gói)
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
