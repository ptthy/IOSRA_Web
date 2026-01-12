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
// --- COMPONENT PHÂN TRANG TÁI SỬ DỤNG ---
/**
 * Component PaginationControls: Phân trang chung cho toàn bộ tab
 * Nhận props:
 * - currentPage: trang hiện tại
 * - totalItems: tổng số item
 * - pageSize: số item mỗi trang
 * - onPageChange: callback khi đổi trang
 *
 * Logic: Tính totalPages = Math.ceil(totalItems / pageSize)
 * Chỉ render khi totalPages > 1
 */
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

// --- COMPONENT CHÍNH: PUBLIC PROFILE PAGE ---
/**
 * Component PublicProfilePage: Hiển thị profile công khai của người dùng
 * Có 3 tab chính: Truyện đã xuất bản, Người theo dõi, Đang theo dõi
 * Logic phức tạp với nhiều API calls và state management
 */
export default function PublicProfilePage() {
  // --- HOOKS & PARAMS ---
  const params = useParams(); // Lấy params từ URL (accountId)
  const router = useRouter(); // Router để điều hướng
  const { user } = useAuth(); // User context để check chính chủ
  const accountId = params.accountId as string; // accountId từ URL
  // --- STATE QUẢN LÝ DỮ LIỆU --
  const [followedAuthors, setFollowedAuthors] = useState<FollowedAuthor[]>([]); // Danh sách đang theo dõi
  const [loadingFollowed, setLoadingFollowed] = useState(false); // Loading cho tab following
  const [followingCount, setFollowingCount] = useState(0); // Số lượng đang theo dõi

  // Biến tiện ích để check xem có phải profile chính chủ không
  // So sánh user?.id (từ AuthContext) với accountId (từ URL)
  const isOwnProfile = user?.id === accountId;

  const [profile, setProfile] = useState<PublicProfile | null>(null); // Thông tin profile
  const [stories, setStories] = useState<Story[]>([]); // Danh sách truyện
  const [followers, setFollowers] = useState<any[]>([]); // Danh sách người theo dõi
  const [loading, setLoading] = useState(true); // Loading chính
  const [followLoading, setFollowLoading] = useState(false); // Loading follow/unfollow
  const [notificationLoading, setNotificationLoading] = useState(false); // Loading toggle notification
  const [activeTab, setActiveTab] = useState("stories"); // Tab đang active
  // --- HELPER: SCROLL TO TOP ---
  /**
   * Hàm scroll mượt lên đầu trang
   * Dùng window.scrollTo với behavior: "smooth"
   * Gọi khi chuyển tab hoặc đổi trang
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  // --- STATE CHO FILTER TRUYỆN (Tab Stories) ---
  const [query, setQuery] = useState(""); // Tìm kiếm theo tên
  const [selectedTag, setSelectedTag] = useState<string>("all"); // Tag filter
  const [sortBy, setSortBy] = useState<string>("Newest"); // Tag filter
  const [sortDir, setSortDir] = useState<string | null>(null); // Hướng sắp xếp
  const [isPremium, setIsPremium] = useState<string>("all"); // Filter premium/free
  const [languageCode, setLanguageCode] = useState<string>("all"); // Filter ngôn ngữ
  const [minAvgRating, setMinAvgRating] = useState<string>("0"); // Filter rating tối thiểu

  // Tag options
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]); // Danh sách tag options
  const [loadingTags, setLoadingTags] = useState(false); // Loading tags

  // --- STATE PHÂN TRANG MỚI ---
  /**
   * Mỗi tab có state phân trang riêng:
   * - storiesPage: trang hiện tại của tab stories
   * - totalStories: tổng số truyện từ API
   * - followersPage/totalFollowers: cho tab followers
   * - followingPage/totalFollowing: cho tab following
   */
  const [storiesPage, setStoriesPage] = useState(1);
  const [totalStories, setTotalStories] = useState(0);

  const [followersPage, setFollowersPage] = useState(1);
  const [totalFollowers, setTotalFollowers] = useState(0);

  const [followingPage, setFollowingPage] = useState(1);
  const [totalFollowing, setTotalFollowing] = useState(0);

  const PAGE_SIZE = 10; // Số item mỗi trang (cố định cho tất cả tab)

  // --- HELPER: Xử lý lỗi API (Dùng chung) ---
  /**
   * Hàm xử lý lỗi API thống nhất (giống các  file khác)
   * Ưu tiên: Validation errors → Backend message → Fallback
   */
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
  // --- EFFECT: Load top tags khi component mount ---
  /**
   * useEffect chạy 1 lần khi component mount
   * Mục đích: Load top 10 tags để hiển thị trong filter
   * Gọi tagService.getTopTags(10)
   */
  useEffect(() => {
    loadTopTags();
  }, []);
  // --- HÀM LOAD TOP TAGS ---
  /**
   * Hàm gọi API lấy top tags
   * Flow: bật loading → gọi API → cập nhật state → tắt loading
   */
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

  // --- EFFECT: Debounce search cho tags ---
  /**
   * useEffect với dependency [query]
   * Mục đích: Tìm kiếm tags khi user nhập từ khóa
   * Debounce 300ms để tránh gọi API quá nhiều
   * Logic: Nếu query có nội dung → search tags, ngược lại → load top tags
   */
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
        loadTopTags(); // Nếu query rỗng, load top tags
      }
    }, 300);

    return () => clearTimeout(timeoutId); // Cleanup timeout
  }, [query]);

  // --- HÀM RELOAD PROFILE (CHỈ THÔNG TIN) ---
  /**
   * Hàm reload profile data (không bao gồm stories)
   * Dùng để cập nhật thông tin profile sau khi follow/unfollow
   */
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

  // --- HÀM RELOAD FOLLOWERS (TAB FOLLOWERS) ---
  /**
   * Hàm tải danh sách người theo dõi (followers) của tác giả
   * Chỉ gọi khi profile là tác giả và có authorId
   * Sử dụng pagination state: followersPage, PAGE_SIZE
   * Gọi API: authorFollowService.getAuthorFollowers()
   */
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

  // --- EFFECT: Reload followers khi page thay đổi ---
  /**
   * useEffect với dependencies [followersPage, activeTab]
   * Chạy khi: 1) followersPage thay đổi, 2) activeTab chuyển sang "followers"
   * Mục đích: Cập nhật danh sách followers khi phân trang hoặc chuyển tab
   */
  useEffect(() => {
    if (activeTab === "followers") {
      reloadFollowers();
      scrollToTop(); // Scroll lên đầu khi load data mới
    }
  }, [followersPage, activeTab]);
  // --- HÀM RELOAD ALL PROFILE DATA VỚI FILTERS ---
  /**
   * Hàm chính để load toàn bộ dữ liệu profile:
   * 1. Thông tin profile (publicProfileService.getPublicProfile)
   * 2. Danh sách truyện với filters (publicProfileService.getPublicStories)
   * 3. Số lượng đang theo dõi (authorFollowService.getFollowedAuthors)
   *
   * Sử dụng Promise.all để gọi song song 3 API
   * Truyền filters vào API stories: query, tag, language, sort, premium, rating
   */
  const reloadProfileData = async () => {
    try {
      const [profileData, storiesData, followingData] = await Promise.all([
        // THÊM: Gọi API này để lấy con số total ngay từ đầu

        publicProfileService.getPublicProfile(accountId),
        publicProfileService.getPublicStories(accountId, {
          Page: storiesPage,
          PageSize: PAGE_SIZE,
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

  // --- EFFECT: Reload profile data khi storiesPage thay đổi ---
  /**
   * useEffect với dependency [storiesPage]
   * Chạy mỗi khi storiesPage thay đổi (phân trang truyện)
   * Gọi reloadProfileData() và scrollToTop()
   */
  useEffect(() => {
    if (accountId) reloadProfileData();
    scrollToTop();
  }, [storiesPage]);
  // --- EFFECT: Load profile data khi accountId thay đổi ---
  /**
   * useEffect chính: load toàn bộ dữ liệu khi component mount hoặc accountId thay đổi
   * Flow: bật loading → gọi reloadProfileData() → tắt loading
   */
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

  // --- EFFECT: Debounce cho filter changes (Tab Stories) ---
  /**
   * useEffect với dependencies là tất cả filter states
   * Mục đích: Tự động reload stories khi filter thay đổi
   * Debounce 500ms để tránh gọi API quá nhiều khi user đang nhập
   * Chỉ chạy khi activeTab === "stories"
   */
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

  // --- EFFECT: Refresh followers khi activeTab thay đổi ---
  /**
   * Chạy khi activeTab thay đổi hoặc profile thay đổi
   * Nếu chuyển sang tab "followers" và profile là tác giả → reload followers
   */
  useEffect(() => {
    if (profile?.isAuthor && activeTab === "followers") {
      reloadFollowers();
    }
  }, [activeTab, profile]);

  // --- HÀM HANDLE FOLLOW/UNFOLLOW ---
  /**
   * Hàm xử lý follow/unfollow tác giả
   * Flow phức tạp với Optimistic Updates:
   * 1. Check điều kiện (không tự follow chính mình)
   * 2. Optimistic update: cập nhật UI ngay (followerCount, followState)
   * 3. Gọi API follow/unfollow
   * 4. Nếu thành công: reload data sau 2s để đồng bộ server
   * 5. Nếu lỗi: Revert UI changes (quay lại state cũ)
   * 6. Xử lý lỗi với handleApiError()
   */
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
        // UNFOLLOW: Giảm follower count ngay lập tức (Optimistic Update)
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

        // Xóa user khỏi followers list (UI)
        setFollowers((prev) =>
          prev.filter((follower) => follower.followerId !== user?.id)
        );

        await authorFollowService.unfollowAuthor(profile.author!.authorId);
        toast.success(`Bạn đã bỏ theo dõi ${profile.username}`);
      } else {
        // FOLLOW: Tăng follower count ngay lập tức (Optimistic Update)
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

        // Thêm user vào followers list (UI)
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

      // Hàm này sẽ tự lo việc check lỗi 400 hay message từ backend
      handleApiError(error, "Không thể thực hiện thao tác (Follow/Unfollow).");
    } finally {
      setFollowLoading(false);
    }
  };
  // --- HÀM HANDLE NOTIFICATION TOGGLE ---
  /**
   * Hàm bật/tắt thông báo cho tác giả đang theo dõi
   * Sử dụng PATCH API thay vì unfollow/follow lại
   * Optimistic Update: cập nhật UI ngay → gọi API → revert nếu lỗi
   */
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

      // 2. Gọi API PATCH (toggleNotification)
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
  // --- EFFECT: Load số lượng đang theo dõi (chỉ cho chính mình) ---
  /**
   * useEffect với dependency [isOwnProfile]
   * Chạy khi isOwnProfile thay đổi (khi user login/logout hoặc xem profile khác)
   * Mục đích: Load số lượng đang theo dõi cho tab "Đang theo dõi"
   * Gọi API với pageSize = 1 chỉ để lấy total count
   */
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
  // --- HÀM RELOAD FOLLOWED AUTHORS (TAB FOLLOWING) ---
  /**
   * Hàm tải danh sách các tác giả mà user đang theo dõi
   * Có thể gọi cho cả chính chủ và khách xem
   * Sử dụng accountId từ params để lấy danh sách của profile đang xem
   * Phân trang: followingPage, PAGE_SIZE
   */
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

  // --- EFFECT: Tự động load lại dữ liệu khi đổi Tab hoặc đổi Account ---
  /**
   * useEffect với dependencies [activeTab, followingPage, accountId]
   * Chạy khi: chuyển sang tab 'following', đổi trang following, hoặc đổi accountId
   * Mục đích: Load danh sách followed authors khi cần thiết
   */
  useEffect(() => {
    // Khi chuyển sang tab 'following' HOẶC ID người dùng thay đổi, tự động load danh sách
    if (activeTab === "following" && accountId) {
      reloadFollowedAuthors();
      scrollToTop(); // Thêm vào đây
    }
  }, [activeTab, followingPage, accountId]); // Thêm accountId

  // --- HÀM HỦY THEO DÕI (TỪ TRONG DANH SÁCH) ---
  /**
   * Hàm xử lý hủy theo dõi từ danh sách Following
   * Chỉ dành cho chính chủ (isOwnProfile = true)
   * Flow: Confirm → gọi API → xóa khỏi UI ngay → toast
   */
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

  // --- HÀM BẬT/TẮT THÔNG BÁO (TỪ TRONG DANH SÁCH) ---
  /**
   * Hàm toggle notification từ danh sách Following
   * Chỉ dành cho chính chủ
   * Optimistic Update: cập nhật UI ngay → gọi API → revert nếu lỗi
   */
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
  // --- HÀM XỬ LÝ CLICK TRUYỆN ---
  /**
   * Hàm điều hướng đến trang chi tiết truyện
   * Sử dụng router.push với path /story/{storyId}
   */
  const handleStoryClick = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };
  // --- HÀM CLEAR FILTERS ---
  /**
   * Hàm reset tất cả filters về giá trị mặc định
   * Gọi khi user click nút "Xóa bộ lọc"
   */
  const handleClearFilters = () => {
    setQuery("");
    setSelectedTag("all");
    setLanguageCode("all");
    setSortBy("Newest");
    setSortDir(null);
    setIsPremium("all");
    setMinAvgRating("0");
  };
  // --- HELPER FUNCTIONS: Hiển thị tên filter ---
  /**
   * Các hàm helper để hiển thị tên filter thân thiện
   * Ví dụ: "true" → "Premium", "Newest" → "Mới nhất"
   * Dùng trong UI để hiển thị filter đang active
   */
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
  // --- KIỂM TRA CÓ FILTER ACTIVE KHÔNG ---
  /**
   * Biến kiểm tra xem có filter nào đang active không
   * Dùng để hiển thị nút "Xóa bộ lọc" và thông báo empty state
   */
  const hasActiveFilters =
    query ||
    selectedTag !== "all" ||
    sortBy !== "Newest" ||
    sortDir !== null ||
    isPremium !== "all" ||
    minAvgRating !== "0";

  // --- HÀM CONVERT STORY TO STORYSUMMARY ---
  /**
   * Hàm convert từ Story (API response) sang StorySummary (dùng cho StoryCard)
   * StoryCard component yêu cầu định dạng StorySummary
   * Xử lý các trường có thể undefined/null
   */
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
  // --- LOADING STATE ---
  /**
   * Hiển thị khi đang tải dữ liệu profile
   * Spinner + text "Đang tải..."
   */
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
  // --- NOT FOUND STATE ---
  /**
   * Hiển thị khi không tìm thấy profile
   * Icon Users + text "Không tìm thấy hồ sơ" + nút Quay lại
   */
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
  // --- MAIN RENDER ---
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
              {/* Avatar Section */}
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
                  {/* Verified Badge (chỉ cho tác giả đã xác thực) */}
                  {profile.author?.isVerified && (
                    <Badge className="absolute -bottom-2 -right-2 bg-green-500 text-white px-2 py-1">
                      Đã xác thực
                    </Badge>
                  )}
                </div>
              </div>

              {/* Profile Info Section */}
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

                {/* Stats Row */}
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
                      {/* Published Stories Count */}
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Truyện
                          </p>

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
                      {/* Followers Count */}
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

                {/* Action Buttons (chỉ hiển thị nếu là tác giả) */}
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
                    {/* Nút Bật/Tắt thông báo (chỉ khi đã theo dõi) */}
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

        {/* Tabs Section (chỉ hiển thị nếu là tác giả) */}
        {profile.isAuthor && (
          <Card className="shadow-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="border-b pb-0">
                <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                  {/* Tab 1: Truyện đã xuất bản */}
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
                  {/* Tab 2: Người theo dõi */}
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

                  {/* Tab 3: Đang theo dõi */}
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
                {/* Tab Content 1: Stories */}
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
                  {/* Pagination cho Stories */}
                  {stories.length > 0 && (
                    <PaginationControls
                      currentPage={storiesPage}
                      totalItems={totalStories}
                      pageSize={PAGE_SIZE}
                      onPageChange={setStoriesPage}
                    />
                  )}
                </TabsContent>
                {/* Tab Content 2: Followers */}
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
                {/* Tab Content 3: Following */}
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
                  {/* Phân trang cho Following */}
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
