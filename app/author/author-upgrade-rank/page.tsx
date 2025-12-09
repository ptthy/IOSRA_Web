// // app/author/author-upgrade-rank/page.tsx
// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardFooter,
// } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import {
//   Trophy,
//   Users,
//   TrendingUp,
//   Clock,
//   CheckCircle2,
//   XCircle,
//   Send,
//   Loader2,
//   Crown,
//   Sparkles,
//   Star,
//   Award,
//   Gem,
//   Shield,
//   DollarSign,
//   Target,
//   Zap,
// } from "lucide-react";
// import { toast } from "sonner";
// import {
//   authorUpgradeService,
//   RankUpgradeResponse,
// } from "@/services/authorUpgradeService";

// // --- CẤU HÌNH UI CHO TỪNG RANK ---
// const RANK_STYLES: Record<
//   string,
//   {
//     color: string;
//     bg: string;
//     iconColor: string;
//     gradient: string;
//     shadow: string;
//     glow: string;
//     badgeGradient: string;
//     borderGlow: string;
//   }
// > = {
//   Casual: {
//     color: "text-slate-700 dark:text-slate-300",
//     bg: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50",
//     iconColor: "text-slate-500 dark:text-slate-400",
//     gradient: "from-slate-400 via-slate-500 to-slate-600",
//     shadow: "shadow-slate-200 dark:shadow-slate-800",
//     glow: "shadow-slate-400/20 dark:shadow-slate-600/30",
//     badgeGradient: "bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600",
//     borderGlow:
//       "shadow-[0_0_15px_rgba(148,163,184,0.3)] dark:shadow-[0_0_15px_rgba(148,163,184,0.2)]",
//   },
//   Bronze: {
//     color: "text-amber-800 dark:text-amber-300",
//     bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-amber-800/30",
//     iconColor: "text-amber-600 dark:text-amber-400",
//     gradient: "from-amber-500 via-orange-500 to-amber-600",
//     shadow: "shadow-amber-200 dark:shadow-amber-900",
//     glow: "shadow-amber-400/30 dark:shadow-amber-600/20",
//     badgeGradient:
//       "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600",
//     borderGlow:
//       "shadow-[0_0_20px_rgba(251,146,60,0.4)] dark:shadow-[0_0_20px_rgba(251,146,60,0.3)]",
//   },
//   Gold: {
//     color: "text-yellow-800 dark:text-yellow-300",
//     bg: "bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-900/30 dark:via-amber-900/30 dark:to-yellow-800/30",
//     iconColor: "text-yellow-600 dark:text-yellow-400",
//     gradient: "from-yellow-400 via-amber-400 to-yellow-500",
//     shadow: "shadow-yellow-200 dark:shadow-yellow-900",
//     glow: "shadow-yellow-400/40 dark:shadow-yellow-600/20",
//     badgeGradient:
//       "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500",
//     borderGlow:
//       "shadow-[0_0_25px_rgba(250,204,21,0.5)] dark:shadow-[0_0_25px_rgba(250,204,21,0.3)]",
//   },
//   Diamond: {
//     color: "text-cyan-800 dark:text-cyan-300",
//     bg: "bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-100 dark:from-cyan-900/30 dark:via-blue-900/30 dark:to-cyan-800/30",
//     iconColor: "text-cyan-600 dark:text-cyan-400",
//     gradient: "from-cyan-400 via-blue-400 to-cyan-500",
//     shadow: "shadow-cyan-200 dark:shadow-cyan-900",
//     glow: "shadow-cyan-400/40 dark:shadow-cyan-600/20",
//     badgeGradient: "bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500",
//     borderGlow:
//       "shadow-[0_0_30px_rgba(34,211,238,0.5)] dark:shadow-[0_0_30px_rgba(34,211,238,0.3)]",
//   },
// };

// // Icon cho từng rank
// const RankIcon = ({ rank, size = 8 }: { rank: string; size?: number }) => {
//   const r = (rank || "").toLowerCase();
//   if (r.includes("diamond") || r.includes("kim cương")) {
//     return (
//       <Gem className={`w-${size} h-${size} text-cyan-500 fill-cyan-100`} />
//     );
//   }
//   if (r.includes("gold") || r.includes("vàng")) {
//     return (
//       <Shield
//         className={`w-${size} h-${size} text-yellow-500 fill-yellow-100`}
//       />
//     );
//   }
//   if (r.includes("bronze") || r.includes("đồng")) {
//     return (
//       <Shield
//         className={`w-${size} h-${size} text-orange-600 fill-orange-100`}
//       />
//     );
//   }
//   return (
//     <Shield className={`w-${size} h-${size} text-slate-400 fill-slate-100`} />
//   );
// };

