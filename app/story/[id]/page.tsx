// //app/story/[id]/page.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useParams, useRouter } from "next/navigation";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Loader2,
//   BookOpen,
//   Eye,
//   Clock,
//   CheckCircle2,
//   XCircle,
//   Plus,
//   Edit,
//   FileText,
//   Lightbulb,
// } from "lucide-react";
// import { storyService } from "@/services/storyService"; // Chỉ import service
// import type { Story } from "@/services/apiTypes"; // Import Story từ apiTypes
// import { Alert, AlertDescription } from "@/components/ui/alert";

// // --- COMPONENT IMAGEWITHFALLBACK ---
// const ERROR_IMG_SRC =
//   "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

// export function ImageWithFallback(
//   props: React.ImgHTMLAttributes<HTMLImageElement>
// ) {
//   const [didError, setDidError] = useState(false);

//   const handleError = () => {
//     setDidError(true);
//   };

//   const { src, alt, style, className, ...rest } = props;

//   return didError ? (
//     <div
//       className={`inline-block bg-gray-100 text-center align-middle ${
//         className ?? ""
//       }`}
//       style={style}
//     >
//       <div className="flex items-center justify-center w-full h-full">
//         <img
//           src={ERROR_IMG_SRC}
//           alt="Error loading image"
//           {...rest}
//           data-original-url={src}
//         />
//       </div>
//     </div>
//   ) : (
//     <img
//       src={src}
//       alt={alt}
//       className={className}
//       style={style}
//       {...rest}
//       onError={handleError}
//     />
//   );
// }
// // ---------------------------------------------

// // Mock chapters data - Sửa: cập nhật status thành chữ thường
// const MOCK_CHAPTERS = [
//   {
//     chapterId: "ch1",
//     title: "Chương 1: Khởi đầu",
//     status: "published",
//     publishedAt: "2024-11-01",
//   },
//   {
//     chapterId: "ch2",
//     title: "Chương 2: Cuộc gặp gỡ",
//     status: "published",
//     publishedAt: "2024-11-02",
//   },
//   {
//     chapterId: "ch3",
//     title: "Chương 3: Thử thách đầu tiên",
//     status: "pending",
//     publishedAt: null,
//   },
//   {
//     chapterId: "ch4",
//     title: "Chương 4: Bí ẩn",
//     status: "draft",
//     publishedAt: null,
//   },
// ];

// export default function StoryDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const storyId = params.id as string;

//   const [story, setStory] = useState<Story | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     loadStory();
//   }, [storyId]);

//   const loadStory = async () => {
//     setIsLoading(true);
//     try {
//       // Sửa: dùng getStoryDetails thay vì getStoryById
//       const data = await storyService.getStoryDetails(storyId);
//       setStory(data);
//     } catch (error) {
//       console.error("Error loading story:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleNavigate = (page: string, navParams?: any) => {
//     const routes: Record<string, string> = {
//       home: "/",
//       discover: "/discover",
//       "author-dashboard": "/author/overview",
//       "submit-ai": `/author/story/${navParams?.storyId}/submit-ai`,
//       "ai-result": `/author/story/${navParams?.storyId}/ai-result`,
//       "outline-editor": `/author/story/${navParams?.storyId}/outline`,
//       "chapter-editor": navParams?.chapterId
//         ? `/author/story/${navParams?.storyId}/chapter/${navParams.chapterId}`
//         : `/author/story/${navParams?.storyId}/chapter/new`,
//       "manage-chapters": `/author/story/${navParams?.storyId}/chapters`,
//     };
//     const route = routes[page] || `/${page}`;
//     router.push(route);
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center py-16">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   if (!story) {
//     return (
//       <div className="flex flex-col items-center justify-center py-16">
//         <BookOpen className="h-16 w-16 mb-4 text-muted-foreground" />
//         <p className="text-muted-foreground mb-4">Không tìm thấy truyện</p>
//         <Button onClick={() => handleNavigate("author-dashboard")}>
//           Quay lại Dashboard
//         </Button>
//       </div>
//     );
//   }

//   // Sửa: cập nhật getStatusBadge để dùng status chữ thường
//   const getStatusBadge = (status: Story["status"]) => {
//     switch (status) {
//       case "draft":
//         return {
//           label: "Bản nháp",
//           variant: "secondary" as const,
//           icon: Clock,
//         };
//       case "pending":
//         return {
//           label: "Chờ duyệt",
//           variant: "secondary" as const,
//           icon: Clock,
//           className:
//             "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
//         };
//       case "published":
//         return {
//           label: "Đã xuất bản",
//           variant: "secondary" as const,
//           icon: CheckCircle2,
//           className:
//             "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
//         };
//       case "rejected":
//         return {
//           label: "Bị từ chối",
//           variant: "destructive" as const,
//           icon: XCircle,
//         };
//       default:
//         return { label: status, variant: "secondary" as const, icon: BookOpen };
//     }
//   };

