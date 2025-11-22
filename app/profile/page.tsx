//app/profile/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  LogOut,
  Mail,
  Shield,
  BanknoteIcon,
  User,
  Calendar,
  Link2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { profileService } from "@/services/profileService";

type UserGender = "M" | "F" | "other" | "";

interface ProfileFormData {
  username: string;
  bio: string;
  gender: UserGender;
  birthday: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout, isLoading: authIsLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageIsLoading, setPageIsLoading] = useState(true);

  const [formData, setFormData] = useState<ProfileFormData>({
    username: user?.username || "",
    bio: user?.bio || "",
    gender: (user?.gender as UserGender) || "",
    birthday: user?.birthday || "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      setPageIsLoading(true);
      const response = await profileService.getProfile();
      const profileData = response.data;

      const mappedData = {
        id: profileData.accountId.toString(),
        username: profileData.username,
        email: profileData.email,
        avatar: profileData.avatarUrl,
        bio: profileData.bio,
        gender: profileData.gender === "unspecified" ? "" : profileData.gender,
        birthday: profileData.birthday,
        displayName: profileData.username,
      };

      updateUser(mappedData);

      setFormData({
        username: mappedData.username || "",
        bio: mappedData.bio || "",
        gender: (mappedData.gender as UserGender) || "",
        birthday: mappedData.birthday
          ? new Date(mappedData.birthday).toISOString().split("T")[0]
          : "",
      });
    } catch (error: any) {
      console.error("Lỗi tải profile:", error);
      toast.error(
        error.response?.data?.message || "Không thể tải thông tin hồ sơ."
      );
    } finally {
      setPageIsLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    if (authIsLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchProfile();
  }, [authIsLoading, router, fetchProfile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    try {
      const response = await profileService.uploadAvatar(file);
      const newAvatarUrl = response.data.avatarUrl;

      if (newAvatarUrl) {
        updateUser({ avatar: newAvatarUrl });
        toast.success("Ảnh đại diện đã được cập nhật");
      } else {
        fetchProfile();
      }
    } catch (err: any) {
      console.error("Lỗi upload avatar:", err);
      toast.error(err.response?.data?.message || "Không thể tải lên ảnh");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const dataToSend = {
        bio: formData.bio || "",
        gender: formData.gender === "" ? "unspecified" : formData.gender,
        birthday: formData.birthday || null,
      };

      const response = await profileService.updateProfile(dataToSend as any);

      const profileData = response.data;
      const mappedData = {
        id: profileData.accountId.toString(),
        username: profileData.username,
        email: profileData.email,
        avatar: profileData.avatarUrl,
        bio: profileData.bio,
        gender: profileData.gender === "unspecified" ? "" : profileData.gender,
        birthday: profileData.birthday,
        displayName: profileData.username,
      };

      updateUser(mappedData);
      toast.success("Hồ sơ đã được cập nhật");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Lỗi cập nhật profile:", err);
      toast.error(err.response?.data?.message || "Không thể cập nhật hồ sơ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        gender: (user.gender as UserGender) || "",
        birthday: user.birthday
          ? new Date(user.birthday).toISOString().split("T")[0]
          : "",
      });
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    toast.success("Đã đăng xuất");
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (pageIsLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-lg">Đang tải hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-base">
      

      {/* Header với Cover và Avatar */}
      <div className="bg-gradient-to-r">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(user?.username || "")}
                </AvatarFallback>
              </Avatar>

              {isEditing && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isSubmitting}
                  />
                </label>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{user.username}</h1>
                <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700">
                  ✅ Email Verified
                </span>
                <span className="px-3 py-1 text-sm rounded-full bg-amber-100 text-amber-700">
                  Author • Basic
                </span>
              </div>
              <div className="mt-2 text-muted-foreground text-base">
                Stories 3 • Followers 12 • Likes 40
              </div>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    className="text-base px-6 py-2"
                    disabled={isSubmitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-6 py-2"
                  >
                    {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-6 py-2"
                >
                  Chỉnh sửa hồ sơ
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nội dung chính - Layout 2 cột */}
      <div className="max-w-7.5xl mx-auto px-4 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột chính - 8 cột */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card Giới thiệu */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User className="h-6 w-6" />
                Giới thiệu
              </h2>

              <div className="space-y-5">
                {/* Bio */}
                <div className="space-y-3">
                  <Label className="text-base text-muted-foreground">
                    Tiểu sử
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Viết gì đó về bạn..."
                      className="h-12 text-base px-4"
                      disabled={isSubmitting}
                    />
                  ) : (
                    <div className="min-h-12 px-4 py-3 bg-muted rounded-md text-base">
                      {user.bio || (
                        <div className="text-center text-muted-foreground py-3">
                          <p>Thêm tiểu sử để độc giả hiểu bạn hơn</p>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-base font-medium"
                            onClick={() => setIsEditing(true)}
                          >
                            Thêm ngay
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Gender và Birthday */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <Label className="text-base text-muted-foreground">
                      Giới tính
                    </Label>
                    {isEditing ? (
                      <Select
                        value={formData.gender}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            gender: value as UserGender,
                          })
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M" className="text-base">
                            Nam
                          </SelectItem>
                          <SelectItem value="F" className="text-base">
                            Nữ
                          </SelectItem>
                          <SelectItem value="other" className="text-base">
                            Khác
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-12 px-4 bg-muted rounded-md flex items-center text-base">
                        {user.gender === "M"
                          ? "Nam"
                          : user.gender === "F"
                          ? "Nữ"
                          : user.gender === "other"
                          ? "Khác"
                          : "Chưa cập nhật"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base text-muted-foreground">
                      Ngày sinh
                    </Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.birthday}
                        onChange={(e) =>
                          setFormData({ ...formData, birthday: e.target.value })
                        }
                        className="h-12 text-base px-4"
                        disabled={isSubmitting}
                      />
                    ) : (
                      <div className="h-12 px-4 bg-muted rounded-md flex items-center text-base">
                        {user.birthday
                          ? new Date(user.birthday).toLocaleDateString("vi-VN")
                          : "Chưa cập nhật"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Liên hệ & Mạng xã hội */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Mail className="h-6 w-6" />
                Liên hệ & Mạng xã hội
              </h2>

              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-base text-muted-foreground">
                    Email
                  </Label>
                  <div className="flex gap-3">
                    <div className="h-12 px-4 bg-muted rounded-md flex items-center text-base flex-1">
                      {user.email}
                    </div>
                    {isEditing && (
                      <Button
                        type="button"
                        onClick={() => router.push("/email-change-modal")}
                        variant="outline"
                        className="h-12 px-4 text-base"
                        disabled={isSubmitting}
                      >
                        Thay đổi
                      </Button>
                    )}
                  </div>
                </div>

                {/* Placeholder cho mạng xã hội */}
                <div className="text-center py-6 border border-dashed rounded-md">
                  <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-base text-muted-foreground mb-3">
                    Bạn chưa thêm liên kết mạng xã hội
                  </p>
                  <Button
                    variant="outline"
                    size="default"
                    className="text-base px-4 py-2"
                  >
                    Thêm ngay
                  </Button>
                </div>
              </div>
            </div>

            {/* Card Hoạt động gần đây */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Hoạt động gần đây</h2>
              <div className="text-center py-10 text-muted-foreground text-base">
                <p>Chưa có hoạt động nào gần đây</p>
              </div>
            </div>

            {/* Card Tác giả (nếu là author) */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Tác giả</h2>
              <div className="grid grid-cols-3 gap-5 text-base mb-5">
                <div className="text-center">
                  <div className="text-muted-foreground">Chương đã đăng</div>
                  <div className="font-bold text-xl">24</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Đánh giá TB</div>
                  <div className="font-bold text-xl">4.6/5</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground">Doanh thu tháng</div>
                  <div className="font-bold text-xl">1.200.000₫</div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-lg p-4">
                <span className="text-base">
                  Trạng thái chi trả: Đủ điều kiện
                </span>
                <button className="btn btn-outline text-base py-2 px-4">
                  Gửi yêu cầu chi trả
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - 4 cột */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card KYC & Ngân hàng */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BanknoteIcon className="h-6 w-6" />
                Ngân hàng
              </h3>
              <ul className="text-base space-y-3">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Chủ TK:</span>
                  <strong>NGUYEN VAN A</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Ngân hàng:</span>
                  <strong>Vietcombank</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Số TK:</span>
                  <strong>***4321</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Cập nhật:</span>
                  <span>10/2025</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full mt-5 h-12 text-base">
                Cập nhật
              </Button>
            </div>

            {/* Card Bảo mật */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Bảo mật
              </h3>
              <ul className="text-base space-y-3 mb-5">
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✅</span>
                  <span>Email đã xác minh</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-amber-600">🔒</span>
                  <span>2FA: Chưa bật</span>
                </li>
              </ul>
              <div className="space-y-3">
                <Button variant="outline" className="w-full h-12 text-base">
                  Đổi mật khẩu
                </Button>
                <Button variant="outline" className="w-full h-12 text-base">
                  Đăng xuất tất cả
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-5 w-5" /> Đăng xuất
                </Button>
              </div>
            </div>

            {/* Card Thiết lập nhanh */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4">Thiết lập nhanh</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base">Chế độ tối</span>
                  <Button
                    variant="outline"
                    size="default"
                    className="text-base px-4 py-2"
                  >
                    Sáng
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base">Ngôn ngữ</span>
                  <Button
                    variant="outline"
                    size="default"
                    className="text-base px-4 py-2"
                  >
                    Tiếng Việt
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base">Thông báo email</span>
                  <Button
                    variant="outline"
                    size="default"
                    className="text-base px-4 py-2"
                  >
                    Bật
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