// const COMMITMENT_TEXT =
//   "Tôi cam kết duy trì chất lượng sáng tác để xứng đáng với cấp bậc này.";

// export default function AuthorRankDashboard() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [typedCommitment, setTypedCommitment] = useState("");

//   // Dữ liệu từ API rank-status
//   const [rankStatus, setRankStatus] = useState<{
//     currentRankName: string;
//     currentRewardRate: number;
//     totalFollowers: number;
//     nextRankName: string;
//     nextRankRewardRate: number;
//     nextRankMinFollowers: number;
//   }>({
//     currentRankName: "Casual",
//     currentRewardRate: 0,
//     totalFollowers: 0,
//     nextRankName: "Bronze",
//     nextRankRewardRate: 50,
//     nextRankMinFollowers: 5,
//   });

//   // Dữ liệu từ API requests
//   const [latestRequest, setLatestRequest] = useState<{
//     status: "none" | "pending" | "approved" | "rejected";
//     rejectionReason?: string;
//     submittedDate?: string;
//   }>({
//     status: "none",
//   });
//   const handleApiError = (error: any, defaultMessage: string) => {
//     // 1. Check lỗi Validation/Logic từ Backend
//     if (error.response && error.response.data && error.response.data.error) {
//       const { message, details } = error.response.data.error;

//       // Ưu tiên Validation (details)
//       if (details) {
//         const firstKey = Object.keys(details)[0];
//         if (firstKey && details[firstKey].length > 0) {
//           // Nối các lỗi lại thành 1 câu
//           const msg = details[firstKey].join(" ");
//           toast.error(msg);
//           return;
//         }
//       }

//       // Message từ Backend
//       if (message) {
//         toast.error(message);
//         return;
//       }
//     }

//     // 2. Fallback
//     const fallbackMsg = error.response?.data?.message || defaultMessage;
//     toast.error(fallbackMsg);
//   };
//   // -------------------
//   // Fetch dữ liệu từ cả hai API
//   const fetchData = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       // Gọi API rank-status
//       const statusRes = await authorUpgradeService.getRankStatus();
//       setRankStatus(statusRes.data);

//       // Gọi API requests để lấy trạng thái
//       const requestsRes = await authorUpgradeService.getRankRequests();
//       const requests = requestsRes.data || [];

//       // Sắp xếp lấy request mới nhất
//       const latest = requests.sort(
//         (a, b) =>
//           new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//       )[0];

//       if (latest) {
//         setLatestRequest({
//           status: latest.status.toLowerCase() as any,
//           rejectionReason: latest.moderatorNote || undefined,
//           submittedDate: new Date(latest.createdAt).toLocaleDateString("vi-VN"),
//         });
//       } else {
//         setLatestRequest({ status: "none" });
//       }
//       // } catch (error) {
//       //   console.error("Error fetching rank data:", error);
//       //   toast.error("Lỗi tải dữ liệu Rank");
//       // } finally {
//       //   setIsLoading(false);
//       // }
//     } catch (error: any) {
//       console.error("Error fetching rank data:", error);
//       // --- DÙNG HELPER ---
//       handleApiError(error, "Lỗi tải dữ liệu Rank");
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   // Xử lý nộp đơn thực tế
//   const handleSubmit = async () => {
//     if (typedCommitment !== COMMITMENT_TEXT) {
//       toast.error("Vui lòng nhập đúng câu cam kết.");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       await authorUpgradeService.submitRankRequest({
//         commitment: COMMITMENT_TEXT,
//       });
//       toast.success("Gửi yêu cầu thăng hạng thành công!");
//       await fetchData(); // Reload data sau khi submit
//       setTypedCommitment("");
//       // } catch (error: any) {
//       //   console.error("Submit error:", error);
//       //   if (error.response?.data?.error) {
//       //     toast.error(error.response.data.error.message || "Gửi thất bại");
//       //   } else {
//       //     toast.error(
//       //       "Gửi thất bại. Có thể bạn chưa đủ điều kiện hoặc đã có yêu cầu đang chờ."
//       //     );
//       //   }
//       // } finally {
//       //   setIsSubmitting(false);
//       // }
//     } catch (error: any) {
//       console.error("Submit error:", error);
//       // --- DÙNG HELPER ---
//       handleApiError(
//         error,
//         "Gửi thất bại. Có thể bạn chưa đủ điều kiện hoặc đã có yêu cầu đang chờ."
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background">
//         <div className="flex flex-col items-center gap-4">
//           <Loader2 className="h-12 w-12 animate-spin text-primary" />
//           <p className="text-muted-foreground">Đang tải dữ liệu Rank...</p>
//         </div>
//       </div>
//     );
//   }

