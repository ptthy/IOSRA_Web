
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen } from "lucide-react";
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
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý Thể loại
              </h1>
            </div>
            <p className="text-gray-600 mb-2">
              Quản lý danh sách thể loại truyện và theo dõi mức độ phổ biến
            </p>
            {tags.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{tags.length} thể loại</span>
                <span>•</span>
                <span>{totalUsage.toLocaleString()} truyện đang sử dụng</span>
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

      {/* (Bạn sẽ thêm các Modal CRUD ở đây) */}
      {/* <CreateTagModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => loadTags()} // Tải lại data sau khi tạo
      /> */}
    </div>
  );
}