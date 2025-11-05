// File: context/ModerationContext.tsx (ĐÃ SỬA)
"use client";

import React, { 
  createContext, 
  useContext, 
  useState, 
  ReactNode, 
  useCallback, // ✅ SỬA 1: Import useCallback
  useMemo      // ✅ SỬA 2: Import useMemo
} from "react";

// Định nghĩa các loại số đếm
interface ModerationCounts {
  pending: number;
  sentBack: number;
  reports: number;
}

interface ModerationContextType {
  counts: ModerationCounts;
  updateCount: (key: keyof ModerationCounts, value: number) => void;
}

// Tạo Context
const ModerationContext = createContext<ModerationContextType | undefined>(
  undefined
);

// Tạo Provider (component cha bọc ngoài)
export const ModerationProvider = ({ children }: { children: ReactNode }) => {
  const [counts, setCounts] = useState<ModerationCounts>({
    pending: 0, 
    sentBack: 7, 
    reports: 12, 
  });

  // ✅ SỬA 3: Ổn định hàm 'updateCount' bằng useCallback
  const updateCount = useCallback((key: keyof ModerationCounts, value: number) => {
    setCounts((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []); // Mảng rỗng = hàm này chỉ được tạo 1 lần

  // ✅ SỬA 4: Ổn định đối tượng 'value' bằng useMemo
  const value = useMemo(() => ({
    counts,
    updateCount
  }), [counts, updateCount]); // Chỉ tạo object mới khi 'counts' thay đổi

  return (
    <ModerationContext.Provider value={value}>
      {children}
    </ModerationContext.Provider>
  );
};

// Tạo Hook (để component con lấy dữ liệu)
export const useModeration = (): ModerationContextType => {
  const context = useContext(ModerationContext);
  if (!context) {
    throw new Error("useModeration phải được dùng bên trong ModerationProvider");
  }
  return context;
};