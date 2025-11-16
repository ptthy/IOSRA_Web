import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import {
  VoiceSettings,
  voiceNames,
  speedOptions,
  getVoiceSettings,
  saveVoiceSettings,
} from "../../lib/readerSettings";

interface VoicePlayerProps {
  chapterTitle: string;
}

export function VoicePlayer({ chapterTitle }: VoicePlayerProps) {
  const [settings, setSettings] = useState<VoiceSettings>(getVoiceSettings());

  useEffect(() => {
    saveVoiceSettings(settings);
  }, [settings]);

  const togglePlay = () => {
    setSettings((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleVolumeChange = (value: number[]) => {
    setSettings((prev) => ({ ...prev, volume: value[0] }));
  };

  const handleSpeedChange = (value: string) => {
    setSettings((prev) => ({ ...prev, speed: parseFloat(value) }));
  };

  const handleVoiceChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      voice: value as VoiceSettings["voice"],
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="p-6 shadow-lg">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <p className="text-sm text-muted-foreground">
            Nghe truyện với AI Voice
          </p>
          <p className="font-semibold">{chapterTitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[settings.currentTime]}
            max={settings.duration || 100}
            step={1}
            className="w-full"
            onValueChange={(value) =>
              setSettings((prev) => ({ ...prev, currentTime: value[0] }))
            }
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(settings.currentTime)}</span>
            <span>{formatTime(settings.duration)}</span>
          </div>
        </div>

        {/* Play Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
            onClick={togglePlay}
          >
            {settings.isPlaying ? (
              <Pause className="h-6 w-6" fill="currentColor" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
            )}
          </Button>

          <Button variant="ghost" size="icon" className="h-10 w-10">
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Âm lượng</span>
            <span className="text-sm text-muted-foreground">
              {settings.volume}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[settings.volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
          </div>
        </div>

        {/* Speed and Voice Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm">Tốc độ đọc</label>
            <Select
              value={settings.speed.toString()}
              onValueChange={handleSpeedChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {speedOptions.map((speed) => (
                  <SelectItem key={speed} value={speed.toString()}>
                    {speed}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm">Giọng đọc</label>
            <Select value={settings.voice} onValueChange={handleVoiceChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(voiceNames).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center italic">
          Giọng đọc AI tự động phát hiện cảm xúc và điều chỉnh ngữ điệu
        </p>
      </div>
    </Card>
  );
}
