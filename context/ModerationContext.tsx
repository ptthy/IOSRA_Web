// File: context/ModerationContext.tsx (ĐÃ SỬA LỖI TYPE)
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// ✅ SỬA 1: Định nghĩa kiểu (type) cho 'counts'
// (Thêm 'chaptersPending' cho trang "Duyệt Chương" mới)
interface ModerationCounts {
  pending: number;
  sentBack: number;
  reports: number;
  chaptersPending: number; 
}

// ✅ SỬA 2: Định nghĩa kiểu cho Context
// Nó sẽ cung cấp 'counts' VÀ hàm 'updateCount'
type CountKey = keyof ModerationCounts; // 'pending' | 'sentBack' | ...

interface ModerationContextType {
  counts: ModerationCounts;
  updateCount: (key: CountKey, value: number) => void;
}

// ✅ SỬA 3: Áp dụng kiểu 'ModerationContextType' cho Context
// (Khởi tạo là 'undefined' vì chưa có Provider)
const ModerationContext = createContext<ModerationContextType | undefined>(
  undefined
);

// --- Provider Component (Phần cung cấp dữ liệu) ---
export const ModerationProvider = ({ children }: { children: ReactNode }) => {
  
  // ✅ SỬA 4: Áp dụng kiểu 'ModerationCounts' cho state
  const [counts, setCounts] = useState<ModerationCounts>({
    pending: 0,
    sentBack: 0,
    reports: 0,
    chaptersPending: 0, // Thêm giá trị mặc định
  });

  // ✅ SỬA 5: Dùng 'CountKey' để gõ (type) chính xác cho 'key'
  const updateCount = useCallback((key: CountKey, value: number) => {
    setCounts((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Giá trị cung cấp cho Context (khớp với ModerationContextType)
  const value = { counts, updateCount };

  return (
    <ModerationContext.Provider value={value}>
      {children}
    </ModerationContext.Provider>
  );
};

// --- Hook (Phần tiêu thụ dữ liệu) ---
export const useModeration = () => {
  const context = useContext(ModerationContext);
  
  // ✅ SỬA 6: Kiểm tra nếu context là 'undefined' (lỗi phổ biến)
  if (context === undefined) {
    throw new Error("useModeration phải được dùng bên trong ModerationProvider");
  }
  
  return context;
};