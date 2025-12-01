"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { TopUpModal } from "@/components/payment/TopUpModal"; // Import modal của bạn
import { profileService } from "@/services/profileService"; // Để lấy số dư ví

interface ModalContextType {
  openTopUpModal: () => void;
  closeTopUpModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(0);

  // Hàm mở Modal (kèm theo việc lấy số dư mới nhất)
  const openTopUpModal = async () => {
    try {
      // Gọi API lấy ví để hiển thị số dư đúng trong Modal
      const res = await profileService.getWallet();
      if (res.data) {
        setBalance(res.data.diaBalance || 0);
      }
    } catch (e) {
      console.error("Lỗi lấy số dư:", e);
    }
    setIsOpen(true);
  };

  const closeTopUpModal = () => setIsOpen(false);

  return (
    <ModalContext.Provider value={{ openTopUpModal, closeTopUpModal }}>
      {children}

      {/* Modal nằm sẵn ở đây, chờ lệnh là hiện */}
      <TopUpModal
        isOpen={isOpen}
        onClose={closeTopUpModal}
        currentBalance={balance}
      />
    </ModalContext.Provider>
  );
}

// Hook để các component khác gọi dùng
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
