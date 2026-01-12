// app/author/author-upgrade-rank/page.tsx

/* 
MỤC ĐÍCH: Trang quản lý và nâng cấp hạng tác giả cho user đã là tác giả
CHỨC NĂNG CHÍNH:
- Hiển thị thông tin hạng hiện tại và hạng mục tiêu
- Theo dõi tiến độ đạt điều kiện nâng hạng (số followers)
- Gửi yêu cầu nâng cấp hạng với cơ chế cam kết (copy text)
- Hiển thị lịch sử và trạng thái các yêu cầu nâng hạng
- Thông báo khi đạt hạng cao nhất (Diamond)
- UI phong phú với card, biểu đồ tiến độ và styling theo từng hạng

QUAN HỆ VỚI CÁC FILE KHÁC:
- Kế thừa layout từ: app/author/layout.tsx (sidebar tác giả)
- Sử dụng service: @/services/authorUpgradeService
- Sử dụng components UI: @/components/ui/*
- Khác với: app/author-upgrade/page.tsx (trang đăng ký trở thành tác giả lần đầu)

LOGIC CHÍNH:
1. Khi vào trang: fetch 2 API (rank-status và requests)
2. Kiểm tra điều kiện nâng hạng: số followers >= yêu cầu
3. Nếu đủ điều kiện: hiện form cam kết (user phải copy đúng text)
4. Nếu đang có request pending: hiện trạng thái chờ
5. Nếu bị từ chối: hiện lý do và nút gửi lại
6. Nếu đã approved: reset về "none" để nâng hạng tiếp
*/

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Trophy,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  Crown,
  Sparkles,
  Star,
  Award,
  Gem,
  Shield,
  DollarSign,
  Target,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  authorUpgradeService,
  RankUpgradeResponse,
} from "@/services/authorUpgradeService";

// --- CẤU HÌNH UI CHO TỪNG RANK ---
/**
 * OBJECT CẤU HÌNH MÀU SẮC VÀ HIỆU ỨNG CHO TỪNG RANK
 * LÝ DO DÙNG OBJECT CONFIG:
 * - Tập trung hóa styling: dễ thay đổi theme
 * - Đảm bảo UI nhất quán: mỗi rank có màu riêng
 * - Tái sử dụng: dùng chung ở nhiều component (RankIcon, Card, v.v.)
 * - Dễ mở rộng: thêm rank mới chỉ cần thêm config
 */
const RANK_STYLES: Record<
  string,
  {
    color: string; // Màu chữ
    bg: string; // Màu nền gradient
    iconColor: string; // Màu icon
    gradient: string; // Gradient cho badge
    shadow: string; // Shadow cho card
    glow: string; // Glow effect
    badgeGradient: string; // Gradient cho badge
    borderGlow: string; // Border glow khi hover
  }
> = {
  Casual: {
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50",
    iconColor: "text-slate-500 dark:text-slate-400",
    gradient: "from-slate-400 via-slate-500 to-slate-600",
    shadow: "shadow-slate-200 dark:shadow-slate-800",
    glow: "shadow-slate-400/20 dark:shadow-slate-600/30",
    badgeGradient: "bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600",
    borderGlow:
      "shadow-[0_0_15px_rgba(148,163,184,0.3)] dark:shadow-[0_0_15px_rgba(148,163,184,0.2)]",
  },
  Bronze: {
    color: "text-amber-800 dark:text-amber-300",
    bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-amber-800/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500 via-orange-500 to-amber-600",
    shadow: "shadow-amber-200 dark:shadow-amber-900",
    glow: "shadow-amber-400/30 dark:shadow-amber-600/20",
    badgeGradient:
      "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600",
    borderGlow:
      "shadow-[0_0_20px_rgba(251,146,60,0.4)] dark:shadow-[0_0_20px_rgba(251,146,60,0.3)]",
  },
  Gold: {
    color: "text-yellow-800 dark:text-yellow-300",
    bg: "bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-900/30 dark:via-amber-900/30 dark:to-yellow-800/30",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    gradient: "from-yellow-400 via-amber-400 to-yellow-500",
    shadow: "shadow-yellow-200 dark:shadow-yellow-900",
    glow: "shadow-yellow-400/40 dark:shadow-yellow-600/20",
    badgeGradient:
      "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500",
    borderGlow:
      "shadow-[0_0_25px_rgba(250,204,21,0.5)] dark:shadow-[0_0_25px_rgba(250,204,21,0.3)]",
  },
  Diamond: {
    color: "text-cyan-800 dark:text-cyan-300",
    bg: "bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-100 dark:from-cyan-900/30 dark:via-blue-900/30 dark:to-cyan-800/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    gradient: "from-cyan-400 via-blue-400 to-cyan-500",
    shadow: "shadow-cyan-200 dark:shadow-cyan-900",
    glow: "shadow-cyan-400/40 dark:shadow-cyan-600/20",
    badgeGradient: "bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500",
    borderGlow:
      "shadow-[0_0_30px_rgba(34,211,238,0.5)] dark:shadow-[0_0_30px_rgba(34,211,238,0.3)]",
  },
};

