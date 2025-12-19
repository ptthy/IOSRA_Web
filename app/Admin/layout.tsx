import { Roboto } from "next/font/google"; // 1. Import font từ Google Fonts
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AdminSidebar } from "./components/admin-sidebar";

// 2. Cấu hình font Roboto
const roboto = Roboto({
  weight: ["300", "400", "500", "700"], // Các độ đậm nhạt của chữ
  subsets: ["latin", "vietnamese"],      // Hỗ trợ tiếng Việt
  display: "swap",
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // 3. Áp dụng font vào class của thẻ bao bọc ngoài cùng
    <div className={roboto.className}>
      <SidebarProvider>
        <AdminSidebar />

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />

              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/Admin">Admin</BreadcrumbLink>
                  </BreadcrumbItem>

                  <BreadcrumbSeparator className="hidden md:block" />

                  <BreadcrumbItem>
                    <BreadcrumbPage>Hệ thống quản trị</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-gray-50/50 dark:bg-zinc-900/50">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}