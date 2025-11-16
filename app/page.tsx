// // // app/page.tsx
// // "use client";

// // import { useState, useEffect } from "react";
// // import { useRouter } from "next/navigation";
// // import { useAuth } from "@/context/AuthContext";
// // import { Navbar } from "@/components/navbar";
// // import { Button } from "@/components/ui/button";
// // import { HeroCarousel } from "@/components/ads/hero-carousel";
// // import { SecondaryBanner } from "@/components/ads/secondary-banner";
// // import { RankBadge } from "@/components/rank-badge";
// // import { Book, TrendingUp, Clock, ChevronRight, Eye } from "lucide-react";
// // import { storyCatalogApi } from "@/services/storyCatalog";
// // import type { Story, TopWeeklyStory } from "@/services/storyCatalog";

// // // Component con để handle image với fallback
// // function StoryImage({
// //   src,
// //   alt,
// //   className,
// // }: {
// //   src: string;
// //   alt: string;
// //   className?: string;
// // }) {
// //   const [imageError, setImageError] = useState(false);

// //   const ERROR_IMG_SRC =
// //     "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

// //   if (imageError) {
// //     return (
// //       <div
// //         className={`flex items-center justify-center bg-muted ${
// //           className || ""
// //         }`}
// //       >
// //         <img
// //           src={ERROR_IMG_SRC}
// //           alt="Error loading image"
// //           className="w-20 h-20 opacity-50"
// //         />
// //       </div>
// //     );
// //   }

// //   return (
// //     <img
// //       src={src}
// //       alt={alt}
// //       className={className}
// //       onError={() => setImageError(true)}
// //     />
// //   );
// // }

// // // ĐỊNH NGHĨA PROPS CHO STORYCARD VỚI weeklyViewCount
// // interface CustomStoryCardProps {
// //   story: Story;
// //   onClick: () => void;
// //   weeklyViewCount?: number;
// // }

// // //  COMPONENT STORYCARD CUSTOM -
// // function CustomStoryCard({
// //   story,
// //   onClick,
// //   weeklyViewCount,
// // }: CustomStoryCardProps) {
// //   return (
// //     <div
// //       className="cursor-pointer transform transition-transform hover:scale-105 w-48 flex-shrink-0 h-full"
// //       onClick={onClick}
// //     >
// //       <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border h-full flex flex-col">
// //         {/* Story Image */}
// //         <div className="relative aspect-[3/4] overflow-hidden flex-shrink-0">
// //           <StoryImage
// //             src={story.coverUrl}
// //             alt={story.title}
// //             className="w-full h-full object-cover"
// //           />
// //           {story.isPremium && (
// //             <div className="absolute top-2 right-2">
// //               <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
// //                 Premium
// //               </span>
// //             </div>
// //           )}
// //         </div>

// //         {/* Story Info */}
// //         <div className="p-3 flex-1 flex flex-col min-h-0">
// //           <h3 className="font-semibold text-sm line-clamp-2 mb-2 flex-shrink-0">
// //             {story.title}
// //           </h3>
// //           <p className="text-xs text-muted-foreground mb-2 flex-shrink-0">
// //             {story.authorUsername}
// //           </p>

// //           {weeklyViewCount !== undefined && (
// //             <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3 flex-shrink-0">
// //               <Eye className="h-3 w-3" />
// //               <span>{weeklyViewCount} lượt/tuần</span>
// //             </div>
// //           )}

// //           {/* SỬA: HIỂN THỊ TAG FULL KHÔNG GIỚI HẠN */}
// //           <div className="flex flex-wrap gap-1 mt-auto">
// //             {story.tags.slice(0, 2).map((tag) => (
// //               <span
// //                 key={tag.tagId}
// //                 className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
// //               >
// //                 {tag.tagName}
// //               </span>
// //             ))}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // export default function HomePage() {
// //   const router = useRouter();
// //   const { isAuthenticated, isPremium } = useAuth();
// //   const [topWeekly, setTopWeekly] = useState<TopWeeklyStory[]>([]);
// //   const [latestStories, setLatestStories] = useState<Story[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);

// //   useEffect(() => {
// //     const loadData = async () => {
// //       setLoading(true);
// //       setError(null);
// //       try {
// //         console.log("🔄 Bắt đầu tải dữ liệu từ API...");

// //         const [weeklyResponse, latestResponse] = await Promise.all([
// //           storyCatalogApi.getTopWeeklyStories(10),
// //           storyCatalogApi.getLatestStories(10),
// //         ]);

