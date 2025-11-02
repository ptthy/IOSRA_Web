import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { ModeSwitcher } from "./mode-switcher"; // Giữ import nếu không muốn xóa file ModeSwitcher

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        
        {/* Đã xóa SidebarTrigger và Separator */}
        
        <div className="flex flex-col">
          {/* <h1 className="text-base font-medium">Dashboard Analytics</h1>
          <p className="text-sm text-muted-foreground">Thống kê thời gian thực</p> */}
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {/* ✅ SỬA: Đã xóa dòng gọi ModeSwitcher */}
          {/* <ModeSwitcher /> */}
        </div>
      </div>
    </header>
  );
}