// File: moderation/components/reject-modal.tsx
import React, { useState } from "react";
import { X, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: RejectModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
  };

  const handleSelectReason = (selectedReason: string) => {
    if (reason === selectedReason) {
      setReason("");
    } else {
      setReason(selectedReason);
    }
  };

  const commonReasons = [
    "Nội dung không phù hợp",
    "Vi phạm bản quyền",
    "Bạo lực / Khiêu dâm",
    "Spam hoặc quảng cáo",
    "Ngôn ngữ không phù hợp",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[360px] max-w-[90%] border border-gray-200 dark:border-gray-700"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-sm">
                  Từ chối truyện
                </h3>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BODY */}
            <div className="p-4 space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                Vui lòng chọn hoặc nhập <strong>lý do từ chối</strong>.
              </p>

              {/* Lý do thường gặp */}
              <div>
                <label className="text-xs text-gray-900 dark:text-white font-medium mb-2 block">
                  Lý do thường gặp
                </label>

                <div className="space-y-2">
                  {commonReasons.map((commonReason, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectReason(commonReason)}
                      disabled={isSubmitting}
                      className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${
                        reason === commonReason
                          ? "border-red-500 bg-red-50 dark:bg-red-900/30 text-gray-900 dark:text-red-300 shadow-sm"
                          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-500/50 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {commonReason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lý do chi tiết */}
              <div>
                <label className="text-xs text-gray-900 dark:text-white font-medium mb-2 block border-t border-gray-200 dark:border-gray-700 pt-3">
                  Hoặc nhập lý do chi tiết
                </label>

                <Textarea
                  placeholder="Nhập lý do..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSubmitting}
                  className="min-h-[90px] text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 rounded-b-xl">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-8 px-3 text-xs border-gray-300 dark:border-gray-600"
              >
                Hủy
              </Button>

              <Button
                className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400"
                onClick={handleConfirm}
                disabled={!reason.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" /> Đang gửi
                  </>
                ) : (
                  "Xác nhận"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
