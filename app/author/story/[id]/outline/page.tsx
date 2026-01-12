//app/author/story/[id]/outline/page.tsx

/**
 * MỤC ĐÍCH:
 * - Cung cấp công cụ soạn thảo dàn ý chi tiết cho tác giả
 * - Giúp tác giả lên kế hoạch và cấu trúc truyện trước khi viết
 *
 * CHỨC NĂNG CHÍNH:
 * 1. Hiển thị thông tin truyện và dàn ý gốc (khi nộp)
 * 2. Editor dàn ý với sections có thể thu gọn/mở rộng
 * 3. CRUD sections: thêm, sửa, xóa sections
 * 4. Hai chế độ xem: editor (chỉnh sửa) và preview (xem trước)
 * 5. Lưu trữ dàn ý cục bộ trong localStorage
 *
 * ĐẶC ĐIỂM:
 * - Tạo template dàn ý mẫu với 3 sections cơ bản
 * - Collapsible sections với animation
 * - Tự động lưu vào localStorage
 * - Hiển thị dàn ý gốc từ hệ thống (khi tạo truyện)
 * - Thống kê thông tin truyện (ngày tạo, điểm AI, v.v.)
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  ArrowLeft,
  FileText,
  BookOpen,
  Eye,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { storyService } from "@/services/storyService";
import type { Story } from "@/services/apiTypes";

/**
 * INTERFACE ĐỊNH NGHĨA CẤU TRÚC DÀN Ý
 *
 * Mỗi section gồm:
 * - sectionId: unique identifier
 * - title: tiêu đề section
 * - content: nội dung chi tiết
 * - order: thứ tự hiển thị
 * - createdAt/updatedAt: timestamp
 *
 * Outline chứa:
 * - outlineId: ID của outline
 * - storyId: liên kết với truyện nào
 * - sections: mảng các section
 * - timestamps: created/updated
 */
