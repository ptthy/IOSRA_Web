// File: app/Content/moderation/components/report-action-modal.tsx
"use client";

import { useState, useEffect } from "react"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, EyeOff, CheckCircle, XCircle, AlertTriangle, BookOpen, MessageSquare, FileText, User, UserX, Eye, Gem, Globe } from "lucide-react";
import { toast } from "sonner";
import { 
    updateReportStatus, 
    updateContentStatus,
    updateAccountStrikeStatus 
} from "@/services/moderationApi";

// ... (Giữ nguyên phần constants và interfaces như cũ) ...
const R2_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev";

// ... (Giữ nguyên các Interface StoryDetails, ChapterDetails, v.v...) ...

interface StoryDetails {
  storyId: string;
  title: string;
  description: string;
  coverUrl: string;
  authorUsername: string;
  status: string;
}

interface ChapterDetails {
  chapterId: string;
  title: string;
  chapterNo: number;
  accessType: "free" | "dias";
  priceDias: number;
  languageCode?: string;
  languageName?: string;
  contentPath?: string; 
  authorUsername?: string;
  authorId?: string;
}

interface CommentDetails {
  commentId: string;
  content: string;
  readerUsername: string;
  createdAt: string;
}

interface ReportItem {
  reportId: string;
  targetType: "story" | "chapter" | "comment" | string;
  targetId: string;
  targetAccountId: string; 
  reason: string;
  details: string;
  status: "pending" | "resolved" | "rejected" | string;
  reporterId: string;
  reporterUsername?: string;
  createdAt: string;
  story?: StoryDetails | null;
  chapter?: ChapterDetails | null;
  comment?: CommentDetails | null;
}

