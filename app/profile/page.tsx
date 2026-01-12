// app/profile/page.tsx
"use client";
import { VoiceTopupModal } from "@/components/payment/VoiceTopupModal";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  LogOut,
  Mail,
  User,
  Gem,
  Crown,
  Loader2,
  CreditCard,
  PenTool,
  Gift,
  Users,
  BookOpen,
  Heart,
  ChevronRight,
  Receipt,
  Flag,
  Bell,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { profileService } from "@/services/profileService";
import { paymentService } from "@/services/paymentService";
import {
  subscriptionService,
  SubscriptionStatus,
} from "@/services/subscriptionService"; // Import service mới
import { TopUpModal } from "@/components/payment/TopUpModal";
/**
 * TYPE DEFINITIONS:
 * - UserGender: Định nghĩa các giá trị hợp lệ cho giới tính
 * - WalletData: Cấu trúc dữ liệu cho ví (Kim cương và Voice Characters)
 * - AuthorData: Thống kê cho tác giả (rank, followers, stories)
 */
type UserGender = "M" | "F" | "other" | "unspecified" | "";

interface WalletData {
  diaBalance: number;
  voiceCharBalance: number;
}

interface AuthorData {
  rankName: string;
  totalFollower: number;
  totalStory: number;
  isVerified: boolean;
}
/**
 * COMPONENT CHÍNH: ProfilePage
 * Vai trò: Hiển thị và quản lý trang profile cá nhân của người dùng
 * Chức năng chính:
 * 1. Hiển thị thông tin cá nhân (avatar, bio, gender, birthday)
 * 2. Quản lý ví (Kim cương, Voice Characters)
 * 3. Quản lý subscription (Premium membership)
 * 4. Hiển thị thống kê tác giả (nếu là author)
 * 5. Navigation đến các trang khác (favorite stories, purchase history, etc.)
 */
