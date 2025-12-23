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
  Trash2,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  publicProfileService,
  type PublicProfile,
} from "@/services/publicProfileService";
import {
  authorFollowService,
  type FollowStatusResponse,
  type FollowedAuthor,
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
// Component phân trang tái sử dụng
interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const PaginationControls = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Trước
      </Button>
      <span className="text-sm font-medium">
        Trang {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Sau <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};
export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const accountId = params.accountId as string;
  const [followedAuthors, setFollowedAuthors] = useState<FollowedAuthor[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  const [followingCount, setFollowingCount] = useState(0);
  // Biến tiện ích để check xem có phải profile chính chủ không
  const isOwnProfile = user?.id === accountId;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("stories");
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  // Filter states
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("Newest");
  const [sortDir, setSortDir] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<string>("all");
  const [languageCode, setLanguageCode] = useState<string>("all"); // <--- THÊM
  const [minAvgRating, setMinAvgRating] = useState<string>("0");

  // Tag options
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // --- STATE PHÂN TRANG MỚI ---
  const [storiesPage, setStoriesPage] = useState(1);
  const [totalStories, setTotalStories] = useState(0);

  const [followersPage, setFollowersPage] = useState(1);
  const [totalFollowers, setTotalFollowers] = useState(0);

  const [followingPage, setFollowingPage] = useState(1);
  const [totalFollowing, setTotalFollowing] = useState(0);

  const PAGE_SIZE = 10;

  // --- HELPER: Xử lý lỗi API (Dùng chung) ---
  const handleApiError = (err: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic từ Backend
    if (err.response && err.response.data && err.response.data.error) {
      const { message, details } = err.response.data.error;

      // Ưu tiên Validation (Lỗi chi tiết)
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          toast.error(details[firstKey].join(" "));
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
    const fallbackMsg = err.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
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

  // // Function to reload followers list
  // const reloadFollowers = async () => {
  //   if (!profile?.isAuthor) return;

  //   try {
  //     const followersData = await authorFollowService.getAuthorFollowers(
  //       profile.author!.authorId,
  //       //  { page: 1, pageSize: 10 }
  //       { page: followersPage, pageSize: PAGE_SIZE } // <--- SỬA
  //     );

  //     // Đảm bảo không có duplicates
  //     const uniqueFollowers = followersData.data.items.filter(
  //       (follower, index, array) =>
  //         array.findIndex((f) => f.followerId === follower.followerId) === index
  //     );

  //     //  setFollowers(uniqueFollowers);
  //     setFollowers(followersData.data.items);
  //     setTotalFollowers(followersData.data.total);
  //   } catch (error) {
  //     console.error("Error reloading followers:", error);
  //   }
  // };
  // Tìm đến hàm reloadFollowers trong page.tsx
  const reloadFollowers = async () => {
    // 1. Kiểm tra xem profile đã tải xong và có phải là tác giả không
    if (!profile?.isAuthor || !profile.author?.authorId) return;

    try {
      // 2. Gọi API với authorId của profile đang xem
      const followersData = await authorFollowService.getAuthorFollowers(
        profile.author.authorId, // Sử dụng authorId của tác giả đang xem
        { page: followersPage, pageSize: PAGE_SIZE }
      );

      // 3. Cập nhật state followers
      setFollowers(followersData.data.items);
      setTotalFollowers(followersData.data.total);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người theo dõi:", error);
    }
  };
  // QUAN TRỌNG: Thêm useEffect lắng nghe followersPage
  useEffect(() => {
    if (activeTab === "followers") {
      reloadFollowers();
      scrollToTop(); // Thêm vào đây
    }
  }, [followersPage, activeTab]);
  // Function to reload all profile data với filters
  const reloadProfileData = async () => {
    try {
      const [profileData, storiesData, followingData] = await Promise.all([
        // THÊM: Gọi API này để lấy con số total ngay từ đầu

        publicProfileService.getPublicProfile(accountId),
        publicProfileService.getPublicStories(accountId, {
          Page: storiesPage, // <--- SỬA: Dùng state page
          PageSize: PAGE_SIZE, // <--- SỬA: Dùng pageSize
          Query: query || undefined,
          TagId: selectedTag !== "all" ? selectedTag : undefined,
          LanguageCode: languageCode !== "all" ? languageCode : undefined, // <--- THÊM
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
        authorFollowService.getFollowedAuthors({
          page: 1,
          pageSize: 1, // Chỉ cần lấy count nên pageSize = 1 cho nhẹ
          accountId: accountId,
        }),
      ]);

      setProfile(profileData.data);
      setStories(storiesData.data.items);
      setTotalStories(storiesData.data.total || 0);
      const authorData = profileData.data.author as any;
      setFollowingCount(followingData.data.total || 0);

      if (profileData.data.isAuthor) {
        await reloadFollowers();
      }
    } catch (error) {
      console.error("Error reloading profile:", error);
    }
  };

  // QUAN TRỌNG: Thêm useEffect lắng nghe sự thay đổi của storiesPage
  useEffect(() => {
    if (accountId) reloadProfileData();
    scrollToTop(); // Thêm vào đây
  }, [storiesPage]);
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
  }, [
    query,
    selectedTag,
    sortBy,
    sortDir,
    isPremium,
    minAvgRating,
    languageCode,
  ]);

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
        // Reload lại list cho chắc ăn nếu logic revert phức tạp
        reloadFollowers();
      } else if (!wasFollowing && user) {
        // Nếu đang follow nhưng bị lỗi, xóa user đi
        setFollowers((prev) =>
          prev.filter((follower) => follower.followerId !== user.id)
        );
      }
      // --- 2. HIỂN THỊ LỖI (Dùng hàm mới gọn hơn) ---
      // Hàm này sẽ tự lo việc check lỗi 400 hay message từ backend
      handleApiError(error, "Không thể thực hiện thao tác (Follow/Unfollow).");

      // if (error.response?.status === 400) {
      //   const errorMessage =
      //     error.response?.data?.error?.message ||
      //     "Không thể thực hiện thao tác này";

      //   if (
      //     errorMessage.includes("FollowSelfNotAllowed") ||
      //     errorMessage.includes("tự theo dõi")
      //   ) {
      //     toast.error("Bạn không thể tự theo dõi chính mình.");
      //   } else {
      //     toast.error(errorMessage);
      //   }
      // } else {
      //   toast.error("Đã có lỗi xảy ra khi thực hiện thao tác");
      // }
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
  // --- THÊM: Load số lượng đang theo dõi (chỉ cho chính mình) ---
  useEffect(() => {
    const loadFollowingCount = async () => {
      if (isOwnProfile) {
        try {
          // Gọi API lấy trang 1, pageSize 1 chỉ để lấy field 'total'
          const response = await authorFollowService.getFollowedAuthors({
            page: 1,
            pageSize: 1,
          });
          setFollowingCount(response.data.total);
        } catch (error) {
          console.error("Error loading following count:", error);
        }
      }
    };

    loadFollowingCount();
  }, [isOwnProfile]);
  // --- THÊM: Hàm load danh sách đang theo dõi ---
  // const reloadFollowedAuthors = async () => {
  //   if (!isOwnProfile) return;

  //   setLoadingFollowed(true);
  //   try {
  //     const response = await authorFollowService.getFollowedAuthors({
  //       // page: 1,
  //       // pageSize: 50,
  //       page: followingPage, // <--- SỬA
  //       pageSize: PAGE_SIZE,
  //     });
  //     setFollowedAuthors(response.data.items);
  //     setTotalFollowing(response.data.total); // <--- THÊM
  //   } catch (error) {
  //     console.error("Error loading followed authors:", error);
  //   } finally {
  //     setLoadingFollowed(false);
  //   }
  // };
  const reloadFollowedAuthors = async () => {
    // XÓA BỎ DÒNG CHẶN: if (!isOwnProfile) return; <--- Đây là nguyên nhân khiến khách xem bị hiện số 0

    setLoadingFollowed(true);
    try {
      const response = await authorFollowService.getFollowedAuthors({
        page: followingPage,
        pageSize: PAGE_SIZE,
        // TRUYỀN accountId của profile đang xem (lấy từ params URL)
        accountId: accountId,
      });

      setFollowedAuthors(response.data.items);
      setTotalFollowing(response.data.total);

      setFollowingCount(response.data.total);
    } catch (error) {
      console.error("Lỗi tải danh sách đang theo dõi:", error);
    } finally {
      setLoadingFollowed(false);
    }
  };

  // // --- THÊM: Effect để load dữ liệu khi bấm qua tab 'following' ---
  // useEffect(() => {
  //   if (activeTab === "following" && isOwnProfile) {
  //     reloadFollowedAuthors();
  //   }
  // }, [activeTab, isOwnProfile]);
  // --- CẬP NHẬT: Effect để tự động load lại dữ liệu khi đổi Tab hoặc đổi Account ---
  useEffect(() => {
    // Khi chuyển sang tab 'following' HOẶC ID người dùng thay đổi, tự động load danh sách
    if (activeTab === "following" && accountId) {
      reloadFollowedAuthors();
      scrollToTop(); // Thêm vào đây
    }
  }, [activeTab, followingPage, accountId]); // Thêm accountId

  // --- THÊM: Xử lý Hủy theo dõi (từ trong danh sách) ---
  const handleUnfollowFromList = async (
    targetAuthorId: string,
    targetUsername: string
  ) => {
    if (!confirm(`Bạn có chắc muốn hủy theo dõi ${targetUsername}?`)) return;

    try {
      await authorFollowService.unfollowAuthor(targetAuthorId);
      // Xóa khỏi danh sách UI ngay lập tức
      setFollowedAuthors((prev) =>
        prev.filter((a) => a.authorId !== targetAuthorId)
      );

      // Cập nhật lại số liệu followerCount nếu cần thiết (tùy chọn)
      toast.success(`Đã hủy theo dõi ${targetUsername}`);
    } catch (error) {
      toast.error("Lỗi khi hủy theo dõi");
    }
  };

  // --- THÊM: Xử lý Bật/Tắt thông báo (từ trong danh sách) ---
  const handleToggleNotifyFromList = async (targetAuthor: FollowedAuthor) => {
    const newState = !targetAuthor.notificationsEnabled;

    // Optimistic Update
    setFollowedAuthors((prev) =>
      prev.map((a) =>
        a.authorId === targetAuthor.authorId
          ? { ...a, notificationsEnabled: newState }
          : a
      )
    );

    try {
      await authorFollowService.toggleNotification(
        targetAuthor.authorId,
        newState
      );
      toast.success(newState ? "Đã bật thông báo" : "Đã tắt thông báo");
    } catch (error) {
      // Revert nếu lỗi
      setFollowedAuthors((prev) =>
        prev.map((a) =>
          a.authorId === targetAuthor.authorId
            ? { ...a, notificationsEnabled: !newState }
            : a
        )
      );
      toast.error("Lỗi cập nhật thông báo");
    }
  };

  const handleStoryClick = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  const handleClearFilters = () => {
    setQuery("");
    setSelectedTag("all");
    setLanguageCode("all"); // <--- THÊM
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
  const convertToStorySummary = (story: any): StorySummary => {
    return {
      storyId: story.storyId || "",
      title: story.title || "Không tiêu đề",
      coverUrl: story.coverUrl || "",
      shortDescription: story.shortDescription || story.description || "",
      authorUsername: story.authorUsername || "Tác giả",
      authorId: story.authorId,
      totalChapters: story.totalChapters || 0,
      isPremium: !!story.isPremium,
      languageCode: story.languageCode || "vi-VN", // Đảm bảo luôn có string
      tags: Array.isArray(story.tags)
        ? story.tags.map((t: any) => ({
            tagId: t.tagId || "",
            tagName: t.tagName || t.name || "",
          }))
        : [],
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
                          {/* <p className="font-semibold">
                            {profile.author.publishedStoryCount}
                          </p> */}
                          {/* SỬA: Thêm onClick để chuyển tab stories và scroll xuống */}
                          <p
                            className="font-semibold cursor-pointer hover:underline hover:text-primary transition-colors"
                            onClick={() => {
                              // 1. Chuyển sang tab Truyện (stories)
                              setActiveTab("stories");

                              // 2. Tìm phần Tabs và cuộn xuống
                              document
                                .querySelector('[role="tablist"]')
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
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
                          {/* SỬA: Thêm onClick để chuyển tab và scroll xuống */}
                          <p
                            className="font-semibold cursor-pointer hover:underline hover:text-yellow-600 transition-colors"
                            onClick={() => {
                              // 1. Chuyển sang tab Followers
                              setActiveTab("followers");

                              // 2. Tìm phần Tabs và cuộn xuống đó một cách mượt mà
                              document
                                .querySelector('[role="tablist"]')
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            {profile.author.followerCount}
                          </p>
                          {/* SỬA: Hiển thị followerCount từ profile */}
                          {/* <p className="font-semibold">
                            {profile.author.followerCount}
                          </p> */}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Đang theo dõi
                          </p>
                          <p
                            className="font-semibold cursor-pointer hover:underline hover:text-green-600"
                            onClick={() => {
                              setActiveTab("following");
                              document
                                .querySelector('[role="tablist"]')
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            {/* followingCount giờ sẽ hiện số 3 hoặc 9 ngay khi reloadProfileData chạy xong */}
                            {followingCount}
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
                  {/* --- THÊM MỚI: Tab Đang theo dõi (Following) --- */}
                  {/* Chỉ hiện tab này nếu là Chính chủ
                  {isOwnProfile && (
                    <TabsTrigger
                      value="following"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                    >
                      <Users className="mr-2 h-4 w-4 text-green-600" />
                      Đang theo dõi
                      <Badge variant="secondary" className="ml-2">
                        {followingCount}
                      </Badge>
                    </TabsTrigger>
                    
                  )}
                   */}
                  <TabsTrigger
                    value="following"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                  >
                    <Users className="mr-2 h-4 w-4 text-green-600" />
                    Đang theo dõi
                    <Badge variant="secondary" className="ml-2">
                      {/* Con số này sẽ hiện 'liền' ngay khi Profile load xong */}
                      {followingCount}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="p-6">
                <TabsContent value="stories" className="m-0 space-y-4">
                  {/* Stories List */}
                  {stories.length > 0 ? (
                    <div className="relative">
                      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-custom scroll-smooth pt-3 px-0 min-h-[420px]">
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
                  {/* --- DÁN ĐOẠN CODE PHÂN TRANG VÀO ĐÂY --- */}
                  {stories.length > 0 && (
                    <PaginationControls
                      currentPage={storiesPage}
                      totalItems={totalStories}
                      pageSize={PAGE_SIZE}
                      onPageChange={setStoriesPage}
                    />
                  )}
                </TabsContent>
                <TabsContent value="followers" className="m-0">
                  {followers.length > 0 ? (
                    <div className="space-y-3">
                      {followers.map((follower, index) => (
                        <div
                          key={`${follower.followerId}-${index}`}
                          className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() =>
                            router.push(`/profile/${follower.followerId}`)
                          }
                        >
                          {/* Thông tin Người theo dõi - HIỂN THỊ CÔNG KHAI */}
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0 border">
                              {follower.avatarUrl ? (
                                <img
                                  src={follower.avatarUrl}
                                  alt={follower.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                  {follower.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base truncate">
                                {follower.username}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Theo dõi từ:{" "}
                                {new Date(
                                  follower.followedAt
                                ).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>

                          {/* KHÔNG hiển thị các nút hành động (chuông/xóa) ở đây 
              vì đây là danh sách công khai người xem chỉ được quyền nhìn */}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      Chưa có người theo dõi nào.
                    </div>
                  )}

                  {/* Phân trang cho Followers */}
                  {followers.length > 0 && (
                    <PaginationControls
                      currentPage={followersPage}
                      totalItems={totalFollowers}
                      pageSize={PAGE_SIZE}
                      onPageChange={setFollowersPage}
                    />
                  )}
                </TabsContent>
                {/* --- THÊM MỚI: Content 3: Following (Danh sách mình đang follow) 
                {isOwnProfile && (
                  <TabsContent value="following" className="m-0">
                    {loadingFollowed ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : followedAuthors.length > 0 ? (
                      <div className="space-y-3">
                        {followedAuthors.map((author) => (
                          <div
                            key={author.authorId}
                            className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            {/* Thông tin Author (Click để qua profile) 
                            <div
                              className="flex items-center gap-4 cursor-pointer flex-1"
                              onClick={() =>
                                router.push(`/profile/${author.authorId}`)
                              }
                            >
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0 border">
                                {author.avatarUrl ? (
                                  <img
                                    src={author.avatarUrl}
                                    alt={author.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                    <span className="text-lg font-bold text-primary">
                                      {author.username.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-base">
                                  {author.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Đã theo dõi:{" "}
                                  {new Date(
                                    author.followedAt
                                  ).toLocaleDateString("vi-VN")}
                                </p>
                              </div>
                            </div>

                            {/* Nút hành động 
                            <div className="flex items-center gap-2">
                              {/* Nút chuông 
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleToggleNotifyFromList(author)
                                }
                                title={
                                  author.notificationsEnabled
                                    ? "Tắt thông báo"
                                    : "Bật thông báo"
                                }
                              >
                                {author.notificationsEnabled ? (
                                  <Bell className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                ) : (
                                  <BellOff className="h-5 w-5 text-muted-foreground" />
                                )}
                              </Button>

                              {/* Nút hủy theo dõi 
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  handleUnfollowFromList(
                                    author.authorId,
                                    author.username
                                  )
                                }
                                title="Hủy theo dõi"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <Users className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-2">
                          Bạn chưa theo dõi tác giả nào.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => router.push("/")}
                          className="mt-2"
                        >
                          Khám phá ngay
                        </Button>
                      </div>
                    )}
                    {/* --- DÁN ĐOẠN CODE PHÂN TRANG VÀO ĐÂY 
                    {followedAuthors.length > 0 && (
                      <PaginationControls
                        currentPage={followingPage}
                        totalItems={totalFollowing}
                        pageSize={PAGE_SIZE}
                        onPageChange={setFollowingPage}
                      />
                    )}
                    {/* ---------------------------
                  </TabsContent>
                  --- */}
                <TabsContent value="following" className="m-0">
                  {loadingFollowed ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : followedAuthors.length > 0 ? (
                    <div className="space-y-3">
                      {followedAuthors.map((author) => (
                        <div
                          key={author.authorId}
                          className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          {/* Phần thông tin: AI CŨNG XEM ĐƯỢC */}
                          <div
                            className="flex items-center gap-4 cursor-pointer flex-1"
                            onClick={() =>
                              router.push(`/profile/${author.authorId}`)
                            }
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0 border">
                              {author.avatarUrl ? (
                                <img
                                  src={author.avatarUrl}
                                  alt={author.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                  {author.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-base">
                                {author.username}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Theo dõi từ:{" "}
                                {new Date(author.followedAt).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Nút hành động: CHỈ HIỆN NẾU LÀ CHÍNH CHỦ */}
                          {/* Khi khách xem, isOwnProfile = false, đoạn code này sẽ biến mất hoàn toàn */}
                          {isOwnProfile && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleToggleNotifyFromList(author)
                                }
                              >
                                {author.notificationsEnabled ? (
                                  <Bell className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                ) : (
                                  <BellOff className="h-5 w-5 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  handleUnfollowFromList(
                                    author.authorId,
                                    author.username
                                  )
                                }
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {isOwnProfile
                          ? "Bạn chưa theo dõi ai."
                          : "Người dùng này chưa theo dõi ai."}
                      </p>
                    </div>
                  )}

                  {followedAuthors.length > 0 && (
                    <PaginationControls
                      currentPage={followingPage}
                      totalItems={totalFollowing}
                      pageSize={PAGE_SIZE}
                      onPageChange={setFollowingPage}
                    />
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
