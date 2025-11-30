"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";
import { Mood } from "@/services/moodMusicApi";

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMood: Mood | null;
  onConfirm: (title: string, prompt: string) => Promise<void>;
}

export function GenerateModal({ isOpen, onClose, selectedMood, onConfirm }: GenerateModalProps) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onConfirm(title, prompt);
    setIsGenerating(false);
    // Reset form sau khi xong
    setTitle("");
    setPrompt("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isGenerating && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Sáng tác nhạc AI ({selectedMood?.moodName})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tiêu đề bài nhạc</label>
            <Input
              placeholder="VD: Piano nhẹ nhàng..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Mô tả cho AI (Prompt) <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Mô tả bằng Tiếng Anh (VD: lo-fi style, slow tempo...)"
              className="h-32"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Hủy
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !title || !prompt}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang sáng tác...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Tạo nhạc ngay
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}