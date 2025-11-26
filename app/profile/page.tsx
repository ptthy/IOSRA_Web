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

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser, logout, isLoading: authIsLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false); // Loading cho nút nhận quà
  const [isVoiceTopupOpen, setIsVoiceTopupOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // State Ví cơ bản
  const [wallet, setWallet] = useState<WalletData>({
    diaBalance: 0,
    voiceCharBalance: 0,
  });

  // State Subscription (Lấy từ API Status)
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

  const [authorStats, setAuthorStats] = useState<AuthorData | null>(null);

  const [formData, setFormData] = useState({
    bio: "",
    gender: "" as UserGender,
    birthday: "",
  });

  // --- HÀM XỬ LÝ NHẬN QUÀ HÀNG NGÀY (GỌI API THẬT) ---
  const handleClaimDaily = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    try {
      const res = await subscriptionService.claimDaily();
      const data = res.data;

      toast.success(`Nhận thành công ${data.claimedDias} Kim cương!`);

      // 1. Cập nhật số dư ví ngay lập tức
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
      // Nếu lỗi 400 từ backend trả về (VD: SubscriptionNotFound)
      const msg = error.response?.data?.error?.message || "Lỗi nhận quà.";
      toast.error(msg);
    } finally {
      setIsClaiming(false);
    }
  };

  const fetchProfileData = useCallback(async () => {
    try {
      // Gọi song song: Profile, Wallet, và Subscription Status
      const [profileRes, walletRes, subRes] = await Promise.allSettled([
        profileService.getProfile(),
        profileService.getWallet(),
        subscriptionService.getStatus(),
      ]);

      let profileData: any = {};

      // Xử lý Profile
      if (profileRes.status === "fulfilled") {
        profileData = profileRes.value.data;
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

        setFormData({
          bio: profileData.bio || "",
          gender: (profileData.gender === "unspecified"
            ? ""
            : profileData.gender) as UserGender,
          birthday: profileData.birthday
            ? new Date(profileData.birthday).toISOString().split("T")[0]
            : "",
        });

        if (profileData.isAuthor && profileData.author) {
          setAuthorStats({
            rankName: profileData.author.rankName || "Newbie",
            totalFollower: profileData.author.totalFollower || 0,
            totalStory: profileData.author.totalStory || 0,
            isVerified: profileData.author.isVerified || false,
          });
        }
      }

      // Xử lý Wallet & Subscription từ API
      let currentDia = 0;
      let currentVoice = 0;

      if (walletRes.status === "fulfilled") {
        currentDia = walletRes.value.data.diaBalance || 0;
        currentVoice = walletRes.value.data.voiceCharBalance || 0;
      } else if (profileRes.status === "fulfilled") {
        // Fallback nếu API wallet lỗi
        currentDia = profileData.diaBalance || 0;
        currentVoice = profileData.voiceCharBalance || 0;
      }

      setWallet({
        diaBalance: currentDia,
        voiceCharBalance: currentVoice,
      });

      // Xử lý Subscription Status (Quan trọng)
      if (subRes.status === "fulfilled") {
        setSubStatus(subRes.value.data);
      }
    } catch (error: any) {
      console.error("Lỗi tải data:", error);
      toast.error("Không thể tải đầy đủ thông tin.");
    } finally {
      setPageIsLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    if (authIsLoading) return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchProfileData();
    if (searchParams.get("error") === "cancel") {
      toast.warning("Bạn đã hủy giao dịch.");
    }
  }, [authIsLoading, router, fetchProfileData, searchParams]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    try {
      const res = await profileService.uploadAvatar(file);
      updateUser({ avatar: res.data.avatarUrl });
      toast.success("Đã cập nhật ảnh đại diện!");
    } catch {
      toast.error("Lỗi upload ảnh");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await profileService.updateProfile({
        bio: formData.bio,
        gender: formData.gender || "unspecified",
        birthday: formData.birthday || undefined,
      });
      fetchProfileData();
      setIsEditing(false);
      toast.success("Đã lưu hồ sơ!");
    } catch {
      toast.error("Lỗi lưu hồ sơ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPending = async () => {
    const pendingId = localStorage.getItem("pendingTransactionId");
    if (!pendingId) return;
    try {
      await paymentService.cancelPaymentLink({
        transactionId: pendingId,
        cancellationReason: "User hủy thủ công tại profile",
      });
      toast.success("Đã hủy đơn chờ.");
      localStorage.removeItem("pendingTransactionId");
    } catch (e) {
      toast.error("Không thể hủy đơn.");
    }
  };

  if (pageIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const displayName = user?.username || "Người dùng";
  const displayAvatar = user?.avatar;
  const initial = displayName[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen pb-20 bg-background text-foreground font-sans">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                <AvatarImage src={displayAvatar} className="object-cover" />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
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

            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-2">
                {displayName}
                {subStatus.hasActiveSubscription && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1 px-2">
                    <Crown className="h-3 w-3" /> VIP
                  </Badge>
                )}
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
                    <p className="text-xs text-muted-foreground mb-1">Rank</p>
                    <p className="font-bold text-lg text-primary">
                      {authorStats.rankName}
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" /> Followers
                    </p>
                    <p className="font-bold text-lg">
                      {authorStats.totalFollower.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      <BookOpen className="h-3 w-3" /> Stories
                    </p>
                    <p className="font-bold text-lg">
                      {authorStats.totalStory}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted/50 rounded-md text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4 opacity-50" /> {user?.email}
                  </div>

                  {/* CHỖ NÀY: Dùng router.push sang trang email-change-modal */}
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
        </div>

        {/* RIGHT COLUMN */}
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
              <div className="bg-background rounded-xl p-4 border shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Số dư Kim Cương
                  </p>
                  <p className="text-2xl font-bold text-primary flex items-center gap-1">
                    <Gem className="h-5 w-5 text-blue-500 fill-blue-500" />{" "}
                    {wallet.diaBalance.toLocaleString()}
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
                        {isClaiming
                          ? "Đang nhận..."
                          : `Nhận ${subStatus.dailyDias} KC`}
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

              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs h-8 text-muted-foreground hover:text-red-500"
                  onClick={handleCancelPending}
                >
                  Kiểm tra đơn treo lỗi
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-0">
              <CardTitle className="text-l">Tài nguyên khác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/40 rounded-lg">
                <span className="text-sm font-medium">Voice Characters</span>
                <span className="font-bold text-lg font-mono text-indigo-600 dark:text-indigo-400">
                  {wallet.voiceCharBalance.toLocaleString()}
                </span>
              </div>
              <Button
                size="lg"
                onClick={() => setIsVoiceTopupOpen(true)}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm"
              >
                Nạp ký tự Voice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CHỈ CÒN MODAL NẠP TIỀN */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        currentBalance={wallet.diaBalance}
      />
      {/* Modal nạp Voice Characters */}
      <VoiceTopupModal
        isOpen={isVoiceTopupOpen}
        onClose={() => setIsVoiceTopupOpen(false)}
        currentTextBalance={wallet.voiceCharBalance}
      />
    </div>
  );
}