//   // Sửa: cập nhật getChapterStatusBadge để dùng status chữ thường
//   const getChapterStatusBadge = (status: string) => {
//     switch (status) {
//       case "draft":
//         return <Badge variant="secondary">Bản nháp</Badge>;
//       case "pending":
//         return (
//           <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
//             Chờ duyệt
//           </Badge>
//         );
//       case "published":
//         return (
//           <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
//             Đã xuất bản
//           </Badge>
//         );
//       case "rejected":
//         return <Badge variant="destructive">Bị từ chối</Badge>;
//       default:
//         return <Badge variant="outline">{status}</Badge>;
//     }
//   };

//   const statusInfo = getStatusBadge(story.status);
//   const StatusIcon = statusInfo.icon;
//   // Sửa: cập nhật canManageChapters để dùng status chữ thường
//   const canManageChapters = story.status === "published";

//   return (
//     <div className="space-y-6 pb-8">
//       {/* Story Info Card */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="flex flex-col md:flex-row gap-6">
//             {/* Cover Image */}
//             <div className="flex-shrink-0">
//               <div className="w-40 rounded-lg overflow-hidden shadow-md border">
//                 {story.coverUrl ? (
//                   <ImageWithFallback
//                     src={story.coverUrl}
//                     alt={story.title}
//                     className="w-full aspect-[2/3] object-cover"
//                   />
//                 ) : (
//                   <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
//                     <BookOpen className="h-8 w-8 text-muted-foreground" />
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Story Info */}
//             <div className="flex-1 space-y-4">
//               {/* Title & Status */}
//               <div>
//                 <h1 className="text-2xl mb-2">{story.title}</h1>
//                 <div className="flex items-center gap-2">
//                   <Badge
//                     variant={statusInfo.variant}
//                     className={statusInfo.className}
//                   >
//                     <StatusIcon className="h-3 w-3 mr-1" />
//                     {statusInfo.label}
//                   </Badge>
//                 </div>
//               </div>

//               {/* Tags */}
//               {story.tags && story.tags.length > 0 && (
//                 <div>
//                   <p className="text-xs text-muted-foreground mb-1.5">
//                     Thể loại
//                   </p>
//                   <div className="flex flex-wrap gap-1.5">
//                     {story.tags.map((tag) => (
//                       <Badge
//                         key={tag.tagId}
//                         variant="outline"
//                         className="text-xs"
//                       >
//                         {tag.name}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Description */}
//               <div>
//                 <p className="text-xs text-muted-foreground mb-1.5">Mô tả</p>
//                 <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
//                   {story.description}
//                 </p>
//               </div>

//               {/* Metadata Grid */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
//                 <div>
//                   <p className="text-xs text-muted-foreground mb-0.5">
//                     Ngày tạo
//                   </p>
//                   <p className="text-sm">
//                     {new Date(story.createdAt).toLocaleDateString("vi-VN")}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-muted-foreground mb-0.5">
//                     Cập nhật
//                   </p>
//                   <p className="text-sm">
//                     {new Date(story.updatedAt).toLocaleDateString("vi-VN")}
//                   </p>
//                 </div>
//                 {story.aiScore !== undefined && (
//                   <>
//                     <div>
//                       <p className="text-xs text-muted-foreground mb-0.5">
//                         Điểm AI
//                       </p>
//                       <p className="text-sm font-semibold text-primary">
//                         {story.aiScore.toFixed(2)} / 1.00
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-muted-foreground mb-0.5">
//                         Kết quả
//                       </p>
//                       <p className="text-sm">
//                         {story.aiScore >= 0.5 ? "✅ Đạt" : "❌ Không đạt"}
//                       </p>
//                     </div>
//                   </>
//                 )}
//               </div>

//               {/* AI Message */}
//               {story.aiNote && (
//                 <div className="pt-2">
//                   <p className="text-xs text-muted-foreground mb-1">
//                     Phản hồi AI:
//                   </p>
//                   <p className="text-sm italic text-muted-foreground">
//                     "{story.aiNote}"
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Action Alerts based on status */}
//       {story.status === "draft" && (
//         <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
//           <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
//           <AlertDescription className="flex items-center justify-between">
//             <span className="text-blue-800 dark:text-blue-300">
//               Truyện đang ở trạng thái nháp. Hãy gửi cho AI chấm điểm để xuất
//               bản.
//             </span>
//             <Button
//               size="sm"
//               onClick={() =>
//                 handleNavigate("submit-ai", { storyId: story.storyId })
//               }
//             >
//               Gửi AI Chấm Điểm
//             </Button>
//           </AlertDescription>
//         </Alert>
//       )}

