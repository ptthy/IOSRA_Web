// File: app/Content/chapters/page.tsx (ĐÃ SỬA)
"use client";

import { useState } from "react";
// ✅ SỬA 1: Import cả 2 từ 'chapter-list'
import { ChapterList, ChapterFromAPI } from "./components/chapter-list"; 
import { AlertTriangle, User } from "lucide-react";

// (Chúng ta sẽ cần tạo file 'chapter-detail.tsx' sau)
// import { ChapterDetail } from "./components/chapter-detail"; 

// ✅ SỬA 2: Xóa định nghĩa 'ChapterFromAPI' ở đây (vì đã chuyển đi)

export default function ChapterReviewPage() {
  const [selectedChapter, setSelectedChapter] = useState<ChapterFromAPI | null>(null);

  const handleReviewClick = (chapter: ChapterFromAPI) => {
    setSelectedChapter(chapter);
    console.log("Chọn chương:", chapter);
    alert("Chưa có trang Chi tiết Chương. Logic sẽ được thêm vào 'chapter-detail.tsx'.");
  };

  const handleBack = () => {
    setSelectedChapter(null);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F0EAD6' }}>
      {/* Header */}
      <div className="mb-8">
     <h1 className="text-2xl font-bold text-[var(--primary)] mb-2">
  Duyệt Chương Truyện
</h1>
<p className="text-[var(--muted-foreground)]">
  Kiểm tra và duyệt các chương truyện có nội dung cần xem xét
</p>

      </div>

      {!selectedChapter ? (
        <ChapterList onReviewClick={handleReviewClick} />
      ) : (
        // (Phần này sẽ render khi bạn có file chapter-detail.tsx)
        // <ChapterDetail content={selectedChapter} onBack={handleBack} />
        
        <div className="bg-white rounded-xl border border-amber-200 p-6 shadow-sm">
          <div className="mb-6">
            <button 
              onClick={handleBack} 
              className="mb-4 text-amber-700 hover:text-amber-800 font-medium flex items-center gap-2 transition-colors"
            >
              ← Quay lại danh sách
            </button>
            
            <h2 className="text-xl font-bold text-gray-900">{selectedChapter.chapterTitle}</h2>
            <p className="text-sm text-amber-700 mt-1">Truyện: {selectedChapter.storyTitle}</p>
            
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-sm text-amber-700">
                <User className="w-4 h-4" />
                <span>Tác giả: {selectedChapter.authorUsername}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                <span>Điểm AI: <strong>{selectedChapter.aiScore}</strong></span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Phản hồi từ AI</h3>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 leading-relaxed">{selectedChapter.aiFeedback}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Phê duyệt
            </button>
            <button 
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Từ chối
            </button>
            <button 
              onClick={handleBack}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
            >
              Đã xem
            </button>
          </div>
        </div>
      )}
    </div>
  );
}