export default function ProfilePage() {
  // --- HOOKS & CONTEXT ---
  const router = useRouter();
  const searchParams = useSearchParams(); // Lấy query params từ URL (dùng cho xử lý redirect sau thanh toán)
  const { user, updateUser, logout, isLoading: authIsLoading } = useAuth(); // Auth context
  // --- STATE QUẢN LÝ UI ---
  const [isEditing, setIsEditing] = useState(false); // Trạng thái chỉnh sửa profile
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading khi submit form
  const [pageIsLoading, setPageIsLoading] = useState(true); // Loading khi tải trang
  const [isClaiming, setIsClaiming] = useState(false); // Loading cho nút nhận quà
  const [isVoiceTopupOpen, setIsVoiceTopupOpen] = useState(false); // State mở modal nạp Voice
  const [isTopUpOpen, setIsTopUpOpen] = useState(false); // State mở modal nạp Kim cương

  // --- STATE QUẢN LÝ DỮ LIỆU ---
  /**
   * State ví cơ bản:
   * - diaBalance: Số dư Kim cương (dùng mua chương truyện, subscription)
   * - voiceCharBalance: Số dư Voice Characters (dùng cho text-to-speech)
   */
  const [wallet, setWallet] = useState<WalletData>({
    diaBalance: 0,
    voiceCharBalance: 0,
  });

  /**
   * State Subscription: Lấy từ API Status
   * - hasActiveSubscription: Có subscription đang active không
   * - planCode/planName: Thông tin gói subscription
   * - startAt/endAt: Thời gian bắt đầu/kết thúc
   * - dailyDias: Số kim cương nhận được mỗi ngày
   * - canClaimToday: Có thể nhận quà hôm nay không
   * - lastClaimedAt: Lần cuối nhận quà
   */
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    planCode: null,
    planName: null,
    startAt: null,
    endAt: null,
    dailyDias: 0,
    canClaimToday: false,
    lastClaimedAt: null,
  });

  const [authorStats, setAuthorStats] = useState<AuthorData | null>(null); // Thống kê tác giả
  /**
   * State form data: Lưu trữ dữ liệu form chỉnh sửa
   * - bio: Tiểu sử
   * - gender: Giới tính (M/F/other/unspecified)
   * - birthday: Ngày sinh (YYYY-MM-DD format)
   */
  const [formData, setFormData] = useState({
    bio: "",
    gender: "" as UserGender,
    birthday: "",
  }); // --- HELPER: Xử lý lỗi API (DÙNG CHUNG) ---
  /**
   * Hàm xử lý lỗi API thống nhất - tái sử dụng từ các file trước
   * Logic xử lý ưu tiên:
   * 1. Lỗi Validation từ Backend (chi tiết field)
   * 2. Message lỗi tổng quát từ Backend
   * 3. Fallback message từ response hoặc default
   *
   * Tại sao quan trọng:
   * - Đảm bảo consistency trong error handling
   * - Giảm code duplication
   * - Dễ maintain và update error messages
   */
  const handleApiError = (err: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic
    if (err.response && err.response.data && err.response.data.error) {
      const { message, details } = err.response.data.error;
      // Ưu tiên Validation errors (VD: "Ảnh quá lớn", "Ngày sinh không hợp lệ")
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          toast.error(details[firstKey].join(" "));
          return;
        }
      }
      // Message từ Backend (VD: "Email đã tồn tại", "Số dư không đủ")
      if (message) {
        toast.error(message);
        return;
      }
    }
    // 2. Fallback- lấy message từ response hoặc dùng default
    const fallbackMsg = err.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // --- HÀM XỬ LÝ NHẬN QUÀ HÀNG NGÀY ---
  /**
   * Hàm xử lý nhận quà hàng ngày cho Premium members
   * Flow:
   * 1. Check isClaiming để tránh double click
   * 2. Gọi API subscriptionService.claimDaily()
   * 3. Nếu thành công:
   *    - Toast thông báo thành công với số Dias nhận được
   *    - Cập nhật số dư ví ngay lập tức (Optimistic Update)
   *    - Cập nhật trạng thái nút nhận quà (ẩn đi)
   *    - Dispatch event để Navbar cập nhật số dư
   * 4. Nếu lỗi: gọi handleApiError()
   *
   * Tại sao dispatch event "wallet-updated"?
   * - Để Navbar (component khác) biết cập nhật số dư hiển thị
   * - Tránh phải refetch toàn bộ data hoặc dùng state management phức tạp
   */
  const handleClaimDaily = async () => {
    if (isClaiming) return; // Prevent double click
    setIsClaiming(true);
    try {
      const res = await subscriptionService.claimDaily();
      const data = res.data;

      toast.success(`Nhận thành công ${data.claimedDias} Kim cương!`);

      // 1. Cập nhật số dư ví ngay lập tức (Optimistic Update)
      setWallet((prev) => ({
        ...prev,
        diaBalance: data.walletBalance,
      }));

      // 2. Cập nhật trạng thái nút nhận quà (ẩn đi)
      setSubStatus((prev) => ({
        ...prev,
        canClaimToday: false,
        lastClaimedAt: data.claimedAt,
      }));

      // 3. Bắn sự kiện để Navbar cập nhật số dư (Quan trọng)
      window.dispatchEvent(new Event("wallet-updated"));
    } catch (error: any) {
      handleApiError(error, "Lỗi nhận quà hàng ngày.");
    } finally {
      setIsClaiming(false);
    }
  };
  // --- HÀM FETCH PROFILE DATA ---
  /**
   * Hàm fetch toàn bộ dữ liệu profile (dùng useCallback để tránh re-create)
   * Sử dụng Promise.allSettled để gọi 3 API song song:
   * 1. profileService.getProfile() - Thông tin user
   * 2. profileService.getWallet() - Số dư ví
   * 3. subscriptionService.getStatus() - Trạng thái subscription
   *
   * Ưu điểm Promise.allSettled:
   * - Chạy song song 3 API → tăng performance
   * - Không bị fail cả nếu 1 API fail
   * - Xử lý từng kết quả riêng biệt
   *
   * Flow xử lý:
   * - Profile: cập nhật AuthContext và formData
   * - Wallet: cập nhật state wallet (fallback từ profile nếu API wallet fail)
   * - Subscription: cập nhật subStatus
   */
  const fetchProfileData = useCallback(async () => {
    try {
      // Gọi song song: Profile, Wallet, và Subscription Status
      const [profileRes, walletRes, subRes] = await Promise.allSettled([
        profileService.getProfile(),
        profileService.getWallet(),
        subscriptionService.getStatus(),
      ]);

      let profileData: any = {};

      // --- XỬ LÝ PROFILE DATA ---
      if (profileRes.status === "fulfilled") {
        profileData = profileRes.value.data;
        // Cập nhật AuthContext với dữ liệu mới nhất
        updateUser({
          id: profileData.accountId?.toString(),
          username: profileData.username,
          email: profileData.email,
          avatar: profileData.avatarUrl,
          bio: profileData.bio,
          gender:
            profileData.gender === "unspecified" ? "" : profileData.gender,
          birthday: profileData.birthday,
          isAuthorApproved: profileData.isAuthor,
        });
        // Cập nhật formData cho editing
        setFormData({
          bio: profileData.bio || "",
          gender: (profileData.gender === "unspecified"
            ? ""
            : profileData.gender) as UserGender,
          birthday: profileData.birthday
            ? new Date(profileData.birthday).toISOString().split("T")[0] // Format YYYY-MM-DD
            : "",
        });
        // Nếu là tác giả, lấy thống kê
        if (profileData.isAuthor && profileData.author) {
          setAuthorStats({
            rankName: profileData.author.rankName || "Newbie",
            totalFollower: profileData.author.totalFollower || 0,
            totalStory: profileData.author.totalStory || 0,
            isVerified: profileData.author.isVerified || false,
          });
        }
      }

      // --- XỬ LÝ WALLET DATA ---
      let currentDia = 0;
      let currentVoice = 0;

      if (walletRes.status === "fulfilled") {
        // Ưu tiên data từ API wallet
        currentDia = walletRes.value.data.diaBalance || 0;
        currentVoice = walletRes.value.data.voiceCharBalance || 0;
      } else if (profileRes.status === "fulfilled") {
        // Fallback nếu API wallet lỗi (dùng data từ profile)
        currentDia = profileData.diaBalance || 0;
        currentVoice = profileData.voiceCharBalance || 0;
      }

      setWallet({
        diaBalance: currentDia,
        voiceCharBalance: currentVoice,
      });

      // --- XỬ LÝ SUBSCRIPTION STATUS ---
      if (subRes.status === "fulfilled") {
        setSubStatus(subRes.value.data);
      }
    } catch (error: any) {
      console.error("Lỗi tải data:", error);

      handleApiError(error, "Không thể tải đầy đủ thông tin.");
    } finally {
      setPageIsLoading(false); // Luôn tắt loading
    }
  }, [updateUser]); // Dependency: chỉ re-create khi updateUser thay đổi
  // --- EFFECT CHÍNH: Kiểm tra auth và load data ---
  /**
   * useEffect chính với dependencies [authIsLoading, router, fetchProfileData, searchParams]
   * Logic:
   * 1. Nếu đang loading auth → chờ
   * 2. Check token trong localStorage → nếu không có → redirect login
   * 3. Gọi fetchProfileData() để load dữ liệu
   * 4. Check searchParams cho error handling (sau khi thanh toán)
   *
   * searchParams.get("error") === "cancel":
   * - Xử lý khi user hủy thanh toán PayOS
   * - Hiển thị toast warning
   */
  useEffect(() => {
    if (authIsLoading) return; // Chờ auth loading xong
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login"); // Redirect nếu chưa login
      return;
    }
    fetchProfileData(); // Load dữ liệu profile
    // Xử lý redirect sau khi thanh toán (cancel case)
    if (searchParams.get("error") === "cancel") {
      toast.warning("Bạn đã hủy giao dịch.");
    }
  }, [authIsLoading, router, fetchProfileData, searchParams]);
  // --- HÀM XỬ LÝ THAY ĐỔI AVATAR ---
  /**
   * Hàm upload avatar mới
   * Flow:
   * 1. Lấy file từ input (chỉ lấy file đầu tiên)
   * 2. Bật isSubmitting
   * 3. Gọi API uploadAvatar(file)
   * 4. Nếu thành công: cập nhật AuthContext và hiển thị toast
   * 5. Nếu lỗi: gọi handleApiError() (xử lý ảnh quá lớn, sai định dạng)
   */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    try {
      const res = await profileService.uploadAvatar(file);
      updateUser({ avatar: res.data.avatarUrl }); // Cập nhật avatar mới
      toast.success("Đã cập nhật ảnh đại diện!");
    } catch (error: any) {
      // GỌI HÀM XỬ LÝ LỖI (VD: Ảnh quá lớn, sai định dạng)
      handleApiError(error, "Lỗi upload ảnh.");
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- HÀM LƯU THÔNG TIN PROFILE ---
  /**
   * Hàm lưu thông tin profile sau khi chỉnh sửa
   * Flow:
   * 1. Bật isSubmitting
   * 2. Gọi API updateProfile với formData
   * 3. Xử lý gender: nếu rỗng → "unspecified" (backend requirement)
   * 4. Xử lý birthday: undefined nếu rỗng
   * 5. Nếu thành công: reload data, tắt edit mode, toast success
   * 6. Nếu lỗi: gọi handleApiError()
   */
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await profileService.updateProfile({
        bio: formData.bio,
        gender: formData.gender || "unspecified", // Backend cần giá trị mặc định
        birthday: formData.birthday || undefined, // Gửi undefined nếu rỗng
      });
      fetchProfileData(); // Reload dữ liệu mới
      setIsEditing(false); // Tắt chế độ chỉnh sửa
      toast.success("Đã lưu hồ sơ!");
    } catch (error: any) {
      //  Thêm biến error vào đây
      // GỌI HÀM XỬ LÝ LỖI (VD: Tên quá dài, ngày sinh không hợp lệ)
      handleApiError(error, "Lỗi lưu hồ sơ.");
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- LOADING STATE ---
  /**
   * Hiển thị spinner loading khi đang tải dữ liệu
   * Dùng Loader2 icon với animate-spin class
   */
  if (pageIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }
  // --- VARIABLES HIỂN THỊ ---
  /**
   * Biến để hiển thị thông tin user
   * - displayName: username hoặc "Người dùng"
   * - displayAvatar: avatar URL từ user context
   * - initial: Chữ cái đầu của username (dùng cho AvatarFallback)
   */
  const displayName = user?.username || "Người dùng";
  const displayAvatar = user?.avatar;
  const initial = displayName[0]?.toUpperCase() || "U";
  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen pb-20 bg-background text-foreground font-sans">
      {/* Header với gradient background */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar Section với edit mode */}
            <div className="relative group">
              <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                <AvatarImage src={displayAvatar} className="object-cover" />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
              {/* Chỉ hiện upload button khi đang edit */}
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <Camera className="h-8 w-8" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-2">
                {displayName}
                {/* Premium Badge */}
                {subStatus.hasActiveSubscription && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1 px-2">
                    <Crown className="h-3 w-3" /> VIP
                  </Badge>
                )}
                {/* Author Badge */}
                {user?.isAuthorApproved && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-blue-500 text-blue-600"
                  >
                    <PenTool className="h-3 w-3" /> Author
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground">
                {subStatus.hasActiveSubscription
                  ? "Thành viên Premium"
                  : "Thành viên Casual"}
              </p>
            </div>
            {/* Edit/Save Buttons */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting ? "Lưu..." : "Lưu thay đổi"}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-8">
          {/* CARD TÁC GIẢ (Hiển thị Rank/Follower) */}
          {user?.isAuthorApproved && authorStats && (
            <Card className="shadow-sm border-blue-200 bg-blue-50/30 dark:bg-blue-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-blue-600" /> Thống kê Tác giả
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-background rounded-lg border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">
                      Hạng Tác Giả
                    </p>
                    <p className="font-bold text-lg text-primary">
                      {authorStats.rankName}
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" /> Số lượng người theo dõi
                    </p>
                    <p className="font-bold text-lg">
                      {authorStats.totalFollower.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      <BookOpen className="h-3 w-3" /> Tổng số truyện
                    </p>
                    <p className="font-bold text-lg">
                      {authorStats.totalStory}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* CARD THÔNG TIN CÁ NHÂN */}
          <Card className="shadow-sm border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-primary" /> Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tiểu sử (Bio)</Label>
                {isEditing ? (
                  <Input
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Giới thiệu bản thân..."
                  />
                ) : (
                  <div className="p-3 bg-muted/50 rounded-md text-sm min-h-[3rem]">
                    {formData.bio || user?.bio || "Chưa cập nhật tiểu sử."}
                  </div>
                )}
              </div>
              {/* Gender & Birthday Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Giới tính</Label>
                  {isEditing ? (
                    <Select
                      value={formData.gender}
                      onValueChange={(v) =>
                        setFormData({ ...formData, gender: v as UserGender })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Nam</SelectItem>
                        <SelectItem value="F">Nữ</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md text-sm">
                      {formData.gender === "M"
                        ? "Nam"
                        : formData.gender === "F"
                        ? "Nữ"
                        : formData.gender === "other"
                        ? "Khác"
                        : "Chưa cập nhật"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Ngày sinh</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) =>
                        setFormData({ ...formData, birthday: e.target.value })
                      }
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md text-sm">
                      {formData.birthday
                        ? new Date(formData.birthday).toLocaleDateString(
                            "vi-VN"
                          )
                        : "Chưa cập nhật"}
                    </div>
                  )}
                </div>
              </div>
              {/* Email Field (readonly, có nút change email) */}
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted/50 rounded-md text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4 opacity-50" /> {user?.email}
                  </div>

                  {/* Nút change email: redirect sang trang email-change-modal */}
                  {isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => router.push("/email-change-modal")}
                    >
                      Thay đổi
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* QUICK ACTIONS GRID (3 cards) */}
          {/* 1. Tủ truyện yêu thích */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Tủ truyện yêu thích  */}
            <div className="rounded-2xl p-5 border border-red-100 shadow-sm bg-red-50/50 flex flex-col justify-between h-full gap-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600 fill-red-600" />
                <span className="font-bold text-sm uppercase text-red-900">
                  Tủ truyện yêu thích
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-red-700/70">
                  Xem danh sách truyện bạn đang theo dõi.
                </p>
              </div>
              <Button
                onClick={() => router.push("/favorite-story")}
                className="w-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-sm rounded-xl"
              >
                <Heart className="mr-2 h-4 w-4" />
                Xem tủ truyện
              </Button>
            </div>

            {/* 2. Truyện sách đã mua  */}
            <div className="rounded-2xl p-5 border border-blue-100 shadow-sm bg-blue-50/50 flex flex-col justify-between h-full gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600 fill-blue-600" />
                <span className="font-bold text-sm uppercase text-blue-900">
                  Truyện đã mua
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-blue-700/70">
                  Kho truyện bạn đã sở hữu vĩnh viễn.
                </p>
              </div>
              <Button
                onClick={() => router.push("/purchased-stories")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-sm rounded-xl"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Xem kho sách
              </Button>
            </div>

            {/* 3. Lịch sử thanh toán  */}
            <div className="rounded-2xl p-5 border border-yellow-100 shadow-sm bg-yellow-50/50 flex flex-col justify-between h-full gap-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-yellow-600" />
                <span className="font-bold text-sm uppercase text-yellow-900">
                  Lịch sử GD
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-yellow-700/70">
                  Lịch sử nạp và mua gói cước.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/payment-history")}
                className="w-full bg-white border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 rounded-xl"
              >
                <Receipt className="mr-2 h-4 w-4" />
                Xem tất cả
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4/12 trên desktop) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-md border-primary/20 bg-gradient-to-b from-background to-primary/5 overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Ví của tôi
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Kim cương Balance với nút Nạp ngay */}
              <div className="bg-background rounded-xl p-4 border shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Số dư Kim Cương
                  </p>
                  <p className="text-2xl font-bold text-primary flex items-center gap-1">
                    {wallet.diaBalance.toLocaleString()}{" "}
                    <Gem className="h-5 w-5 text-blue-500 fill-blue-500" />
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsTopUpOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Nạp ngay
                </Button>
              </div>
              {/* Premium Subscription Section */}
              <div
                className={`rounded-xl p-4 border shadow-sm ${
                  subStatus.hasActiveSubscription
                    ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200"
                    : "bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Crown
                    className={`h-5 w-5 ${
                      subStatus.hasActiveSubscription
                        ? "text-yellow-600 fill-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className="font-bold text-sm uppercase">
                    {subStatus.hasActiveSubscription
                      ? "Premium Active"
                      : "Chưa đăng ký VIP"}
                  </span>
                </div>

                {subStatus.hasActiveSubscription ? (
                  <div className="text-sm space-y-3">
                    <div className="text-muted-foreground space-y-1">
                      <p>
                        Gói:{" "}
                        <span className="font-medium text-foreground">
                          {subStatus.planName}
                        </span>
                      </p>
                      <p>
                        Hết hạn:{" "}
                        <span className="font-medium text-foreground">
                          {subStatus.endAt
                            ? new Date(subStatus.endAt).toLocaleDateString(
                                "vi-VN"
                              )
                            : "N/A"}
                        </span>
                      </p>
                    </div>

                    {/* NÚT NHẬN QUÀ */}
                    {subStatus.canClaimToday ? (
                      <Button
                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0 shadow-md animate-pulse"
                        onClick={handleClaimDaily}
                        disabled={isClaiming}
                      >
                        {isClaiming ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Gift className="mr-2 h-4 w-4" />
                        )}
                        {isClaiming ? (
                          "Đang nhận..."
                        ) : (
                          <span className="flex items-center gap-1">
                            Nhận {subStatus.dailyDias}
                            <Gem className="h-4 w-4 text-blue-500 fill-blue-500 opacity-80" />
                          </span>
                        )}
                      </Button>
                    ) : (
                      <div className="text-xs text-center text-muted-foreground bg-black/5 p-2 rounded">
                        <p>Đã nhận quà hôm nay.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-3">
                      Nâng cấp để đọc truyện không giới hạn & nhận quà hàng
                      ngày.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                      onClick={() => setIsTopUpOpen(true)}
                    >
                      Xem gói cước
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* QUICK LINKS CARD */}
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-4 flex flex-col gap-3">
              {/* Lịch sử Báo Cáo */}
              <Button
                variant="outline"
                onClick={() => router.push("/all-report")}
                className="w-full h-auto py-3 px-4 flex items-center justify-between bg-card hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 shadow-sm rounded-xl transition-all group border-dashed border-2 dark:border-[#f0ead6]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:scale-110 transition-transform">
                    <Flag className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Lịch sử Báo Cáo</p>
                    <p className="text-[10px] text-muted-foreground font-normal">
                      Xem trạng thái xử lý
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-600" />
              </Button>
              {/* Thông báo */}
              <Button
                variant="outline"
                onClick={() => router.push("/notification")}
                className="w-full h-auto py-3 px-4 flex items-center justify-between bg-card hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-sm rounded-xl transition-all group border-dashed border-2 dark:border-[#f0ead6]"
              >
                <div className="flex items-center gap-3">
                  {/* Icon Container: Đổi sang màu xanh */}
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Thông báo</p>
                    <p className="text-[10px] text-muted-foreground font-normal">
                      Xem tin tức mới nhất
                    </p>
                  </div>
                </div>
                {/* Chevron: Đổi hover sang màu xanh */}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODALS */}
      {/* Modal nạp Kim cương */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        currentBalance={wallet.diaBalance}
      />
      {/* Modal nạp Voice Characters */}
      <VoiceTopupModal
        isOpen={isVoiceTopupOpen}
        onClose={() => setIsVoiceTopupOpen(false)}
      />
    </div>
  );
}
