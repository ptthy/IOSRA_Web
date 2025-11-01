import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { ModeSwitcher } from "./mode-switcher";

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        
        {/* Sửa phần này */}
        <div className="flex flex-col">
          {/* <h1 className="text-base font-medium">Dashboard Analytics</h1>
          <p className="text-sm text-muted-foreground">Thống kê thời gian thực</p> */}
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <ModeSwitcher />
        </div>
      </div>
    </header>
  );
}