//   // Tính toán Progress từ data thực tế
//   const progressPercent = Math.min(
//     (rankStatus.totalFollowers / rankStatus.nextRankMinFollowers) * 100,
//     100
//   );
//   const followersNeeded = Math.max(
//     0,
//     rankStatus.nextRankMinFollowers - rankStatus.totalFollowers
//   );
//   const isEligible =
//     rankStatus.totalFollowers >= rankStatus.nextRankMinFollowers;

//   const currentRankStyle =
//     RANK_STYLES[rankStatus.currentRankName] || RANK_STYLES["Casual"];
//   const nextRankStyle =
//     RANK_STYLES[rankStatus.nextRankName] || RANK_STYLES["Bronze"];
//   const isCommitmentMatched = typedCommitment === COMMITMENT_TEXT;

//   return (
//     <div className="min-h-screen bg-background py-12">
//       <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
//         {/* Decorative Background Elements */}
//         <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
//           <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
//           <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-3xl" />
//         </div>

//         {/* --- HEADER DASHBOARD --- */}
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//           <div className="space-y-2">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
//                 <Trophy className="w-8 h-8 text-primary" />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold text-foreground">
//                   Hệ thống Rank Tác Giả
//                 </h1>
//                 <p className="text-muted-foreground mt-1">
//                   Quản lý cấp bậc, theo dõi tiến độ và nhận quyền lợi độc quyền.
//                 </p>
//               </div>
//             </div>
//           </div>
//           {latestRequest.status === "pending" && (
//             <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 px-5 py-3 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 animate-pulse">
//               <Clock className="w-5 h-5" />
//               <span className="font-medium">Đang xét duyệt</span>
//             </div>
//           )}
//         </div>

//         {/* --- STATS CARDS --- */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {/* Card 1: Rank Hiện Tại */}
//           <Card
//             className={`relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:${currentRankStyle.borderGlow} ${currentRankStyle.bg}`}
//           >
//             <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
//               <Crown
//                 className={`w-full h-full ${currentRankStyle.iconColor}`}
//               />
//             </div>
//             <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
//               <CardTitle className="text-sm font-medium text-muted-foreground">
//                 Rank Hiện Tại
//               </CardTitle>
//               <div
//                 className={`p-2 ${currentRankStyle.badgeGradient} rounded-xl shadow-lg`}
//               >
//                 <Crown className="w-5 h-5 text-white" />
//               </div>
//             </CardHeader>
//             <CardContent className="relative z-10">
//               <div className="flex items-center gap-3 mb-2">
//                 <RankIcon rank={rankStatus.currentRankName} size={8} />
//                 <div
//                   className={`text-2xl font-extrabold ${currentRankStyle.color}`}
//                 >
//                   {rankStatus.currentRankName}
//                 </div>
//               </div>
//               <div className="space-y-1">
//                 <div className="flex items-center gap-2 text-sm">
//                   <DollarSign className="w-4 h-4 text-green-600" />
//                   <span className="text-muted-foreground">Tỷ lệ thưởng:</span>
//                   <span className="font-semibold text-foreground">
//                     {rankStatus.currentRewardRate}%
//                   </span>
//                 </div>
//               </div>
//               <p className="text-xs text-muted-foreground mt-2">
//                 Cấp bậc được ghi nhận
//               </p>
//             </CardContent>
//           </Card>

//           {/* Card 2: Followers & Progress */}
//           <Card className="relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] dark:hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-indigo-900/20">
//             <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
//               <Users className="w-full h-full text-indigo-500 dark:text-indigo-400" />
//             </div>
//             <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
//               <CardTitle className="text-sm font-medium text-muted-foreground">
//                 Followers & Tiến Độ
//               </CardTitle>
//               <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg">
//                 <TrendingUp className="w-5 h-5 text-white" />
//               </div>
//             </CardHeader>
//             <CardContent className="relative z-10 space-y-3">
//               <div className="flex items-center gap-2">
//                 <div className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-100">
//                   {rankStatus.totalFollowers.toLocaleString()}
//                 </div>
//                 <Users className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
//               </div>