/**
 * COMPONENT RankIcon: Hiển thị icon tương ứng với mỗi rank
 * LOGIC XỬ LÝ:
 * - Nhận prop rank (tên rank) và size (kích thước)
 * - Dựa vào tên rank (không phân biệt hoa thường) để chọn icon phù hợp
 * - Mỗi rank có icon và màu sắc riêng
 * - Fallback: Shield với màu mặc định nếu không match
 */
const RankIcon = ({ rank, size = 8 }: { rank: string; size?: number }) => {
  const r = (rank || "").toLowerCase(); // Chuẩn hóa về lowercase để so sánh
  // Priority matching: Diamond -> Gold -> Bronze -> Casual
  if (r.includes("diamond") || r.includes("kim cương")) {
    return (
      <Gem className={`w-${size} h-${size} text-cyan-500 fill-cyan-100`} />
    );
  }
  if (r.includes("gold") || r.includes("vàng")) {
    return (
      <Shield
        className={`w-${size} h-${size} text-yellow-500 fill-yellow-100`}
      />
    );
  }
  if (r.includes("bronze") || r.includes("đồng")) {
    return (
      <Shield
        className={`w-${size} h-${size} text-orange-600 fill-orange-100`}
      />
    );
  }
  // Fallback: Casual hoặc rank không xác định
  return (
    <Shield className={`w-${size} h-${size} text-slate-400 fill-slate-100`} />
  );
};
/**
 * TEXT CAM KẾT BẮT BUỘC USER PHẢI COPY ĐÚNG
 * LÝ DO THIẾT KẾ:
 * - Đảm bảo user đọc và hiểu cam kết (không spam click)
 * - Tạo rào cản tâm lý: user phải chủ động gõ lại
 * - Giảm thiểu yêu cầu nâng hạng thiếu suy nghĩ
 */
const COMMITMENT_TEXT =
  "Tôi cam kết duy trì chất lượng sáng tác để xứng đáng với cấp bậc này.";