interface ReportActionModalProps {
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ... (Giữ nguyên các hàm utils: calculateBanDate, reasonMapping) ...

const calculateBanDate = (level: string): string => {
    const l = parseInt(level);
    if (l === 0 || l === 4) return ""; 
    const now = new Date();
    let daysToAdd = 0;
    switch (l) {
        case 1: daysToAdd = 1; break; 
        case 2: daysToAdd = 3; break; 
        case 3: daysToAdd = 30; break; 
        default: daysToAdd = 0;
    }
    if (daysToAdd > 0) {
        now.setDate(now.getDate() + daysToAdd);
        return now.toISOString().split('T')[0];
    }
    return "";
};

const reasonMapping: Record<string, string> = {
  spam: "Nội dung rác",
  negative_content: "Nội dung tiêu cực/xúc phạm",
  misinformation: "Thông tin sai lệch",
  ip_infringement: "Vi phạm bản quyền",
};

// ================= MAIN COMPONENT =================

export function ReportActionModal({ report, isOpen, onClose, onSuccess }: ReportActionModalProps) {
  const [loading, setLoading] = useState(false);
  const [strikeLevel, setStrikeLevel] = useState<string>("0"); 
  const [banDate, setBanDate] = useState<string>(""); 
  const [hideContent, setHideContent] = useState(true); 

  // State cho việc đọc nội dung chương
  const [chapterText, setChapterText] = useState<string>("");
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [showChapterContent, setShowChapterContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setChapterText("");
        setShowChapterContent(false);
        setStrikeLevel("0");
        setHideContent(true);
    }
  }, [isOpen, report]);

  useEffect(() => {
    if (strikeLevel === "0" || strikeLevel === "4") {
        setBanDate("");
        return;
    }
    const calculatedDate = calculateBanDate(strikeLevel);
    setBanDate(calculatedDate);
  }, [strikeLevel]);

  const fetchChapterContent = async () => {
    if (!report?.chapter?.contentPath) {
        toast.error("Không tìm thấy đường dẫn nội dung chương.");
        return;
    }
    setIsLoadingChapter(true);
    setShowChapterContent(true); 
    try {
        let fileUrl = report.chapter.contentPath;
        if (!fileUrl.startsWith("http")) {
            const cleanPath = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
            fileUrl = `${R2_BASE_URL}/${cleanPath}`;
        }
        fileUrl += `?t=${new Date().getTime()}`;
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Lỗi tải file từ server lưu trữ.");
        const text = await response.text();
        setChapterText(text);
    } catch (error: any) {
        setChapterText(`Không thể tải nội dung. Lỗi: ${error.message}`);
    } finally {
        setIsLoadingChapter(false);
    }
  };

  if (!report) return null;

  // ✨ CHANGE: Xác định xem báo cáo có đang chờ xử lý hay không
  const isPending = report.status === 'pending';

  const reportedTargetName = 
      report.story?.authorUsername || 
      report.chapter?.authorUsername || 
      report.comment?.readerUsername || 
      "User ID: " + report.targetAccountId;

  const renderContentPreview = () => {
    // ... (Giữ nguyên logic render content preview như cũ) ...
    if (report.targetType === 'story' && report.story) {
        return (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2 space-y-2">
                <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600 mt-1 shrink-0"/>
                    <div>
                        <h5 className="font-bold text-slate-800 text-base">{report.story.title}</h5>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                            <User className="w-3 h-3"/> Tác giả: <span className="font-medium text-slate-700">{report.story.authorUsername}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-3 rounded border border-slate-100 text-sm text-slate-600 italic">
                    "{report.story.description}"
                </div>
            </div>
        );
    }
    if (report.targetType === 'chapter' && report.chapter) {
        return (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
                <div className="flex flex-col gap-3 mb-3">
                    <div>
                        <h5 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                            <FileText className="w-5 h-5 text-purple-600"/> 
                            {report.chapter.title || "Chương không tiêu đề"}
                        </h5>
                        <div className="text-sm text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                            <span className="bg-slate-200 px-2 py-0.5 rounded text-xs font-bold text-slate-700">Chương {report.chapter.chapterNo}</span>
                            {report.chapter.authorUsername && (
                                <span className="flex items-center gap-1 text-xs"><User className="w-3 h-3"/> {report.chapter.authorUsername}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap border-t border-slate-200 pt-2">
                        {report.chapter.languageName && (
                            <Badge variant="outline" className="flex items-center gap-1 font-normal text-slate-600 bg-white">
                                <Globe className="w-3 h-3" />
                                {report.chapter.languageName}
                                {report.chapter.languageCode && <span className="text-xs text-slate-400 ml-1">({report.chapter.languageCode})</span>}
                            </Badge>
                        )}
                        {report.chapter.accessType === "free" ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Miễn phí</Badge>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">Tính phí</Badge>
                                {report.chapter.priceDias !== undefined && (
                                    <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-blue-100 shadow-sm">
                                        <span className="font-bold text-sm text-slate-700">{report.chapter.priceDias}</span>
                                        <Gem className="h-4 w-4 text-blue-500 fill-blue-500 opacity-80" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {!showChapterContent ? (
                    <Button onClick={fetchChapterContent} variant="secondary" size="sm" className="w-full border border-slate-300 hover:bg-slate-100">
                        <Eye className="w-4 h-4 mr-2"/> Xem nội dung chương này
                    </Button>
                ) : (
                    <div className="mt-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Nội dung văn bản</span>
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowChapterContent(false)}>Thu gọn</Button>
                        </div>
                        <div className="bg-white p-4 rounded-md border border-slate-300 min-h-[150px] max-h-[300px] overflow-y-auto">
                            {isLoadingChapter ? (
                                <div className="flex flex-col items-center justify-center h-24 text-slate-400">
                                    <Loader2 className="w-6 h-6 animate-spin mb-2"/>
                                    <p className="text-xs">Đang tải từ R2 Storage...</p>
                                </div>
                            ) : (
                                <article className="prose prose-sm max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                                    {chapterText ? <div dangerouslySetInnerHTML={{ __html: chapterText }} /> : <span className="italic text-gray-400">Không có nội dung hoặc file rỗng.</span>}
                                </article>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }
    if (report.targetType === 'comment' && report.comment) {
        return (
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
                 <h5 className="font-bold text-slate-800 flex items-center gap-2 mb-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-green-600"/> Bình luận vi phạm
                </h5>
                <div className="bg-white p-3 rounded border border-red-100 shadow-sm bg-red-50/30">
                    <p className="text-slate-900 font-medium">"{report.comment.content}"</p>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                         <User className="w-3 h-3"/> Người đăng: <span className="font-semibold text-slate-700">{report.comment.readerUsername}</span>
                    </span>
                    <span>{new Date(report.comment.createdAt).toLocaleString('vi-VN')}</span>
                </div>
            </div>
        );
    }
    return <p className="text-sm text-gray-500 italic mt-2">Không tải được chi tiết nội dung.</p>;
  };

  const handleContentStatusChange = async (targetType: string, targetId: string) => {
    const apiStatus = (targetType === 'comment' ? 'hidden' : 'hidden'); 
    await updateContentStatus(targetType as 'story' | 'chapter' | 'comment', targetId, apiStatus as any);
  };
  
  const handleResolve = async () => {
    // ... (Giữ nguyên logic xử lý)
    const level = parseInt(strikeLevel);
    if (!confirm("Xác nhận báo cáo ĐÚNG?")) return;
    setLoading(true);
    try {
        if (hideContent) await handleContentStatusChange(report.targetType, report.targetId);
        if (level > 0 && report.targetAccountId) await updateAccountStrikeStatus(report.targetAccountId, level as 1|2|3|4);
        await updateReportStatus(report.reportId, "resolved", {
            strike: level,
            restrictedUntil: banDate ? new Date(banDate + 'T23:59:59').toISOString() : null 
        });
        toast.success("Đã xử lý xong.");
        onSuccess();
        onClose();
    } catch (error: any) {
        toast.error(error.message || "Lỗi xử lý báo cáo.");
    } finally {
        setLoading(false);
    }
  };

  const handleReject = async () => {
    // ... (Giữ nguyên logic từ chối)
    if (!confirm("Xác nhận báo cáo SAI/SPAM?")) return;
    setLoading(true);
    try {
      await updateReportStatus(report.reportId, 'rejected');
      toast.success("Đã từ chối báo cáo.");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết Báo cáo Vi phạm</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* 1. THÔNG TIN NGƯỜI DÙNG & LÝ DO */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Người báo cáo */}
            <div className="bg-blue-50/50 p-3 rounded border border-blue-100">
                <span className="text-xs text-blue-600 font-semibold uppercase block mb-1">Tài khoản báo cáo</span>
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500"/>
                    <span className="font-medium text-slate-800">{report.reporterUsername || report.reporterId}</span>
                </div>
                <div className="mt-2 text-xs text-slate-500 italic border-t border-blue-100 pt-1">
                    "{report.details || 'Không có mô tả thêm'}"
                </div>
            </div>

            {/* Người bị báo cáo */}
            <div className="bg-red-50/50 p-3 rounded border border-red-100">
                <span className="text-xs text-red-600 font-semibold uppercase block mb-1">Tài khoản bị báo cáo </span>
                <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-500"/>
                    <span className="font-medium text-slate-800 truncate" title={reportedTargetName}>
                        {reportedTargetName}
                    </span>
                </div>
                 <div className="mt-2 text-xs text-slate-500 border-t border-red-100 pt-1">
                    Lý do: <span className="font-semibold text-red-600">{reasonMapping[report.reason] || report.reason}</span>
                </div>
            </div>
          </div>

          {/* 2. CHI TIẾT NỘI DUNG (STORY / CHAPTER / COMMENT) */}
          <div className="border-t pt-4">
               <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                   <EyeOff className="w-4 h-4"/> Nội dung Bị báo cáo
               </h4>
               {renderContentPreview()}
          </div>

          {/* 3. FORM XỬ LÝ (ACTION) - ✨ CHANGE: Chỉ hiện khi trạng thái là pending */}
          {isPending && (
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600"/> Quyết định Xử phạt
                </h4>
                
                <div className="flex items-center space-x-2 mb-4 bg-white p-2 rounded border border-slate-200">
                    <input 
                      type="checkbox"
                      id="hide-content"
                      checked={hideContent}
                      onChange={(e) => setHideContent(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                      disabled={loading}
                    />
                    <Label htmlFor="hide-content" className="text-sm font-medium cursor-pointer">
                      Ẩn/Gỡ nội dung này khỏi hệ thống
                    </Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase text-slate-500">Mức phạt (Strike)</Label>
                        <Select value={strikeLevel} onValueChange={setStrikeLevel} disabled={loading}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Chọn mức phạt" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Không Strike (Chỉ cảnh cáo/ẩn)</SelectItem>
                                <SelectItem value="1">Level 1 (Hạn chế 1 ngày)</SelectItem>
                                <SelectItem value="2">Level 2 (Hạn chế 3 ngày)</SelectItem>
                                <SelectItem value="3">Level 3 (Hạn chế 30 ngày)</SelectItem>
                                <SelectItem value="4">Level 4 (Cấm Vĩnh viễn)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase text-slate-500">Hạn chế đến ngày</Label>
                        <Input 
                            type="date" 
                            value={banDate} 
                            onChange={(e) => setBanDate(e.target.value)}
                            disabled={loading || strikeLevel === "0" || strikeLevel === "4"}
                            className="bg-white"
                        />
                    </div>
                </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between border-t pt-4 bg-slate-50 -mx-6 -mb-6 px-6 py-4 mt-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Đóng
          </Button>
          
          {/* ✨ CHANGE: Chỉ hiện các nút xử lý khi trạng thái là pending */}
          {isPending && (
            <div className="flex gap-2">
                <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                onClick={handleReject}
                disabled={loading}
                >
                <XCircle className="w-4 h-4 mr-2" />
                Báo cáo Sai
                </Button>
                <Button
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                onClick={handleResolve}
                disabled={loading}
                >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Báo cáo đúng
                </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}