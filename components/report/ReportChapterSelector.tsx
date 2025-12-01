// components/report/ReportChapterSelector.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChapterSummary } from "@/services/chapterCatalogService";
import { ChevronRight } from "lucide-react";

interface ReportChapterSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterSummary[];
  onSelectChapter: (chapter: ChapterSummary) => void;
}

export function ReportChapterSelector({
  isOpen,
  onClose,
  chapters,
  onSelectChapter,
}: ReportChapterSelectorProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] h-[80vh] flex flex-col p-0 bg-card overflow-hidden">
        {/* Header cố định, không bị co lại */}
        <DialogHeader className="p-4 border-b border-border shrink-0">
          <DialogTitle>Chọn chương cần báo cáo</DialogTitle>
        </DialogHeader>

        {/* Vùng nội dung tự động co giãn và cuộn */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          <div className="space-y-1">
            {chapters.map((chapter) => (
              <div
                key={chapter.chapterId}
                onClick={() => onSelectChapter(chapter)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {chapter.chapterNo}
                  </span>
                </div>
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
