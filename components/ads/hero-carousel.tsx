"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Crown, Sparkles, Zap } from "lucide-react";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

const slides = [
  {
    id: 1,
    title: "Trở thành thành viên Premium",
    subtitle: "Trải nghiệm đọc truyện không giới hạn",
    description: "Không quảng cáo • Đọc offline • Nội dung độc quyền",
    gradient: "from-primary via-primary/90 to-primary/70",
    icon: Crown,
  },
  {
    id: 2,
    title: "Khám phá hàng nghìn truyện hay",
    subtitle: "Cập nhật mỗi ngày",
    description: "Từ kiếm hiệp, tiên hiệp đến khoa huyễn, ngôn tình",
    gradient: "from-blue-600 via-blue-500 to-blue-400",
    icon: Sparkles,
  },
  {
    id: 3,
    title: "Đọc mọi lúc, mọi nơi",
    subtitle: "Trên mọi thiết bị",
    description: "Web • Mobile • Tablet - Đồng bộ tiến độ đọc",
    gradient: "from-purple-600 via-purple-500 to-purple-400",
    icon: Zap,
  },
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000); // Chuyển slide mỗi 5 giây

      return () => clearInterval(timer);
    }
  }, [isHovered]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Slide */}
      <div
        className={`relative bg-gradient-to-br ${slide.gradient} p-8 md:p-12 transition-all duration-500`}
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <Icon className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
            {slide.title}
          </h2>

          <p className="text-base md:text-lg text-white/90 mb-2">
            {slide.subtitle}
          </p>

          <p className="text-sm text-white/70 mb-6">{slide.description}</p>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all group"
      >
        <ChevronLeft className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all group"
      >
        <ChevronRight className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all ${
              index === currentSlide
                ? "w-8 h-2 bg-white"
                : "w-2 h-2 bg-white/50 hover:bg-white/70"
            } rounded-full`}
          />
        ))}
      </div>
    </div>
  );
}