//               <div className="space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-muted-foreground">Tiến trình:</span>
//                   <span className="font-semibold text-foreground">
//                     {rankStatus.totalFollowers}/
//                     {rankStatus.nextRankMinFollowers}
//                   </span>
//                 </div>
//                 <Progress value={progressPercent} className="h-2" />
//                 <p className="text-xs text-muted-foreground">
//                   {isEligible
//                     ? "✅ Đã đủ điều kiện"
//                     : `Cần thêm ${followersNeeded} followers`}
//                 </p>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Card 3: Rank Mục Tiêu */}
//           <Card
//             className={`relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
//               isEligible
//                 ? `${nextRankStyle.borderGlow} ${nextRankStyle.bg}`
//                 : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20"
//             }`}
//           >
//             <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
//               <Award className={`w-full h-full ${nextRankStyle.iconColor}`} />
//             </div>
//             {isEligible && (
//               <div className="absolute top-2 right-2 z-20">
//                 <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-lg animate-pulse">
//                   <CheckCircle2 className="w-3 h-3" />
//                   Đủ điều kiện
//                 </div>
//               </div>
//             )}
//             <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
//               <CardTitle className="text-sm font-medium text-muted-foreground">
//                 Rank Mục Tiêu
//               </CardTitle>
//               <div
//                 className={`p-2 ${
//                   isEligible
//                     ? nextRankStyle.badgeGradient
//                     : "bg-gradient-to-r from-slate-400 to-slate-600"
//                 } rounded-xl shadow-lg`}
//               >
//                 <Target className="w-5 h-5 text-white" />
//               </div>
//             </CardHeader>
//             <CardContent className="relative z-10">
//               <div className="flex items-center gap-3 mb-2">
//                 <RankIcon rank={rankStatus.nextRankName} size={8} />
//                 <div
//                   className={`text-2xl font-extrabold ${
//                     isEligible
//                       ? nextRankStyle.color
//                       : "text-slate-700 dark:text-slate-300"
//                   }`}
//                 >
//                   {rankStatus.nextRankName}
//                 </div>
//               </div>
//               <div className="space-y-1">
//                 <div className="flex items-center gap-2 text-sm">
//                   <Zap className="w-4 h-4 text-yellow-600" />
//                   <span className="text-muted-foreground">
//                     Tỷ lệ thưởng mới:
//                   </span>
//                   <span className="font-semibold text-foreground">
//                     {rankStatus.nextRankRewardRate}%
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-2 text-sm">
//                   <Users className="w-4 h-4 text-blue-600" />
//                   <span className="text-muted-foreground">Yêu cầu:</span>
//                   <span className="font-semibold text-foreground">
//                     {rankStatus.nextRankMinFollowers} followers
//                   </span>
//                 </div>
//               </div>
//               <p className="text-xs text-muted-foreground mt-2">
//                 {isEligible
//                   ? "Sẵn sàng thăng hạng!"
//                   : `Cần tối thiểu ${rankStatus.nextRankMinFollowers} followers`}
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         {/* --- FORM CAM KẾT NÂNG CẤP --- */}
//         {latestRequest.status === "none" && isEligible && (
//           <Card className="shadow-xl border-2 border-primary/20">
//             <CardHeader className="text-center pb-4">
//               <CardTitle className="text-2xl text-foreground flex items-center justify-center gap-2">
//                 <Sparkles className="w-6 h-6 text-primary" />
//                 Đăng Ký Nâng Cấp Rank
//                 <Sparkles className="w-6 h-6 text-primary" />
//               </CardTitle>
//               <CardDescription className="text-muted-foreground">
//                 Hoàn thành cam kết để gửi yêu cầu nâng cấp lên{" "}
//                 {rankStatus.nextRankName}
//               </CardDescription>
//             </CardHeader>

//             <CardContent className="space-y-6">
//               {/* Thông tin tóm tắt */}
//               <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
//                 <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//                   <div className="flex items-center gap-4">
//                     <div className={`p-3 rounded-xl ${currentRankStyle.bg}`}>
//                       <RankIcon rank={rankStatus.currentRankName} size={6} />
//                     </div>
//                     <div>
//                       <p className="text-sm text-muted-foreground">Từ</p>
//                       <p
//                         className={`text-lg font-bold ${currentRankStyle.color}`}
//                       >
//                         {rankStatus.currentRankName}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="text-primary text-2xl">→</div>

