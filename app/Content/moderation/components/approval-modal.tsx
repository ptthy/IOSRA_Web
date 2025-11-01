import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
   onApprove?: (id: string) => void;
  onConfirm: (languages: string[]) => void;
}

export function ApprovalModal({ isOpen, onClose, onConfirm }: ApprovalModalProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedLanguages);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3>Phê duyệt truyện</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Chọn ngôn ngữ để tạo giọng đọc AI cho truyện này
          </p>

          <div className="mb-6">
            <h4 className="mb-4">Tích hợp AI Voice-Over</h4>
            <p className="text-sm text-gray-600 mb-4">
              Chọn ngôn ngữ để tạo giọng đọc AI cho truyện
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Checkbox 
                  checked={selectedLanguages.includes('vi')}
                  onCheckedChange={() => handleLanguageToggle('vi')}
                />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full" />
                  <span>Tiếng Việt</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Checkbox 
                  checked={selectedLanguages.includes('en')}
                  onCheckedChange={() => handleLanguageToggle('en')}
                />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full" />
                  <span>English</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Checkbox 
                  checked={selectedLanguages.includes('ja')}
                  onCheckedChange={() => handleLanguageToggle('ja')}
                />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full" />
                  <span>日本語 (Japanese)</span>
                </div>
              </label>
            </div>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                💡 Bạn có thể chọn nhiều ngôn ngữ. Quá trình xử lý AI Voice sẽ diễn ra tự động.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConfirm}
          >
            Xác nhận phê duyệt
          </Button>
        </div>
      </div>
    </div>
  );
}
