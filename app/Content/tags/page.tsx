"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { getPagedTags, TagApiResponse, TagPagedItem } from "@/services/tagService";
import { TagGrid } from "./components/TagTable";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function TagManagementPage() {
  const [tags, setTags] = useState<TagPagedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // (State cho các Modal CRUD sau này)
  // const [showCreateModal, setShowCreateModal] = useState(false);
  // const [showEditModal, setShowEditModal] = useState<TagPagedItem | null>(null);
  // const [showDeleteModal, setShowDeleteModal] = useState<TagPagedItem | null>(null);

  useEffect(() => {
    const loadTags = async () => {
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
    loadTags();
  }, []);

  const handleCreateTag = () => {
    toast.info("Chức năng 'Thêm Tag' chưa được kết nối API.");
    // setShowCreateModal(true);
  };

  const handleEditTag = (tag: TagPagedItem) => {
    toast.info(`Chức năng 'Sửa Tag' [${tag.name}] chưa được kết nối API.`);
    // setShowEditModal(tag);
  };

  const handleDeleteTag = (tag: TagPagedItem) => {
    toast.error(`Chức năng 'Xóa Tag' [${tag.name}] chưa được kết nối API.`);
    // setShowDeleteModal(tag);
  };

  // Tính tổng số truyện đang sử dụng tags
  const totalUsage = tags.reduce((sum, tag) => sum + tag.usage, 0);

  return (
    <div className={cn("min-h-screen bg-[#F0EAD6] p-6", poppins.className)}>
      {/* Header */}
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
            onClick={handleCreateTag}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Thêm Thể loại
          </Button>
        </div>
      </motion.div>

      {/* Tag Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TagGrid
          tags={tags}
          isLoading={isLoading}
          error={error}
          onEdit={handleEditTag}
          onDelete={handleDeleteTag}
        />
      </motion.div>

      {/* (Các Modal CRUD thêm sau này) */}
      {/* <CreateTagModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => loadTags()} 
      /> */}
    </div>
  );
}
