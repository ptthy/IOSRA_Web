// components/story-card.tsx
import React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
//import { StorySummary } from "../lib/types";
import { Story } from "@/services/apiTypes";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { Lock, User, BookOpen } from "lucide-react";

interface StoryCardProps {
  // story: StorySummary;
  story: Story;
  onClick: () => void;
}

export function StoryCard({ story, onClick }: StoryCardProps) {
  const router = useRouter();

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (story.authorId) {
      router.push(`/profile/${story.authorId}`);
    }
  };

  return (
    <div
      className="group relative cursor-pointer flex-shrink-0 w-[240px] h-[360px] transition-all duration-500 hover:-translate-y-2"
      onClick={onClick}
    >
      {/* Card Container */}
      <div className="relative bg-background rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 border border-border/50 w-full h-full group-hover:border-primary/40">
        {/* --- PHẦN 1: TRẠNG THÁI MẶC ĐỊNH (Cover Image) --- */}
        <div className="relative w-full h-full overflow-hidden bg-muted">
          <ImageWithFallback
            src={story.coverUrl}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Gradient Overlay & Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent dark:from-background/90 dark:via-background/30 dark:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

          {/* Premium Badge (Góc phải) */}
          {story.isPremium && (
            <div className="absolute top-2 right-2 z-20 transform group-hover:scale-110 transition-transform duration-300">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-1 shadow-lg border-0 px-2 py-1 text-xs">
                <Lock className="h-3 w-3" />
                <span className="font-bold">Premium</span>
              </Badge>
            </div>
          )}

          {/* Tiêu đề khi KHÔNG Hover (Nằm dưới đáy, tự ẩn khi hover) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent group-hover:opacity-0 transition-opacity duration-300">
            <h3 className="font-bold text-foreground text-base leading-tight line-clamp-2 text-center">
              {story.title}
            </h3>
          </div>
        </div>

        {/* --- PHẦN 2: TRẠNG THÁI HOVER (Overlay thông tin) --- */}
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm dark:bg-background/95 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col overflow-hidden">
          {" "}
          {/* HEADER SECTION: Title bó chặt lên đầu */}
          <div className="flex-shrink-0 pt-4 px-4 pb-2 bg-gradient-to-b from-background to-transparent border-b border-border/50">
            <h3 className="font-bold text-foreground text-lg leading-tight text-center line-clamp-2">
              {story.title}
            </h3>
          </div>
          {/* BODY SECTION: Nội dung còn lại */}
          <div className="flex-1 px-5 py-2 flex flex-col justify-between overflow-hidden">
            {/* Author & Description */}
            <div className="flex flex-col items-center space-y-3 min-h-0">
              {/* Author Name */}
              <div
                className="flex items-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors duration-300 cursor-pointer"
                onClick={handleAuthorClick}
              >
                <User className="h-3 w-3" />
                <span className="font-medium truncate max-w-[150px]">
                  {story.authorUsername}
                </span>
              </div>

              {/* Description Scrollable */}
              <div className="w-full relative flex-1 min-h-0 overflow-hidden">
                <p className="text-muted-foreground text-sm leading-relaxed text-justify line-clamp-6">
                  {story.shortDescription ||
                    "Một câu chuyện đặc sắc đang chờ bạn khám phá..."}
                </p>
              </div>
            </div>

            {/* Bottom Stats & Tags */}
            <div className="space-y-3 mt-2 flex-shrink-0">
              {/* Chapter Count */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full dark:bg-secondary/50">
                  <BookOpen className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-sm text-muted-foreground">
                    {story.totalChapters} chương
                  </span>
                </div>
              </div>

              {/* Tags List */}
              <div className="flex flex-wrap gap-1.5 justify-center h-[26px] overflow-hidden">
                {/* 1. SỬA THÀNH slice(0, 2): Chỉ lấy 2 tag đầu tiên */}
                {/* //  {story.tags.slice(0, 2).map((tag) => ( */}
                {story.tags &&
                  story.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag.tagId}
                      variant="secondary"
                      className="text-[10px] bg-primary/10 text-primary border border-primary/20 max-w-[120px] truncate px-1.5"
                    >
                      {tag.tagName}
                    </Badge>
                  ))}

                {/* 2. SỬA THÀNH length > 2: Nếu có từ 3 tag trở lên thì hiện dấu ... */}
                {/* {story.tags.length > 2 && ( */}
                {story.tags && story.tags.length > 2 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 align-middle"
                  >
                    ...
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
