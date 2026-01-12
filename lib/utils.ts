//lib/utils.ts
/**
 * UTILITY FUNCTIONS - HÀM TIỆN ÍCH DÙNG CHUNG
 * MỤC ĐÍCH: Cung cấp các hàm helper dùng nhiều nơi trong app
 * HIỆN TẠI CHỈ CÓ: cn() function để merge class names Tailwind
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
/**
 * Hàm tiện ích để merge class names từ Tailwind CSS
 * LOGIC:
 * 1. clsx: Xử lý conditional class names (giống classnames library)
 * 2. twMerge: Merge Tailwind classes và xử lý conflicts
 * VÍ DỤ: cn("px-2 py-1", "px-4") -> "py-1 px-4" (px-2 bị ghi đè bởi px-4)
 * TẠI SAO CẦN: Tailwind classes có thể conflict, cần merge đúng thứ tự ưu tiên
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