//                   <div className="flex items-center gap-4">
//                     <div className={`p-3 rounded-xl ${nextRankStyle.bg}`}>
//                       <RankIcon rank={rankStatus.nextRankName} size={6} />
//                     </div>
//                     <div>
//                       <p className="text-sm text-muted-foreground">Lên</p>
//                       <p className={`text-lg font-bold ${nextRankStyle.color}`}>
//                         {rankStatus.nextRankName}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Form cam kết */}
//               <div className="space-y-4">
//                 <Label
//                   htmlFor="commitment-input"
//                   className="text-base font-semibold text-foreground"
//                 >
//                   Xác nhận Cam kết
//                 </Label>
//                 <div className="bg-muted border border-border rounded-lg p-4 text-sm font-medium">
//                   <p className="text-muted-foreground">
//                     Để xác nhận, vui lòng gõ lại chính xác câu sau vào ô bên
//                     dưới:
//                   </p>
//                   <p className="mt-2 text-primary font-semibold">
//                     {COMMITMENT_TEXT}
//                   </p>
//                 </div>
//                 <Textarea
//                   id="commitment-input"
//                   placeholder="Gõ lại câu cam kết tại đây..."
//                   value={typedCommitment}
//                   onChange={(e) => setTypedCommitment(e.target.value)}
//                   disabled={isSubmitting}
//                   rows={3}
//                   className={`text-sm leading-relaxed transition-all ${
//                     isCommitmentMatched
//                       ? "border-green-500 focus-visible:ring-green-500 dark:border-green-400 dark:focus-visible:ring-green-400 bg-green-50 dark:bg-green-950/20"
//                       : typedCommitment.length > 0
//                       ? "border-destructive focus-visible:ring-destructive dark:border-destructive/70 dark:focus-visible:ring-destructive/70 bg-red-50 dark:bg-red-950/20"
//                       : "bg-card"
//                   }`}
//                 />
//                 {typedCommitment.length > 0 && (
//                   <p
//                     className={`text-sm font-medium ${
//                       isCommitmentMatched
//                         ? "text-green-600 dark:text-green-400"
//                         : "text-destructive dark:text-destructive/70"
//                     }`}
//                   >
//                     {isCommitmentMatched
//                       ? "✓ Đã trùng khớp! Bạn có thể gửi yêu cầu."
//                       : "❌ Câu cam kết chưa trùng khớp."}
//                   </p>
//                 )}
//               </div>
//             </CardContent>

//             <CardFooter className="pt-4">
//               <Button
//                 onClick={handleSubmit}
//                 disabled={isSubmitting || !isCommitmentMatched}
//                 className="w-full h-12 text-base font-semibold"
//                 size="lg"
//               >
//                 {isSubmitting ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Đang gửi yêu cầu...
//                   </>
//                 ) : (
//                   <>
//                     <Send className="mr-2 h-4 w-4" />
//                     Gửi Yêu Cầu Nâng Cấp
//                   </>
//                 )}
//               </Button>
//             </CardFooter>
//           </Card>
//         )}

//         {/* --- THÔNG BÁO TRẠNG THÁI --- */}
//         {latestRequest.status !== "none" && (
//           <Card
//             className={`shadow-xl border-2 ${
//               latestRequest.status === "pending"
//                 ? "border-blue-200 dark:border-blue-700"
//                 : latestRequest.status === "approved"
//                 ? "border-emerald-200 dark:border-emerald-700"
//                 : "border-destructive/20"
//             }`}
//           >
//             <CardHeader className="text-center pb-4">
//               <div className="flex justify-center mb-4">
//                 {latestRequest.status === "pending" && (
//                   <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
//                     <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
//                   </div>
//                 )}
//                 {latestRequest.status === "approved" && (
//                   <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
//                     <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
//                   </div>
//                 )}
//                 {latestRequest.status === "rejected" && (
//                   <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
//                     <XCircle className="w-8 h-8 text-destructive" />
//                   </div>
//                 )}
//               </div>
//               <CardTitle className="text-xl text-foreground">
//                 {latestRequest.status === "pending" && "Yêu Cầu Đang Chờ Duyệt"}
//                 {latestRequest.status === "approved" && "Yêu Cầu Đã Được Duyệt"}
//                 {latestRequest.status === "rejected" && "Yêu Cầu Bị Từ Chối"}
//               </CardTitle>
//               <CardDescription className="text-muted-foreground">
//                 {latestRequest.submittedDate &&
//                   `Gửi ngày: ${latestRequest.submittedDate}`}
//               </CardDescription>
//             </CardHeader>