// //         console.log("✅ Dữ liệu nhận được:", {
// //           topWeekly: weeklyResponse,
// //           latestStories: latestResponse,
// //         });

// //         if (!Array.isArray(weeklyResponse)) {
// //           throw new Error("Dữ liệu top weekly không hợp lệ");
// //         }

// //         if (!Array.isArray(latestResponse)) {
// //           throw new Error("Dữ liệu latest stories không hợp lệ");
// //         }

// //         setTopWeekly(weeklyResponse);
// //         setLatestStories(latestResponse);
// //       } catch (error: any) {
// //         console.error("❌ Lỗi tải dữ liệu:", error);

// //         if (error.response) {
// //           if (error.response.status === 404) {
// //             setError(
// //               "API endpoints không tồn tại. Vui lòng kiểm tra với quản trị viên."
// //             );
// //           } else if (error.response.status === 500) {
// //             setError("Lỗi server. Vui lòng thử lại sau.");
// //           } else {
// //             setError(
// //               `Lỗi server: ${error.response.status} - ${error.response.statusText}`
// //             );
// //           }
// //         } else if (error.request) {
// //           setError(
// //             "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
// //           );
// //         } else {
// //           setError(error.message || "Có lỗi xảy ra khi tải dữ liệu.");
// //         }

// //         setTopWeekly([]);
// //         setLatestStories([]);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     loadData();
// //   }, []);

// //   const handleNavigate = (page: string, storyId?: string) => {
// //     if (storyId) {
// //       router.push(`/${page}/${storyId}`);
// //     } else {
// //       router.push(`/${page}`);
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen bg-background">
// //         <Navbar />
// //         <div className="flex items-center justify-center min-h-[60vh]">
// //           <div className="text-center">
// //             <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
// //             <p className="text-muted-foreground">Đang tải...</p>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div className="min-h-screen bg-background">
// //         <Navbar />
// //         <div className="flex items-center justify-center min-h-[60vh]">
// //           <div className="text-center">
// //             <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
// //               <Book className="h-8 w-8 text-destructive" />
// //             </div>
// //             <h3 className="text-lg font-semibold mb-2">Có lỗi xảy ra</h3>
// //             <p className="text-muted-foreground mb-4">{error}</p>
// //             <Button onClick={() => window.location.reload()}>Thử lại</Button>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-background">
// //       <Navbar />

// //       {/* Hero Carousel */}
// //       <div className="animate-fade-in">
// //         <div className="container mx-auto px-4">
// //           <HeroCarousel />
// //         </div>
// //       </div>

// //       {/* Top Truyện Tuần */}
// //       <section className="py-4 animate-slide-up bg-background">
// //         {" "}
// //         {/* GIẢM XUỐNG py-4 */}
// //         <div className="container mx-auto px-4">
// //           <div className="flex items-center justify-between mb-4">
// //             {" "}
// //             {/* GIẢM XUỐNG mb-4 */}
// //             <div className="flex items-center gap-3">
// //               <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
// //                 <TrendingUp className="h-5 w-5 text-primary" />
// //               </div>
// //               <div>
// //                 <h2 className="font-bold text-2xl md:text-3xl">
// //                   Top Truyện Tuần
// //                 </h2>
// //                 <p className="text-sm text-muted-foreground mt-1">
// //                   Những tác phẩm hot nhất tuần này
// //                 </p>
// //               </div>
// //             </div>
// //             <button
// //               onClick={() => handleNavigate("search")}
// //               className="flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all group"
// //             >
// //               <span className="hidden sm:inline">Xem tất cả</span>
// //               <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
// //             </button>
// //           </div>
// //           <div className="relative">
// //             <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-custom scroll-smooth pt-1 px-0">
// //               {" "}
// //               {/* GIẢM gap, pb, pt */}
// //               {topWeekly.map((item, index) => (
// //                 <div
// //                   key={item.story.storyId}
// //                   className="relative flex-shrink-0"
// //                 >
// //                   {index < 3 && <RankBadge rank={index + 1} />}
// //                   <CustomStoryCard
// //                     story={item.story}
// //                     onClick={() => handleNavigate("story", item.story.storyId)}
// //                     weeklyViewCount={item.weeklyViewCount}
// //                   />
// //                 </div>
// //               ))}
// //             </div>
// //           </div>
// //         </div>
// //       </section>

