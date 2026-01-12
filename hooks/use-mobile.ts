import * as React from "react";
/**
 * Breakpoint cho mobile (768px là tiêu chuẩn cho tablet trở xuống)
 */
const MOBILE_BREAKPOINT = 768;
/**
 * Custom hook để kiểm tra xem thiết bị có phải mobile không
 * Logic:
 * 1. Sử dụng useState để lưu trạng thái isMobile
 * 2. Sử dụng useEffect để thiết lập listener khi component mount
 * 3. Dùng matchMedia để lắng nghe thay đổi kích thước màn hình
 * 4. Cleanup listener khi component unmount
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    /**
     * Tạo MediaQueryList để kiểm tra điều kiện màn hình
     * (max-width: 767px) nghĩa là mobile
     */
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    /**
     * Hàm xử lý khi kích thước màn hình thay đổi
     */
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    // Thêm event listener cho sự kiện change
    mql.addEventListener("change", onChange);
    // Thiết lập giá trị ban đầu
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    /**
     * Cleanup: Xóa event listener khi component unmount
     * Để tránh memory leak
     */
    return () => mql.removeEventListener("change", onChange);
  }, []); // Empty dependency array: chỉ chạy một lần khi mount

  return !!isMobile; // Ép kiểu về boolean (undefined -> false)
}
