import { X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface RejectModalProps {
  isOpen: boolean;
  onReject?: (id: string) => void;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function RejectModal({ isOpen, onClose, onConfirm }: RejectModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
    onClose();
  };

  const commonReasons = [
    'Nội dung không phù hợp với tiêu chuẩn cộng đồng',
    'Vi phạm bản quyền',
    'Chứa nội dung bạo lực hoặc khiêu dâm',
    'Spam hoặc quảng cáo',
    'Ngôn ngữ không phù hợp',
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-gray-900 font-semibold">Từ chối truyện</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 bg-white">
          <p className="text-gray-600">
            Vui lòng chọn hoặc nhập lý do từ chối truyện này. Thông tin này sẽ được gửi cho tác giả.
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
                  className={`w-full text-left p-3 rounded-xl border transition-all bg-white ${
                    reason === commonReason
                      ? 'border-blue-500 bg-blue-50 text-gray-900'
                      : 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-gray-50'
                  }`}
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
              placeholder="Nhập lý do từ chối..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[120px] bg-white border-gray-300 text-gray-900"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-white">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            Xác nhận từ chối
          </Button>
        </div>
      </motion.div>
    </div>
  );
}