// //       {/* Secondary Banner  */}
// //       {!isPremium && (
// //         <div className="container mx-auto px-4 py-2">
// //           {" "}
// //           {/* ✅ GIẢM XUỐNG py-2 */}
// //           <SecondaryBanner />
// //         </div>
// //       )}

// //       {/* Truyện Mới Cập Nhật  */}
// //       <section
// //         className="py-4 animate-slide-up"
// //         style={{ animationDelay: "0.1s" }}
// //       >
// //         <div className="container mx-auto px-4">
// //           <div className="flex items-center justify-between mb-4">
// //             {" "}
// //             {/* GIẢM XUỐNG mb-4 */}
// //             <div className="flex items-center gap-3">
// //               <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10">
// //                 <Clock className="h-5 w-5 text-secondary" />
// //               </div>
// //               <div>
// //                 <h2 className="font-bold text-2xl md:text-3xl">
// //                   Truyện Mới Cập Nhật
// //                 </h2>
// //                 <p className="text-sm text-muted-foreground mt-1">
// //                   Những chương mới nhất vừa được đăng tải
// //                 </p>
// //               </div>
// //             </div>
// //             <button
// //               onClick={() => handleNavigate("search")}
// //               className="flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all group"
// //             >
// //               <span className="hidden sm:inline">Xem tất cả</span>
// //               <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
// //             </button>
// //           </div>

// //           <div className="relative">
// //             <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-custom scroll-smooth pt-1 px-0">
// //               {" "}
// //               {/*  GIẢM gap, pb, pt */}
// //               {latestStories.map((story) => (
// //                 <div key={story.storyId} className="flex-shrink-0">
// //                   <CustomStoryCard
// //                     story={story}
// //                     onClick={() => handleNavigate("story", story.storyId)}
// //                   />
// //                 </div>
// //               ))}
// //             </div>
// //           </div>
// //         </div>
// //       </section>

// //       {/* CTA Section -  */}
// //       <section className="border-t py-8 bg-muted/50">
// //         {" "}
// //         {/* GIẢM XUỐNG py-8 */}
// //         <div className="container mx-auto px-4 text-center">
// //           <div className="max-w-2xl mx-auto">
// //             <h2 className="text-3xl font-bold mb-4">
// //               Bạn có câu chuyện để kể?
// //             </h2>
// //             <p className="text-muted-foreground mb-6">
// //               {" "}
// //               {/* GIẢM XUỐNG mb-6 */}
// //               Tham gia cộng đồng tác giả của chúng tôi và chia sẻ câu chuyện của
// //               bạn với hàng triệu độc giả trên khắp thế giới.
// //             </p>
// //           </div>
// //         </div>
// //       </section>
// //     </div>
// //   );
// // }
// // app/page.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
// import { Navbar } from "@/components/navbar";
// import { Button } from "@/components/ui/button";
// import { HeroCarousel } from "@/components/ads/hero-carousel";
// import { SecondaryBanner } from "@/components/ads/secondary-banner";
// import { RankBadge } from "@/components/rank-badge";
// import { StoryCard } from "@/components/story-card"; // ✅ IMPORT STORYCARD
// import { TrendingUp, Clock, ChevronRight } from "lucide-react";
// import { storyCatalogApi } from "@/services/storyCatalog";
// import type { Story, TopWeeklyStory } from "@/services/storyCatalog";

// export default function HomePage() {
//   const router = useRouter();
//   const { isAuthenticated, isPremium } = useAuth();
//   const [topWeekly, setTopWeekly] = useState<TopWeeklyStory[]>([]);
//   const [latestStories, setLatestStories] = useState<Story[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         console.log("🔄 Bắt đầu tải dữ liệu từ API...");

//         const [weeklyResponse, latestResponse] = await Promise.all([
//           storyCatalogApi.getTopWeeklyStories(10),
//           storyCatalogApi.getLatestStories(10),
//         ]);

//         console.log("✅ Dữ liệu nhận được:", {
//           topWeekly: weeklyResponse,
//           latestStories: latestResponse,
//         });

//         if (!Array.isArray(weeklyResponse)) {
//           throw new Error("Dữ liệu top weekly không hợp lệ");
//         }

//         if (!Array.isArray(latestResponse)) {
//           throw new Error("Dữ liệu latest stories không hợp lệ");
//         }

//         setTopWeekly(weeklyResponse);
//         setLatestStories(latestResponse);
//       } catch (error: any) {
//         console.error("❌ Lỗi tải dữ liệu:", error);