//       {story.status === "pending" && (
//         <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
//           <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
//           <AlertDescription className="flex items-center justify-between">
//             <span className="text-blue-800 dark:text-blue-300">
//               Đang chờ AI chấm điểm...
//             </span>
//             <Button
//               size="sm"
//               variant="outline"
//               onClick={() =>
//                 handleNavigate("ai-result", { storyId: story.storyId })
//               }
//             >
//               Xem Kết Quả
//             </Button>
//           </AlertDescription>
//         </Alert>
//       )}

//       {story.status === "rejected" && (
//         <Alert variant="destructive">
//           <XCircle className="h-4 w-4" />
//           <AlertDescription>
//             Truyện đã bị từ chối bởi AI (điểm {story.aiScore?.toFixed(2)}). Bạn
//             không thể chỉnh sửa truyện này. Vui lòng tạo truyện mới.
//           </AlertDescription>
//         </Alert>
//       )}

//       {/* Quick Actions - Only show if approved */}
//       {canManageChapters && (
//         <div className="grid md:grid-cols-2 gap-4">
//           <Button
//             variant="outline"
//             className="h-auto py-4 flex-col items-start gap-2"
//             onClick={() =>
//               handleNavigate("outline-editor", { storyId: story.storyId })
//             }
//           >
//             <div className="flex items-center gap-2">
//               <Lightbulb className="h-5 w-5 text-primary" />
//               <span className="font-semibold">Dàn Ý Truyện</span>
//             </div>
//             <span className="text-xs text-muted-foreground text-left">
//               Quản lý dàn ý và outline giúp viết truyện mạch lạc
//             </span>
//           </Button>

//           <Button
//             className="h-auto py-4 flex-col items-start gap-2"
//             onClick={() =>
//               handleNavigate("chapter-editor", { storyId: story.storyId })
//             }
//           >
//             <div className="flex items-center gap-2">
//               <Plus className="h-5 w-5" />
//               <span className="font-semibold">Đăng Chương Mới</span>
//             </div>
//             <span className="text-xs opacity-90 text-left">
//               Viết và gửi chương mới cho ContentMod duyệt
//             </span>
//           </Button>
//         </div>
//       )}

//       {/* Chapters Section - Only show if approved */}
//       {canManageChapters && (
//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <div>
//                 <CardTitle>Danh sách Chương</CardTitle>
//                 <CardDescription>
//                   Các chương đã đăng của truyện này
//                 </CardDescription>
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent>
//             {MOCK_CHAPTERS.length > 0 ? (
//               <div className="space-y-2">
//                 {MOCK_CHAPTERS.map((chapter, index) => (
//                   <div
//                     key={chapter.chapterId}
//                     className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
//                   >
//                     <div className="flex items-center gap-3 flex-1">
//                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                         <span className="text-sm font-semibold text-primary">
//                           {index + 1}
//                         </span>
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="font-medium text-sm truncate">
//                           {chapter.title}
//                         </p>
//                         <p className="text-xs text-muted-foreground">
//                           {chapter.publishedAt
//                             ? `Xuất bản: ${new Date(
//                                 chapter.publishedAt
//                               ).toLocaleDateString("vi-VN")}`
//                             : "Chưa xuất bản"}
//                         </p>
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-2">
//                       {getChapterStatusBadge(chapter.status)}

//                       {chapter.status === "draft" && (
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() =>
//                             handleNavigate("chapter-editor", {
//                               storyId: story.storyId,
//                               chapterId: chapter.chapterId,
//                             })
//                           }
//                         >
//                           <Edit className="h-3 w-3 mr-1" />
//                           Sửa
//                         </Button>
//                       )}

//                       {(chapter.status === "published" ||
//                         chapter.status === "pending") && (
//                         <Button size="sm" variant="outline">
//                           <Eye className="h-3 w-3 mr-1" />
//                           Xem
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 ))}

//                 {/* View All Button */}
//                 <div className="pt-3 border-t">
//                   <Button
//                     variant="ghost"
//                     className="w-full"
//                     onClick={() =>
//                       handleNavigate("manage-chapters", {
//                         storyId: story.storyId,
//                       })
//                     }
//                   >
//                     <FileText className="h-4 w-4 mr-2" />
//                     Xem Tất Cả Chương & Quản Lý
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               <div className="text-center py-12 border-2 border-dashed rounded-lg">
//                 <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
//                 <p className="text-sm text-muted-foreground mb-4">
//                   Chưa có chương nào được đăng
//                 </p>
//                 <Button
//                   onClick={() =>
//                     handleNavigate("chapter-editor", {
//                       storyId: story.storyId,
//                     })
//                   }
//                 >
//                   <Plus className="h-4 w-4 mr-2" />
//                   Đăng Chương Đầu Tiên
//                 </Button>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }
