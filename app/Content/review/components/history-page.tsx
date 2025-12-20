// File: app/Content/review/components/history-page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Download,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Loader2,
  FileText,
  Info,
  BookOpen,
  FileType,
  Bot,
  Calendar,
  Globe,
  Tag,
  AlignLeft,
  Image as ImageIcon,
  Hash,
  Coins,
  Type,
  Mail,
  Gem
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import moment from "moment";
import "moment/locale/vi";
import { getModerationStories, getModerationChapters } from "@/services/moderationApi";

moment.locale("vi");

// Interface tổng hợp tất cả fields từ cả Story và Chapter
interface HistoryItem {
  id: string; // reviewId
  type: "story" | "chapter";
  
  // Common Fields
  title: string;       // Story: title | Chapter: chapterTitle
  subTitle?: string;   // Story: null  | Chapter: storyTitle
  author: string;      // authorUsername
  authorId: string;
  status: "pending" | "published" | "rejected";
  submittedAt: string;
  language: string;    // languageName
  
  // AI Fields
  aiScore?: number;
  aiResult?: string;
  aiFeedback?: string;
  
  // Story Specific Fields
  storyId?: string;
  description?: string;
  outline?: string;
  coverUrl?: string;
  lengthPlan?: string;
  tags?: { tagId: string; tagName: string }[];
  pendingNote?: string; // Lý do từ chối (thường ở story)

  // Chapter Specific Fields
  chapterId?: string;
  authorEmail?: string;
  chapterNo?: number;
  wordCount?: number;
  priceDias?: number;
  contentPath?: string;
}

export function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"story" | "chapter">("story");
  const [data, setData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTime, setFilterTime] = useState("7days");

  // Modal detail
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  // Helper: Màu sắc cho điểm AI
  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return "text-gray-500";
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 5) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // --- 1. Fetch Data Logic ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        let combined: HistoryItem[] = [];

        if (activeTab === "story") {
          // --- FETCH STORY ---
          const [published, rejected] = await Promise.all([
            getModerationStories("published"),
            getModerationStories("rejected"),
          ]);

          const mapStory = (list: any[]) =>
            list.map((item: any) => ({
              id: item.reviewId,
              type: "story" as const,
              
              // Common
              title: item.title,
              author: item.authorUsername,
              authorId: item.authorId,
              status: item.status,
              submittedAt: item.submittedAt,
              language: item.languageName,
              
              // Story Specific
              storyId: item.storyId,
              description: item.description,
              outline: item.outline,
              lengthPlan: item.lengthPlan,
              coverUrl: item.coverUrl,
              tags: item.tags,
              pendingNote: item.pendingNote,

              // AI
              aiScore: item.aiScore,
              aiResult: item.aiResult,
              aiFeedback: item.aiFeedback,
            }));

          combined = [...mapStory(published), ...mapStory(rejected)];

        } else {
          // --- FETCH CHAPTER ---
          const [published, rejected] = await Promise.all([
            getModerationChapters("published"),
            getModerationChapters("rejected"),
          ]);

          const mapChapter = (list: any[]) =>
            list.map((item: any) => ({
              id: item.reviewId,
              type: "chapter" as const,
              
              // Common
              title: item.chapterTitle, // Chapter title là chính
              subTitle: item.storyTitle, // Story title là phụ
              author: item.authorUsername,
              authorId: item.authorId,
              status: item.status,
              submittedAt: item.submittedAt,
              language: item.languageName,

              // Chapter Specific
              chapterId: item.chapterId,
              authorEmail: item.authorEmail,
              chapterNo: item.chapterNo,
              wordCount: item.wordCount,
              priceDias: item.priceDias,
              contentPath: item.contentPath,

              // AI
              aiScore: item.aiScore,
              aiResult: item.aiResult,
              aiFeedback: item.aiFeedback,
            }));

          combined = [...mapChapter(published), ...mapChapter(rejected)];
        }

        // Sort: Mới nhất lên đầu
        combined.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setData(combined);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // --- 2. Filter Logic ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Filter Status
      if (filterStatus !== "all") {
        if (filterStatus === "published" && item.status !== "published") return false;
        if (filterStatus === "rejected" && item.status !== "rejected") return false;
      }
      // Filter Time
      if (filterTime !== "all") {
        const itemDate = moment(item.submittedAt);
        const now = moment();
        if (filterTime === "today" && !itemDate.isSame(now, "day")) return false;
        if (filterTime === "7days" && itemDate.isBefore(now.subtract(7, "days"))) return false;
        if (filterTime === "30days" && itemDate.isBefore(now.subtract(30, "days"))) return false;
      }
      return true;
    });
  }, [data, filterStatus, filterTime]);

  // --- 3. Stats Calculation ---
  const stats = useMemo(() => {
    const total = filteredData.length;
    const published = filteredData.filter((i) => i.status === "published").length;
    const rejected = filteredData.filter((i) => i.status === "rejected").length;
    const rate = total > 0 ? ((published / total) * 100).toFixed(0) : 0;

    return [
      { label: "Tổng số mục", value: total, color: "text-[var(--foreground)]" },
      { label: "Đã duyệt", value: published, color: "text-green-600" },
      { label: "Đã từ chối", value: rejected, color: "text-red-600" },
      { label: "Tỷ lệ duyệt", value: `${rate}%`, color: "text-blue-600" },
    ];
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 transition-colors duration-300">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">Lịch Sử Kiểm Duyệt</h1>
        <p className="text-[var(--muted-foreground)]">Theo dõi các quyết định duyệt Truyện và Chương</p>
      </motion.div>

      {/* FILTER BAR */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center"
      >
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Toggle Type */}
          <div className="bg-[var(--card)] p-1 rounded-lg border border-[var(--border)] flex">
            <button
              onClick={() => setActiveTab("story")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                activeTab === "story" 
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm" 
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <BookOpen className="w-4 h-4" /> Truyện
            </button>
            <button
              onClick={() => setActiveTab("chapter")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                activeTab === "chapter" 
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm" 
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <FileType className="w-4 h-4" /> Chương
            </button>
          </div>

          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] bg-[var(--card)] border-[var(--border)] h-11">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--muted-foreground)]" />
                <SelectValue placeholder="Trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="published">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Đã từ chối </SelectItem>
            </SelectContent>
          </Select>

          {/* Time Filter */}
          <Select value={filterTime} onValueChange={setFilterTime}>
            <SelectTrigger className="w-[180px] bg-[var(--card)] border-[var(--border)] h-11">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
                <SelectValue placeholder="Thời gian" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="7days">7 ngày qua</SelectItem>
              <SelectItem value="30days">30 ngày qua</SelectItem>
              <SelectItem value="all">Tất cả thời gian</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8"
      >
        {stats.map((s, i) => (
          <Card key={i} className="p-5 border border-[var(--border)] bg-[var(--card)] rounded-xl shadow-sm">
            <p className={`text-3xl font-semibold mb-1 ${s.color}`}>{s.value}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{s.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Main Table */}
      <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)] rounded-xl shadow-sm">
        <Table className={cn("w-full text-sm", isLoading && "opacity-50 pointer-events-none")}>
          <TableHeader>
            <TableRow className="bg-[var(--muted)]/20">
              <TableHead className="py-4 px-6 w-[180px]">Thời gian</TableHead>
              <TableHead className="py-4 px-6 min-w-[250px]">
                {activeTab === "story" ? "Tên Truyện" : "Thông tin Chương"}
              </TableHead>
              <TableHead className="py-4 px-6">Tác giả</TableHead>
              <TableHead className="py-4 px-6 w-[160px]">Trạng thái / AI</TableHead>
              <TableHead className="py-4 px-6 text-right">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--primary)]" />
                  <p className="mt-2 text-[var(--muted-foreground)]">Đang tải dữ liệu {activeTab === "story" ? "truyện" : "chương"}...</p>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-red-600">
                  <AlertCircle className="w-8 h-8 mx-auto" />
                  <p className="mt-2">Lỗi: {error}</p>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-[var(--muted-foreground)]">
                  Không có dữ liệu trong khoảng thời gian này
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="border-b hover:bg-[var(--muted)]/20 transition">
                  <TableCell className="py-4 px-6 text-[var(--muted-foreground)]">
                    <div className="flex flex-col">
                      <span className="font-medium text-[var(--foreground)]">{moment(item.submittedAt).format("HH:mm")}</span>
                      <span className="text-xs">{moment(item.submittedAt).format("DD/MM/YYYY")}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-base line-clamp-1">{item.title}</span>
                      {item.type === "chapter" && (
                        <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Truyện: {item.subTitle}
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {item.language}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2 text-[var(--primary)]">
                      <User className="w-4 h-4" />
                      {item.author}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col items-start gap-1.5">
                      <Badge
                        className={cn(
                          "gap-2 border-0 px-3 py-1.5 w-fit",
                          item.status === "published" && "bg-green-100 text-green-700 hover:bg-green-200",
                          item.status === "rejected" && "bg-red-100 text-red-600 hover:bg-red-200"
                        )}
                      >
                        {item.status === "published" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {item.status === "published" ? "Đã duyệt" : "Từ chối"}
                      </Badge>
                      {item.aiScore !== undefined && (
                        <span className={cn("text-[10px] font-medium flex items-center gap-1", getScoreColor(item.aiScore))}>
                          <Bot className="w-3 h-3" /> AI: {item.aiScore}/10
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Info className="w-4 h-4 mr-1" /> Xem
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* --- MODAL CHI TIẾT (FULL FIELDS & CONDITIONAL RENDERING) --- */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] sm:max-w-[700px] p-0 overflow-hidden gap-0 flex flex-col max-h-[90vh]">
          
          <DialogHeader className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/10 shrink-0">
            <DialogTitle className={cn("flex items-center gap-2 text-xl", selectedItem?.status === 'rejected' ? "text-red-600" : "text-green-600")}>
              {selectedItem?.status === 'rejected' ? <XCircle className="w-6 h-6"/> : <CheckCircle2 className="w-6 h-6"/>}
              {selectedItem?.status === 'rejected' ? "Quyết định: Từ chối" : "Quyết định: Đã xuất bản"}
            </DialogTitle>
            <DialogDescription className="text-xs mt-1 font-mono flex gap-3">
              <span>ReviewID: {selectedItem?.id.slice(0, 8)}...</span>
              <span>•</span>
              <span className="uppercase">{selectedItem?.type}</span>
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="overflow-y-auto p-6 space-y-6">
                
                {/* 1. Phần Info Cơ bản */}
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Ảnh Bìa (CHỈ HIỂN THỊ CHO STORY) */}
                    {selectedItem.type === 'story' && (
                        selectedItem.coverUrl ? (
                          <div className="w-32 h-48 shrink-0 rounded-lg overflow-hidden border border-[var(--border)] shadow-sm bg-gray-100">
                            <img src={selectedItem.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-32 h-48 shrink-0 rounded-lg border border-[var(--border)] flex items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)]">
                            <ImageIcon className="w-8 h-8 opacity-50" />
                          </div>
                        )
                    )}

                    {/* Info Text Grid */}
                    <div className="flex-1 space-y-3 text-sm">
                        {/* Title */}
                        <div className="grid grid-cols-[110px_1fr] gap-2 items-baseline">
                            <span className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Tiêu đề</span>
                            <span className="font-semibold text-base text-[var(--primary)]">{selectedItem.title}</span>
                        </div>

                        {/* SubTitle (Chapter) */}
                        {selectedItem.type === 'chapter' && (
                          <div className="grid grid-cols-[110px_1fr] gap-2 items-baseline">
                              <span className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Truyện gốc</span>
                              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5"/> {selectedItem.subTitle}</span>
                          </div>
                        )}

                        {/* Author */}
                        <div className="grid grid-cols-[110px_1fr] gap-2 items-baseline">
                            <span className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Tác giả</span>
                            <div className="flex flex-col">
                                <span className="font-medium">@{selectedItem.author}</span>
                                {selectedItem.authorEmail && (
                                  <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                                    <Mail className="w-3 h-3"/> {selectedItem.authorEmail}
                                  </span>
                                )}
                            </div>
                        </div>

                        {/* Language */}
                        <div className="grid grid-cols-[110px_1fr] gap-2 items-baseline">
                            <span className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Ngôn ngữ</span>
                            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5"/> {selectedItem.language || "N/A"}</span>
                        </div>

                        {/* STORY SPECIFIC: Length Plan */}
                        {selectedItem.type === 'story' && selectedItem.lengthPlan && (
                          <div className="grid grid-cols-[110px_1fr] gap-2 items-baseline">
                              <span className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Độ dài</span>
                              <Badge variant="outline" className="w-fit capitalize">{selectedItem.lengthPlan.replace('_', ' ')}</Badge>
                          </div>
                        )}

                        {/* CHAPTER SPECIFIC: Stats (No, WordCount, Price) */}
                        {selectedItem.type === 'chapter' && (
                          <>
                            <div className="grid grid-cols-[110px_1fr] gap-2 items-baseline">
                                <span className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Chương số</span>
                                <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5"/> {selectedItem.chapterNo}</span>
                            </div>
                            <div className="grid grid-cols-[110px_1fr] gap-2 items-baseline">
                                <span className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Số từ</span>
                                <span className="flex items-center gap-1"><Type className="w-3.5 h-3.5"/> {selectedItem.wordCount} từ</span>
                            </div>
                            <div className="grid grid-cols-[110px_1fr] gap-2 items-baseline">
                                <span className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Giá chương</span>
                                <span className="flex items-center gap-1 text-yellow-600 font-medium">{selectedItem.priceDias} <Gem className="h-4 w-4 fill-blue-500 text-blue-600" /></span>
                            </div>
                          </>
                        )}

                        <div className="grid grid-cols-[110px_1fr] gap-2 items-baseline">
                            <span className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider">Ngày xử lý</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {moment(selectedItem.submittedAt).format("HH:mm - DD/MM/YYYY")}</span>
                        </div>
                        
                        {/* STORY SPECIFIC: Tags */}
                        {selectedItem.type === 'story' && selectedItem.tags && selectedItem.tags.length > 0 && (
                          <div className="grid grid-cols-[110px_1fr] gap-2 items-start mt-1">
                              <span className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider pt-1">Thể loại</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedItem.tags.map((t, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                                    <Tag className="w-2.5 h-2.5 mr-1"/> {t.tagName}
                                  </Badge>
                                ))}
                              </div>
                          </div>
                        )}
                    </div>
                </div>

                {/* 2. Phần AI Analysis (Chung cho cả 2) */}
                <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <div className="bg-[var(--muted)]/30 px-4 py-2 border-b border-[var(--border)] flex justify-between items-center">
                        <span className="font-semibold text-sm flex items-center gap-2">
                           <Bot className="w-4 h-4 text-purple-500"/> Phân tích AI
                        </span>
                        <div className="flex items-center gap-3">
                           {selectedItem.aiResult && (
                             <span className="text-xs text-[var(--muted-foreground)]">
                               Result: <span className="font-medium text-[var(--foreground)] uppercase">{selectedItem.aiResult}</span>
                             </span>
                           )}
                           <Badge variant="outline" className={cn("border-0 font-bold", getScoreColor(selectedItem.aiScore))}>
                              Score: {selectedItem.aiScore !== undefined ? selectedItem.aiScore : "N/A"}/10
                           </Badge>
                        </div>
                    </div>
                    <div className="p-4 bg-[var(--card)] text-sm whitespace-pre-line leading-relaxed max-h-[200px] overflow-y-auto">
                        {selectedItem.aiFeedback || "Không có phản hồi từ AI."}
                    </div>
                </div>

                {/* 3. Phần Nội dung chi tiết (STORY ONLY) */}
                {selectedItem.type === 'story' && (selectedItem.description || selectedItem.outline) && (
                  <div className="space-y-4">
                      {selectedItem.description && (
                        <div className="space-y-1">
                           <h4 className="text-xs uppercase text-[var(--muted-foreground)] font-semibold flex items-center gap-1">
                             <AlignLeft className="w-3 h-3"/> Mô tả (Description)
                           </h4>
                           <p className="text-sm bg-[var(--muted)]/10 p-3 rounded border border-[var(--border)] leading-relaxed">
                             {selectedItem.description}
                           </p>
                        </div>
                      )}
                      
                      {selectedItem.outline && (
                        <div className="space-y-1">
                           <h4 className="text-xs uppercase text-[var(--muted-foreground)] font-semibold flex items-center gap-1">
                             <FileText className="w-3 h-3"/> Dàn ý (Outline)
                           </h4>
                           <p className="text-sm bg-[var(--muted)]/10 p-3 rounded border border-[var(--border)] leading-relaxed whitespace-pre-line">
                             {selectedItem.outline}
                           </p>
                        </div>
                      )}
                  </div>
                )}

                {/* 4. Lý do từ chối thủ công (Nếu có) */}
                {selectedItem.pendingNote && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300 text-sm">
                      <div className="font-semibold mb-1 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4"/> Ghi chú kiểm duyệt:
                      </div>
                      <p className="pl-5.5">{selectedItem.pendingNote}</p>
                  </div>
                )}

            </div>
          )}
          
          {/* Footer */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--card)] shrink-0 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedItem(null)}>Đóng cửa sổ</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}