// app/search/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StoryCard } from "@/components/story-card";
import { Search, Filter, Loader2, X } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { storyCatalogApi } from "@/services/storyCatalog";
import { tagService, type TagOption } from "@/services/tagService";
import type {
  Story,
  PaginatedResponse,
  AdvanceFilterParams,
} from "@/services/apiTypes";
import { StorySummary } from "@/lib/types";
/**
 * TRANG TÌM KIẾM TRUYỆN VỚI ADVANCED FILTERS
 *
 * MỤC ĐÍCH:
 * - Cung cấp giao diện tìm kiếm và lọc truyện nâng cao
 * - Hiển thị kết quả với phân trang
 * - Quản lý nhiều bộ lọc đồng thời (tag, ngôn ngữ, rating, premium...)
 *
 * TÍNH NĂNG NỔI BẬT:
 * 1. Debounce search: Tránh gọi API quá nhiều khi user đang gõ
 * 2. Advanced filtering: 7+ tiêu chí lọc khác nhau
 * 3. Real-time filter badges: Hiển thị và xóa từng filter
 * 4. Smart pagination: Tự động reset page khi filter thay đổi
 * 5. Error handling chi tiết từ backend
 *
 * FLOW CHÍNH:
 * 1. Load top tags khi component mount
 * 2. Debounce search query để tìm tags
 * 3. Khi filter thay đổi -> reset page về 1
 * 4. Gọi API với tất cả filters và pagination
 * 5. Hiển thị kết quả với phân trang thông minh
 */
