import React from "react";
import { Star } from "lucide-react";

interface RankBadgeProps {
  rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return {
          gradient: "from-yellow-300 via-yellow-400 to-yellow-600",
          textColor: "text-yellow-950",
          starColor: "text-yellow-200", // Màu sao sáng hơn nền chút
        };
      case 2:
        return {
          gradient: "from-gray-200 via-gray-300 to-gray-500",
          textColor: "text-gray-900",
          starColor: "text-gray-100",
        };
      case 3:
        return {
          gradient: "from-orange-300 via-orange-400 to-orange-600",
          textColor: "text-orange-950",
          starColor: "text-orange-200",
        };
      default:
        return {
          gradient: "from-primary via-primary to-primary",
          textColor: "text-primary-foreground",
          starColor: "text-primary-foreground",
        };
    }
  };

  const style = getRankStyle();

  // CSS cắt hình đuôi tôm (giữ nguyên tỷ lệ cắt)
  const ribbonPolygon = "polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)";

  // Kích thước chung cho ruy băng to
  const ribbonDimensions = "w-16 h-20";

  return (
    // Container chính, đẩy sang trái và lên trên một chút để không che quá nhiều ảnh
    <div className="absolute -top-1 left-2 z-30 pointer-events-none filter drop-shadow-lg">
      {/* 1. LỚP AURA NHẤP NHÁY (Outer Glow Animation) */}
      <div
        className={`absolute -inset-1 bg-gradient-to-br ${style.gradient} opacity-60 blur-md animate-pulse ${ribbonDimensions}`}
        style={{ clipPath: ribbonPolygon }}
      />

      {/* 2. LỚP Ruy băng CHÍNH (Main Ribbon) */}
      <div
        className={`
        relative ${ribbonDimensions}
        bg-gradient-to-br ${style.gradient}
        flex flex-col items-center justify-start pt-3
        `}
        style={{ clipPath: ribbonPolygon }}
      >
        {/* Hiệu ứng bóng kính (Inner glow) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent opacity-70" />

        {/* --- NGÔI SAO (Đã quay trở lại) --- */}
        <Star
          className={`absolute top-2 w-14 h-14 ${style.starColor} fill-current opacity-80 drop-shadow-sm`}
          strokeWidth={1.5}
        />

        {/* Số thứ hạng (Nằm đè lên sao) */}
        <span
          className={`relative z-10 mt-2 ${style.textColor} font-black text-2xl drop-shadow-md`}
        >
          {rank}
        </span>
      </div>
    </div>
  );
}
