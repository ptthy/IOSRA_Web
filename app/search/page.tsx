// app/search/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
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
} from "@/services/storyCatalog";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("Newest");
  const [sortDir, setSortDir] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<string>("all");
  const [minAvgRating, setMinAvgRating] = useState<string>("0");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<Story> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho dropdown tags
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

  // Debounce cho main search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 1) {
        loadStories();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, selectedTag, sortBy, sortDir, isPremium, minAvgRating]);

  useEffect(() => {
    loadStories();
  }, [page]);

  const loadStories = async () => {
    setLoading(true);
    setError(null);
    try {
      // LUÔN DÙNG ADVANCE FILTER - với parameters VIẾT HOA
      const params: AdvanceFilterParams = {
        Page: page,
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
      };

      console.log("🎯 Using ADVANCE filter with params:", params);
      const result = await storyCatalogApi.getAdvancedFilter(params);
      setData(result);
    } catch (error: any) {
      console.error("Error loading stories:", error);

      if (error.response?.data?.error?.details) {
        const errorDetails = error.response.data.error.details;
        const errorMessages = Object.values(errorDetails).flat().join(", ");
        setError(`Lỗi từ server: ${errorMessages}`);
      } else if (error.response?.data?.error?.message) {
        setError(`Lỗi từ server: ${error.response.data.error.message}`);
      } else if (error.response?.status === 400) {
        setError("Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.");
      } else {
        setError("Không thể tải danh sách truyện. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
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
    setPage(1);
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

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto space-y-8 pb-16 pt-6 px-4">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Tìm kiếm truyện</h1>
          <p className="text-muted-foreground">
            Khám phá hàng nghìn tác phẩm đặc sắc
          </p>
        </div>

        {/* Filter Area */}
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

            {/* Premium Filter - ĐÃ XÓA NÚT X */}
            <Select value={isPremium} onValueChange={setIsPremium}>
              <SelectTrigger className="w-[140px] bg-background/50">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Premium</SelectItem>
                <SelectItem value="false">Miễn phí</SelectItem>
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

          {/* Active Filters */}
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
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang tìm kiếm...</p>
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                {data.items.map((story) => (
                  <StoryCard
                    key={story.storyId}
                    story={story}
                    onClick={() => handleStoryClick(story.storyId)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <Pagination>
                    <PaginationContent>
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

                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
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
