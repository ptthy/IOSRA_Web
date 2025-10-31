"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ContentList } from "./components/content-list";
import { ReviewDetail } from "./components/review-detail";
import { HistoryPage } from "./components/history-page";
import { Poppins } from "next/font/google";

// Import font Poppins từ Google Fonts
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab"); // Lấy giá trị ?tab= từ URL

  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(
    tab === "history" ? "history" : "review"
  );

  // Cập nhật state khi URL thay đổi
  useEffect(() => {
    setCurrentPage(tab === "history" ? "history" : "review");
  }, [tab]);

  // Xử lý khi click trên sidebar
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedContent(null);

    // Khi người dùng bấm sidebar, đổi URL cho khớp
    if (page === "history") {
      router.push("/Content/review?tab=history");
    } else {
      router.push("/Content/review");
    }
  };

  return (
    <div className={`flex min-h-screen ${poppins.className} bg-background`}>
      {/* Sidebar (bên trái) */}
      

      {/* Nội dung chính */}
      <main className="flex-1 p-6 relative">
        {currentPage === "history" ? (
          <HistoryPage />
        ) : selectedContent ? (
          <ReviewDetail
            content={selectedContent}
            onBack={() => setSelectedContent(null)}
          />
        ) : (
          <ContentList onReview={(content) => setSelectedContent(content)} />
        )}

      
       
      </main>
    </div>
  );
}