//             <CardContent className="text-center space-y-4">
//               {latestRequest.status === "pending" && (
//                 <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
//                   <p className="text-blue-800 dark:text-blue-300">
//                     Yêu cầu của bạn đang được đội ngũ xét duyệt. Thời gian xử lý
//                     thường từ 2-5 ngày làm việc.
//                   </p>
//                 </div>
//               )}

//               {latestRequest.status === "rejected" &&
//                 latestRequest.rejectionReason && (
//                   <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
//                     <p className="text-destructive font-semibold">
//                       Lý do từ chối:
//                     </p>
//                     <p className="text-destructive/90 mt-2">
//                       {latestRequest.rejectionReason}
//                     </p>
//                   </div>
//                 )}

//               {latestRequest.status === "rejected" && (
//                 <Button
//                   onClick={() => {
//                     setTypedCommitment("");
//                     setLatestRequest({ status: "none" });
//                   }}
//                   variant="outline"
//                   className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
//                 >
//                   Gửi Lại Yêu Cầu
//                 </Button>
//               )}
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }
// app/author-upgrade/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Clock,
  XCircle,
  CheckCheck,
  Send,
  BookOpen,
  Sparkles,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

// --- SERVICES & CONTEXT ---
import { profileService } from "@/services/profileService";
import {
  authorUpgradeService,
  ApiUpgradeStatus,
} from "@/services/authorUpgradeService";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";

// --- TYPES & CONSTANTS ---
type UpgradeStatus = "default" | "pending" | "rejected" | "approved";

interface LocalUpgradeRequest {
  status: UpgradeStatus;
  submittedDate?: string;
  rejectionReason?: string;
}

const COMMITMENT_TEXT =
  "Tôi đã đọc và đồng ý với điều khoản, quy định của Tora Novel. Tôi cam kết tuân thủ các quy tắc về nội dung, bản quyền và xây dựng cộng đồng lành mạnh.";

const TERMS_AND_CONDITIONS = [
  {
    title: "1. Quy định về Nội dung",
    items: [
      "Tác phẩm phải là sáng tác gốc hoặc có đầy đủ bản quyền hợp pháp",
      "Không xuất bản nội dung vi phạm pháp luật, bạo lực, khiêu dâm",
      "Tôn trọng bản quyền tác giả và không đạo văn",
    ],
  },
  {
    title: "2. Cam kết Chất lượng",
    items: [
      "Duy trì chất lượng nội dung và cập nhật đều đặn",
      "Sử dụng ngôn ngữ phù hợp, không chứa từ ngữ thô tục quá mức",
      "Tuân thủ hướng dẫn định dạng và biên tập của nền tảng",
    ],
  },
  {
    title: "3. Quyền và Trách nhiệm",
    items: [
      "Tác giả giữ bản quyền tác phẩm của mình",
      "Nền tảng có quyền hiển thị, quảng bá tác phẩm",
      "Chịu trách nhiệm về toàn bộ nội dung đã xuất bản",
    ],
  },
];

const STATUS_DISPLAY_CONFIG: {
  [key in UpgradeStatus]: {
    text: string;
    icon: React.ElementType;
    className: string;
  };
} = {
  default: {
    text: "Chưa gửi yêu cầu",
    icon: FileText,
    className: "bg-muted text-muted-foreground border-border",
  },
  pending: {
    text: "Đang chờ duyệt",
    icon: Clock,
    className:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
  },
  rejected: {
    text: "Bị từ chối",
    icon: XCircle,
    className:
      "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30",
  },
  approved: {
    text: "Đã duyệt",
    icon: CheckCheck,
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700",
  },
};

