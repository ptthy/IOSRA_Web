"use client";

import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Thêm Input
import { 
  Play, Pause, Trash2, Sparkles, Music, Loader2, 
  Edit2, Check, X // Thêm icon Edit, Check, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Mood, Track } from "@/services/moodMusicApi";

interface TrackListProps {
  selectedMood: Mood | null;
  tracks: Track[];
  isLoading: boolean;
  onGenerateClick: () => void;
  onDeleteTrack: (trackId: string) => void;
  onUpdateTrack: (trackId: string, newTitle: string) => Promise<void>; // Thêm prop này
}

export function TrackList({ 
  selectedMood, 
  tracks, 
  isLoading, 
  onGenerateClick, 
  onDeleteTrack,
  onUpdateTrack 
}: TrackListProps) {
  
  // State quản lý việc bài nào đang được phát (ID) để đổi icon Play/Pause
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Edit State
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    stopAudio();
    cancelEdit(); // Reset edit khi đổi mood
  }, [selectedMood]);

  /**
   * Logic điều khiển trình phát nhạc.
   * Nếu bấm bài đang phát -> Dừng.
   * Nếu bấm bài khác -> Chuyển nguồn (src) và phát bài mới.
   */
  const togglePlay = (track: Track) => {
    if (playingTrackId === track.trackId) {
      stopAudio();
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.publicUrl;
        audioRef.current.play();
        setPlayingTrackId(track.trackId);
      }
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingTrackId(null);
  };

  // Edit Logic
  const startEdit = (track: Track) => {
    setEditingTrackId(track.trackId);
    setEditTitle(track.title);
  };

  const cancelEdit = () => {
    setEditingTrackId(null);
    setEditTitle("");
  };

  const saveEdit = async (trackId: string) => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    await onUpdateTrack(trackId, editTitle);
    setIsSaving(false);
    setEditingTrackId(null);
  };

  return (
    <Card className="md:col-span-3 min-h-[500px]">
      <audio ref={audioRef} onEnded={() => setPlayingTrackId(null)} />

      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            {selectedMood?.moodName || "Chọn Mood"}
            {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
          </CardTitle>
          <CardDescription>{selectedMood?.description}</CardDescription>
        </div>

        <Button
          onClick={onGenerateClick}
          disabled={!selectedMood}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Tạo nhạc AI mới
        </Button>
      </CardHeader>

      <CardContent>
        {!selectedMood ? (
          <div className="text-center py-20 text-[var(--muted-foreground)]">
            Vui lòng chọn một Mood bên trái để xem danh sách nhạc.
          </div>
        ) : tracks.length === 0 && !isLoading ? (
          <div className="text-center py-20 flex flex-col items-center">
            <Music className="w-16 h-16 text-[var(--muted)] mb-4" />
            <p className="text-[var(--muted-foreground)]">Chưa có bài nhạc nào cho tâm trạng này.</p>
            <Button variant="link" onClick={onGenerateClick}>
              Hãy tạo bài đầu tiên ngay!
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tracks.map((track) => (
              <div
                key={track.trackId}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md",
                  playingTrackId === track.trackId
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                    : "bg-[var(--card)] border-[var(--border)]"
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Nút Play */}
                  <button
                    onClick={() => togglePlay(track)}
                    className={cn(
                      "w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center transition-colors",
                      playingTrackId === track.trackId
                        ? "bg-blue-600 text-white shadow-lg scale-105"
                        : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-blue-100 dark:hover:bg-blue-900"
                    )}
                  >
                    {playingTrackId === track.trackId ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-1" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    {/* LOGIC HIỂN THỊ: INPUT hoặc TEXT */}
                    {editingTrackId === track.trackId ? (
                      <div className="flex items-center gap-2 max-w-md">
                        <Input 
                          value={editTitle} 
                          onChange={(e) => setEditTitle(e.target.value)}
                          disabled={isSaving}
                          autoFocus
                          className="h-9"
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => saveEdit(track.trackId)}
                          disabled={isSaving}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={cancelEdit}
                          disabled={isSaving}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h4 className={cn("font-semibold text-lg truncate", playingTrackId === track.trackId && "text-blue-600")}>
                          {track.title}
                        </h4>
                        <div className="text-sm text-[var(--muted-foreground)] flex gap-3">
                          <span>{track.durationSeconds}s</span>
                          <span>•</span>
                          <span>{new Date(track.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Các nút thao tác (chỉ hiện khi KHÔNG edit) */}
                {editingTrackId !== track.trackId && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(track)}
                      className="text-[var(--muted-foreground)] hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteTrack(track.trackId)}
                      className="text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}