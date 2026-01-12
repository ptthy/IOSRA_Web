// components/report/ReportChapterSelector.tsx
"use client";
/**
 * ================================================================================
ReportChapterSelector → ReportModal:

User chọn chapter từ ReportChapterSelector

Gọi onSelectChapter callback với chapter được chọn

Parent component mở ReportModal với targetId = chapter.chapterId

ReportModal → Backend API:

User điền form và submit trong ReportModal

Gọi reportService.createReport() gửi dữ liệu lên server

Xử lý response/error và hiển thị feedback

ReportDetailModal ← Report List:

Khi user click "Xem chi tiết" từ danh sách báo cáo

Truyền reportId vào ReportDetailModal

Modal fetch chi tiết và hiển thị

Services liên quan:

reportService: xử lý API calls (create, get detail)

chapterCatalogService: cung cấp ChapterSummary type

Các component này tạo thành một flow hoàn chỉnh: Chọn đối tượng → Tạo báo cáo → Xem chi tiết báo cáo.
================================================================================
 * MODAL LỰA CHỌN CHƯƠNG TRUYỆN ĐỂ BÁO CÁO
 *
 * MỤC ĐÍCH:
 * - Hiển thị danh sách các chương truyện trong một modal dialog
 * - Cho phép người dùng chọn một chương cụ thể để thực hiện báo cáo
 * - Thường được sử dụng khi người dùng muốn báo cáo một chương nào đó trong truyện
 *
 * CHỨC NĂNG CHÍNH:
 * 1. Hiển thị modal với danh sách chapters có thể scroll
 * 2. Mỗi chapter item hiển thị: số chương, tiêu đề và icon mũi tên
 * 3. Khi click vào chapter -> gọi callback onSelectChapter
 * 4. Header cố định, phần nội dung tự động cuộn khi có nhiều chương
 *
 * SỬ DỤNG KHI:
 * - User click "Báo cáo chương" từ trang đọc truyện
 * - Cần chọn một chương cụ thể từ danh sách nhiều chương
 * - Hệ thống có nhiều chương và cần UI chọn lọc thân thiện
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChapterSummary } from "@/services/chapterCatalogService";
import { ChevronRight } from "lucide-react";
/**
 * Props interface cho component ReportChapterSelector
 *
 * @property {boolean} isOpen - Trạng thái hiển thị modal
 * @property {() => void} onClose - Hàm đóng modal
 * @property {ChapterSummary[]} chapters - Danh sách chương để hiển thị
 * @property {(chapter: ChapterSummary) => void} onSelectChapter - Callback khi chọn chương
 *
 * Component này dùng để hiển thị danh sách các chương truyện
 * trong một modal dialog, cho phép người dùng chọn một chương
 * để thực hiện hành động báo cáo
 */
interface ReportChapterSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterSummary[];
  onSelectChapter: (chapter: ChapterSummary) => void;
}
/**
 * Component hiển thị modal lựa chọn chương truyện để báo cáo
 *
 * Logic xử lý chính:
 * 1. Sử dụng Dialog component từ shadcn/ui để tạo overlay modal
 * 2. Hiển thị danh sách chapters dưới dạng danh sách có thể scroll
 * 3. Mỗi item chapter có thể click để gọi onSelectChapter callback
 * 4. Header cố định, phần nội dung có thể cuộn khi có nhiều chương
 * 5. Thiết kế responsive với kích thước cố định trên mobile
 */
export function ReportChapterSelector({
  isOpen,
  onClose,
  chapters,
  onSelectChapter,
}: ReportChapterSelectorProps) {
  return (
    /**
     * Dialog component từ shadcn/ui - tạo modal overlay
     * open: kiểm soát hiển thị modal
     * onOpenChange: gọi khi trạng thái mở/đóng thay đổi
     */
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 
        DialogContent: container chính của modal
        - sm:max-w-[400px]: rộng tối đa 400px trên mobile
        - h-[80vh]: chiếm 80% chiều cao viewport
        - flex flex-col: bố cục dọc
        - p-0: không padding để header và content riêng biệt
        - overflow-hidden: ẩn overflow của container cha
      */}
      <DialogContent className="sm:max-w-[400px] h-[80vh] flex flex-col p-0 bg-card overflow-hidden">
        {/* 
          Header cố định:
          - p-4: padding đều 4 hướng
          - border-b: đường viền dưới phân cách
          - shrink-0: không co lại khi content scroll
        */}
        <DialogHeader className="p-4 border-b border-border shrink-0">
          <DialogTitle>Chọn chương cần báo cáo</DialogTitle>
        </DialogHeader>

        {/* 
          Vùng nội dung có thể scroll:
          - flex-1: chiếm phần không gian còn lại
          - overflow-y-auto: cho phép cuộn dọc khi nội dung dài
          - min-h-0: cho phép co nhỏ khi cần
          - p-2: padding nhỏ xung quanh
        */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          <div className="space-y-1">
            {/*
              Duyệt qua danh sách chapters và render từng item
              Key sử dụng chapterId để React tối ưu re-render
            */}
            {chapters.map((chapter) => (
              /**
               * Mỗi chapter item:
               * - Có thể click để chọn chapter
               * - Hiệu ứng hover để chỉ ra có thể tương tác
               * - Hiển thị số chương, tiêu đề và icon mũi tên
               */
              <div
                key={chapter.chapterId}
                onClick={() => onSelectChapter(chapter)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border"
              >
                {/* 
                  Circle hiển thị số chương:
                  - bg-primary/10: nền với độ trong suốt
                  - rounded-full: bo tròn thành hình tròn
                  - shrink-0: không co lại để giữ kích thước
                */}
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {chapter.chapterNo}
                  </span>
                </div>
                {/* 
                  Phần tiêu đề chương:
                  - flex-1 min-w-0: chiếm không gian còn lại, cho phép truncate
                  - truncate: cắt bớt text nếu quá dài
                */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {chapter.title}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
