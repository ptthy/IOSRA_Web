//components/reader/TranslationControl.tsx
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

const languageNames: Record<string, string> = {
  "vi-VN": "Tiếng Việt",
  "ja-JP": "日本語 (Tiếng Nhật)",
  "en-US": "English (Tiếng Anh)",
  "zh-CN": "中文 (Tiếng Trung)",
};

interface TranslationControlProps {
  chapterId: string;
  originalContentUrl: string;
  onContentChange: (newContent: string) => void;
  setShowTopUpModal: (show: boolean) => void;
  languageCode?: string;
}

export const TranslationControl: React.FC<TranslationControlProps> = ({
  chapterId,
  originalContentUrl,
  onContentChange,
  setShowTopUpModal,
  languageCode = "vi-VN",
}) => {
  const [translating, setTranslating] = useState(false);
  const [currentLang, setCurrentLang] = useState(languageCode);

  const handleResetOriginal = async () => {
    if (currentLang === languageCode) return;
    setTranslating(true);
    try {
      const text = await chapterCatalogApi.getChapterContent(
        originalContentUrl
      );
      onContentChange(text);
      setCurrentLang(languageCode);
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

    // KHAI BÁO BIẾN
    let finalContent = "";

    try {
      let translationData = null;
      try {
        translationData = await chapterTranslationApi.getTranslation(
          chapterId,
          langCode
        );
      } catch (e: any) {
        const errorCode = e.response?.data?.error?.code;

        // Bắt lỗi khi chọn trùng ngôn ngữ gốc
        if (errorCode === "TranslationNotNeeded") {
          toast.info("Thông báo", {
            description: "Chương này vốn đã là ngôn ngữ này rồi.",
          });
          handleResetOriginal();
          return;
        }

        if (e.response?.status === 404) {
          toast.info("Đang dịch...", {
            description: `Hệ thống đang dịch sang ${langName}. Vui lòng đợi.`,
          });
          translationData = await chapterTranslationApi.createTranslation(
            chapterId,
            langCode
          );
        } else if (e.response?.status === 403) {
          const isSub =
            e.response?.data?.error?.code === "SubscriptionRequired";
          toast.error(isSub ? "Cần gói Premium" : "Chương chưa mua", {
            description: isSub
              ? "Bạn cần gói Premium để dịch."
              : "Hãy mua chương trước khi dịch.",
            action: isSub
              ? { label: "Nâng cấp", onClick: () => setShowTopUpModal(true) }
              : undefined,
          });
          return;
        } else {
          throw e;
        }
      }

      // Tải nội dung
      if (translationData) {
        if (translationData.content) {
          finalContent = translationData.content;
        } else if (translationData.contentUrl) {
          finalContent = await chapterCatalogApi.getChapterContent(
            translationData.contentUrl
          );
        }
      }

      if (finalContent) {
        onContentChange(finalContent);
        setCurrentLang(langCode);
        toast.success(`Đã chuyển sang ${langName}`);
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        handleTranslate(langCode, langName);
      } else {
        toast.error("Lỗi dịch thuật", {
          description:
            error.response?.data?.error?.message ||
            "Không thể thực hiện lúc này.",
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
          className="h-9 w-9 rounded-full"
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

        {/* Ngôn ngữ gốc linh hoạt dựa trên languageCode từ API */}
        <DropdownMenuItem
          onClick={handleResetOriginal}
          className="justify-between"
        >
          <span className="font-medium text-blue-600">
            {languageNames[languageCode] || "Ngôn ngữ gốc"} (Gốc)
          </span>
          {currentLang === languageCode && (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </DropdownMenuItem>

        {/* Danh sách các ngôn ngữ khác, bỏ qua ngôn ngữ gốc */}
        {Object.entries(languageNames).map(([code, name]) => {
          if (code === languageCode) return null;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => handleTranslate(code, name)}
              className="justify-between"
            >
              <span>{name}</span>
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
