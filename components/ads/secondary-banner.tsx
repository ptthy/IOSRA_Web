import React from "react";
import { Zap } from "lucide-react";

// Thêm interface để nhận prop onClick
interface SecondaryBannerProps {
  onClick?: () => void;
}

export function SecondaryBanner({ onClick }: SecondaryBannerProps) {
  return (
    // Giảm my-8 xuống my-4 để thu hẹp khoảng cách
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-accent/40 via-muted to-accent/40 p-6 my-4 border border-border/50 shadow-sm min-h-[100px]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold mb-1 font-sans">
              Bỏ lỡ nội dung Premium?
            </p>
            <p className="text-sm text-muted-foreground font-sans">
              Nâng cấp để trải nghiệm đầy đủ
            </p>
          </div>
        </div>

        <button
          onClick={onClick}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm md:text-base font-medium font-sans hover:bg-primary/90 transition-all shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer"
        >
          Tìm hiểu thêm
        </button>
      </div>
    </div>
  );
}
