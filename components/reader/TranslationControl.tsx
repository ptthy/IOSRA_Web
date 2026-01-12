// components/reader/TranslationControl.tsx
/*
 * MỤC ĐÍCH CHÍNH:
 * Component xử lý toàn bộ workflow dịch thuật nội dung chương truyện
 *
 * GIÁ TRỊ KINH DOANH:
 * 1. Tăng trải nghiệm đa ngôn ngữ
 * 2. Premium feature (một số ngôn ngữ yêu cầu subscription)
 * 3. Giữ chân user quốc tế
 *
 * CHỨC NĂNG CHÍNH:
 * 1. LANGUAGE SELECTION:
 *    - Dropdown với 4 ngôn ngữ: Việt, Nhật, Anh, Trung
 *    - Hiển thị ngôn ngữ gốc từ API
 *    - Checkmark indicator cho ngôn ngữ đang chọn
 *
 * 2. TRANSLATION WORKFLOW:
 *    a) CHECK EXISTING:
 *       - GET /translation để kiểm tra bản dịch có sẵn
 *       - Nếu có → load content ngay
 *
 *    b) CREATE NEW:
 *       - POST /translation nếu chưa có (status 404)
 *       - Async job trên backend
 *       - Toast thông báo "Đang dịch..."
 *
 *    c) PREMIUM CHECK:
 *       - SubscriptionRequired (403) → upsell modal
 *       - ChapterNotOwned (403) → mua chương trước
 *
 * 3. ERROR HANDLING MATRIX:
 *    - 200 OK: Thành công → load content
 *    - 404: Chưa có → tạo mới
 *    - 403: Premium/Ownership required → upsell
 *    - 409: Đang xử lý → retry logic
 *    - TranslationNotNeeded: Trùng ngôn ngữ gốc → reset
 *
 * 4. CONTENT MANAGEMENT:
 *    - Lấy content từ 2 nguồn: inline trong response hoặc contentUrl
 *    - Truyền content mới lên parent qua onContentChange
 *    - Reset về bản gốc khi chọn original language
 *
 * KIẾN TRÚC API INTEGRATION:
 * - Service: chapterTranslationApi (GET/POST)
 * - Service: chapterCatalogApi (lấy content từ URL)
 * - Error object structure từ backend
 * - Recursive retry cho 409 Conflict
 *
 * UI/UX CONSIDERATIONS:
 * - Loading spinner khi đang xử lý
 * - Toast feedback cho mọi state
 * - Action button trong toast (nâng cấp/mua)
 * - Disable button khi loading
 *
 * BUSINESS RULES:
 * 1. Ngôn ngữ gốc từ API (dynamic, không cứng là tiếng Việt)
 * 2. Premium requirement có thể theo ngôn ngữ
 * 3. Chapter ownership là prerequisite
 * 4. Rate limiting để tránh spam dịch
 *
 * INTEGRATION WITH PARENT:
 * - Nhận callbacks: onContentChange, setShowTopUpModal
 * - Truyền translated content lên để re-render
 * - Phối hợp với audio system (giọng vẫn giữ nguyên)
 */

"use client";