export default function SearchPage() {
  const router = useRouter();
  // --- STATE QUẢN LÝ FILTERS ---
  const [query, setQuery] = useState(""); // Từ khóa tìm kiếm
  const [selectedTag, setSelectedTag] = useState<string>("all"); // Tag đã chọn
  const [sortBy, setSortBy] = useState<string>("Newest"); // Tiêu chí sắp xếp
  const [sortDir, setSortDir] = useState<string | null>(null); // Hướng sắp xếp
  const [isPremium, setIsPremium] = useState<string>("all"); // Lọc premium/free
  const [minAvgRating, setMinAvgRating] = useState<string>("0"); // Rating tối thiểu
  const [languageCode, setLanguageCode] = useState<string>("all"); // Ngôn ngữ
  const [page, setPage] = useState(1); // Trang hiện tại
  // --- STATE QUẢN LÝ DATA VÀ TRẠNG THÁI ---
  const [data, setData] = useState<PaginatedResponse<Story> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho dropdown tags
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  /**
   * EFFECT 1: LOAD TOP TAGS KHI COMPONENT MOUNT
   *
   * MỤC ĐÍCH: Load danh sách tag phổ biến để hiển thị trong dropdown
   * OPTIMIZATION: Chỉ chạy 1 lần khi component mount (empty dependency array)
   */
  useEffect(() => {
    loadTopTags();
  }, []);
  /**
   * HÀM LOAD TOP TAGS (10 tags phổ biến nhất)
   *
   * LOGIC:
   * 1. Set loading state cho tags
   * 2. Gọi API getTopTags(10)
   * 3. Update tagOptions state
   * 4. Xử lý lỗi nếu có
   */
  const loadTopTags = async () => {
    setLoadingTags(true);
    try {
      const tags = await tagService.getTopTags(10);
      setTagOptions(tags);
    } catch (error) {
      console.error("Error loading top tags:", error);
      setTagOptions([]); // Fallback: empty array
    } finally {
      setLoadingTags(false);
    }
  };
  /**
   * EFFECT 2: DEBOUNCE SEARCH CHO TAGS
   *
   * MỤC ĐÍCH: Tìm kiếm tag theo từ khóa nhưng tránh gọi API quá nhiều
   * DEBOUNCE TECHNIQUE: Sử dụng setTimeout + clearTimeout
   *
   * LOGIC:
   * - Nếu query không rỗng: Search tags theo query
   * - Nếu query rỗng: Load lại top tags
   * - Debounce 300ms: Chờ user ngừng gõ
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
        // Query rỗng: load top tags
        loadTopTags();
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [query]);

  /**
   * EFFECT 3: EFFECT CHÍNH ĐỂ GỌI API LOAD STORIES
   *
   * KỸ THUẬT DOUBLE DEBOUNCE:
   * 1. Debounce 500ms để chờ user ngừng thao tác
   * 2. Gọi loadStories() với tất cả filters hiện tại
   *
   * DEPENDENCY ARRAY: Bao gồm TẤT CẢ filters và page
   * -> Mỗi khi filter thay đổi hoặc đổi trang sẽ trigger reload
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadStories();
    }, 500); // Chờ người dùng ngừng thao tác 500ms

    return () => clearTimeout(timeoutId);
    // Lắng nghe TẤT CẢ các thay đổi bao gồm cả page và bộ lọc
  }, [
    page,
    query,
    selectedTag,
    sortBy,
    sortDir,
    isPremium,
    minAvgRating,
    languageCode,
  ]);

  /**
   * EFFECT 4: RESET PAGE VỀ 1 KHI FILTERS THAY ĐỔI
   *
   * VẤN ĐỀ CẦN GIẢI QUYẾT:
   * - User đang ở page 5, thay đổi filter -> kết quả mới có thể không có 5 trang
   * - Cần reset về page 1 để hiển thị kết quả đúng
   *
   * LƯU Ý QUAN TRỌNG: Không cho page vào dependency array
   * - Nếu cho page vào -> infinite loop: page change -> reset page -> page change...
   */
  useEffect(() => {
    if (page !== 1) {
      setPage(1); // Reset về trang đầu khi filter thay đổi
    }
    // Không cho page vào dependency ở đây để tránh lặp vô tận
  }, [
    query,
    selectedTag,
    sortBy,
    sortDir,
    isPremium,
    minAvgRating,
    languageCode,
  ]);

  /**
   * HÀM CHÍNH: LOAD STORIES VỚI ADVANCED FILTERS
   *
   * FLOW CHI TIẾT:
   * 1. Set loading state và reset error
   * 2. Build params object với định dạng VIẾT HOA (theo backend requirement)
   * 3. Gọi API getAdvancedFilter với params
   * 4. Cuộn lên đầu trang sau khi có data mới
   * 5. Xử lý lỗi chi tiết từ backend
   *
   * API PARAMS FORMAT:
   * - VIẾT HOA: Page, PageSize, Query, TagId, LanguageCode, SortBy, SortDir...
   * - undefined cho các filter "all" hoặc "default"
   */
  const loadStories = async () => {
    setLoading(true);
    setError(null);
    try {
      // LUÔN DÙNG ADVANCE FILTER - với parameters VIẾT HOA
      const params: AdvanceFilterParams = {
        Page: page,
        PageSize: 20,
        Query: query || undefined, // undefined nếu query rỗng
        TagId: selectedTag !== "all" ? selectedTag : undefined,
        LanguageCode: languageCode !== "all" ? languageCode : undefined,
        SortBy: sortBy as
          | "Newest"
          | "WeeklyViews"
          | "TopRated"
          | "MostChapters",
        SortDir: sortDir as "Asc" | "Desc" | undefined,
        IsPremium: isPremium !== "all" ? isPremium === "true" : undefined,
        MinAvgRating:
          minAvgRating !== "0" ? parseFloat(minAvgRating) : undefined,
      };

      console.log("🎯 Using ADVANCE filter with params:", params);
      const result = await storyCatalogApi.getAdvancedFilter(params);
      setData(result);
      // UX IMPROVEMENT: Cuộn lên đầu ngay sau khi có dữ liệu mới
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (error: any) {
      console.error("Error loading stories:", error);

      // Mặc định là lỗi chung
      let finalErrorMessage =
        "Không thể tải danh sách truyện. Vui lòng thử lại sau.";

      // --- LOGIC BÓC TÁCH LỖI ---
      if (error.response && error.response.data && error.response.data.error) {
        const { message, details } = error.response.data.error;

        // 1. Ưu tiên Validation (Details) -> Lấy lỗi đầu tiên tìm thấy
        if (details) {
          const firstKey = Object.keys(details)[0];
          if (firstKey && details[firstKey].length > 0) {
            // Gán lỗi chi tiết vào biến để hiển thị
            finalErrorMessage = details[firstKey].join(" ");
          }
        }
        // 2. Nếu không có details thì lấy message từ Backend
        else if (message) {
          finalErrorMessage = message;
        }
      }
      // 3. Xử lý trường hợp lỗi 400 mà không có body chuẩn
      else if (error.response?.status === 400) {
        finalErrorMessage = "Dữ liệu tìm kiếm không hợp lệ.";
      }

      // Cập nhật vào State để hiển thị ra UI (Khung đỏ giữa màn hình)
      setError(finalErrorMessage);
    } finally {
      setLoading(false);
    }
  };
  /**
   * HANDLER: CLICK VÀO STORY CARD
   *
   * NAVIGATION: Điều hướng đến trang chi tiết truyện
   * @param storyId - ID của truyện được click
   */
  const handleStoryClick = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };
  /**
   * HANDLER: CLEAR ALL FILTERS
   *
   * RESET tất cả filters về giá trị mặc định:
   * - Query: ""
   * - SelectedTag: "all"
   * - SortBy: "Newest"
   * - SortDir: null
   * - IsPremium: "all"
   * - MinAvgRating: "0"
   * - LanguageCode: "all"
   * - Page: 1
   */
  const handleClearFilters = () => {
    setQuery("");
    setSelectedTag("all");
    setSortBy("Newest");
    setSortDir(null);
    setIsPremium("all");
    setMinAvgRating("0");
    setLanguageCode("all");
    setPage(1);
  };
  /**
   * HELPER: GET DISPLAY NAME CHO SELECTED TAG
   *
   * Tìm tên hiển thị của tag dựa trên value
   * @returns Tên tag hoặc "" nếu là "all"
   */
  const getSelectedTagName = () => {
    if (selectedTag === "all") return "";
    return (
      tagOptions.find((tag) => tag.value === selectedTag)?.label || selectedTag
    );
  };
  /**
   * HELPER: GET DISPLAY NAME CHO SORT BY
   *
   * Chuyển đổi internal value thành tên hiển thị tiếng Việt
   */
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
  /**
   * HELPER: GET DISPLAY NAME CHO SORT DIRECTION
   */
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
  /**
   * HELPER: GET DISPLAY NAME CHO PREMIUM FILTER
   */
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
  /**
   * HELPER: GET DISPLAY NAME CHO RATING FILTER
   */
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
  /**
   * HELPER: GET DISPLAY NAME CHO LANGUAGE FILTER
   */
  const getLanguageDisplayName = () => {
    switch (languageCode) {
      case "vi-VN":
        return "Tiếng Việt";
      case "en-US":
        return "Tiếng Anh";
      case "ja-JP":
        return "Tiếng Nhật";
      case "zh-CN":
        return "Tiếng Trung";
      default:
        return languageCode;
    }
  };
  /**
   * CHECK: CÓ ACTIVE FILTERS KHÔNG?
   *
   * Kiểm tra xem có filter nào khác giá trị mặc định không
   * Dùng để hiển thị/ẩn active filters section
   */
  const hasActiveFilters =
    query ||
    selectedTag !== "all" ||
    languageCode !== "all" ||
    sortBy !== "Newest" ||
    sortDir !== null ||
    isPremium !== "all" ||
    minAvgRating !== "0";
  /**
   * HELPER: CONVERT API STORY TO STORY SUMMARY
   *
   * CHUYỂN ĐỔI DỮ LIỆU: Từ API response format sang format của StoryCard component
   *
   * LÝ DO CẦN CONVERT:
   * - API trả về format khác với StoryCard yêu cầu
   * - Đảm bảo type safety và consistency
   * - Xử lý missing data với fallback values
   */
  const convertToStorySummary = (story: any): StorySummary => {
    return {
      storyId: story.storyId || "",
      title: story.title || "",
      coverUrl: story.coverUrl || "",
      shortDescription: story.shortDescription || story.description || "",
      authorUsername: story.authorUsername || "Tác giả",
      authorId: story.authorId,
      totalChapters: story.totalChapters || 0,
      isPremium: !!story.isPremium,
      languageCode: story.languageCode || "vi-VN",
      tags: Array.isArray(story.tags)
        ? story.tags.map((t: any) => ({
            tagId: t.tagId || "",
            tagName: t.tagName || t.name || "",
          }))
        : [],
    };
  };

  /**
   * CALCULATE: TOTAL PAGES
   *
   * CÔNG THỨC: totalPages = ceil(total / pageSize)
   * Dùng cho pagination controls
   */
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;
  /**
   * RENDER CHÍNH CỦA COMPONENT
   *
   * CẤU TRÚC GIAO DIỆN:
   * 1. Header với title và description
   * 2. Filter area với search và các bộ lọc
   * 3. Active filters badges (nếu có)
   * 4. Results area với loading/error/empty/data states
   * 5. Pagination controls (nếu có nhiều trang)
   */
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8 pb-16 pt-6 px-4">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Tìm kiếm truyện</h1>
          <p className="text-muted-foreground">
            Khám phá hàng nghìn tác phẩm đặc sắc
          </p>
        </div>

        {/* Filter Area - Card chứa tất cả bộ lọc */}
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg space-y-4">
          {/* Search Input - ĐÃ XÓA NÚT X */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên truyện, tác giả..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-background/50 border-border/50 focus:border-primary transition-colors"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Lọc theo:</span>
            </div>

            {/* Tag Select - ĐÃ XÓA NÚT X */}
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-[200px] bg-background/50">
                <SelectValue
                  placeholder={loadingTags ? "Đang tải..." : "Thể loại"}
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

            {/* Sort By Select - ĐÃ XÓA NÚT X */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-background/50">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Newest">Mới nhất</SelectItem>
                <SelectItem value="WeeklyViews">Lượt xem tuần</SelectItem>
                <SelectItem value="TopRated">Đánh giá cao</SelectItem>
                <SelectItem value="MostChapters">Nhiều chương nhất</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Direction Select - ĐÃ XÓA NÚT X */}
            <Select
              value={sortDir || "default"}
              onValueChange={(value) =>
                setSortDir(value === "default" ? null : value)
              }
            >
              <SelectTrigger className="w-[130px] bg-background/50">
                <SelectValue placeholder="Thứ tự" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Mặc định</SelectItem>
                <SelectItem value="Desc">Giảm dần</SelectItem>
                <SelectItem value="Asc">Tăng dần</SelectItem>
              </SelectContent>
            </Select>
            {/* Language Dropdown */}
            <Select value={languageCode} onValueChange={setLanguageCode}>
              <SelectTrigger className="w-[150px] bg-background/50">
                <SelectValue placeholder="Ngôn ngữ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi ngôn ngữ</SelectItem>
                <SelectItem value="vi-VN">Tiếng Việt</SelectItem>
                <SelectItem value="en-US">Tiếng Anh</SelectItem>
                <SelectItem value="ja-JP">Tiếng Nhật</SelectItem>
                <SelectItem value="zh-CN">Tiếng Trung</SelectItem>
              </SelectContent>
            </Select>

            {/* Rating Filter - ĐÃ XÓA NÚT X */}
            <Select value={minAvgRating} onValueChange={setMinAvgRating}>
              <SelectTrigger className="w-[180px] bg-background/50">
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

          {/* Active Filters Section - Hiển thị các filter đang active */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
              <span className="text-sm font-medium text-muted-foreground">
                Đang lọc:
              </span>

              {/* Search query với X */}
              {query && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  "{query}"
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Ngăn event bubbling
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
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
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
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
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
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
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
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
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
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
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
              {languageCode !== "all" && (
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  {getLanguageDisplayName()}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLanguageCode("all");
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

        {/* Results Area */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {loading ? (
                "Đang tải..."
              ) : (
                <>
                  Kết quả{" "}
                  {data && (
                    <span className="text-primary">({data.total} truyện)</span>
                  )}
                </>
              )}
            </h2>

            {data && totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </p>
            )}
          </div>
          {/* Conditional Rendering: Error State */}
          {error ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-destructive" />
              </div>
              <p className="text-lg font-medium mb-2">Có lỗi xảy ra</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                {error}
              </p>
              <Button onClick={loadStories}>Thử lại</Button>
            </div>
          ) : loading ? (
            // Loading State
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang tìm kiếm...</p>
            </div>
          ) : data && data.items.length > 0 ? (
            // Success State: Có dữ liệu
            <>
              {/* Grid hiển thị Story Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                {data.items.map((story) => (
                  <StoryCard
                    key={story.storyId}
                    //story={story}
                    story={convertToStorySummary(story)}
                    onClick={() => handleStoryClick(story.storyId)}
                  />
                ))}
              </div>
              {/* Pagination Controls - Chỉ hiện khi có nhiều trang */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      {/* Previous Page Button */}
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={
                            page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        >
                          Trang trước
                        </PaginationPrevious>
                      </PaginationItem>
                      {/* Page Numbers với Smart Range Display */}
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          // Logic hiển thị 5 trang với current page ở giữa
                          if (totalPages <= 5) {
                            // Tổng ≤ 5 trang: hiển thị tất cả
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            // Ở đầu: hiển thị trang 1-5
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            // Ở đầu: hiển thị trang 1-5
                            pageNum = totalPages - 4 + i;
                          } else {
                            // Ở giữa: hiển thị current page ±2
                            pageNum = page - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setPage(pageNum)}
                                isActive={page === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}
                      {/* Next Page Button */}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          className={
                            page === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        >
                          Trang sau
                        </PaginationNext>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            // Empty State: Không có kết quả
            <div className="text-center py-20 border-2 border-dashed rounded-xl">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-2">Không tìm thấy kết quả</p>
              <p className="text-sm text-muted-foreground">
                Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
