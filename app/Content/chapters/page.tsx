// File: app/Content/chapters/page.tsx (ĐÃ SỬA LẠI HOÀN CHỈNH)
"use client";

import { useState } from "react";
// Import cả 2 từ 'chapter-list'
import { ChapterList, ChapterFromAPI } from "./components/chapter-list"; 
// Import file "Chi tiết"
import { ChapterDetail } from "./components/chapter-detail"; 

export default function ChapterReviewPage() {
  const [selectedChapter, setSelectedChapter] = useState<ChapterFromAPI | null>(null);

  const handleReviewClick = (chapter: ChapterFromAPI) => {
    setSelectedChapter(chapter);
  };

  const handleBack = () => {
    setSelectedChapter(null);
  };

  return (
    <div>
      {/* Nếu chưa chọn chương (selectedChapter là null) -> Hiển thị Danh sách (ChapterList)
        Nếu đã chọn chương -> Hiển thị Chi tiết (ChapterDetail)
      */}
      {!selectedChapter ? (
        <ChapterList onReviewClick={handleReviewClick} />
      ) : (
        <ChapterDetail content={selectedChapter} onBack={handleBack} />
      )}
    </div>
  );
}