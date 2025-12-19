"use client";

import React from "react";
import { Zap, Gem, Music, Languages, Bot } from "lucide-react";

interface SecondaryBannerProps {
  onClick?: () => void;
}

export function SecondaryBanner({ onClick }: SecondaryBannerProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-accent/40 via-muted to-accent/40 p-4 md:p-6 my-4 border border-border/50 shadow-sm min-h-[80px]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse pointer-events-none" />

      {/* Thay đổi items-center -> items-start để dễ canh chỉnh độ cao từng phần tử */}
      <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 h-full">
        {/* KHỐI TRÁI */}
        <div className="flex flex-col md:flex-row items-center md:items-start xl:items-center gap-4 w-full xl:w-auto">
          {/* 1. Logo & Tiêu đề */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary animate-bounce-subtle" />
            </div>
            <div className="text-center md:text-left ml-2">
              <p className="text-base font-bold mb-0.5 font-sans text-foreground">
                Bỏ lỡ nội dung Premium?
              </p>
              <p className="text-xs text-muted-foreground font-sans">
                Nâng cấp để mở khóa 4 đặc quyền:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 xl:ml-8 pt-2 md:pt-5">
            {/* Daily Dias */}
            <div className="flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-[11px] font-medium text-foreground/80 whitespace-nowrap">
                Nhận mỗi ngày
              </span>
            </div>

            {/* Custom Music */}
            <div className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span className="text-[11px] font-medium text-foreground/80 whitespace-nowrap">
                Nhạc nền theo Mood
              </span>
            </div>

            {/* AI Translation */}
            <div className="flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span className="text-[11px] font-medium text-foreground/80 whitespace-nowrap">
                Dịch AI 4 ngôn ngữ
              </span>
            </div>

            {/* Chatbot */}
            <div className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-[11px] font-medium text-foreground/80 whitespace-nowrap">
                Chatbot hỗ trợ 24/7
              </span>
            </div>
          </div>
        </div>

        {/* KHỐI PHẢI: Nút hành động */}
        <div className="w-full xl:w-auto flex justify-center xl:block">
          <button
            onClick={onClick}
            className="flex-shrink-0 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium font-sans hover:bg-primary/90 transition-all shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer active:scale-95"
          >
            Tìm hiểu thêm
          </button>
        </div>
      </div>
    </div>
  );
}