export default function AuthorUpgradePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, updateUser } = useAuth();

  // --- STATES ---
  // Quan trọng: Mặc định là TRUE để chặn UI render ngay từ đầu
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [upgradeRequest, setUpgradeRequest] = useState<LocalUpgradeRequest>({
    status: "default",
  });
  const [typedCommitment, setTypedCommitment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGIC HELPER ---
  const isCommitmentMatched = typedCommitment === COMMITMENT_TEXT;

  const parseRejectionReason = (content: string): string | undefined => {
    const reasonMarker = "[REJECT_REASON]:";
    const index = content.indexOf(reasonMarker);
    if (index === -1) return undefined;
    const reason = content.substring(index + reasonMarker.length).trim();
    return reason.length > 0 ? reason : undefined;
  };

  const mapApiStatusToLocal = (
    apiStatus: ApiUpgradeStatus | string
  ): UpgradeStatus => {
    const upperStatus = String(apiStatus).toUpperCase();
    switch (upperStatus) {
      case "PENDING":
        return "pending";
      case "REJECTED":
        return "rejected";
      case "APPROVED":
        return "approved";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch (e) {
      return "không rõ";
    }
  };

  // --- MAIN LOGIC: CHECK STATUS (QUAN TRỌNG NHẤT) ---
  useEffect(() => {
    // 1. Chờ AuthContext load xong mới chạy
    if (isAuthLoading) return;

    const verifyAndLoadData = async () => {
      // 2. CHECK NHANH: Nếu Context đã bảo là Author -> Redirect luôn
      const isAuthorInContext =
        user?.roles?.includes("author") || (user as any)?.isAuthorApproved;
      if (isAuthorInContext) {
        router.replace("/author/overview");
        return; // Dừng luôn, không cần chạy đoạn dưới
      }

      try {
        // 3. CHECK KỸ (API): Gọi Server để lấy thông tin mới nhất
        // Chạy song song check Profile (để xem đã lên Author chưa) và check Request (để xem đơn cũ)
        // Tuy nhiên để đảm bảo logic redirect, ta check Profile trước.

        const profileRes = await profileService.getProfile();

        // Giả sử API trả về field isAuthor hoặc check role trong response
        // Bạn cần chắc chắn field này đúng với backend (ví dụ: res.data.isAuthor hoặc res.data.roles.includes...)
        const isRealTimeAuthor =
          profileRes.data?.isAuthor ||
          profileRes.data?.roles?.includes("author");

        if (isRealTimeAuthor) {
          // NẾU LÀ AUTHOR RỒI:
          // a. Sync lại context local để lần sau vào nhanh hơn
          if (user && updateUser) {
            // Clone object user cũ, thêm role author vào
            // Lưu ý: Tùy vào cách updateUser của bạn hoạt động
            // Ở đây mình gọi cập nhật role
            updateUser({ role: "author" });
          }
          // b. Redirect ngay
          router.replace("/author/overview");
          return;
        }

        // 4. NẾU CHƯA PHẢI AUTHOR -> Lấy lịch sử đơn đăng ký
        const requestRes = await authorUpgradeService.getMyRequests();
        const latestRequest = requestRes.data[0];

        if (!latestRequest) {
          setUpgradeRequest({ status: "default" });
        } else {
          const reason = parseRejectionReason(latestRequest.content);
          setUpgradeRequest({
            status: mapApiStatusToLocal(latestRequest.status),
            submittedDate: formatDate(latestRequest.createdAt),
            rejectionReason: reason || undefined,
          });
        }
      } catch (error) {
        // Handle lỗi (ví dụ 404 nghĩa là chưa có request)
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          setUpgradeRequest({ status: "default" });
        } else {
          console.error("Lỗi check trạng thái:", error);
          // Vẫn cho hiện form default nếu lỗi mạng để user không bị kẹt ở loading
          // setUpgradeRequest({ status: "default" });
        }
      } finally {
        // 5. Mở khóa UI để hiển thị
        setIsCheckingStatus(false);
      }
    };

    verifyAndLoadData();
  }, [isAuthLoading, user, router, updateUser]); // Dependency chuẩn

  // --- HANDLERS ---

  const handleApiError = (error: any, defaultMessage: string) => {
    if (error.response?.data?.error) {
      const { message, details } = error.response.data.error;
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          toast.error(details[firstKey].join(" "));
          return;
        }
      }
      if (message) {
        toast.error(message);
        return;
      }
    }
    toast.error(error.response?.data?.message || defaultMessage);
  };

  const handleSubmitRequest = async () => {
    if (!isCommitmentMatched) {
      toast.error("Vui lòng nhập chính xác câu cam kết.");
      return;
    }
    setIsSubmitting(true);
    try {
      await authorUpgradeService.submitRequest({ commitment: COMMITMENT_TEXT });
      toast.success("Đã gửi yêu cầu thành công!");

      // Reload lại logic check để cập nhật UI sang Pending
      // Đơn giản nhất là set state trực tiếp để đỡ phải fetch lại
      setUpgradeRequest({
        status: "pending",
        submittedDate: new Date().toLocaleDateString("vi-VN"),
      });
      setTypedCommitment("");
    } catch (error) {
      const axiosError = error as AxiosError;
      // Xử lý case spam request 429... (giữ nguyên logic cũ của bạn)
      if (axiosError.response?.status === 429) {
        toast.error("Bạn gửi quá nhiều yêu cầu, vui lòng thử lại sau.");
      } else {
        handleApiError(error, "Lỗi gửi yêu cầu.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmit = () => {
    setTypedCommitment("");
    setUpgradeRequest({ status: "default" });
  };

  const handleStartWriting = () => {
    router.push("/author/overview");
  };

  // --- RENDER ---

  // 1. Màn hình Loading CHẶN UI (Quan trọng để không bị flash form)
  if (isAuthLoading || isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  // 2. Nội dung chính
  const currentStatusConfig =
    STATUS_DISPLAY_CONFIG[upgradeRequest.status] ||
    STATUS_DISPLAY_CONFIG["default"];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-background">
      <div className="w-full max-w-7xl space-y-4">
        {/* Header Status Badge */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Trạng thái:
          </span>
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border ${currentStatusConfig.className}`}
          >
            <currentStatusConfig.icon className="h-4 w-4" />
            <span>{currentStatusConfig.text}</span>
          </div>
        </div>

        {/* --- CASE 1: DEFAULT (CHƯA GỬI) --- */}
        {upgradeRequest.status === "default" && (
          <Card className="shadow-xl">
            <CardHeader className="space-y-4 text-center pb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <CardTitle>Đăng ký trở thành Tác giả</CardTitle>
                <CardDescription>
                  Chia sẻ câu chuyện của bạn với hàng triệu độc giả
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Điều khoản... (Giữ nguyên code UI của bạn để gọn) */}
              <div className="bg-muted rounded-lg p-5 space-y-3">
                <p className="text-sm">
                  <strong>Quyền lợi:</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Xuất bản truyện</li>
                  <li>✓ Kiếm thu nhập</li>
                </ul>
              </div>

              <div className="space-y-4">
                <Label>Điều khoản</Label>
                <div className="bg-card rounded-lg p-5 border border-border h-[200px] overflow-y-auto text-sm text-muted-foreground">
                  {/* Render TERMS_AND_CONDITIONS */}
                  {TERMS_AND_CONDITIONS.map((s, i) => (
                    <div key={i} className="mb-2">
                      <strong>{s.title}</strong>
                      <br />
                      {s.items.join(", ")}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Xác nhận cam kết</Label>
                <div className="bg-muted p-3 rounded text-sm text-primary font-medium border border-dashed border-primary/30">
                  {COMMITMENT_TEXT}
                </div>
                <Textarea
                  value={typedCommitment}
                  onChange={(e) => setTypedCommitment(e.target.value)}
                  placeholder="Gõ lại câu cam kết ở trên..."
                  className={isCommitmentMatched ? "border-green-500" : ""}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={isSubmitting || !isCommitmentMatched}
                onClick={handleSubmitRequest}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Gửi yêu cầu
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* --- CASE 2: PENDING --- */}
        {upgradeRequest.status === "pending" && (
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Clock className="h-10 w-10 text-blue-600 animate-pulse" />
              </div>
              <CardTitle>Đang xét duyệt</CardTitle>
              <CardDescription>
                Gửi ngày {upgradeRequest.submittedDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <p className="text-muted-foreground">
                Vui lòng chờ 2-5 ngày làm việc.
              </p>
            </CardContent>
          </Card>
        )}

        {/* --- CASE 3: REJECTED --- */}
        {upgradeRequest.status === "rejected" && (
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Yêu cầu bị từ chối</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded border border-red-100 text-red-800">
                <strong>Lý do:</strong>{" "}
                {upgradeRequest.rejectionReason || "Chưa rõ lý do"}
              </div>
              <Button onClick={handleResubmit} className="w-full">
                Gửi lại yêu cầu
              </Button>
            </CardContent>
          </Card>
        )}

        {/* --- CASE 4: APPROVED (Dự phòng nếu redirect chậm) --- */}
        {upgradeRequest.status === "approved" && (
          <Card className="shadow-xl text-center p-8">
            <CheckCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="mb-2">Đã được duyệt!</CardTitle>
            <Button onClick={handleStartWriting}>Vào trang quản lý</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
