//components/StatusRibbon.tsx

import React from "react";

interface StatusRibbonProps {
  status: string;
}

/**
 * StatusRibbon Component - Hiển thị ruy băng trạng thái của truyện
 * Hiển thị "HOÀN THÀNH" (màu xanh) hoặc "ĐANG CẬP NHẬT" (màu vàng)
 *
 * Logic xử lý:
 * 1. Xác định trạng thái dựa trên prop 'status'
 * 2. Áp dụng màu sắc và hiệu ứng tương ứng với trạng thái
 * 3. Tạo hiệu ứng hình ruy băng với clip-path
 * 4. Thêm hiệu ứng ánh sáng cho trạng thái "ĐANG CẬP NHẬT"
 */
export function StatusRibbon({ status }: StatusRibbonProps) {
  const isCompleted = status === "completed";
  // Xác định trạng thái và thiết lập styles tương ứng
  const styles = isCompleted
    ? {
        // Gradient màu xanh cho truyện đã hoàn thành
        gradient: "from-emerald-500 via-emerald-600 to-emerald-700",
        shadow: "shadow-emerald-900/30",
        label: "HOÀN\nTHÀNH", // \n để xuống dòng
        dotColor: "bg-white",
      }
    : {
        // Gradient màu vàng cho truyện đang cập nhật
        gradient: "from-amber-400 via-amber-500 to-amber-600",
        shadow: "shadow-amber-900/30",
        label: "ĐANG\nCẬP NHẬT",
        dotColor: "bg-white",
      };

  // Hình cắt đuôi ruy băng nhọn bằng clip-path polygon
  const ribbonPolygon = "polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)";

  return (
    <div className="absolute -top-6 right-14 z-10 filter drop-shadow-lg print:hidden">
      {/* Lớp Aura phát sáng nhẹ - chỉ hiển thị cho truyện đang cập nhật */}
      {!isCompleted && (
        <div
          className="absolute -inset-1 bg-amber-400 opacity-20 blur-md animate-pulse"
          style={{ clipPath: ribbonPolygon }}
        />
      )}
      {/* Ruy băng chính với gradient background */}
      <div
        className={`relative w-14 h-20 bg-gradient-to-br ${styles.gradient} flex flex-col items-center justify-start pt-3 px-1.5 ${styles.shadow}`}
        style={{ clipPath: ribbonPolygon }}
      >
        {/* Hiệu ứng ánh kim bóng kính trên ruy băng */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/10 opacity-60" />

        {/* Chữ hiển thị dọc với whitespace-pre-line để giữ \n */}
        <span className="relative z-10 text-[9px] font-bold text-white leading-[1.1] text-center drop-shadow-sm select-none whitespace-pre-line">
          {styles.label}
        </span>

        {/* Chấm tròn trạng thái với hiệu ứng ping cho truyện đang cập nhật */}
        <div className="mt-2 relative flex h-2 w-2">
          {/* Hiệu ứng ping (mở rộng) chỉ cho trạng thái đang cập nhật */}
          {!isCompleted && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          )}
          {/* Chấm tròn chính */}
          <div
            className={`relative inline-flex rounded-full h-2 w-2 ${styles.dotColor} shadow-inner`}
          />
        </div>
      </div>
    </div>
  );
}
