"use client";

import React from "react";
// Loại bỏ các import UI không dùng trong giao diện banner này (Input, Select...) để code nhẹ hơn

interface HeroSectionProps {
  onNavigate?: (path: string) => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  // Hàm xử lý khi click vào banner hoặc nút (nếu có sau này)
  const handleBannerClick = () => {
    if (onNavigate) {
      onNavigate("/search");
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-[#F0EAD6] to-[#F5F1E4] dark:from-[#00416A] dark:to-[#003454] rounded-3xl overflow-hidden shadow-sm">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      {/* Static Decorative Shapes */}
      {/* Top Right - Circles */}
      <div className="absolute top-20 right-32">
        <div className="w-3 h-3 rounded-full bg-primary/20 dark:bg-primary/30" />
      </div>
      <div className="absolute top-28 right-24">
        <div className="w-2 h-2 rounded-full border-2 border-primary/20 dark:border-primary/30" />
      </div>

      {/* Top Right - Plus Signs */}
      <svg
        className="absolute top-16 right-16 w-4 h-4 text-primary/20 dark:text-primary/30"
        viewBox="0 0 16 16"
      >
        <path
          d="M8 0V16M0 8H16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="absolute top-40 right-12 w-3 h-3 text-primary/15 dark:text-primary/25"
        viewBox="0 0 16 16"
      >
        <path
          d="M8 0V16M0 8H16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Bottom Left - Circles */}
      <div className="absolute bottom-24 left-24">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-primary/20 dark:border-primary/30" />
      </div>
      <div className="absolute bottom-32 left-16">
        <div className="w-3 h-3 rounded-full bg-primary/15 dark:bg-primary/25" />
      </div>

      {/* Bottom Right - Plus */}
      <svg
        className="absolute bottom-20 right-28 w-4 h-4 text-primary/20 dark:text-primary/30"
        viewBox="0 0 16 16"
      >
        <path
          d="M8 0V16M0 8H16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Center decorations around content */}
      <div className="absolute top-1/2 left-8">
        <div className="w-2 h-2 rounded-full bg-primary/10 dark:bg-primary/20" />
      </div>
      <div className="absolute top-1/3 right-1/4">
        <div className="w-2 h-2 rounded-full border-2 border-primary/15 dark:border-primary/25" />
      </div>

      <div className="relative container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6 z-10 cursor-default relative">
            {/* Main Heading */}
            <div className="relative">
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.15] mb-6 text-foreground tracking-tight">
                Nơi mỗi câu chuyện
                <br />
                Trở thành một bản kể có{" "}
                <span className="relative inline-block whitespace-nowrap text-primary">
                  {/* Text nhấn mạnh: Dùng màu Primary (Xanh đậm) để sang trọng, bỏ gradient lòe loẹt */}
                  <span className="text-primary relative z-10">âm thanh.</span>

                  {/* Nét gạch chân: Kéo dài full width (w-full) và dùng màu Primary */}
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-primary/80"
                    viewBox="0 0 200 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2.00025 6.99997C22.6865 2.57022 66.2995 -2.28588 198.001 3.49997"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Decorative Letters */}
              <span className="absolute -top-4 -right-8 text-2xl font-bold text-primary/25 dark:text-primary/35 rotate-12 select-none">
                A
              </span>
              <span className="absolute top-8 -right-12 text-xl font-bold text-primary/20 dark:text-primary/30 -rotate-6 select-none">
                中
              </span>
              <span className="absolute bottom-16 -right-10 text-2xl font-bold text-primary/20 dark:text-primary/30 rotate-6 select-none">
                あ
              </span>

              <p className="text-muted-foreground text-base md:text-lg font-medium leading-relaxed max-w-md">
                Khám phá hàng nghìn truyện hay với giá tốt nhất. Đọc truyện mọi
                lúc, mọi nơi với Tora Novel.
              </p>
            </div>
          </div>

          {/* Right Content - Featured Images */}
          <div className="relative hidden md:flex items-center justify-center h-[400px]">
            {/* --- Music Notes & Shapes (SVG Decoration) --- */}
            <svg
              className="absolute top-8 left-16 w-6 h-6 text-primary/30 dark:text-primary/40 animate-pulse"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <svg
              className="absolute top-12 right-20 w-5 h-5 text-primary/25 dark:text-primary/35"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <svg
              className="absolute bottom-16 left-12 w-5 h-5 text-primary/20 dark:text-primary/30"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>

            {/* Geometric Shapes */}
            <div className="absolute top-20 left-12 w-3 h-3 rounded-full bg-primary/20 dark:bg-primary/30" />
            <div className="absolute top-32 right-16 w-2 h-2 rounded-full border-2 border-primary/25 dark:border-primary/35" />
            <div className="absolute bottom-20 left-16 w-2.5 h-2.5 rounded-full bg-primary/15 dark:bg-primary/25" />
            <div className="absolute bottom-28 right-20 w-2 h-2 rounded-full border-2 border-primary/20 dark:border-primary/30" />

            {/* --- THE 3 MAIN IMAGES --- */}

            {/* Image 1 - Audio Listening (Center - LARGEST) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 md:w-80 lg:w-[340px] transform hover:scale-105 transition-all duration-300 z-30">
              <div
                className="relative group cursor-pointer"
                onClick={handleBannerClick}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all" />
                {/* Light mode image */}
                <img
                  src="/images/hero/audio-listening.png"
                  alt="Nghe truyện audio"
                  className="relative w-full h-auto object-contain drop-shadow-2xl dark:hidden"
                />
                {/* Dark mode image */}
                <img
                  src="/images/hero/audio-listening-dark.png"
                  alt="Nghe truyện audio"
                  className="relative w-full h-auto object-contain drop-shadow-2xl hidden dark:block"
                />
              </div>
            </div>

            {/* Image 2 - Music Device (Left - Closer) */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 translate-y-8 w-32 md:w-36 transform hover:scale-105 transition-all duration-300 z-10">
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
                <img
                  src="/images/hero/music-device.png"
                  alt="Thiết bị nghe nhạc"
                  className="relative w-full h-auto object-contain drop-shadow-lg opacity-85 group-hover:opacity-100 transition-opacity dark:hidden"
                />
                <img
                  src="/images/hero/music-device-dark.png"
                  alt="Thiết bị nghe nhạc"
                  className="relative w-full h-auto object-contain drop-shadow-lg opacity-85 group-hover:opacity-100 transition-opacity hidden dark:block"
                />
              </div>
            </div>

            {/* Image 3 - Writing AI (Right - Closer) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 translate-y-12 w-40 md:w-44 transform hover:scale-105 transition-all duration-300 z-20">
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/12 to-primary/8 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
                <img
                  src="/images/hero/writing-ai.png"
                  alt="Sáng tác với AI"
                  className="relative w-full h-auto object-contain drop-shadow-lg opacity-90 group-hover:opacity-100 transition-opacity dark:hidden"
                />
                <img
                  src="/images/hero/writing-ai-dark.png"
                  alt="Sáng tác với AI"
                  className="relative w-full h-auto object-contain drop-shadow-lg opacity-90 group-hover:opacity-100 transition-opacity hidden dark:block"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
