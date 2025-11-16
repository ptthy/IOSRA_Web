import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import {
  VoiceSettings,
  voiceNames,
  speedOptions,
  getVoiceSettings,
  saveVoiceSettings,
} from "../../lib/readerSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface VoicePlayerBarProps {
  chapterTitle: string;
}

export function VoicePlayerBar({ chapterTitle }: VoicePlayerBarProps) {
  const [settings, setSettings] = useState<VoiceSettings>(getVoiceSettings());

  useEffect(() => {
    saveVoiceSettings(settings);
  }, [settings]);

  const togglePlay = () => {
    setSettings((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-card/95 backdrop-blur-md border-b border-border/50 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Play Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  currentTime: Math.max(0, prev.currentTime - 10),
                }))
              }
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-md"
              onClick={togglePlay}
            >
              {settings.isPlaying ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  currentTime: Math.min(prev.duration, prev.currentTime + 10),
                }))
              }
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground min-w-[40px]">
              {formatTime(settings.currentTime)}
            </span>
            <Slider
              value={[settings.currentTime]}
              max={settings.duration || 100}
              step={1}
              className="flex-1"
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, currentTime: value[0] }))
              }
            />
            <span className="text-xs font-mono text-muted-foreground min-w-[40px]">
              {formatTime(settings.duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Volume */}
            <div className="hidden lg:flex items-center gap-2 min-w-[120px]">
              <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Slider
                value={[settings.volume]}
                max={100}
                step={1}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, volume: value[0] }))
                }
                className="w-20"
              />
            </div>

            {/* Speed */}
            <Select
              value={settings.speed.toString()}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, speed: parseFloat(value) }))
              }
            >
              <SelectTrigger className="w-[70px] h-8">
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

            {/* Voice */}
            <Select
              value={settings.voice}
              onValueChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  voice: value as VoiceSettings["voice"],
                }))
              }
            >
              <SelectTrigger className="w-[100px] h-8">
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
      </div>
    </div>
  );
}