interface OutlineSection {
  sectionId: string;
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Outline {
  outlineId: string;
  storyId: string;
  sections: OutlineSection[];
  createdAt: string;
  updatedAt: string;
}
// Key để lưu outline vào localStorage
const OUTLINE_STORAGE_KEY = "story_outlines";
/**
 * HÀM CHUYỂN ĐỔI lengthPlan TỪ CODE SANG LABEL TIẾNG VIỆT
 *
 * LOGIC:
 * - Map các giá trị lengthPlan từ API sang label hiển thị
 * - Dùng switch case để xử lý từng loại
 * - Fallback: "Chưa xác định" nếu không có hoặc không hợp lệ
 *
 * TẠI SAO CẦN HÀM NÀY:
 * - API trả về code (super_short, short, novel)
 * - UI cần hiển thị label tiếng Việt có nghĩa
 * - Đảm bảo consistency trong toàn ứng dụng
 */
const getLengthPlanLabel = (lengthPlan: string | undefined): string => {
  switch (lengthPlan) {
    case "super_short":
      return "Siêu ngắn (1-5 chương)";
    case "short":
      return "Ngắn (6-20 chương)";
    case "novel":
      return "Dài (trên 20 chương)";
    default:
      return "Chưa xác định";
  }
};

export default function OutlineEditorPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  // STATE QUẢN LÝ DỮ LIỆU VÀ TRẠNG THÁI
  const [story, setStory] = useState<Story | null>(null);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  ); // Set chứa ID của các section đang mở
  const [editingSection, setEditingSection] = useState<string | null>(null); // ID của section đang edit, hoặc "new" khi tạo mới
  const [editForm, setEditForm] = useState({ title: "", content: "" }); // Form data cho edit
  const [isSaving, setIsSaving] = useState(false); // Trạng thái đang lưu
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor"); // Chế độ xem: editor hoặc preview

  /**
   * HELPER FUNCTION XỬ LÝ LỖI API - GIỐNG CÁC FILE KHÁC
   *
   * LOGIC XỬ LÝ:
   * 1. Kiểm tra lỗi validation từ backend (details)
   * 2. Nếu có validation errors -> hiển thị lỗi đầu tiên
   * 3. Nếu có message từ backend -> hiển thị message đó
   * 4. Fallback: dùng message mặc định hoặc từ response
   *
   * TẠI SAO CẦN CONSISTENCY:
   * - Người dùng nhận được thông báo lỗi nhất quán
   * - Dễ debug và bảo trì code
   * - Xử lý được nhiều loại response error khác nhau
   */
  const handleApiError = (error: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic từ Backend
    if (error.response && error.response.data && error.response.data.error) {
      const { message, details } = error.response.data.error;

      // Ưu tiên Validation (details)
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          // Nối các lỗi lại thành 1 câu
          const msg = details[firstKey].join(" ");
          toast.error(msg);
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
    const fallbackMsg = error.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // -------------------
  /**
   * LOAD STORY VÀ OUTLINE KHI COMPONENT MOUNT
   *
   * FLOW XỬ LÝ:
   * 1. Gọi API lấy thông tin truyện (storyService.getStoryDetails)
   * 2. Load outline từ localStorage (nếu có)
   * 3. Nếu chưa có outline -> tạo outline mẫu
   * 4. Mở tất cả sections khi load xong (UX: cho người dùng thấy toàn bộ)
   *
   * TẠI SAO DÙNG LOCALSTORAGE:
   * - Outline là công cụ cá nhân của tác giả, chưa cần lưu server
   * - Tiết kiệm API calls: chỉ cần load từ local
   * - Cho phép tác giả làm việc offline
   */
  useEffect(() => {
    loadStoryAndOutline();
  }, [storyId]);

  const loadStoryAndOutline = async () => {
    setIsLoading(true);
    try {
      // 1. Load story từ API
      const storyData = await storyService.getStoryDetails(storyId);
      setStory(storyData);
      // 2. Load outline từ localStorage
      const storedOutlines = localStorage.getItem(OUTLINE_STORAGE_KEY);
      if (storedOutlines) {
        const outlines: Record<string, Outline> = JSON.parse(storedOutlines);
        const storyOutline = outlines[storyId];

        if (storyOutline) {
          // Nếu có outline đã lưu, set state và mở tất cả sections
          setOutline(storyOutline);
          setExpandedSections(
            new Set(storyOutline.sections.map((s) => s.sectionId))
          );
        } else {
          // Nếu chưa có outline cho story này, tạo mới
          createNewOutline();
        }
      } else {
        // Nếu chưa có outline nào trong localStorage, tạo mới
        createNewOutline();
      }
    } catch (error: any) {
      console.error("Error loading:", error);
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };
  /**
   * TẠO OUTLINE MẪU VỚI 3 SECTIONS CƠ BẢN
   *
   * CẤU TRÚC MẪU:
   * 1. Chủ đề & Góc độ: Setting cơ bản của truyện
   * 2. Bối cảnh câu chuyện: Thời gian, không gian
   * 3. Xây dựng nhân vật: Mô tả nhân vật chính
   *
   * TẠI SAO CẦN TEMPLATE:
   * - Hướng dẫn người dùng mới bắt đầu
   * - Cung cấp structure cơ bản, người dùng có thể chỉnh sửa
   * - Đảm bảo outline có đủ thông tin quan trọng
   */
  const createNewOutline = () => {
    const newOutline: Outline = {
      outlineId: `outline_${storyId}`,
      storyId,
      sections: [
        {
          sectionId: "section_1",
          title: "Chủ đề & Góc độ",
          content: "Trình yêu viết giai cấp, Ngôi thứ ba",
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          sectionId: "section_2",
          title: "Bối cảnh câu chuyện",
          content: "Thế kỷ 21, Hà Nội",
          order: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          sectionId: "section_3",
          title: "Xây dựng nhân vật",
          content:
            "Nữ chính: Lý Văn, 19 tuổi, là cô sinh viên nhỏ của nhà giàu có công ty gắn liền với tên...",
          order: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOutline(newOutline);
    setExpandedSections(new Set(newOutline.sections.map((s) => s.sectionId)));
    saveOutlineToStorage(newOutline);
  };
  /**
   * LƯU OUTLINE VÀO LOCALSTORAGE
   *
   * CẤU TRÚC DỮ LIỆU:
   * {
   *   "storyId1": {outline1},
   *   "storyId2": {outline2},
   *   ...
   * }
   *
   * LOGIC XỬ LÝ:
   * 1. Lấy toàn bộ outlines hiện có từ localStorage
   * 2. Merge outline mới vào object
   * 3. Lưu lại toàn bộ object
   *
   * TẠI SAO DÙNG RECORD STRUCTURE:
   * - Dễ query: outlines[storyId]
   * - Hiệu suất: chỉ cần parse/serialize 1 lần
   * - Quản lý được nhiều outlines cho nhiều truyện
   */
  const saveOutlineToStorage = (outlineData: Outline) => {
    const storedOutlines = localStorage.getItem(OUTLINE_STORAGE_KEY);
    const outlines: Record<string, Outline> = storedOutlines
      ? JSON.parse(storedOutlines)
      : {};
    outlines[storyId] = outlineData;
    localStorage.setItem(OUTLINE_STORAGE_KEY, JSON.stringify(outlines));
  };
  /**
   * TOGGLE MỞ/ĐÓNG SECTION (COLLAPSIBLE)
   *
   * LOGIC XỬ LÝ:
   * 1. Dùng Set để lưu trữ ID của các section đang mở
   * 2. Kiểm tra nếu sectionId đã có trong Set -> xóa (đóng)
   * 3. Nếu chưa có -> thêm vào (mở)
   * 4. Luôn tạo Set mới để trigger React re-render
   *
   * TẠI SAO DÙNG SET:
   * - Đảm bảo không có duplicate
   * - O(1) cho thao tác add/delete/check
   * - Dễ dàng convert sang Array nếu cần
   */
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId); // Đóng nếu đang mở
      } else {
        newSet.add(sectionId); // Mở nếu đang đóng
      }
      return newSet;
    });
  };

  /**
   * THÊM SECTION MỚI VÀO OUTLINE
   *
   * FLOW XỬ LÝ:
   * 1. Validate: tiêu đề không được rỗng
   * 2. Tạo section mới với ID unique từ timestamp
   * 3. Thêm vào mảng sections (cuối mảng)
   * 4. Cập nhật state và localStorage
   * 5. Reset form và thoát edit mode
   *
   * TẠI SAO DÙNG TIMESTAMP CHO ID:
   * - Đảm bảo unique trong client-side
   * - Không cần phải generate UUID phức tạp
   * - Có thể sắp xếp theo thời gian tạo nếu cần
   */
  const handleAddSection = () => {
    if (!editForm.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề phần");
      return;
    }

    setIsSaving(true);
    try {
      const newSection: OutlineSection = {
        sectionId: `section_${Date.now()}`, // Tạo ID unique từ timestamp
        title: editForm.title,
        content: editForm.content,
        order: outline?.sections.length || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Tạo outline mới hoặc update outline hiện tại
      const updatedOutline = outline
        ? {
            ...outline,
            sections: [...outline.sections, newSection],
            updatedAt: new Date().toISOString(),
          }
        : {
            outlineId: `outline_${storyId}`,
            storyId,
            sections: [newSection],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

      setOutline(updatedOutline);
      saveOutlineToStorage(updatedOutline);
      setEditForm({ title: "", content: "" }); // Reset form
      setEditingSection(null); // Thoát mode edit
      toast.success("Đã thêm phần mới");
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể thêm phần mới.");
    } finally {
      setIsSaving(false);
    }
  };
  /**
   * CẬP NHẬT SECTION HIỆN CÓ
   *
   * FLOW XỬ LÝ:
   * 1. Validate: tiêu đề không được rỗng
   * 2. Map qua mảng sections, tìm section cần update
   * 3. Cập nhật title, content và updatedAt
   * 4. Cập nhật state và localStorage
   * 5. Reset form và thoát edit mode
   *
   * TẠI SAO DÙNG MAP THAY VÌ TÌM INDEX:
   * - Map tạo array mới, đảm bảo immutability
   * - Dễ đọc và maintain hơn việc tìm index rồi thay đổi
   * - Phù hợp với React philosophy
   */
  const handleUpdateSection = (sectionId: string) => {
    if (!editForm.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề phần");
      return;
    }

    setIsSaving(true);
    try {
      const updatedSections =
        outline?.sections.map((section) =>
          section.sectionId === sectionId
            ? {
                ...section,
                title: editForm.title,
                content: editForm.content,
                updatedAt: new Date().toISOString(),
              }
            : section
        ) || [];

      const updatedOutline = outline
        ? {
            ...outline,
            sections: updatedSections,
            updatedAt: new Date().toISOString(),
          }
        : null;

      if (updatedOutline) {
        setOutline(updatedOutline);
        saveOutlineToStorage(updatedOutline);
      }

      setEditForm({ title: "", content: "" });
      setEditingSection(null);
      toast.success("Đã cập nhật");
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể cập nhật nội dung.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * XÓA SECTION VỚI CONFIRMATION DIALOG
   *
   * FLOW XỬ LÝ:
   * 1. Hiển thị confirm dialog (built-in browser confirm)
   * 2. Nếu user confirm -> filter ra sections không chứa section cần xóa
   * 3. Cập nhật state và localStorage
   *
   * TẠI SAO CẦN CONFIRMATION:
   * - Ngăn người dùng xóa nhầm
   * - UX tốt hơn: cho phép cancel trước khi xóa
   * - Quan trọng với dữ liệu người dùng tự tạo
   */
  const handleDeleteSection = (sectionId: string) => {
    if (!confirm("Bạn có chắc muốn xóa phần này?")) return;

    try {
      const updatedSections =
        outline?.sections.filter(
          (section) => section.sectionId !== sectionId
        ) || [];
      const updatedOutline = outline
        ? {
            ...outline,
            sections: updatedSections,
            updatedAt: new Date().toISOString(),
          }
        : null;

      if (updatedOutline) {
        setOutline(updatedOutline);
        saveOutlineToStorage(updatedOutline);
      }
      toast.success("Đã xóa phần");
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể xóa phần này.");
    }
  };
  /**
   * BẮT ĐẦU EDIT MODE CHO MỘT SECTION
   *
   * LOGIC XỬ LÝ:
   * 1. Set editingSection = section.sectionId
   * 2. Copy dữ liệu hiện tại của section vào editForm
   *
   * TẠI SAO COPY DỮ LIỆU VÀO STATE RIÊNG:
   * - Cho phép user chỉnh sửa mà không ảnh hưởng đến dữ liệu gốc
   * - Có thể cancel mà không mất dữ liệu
   * - Dễ validate trước khi lưu
   */
  const startEdit = (section: OutlineSection) => {
    setEditingSection(section.sectionId);
    setEditForm({ title: section.title, content: section.content });
  };
  /**
   * HỦY EDIT MODE
   *
   * LOGIC XỬ LÝ:
   * 1. Set editingSection = null
   * 2. Reset editForm về rỗng
   *
   * TẠI SAO CẦN HỦY EDIT:
   * - Cho phép user cancel thao tác chỉnh sửa
   * - Reset UI về trạng thái ban đầu
   * - Ngăn state bị "mắc kẹt" trong edit mode
   */
  const cancelEdit = () => {
    setEditingSection(null);
    setEditForm({ title: "", content: "" });
  };
  /**
   * KẾT HỢP TẤT CẢ SECTIONS THÀNH MỘT VĂN BẢN MARKDOWN
   *
   * LOGIC XỬ LÝ:
   * 1. Map qua từng section
   * 2. Format: ## Tiêu đề\n\nNội dung
   * 3. Join với \n\n (2 newlines) giữa các section
   *
   * TẠI SAO DÙNG MARKDOWN FORMAT:
   * - Dễ đọc trong preview mode
   * - Có thể convert sang HTML nếu cần
   * - Chuẩn phổ biến cho văn bản có cấu trúc
   */
  const getCombinedOutline = () => {
    if (!outline) return "";
    return outline.sections
      .map((section) => `## ${section.title}\n\n${section.content}`)
      .join("\n\n");
  };
  // Hiển thị loading spinner khi đang tải dữ liệu
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  // Hiển thị thông báo nếu không tìm thấy truyện
  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <BookOpen className="h-16 w-16 mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">Không tìm thấy truyện</p>
        <Button
          onClick={() => router.push(`/author/story/${storyId}/chapters`)}
        >
          Quay lại
        </Button>
      </div>
    );
  }
  // Render UI chính
  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/author/story/${storyId}/chapters`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại Chi Tiết Truyện
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dàn Ý Truyện</h1>
            <p className="text-sm text-muted-foreground">
              Lập dàn ý chi tiết giúp bạn viết truyện mạch lạc và không bị lạc
              hướng
            </p>
          </div>
          <div className="flex gap-2"></div>
        </div>
      </div>

      {/* Story Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Story Metadata */}
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-lg font-semibold">{story.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {story.lengthPlan && (
                    <Badge variant="secondary">
                      {getLengthPlanLabel(story.lengthPlan)}
                    </Badge>
                  )}
                  {story.isPremium && (
                    <Badge
                      variant="default"
                      className="bg-amber-500 text-white"
                    >
                      Premium
                    </Badge>
                  )}
                </div>
              </div>
              {/* Tags */}
              {story.tags && story.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-bold">
                    Thể loại
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {story.tags.map((tag) => (
                      <Badge
                        key={tag.tagId}
                        variant="outline"
                        className="text-xs"
                      >
                        {tag.tagName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Original Outline từ hệ thống */}
              {story.outline && (
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Dàn ý lúc nộp cho hệ thống
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div className="whitespace-pre-line text-sm leading-relaxed bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          {story.outline}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EDITOR MODE - Giao diện chỉnh sửa */}
      {viewMode === "editor" && (
        <>
          {/* Danh sách sections */}
          <div className="space-y-4">
            {outline?.sections.map((section, index) => (
              <Card
                key={section.sectionId}
                className="border-l-4 border-l-primary/40"
              >
                <Collapsible
                  open={expandedSections.has(section.sectionId)}
                  onOpenChange={() => toggleSection(section.sectionId)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Drag handle (visual only) */}
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move flex-shrink-0" />
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto hover:bg-transparent flex-shrink-0"
                          >
                            {" "}
                            {/* Icon mở/đóng */}
                            {expandedSections.has(section.sectionId) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        {/* Hiển thị tiêu đề hoặc input edit */}
                        {editingSection === section.sectionId ? (
                          <Input
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            placeholder="Tiêu đề phần"
                            className="flex-1"
                          />
                        ) : (
                          <h3 className="flex-1 min-w-0 truncate">
                            {section.title}
                          </h3>
                        )}
                      </div>
                      {/* Action buttons: Edit/Save hoặc Delete */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {editingSection === section.sectionId ? (
                          // Edit mode: Save và Cancel buttons
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateSection(section.sectionId)
                              }
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3 mr-1" />
                              )}
                              Lưu
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                            >
                              Hủy
                            </Button>
                          </>
                        ) : (
                          // View mode: Edit và Delete buttons
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(section)}
                            >
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleDeleteSection(section.sectionId)
                              }
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {/* Hiển thị nội dung hoặc textarea edit */}
                      {editingSection === section.sectionId ? (
                        <Textarea
                          value={editForm.content}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                          placeholder="Nội dung chi tiết..."
                          className="min-h-[120px]"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-md">
                          {section.content || (
                            <span className="italic opacity-60">
                              Chưa có nội dung
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>

          {/* Form thêm section mới */}
          {editingSection === "new" ? (
            <Card className="border-dashed border-2 border-primary/30">
              <CardHeader className="space-y-3">
                <Input
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Tiêu đề phần mới (VD: Chủ đề & Góc độ)"
                />
                <Textarea
                  value={editForm.content}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Nội dung chi tiết..."
                  className="min-h-[120px]"
                />
              </CardHeader>
              <CardContent className="flex gap-2 pt-0">
                <Button onClick={handleAddSection} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu Phần Mới
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  Hủy
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Button để bắt đầu tạo section mới
            <Button
              variant="outline"
              className="w-full border-dashed border-2 h-12"
              onClick={() => setEditingSection("new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm Phần Mới
            </Button>
          )}
        </>
      )}

      {/* PREVIEW MODE - Xem trước dàn ý */}
      {viewMode === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Đề cương chi tiết (Xem trước)
            </CardTitle>
            <CardDescription>
              Đây là cách độc giả sẽ nhìn thấy đề cương của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 p-6 rounded-lg">
                {getCombinedOutline() || "Chưa có nội dung đề cương"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin truyện</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-bold">
                Ngày tạo
              </p>
              <p>{new Date(story.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-bold">
                Cập nhật
              </p>
              <p>{new Date(story.updatedAt).toLocaleDateString("vi-VN")}</p>
            </div>
            {story.aiScore !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-bold">
                  Điểm AI
                </p>
                <p className="font-semibold text-primary">
                  {story.aiScore != null
                    ? `${Number(story.aiScore).toFixed(1)} / 10.0`
                    : "- / 10.0"}
                </p>
              </div>
            )}
            {story.publishedAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-bold">
                  Xuất bản
                </p>
                <p>{new Date(story.publishedAt).toLocaleDateString("vi-VN")}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
