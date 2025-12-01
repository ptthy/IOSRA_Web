//components/purchased/StorySection.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, Headphones } from "lucide-react";
import { StoryItem, VoiceItem } from "@/services/chapterPurchaseService";
import { AudioPlayer } from "./AudioPlayer";

interface StorySectionProps {
  story: StoryItem;
}

export function StorySection({ story }: StorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  const currentChapter = story.chapters[selectedChapterIndex];

  // Flatten voices để Player biết prev/next
  const allVoicesFlat: VoiceItem[] = story.chapters.flatMap((ch) => ch.voices);

  // Tính index toàn cục
  const currentGlobalIndex =
    story.chapters
      .slice(0, selectedChapterIndex)
      .reduce((sum, ch) => sum + ch.voices.length, 0) + selectedVoiceIndex;

  const handleVoiceChange = (newGlobalIndex: number) => {
    let count = 0;
    for (let i = 0; i < story.chapters.length; i++) {
      const chapterVoiceCount = story.chapters[i].voices.length;
      if (count + chapterVoiceCount > newGlobalIndex) {
        setSelectedChapterIndex(i);
        setSelectedVoiceIndex(newGlobalIndex - count);
        return;
      }
      count += chapterVoiceCount;
    }
  };

  const handleChapterChange = (newChapterIndex: number) => {
    setSelectedChapterIndex(newChapterIndex);
    setSelectedVoiceIndex(0);
  };

  const totalVoices = allVoicesFlat.length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header Accordion */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-card p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-lg text-foreground">
              {story.storyTitle}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="bg-muted px-2 py-0.5 rounded text-xs">
                {story.chapters.length} chương
              </span>
              <span>•</span>
              <span className="bg-muted px-2 py-0.5 rounded text-xs">
                {totalVoices} audio
              </span>
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-5 border-t border-border bg-muted/10">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Cột trái: Selector */}
            <div className="lg:col-span-5 space-y-6">
              {/* Chọn Chương */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Danh sách chương
                </h4>
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {story.chapters.map((chapter, index) => (
                    <button
                      key={chapter.chapterId}
                      onClick={() => handleChapterChange(index)}
                      className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                        selectedChapterIndex === index
                          ? "bg-primary text-primary-foreground border-primary font-medium"
                          : "bg-background hover:bg-muted border-border text-foreground"
                      }`}
                    >
                      Chương {chapter.chapterNo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn Giọng */}
              {currentChapter && currentChapter.voices.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Giọng đọc (Chương {currentChapter.chapterNo})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {currentChapter.voices.map((voice, index) => (
                      <button
                        key={voice.purchaseVoiceId}
                        onClick={() => setSelectedVoiceIndex(index)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all text-left ${
                          selectedVoiceIndex === index
                            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 ring-1 ring-blue-200"
                            : "bg-background hover:bg-muted border-border"
                        }`}
                      >
                        <Headphones className="w-4 h-4 shrink-0 opacity-70" />
                        <span className="truncate">{voice.voiceName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded-lg text-center">
                  Không có audio nào trong chương này.
                </div>
              )}
            </div>

            {/* Cột phải: Player */}
            <div className="lg:col-span-7">
              {currentChapter && currentChapter.voices[selectedVoiceIndex] ? (
                <AudioPlayer
                  voice={currentChapter.voices[selectedVoiceIndex]}
                  chapter={currentChapter}
                  storyTitle={story.storyTitle}
                  allVoices={allVoicesFlat}
                  currentIndex={currentGlobalIndex}
                  onVoiceChange={handleVoiceChange}
                  currentChapterIndex={selectedChapterIndex}
                  totalChapters={story.chapters.length}
                  onChapterChange={handleChapterChange}
                />
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-muted/20 rounded-2xl border border-dashed border-border">
                  <Headphones className="w-12 h-12 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Chọn giọng đọc để bắt đầu nghe
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
