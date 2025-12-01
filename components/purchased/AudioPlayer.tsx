//components/purchased/AudioPlayer.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { VoiceItem, ChapterItem } from "@/services/chapterPurchaseService";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Base URL R2
const AUDIO_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev/";

interface AudioPlayerProps {
  voice: VoiceItem;
  chapter: ChapterItem;
  storyTitle: string;
  allVoices: VoiceItem[];
  currentIndex: number;
  onVoiceChange: (index: number) => void;
  currentChapterIndex: number;
  totalChapters: number;
  onChapterChange: (chapterIndex: number) => void;
}

export function AudioPlayer({
  voice,
  chapter,
  storyTitle,
  allVoices,
  currentIndex,
  onVoiceChange,
  currentChapterIndex,
  totalChapters,
  onChapterChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);

  // Helper ghép link
  const getFullAudioUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${AUDIO_BASE_URL}${cleanPath}`;
  };

  // Tạo hiệu ứng sóng nhạc ngẫu nhiên
  useEffect(() => {
    const bars = Array.from({ length: 20 }, () => Math.random() * 100);
    setWaveform(bars);
  }, [voice.purchaseVoiceId]);

  useEffect(() => {
    if (audioRef.current) {
      setIsPlaying(false);
      setCurrentTime(0);
      audioRef.current.src = getFullAudioUrl(voice.audioUrl);
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [voice.purchaseVoiceId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentIndex < allVoices.length - 1) {
        onVoiceChange(currentIndex + 1);
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentIndex, allVoices.length, onVoiceChange, voice.audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleRewind = () => {
    if (audioRef.current)
      audioRef.current.currentTime = Math.max(0, currentTime - 10);
  };

  const handleFastForward = () => {
    if (audioRef.current)
      audioRef.current.currentTime = Math.min(duration, currentTime + 10);
  };

  const handlePrevious = () => {
    if (currentChapterIndex > 0) onChapterChange(currentChapterIndex - 1);
  };

  const handleNext = () => {
    if (currentChapterIndex < totalChapters - 1)
      onChapterChange(currentChapterIndex + 1);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      audioRef.current.muted = newMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const changeSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const nextSpeed =
      speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-1 transition-all duration-500 ease-in-out shadow-xl overflow-hidden relative group/player",
        // Background tổng thể: Xám xanh (Light) / Tối (Dark)
        "bg-slate-500/20 dark:bg-slate-900/50 backdrop-blur-md border border-white/10",
        isExpanded
          ? "fixed inset-4 z-50 bg-slate-800 dark:bg-black"
          : "relative w-full h-full"
      )}
    >
      {/* Nền gradient nhẹ phía sau để tạo chiều sâu */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-black/40 pointer-events-none"></div>

      {/* Main Content */}
      <div className="relative h-full flex flex-col justify-between p-6 md:p-8">
        <audio ref={audioRef} preload="metadata" />

        {/* Nút mở rộng */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-3 right-3 p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors z-10"
        >
          {isExpanded ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>

        {/* --- INFO CARD (Cục Elegant màu be) --- */}
        <div className="w-full bg-[#E0E5DF] dark:bg-[#1e293b] rounded-2xl p-6 md:p-10 shadow-inner mb-8 flex flex-col items-center justify-center text-center transition-colors duration-300">
          {/* Tên truyện */}
          <h3 className="text-xl md:text-2xl font-bold text-[#1e3a5f] dark:text-slate-100 mb-2 tracking-tight">
            {storyTitle}
          </h3>

          {/* Tên chương */}
          <p className="text-sm md:text-base text-[#334155] dark:text-slate-300 font-medium mb-4 line-clamp-1">
            {chapter.chapterNo > 0 ? `Chương ${chapter.chapterNo}: ` : ""}
            {chapter.chapterTitle}
          </p>

          {/* Thông tin giọng đọc */}
          <div className="flex items-center gap-2 text-xs md:text-sm text-[#64748b] dark:text-slate-400 mb-8 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
            <Mic className="w-3.5 h-3.5" />
            <span>{voice.voiceName}</span>
          </div>

          {/* Sóng nhạc tinh tế (Thay thế đĩa quay) */}
          <div className="flex items-end justify-center gap-1.5 h-8 w-full max-w-[200px]">
            {waveform.map((height, i) => (
              <div
                key={i}
                className="w-1 bg-[#475569] dark:bg-slate-400 rounded-full transition-all duration-300"
                style={{
                  height: `${
                    isPlaying
                      ? Math.max(20, height * (0.4 + Math.random() * 0.6))
                      : 20
                  }%`,
                  opacity: isPlaying ? 0.8 : 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* --- CONTROLS SECTION --- */}
        <div className="w-full max-w-3xl mx-auto space-y-6 px-2">
          {/* Thanh tiến trình */}
          <div className="space-y-2 group">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="cursor-pointer h-1.5"
            />
            <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Các nút điều khiển chính */}
          <div className="flex items-center justify-center gap-6 md:gap-10">
            {/* Nút lùi chương */}
            <ControlButton
              onClick={handlePrevious}
              disabled={currentChapterIndex === 0}
            >
              <SkipBack className="w-5 h-5" fill="currentColor" />
            </ControlButton>

            {/* Tua lại */}
            <ControlButton onClick={handleRewind} className="hidden sm:flex">
              <RotateCcw className="w-5 h-5" />
            </ControlButton>

            {/* Play/Pause - Nút tròn lớn nổi bật */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-[#1e3a5f] hover:bg-[#2a4d7a] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            {/* Tua đi */}
            <ControlButton
              onClick={handleFastForward}
              className="hidden sm:flex"
            >
              <RotateCw className="w-5 h-5" />
            </ControlButton>

            {/* Nút tới chương */}
            <ControlButton
              onClick={handleNext}
              disabled={currentChapterIndex === totalChapters - 1}
            >
              <SkipForward className="w-5 h-5" fill="currentColor" />
            </ControlButton>
          </div>

          {/* Footer: Tốc độ & Âm lượng */}
          <div className="flex items-center justify-between pt-2">
            {/* Nút tốc độ */}
            <button
              onClick={changeSpeed}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-slate-200/50 dark:bg-white/5 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 w-10 text-center"
            >
              {playbackSpeed}x
            </button>

            {/* Thanh âm lượng */}
            <div className="flex items-center gap-3 w-32 md:w-40 group">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <div className="flex-1 relative h-1 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="h-full bg-slate-600 dark:bg-blue-400 transition-all duration-150"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component nút nhỏ (Small Control Button) - Tối giản
function ControlButton({ onClick, disabled, children, className }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center bg-slate-200/50 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}
