//app/author/story/[id]/outline/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  ArrowLeft,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

// Định nghĩa types
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

const OUTLINE_STORAGE_KEY = "story_outlines";

export default function OutlineEditorPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [outline, setOutline] = useState<Outline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadOutline();
  }, [storyId]);

  const loadOutline = () => {
    setIsLoading(true);
    try {
      const storedOutlines = localStorage.getItem(OUTLINE_STORAGE_KEY);
      if (storedOutlines) {
        const outlines: Record<string, Outline> = JSON.parse(storedOutlines);
        const storyOutline = outlines[storyId];

        if (storyOutline) {
          setOutline(storyOutline);
          // Expand all sections by default
          setExpandedSections(
            new Set(storyOutline.sections.map((s) => s.sectionId))
          );
        } else {
          // Tạo outline mới nếu chưa có
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
          setExpandedSections(
            new Set(newOutline.sections.map((s) => s.sectionId))
          );
          saveOutlineToStorage(newOutline);
        }
      } else {
        // Tạo outline mới với dữ liệu mẫu
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
        setExpandedSections(
          new Set(newOutline.sections.map((s) => s.sectionId))
        );
        saveOutlineToStorage(newOutline);
      }
    } catch (error) {
      console.error("Error loading outline:", error);
      toast.error("Không thể tải dàn ý");
    } finally {
      setIsLoading(false);
    }
  };

  const saveOutlineToStorage = (outlineData: Outline) => {
    const storedOutlines = localStorage.getItem(OUTLINE_STORAGE_KEY);
    const outlines: Record<string, Outline> = storedOutlines
      ? JSON.parse(storedOutlines)
      : {};
    outlines[storyId] = outlineData;
    localStorage.setItem(OUTLINE_STORAGE_KEY, JSON.stringify(outlines));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleAddSection = () => {
    if (!editForm.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề phần");
      return;
    }

    setIsSaving(true);
    try {
      const newSection: OutlineSection = {
        sectionId: `section_${Date.now()}`,
        title: editForm.title,
        content: editForm.content,
        order: outline?.sections.length || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

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

      setEditForm({ title: "", content: "" });
      setEditingSection(null);

      toast.success("Đã thêm phần mới");
    } catch (error) {
      toast.error("Không thể thêm phần mới");
    } finally {
      setIsSaving(false);
    }
  };

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
    } catch (error) {
      toast.error("Không thể cập nhật");
    } finally {
      setIsSaving(false);
    }
  };

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
    } catch (error) {
      toast.error("Không thể xóa");
    }
  };

  const startEdit = (section: OutlineSection) => {
    setEditingSection(section.sectionId);
    setEditForm({ title: section.title, content: section.content });
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditForm({ title: "", content: "" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
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
        <h1 className="text-2xl">Dàn Ý Truyện</h1>
        <p className="text-sm text-muted-foreground">
          Lập dàn ý chi tiết giúp bạn viết truyện mạch lạc và không bị lạc hướng
        </p>
      </div>

      {/* Sections List */}
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
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move flex-shrink-0" />
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto hover:bg-transparent flex-shrink-0"
                      >
                        {expandedSections.has(section.sectionId) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>

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

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editingSection === section.sectionId ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateSection(section.sectionId)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3 mr-1" />
                          )}
                          Lưu
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          Hủy
                        </Button>
                      </>
                    ) : (
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
                          onClick={() => handleDeleteSection(section.sectionId)}
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

      {/* Add New Section */}
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
                setEditForm((prev) => ({ ...prev, content: e.target.value }))
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
        <Button
          variant="outline"
          className="w-full border-dashed border-2 h-12"
          onClick={() => setEditingSection("new")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm Phần Mới
        </Button>
      )}
    </div>
  );
}
