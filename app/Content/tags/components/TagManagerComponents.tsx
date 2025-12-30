"use client";

import React, { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"; // Nếu không dùng shadcn table thì sửa lại thành thẻ <table> html thường
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertCircle, BookOpen, X, Save, Plus, Loader2 } from "lucide-react";
import { TagPagedItem } from "@/services/tagService";
import { toast } from "sonner";

// ==========================================
// COMPONENT 1: TAG TABLE (Bảng hiển thị)
// ==========================================

interface TagTableProps {
  tags: TagPagedItem[];
  isLoading: boolean;
  error: string | null;
  onEdit: (tag: TagPagedItem) => void;
  onDelete: (tag: TagPagedItem) => void;
}

export function TagTable({ tags, isLoading, error, onEdit, onDelete }: TagTableProps) {
  // 1. Loading State
  if (isLoading) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-8 w-1/3 bg-[var(--muted)] animate-pulse rounded" />
            <div className="h-8 w-1/4 bg-[var(--muted)] animate-pulse rounded" />
            <div className="h-8 w-20 bg-[var(--muted)] animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-md border border-red-200 bg-red-50 text-red-600">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p className="font-medium">Không thể tải danh sách thể loại</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  // 3. Empty State
  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-md border border-dashed border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]">
        <BookOpen className="w-12 h-12 mb-3 opacity-20" />
        <h3 className="text-lg font-medium text-[var(--foreground)]">Chưa có thể loại nào</h3>
        <p>Hãy thêm thể loại mới để bắt đầu quản lý.</p>
      </div>
    );
  }

  // 4. Data Table
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[var(--muted-foreground)] uppercase bg-[var(--muted)]/50 border-b border-[var(--border)]">
            <tr>
              <th className="px-6 py-4 font-medium">Tên thể loại</th>
              <th className="px-6 py-4 font-medium text-center">Sử dụng</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {tags.map((tag) => (
              <tr key={tag.tagId} className="bg-[var(--card)] hover:bg-[var(--muted)]/30 transition-colors group">
                <td className="px-6 py-4 font-medium text-[var(--foreground)]">{tag.name}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {tag.usage} truyện
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(tag)} className="h-8 w-8 hover:text-blue-600">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(tag)} className="h-8 w-8 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT 2: TAG MODAL (Gộp Thêm & Sửa)
// ==========================================

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagToEdit?: TagPagedItem | null; // Nếu null là Thêm, có data là Sửa
  onConfirm: (tagName: string) => Promise<void>;
}
// Component Modal: Xử lý cả 2 trạng thái Thêm mới và Cập nhật (isEditMode)
export function TagModal({ isOpen, onClose, tagToEdit, onConfirm }: TagModalProps) {
  const [tagName, setTagName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Xác định chế độ: Có tagToEdit -> Edit Mode
  const isEditMode = !!tagToEdit;

  useEffect(() => {
    if (isOpen) {
      setTagName(isEditMode && tagToEdit ? tagToEdit.name : "");
    }
  }, [isOpen, tagToEdit, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Nếu có 'tag' truyền vào -> Gọi API Update, ngược lại gọi API Create
    if (!tagName.trim()) {
      toast.warning("Tên tag không được để trống");
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(tagName);
      onClose();
    } catch (error) {
      // Lỗi xử lý ở trang cha
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-md rounded-xl shadow-lg p-6 space-y-4 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            {isEditMode ? "Chỉnh sửa Thể loại" : "Thêm mới Thể loại"}
          </h3>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">Tên thể loại</label>
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder={isEditMode ? "Nhập tên mới..." : "Nhập tên thể loại..."}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Hủy bỏ</Button>
            <Button type="submit" disabled={isSubmitting || !tagName.trim()}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</>
              ) : (
                <>
                  {isEditMode ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {isEditMode ? "Lưu thay đổi" : "Thêm mới"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}