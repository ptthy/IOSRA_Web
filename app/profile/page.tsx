"use client";

import { useState, useEffect, useCallback } from "react"; // 1. Thêm useCallback
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar"; // import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Camera, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { profileService } from "@/services/profileService";

type UserGender = "M" | "F" | "other" | "";
// Khớp với Form và API (tôi giữ lại `bio` vì code logic có)
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

  // ---  Di chuyển fetchProfile ra ngoài useEffect ---
  // Bọc bằng useCallback để hàm này ổn định
  const fetchProfile = useCallback(async () => {
    try {
      setPageIsLoading(true);
      const response = await profileService.getProfile();
      const profileData = response.data;

      // Ánh xạ dữ liệu API -> Context
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

      // Cập nhật state của form
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
    // ... (kiểm tra size, type giữ nguyên) ...

    setIsSubmitting(true);
    try {
      const response = await profileService.uploadAvatar(file);
      const newAvatarUrl = response.data.avatarUrl;

      if (newAvatarUrl) {
        updateUser({ avatar: newAvatarUrl });
        toast.success("Ảnh đại diện đã được cập nhật");
      } else {
        // Bây giờ hàm fetchProfile() đã TỒN TẠI ở scope này
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

      // Map lại dữ liệu trả về
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
        <p>Đang tải hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="min-h-screen flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl mb-2">
              {isEditing ? "Chỉnh sửa hồ sơ" : "Hồ sơ của tôi"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Cập nhật thông tin cá nhân của bạn"
                : "Quản lý thông tin cá nhân và cài đặt"}
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 md:p-8 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-border">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                    {getInitials(user?.username || "")}
                  </AvatarFallback>
                </Avatar>

                {isEditing && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-8 w-8 text-white" />
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

              {isEditing && (
                <p className="text-xs text-muted-foreground text-center">
                  Nhấp vào ảnh để thay đổi (Tối đa 2MB)
                </p>
              )}
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập (Username)</Label>
                <div className="h-11 px-3 bg-muted rounded-md flex items-center text-sm">
                  {user.username}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Tiểu sử</Label>
                {isEditing ? (
                  <Input
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Viết gì đó về bạn..."
                    className="h-11"
                    disabled={isSubmitting}
                  />
                ) : (
                  <div className="h-11 px-3 bg-muted rounded-md flex items-center text-sm">
                    {user.bio || "Chưa cập nhật tiểu sử"}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <div className="h-11 px-3 bg-muted rounded-md flex items-center text-sm flex-1">
                    {user.email}
                  </div>
                  {isEditing && (
                    <Button
                      type="button"
                      onClick={() => router.push("/email-change-modal")}
                      variant="outline"
                      className="h-11"
                      disabled={isSubmitting}
                    >
                      Thay đổi
                    </Button>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender">Giới tính</Label>
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
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Nam</SelectItem>
                      <SelectItem value="F">Nữ</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-11 px-3 bg-muted rounded-md flex items-center text-sm">
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

              {/* Birthday */}
              <div className="space-y-2">
                <Label htmlFor="birthday">Ngày sinh</Label>
                {isEditing ? (
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) =>
                      setFormData({ ...formData, birthday: e.target.value })
                    }
                    className="h-11"
                    disabled={isSubmitting}
                  />
                ) : (
                  <div className="h-11 px-3 bg-muted rounded-md flex items-center text-sm">
                    {user.birthday
                      ? new Date(user.birthday).toLocaleDateString("vi-VN")
                      : "Chưa cập nhật"}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!isEditing ? (
                <div className="pt-4 space-y-3">
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Chỉnh sửa hồ sơ
                  </Button>
                  <Separator />
                  <Button
                    type="button"
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full h-11 text-destructive hover:bg-destructive/10 hover:text-destructive border-2 border-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                  </Button>
                </div>
              ) : (
                <div className="pt-4 flex gap-3">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 h-11"
                    disabled={isSubmitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
