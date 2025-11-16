// components/story-card.tsx
import React from "react";
import { Badge } from "./ui/badge";
import { StorySummary } from "../lib/types";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { Lock, Eye, User } from "lucide-react";

interface StoryCardProps {
  story: StorySummary;
  onClick: () => void;
}

export function StoryCard({ story, onClick }: StoryCardProps) {
  return (
    <div
      className="group relative cursor-pointer flex-shrink-0 w-[200px] sm:w-[220px] h-[420px] transition-all duration-300 hover:-translate-y-2"
      onClick={onClick}
    >
      {/* Card Container */}
      <div className="relative bg-card rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-border/50 w-full h-full flex flex-col">
        {/* Cover Image */}
        <div className="relative h-[240px] overflow-hidden bg-muted flex-shrink-0">
          <ImageWithFallback
            src={story.coverUrl}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Premium Badge */}
          {story.isPremium && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground flex items-center gap-1 shadow-lg border border-primary-foreground/20 px-2 py-0.5">
                <Lock className="h-3 w-3" />
                <span className="text-xs font-semibold">Premium</span>
              </Badge>
            </div>
          )}

          {/* Info overlay on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-white text-xs line-clamp-2 mb-2">
              {story.shortDescription}
            </p>
            <div className="flex items-center gap-2 text-white/90 text-xs">
              <Eye className="h-3 w-3" />
              <span>{story.totalChapters} chương</span>
            </div>
          </div>
        </div>

        {/* Content - KHOẢNG CÁCH ĐÃ ĐƯỢC THU HẸP */}
        <div className="p-3 bg-card flex flex-col flex-1 min-h-0 h-[180px]">
          {/* Title - khoảng cách thu hẹp tối đa */}
          <div className="flex-shrink-0 h-[46px]">
            {" "}
            {/* Đã xóa mb-1 */}
            <h3 className="font-bold text-[17px] leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {story.title}
            </h3>
          </div>

          {/* Author - khoảng cách thu hẹp */}
          <div className="flex items-center gap-1 text-[13px] text-muted-foreground font-medium mb-2 truncate flex-shrink-0 h-[16px] mt-0.5">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{story.authorUsername}</span>
          </div>

          {/* Tags - chiếm phần còn lại */}
          <div className="mt-auto h-[56px] overflow-y-auto">
            <div className="flex flex-wrap gap-1 w-full">
              {story.tags.map((tag) => (
                <Badge
                  key={tag.tagId}
                  variant="secondary"
                  className="text-[11px] px-1.5 py-0 rounded-md bg-secondary/60 hover:bg-secondary transition-colors flex-shrink-0 mb-1"
                >
                  {tag.tagName}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute -top-1 -right-1 w-8 h-8 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
