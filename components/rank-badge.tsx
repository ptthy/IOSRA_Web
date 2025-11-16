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
          shadow: "shadow-yellow-500/50",
          textColor: "text-yellow-900",
          starColor: "text-yellow-100",
        };
      case 2:
        return {
          gradient: "from-gray-300 via-gray-400 to-gray-500",
          shadow: "shadow-gray-500/50",
          textColor: "text-gray-900",
          starColor: "text-gray-100",
        };
      case 3:
        return {
          gradient: "from-orange-300 via-orange-400 to-orange-600",
          shadow: "shadow-orange-500/50",
          textColor: "text-orange-900",
          starColor: "text-orange-100",
        };
      default:
        return {
          gradient: "from-primary via-primary to-primary",
          shadow: "shadow-primary/50",
          textColor: "text-primary-foreground",
          starColor: "text-primary-foreground",
        };
    }
  };

  const style = getRankStyle();

  return (
    <div className="absolute -top-2 -left-2 z-30 pointer-events-none">
      <div
        className={`
        relative w-14 h-14 rounded-full 
        bg-gradient-to-br ${style.gradient}
        flex items-center justify-center 
        shadow-2xl ${style.shadow}
        border-4 border-background
        transform transition-transform duration-300
      `}
      >
        {/* Background Star */}
        <Star
          className={`absolute w-11 h-11 ${style.starColor} fill-current opacity-90`}
          strokeWidth={1.5}
        />

        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-white/20 blur-sm" />

        {/* Number */}
        <span
          className={`relative z-10 ${style.textColor} font-black text-lg drop-shadow-lg`}
        >
          {rank}
        </span>

        {/* Shine effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/40 to-transparent opacity-60" />

        {/* Outer glow animation */}
        <div
          className={`absolute -inset-1 rounded-full bg-gradient-to-br ${style.gradient} opacity-50 blur-md animate-pulse`}
        />
      </div>
    </div>
  );
}