export default function AuthorRankDashboard() {
  const [isLoading, setIsLoading] = useState(true); // Loading khi fetch data lần đầu
  // State lưu full lịch sử
  const [allRequests, setAllRequests] = useState<RankUpgradeResponse[]>([]); // Toàn bộ lịch sử requests
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading khi submit
  const [typedCommitment, setTypedCommitment] = useState(""); // Text user đang gõ

  /**
   * STATE rankStatus: Lưu thông tin rank từ API /rank-status
   * CẤU TRÚC:
   * - currentRankName: rank hiện tại (Casual/Bronze/Gold/Diamond)
   * - currentRewardRate: tỷ lệ thưởng hiện tại (%)
   * - totalFollowers: số followers hiện có
   * - nextRankName: rank tiếp theo muốn nâng lên
   * - nextRankRewardRate: tỷ lệ thưởng của rank tiếp theo
   * - nextRankMinFollowers: số followers tối thiểu để nâng rank
   */
  const [rankStatus, setRankStatus] = useState<{
    currentRankName: string;
    currentRewardRate: number;
    totalFollowers: number;
    nextRankName: string;
    nextRankRewardRate: number;
    nextRankMinFollowers: number;
  }>({
    currentRankName: "Casual",
    currentRewardRate: 0,
    totalFollowers: 0,
    nextRankName: "Bronze",
    nextRankRewardRate: 50,
    nextRankMinFollowers: 5,
  });

  /**
   * STATE latestRequest: Lưu thông tin yêu cầu nâng cấp GẦN NHẤT
   * LOGIC XỬ LÝ QUAN TRỌNG:
   * - Nếu request đã approved → reset về "none" để user có thể yêu cầu rank tiếp theo
   * - Nếu còn pending/rejected → giữ nguyên trạng thái để hiển thị
   * - rejectionReason: lý do từ chối (nếu có, từ moderatorNote)
   * - submittedDate: ngày gửi yêu cầu (format vi-VN)
   */
  const [latestRequest, setLatestRequest] = useState<{
    status: "none" | "pending" | "approved" | "rejected";
    rejectionReason?: string;
    submittedDate?: string;
  }>({
    status: "none",
  });
  /**
   * HÀM XỬ LÝ LỖI TỪ API MỘT CÁCH THỐNG NHẤT
   * FLOW XỬ LÝ LỖI:
   * 1. Ưu tiên lỗi Validation từ details (backend trả về field nào bị lỗi)
   * 2. Nếu không có details → dùng message chung từ backend
   * 3. Fallback: dùng message mặc định hoặc từ response.data.message
   *
   * LÝ DO TẠO HELPER:
   * - Giảm code trùng lặp (dùng ở nhiều nơi trong component)
   * - Xử lý structured error từ backend (Zod validation, business logic)
   * - User thấy thông báo chi tiết, dễ hiểu
   */
  const handleApiError = (error: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic từ Backend
    if (error.response && error.response.data && error.response.data.error) {
      const { message, details } = error.response.data.error;

      // Ưu tiên Validation (details)
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          // Nối các lỗi lại thành 1 câu
          const msg = details[firstKey].join(" ");
          toast.error(msg);
          return;
        }
      }

      // Message từ Backend
      if (message) {
        toast.error(message);
        return;
      }
    }

    // 2. Fallback
    const fallbackMsg = error.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // -------------------
  // FETCH DỮ LIỆU TỪ CẢ HAI API
  /**
   * HÀM fetchData: LẤY CẢ 2 LOẠI DỮ LIỆU TỪ API
   * FLOW:
   * 1. Gọi API rank-status → lấy thông tin rank hiện tại
   * 2. Gọi API requests → lấy lịch sử yêu cầu
   * 3. Xử lý logic: tìm request mới nhất, map trạng thái
   * 4. Quan trọng: Nếu request đã approved → reset về "none"
   *
   * LÝ DO GỘP 2 API CALL:
   * - Giảm số lần render (chỉ setLoading 1 lần)
   * - Đảm bảo dữ liệu đồng bộ (rank status và request status hiển thị cùng lúc)
   * - Dùng useCallback để tránh tạo hàm mới mỗi lần render (optimization)
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. API rank-status: thông tin rank hiện tại và điều kiện nâng cấp
      const statusRes = await authorUpgradeService.getRankStatus();
      setRankStatus(statusRes.data);

      // 2. API requests: lịch sử và trạng thái yêu cầu
      const requestsRes = await authorUpgradeService.getRankRequests();
      const requests = requestsRes.data || [];
      // Lưu lại toàn bộ danh sách để hiển thị lịch sử
      setAllRequests(requests);
      // Sắp xếp lấy request mới nhất (theo thời gian tạo)
      const latest = requests.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]; // Phần tử đầu tiên sau khi sort
      /**
       * LOGIC QUAN TRỌNG: Xử lý trạng thái request
       * Case 1: Có request mới nhất
       *   - Nếu status = "approved" → reset về "none" (đã nâng hạng xong)
       *   - Nếu status khác → giữ nguyên và hiển thị
       * Case 2: Không có request → "none"
       */
      if (latest) {
        const currentStatus = latest.status.toLowerCase();

        // --- FIX LOGIC TẠI ĐÂY ---
        // Nếu request gần nhất đã Approved, nghĩa là xong rồi -> Reset về "none"
        // để UI hiện Form cam kết cho Rank tiếp theo (nếu đủ điều kiện).
        if (currentStatus === "approved") {
          setLatestRequest({ status: "none" }); // Reset để hiện form cho rank tiếp theo
        } else {
          setLatestRequest({
            // Map dữ liệu từ API sang state UI
            status: latest.status.toLowerCase() as any, // 'pending' | 'rejected'
            rejectionReason: latest.moderatorNote || undefined, // Lý do từ chối
            submittedDate: new Date(latest.createdAt).toLocaleDateString(
              "vi-VN"
            ), // Format date VN
          });
        }
      } else {
        // Không có request nào
        setLatestRequest({ status: "none" });
      }
    } catch (error: any) {
      console.error("Error fetching rank data:", error);
      // --- DÙNG HELPER ---
      handleApiError(error, "Lỗi tải dữ liệu Rank");
    } finally {
      setIsLoading(false);
    }
  }, []); // Dùng helper function để xử lý lỗi thống nhất
  /**
   * useEffect: FETCH DATA KHI COMPONENT MOUNT
   * Chạy khi component vừa được render lần đầu tiên
   * Dependency: [fetchData] - chỉ chạy lại nếu fetchData thay đổi
   */ // Fetch data khi component mount (khi component vừa hiện lên lần đầu tiên)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * HÀM XỬ LÝ GỬI YÊU CẦU NÂNG HẠNG
   * FLOW:
   * 1. Validate: user đã gõ đúng cam kết chưa?
   * 2. Set loading state (isSubmitting = true)
   * 3. Gọi API submitRankRequest với commitment text
   * 4. Nếu thành công: toast success, fetch lại data, reset input
   * 5. Nếu lỗi: dùng handleApiError để hiển thị chi tiết
   *
   * LÝ DO KIỂM TRA KỸ:
   * - Đảm bảo user đã đọc cam kết (chống spam click)
   * - Handle lỗi business logic từ backend (chưa đủ điều kiện, đã có request pending)
   */
  const handleSubmit = async () => {
    // 1. VALIDATION: User phải copy đúng nguyên văn
    if (typedCommitment !== COMMITMENT_TEXT) {
      toast.error("Vui lòng nhập đúng câu cam kết.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. GỬI API
      await authorUpgradeService.submitRankRequest({
        commitment: COMMITMENT_TEXT, // Gửi text cam kết
      });
      // 3. THÀNH CÔNG
      toast.success("Gửi yêu cầu thăng hạng thành công!");
      // 4. FETCH LẠI DATA để cập nhật UI (chuyển sang trạng thái pending)
      await fetchData(); // Reload data sau khi submit
      // 5. RESET INPUT về rỗng
      setTypedCommitment(""); // Reset input
    } catch (error: any) {
      console.error("Submit error:", error);
      // Dùng helper để xử lý các loại lỗi
      handleApiError(
        error,
        "Gửi thất bại. Có thể bạn chưa đủ điều kiện hoặc đã có yêu cầu đang chờ."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  // ================ UI RENDERING LOGIC ================

  /**
   * LOADING STATE: Hiển thị khi đang fetch data lần đầu
   */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải dữ liệu Rank...</p>
        </div>
      </div>
    );
  }

  /**
   * TÍNH TOÁN CÁC GIÁ TRỊ ĐỂ HIỂN THỊ
   * 1. progressPercent: % tiến độ đạt followers
   * 2. followersNeeded: còn thiếu bao nhiêu followers
   * 3. isEligible: đã đủ điều kiện nâng hạng chưa?
   * 4. isMaxRank: đã đạt rank cao nhất (Diamond) chưa?
   * 5. currentRankStyle/nextRankStyle: style config cho UI
   * 6. isCommitmentMatched: user đã gõ đúng cam kết chưa?
   */
  const progressPercent = Math.min(
    (rankStatus.totalFollowers / rankStatus.nextRankMinFollowers) * 100,
    100
  );
  const followersNeeded = Math.max(
    0,
    rankStatus.nextRankMinFollowers - rankStatus.totalFollowers
  );
  const isEligible =
    rankStatus.totalFollowers >= rankStatus.nextRankMinFollowers;
  /**
   * KIỂM TRA MAX RANK:
   * - Nếu là Diamond hoặc không có rank tiếp theo → ẩn form nâng cấp
   * - Hiển thị thông báo chúc mừng thay vì form
   */
  const isMaxRank =
    rankStatus.currentRankName === "Diamond" ||
    rankStatus.currentRankName === "Kim Cương" ||
    !rankStatus.nextRankName; // Fallback: API không trả về nextRankName
  const currentRankStyle =
    RANK_STYLES[rankStatus.currentRankName] || RANK_STYLES["Casual"];
  const nextRankStyle =
    RANK_STYLES[rankStatus.nextRankName] || RANK_STYLES["Bronze"];
  const isCommitmentMatched = typedCommitment === COMMITMENT_TEXT;

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-3xl" />
        </div>

        {/* --- HEADER DASHBOARD --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[var(--primary)]">
                  Hệ thống Hạng Tác Giả
                </h2>
                <p className="text-muted-foreground mt-1">
                  Quản lý cấp bậc, theo dõi tiến độ và nhận quyền lợi độc quyền.
                </p>
              </div>
            </div>
          </div>
          {/* Badge hiển thị khi có request đang pending */}
          {latestRequest.status === "pending" && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 px-5 py-3 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 animate-pulse">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Đang xét duyệt</span>
            </div>
          )}
        </div>

        {/* --- STATS CARDS ---
         * Layout thay đổi dựa trên isMaxRank:
         * - Nếu là max rank: chỉ hiển thị 2 card (rank hiện tại và followers)
         * - Nếu chưa max: hiển thị 3 card (thêm card rank mục tiêu)
         */}
        <div
          className={`grid grid-cols-1 gap-6 ${
            isMaxRank ? "md:grid-cols-2 max-w-5xl mx-auto" : "md:grid-cols-3"
          }`}
        >
          {/* Card 1: Rank Hiện Tại */}
          <Card
            className={`relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:${currentRankStyle.borderGlow} ${currentRankStyle.bg}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <Crown
                className={`w-full h-full ${currentRankStyle.iconColor}`}
              />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hạng Tác Giả Hiện Tại
              </CardTitle>
              <div
                className={`p-2 ${currentRankStyle.badgeGradient} rounded-xl shadow-lg`}
              >
                <Crown className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <RankIcon rank={rankStatus.currentRankName} size={8} />
                <div className={`text-2xl font-bold ${currentRankStyle.color}`}>
                  {rankStatus.currentRankName}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-muted-foreground">Tỷ lệ thưởng:</span>
                  <span className="font-semibold text-foreground">
                    {rankStatus.currentRewardRate}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cấp bậc được ghi nhận
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Followers & Progress */}
          <Card className="relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] dark:hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-indigo-900/20">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <Users className="w-full h-full text-indigo-500 dark:text-indigo-400" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Số lượng người theo dõi & Tiến độ
              </CardTitle>
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  {rankStatus.totalFollowers.toLocaleString()}
                </div>
                <Users className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              </div>
              {!isMaxRank ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tiến trình:</span>
                    <span className="font-semibold text-foreground">
                      {rankStatus.totalFollowers}/
                      {rankStatus.nextRankMinFollowers}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {isEligible
                      ? "✅ Đã đủ điều kiện"
                      : `Cần thêm ${followersNeeded} người theo dõi`}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-indigo-600 dark:text-indigo-300 font-medium pt-2">
                  Hãy tiếp tục phát huy phong độ nhé!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Rank Mục Tiêu - chỉ hiển thị khi chưa đạt max rank */}
          {!isMaxRank && (
            <Card
              className={`relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                isEligible
                  ? `${nextRankStyle.borderGlow} ${nextRankStyle.bg}`
                  : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20"
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <Award className={`w-full h-full ${nextRankStyle.iconColor}`} />
              </div>
              {isEligible && (
                <div className="absolute top-2 right-2 z-20">
                  <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-lg animate-pulse">
                    <CheckCircle2 className="w-3 h-3" />
                    Đủ điều kiện
                  </div>
                </div>
              )}
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rank Mục Tiêu
                </CardTitle>
                <div
                  className={`p-2 ${
                    isEligible
                      ? nextRankStyle.badgeGradient
                      : "bg-gradient-to-r from-slate-400 to-slate-600"
                  } rounded-xl shadow-lg`}
                >
                  <Target className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <RankIcon rank={rankStatus.nextRankName} size={8} />
                  <div
                    className={`text-2xl font-bold ${
                      isEligible
                        ? nextRankStyle.color
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {rankStatus.nextRankName}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-muted-foreground">
                      Tỷ lệ thưởng mới:
                    </span>
                    <span className="font-semibold text-foreground">
                      {rankStatus.nextRankRewardRate}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-muted-foreground">Yêu cầu:</span>
                    <span className="font-semibold text-foreground">
                      {rankStatus.nextRankMinFollowers} người theo dõi
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isEligible
                    ? "Sẵn sàng thăng hạng!"
                    : `Cần tối thiểu ${rankStatus.nextRankMinFollowers} người theo dõi`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* --- FORM CAM KẾT NÂNG CẤP ---
         * Logic hiển thị form theo 3 trường hợp:
         * 1. Đã đạt max rank -> Hiện thông báo chúc mừng
         * 2. Chưa max rank + Đủ điều kiện + Không có request đang chờ -> Hiện form
         * 3. Có request đang chờ/từ chối -> Hiện thông báo trạng thái
         */}

        {/* CASE 1: Đã đạt Max Rank (Diamond) -> Hiện bảng chúc mừng */}
        {isMaxRank ? (
          <Card className="shadow-xl border-2 border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50 via-white to-cyan-100 dark:from-cyan-950/40 dark:via-background dark:to-cyan-900/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full shadow-lg shadow-cyan-200 dark:shadow-cyan-900/50">
                <Trophy className="w-8 h-8 text-white animate-pulse" />
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                Chúc mừng! Bạn đã chạm tới cấp bậc cao quý nhất hệ thống.
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4 max-w-2xl mx-auto">
              <p className="text-muted-foreground leading-relaxed">
                Bạn hiện là một tác giả <strong>Diamond</strong> xuất sắc. Những
                đóng góp của bạn là nguồn cảm hứng lớn cho cộng đồng độc giả và
                các tác giả khác. Hãy tiếp tục duy trì phong độ đỉnh cao này
                nhé!
              </p>
            </CardContent>
          </Card>
        ) : (
          /* CASE 2: Chưa Max Rank & Không có request đang chờ -> Hiện Form nâng cấp */
          latestRequest.status === "none" &&
          isEligible && (
            <Card className="shadow-xl border-2 border-primary/20">
              {/* ... (GIỮ NGUYÊN CODE FORM CŨ CỦA ÔNG Ở ĐÂY) ... */}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl text-foreground flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Đăng Ký Nâng Cấp Rank
                  <Sparkles className="w-6 h-6 text-primary" />
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Hoàn thành cam kết để gửi yêu cầu nâng cấp lên{" "}
                  {rankStatus.nextRankName}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Phần so sánh rank cũ và rank mới */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${currentRankStyle.bg}`}>
                        <RankIcon rank={rankStatus.currentRankName} size={6} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Từ</p>
                        <p
                          className={`text-lg font-bold ${currentRankStyle.color}`}
                        >
                          {rankStatus.currentRankName}
                        </p>
                      </div>
                    </div>

                    <div className="text-primary text-2xl">→</div>

                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${nextRankStyle.bg}`}>
                        <RankIcon rank={rankStatus.nextRankName} size={6} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lên</p>
                        <p
                          className={`text-lg font-bold ${nextRankStyle.color}`}
                        >
                          {rankStatus.nextRankName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Cam kết */}
                <div className="space-y-4">
                  <Label
                    htmlFor="commitment-input"
                    className="text-base font-semibold text-foreground"
                  >
                    Xác nhận Cam kết
                  </Label>
                  <div className="bg-muted border border-border rounded-lg p-4 text-sm font-medium">
                    <p className="text-muted-foreground">
                      Để xác nhận, vui lòng gõ lại chính xác câu sau vào ô bên
                      dưới:
                    </p>
                    <p className="mt-2 text-primary font-semibold">
                      {COMMITMENT_TEXT}
                    </p>
                  </div>
                  <Textarea
                    id="commitment-input"
                    placeholder="Gõ lại câu cam kết tại đây..."
                    value={typedCommitment}
                    onChange={(e) => setTypedCommitment(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                    className={`text-sm leading-relaxed transition-all ${
                      isCommitmentMatched
                        ? "border-green-500 focus-visible:ring-green-500 dark:border-green-400 dark:focus-visible:ring-green-400 bg-green-50 dark:bg-green-950/20"
                        : typedCommitment.length > 0
                        ? "border-destructive focus-visible:ring-destructive dark:border-destructive/70 dark:focus-visible:ring-destructive/70 bg-red-50 dark:bg-red-950/20"
                        : "bg-card"
                    }`}
                  />

                  {/* Feedback realtime về việc gõ đúng/sai */}
                  {typedCommitment.length > 0 && (
                    <p
                      className={`text-sm font-medium ${
                        isCommitmentMatched
                          ? "text-green-600 dark:text-green-400"
                          : "text-destructive dark:text-destructive/70"
                      }`}
                    >
                      {isCommitmentMatched
                        ? "✓ Đã trùng khớp! Bạn có thể gửi yêu cầu."
                        : "❌ Câu cam kết chưa trùng khớp."}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isCommitmentMatched}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi yêu cầu...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Gửi Yêu Cầu Nâng Cấp
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        )}
        {/* --- THÔNG BÁO TRẠNG THÁI --- */}

        {latestRequest.status !== "none" && (
          <Card
            className={`shadow-xl border-2 ${
              latestRequest.status === "pending"
                ? "border-blue-200 dark:border-blue-700"
                : latestRequest.status === "approved"
                ? "border-emerald-200 dark:border-emerald-700"
                : "border-destructive/20"
            }`}
          >
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {latestRequest.status === "pending" && (
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
                  </div>
                )}
                {latestRequest.status === "approved" && (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                {latestRequest.status === "rejected" && (
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                )}
              </div>
              <CardTitle className="text-xl text-foreground">
                {latestRequest.status === "pending" && "Yêu Cầu Đang Chờ Duyệt"}
                {latestRequest.status === "approved" && "Yêu Cầu Đã Được Duyệt"}
                {latestRequest.status === "rejected" && "Yêu Cầu Bị Từ Chối"}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {latestRequest.submittedDate &&
                  `Gửi ngày: ${latestRequest.submittedDate}`}
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              {latestRequest.status === "pending" && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-300">
                    Yêu cầu của bạn đang được đội ngũ xét duyệt. Thời gian xử lý
                    thường từ 2-5 ngày làm việc.
                  </p>
                </div>
              )}
              {/* Hiển thị lý do từ chối nếu có */}
              {latestRequest.status === "rejected" &&
                latestRequest.rejectionReason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-destructive font-semibold">
                      Lý do từ chối:
                    </p>
                    <p className="text-destructive/90 mt-2">
                      {latestRequest.rejectionReason}
                    </p>
                  </div>
                )}
              {/* Nút gửi lại khi bị từ chối */}
              {latestRequest.status === "rejected" && (
                <Button
                  onClick={() => {
                    setTypedCommitment("");
                    setLatestRequest({ status: "none" });
                  }}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Gửi Lại Yêu Cầu
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        {/* --- LỊCH SỬ YÊU CẦU --- */}
        {/* Hiển thị bảng lịch sử tất cả các request đã gửi
         * Giúp user theo dõi tiến trình qua thời gian
         */}

        {allRequests.length > 0 && (
          <Card className="shadow-sm border mt-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Lịch sử yêu cầu nâng hạng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Từ Rank</th>
                      <th className="px-4 py-3">Lên Rank</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allRequests.map((req) => (
                      <tr
                        key={req.requestId}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {new Date(req.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">{req.currentRankName}</td>
                        <td className="px-4 py-3 font-bold text-primary">
                          {req.targetRankName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              req.status.toLowerCase() === "approved"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : req.status.toLowerCase() === "pending"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {req.status === "approved"
                              ? "Thành công"
                              : req.status === "pending"
                              ? "Đang chờ"
                              : "Từ chối"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                          {req.moderatorNote || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
