// components/story-card.tsx
import React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
import { StorySummary } from "../lib/types";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { Lock, User, BookOpen } from "lucide-react";

interface StoryCardProps {
  story: StorySummary;
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
        {/* Cover Image - chiếm toàn bộ card */}
        <div className="relative w-full h-full overflow-hidden bg-muted">
          <ImageWithFallback
            src={story.coverUrl}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Gradient Overlay theo theme */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent dark:from-background/90 dark:via-background/30 dark:to-transparent" />

          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

          {/* Premium Badge */}
          {story.isPremium && (
            <div className="absolute top-2 right-2 z-20 transform group-hover:scale-110 transition-transform duration-300">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-1 shadow-lg border-0 px-2 py-1 text-xs">
                <Lock className="h-3 w-3" />
                <span className="font-bold">Premium</span>
              </Badge>
            </div>
          )}

          {/* CHỈ HIỆN TÊN TRUYỆN KHI KHÔNG HOVER */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent dark:from-background dark:via-background/90 dark:to-transparent">
            <h3 className="font-bold text-foreground text-base leading-tight line-clamp-2 text-center">
              {story.title}
            </h3>
          </div>
        </div>

        {/* HOVER OVERLAY - theo theme */}
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm dark:bg-background/95 p-5 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-between border border-primary/20 rounded-xl">
          {/* Top Section - FIXED LAYOUT */}
          <div className="space-y-3 flex-1 min-h-0">
            {/* Title - FIXED */}
            <h3 className="font-bold text-foreground text-lg leading-tight text-center mb-2">
              {story.title}
            </h3>

            {/* Author - FIXED */}
            <div
              className="flex items-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors duration-300 cursor-pointer justify-center mb-3"
              onClick={handleAuthorClick}
            >
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium truncate">
                {story.authorUsername}
              </span>
            </div>

            {/* Description - FIXED LAYOUT, KHÔNG BỊ XUỐNG DÒNG LUNG TUNG */}
            <div className="flex-1 min-h-0">
              <p className="text-muted-foreground text-sm leading-relaxed text-left h-full overflow-hidden">
                {story.shortDescription ||
                  "Một câu chuyện đặc sắc đang chờ bạn khám phá..."}
              </p>
            </div>
          </div>

          {/* Bottom Section - FIXED */}
          <div className="space-y-3 flex-shrink-0">
            {/* Stats - FIXED */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full dark:bg-secondary/50">
                <BookOpen className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-sm text-muted-foreground">
                  {story.totalChapters} chương
                </span>
              </div>
            </div>

            {/* Tags - FIXED LAYOUT, KHÔNG BỊ TRÀN */}
            <div className="flex flex-wrap gap-1.5 justify-center max-h-[40px] overflow-hidden">
              {story.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.tagId}
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors dark:bg-primary/20 dark:text-primary-foreground flex-shrink-0"
                >
                  {tag.tagName}
                </Badge>
              ))}
              {story.tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-muted text-muted-foreground border-0 flex-shrink-0"
                >
                  +{story.tags.length - 3}
                </Badge>
              )}
            </div>

            {/* Premium Badge - FIXED */}
            {story.isPremium && (
              <div className="flex justify-center pt-1">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1.5 text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Nội dung Premium
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
    </div>
  );
}
