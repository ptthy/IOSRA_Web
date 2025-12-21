import React from "react";

interface StatusRibbonProps {
  status: string;
}

export function StatusRibbon({ status }: StatusRibbonProps) {
  const isCompleted = status === "completed";

  const styles = isCompleted
    ? {
        gradient: "from-emerald-500 via-emerald-600 to-emerald-700",
        shadow: "shadow-emerald-900/30",
        label: "HOÀN\nTHÀNH",
        dotColor: "bg-white",
      }
    : {
        gradient: "from-amber-400 via-amber-500 to-amber-600",
        shadow: "shadow-amber-900/30",
        label: "ĐANG\nCẬP NHẬT",
        dotColor: "bg-white",
      };

  // Hình cắt đuôi ruy băng nhọn
  const ribbonPolygon = "polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)";

  return (
    <div className="absolute -top-6 right-14 z-10 filter drop-shadow-lg print:hidden">
      {/* Lớp Aura phát sáng nhẹ cho truyện đang cập nhật */}
      {!isCompleted && (
        <div
          className="absolute -inset-1 bg-amber-400 opacity-20 blur-md animate-pulse"
          style={{ clipPath: ribbonPolygon }}
        />
      )}

      <div
        className={`relative w-14 h-20 bg-gradient-to-br ${styles.gradient} flex flex-col items-center justify-start pt-3 px-1.5 ${styles.shadow}`}
        style={{ clipPath: ribbonPolygon }}
      >
        {/* Hiệu ứng ánh kim bóng kính */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/10 opacity-60" />

        {/* Chữ hiển thị dọc */}
        <span className="relative z-10 text-[9px] font-bold text-white leading-[1.1] text-center drop-shadow-sm select-none whitespace-pre-line">
          {styles.label}
        </span>

        {/* Chấm tròn trạng thái */}
        <div className="mt-2 relative flex h-2 w-2">
          {!isCompleted && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          )}
          <div
            className={`relative inline-flex rounded-full h-2 w-2 ${styles.dotColor} shadow-inner`}
          />
        </div>
      </div>
    </div>
  );
}