//         if (error.response) {
//           if (error.response.status === 404) {
//             setError(
//               "API endpoints không tồn tại. Vui lòng kiểm tra với quản trị viên."
//             );
//           } else if (error.response.status === 500) {
//             setError("Lỗi server. Vui lòng thử lại sau.");
//           } else {
//             setError(
//               `Lỗi server: ${error.response.status} - ${error.response.statusText}`
//             );
//           }
//         } else if (error.request) {
//           setError(
//             "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
//           );
//         } else {
//           setError(error.message || "Có lỗi xảy ra khi tải dữ liệu.");
//         }

//         setTopWeekly([]);
//         setLatestStories([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, []);

//   const handleNavigate = (page: string, storyId?: string) => {
//     if (storyId) {
//       router.push(`/${page}/${storyId}`);
//     } else {
//       router.push(`/${page}`);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-background">
//         <Navbar />
//         <div className="flex items-center justify-center min-h-[60vh]">
//           <div className="text-center">
//             <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//             <p className="text-muted-foreground">Đang tải...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-background">
//         <Navbar />
//         <div className="flex items-center justify-center min-h-[60vh]">
//           <div className="text-center">
//             <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
//               <Book className="h-8 w-8 text-destructive" />
//             </div>
//             <h3 className="text-lg font-semibold mb-2">Có lỗi xảy ra</h3>
//             <p className="text-muted-foreground mb-4">{error}</p>
//             <Button onClick={() => window.location.reload()}>Thử lại</Button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />

//       {/* Hero Carousel */}
//       <div className="animate-fade-in">
//         <div className="container mx-auto px-4">
//           <HeroCarousel />
//         </div>
//       </div>

//       {/* Top Truyện Tuần */}
//       <section className="py-4 animate-slide-up bg-background">
//         <div className="container mx-auto px-4">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-3">
//               <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
//                 <TrendingUp className="h-5 w-5 text-primary" />
//               </div>
//               <div>
//                 <h2 className="font-bold text-2xl md:text-3xl">
//                   Top Truyện Tuần
//                 </h2>
//                 <p className="text-sm text-muted-foreground mt-1">
//                   Những tác phẩm hot nhất tuần này
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => handleNavigate("search")}
//               className="flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all group"
//             >
//               <span className="hidden sm:inline">Xem tất cả</span>
//               <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
//             </button>
//           </div>
//           <div className="relative">
//             <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-custom scroll-smooth pt-1 px-0">
//               {topWeekly.map((item, index) => (
//                 <div
//                   key={item.story.storyId}
//                   className="relative flex-shrink-0"
//                 >
//                   {index < 3 && <RankBadge rank={index + 1} />}
//                   {/* ✅ SỬ DỤNG STORYCARD */}
//                   <StoryCard
//                     story={item.story}
//                     onClick={() => handleNavigate("story", item.story.storyId)}
//                   />
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Secondary Banner */}
//       {!isPremium && (
//         <div className="container mx-auto px-4 py-2">
//           <SecondaryBanner />
//         </div>
//       )}

//       {/* Truyện Mới Cập Nhật */}
//       <section
//         className="py-4 animate-slide-up"
//         style={{ animationDelay: "0.1s" }}
//       >
//         <div className="container mx-auto px-4">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-3">
//               <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10">
//                 <Clock className="h-5 w-5 text-secondary" />
//               </div>
//               <div>
//                 <h2 className="font-bold text-2xl md:text-3xl">
//                   Truyện Mới Cập Nhật
//                 </h2>
//                 <p className="text-sm text-muted-foreground mt-1">
//                   Những chương mới nhất vừa được đăng tải
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => handleNavigate("search")}
//               className="flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all group"
//             >
//               <span className="hidden sm:inline">Xem tất cả</span>
//               <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
//             </button>
//           </div>

