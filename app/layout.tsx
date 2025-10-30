// import { cookies } from "next/headers";
// import type { Metadata } from "next";

// import "./globals.css";
// import { cn } from "@/lib/utils";
// import { ThemeProvider } from "@/components/providers/theme-provider";
// import { ActiveThemeProvider } from "@/components/active-theme";
// import { Navbar } from "@/components/navbar";
// import { Poppins } from "next/font/google";

// const poppins = Poppins({
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
//   variable: "--font-poppins",
//   display: "swap",
// });

// export const metadata: Metadata = {
//   title: "OP Dashboard",
//   description:
//     "A fully responsive analytics dashboard featuring dynamic charts, interactive tables, a collapsible sidebar, and a light/dark mode theme switcher. Built with modern web technologies, it ensures seamless performance across devices, offering an intuitive user interface for data visualization and exploration.",
// };

// export default async function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   const cookieStore = await cookies();
//   const activeThemeValue = cookieStore.get("active_theme")?.value;
//   const isScaled = activeThemeValue?.endsWith("-scaled");

//   return (
//     <html lang="en" suppressHydrationWarning>
//       <body
//         className={cn(
//           poppins.variable, // ✅ Apply Poppins globally

//           activeThemeValue ? `theme-${activeThemeValue}` : "",
//           isScaled ? "theme-scaled" : ""
//         )}
//       >
//         <ThemeProvider
//           attribute="class"
//           defaultTheme="system"
//           enableSystem
//           disableTransitionOnChange={true} // ✅ allow smooth transitions
//           enableColorScheme
//         >
//           <ActiveThemeProvider initialTheme={activeThemeValue}>
//             {/* ✅ Navbar hiển thị ở mọi trang */}
//             <Navbar />

//             {/* ✅ Nội dung từng page */}
//             <main className="min-h-screen">{children}</main>
//           </ActiveThemeProvider>
//         </ThemeProvider>
//       </body>
//     </html>
//   );
// }

// app/layout.tsx
// import { cookies } from "next/headers";
// import type { Metadata } from "next";
// import { Poppins } from "next/font/google";

// import "./globals.css";
// import { cn } from "@/lib/utils";
// import { ThemeProvider } from "@/components/providers/theme-provider";
// import { ActiveThemeProvider } from "@/components/active-theme";
// import { Navbar } from "@/components/navbar";
// import { AppProviders } from "@/components/providers/app-providers";
// // ------------------------------------------

// const poppins = Poppins({
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
//   variable: "--font-poppins",
//   display: "swap",
// });

// // --- SỬA LẠI METADATA CHO DỰ ÁN CỦA BẠN ---
// export const metadata: Metadata = {
//   title: "Tora Novel",
//   description: "Nền tảng đọc truyện tương tác với AI Voice",
// };
// // ------------------------------------------

// export default async function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   const cookieStore = await cookies();
//   const activeThemeValue = cookieStore.get("active_theme")?.value;
//   const isScaled = activeThemeValue?.endsWith("-scaled");

//   const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
//   if (!googleClientId) {
//     console.error("LỖI: NEXT_PUBLIC_GOOGLE_CLIENT_ID CHƯA ĐƯỢC THIẾT LẬP");
//   }
//   return (
//     <html lang="vi" suppressHydrationWarning>
//       {/* <-- Đổi sang "vi" */}
//       <body
//         className={cn(
//           poppins.variable,
//           activeThemeValue ? `theme-${activeThemeValue}` : "",
//           isScaled ? "theme-scaled" : ""
//         )}
//       >
//         <AppProviders activeThemeValue={activeThemeValue}>
//           {/* Navbar và main bây giờ là {children} của AppProviders */}
//           <Navbar />
//           <main className="min-h-screen">{children}</main>
//         </AppProviders>
//       </body>
//     </html>
//   );
// }

import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Navbar } from "@/components/navbar";
import { AppProviders } from "@/components/providers/app-providers";

// ------------------------------------------

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// --- Metadata ---
export const metadata: Metadata = {
  title: "Tora Novel",
  description: "Nền tảng đọc truyện tương tác với AI Voice",
};

// ------------------------------------------

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={cn(
          poppins.variable,
          activeThemeValue ? `theme-${activeThemeValue}` : "",
          isScaled ? "theme-scaled" : ""
        )}
      >
        {/* ✅ Bọc ThemeProvider ngoài cùng */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* ✅ AppProviders nếu cần global context */}
          <AppProviders activeThemeValue={activeThemeValue}>
            <Navbar />
            <main className="min-h-screen">{children}</main>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
