"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { getPagedTags, updateTag, createTag, TagApiResponse, TagPagedItem } from "@/services/tagService";

// Import từ file gộp (chỉ cần TagTable và TagModal)
import { TagTable, TagModal } from "./components/TagManagerComponents"; 

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function TagManagementPage() {
  const [tags, setTags] = useState<TagPagedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- STATE MODAL (Chỉ dùng 1 bộ state duy nhất) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagPagedItem | null>(null); 
 /**
   * Logic xử lý lưu (Save) chung:
   * - Nếu editingTag có giá trị: Gọi API updateTag (Cập nhật).
   * - Nếu editingTag là null: Gọi API createTag (Thêm mới).
   */

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response: TagApiResponse = await getPagedTags(1, 20);
      setTags(response.items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // 1. Mở Modal Thêm mới
  const handleCreateClick = () => {
    setEditingTag(null); // Reset về null để Modal hiểu là Thêm
    setIsModalOpen(true);
  };

  // 2. Mở Modal Chỉnh sửa
  const handleEditClick = (tag: TagPagedItem) => {
    setEditingTag(tag); // Truyền tag vào để Modal hiểu là Sửa
    setIsModalOpen(true);
  };

  // 3. Hàm Xử lý Lưu chung (Cho cả Thêm và Sửa)
  const handleSaveTag = async (tagName: string) => {
    try {
      if (editingTag) {
        // --- LOGIC SỬA ---
        await updateTag(editingTag.tagId, tagName);
        toast.success("Cập nhật thể loại thành công!");
        
        // Cập nhật state trực tiếp cho mượt
        setTags((prev) => 
          prev.map(t => t.tagId === editingTag.tagId ? { ...t, name: tagName } : t)
        );
      } else {
        // --- LOGIC THÊM ---
        await createTag(tagName);
        toast.success("Thêm thể loại thành công!");
        
        // Reload lại danh sách để lấy ID mới nhất
        await fetchTags();
      }
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra.");
      throw error; // Ném lỗi để Modal tắt loading
    }
  };

  const handleDeleteTag = (tag: TagPagedItem) => {
    toast.error(`Chức năng 'Xóa Tag' [${tag.name}] chưa được kết nối API.`);
  };

  const totalUsage = tags.reduce((sum, tag) => sum + tag.usage, 0);

  return (
    <div
      className={cn(
        "min-h-screen p-8 transition-colors duration-300",
        poppins.className
      )}
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--primary)]">
              Quản lý Thể loại
            </h1>
            <p className="text-[var(--muted-foreground)] mb-3">
              Quản lý danh sách thể loại truyện và theo dõi mức độ phổ biến
            </p>

            {tags.length > 0 && (
              <div className="flex items-center gap-3 mt-2">
                <div className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] font-medium rounded-full text-sm shadow-sm">
                  {tags.length} thể loại
                </div>
                <div className="px-3 py-1 bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)] font-medium rounded-full text-sm shadow-sm">
                  {totalUsage.toLocaleString()} truyện đang sử dụng
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleCreateClick}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Thêm Thể loại
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Component Bảng */}
        <TagTable
          tags={tags}
          isLoading={isLoading}
          error={error}
          onEdit={handleEditClick}  
          onDelete={handleDeleteTag}
        />
      </motion.div>

      {/* Component Modal (Chỉ dùng 1 cái duy nhất) */}
      <TagModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tagToEdit={editingTag}     // Truyền null hoặc object tag
        onConfirm={handleSaveTag}  // Gọi hàm xử lý chung
      />
    </div>
  );
}