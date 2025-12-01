import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Navbar } from "@/components/layout/Navbar";

import { AuthProvider } from "@/context/AuthContext";

import { AppProviders } from "@/components/providers/app-providers";
import { ChatBotWidget } from "@/components/chat/ChatBotWidget";
import { ModalProvider } from "@/context/ModalContext";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tora Novel",
  description: "Nền tảng đọc truyện tương tác với AI Voice",
};

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <AppProviders activeThemeValue={activeThemeValue}>
              <ModalProvider>
                <Navbar />

                {children}
                <ChatBotWidget />
              </ModalProvider>
            </AppProviders>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
