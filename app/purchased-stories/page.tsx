//app/purchased-stories/page.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Headphones,
  Inbox,
  BookOpen,
  History,
  Copy,
  Receipt,
  CheckCircle2,
  Gem,
} from "lucide-react";
import {
  chapterPurchaseApi,
  StoryItem,
  ChapterPurchaseHistoryItem,
} from "@/services/chapterPurchaseService";
import { StorySection } from "@/components/purchased/StorySection";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Dùng toast báo copy mã

export default function PurchasedStoriesPage() {
  // --- STATE CHO AUDIO (CŨ) ---
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loadingAudio, setLoadingAudio] = useState(true);

  // --- STATE CHO LỊCH SỬ MUA CHƯƠNG (MỚI) ---
  const [historyItems, setHistoryItems] = useState<
    ChapterPurchaseHistoryItem[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // State chung
  const [activeTab, setActiveTab] = useState("audio"); // 'audio' | 'history'

  // --- PAGINATION CONFIG ---
  // Pagination Audio
  const [audioPage, setAudioPage] = useState(1);
  const audioPerPage = 5;

  // Pagination History
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 10;

  useEffect(() => {
    // Load cả 2 hoặc chỉ load khi tab active (ở đây load luôn cho tiện)
    loadAudioStories();
    loadChapterHistory();
  }, []);

  const handleApiError = (err: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic từ Backend
    if (err.response && err.response.data && err.response.data.error) {
      const { message, details } = err.response.data.error;

      // Ưu tiên Validation
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

  // 1. Gọi API lấy Audio
  const loadAudioStories = async () => {
    setLoadingAudio(true);
    try {
      const data = await chapterPurchaseApi.getAllVoiceHistory();
      setStories(data);
    } catch (err) {
      // CẬP NHẬT: thông báo Toast
      handleApiError(err, "Không thể tải danh sách Audio.");
      console.error("Error loading voice history:", err);
    } finally {
      setLoadingAudio(false);
    }
  };

  // 2. Gọi API lấy Lịch sử mua chương
  const loadChapterHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await chapterPurchaseApi.getChapterHistory();
      setHistoryItems(data);
    } catch (err) {
      //  CẬP NHẬT:  thông báo Toast
      handleApiError(err, "Không thể tải lịch sử giao dịch.");
      console.error("Error loading chapter history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- LOGIC PHÂN TRANG AUDIO ---
  const idxLastAudio = audioPage * audioPerPage;
  const idxFirstAudio = idxLastAudio - audioPerPage;
  const currentAudios = stories.slice(idxFirstAudio, idxLastAudio);
  const totalAudioPages = Math.ceil(stories.length / audioPerPage);
  const totalAudiosCount = stories.reduce(
    (sum, story) =>
      sum + story.chapters.reduce((chSum, ch) => chSum + ch.voices.length, 0),
    0
  );

  // --- LOGIC PHÂN TRANG HISTORY ---
  const idxLastHist = historyPage * historyPerPage;
  const idxFirstHist = idxLastHist - historyPerPage;
  const currentHistory = historyItems.slice(idxFirstHist, idxLastHist);
  const totalHistoryPages = Math.ceil(historyItems.length / historyPerPage);

  // Helper copy mã
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Đã sao chép mã giao dịch!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8 pb-16 pt-6 px-4">
        {/* Header Chung */}
        <div className="space-y-2 border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <div className="relative">
                {activeTab === "audio" ? (
                  <Headphones className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                ) : (
                  <History className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                )}
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Tủ Chương Của Tôi
              </h1>
              <p className="text-muted-foreground mt-1">
                Quản lý truyện audio và lịch sử giao dịch chương truyện.
              </p>
            </div>
          </div>
        </div>

        {/* TABS CONTROL */}
        <Tabs
          defaultValue="audio"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8">
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Headphones className="h-4 w-4" /> Kho Audio
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" /> Lịch sử Mua
            </TabsTrigger>
          </TabsList>

          {/* === TAB 1: KHO AUDIO  === */}
          <TabsContent value="audio" className="space-y-6">
            {loadingAudio ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Đang tải dữ liệu...</p>
              </div>
            ) : stories.length > 0 ? (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Bạn đang sở hữu {totalAudiosCount} bản thu âm.
                </p>
                {currentAudios.map((story) => (
                  <StorySection key={story.storyId} story={story} />
                ))}

                {/* Pagination Audio */}
                {totalAudioPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setAudioPage((p) => Math.max(p - 1, 1))
                            }
                            className={
                              audioPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <span className="px-4 text-sm font-medium">
                            Trang {audioPage} / {totalAudioPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setAudioPage((p) =>
                                Math.min(p + 1, totalAudioPages)
                              )
                            }
                            className={
                              audioPage === totalAudioPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-24 border-2 border-dashed border-border rounded-xl bg-muted/5">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Inbox className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground">
                  Chưa có audio nào
                </h3>
              </div>
            )}
          </TabsContent>

          {/* === TAB 2: LỊCH SỬ MUA CHƯƠNG  === */}
          <TabsContent value="history">
            <Card className="shadow-md border-t-4 border-t-blue-500 overflow-hidden">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>Danh sách chương đã mua</span>
                  {!loadingHistory && (
                    <Badge
                      variant="secondary"
                      className="font-normal bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      {historyItems.length} giao dịch
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">
                      Đang tải lịch sử...
                    </p>
                  </div>
                ) : historyItems.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-semibold">
                          <tr>
                            {/* Cột 1: Tên Truyện */}
                            <th className="px-6 py-4 w-[25%] min-w-[200px]">
                              Truyện
                            </th>
                            {/* Cột 2: Chương */}
                            <th className="px-4 py-4 w-[25%] min-w-[200px]">
                              Chương
                            </th>
                            {/* Cột 3: Giá Dias */}
                            <th className="px-4 py-4 w-[10%] min-w-[100px]">
                              Giá
                            </th>
                            {/* Cột 4: Mã Giao Dịch */}
                            <th className="px-4 py-4 w-[20%] min-w-[180px]">
                              Mã Giao Dịch
                            </th>
                            {/* Cột 5: Thời gian */}
                            <th className="px-6 py-4 w-[20%] min-w-[150px] text-right">
                              Thời gian
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {currentHistory.map((item) => (
                            <tr
                              key={item.purchaseId}
                              className="hover:bg-muted/30 transition-colors group"
                            >
                              {/* 1. Tên Truyện */}
                              <td className="px-6 py-4 align-middle">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg shrink-0">
                                    <BookOpen className="h-5 w-5" />
                                  </div>
                                  <span className="font-medium text-base text-foreground line-clamp-2">
                                    {item.storyTitle}
                                  </span>
                                </div>
                              </td>

                              {/* 2. Chương (Số + Tên) */}
                              <td className="px-4 py-4 align-middle">
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground">
                                    Chương {item.chapterNo}
                                  </span>
                                  <span className="text-muted-foreground text-xs line-clamp-1">
                                    {item.chapterTitle}
                                  </span>
                                </div>
                              </td>

                              {/* 3. Giá (Dias) */}
                              <td className="px-4 py-4 align-middle">
                                <Badge
                                  variant="outline"
                                  className="
      bg-yellow-50 text-yellow-700 border-yellow-200 
      dark:bg-yellow-900/20 dark:text-yellow-400 
      flex items-center gap-2 w-fit 
      px-3 py-1 text-base
    "
                                >
                                  {item.priceDias}
                                  {/* Tăng size icon lên h-5 w-5 (20px) */}
                                  <Gem className="h-7 w-7 fill-blue-500 text-blue-600" />
                                </Badge>
                              </td>

                              {/* 4. Mã Giao Dịch (Dàn ngang ở cột 4) */}
                              <td className="px-4 py-4 align-middle">
                                <div
                                  className="inline-flex items-center gap-2 bg-muted/60 px-2.5 py-1 rounded-md border border-border/60 group-hover:border-primary/30 group-hover:bg-background transition-colors cursor-pointer max-w-full"
                                  onClick={() =>
                                    handleCopyCode(item.purchaseId)
                                  }
                                  title="Nhấn để sao chép"
                                >
                                  <span className="font-mono font-medium text-xs text-muted-foreground truncate max-w-[120px]">
                                    {item.purchaseId}
                                  </span>
                                  <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </div>
                              </td>

                              {/* 5. Thời gian (Căn phải) */}
                              <td className="px-6 py-4 align-middle text-right">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="text-sm font-medium text-foreground">
                                    {new Date(
                                      item.purchasedAt
                                    ).toLocaleDateString("vi-VN")}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      item.purchasedAt
                                    ).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination History */}
                    {totalHistoryPages > 1 && (
                      <div className="py-4 border-t border-border/50 flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  setHistoryPage((p) => Math.max(1, p - 1))
                                }
                                className={
                                  historyPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                            <PaginationItem>
                              <span className="px-4 py-2 text-sm font-medium text-muted-foreground">
                                Trang {historyPage} / {totalHistoryPages}
                              </span>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setHistoryPage((p) =>
                                    Math.min(totalHistoryPages, p + 1)
                                  )
                                }
                                className={
                                  historyPage === totalHistoryPages
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 bg-muted/10">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Receipt className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">
                      Chưa có giao dịch nào
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Các chương truyện bạn mua bằng Dias sẽ xuất hiện tại đây.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
