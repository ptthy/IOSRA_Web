/**
 * MODAL CONTEXT - QUẢN LÝ MODAL NẠP TIỀN TOÀN ỨNG DỤNG
 * MỤC ĐÍCH: Cung cấp cách mở modal nạp tiền từ bất kỳ component nào
 * CHỨC NĂNG CHÍNH:
 * 1. Quản lý state mở/đóng modal
 * 2. Lấy số dư ví trước khi mở modal
 * 3. Render modal ở top-level (portal)
 * LỢI ÍCH: Tránh prop drilling, dễ reuse, tập trung logic
 */
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { TopUpModal } from "@/components/payment/TopUpModal"; // Import modal của bạn
import { profileService } from "@/services/profileService"; // Để lấy số dư ví
// Interface cho ModalContext
// CHỈ CÓ 2 HÀM: openTopUpModal và closeTopUpModal
interface ModalContextType {
  openTopUpModal: () => void;
  closeTopUpModal: () => void;
}
// Tạo React Context
const ModalContext = createContext<ModalContextType | undefined>(undefined);
/**
 * ModalProvider Component
 * MỤC ĐÍCH: Wrap toàn bộ app để cung cấp modal context
 * CƠ CHẾ:
 * 1. Quản lý state isOpen cho modal
 * 2. Quản lý balance hiện tại
 * 3. Cung cấp hàm open/close cho children
 */
export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(0);

  /**
   * HÀM MỞ MODAL NẠP TIỀN
   * FLOW:
   * 1. Gọi API lấy số dư ví mới nhất
   * 2. Cập nhật state balance
   * 3. Mở modal
   * TẠI SAO LẤY BALANCE TRƯỚC: Để hiển thị số dư chính xác khi modal mở
   */
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
  // Hàm đóng modal
  const closeTopUpModal = () => setIsOpen(false);

  return (
    <ModalContext.Provider value={{ openTopUpModal, closeTopUpModal }}>
      {children}

      {/* 
        Modal nằm sẵn ở đây, chờ lệnh là hiện 
        VỊ TRÍ: Render ở top-level của app, dùng portal để overlay toàn màn hình
        PROP TRUYỀN VÀO:
        - isOpen: State hiển thị
        - onClose: Hàm đóng modal
        - currentBalance: Số dư hiện tại để hiển thị
      */}
      <TopUpModal
        isOpen={isOpen}
        onClose={closeTopUpModal}
        currentBalance={balance}
      />
    </ModalContext.Provider>
  );
}

/**
 * useModal Hook
 * MỤC ĐÍCH: Custom hook để các component khác gọi mở modal
 * CÁCH DÙNG: const { openTopUpModal } = useModal();
 */
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