import React, { useState } from "react";
import { RefreshCw, Check, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { chapterTranslationApi } from "@/services/chapterTranslationService";
import { chapterCatalogApi } from "@/services/chapterCatalogService";
import { toast } from "sonner";
/**
 * Map language code -> display name
 *
 * Định dạng: BCP 47 language code (vi-VN, en-US, etc.)
 * Dùng cho cả:
 * - Hiển thị trong dropdown
 * - Logic so sánh với languageCode từ props
 */
const languageNames: Record<string, string> = {
  "vi-VN": "Tiếng Việt",
  "ja-JP": "日本語 (Tiếng Nhật)",
  "en-US": "English (Tiếng Anh)",
  "zh-CN": "中文 (Tiếng Trung)",
};
/**
 * Props interface cho TranslationControl
 *
 * @property chapterId: ID duy nhất của chương (UUID)
 * @property originalContentUrl: URL đến nội dung gốc (từ API)
 * @property onContentChange: Callback truyền translated content lên parent
 * @property setShowTopUpModal: Callback mở modal nạp tiền/mua gói premium
 * @property languageCode: Ngôn ngữ gốc của chương (từ API, mặc định "vi-VN")
 */
interface TranslationControlProps {
  chapterId: string;
  originalContentUrl: string;
  onContentChange: (newContent: string) => void;
  setShowTopUpModal: (show: boolean) => void;
  languageCode?: string;
}
/**
 * COMPONENT CHÍNH: TranslationControl
 *
 * Là component độc lập xử lý toàn bộ flow dịch thuật:
 * - UI: Dropdown menu với danh sách ngôn ngữ
 * - Logic: Handle translation request/response
 * - State: Managing loading states và current language
 *
 * Được sử dụng như children của ReaderToolbar:
 * <ReaderToolbar>
 *   <TranslationControl {...props} />
 * </ReaderToolbar>
 */
export const TranslationControl: React.FC<TranslationControlProps> = ({
  chapterId,
  originalContentUrl,
  onContentChange,
  setShowTopUpModal,
  languageCode = "vi-VN", // Mặc định tiếng Việt nếu không có từ API
}) => {
  // ========== STATE DECLARATIONS ==========

  /**
   * Loading state khi đang xử lý dịch thuật
   * Hiển thị spinner icon thay vì language icon
   */
  const [translating, setTranslating] = useState(false);
  /**
   * Ngôn ngữ hiện tại đang được hiển thị
   * Mặc định = languageCode (ngôn ngữ gốc)
   * Update khi user chọn ngôn ngữ khác
   */
  const [currentLang, setCurrentLang] = useState(languageCode);
  // ========== CORE FUNCTIONS ==========

  /**
   * Reset về nội dung gốc (ngôn ngữ ban đầu của chương)
   *
   * Flow:
   * 1. Kiểm tra nếu đã là ngôn ngữ gốc → return sớm
   * 2. Set loading state
   * 3. Gọi API lấy original content
   * 4. Truyền content lên parent qua onContentChange
   * 5. Update currentLang state
   *
   * Error handling: Toast thông báo nếu không load được
   */
  const handleResetOriginal = async () => {
    // Optimization: Tránh gọi API nếu đã là ngôn ngữ gốc
    if (currentLang === languageCode) return;
    setTranslating(true);
    try {
      // Lấy nội dung gốc từ URL (có thể là từ CDN hoặc API)
      const text = await chapterCatalogApi.getChapterContent(
        originalContentUrl
      );

      // Truyền content mới lên parent component để re-render
      onContentChange(text);
      // Update UI state
      setCurrentLang(languageCode);
      toast.success("Đã quay về ngôn ngữ gốc");
    } catch (error) {
      toast.error("Lỗi", { description: "Không thể tải lại nội dung gốc" });
    } finally {
      setTranslating(false);
    }
  };
  /**
   * Hàm chính xử lý dịch thuật
   *
   * COMPLEX FLOW:
   * 1. Validation: Kiểm tra nếu đã chọn ngôn ngữ này → return
   * 2. Set loading state
   * 3. Gọi GET /translation (check existing)
   * 4. Xử lý các response cases:
   *    a) 200 OK: Có sẵn → load content
   *    b) 404 Not Found: Chưa có → POST /translation (tạo mới)
   *    c) 403 Forbidden: Premium/ownership required → upsell
   *    d) 409 Conflict: Đang xử lý → retry (recursive)
   *    e) TranslationNotNeeded: Trùng ngôn ngữ gốc → reset
   * 5. Load content và update UI
   *
   * @param langCode - Language code target (vi-VN, en-US, etc.)
   * @param langName - Display name cho toast messages
   */
  const handleTranslate = async (langCode: string, langName: string) => {
    // Optimization: Tránh gọi API nếu đang chọn chính ngôn ngữ đó
    if (currentLang === langCode) return;
    setTranslating(true);

    // Biến lưu content cuối cùng
    let finalContent = "";

    try {
      // BƯỚC 1: Thử lấy translation đã có
      let translationData = null;
      try {
        translationData = await chapterTranslationApi.getTranslation(
          chapterId,
          langCode
        );
      } catch (e: any) {
        // BƯỚC 2: Xử lý các error cases từ GET request
        const errorCode = e.response?.data?.error?.code;

        // Case 1: TranslationNotNeeded (chọn trùng ngôn ngữ gốc)
        if (errorCode === "TranslationNotNeeded") {
          toast.info("Thông báo", {
            description: "Chương này vốn đã là ngôn ngữ này rồi.",
          });
          handleResetOriginal(); // Reset về gốc thay vì dịch
          return;
        }
        // Case 2: 404 Not Found - Chưa có translation
        if (e.response?.status === 404) {
          toast.info("Đang dịch...", {
            description: `Hệ thống đang dịch sang ${langName}. Vui lòng đợi.`,
          });
          // Tạo translation mới
          translationData = await chapterTranslationApi.createTranslation(
            chapterId,
            langCode
          );
          // Case 3: 403 Forbidden - Premium/ownership requirement
        } else if (e.response?.status === 403) {
          const isSub =
            e.response?.data?.error?.code === "SubscriptionRequired";
          // Toast với action button tương ứng
          toast.error(isSub ? "Cần gói Premium" : "Chương chưa mua", {
            description: isSub
              ? "Bạn cần gói Premium để dịch."
              : "Hãy mua chương trước khi dịch.",
            action: isSub
              ? { label: "Nâng cấp", onClick: () => setShowTopUpModal(true) }
              : undefined,
          });
          return; // Dừng flow, không tiếp tục
        }
        // Case 4: Lỗi khác → re-throw để catch block ngoài xử lý
        else {
          throw e;
        }
      }

      // BƯỚC 3: Load translation content
      if (translationData) {
        // Có 2 trường hợp data structure từ API:
        // 1. Content inline trong response
        // 2. Content URL cần fetch riêng
        if (translationData.content) {
          finalContent = translationData.content;
        } else if (translationData.contentUrl) {
          finalContent = await chapterCatalogApi.getChapterContent(
            translationData.contentUrl
          );
        }
      }
      // BƯỚC 4: Update UI nếu có content
      if (finalContent) {
        onContentChange(finalContent);
        setCurrentLang(langCode);
        toast.success(`Đã chuyển sang ${langName}`);
      }
    } catch (error: any) {
      // BƯỚC 5: Error handling cho các trường hợp khác

      // Case: 409 Conflict - Translation đang được xử lý
      if (error.response?.status === 409) {
        // Retry logic: Gọi lại chính hàm này sau khi có lỗi 409
        // Đây là recursive call, cần cẩn thận với infinite loop
        // Trong thực tế nên có retry limit hoặc exponential backoff
        handleTranslate(langCode, langName);
      } else {
        toast.error("Lỗi dịch thuật", {
          // Case: Lỗi khác (network, server error, etc.)
          description:
            error.response?.data?.error?.message ||
            "Không thể thực hiện lúc này.",
        });
      }
    } finally {
      // BƯỚC 6: Luôn reset loading state dù success hay error
      setTranslating(false);
    }
  };
  // ========== JSX RENDER ==========
  return (
    <DropdownMenu>
      {/* TRIGGER BUTTON: Hiển thị icon dịch thuật */}
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={translating}
          className="h-9 w-9 rounded-full"
        >
          {/* Conditional rendering: Spinner khi loading, icon bình thường khi không */}
          {translating ? (
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* MENU HEADER */}
      <DropdownMenuContent align="end" className="w-56">
        {/* MENU HEADER */}
        <DropdownMenuLabel>Chọn ngôn ngữ đọc</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* MENU ITEM 1: NGÔN NGỮ GỐC */}
        <DropdownMenuItem
          onClick={handleResetOriginal}
          className="justify-between"
        >
          <span className="font-medium text-blue-600">
            {/* Hiển thị dynamic ngôn ngữ gốc từ props */}
            {languageNames[languageCode] || "Ngôn ngữ gốc"} (Gốc)
          </span>
          {/* Checkmark indicator nếu đang ở ngôn ngữ gốc */}
          {currentLang === languageCode && (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </DropdownMenuItem>
        {/* MENU ITEMS 2+: CÁC NGÔN NGỮ KHÁC */}
        {Object.entries(languageNames).map(([code, name]) => {
          // Skip ngôn ngữ gốc (đã hiển thị ở trên)
          if (code === languageCode) return null;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => handleTranslate(code, name)}
              className="justify-between"
            >
              <span>{name}</span>
              {/* Checkmark indicator nếu đang ở ngôn ngữ này */}
              {currentLang === code && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
