"use client";

import React, { useState, useEffect } from "react";
import { Music } from "lucide-react";
import { toast } from "sonner";
import { moodMusicApi, Mood, Track } from "@/services/moodMusicApi";

// Import các components con
import { MoodList } from "./components/mood-list";
import { TrackList } from "./components/track-list";
import { GenerateModal } from "./components/generate-modal";

export default function MoodMusicPage() {
  // --- States ---
  const [moods, setMoods] = useState<Mood[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingMoods, setIsLoadingMoods] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Initial Load ---
  useEffect(() => {
    fetchMoods();
  }, []);

  useEffect(() => {
    if (selectedMood) {
      fetchTracks(selectedMood.moodCode);
    }
  }, [selectedMood]);

  // --- API Handlers ---
  const fetchMoods = async () => {
    try {
      setIsLoadingMoods(true);
      const data = await moodMusicApi.getMoods();
      setMoods(data);
      if (!selectedMood && data.length > 0) setSelectedMood(data[0]);
    } catch (error) {
      toast.error("Lỗi tải danh sách Mood");
    } finally {
      setIsLoadingMoods(false);
    }
  };

  const fetchTracks = async (moodCode: string) => {
    try {
      setIsLoadingTracks(true);
      const data = await moodMusicApi.getTracks(moodCode);
      setTracks(data);
    } catch (error) {
      toast.error("Lỗi tải danh sách nhạc");
    } finally {
      setIsLoadingTracks(false);
    }
  };
/**
   * Xử lý xác nhận tạo nhạc từ Modal.
   * Gọi API sáng tác và cập nhật lại danh sách bài hát ngay lập tức.
   */
  const handleCreateTrack = async (title: string, prompt: string) => {
    if (!selectedMood) return;
    try {
     toast.info("AI đang trong quá trình tạo nhạc và sẽ có thể mất khoảng 1 phút.");
      await moodMusicApi.generateTrack({
        moodCode: selectedMood.moodCode,
        title,
        prompt,
      });
      toast.success("Tạo nhạc thành công!");
      setIsModalOpen(false);
      // Refresh data
      fetchTracks(selectedMood.moodCode);
      fetchMoods(); // Update số lượng track
    } catch (error) {
      toast.error("Lỗi khi tạo nhạc.");
    }
  };

  const handleUpdateTrack = async (trackId: string, newTitle: string) => {
    try {
      await moodMusicApi.updateTrack(trackId, newTitle);
      toast.success("Đã đổi tên bài nhạc");
      
      // Cập nhật State trực tiếp để không cần load lại API (giúp UI mượt hơn)
      setTracks((prev) => 
        prev.map(t => t.trackId === trackId ? { ...t, title: newTitle } : t)
      );
    } catch (error) {
      toast.error("Lỗi khi cập nhật tên bài nhạc");
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;
    try {
      await moodMusicApi.deleteTrack(trackId);
      toast.success("Đã xóa bài nhạc");
      if (selectedMood) fetchTracks(selectedMood.moodCode);
    } catch (error) {
      toast.error("Lỗi khi xóa nhạc");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[var(--background)] text-[var(--foreground)] font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">
            AI Mood Music Generator
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Tạo nhạc nền theo bối cảnh và cảm xúc từng chương truyện.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MoodList
          moods={moods}
          selectedMood={selectedMood}
          onSelect={setSelectedMood}
          isLoading={isLoadingMoods}
        />

        <TrackList
          selectedMood={selectedMood}
          tracks={tracks}
          isLoading={isLoadingTracks}
          onGenerateClick={() => setIsModalOpen(true)}
          onDeleteTrack={handleDeleteTrack}
          onUpdateTrack={handleUpdateTrack}
        />
      </div>

      <GenerateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedMood={selectedMood}
        onConfirm={handleCreateTrack}
      />
    </div>
  );
}