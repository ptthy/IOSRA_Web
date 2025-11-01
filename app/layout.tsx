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
