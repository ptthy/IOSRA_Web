import React from "react";
import { Zap } from "lucide-react";

export function SecondaryBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-accent/40 via-muted to-accent/40 p-8 my-8 border border-border/50 shadow-sm min-h-[120px]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold mb-1">
              Bỏ lỡ nội dung Premium?
            </p>
            <p className="text-sm text-muted-foreground">
              Nâng cấp để trải nghiệm đầy đủ
            </p>
          </div>
        </div>

        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-base font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg whitespace-nowrap">
          Tìm hiểu thêm
        </button>
      </div>
    </div>
  );
}
