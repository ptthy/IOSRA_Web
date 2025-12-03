// app/profile/[accountId]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryCard } from "@/components/story-card";
import {
  BookOpen,
  Users,
  Calendar,
  Star,
  Bell,
  BellOff,
  Loader2,
  ArrowLeft,
  Search,
  Filter,
  X,
} from "lucide-react";
import {
  publicProfileService,
  type PublicProfile,
} from "@/services/publicProfileService";
import {
  authorFollowService,
  type FollowStatusResponse,
} from "@/services/authorFollowService";
import type { Story } from "@/services/apiTypes";
import type { StorySummary } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tagService, type TagOption } from "@/services/tagService";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const accountId = params.accountId as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("stories");

  // Filter states
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("Newest");
  const [sortDir, setSortDir] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<string>("all");
  const [minAvgRating, setMinAvgRating] = useState<string>("0");

  // Tag options
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Load top tags khi component mount
  useEffect(() => {
    loadTopTags();
  }, []);

  const loadTopTags = async () => {
    setLoadingTags(true);
    try {
      const tags = await tagService.getTopTags(10);
      setTagOptions(tags);
    } catch (error) {
      console.error("Error loading top tags:", error);
      setTagOptions([]);
    } finally {
      setLoadingTags(false);
    }
  };

  // Debounce search cho tags
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.trim()) {
        setLoadingTags(true);
        try {
          const tags = await tagService.getTagOptions(query, 10);
          setTagOptions(tags || []);
        } catch (error) {
          console.error("Error searching tags:", error);
          setTagOptions([]);
        } finally {
          setLoadingTags(false);
        }
      } else {
        loadTopTags();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Function to reload profile data (chỉ profile, không reload stories)
  const reloadProfile = async () => {
    try {
      const profileData = await publicProfileService.getPublicProfile(
        accountId
      );
      setProfile(profileData.data);
    } catch (error) {
      console.error("Error reloading profile:", error);
    }
  };

  // Function to reload followers list
  const reloadFollowers = async () => {
    if (!profile?.isAuthor) return;

    try {
      const followersData = await authorFollowService.getAuthorFollowers(
        profile.author!.authorId,
        { page: 1, pageSize: 10 }
      );

      // Đảm bảo không có duplicates
      const uniqueFollowers = followersData.data.items.filter(
        (follower, index, array) =>
          array.findIndex((f) => f.followerId === follower.followerId) === index
      );

      setFollowers(uniqueFollowers);
    } catch (error) {
      console.error("Error reloading followers:", error);
    }
  };

  // Function to reload all profile data với filters
  const reloadProfileData = async () => {
    try {
      const [profileData, storiesData] = await Promise.all([
        publicProfileService.getPublicProfile(accountId),
        publicProfileService.getPublicStories(accountId, {
          Page: 1,
          PageSize: 20,
          Query: query || undefined,
          TagId: selectedTag !== "all" ? selectedTag : undefined,
          SortBy: sortBy as
            | "Newest"
            | "WeeklyViews"
            | "TopRated"
            | "MostChapters",
          SortDir: sortDir as "Asc" | "Desc" | undefined,
          IsPremium: isPremium !== "all" ? isPremium === "true" : undefined,
          MinAvgRating:
            minAvgRating !== "0" ? parseFloat(minAvgRating) : undefined,
        }),
      ]);

      setProfile(profileData.data);
      setStories(storiesData.data.items);

      // Load followers nếu là author
      if (profileData.data.isAuthor) {
        await reloadFollowers();
      }
    } catch (error) {
      console.error("Error reloading profile:", error);
    }
  };

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        await reloadProfileData();
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      loadProfileData();
    }
  }, [accountId]);

  // Debounce cho filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === "stories") {
        reloadProfileData();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, selectedTag, sortBy, sortDir, isPremium, minAvgRating]);

  // Refresh followers khi activeTab thay đổi
  useEffect(() => {
    if (profile?.isAuthor && activeTab === "followers") {
      reloadFollowers();
    }
  }, [activeTab, profile]);

  // Handle follow/unfollow - SỬA LẠI ĐỂ ĐỒNG BỘ FOLLOWER COUNT
  const handleFollowToggle = async () => {
    if (!profile?.isAuthor) return;

    if (user?.id === accountId) {
      toast.error("Bạn không thể tự theo dõi chính mình.");
      return;
    }

    setFollowLoading(true);
    try {
      const wasFollowing = profile.followState?.isFollowing;
      const currentFollowerCount = profile.author?.followerCount || 0;

      if (wasFollowing) {
        // UNFOLLOW: Giảm follower count ngay lập tức
        const newFollowerCount = Math.max(0, currentFollowerCount - 1);

        setProfile((prev) => {
          if (!prev || !prev.author) return prev;
          return {
            ...prev,
            followState: null,
            author: {
              ...prev.author,
              followerCount: newFollowerCount,
            },
          };
        });

        // Xóa user khỏi followers list
        setFollowers((prev) =>
          prev.filter((follower) => follower.followerId !== user?.id)
        );

        await authorFollowService.unfollowAuthor(profile.author!.authorId);
        toast.success(`Bạn đã bỏ theo dõi ${profile.username}`);
      } else {
        // FOLLOW: Tăng follower count ngay lập tức
        const newFollowerCount = currentFollowerCount + 1;

        setProfile((prev) => {
          if (!prev || !prev.author) return prev;
          return {
            ...prev,
            followState: {
              isFollowing: true,
              notificationsEnabled: true,
              followedAt: new Date().toISOString(),
            },
            author: {
              ...prev.author,
              followerCount: newFollowerCount,
            },
          };
        });

        // Thêm user vào followers list
        if (user) {
          const newFollower = {
            followerId: user.id,
            username: user.username || "Người dùng",
            avatarUrl: user.avatar || null,
            followedAt: new Date().toISOString(),
            notificationsEnabled: true,
          };
          setFollowers((prev) => [newFollower, ...prev]);
        }

        await authorFollowService.followAuthor(profile.author!.authorId, {
          enableNotifications: true,
        });
        toast.success(`Bạn đã theo dõi ${profile.username}`);
      }

      // KHÔNG reload profile data ngay lập tức nữa - để tránh flash
      // Chỉ reload sau 2 giây để đồng bộ với server
      setTimeout(async () => {
        await reloadProfile();
        if (activeTab === "followers") {
          await reloadFollowers();
        }
      }, 2000);
    } catch (error: any) {
      console.error("Error toggling follow:", error);

      // Revert UI changes nếu có lỗi
      const currentFollowerCount = profile.author?.followerCount || 0;
      const wasFollowing = profile.followState?.isFollowing;

      setProfile((prev) => {
        if (!prev || !prev.author) return prev;
        return {
          ...prev,
          followState: wasFollowing ? profile.followState : null,
          author: {
            ...prev.author,
            followerCount: currentFollowerCount,
          },
        };
      });

      // Revert followers list
      if (wasFollowing && user) {
        // Nếu đang unfollow nhưng bị lỗi, thêm user trở lại
        setFollowers((prev) => {
          const userInList = prev.find((f) => f.followerId === user.id);
          if (!userInList) {
            const restoredFollower = {
              followerId: user.id,
              username: user.username || "Người dùng",
              avatarUrl: user.avatar || null,
              followedAt: new Date().toISOString(),
              notificationsEnabled: true,
            };
            return [restoredFollower, ...prev];
          }
          return prev;
        });
      } else if (!wasFollowing && user) {
        // Nếu đang follow nhưng bị lỗi, xóa user đi
        setFollowers((prev) =>
          prev.filter((follower) => follower.followerId !== user.id)
        );
      }

      if (error.response?.status === 400) {
        const errorMessage =
          error.response?.data?.error?.message ||
          "Không thể thực hiện thao tác này";

        if (
          errorMessage.includes("FollowSelfNotAllowed") ||
          errorMessage.includes("tự theo dõi")
        ) {
          toast.error("Bạn không thể tự theo dõi chính mình.");
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error("Đã có lỗi xảy ra khi thực hiện thao tác");
      }
    } finally {
      setFollowLoading(false);
    }
  };
  // Handle notification toggle - Endpoint Patch
  const handleNotificationToggle = async () => {
    if (!profile?.isAuthor || !profile.followState?.isFollowing) {
      toast.error("Bạn chưa theo dõi tác giả này");
      return;
    }

    // Nếu profile chưa load xong authorId
    if (!profile.author?.authorId) return;

    setNotificationLoading(true);

    // Tính toán trạng thái mới
    const currentNotificationState = profile.followState.notificationsEnabled;
    const newNotificationState = !currentNotificationState;

    try {
      // 1. Cập nhật UI ngay lập tức (Optimistic Update)
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followState: prev.followState
                ? {
                    ...prev.followState,
                    notificationsEnabled: newNotificationState,
                  }
                : null,
            }
          : null
      );

      // Cập nhật trong followers list (tab Followers) nếu có user hiện tại ở đó
      if (user) {
        setFollowers((prev) =>
          prev.map((follower) =>
            follower.followerId === user.id
              ? { ...follower, notificationsEnabled: newNotificationState }
              : follower
          )
        );
      }

      // 2. Gọi API PATCH thay vì Unfollow/Follow
      await authorFollowService.toggleNotification(
        profile.author.authorId,
        newNotificationState
      );

      toast.success(
        newNotificationState ? "Đã bật thông báo" : "Đã tắt thông báo"
      );

      // Không cần reloadProfile() nữa vì ta chỉ đổi 1 boolean,
      // UI đã được update ở bước 1 rồi. Trừ khi bạn muốn chắc chắn 100% dữ liệu server.
    } catch (error: any) {
      console.error("Error toggling notifications:", error);

      // Revert (hoàn tác) state nếu API lỗi
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followState: prev.followState
                ? {
                    ...prev.followState,
                    notificationsEnabled: currentNotificationState, // Quay về cũ
                  }
                : null,
            }
          : null
      );

      // Revert followers list
      if (user) {
        setFollowers((prev) =>
          prev.map((follower) =>
            follower.followerId === user.id
              ? { ...follower, notificationsEnabled: currentNotificationState }
              : follower
          )
        );
      }

      // Xử lý thông báo lỗi cụ thể
      if (error.response?.status === 404) {
        toast.error("Bạn chưa theo dõi tác giả này (Lỗi dữ liệu)");
        // Có thể reload profile ở đây để đồng bộ lại trạng thái follow
        reloadProfile();
      } else {
        toast.error("Không thể cập nhật thông báo");
      }
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleStoryClick = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  const handleClearFilters = () => {
    setQuery("");
    setSelectedTag("all");
    setSortBy("Newest");
    setSortDir(null);
    setIsPremium("all");
    setMinAvgRating("0");
  };

  const getSelectedTagName = () => {
    if (selectedTag === "all") return "";
    return (
      tagOptions.find((tag) => tag.value === selectedTag)?.label || selectedTag
    );
  };

  const getSortByDisplayName = () => {
    switch (sortBy) {
      case "Newest":
        return "Mới nhất";
      case "WeeklyViews":
        return "Lượt xem tuần";
      case "TopRated":
        return "Đánh giá cao";
      case "MostChapters":
        return "Nhiều chương nhất";
      default:
        return sortBy;
    }
  };

  const getSortDirDisplayName = () => {
    switch (sortDir) {
      case "Asc":
        return "Tăng dần";
      case "Desc":
        return "Giảm dần";
      default:
        return "Mặc định";
    }
  };

  const getPremiumDisplayName = () => {
    switch (isPremium) {
      case "true":
        return "Premium";
      case "false":
        return "Miễn phí";
      default:
        return "Tất cả";
    }
  };

  const getRatingDisplayName = () => {
    switch (minAvgRating) {
      case "0":
        return "Tất cả đánh giá";
      case "3.0":
        return "3.0★ trở lên";
      case "3.5":
        return "3.5★ trở lên";
      case "4.0":
        return "4.0★ trở lên";
      case "4.5":
        return "4.5★ trở lên";
      default:
        return `${minAvgRating}★ trở lên`;
    }
  };

  const hasActiveFilters =
    query ||
    selectedTag !== "all" ||
    sortBy !== "Newest" ||
    sortDir !== null ||
    isPremium !== "all" ||
    minAvgRating !== "0";

  // Convert Story to StorySummary for StoryCard component
  const convertToStorySummary = (story: Story): StorySummary => {
    return {
      storyId: story.storyId,
      title: story.title,
      coverUrl: story.coverUrl || "",
      shortDescription: story.shortDescription || "",
      authorUsername: story.authorUsername || "Unknown",
      authorId: story.authorId,
      totalChapters: story.totalChapters || 0,
      isPremium: story.isPremium || false,
      tags: story.tags || [],
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Users className="h-16 w-16 mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Không tìm thấy hồ sơ</p>
          <Button onClick={() => router.push("/")}>Quay lại Trang Chủ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6 pb-16 pt-6 px-4">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        {/* Profile Header */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/20">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-8 p-6 md:p-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border bg-card shadow-2xl">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-foreground">
                          {profile.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Verified Badge */}
                  {profile.author?.isVerified && (
                    <Badge className="absolute -bottom-2 -right-2 bg-green-500 text-white px-2 py-1">
                      Đã xác thực
                    </Badge>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {profile.username}
                  </h1>
                  {profile.bio && (
                    <p className="text-muted-foreground leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 py-4 border-y border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tham gia</p>
                      <p className="font-semibold">
                        {new Date(profile.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                    </div>
                  </div>

                  {profile.isAuthor && profile.author && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Truyện
                          </p>
                          <p className="font-semibold">
                            {profile.author.publishedStoryCount}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Người theo dõi
                          </p>
                          {/* SỬA: Hiển thị followerCount từ profile */}
                          <p className="font-semibold">
                            {profile.author.followerCount}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Star className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Hạng</p>
                          <p className="font-semibold">
                            {profile.author.rankName}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                {profile.isAuthor && (
                  <div className="flex flex-wrap gap-3">
                    {/* Nút Theo dõi/Đã theo dõi */}
                    <Button
                      onClick={handleFollowToggle}
                      disabled={followLoading || user?.id === accountId}
                      className={`min-w-32 transition-all duration-300 ${
                        profile.followState?.isFollowing
                          ? "bg-muted-foreground text-muted hover:bg-muted-foreground/80"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {followLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {user?.id === accountId
                        ? "Chính mình"
                        : profile.followState?.isFollowing
                        ? "Đã theo dõi"
                        : "Theo dõi"}
                    </Button>

                    {profile.followState?.isFollowing &&
                      user?.id !== accountId && (
                        <Button
                          onClick={handleNotificationToggle}
                          disabled={notificationLoading}
                          variant="outline"
                          size="sm"
                          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          {notificationLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : profile.followState.notificationsEnabled ? (
                            <>
                              <Bell className="h-4 w-4 mr-2" />
                              Đang bật thông báo
                            </>
                          ) : (
                            <>
                              <BellOff className="h-4 w-4 mr-2" />
                              Tắt thông báo
                            </>
                          )}
                        </Button>
                      )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        {profile.isAuthor && (
          <Card className="shadow-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="border-b pb-0">
                <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="stories"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Truyện đã xuất bản
                    <Badge variant="secondary" className="ml-2">
                      {stories.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="followers"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Người theo dõi
                    {/* SỬA: Hiển thị followerCount từ profile thay vì followers.length */}
                    <Badge variant="secondary" className="ml-2">
                      {profile.author?.followerCount || 0}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="p-6">
                <TabsContent value="stories" className="m-0 space-y-4">
                  {/* Filter Section - Chỉ hiển thị khi tab stories */}
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-4 space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Tìm kiếm truyện..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-12 h-12 text-base bg-background border-border/50 focus:border-primary transition-colors"
                      />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Lọc theo:</span>
                      </div>

                      {/* Tag Select */}
                      <Select
                        value={selectedTag}
                        onValueChange={setSelectedTag}
                      >
                        <SelectTrigger className="w-[180px] bg-background">
                          <SelectValue
                            placeholder={
                              loadingTags ? "Đang tải..." : "Thể loại"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả thể loại</SelectItem>
                          {tagOptions.map(
                            (tag) =>
                              tag.value &&
                              tag.value !== "all" && (
                                <SelectItem key={tag.value} value={tag.value}>
                                  {tag.label}
                                </SelectItem>
                              )
                          )}
                          {tagOptions.length === 0 && !loadingTags && (
                            <SelectItem value="no-tags" disabled>
                              Không có thể loại
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>

                      {/* Sort By Select */}
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[160px] bg-background">
                          <SelectValue placeholder="Sắp xếp theo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Newest">Mới nhất</SelectItem>
                          <SelectItem value="WeeklyViews">
                            Lượt xem tuần
                          </SelectItem>
                          <SelectItem value="TopRated">Đánh giá cao</SelectItem>
                          <SelectItem value="MostChapters">
                            Nhiều chương nhất
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Sort Direction Select */}
                      <Select
                        value={sortDir || "default"}
                        onValueChange={(value) =>
                          setSortDir(value === "default" ? null : value)
                        }
                      >
                        <SelectTrigger className="w-[130px] bg-background">
                          <SelectValue placeholder="Thứ tự" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Mặc định</SelectItem>
                          <SelectItem value="Desc">Giảm dần</SelectItem>
                          <SelectItem value="Asc">Tăng dần</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Premium Filter */}
                      <Select value={isPremium} onValueChange={setIsPremium}>
                        <SelectTrigger className="w-[120px] bg-background">
                          <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="true">Premium</SelectItem>
                          <SelectItem value="false">Miễn phí</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Rating Filter */}
                      <Select
                        value={minAvgRating}
                        onValueChange={setMinAvgRating}
                      >
                        <SelectTrigger className="w-[160px] bg-background">
                          <SelectValue placeholder="Đánh giá tối thiểu" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Tất cả đánh giá</SelectItem>
                          <SelectItem value="4.5">4.5★ trở lên</SelectItem>
                          <SelectItem value="4.0">4.0★ trở lên</SelectItem>
                          <SelectItem value="3.5">3.5★ trở lên</SelectItem>
                          <SelectItem value="3.0">3.0★ trở lên</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Active Filters */}
                    {hasActiveFilters && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                        <span className="text-sm font-medium text-muted-foreground">
                          Đang lọc:
                        </span>

                        {/* Search query với X */}
                        {query && (
                          <Badge
                            variant="secondary"
                            className="gap-1 pl-2 pr-1 py-1"
                          >
                            "{query}"
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuery("");
                              }}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3 cursor-pointer" />
                            </button>
                          </Badge>
                        )}

                        {/* Tag filter với X */}
                        {selectedTag !== "all" && (
                          <Badge
                            variant="secondary"
                            className="gap-1 pl-2 pr-1 py-1"
                          >
                            {getSelectedTagName()}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag("all");
                              }}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3 cursor-pointer" />
                            </button>
                          </Badge>
                        )}

                        {/* Sort by filter với X */}
                        {sortBy !== "Newest" && (
                          <Badge
                            variant="secondary"
                            className="gap-1 pl-2 pr-1 py-1"
                          >
                            {getSortByDisplayName()}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSortBy("Newest");
                              }}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3 cursor-pointer" />
                            </button>
                          </Badge>
                        )}

                        {/* Sort direction filter với X */}
                        {sortDir && (
                          <Badge
                            variant="secondary"
                            className="gap-1 pl-2 pr-1 py-1"
                          >
                            {getSortDirDisplayName()}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSortDir(null);
                              }}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3 cursor-pointer" />
                            </button>
                          </Badge>
                        )}

                        {/* Premium filter với X */}
                        {isPremium !== "all" && (
                          <Badge
                            variant="secondary"
                            className="gap-1 pl-2 pr-1 py-1"
                          >
                            {getPremiumDisplayName()}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsPremium("all");
                              }}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3 cursor-pointer" />
                            </button>
                          </Badge>
                        )}

                        {/* Rating filter với X */}
                        {minAvgRating !== "0" && (
                          <Badge
                            variant="secondary"
                            className="gap-1 pl-2 pr-1 py-1"
                          >
                            {getRatingDisplayName()}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMinAvgRating("0");
                              }}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3 cursor-pointer" />
                            </button>
                          </Badge>
                        )}

                        {/* Xóa tất cả */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearFilters}
                          className="h-7 text-xs ml-2"
                        >
                          Xóa tất cả
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Stories List */}
                  {stories.length > 0 ? (
                    <div className="relative">
                      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-custom scroll-smooth pt-1 px-0 min-h-[420px]">
                        {stories.map((story) => (
                          <StoryCard
                            key={story.storyId}
                            story={convertToStorySummary(story)}
                            onClick={() => handleStoryClick(story.storyId)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-2">
                        {hasActiveFilters
                          ? "Không tìm thấy truyện phù hợp với bộ lọc"
                          : "Chưa có truyện nào được xuất bản"}
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          onClick={handleClearFilters}
                          className="mt-2"
                        >
                          Xóa bộ lọc
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="followers" className="m-0">
                  {followers.length > 0 ? (
                    <div className="space-y-3">
                      {followers.map((follower, index) => (
                        <div
                          key={`${follower.followerId}-${index}`}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() =>
                            router.push(`/profile/${follower.followerId}`)
                          }
                        >
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {follower.avatarUrl ? (
                              <img
                                src={follower.avatarUrl}
                                alt={follower.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-sm font-bold text-primary-foreground">
                                  {follower.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Thông tin User */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {follower.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Theo dõi từ{" "}
                              {new Date(follower.followedAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </p>
                          </div>

                          {/* Đã xóa phần hiển thị Badge Thông báo/Quả chuông ở đây */}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <Users className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Chưa có người theo dõi
                      </p>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        )}
      </div>
    </div>
  );
}
