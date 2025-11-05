// File: moderation/components/approval-modal.tsx
import React, { useState } from 'react'; // ✅ Thêm React
import { X, CheckCircle2, Loader2 } from 'lucide-react'; // ✅ Thêm Loader2
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // ✅ Thêm Textarea
import { motion } from 'framer-motion';

// ✅ SỬA 1: Cập nhật Interface
interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void; // Thay 'languages' bằng 'reason'
  isSubmitting?: boolean;
}

export function ApprovalModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isSubmitting 
}: ApprovalModalProps) {
  
  // ✅ SỬA 2: Thay 'selectedLanguages' bằng 'reason'
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
  };

  // ✅ SỬA 3: Thêm lý do thường gặp cho việc Phê duyệt
  const commonReasons = [
    'AI gắn cờ nhầm, nội dung an toàn.',
    'Nội dung đã được chỉnh sửa phù hợp.',
    'Nội dung không vi phạm tiêu chuẩn.',
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200"
      >
        {/* Header (Đổi icon và màu) */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-900 font-semibold">Phê duyệt truyện</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ✅ SỬA 4: Content (thay bằng Textarea) */}
        <div className="p-6 space-y-4 bg-white">
          <p className="text-gray-600">
            Vui lòng chọn hoặc nhập lý do phê duyệt. (Ví dụ: AI gắn cờ nhầm).
          </p>

          <div>
            <label className="text-sm text-gray-900 font-medium mb-2 block">
              Lý do thường gặp
            </label>
            <div className="space-y-2">
              {commonReasons.map((commonReason, index) => (
                <button
                  key={index}
                  onClick={() => setReason(commonReason)}
                  disabled={isSubmitting}
                  className={`w-full text-left p-3 rounded-xl border transition-all bg-white ${
                    reason === commonReason
                      ? 'border-blue-500 bg-blue-50 text-gray-900'
                      : 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <p className="text-sm">{commonReason}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-900 font-medium mb-2 block">
              Hoặc nhập lý do chi tiết
            </label>
            <Textarea
              placeholder="Nhập lý do phê duyệt..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[120px] bg-white border-gray-300 text-gray-900"
            />
          </div>
        </div>

        {/* Footer (Đổi màu nút) */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-white">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white" // Đổi sang màu xanh
            onClick={handleConfirm}
            disabled={!reason.trim() || isSubmitting} // Bắt buộc nhập lý do
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xác nhận phê duyệt"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}