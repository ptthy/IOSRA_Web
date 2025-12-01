"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mood } from "@/services/moodMusicApi";

interface MoodListProps {
  moods: Mood[];
  selectedMood: Mood | null;
  onSelect: (mood: Mood) => void;
  isLoading: boolean;
}

export function MoodList({ moods, selectedMood, onSelect, isLoading }: MoodListProps) {
  return (
    <Card className="md:col-span-1 h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Thể loại nhạc</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          moods.map((mood) => (
            <button
              key={mood.moodCode}
              onClick={() => onSelect(mood)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-all flex justify-between items-center border",
                selectedMood?.moodCode === mood.moodCode
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md"
                  : "hover:bg-[var(--muted)] border-transparent bg-[var(--card)]"
              )}
            >
              <span className="font-medium">{mood.moodName}</span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  selectedMood?.moodCode === mood.moodCode
                    ? "bg-white/20"
                    : "bg-[var(--muted)]"
                )}
              >
                {mood.trackCount}
              </span>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}