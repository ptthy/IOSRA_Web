//components/reader/VoiceControl.tsx
"use client";

import React, { useState } from "react";
import { Globe, RefreshCw, Check, Languages } from "lucide-react";
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

interface TranslationControlProps {
  chapterId: string;
  originalContentUrl: string; // Để reset về gốc
  onContentChange: (newContent: string) => void;
  setShowTopUpModal: (show: boolean) => void;
}

export const TranslationControl: React.FC<TranslationControlProps> = ({
  chapterId,
  originalContentUrl,
  onContentChange,
  setShowTopUpModal,
}) => {
  const [translating, setTranslating] = useState(false);
  const [currentLang, setCurrentLang] = useState("vi-VN");

  const handleResetOriginal = async () => {
    if (currentLang === "vi-VN") return;
    setTranslating(true);
    try {
      const text = await chapterCatalogApi.getChapterContent(
        originalContentUrl
      );
      onContentChange(text);
      setCurrentLang("vi-VN");
      toast.success("Đã quay về ngôn ngữ gốc");
    } catch (error) {
      toast.error("Lỗi", { description: "Không thể tải lại nội dung gốc" });
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslate = async (langCode: string, langName: string) => {
    if (currentLang === langCode) return;

    setTranslating(true);
    try {
      let finalContent = "";
      let translationData = null; // Biến lưu metadata (contentUrl...)

      // --- BƯỚC 1: LẤY THÔNG TIN BẢN DỊCH (GET hoặc POST) ---
      try {
        // Thử GET trước
        translationData = await chapterTranslationApi.getTranslation(
          chapterId,
          langCode
        );
        toast.success("Đã tìm thấy bản dịch", {
          description: translationData.targetLanguageName,
        });
      } catch (e: any) {
        // Nếu 404 -> Gọi POST để dịch mới
        if (e.response?.status === 404) {
          toast.info("Đang dịch...", {
            description: `Hệ thống đang dịch sang ${langName}. Vui lòng đợi.`,
          });
          translationData = await chapterTranslationApi.createTranslation(
            chapterId,
            langCode
          );
          toast.success("Dịch hoàn tất!", {
            description: translationData.targetLanguageName,
          });
        }
        // Xử lý 403 Subscription
        else if (
          e.response?.status === 403 &&
          e.response?.data?.error?.code === "SubscriptionRequired"
        ) {
          toast.error("Cần gói Premium", {
            description:
              "Bạn cần đăng ký gói Premium để sử dụng tính năng dịch.",
            action: {
              label: "Nâng cấp",
              onClick: () => setShowTopUpModal(true),
            },
          });
          setTranslating(false);
          return; // Dừng
        }
        // Xử lý 403 Chapter Locked
        else if (
          e.response?.status === 403 &&
          e.response?.data?.error?.code === "ChapterLocked"
        ) {
          toast.error("Chương chưa mua", {
            description: "Bạn cần mua chương này trước khi dịch.",
          });
          setTranslating(false);
          return; // Dừng
        } else {
          throw e; // Lỗi khác
        }
      }

      // --- BƯỚC 2: TẢI NỘI DUNG TỪ URL (QUAN TRỌNG) ---
      if (translationData) {
        // Ưu tiên 1: Nếu API trả về content trực tiếp (hiếm)
        if (translationData.content) {
          finalContent = translationData.content;
        }
        // Ưu tiên 2: Tải từ contentUrl
        else if (translationData.contentUrl) {
          // Dùng lại hàm getChapterContent của catalog api để tải file text
          finalContent = await chapterCatalogApi.getChapterContent(
            translationData.contentUrl
          );
        }
      }

      // --- BƯỚC 3: CẬP NHẬT UI ---
      if (finalContent) {
        onContentChange(finalContent);
        setCurrentLang(langCode);
      } else {
        toast.error("Lỗi nội dung", {
          description: "Không đọc được file bản dịch.",
        });
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Conflict (có người khác vừa dịch xong), thử gọi lại đệ quy
        handleTranslate(langCode, langName);
      } else {
        console.error(error);
        toast.error("Lỗi dịch thuật", {
          description:
            error.response?.data?.message || "Không thể thực hiện lúc này.",
        });
      }
    } finally {
      setTranslating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={translating}
          className="h-9 w-9 rounded-full hover:bg-muted"
        >
          {translating ? (
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Chọn ngôn ngữ đọc</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleResetOriginal}
          className="justify-between"
        >
          <span>Tiếng Việt (Gốc)</span>
          {currentLang === "vi-VN" && (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleTranslate("en-US", "Tiếng Anh")}
          className="justify-between"
        >
          <span>English (Tiếng Anh)</span>
          {currentLang === "en-US" && (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleTranslate("zh-CN", "Tiếng Trung")}
          className="justify-between"
        >
          <span>中文 (Tiếng Trung)</span>
          {currentLang === "zh-CN" && (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleTranslate("ja-JP", "Tiếng Nhật")}
          className="justify-between"
        >
          <span>日本語 (Tiếng Nhật)</span>
          {currentLang === "ja-JP" && (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
