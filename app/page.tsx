//app/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/ads/hero-carousel";
import { SecondaryBanner } from "@/components/ads/secondary-banner";
import { RankBadge } from "@/components/rank-badge";
import { StoryCard } from "@/components/story-card";
import { TopUpModal } from "@/components/payment/TopUpModal";
import { HeroSection } from "@/components/ads/hero-section";
import {
  Book,
  TrendingUp,
  Sparkles,
  Clock,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { storyCatalogApi } from "@/services/storyCatalog";
import { profileService } from "@/services/profileService"; // Import service lấy ví
import type { Story, TopWeeklyStory } from "@/services/storyCatalog";
/**
 * HOMEPAGE - TRANG CHỦ
 *
 * MỤC ĐÍCH: Trang landing page chính của ứng dụng
 * CHỨC NĂNG CHÍNH:
 * 1. Hiển thị hero section (carousel/hero)
 * 2. Hiển thị top truyện tuần (có rank badge)
 * 3. Hiển thị truyện mới cập nhật
 * 4. Hiển thị banner quảng cáo/upsell (nếu không phải premium)
 * 5. Quản lý modal nạp tiền
 * 6. Fetch và hiển thị số dư ví nếu đã đăng nhập
 *
 * FLOW DỮ LIỆU:
 * 1. Fetch top weekly và latest stories khi trang load
 * 2. Fetch số dư ví nếu user đã đăng nhập
 * 3. Render các section với horizontal scroll
 * 4. Xử lý click để điều hướng đến story detail
 */

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isPremium } = useAuth();

  // State dữ liệu truyện
  const [topWeekly, setTopWeekly] = useState<TopWeeklyStory[]>([]);
  const [latestStories, setLatestStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State quản lý Modal & Ví
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [balance, setBalance] = useState(0); // State lưu số dư kim cương

  // Refs scroll
  const weeklyScrollRef = useRef<HTMLDivElement | null>(null);
  const latestScrollRef = useRef<HTMLDivElement | null>(null);

  /**
   * HÀM SCROLL HORIZONTAL
   *
   * LOGIC: Scroll container theo distance (pixel)
   * - distance > 0: scroll sang phải
   * - distance < 0: scroll sang trái
   * - behavior: "smooth" để có hiệu ứng mượt
   */
  const scrollWeeklyByDistance = (distance: number) => {
    if (!weeklyScrollRef.current) return;
    weeklyScrollRef.current.scrollBy({ left: distance, behavior: "smooth" });
  };

  const scrollLatestByDistance = (distance: number) => {
    if (!latestScrollRef.current) return;
    latestScrollRef.current.scrollBy({ left: distance, behavior: "smooth" });
  };

  /**
   * EFFECT 1: FETCH DỮ LIỆU TRUYỆN
   *
   * MỤC ĐÍCH: Load top weekly và latest stories khi trang load
   *
   * LOGIC:
   * 1. Set loading = true
   * 2. Gọi 2 API song song (Promise.all) để tối ưu performance
   * 3. Xử lý response: Kiểm tra Array.isArray để đảm bảo type safety
   * 4. Xử lý error: Set error message
   * 5. Set loading = false
   *
   * CHẠY KHI: [] (chỉ chạy 1 lần khi component mount)
   */
  useEffect(() => {
    const loadStories = async () => {
      setLoading(true);
      setError(null);
      try {
        const [weeklyResponse, latestResponse] = await Promise.all([
          storyCatalogApi.getTopWeeklyStories(10),
          storyCatalogApi.getLatestStories(10),
        ]);

        if (Array.isArray(weeklyResponse)) setTopWeekly(weeklyResponse);
        if (Array.isArray(latestResponse)) setLatestStories(latestResponse);
      } catch (error: any) {
        console.error("Lỗi tải trang chủ:", error);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);

  /**
   * EFFECT 2: FETCH SỐ DƯ VÍ
   *
   * MỤC ĐÍCH: Lấy số dư kim cương của user nếu đã đăng nhập
   *
   * LOGIC:
   * 1. Chỉ fetch nếu isAuthenticated = true
   * 2. Gọi API getWallet từ profileService
   * 3. Cập nhật state balance
   * 4. Nếu không đăng nhập: reset balance về 0
   *
   * CHẠY KHI: isAuthenticated thay đổi
   * - Khi user login/logout
   * - Khi trang load và đã có session
   */
  useEffect(() => {
    const loadWallet = async () => {
      if (isAuthenticated) {
        try {
          // Gọi API lấy ví giống như bên trang Profile
          const res = await profileService.getWallet();
          if (res.data) {
            setBalance(res.data.diaBalance || 0);
          }
        } catch (error) {
          console.error("Không thể tải thông tin ví:", error);
        }
      } else {
        setBalance(0); // Reset về 0 nếu chưa đăng nhập
      }
    };

    loadWallet();
  }, [isAuthenticated]); // Chạy lại khi trạng thái đăng nhập thay đổi
  /**
   * HÀM ĐIỀU HƯỚNG
   *
   * LOGIC:
   * - Nếu có storyId: điều hướng đến trang story detail
   * - Nếu không có: điều hướng đến trang chung (search)
   */
  const handleNavigate = (page: string, storyId?: string) => {
    if (storyId) router.push(`/${page}/${storyId}`);
    else router.push(`/${page}`);
  };
  // RENDER LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  // RENDER ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans">
        <Book className="h-10 w-10 text-destructive mb-4" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Thử lại</Button>
      </div>
    );
  }

  // Style cho nút điều hướng carousel (ẩn/hiện khi hover)
  const navigationButtonClass =
    "absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full " +
    "bg-card border border-border shadow-lg text-foreground/80 hover:text-primary hover:bg-accent hover:scale-110 transition-all " +
    "opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 cursor-pointer";

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero Section - Updated  */}
      <div className="animate-fade-in pt-4 pb-2">
        <div className="container mx-auto px-4">
          <HeroSection onNavigate={(path) => router.push(path)} />
        </div>
      </div>
      {/* Top Truyện Tuần */}
      <section className="py-2 animate-slide-up bg-background mt-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-xl md:text-2xl leading-tight">
                  Top Truyện Tuần
                </h2>
              </div>
            </div>
            <button
              onClick={() => handleNavigate("search")}
              className="flex items-center gap-1 text-xs md:text-sm text-primary hover:gap-2 transition-all group font-medium"
            >
              <span className="hidden sm:inline">Xem tất cả</span>
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          {/* Carousel với nút điều hướng */}
          <div className="relative group/carousel">
            <button
              aria-label="Previous"
              onClick={() => scrollWeeklyByDistance(-420)}
              className={`${navigationButtonClass} -left-3 md:-left-8`}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              aria-label="Next"
              onClick={() => scrollWeeklyByDistance(420)}
              className={`${navigationButtonClass} -right-3 md:-right-8`}
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* List Top Weekly với horizontal scroll */}
            <div
              ref={weeklyScrollRef}
              className="flex overflow-x-auto gap-4 pb-4 pt-2 px-1 min-h-[380px] scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            >
              {topWeekly.map((item, index) => (
                <div
                  key={item.story.storyId}
                  className="relative flex-shrink-0"
                >
                  {index < 3 && <RankBadge rank={index + 1} />}
                  <StoryCard
                    story={item.story}
                    onClick={() => handleNavigate("story", item.story.storyId)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Banner - Chỉ hiển thị nếu không phải premium user */}
      {!isPremium && (
        <div className="container mx-auto px-4">
          <SecondaryBanner onClick={() => setShowTopUpModal(true)} />
        </div>
      )}

      {/* Truyện Mới Cập Nhật */}
      <section className="py-2 animate-slide-up bg-background mt-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-xl md:text-2xl leading-tight">
                  Mới cập nhật
                </h2>
              </div>
            </div>
            <button
              onClick={() => handleNavigate("search")}
              className="flex items-center gap-1 text-xs md:text-sm text-primary hover:gap-2 transition-all group font-medium"
            >
              <span className="hidden sm:inline">Xem tất cả</span>
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          {/* Carousel tương tự cho latest stories */}
          <div className="relative group/carousel">
            <button
              aria-label="Previous"
              onClick={() => scrollLatestByDistance(-420)}
              className={`${navigationButtonClass} -left-3 md:-left-8`}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              aria-label="Next"
              onClick={() => scrollLatestByDistance(420)}
              className={`${navigationButtonClass} -right-3 md:-right-8`}
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* List Latest Stories */}
            <div
              ref={latestScrollRef}
              className="flex overflow-x-auto gap-4 py-4 px-1 min-h-[380px] scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            >
              {latestStories.map((story) => (
                <div key={story.storyId} className="flex-shrink-0">
                  <StoryCard
                    story={story}
                    onClick={() => handleNavigate("story", story.storyId)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MODAL NẠP TIỀN */}
      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        // Sử dụng state balance đã được fetch từ API
        currentBalance={balance}
      />
    </div>
  );
}