//           <div className="relative">
//             <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-custom scroll-smooth pt-1 px-0">
//               {latestStories.map((story) => (
//                 <div key={story.storyId} className="flex-shrink-0">
//                   {/* ✅ SỬ DỤNG STORYCARD */}
//                   <StoryCard
//                     story={story}
//                     onClick={() => handleNavigate("story", story.storyId)}
//                   />
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="border-t py-8 bg-muted/50">
//         <div className="container mx-auto px-4 text-center">
//           <div className="max-w-2xl mx-auto">
//             <h2 className="text-3xl font-bold mb-4">
//               Bạn có câu chuyện để kể?
//             </h2>
//             <p className="text-muted-foreground mb-6">
//               Tham gia cộng đồng tác giả của chúng tôi và chia sẻ câu chuyện của
//               bạn với hàng triệu độc giả trên khắp thế giới.
//             </p>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }
// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/ads/hero-carousel";
import { SecondaryBanner } from "@/components/ads/secondary-banner";
import { RankBadge } from "@/components/rank-badge";
import { StoryCard } from "@/components/story-card";
import { Book, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { storyCatalogApi } from "@/services/storyCatalog";
import type { Story, TopWeeklyStory } from "@/services/storyCatalog";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isPremium } = useAuth();
  const [topWeekly, setTopWeekly] = useState<TopWeeklyStory[]>([]);
  const [latestStories, setLatestStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("🔄 Bắt đầu tải dữ liệu từ API...");

        const [weeklyResponse, latestResponse] = await Promise.all([
          storyCatalogApi.getTopWeeklyStories(10),
          storyCatalogApi.getLatestStories(10),
        ]);

        console.log("✅ Dữ liệu nhận được:", {
          topWeekly: weeklyResponse,
          latestStories: latestResponse,
        });

        if (!Array.isArray(weeklyResponse)) {
          throw new Error("Dữ liệu top weekly không hợp lệ");
        }

        if (!Array.isArray(latestResponse)) {
          throw new Error("Dữ liệu latest stories không hợp lệ");
        }

        setTopWeekly(weeklyResponse);
        setLatestStories(latestResponse);
      } catch (error: any) {
        console.error("❌ Lỗi tải dữ liệu:", error);

        if (error.response) {
          if (error.response.status === 404) {
            setError(
              "API endpoints không tồn tại. Vui lòng kiểm tra với quản trị viên."
            );
          } else if (error.response.status === 500) {
            setError("Lỗi server. Vui lòng thử lại sau.");
          } else {
            setError(
              `Lỗi server: ${error.response.status} - ${error.response.statusText}`
            );
          }
        } else if (error.request) {
          setError(
            "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
          );
        } else {
          setError(error.message || "Có lỗi xảy ra khi tải dữ liệu.");
        }

        setTopWeekly([]);
        setLatestStories([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleNavigate = (page: string, storyId?: string) => {
    if (storyId) {
      router.push(`/${page}/${storyId}`);
    } else {
      router.push(`/${page}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Book className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Có lỗi xảy ra</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Carousel */}
      <div className="animate-fade-in">
        <div className="container mx-auto px-4">
          <HeroCarousel />
        </div>
      </div>

      {/* Top Truyện Tuần */}
      <section className="py-4 animate-slide-up bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-2xl md:text-3xl">
                  Top Truyện Tuần
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Những tác phẩm hot nhất tuần này
                </p>
              </div>
            </div>
            <button
              onClick={() => handleNavigate("search")}
              className="flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all group"
            >
              <span className="hidden sm:inline">Xem tất cả</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="relative">
            {/* QUAN TRỌNG: Thêm min-h-[420px] để đảm bảo tất cả card cùng chiều cao */}
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-custom scroll-smooth pt-1 px-0 min-h-[420px]">
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

      {/* Secondary Banner */}
      {!isPremium && (
        <div className="container mx-auto px-4 py-2">
          <SecondaryBanner />
        </div>
      )}

      {/* Truyện Mới Cập Nhật */}
      <section
        className="py-4 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10">
                <Clock className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h2 className="font-bold text-2xl md:text-3xl">
                  Truyện Mới Cập Nhật
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Những chương mới nhất vừa được đăng tải
                </p>
              </div>
            </div>
            <button
              onClick={() => handleNavigate("search")}
              className="flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all group"
            >
              <span className="hidden sm:inline">Xem tất cả</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="relative">
            {/* QUAN TRỌNG: Thêm min-h-[420px] để đảm bảo tất cả card cùng chiều cao */}
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-custom scroll-smooth pt-1 px-0 min-h-[420px]">
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

      {/* CTA Section */}
      <section className="border-t py-8 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Bạn có câu chuyện để kể?
            </h2>
            <p className="text-muted-foreground mb-6">
              Tham gia cộng đồng tác giả của chúng tôi và chia sẻ câu chuyện của
              bạn với hàng triệu độc giả trên khắp thế giới.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
