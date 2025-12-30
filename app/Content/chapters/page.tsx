/**
 * @file app/Content/chapters/page.tsx
 * @description Trang quản lý kiểm duyệt chương truyện. 
 * Thực hiện cơ chế chuyển đổi (toggle) giữa danh sách chương và chi tiết nội dung chương.
 */

"use client";

import { useState } from "react";
import { ChapterList, ChapterFromAPI } from "./components/chapter-list"; 
import { ChapterDetail } from "./components/chapter-detail"; 

export default function ChapterReviewPage() {
  /**
   * @state selectedChapter
   * Lưu trữ đối tượng chương đang được chọn để kiểm duyệt.
   * Nếu là null: Hiển thị danh sách. Nếu có dữ liệu: Hiển thị màn hình đọc nội dung.
   */
  const [selectedChapter, setSelectedChapter] = useState<ChapterFromAPI | null>(null);

  /**
   * Xử lý sự kiện khi nhấn nút "Kiểm duyệt" từ danh sách.
   */
  const handleReviewClick = (chapter: ChapterFromAPI) => {
    setSelectedChapter(chapter);
  };

  /**
   * Quay lại màn hình danh sách (được gọi từ ChapterDetail).
   */
  const handleBack = () => {
    setSelectedChapter(null);
  };

  return (
    <div>
      {/* LUỒNG HIỂN THỊ:
         - Nếu chưa chọn chương -> Render ChapterList
         - Nếu đã chọn chương -> Render ChapterDetail và truyền object chapter qua prop 'content'
      */}
      {!selectedChapter ? (
        <ChapterList onReviewClick={handleReviewClick} />
      ) : (
        <ChapterDetail content={selectedChapter} onBack={handleBack} />
      )}
    </div>
  );
}