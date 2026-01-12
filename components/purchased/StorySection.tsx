//components/purchased/StorySection.tsx

/* 
================================================================================
StorySection là cha, AudioPlayer là con

StorySection quản lý state và cung cấp dữ liệu cho AudioPlayer

AudioPlayer xử lý phát audio và báo events ngược lại qua callbacks
Parent Component (//app/purchased-stories/page.tsx)
    ↓ (truyền story data)
StorySection (quản lý selection state)
    ↓ (truyền selected data + callbacks)
AudioPlayer (xử lý phát audio)
    ↑ (gọi callbacks khi có sự kiện)
StorySection (cập nhật state)
================================================================================

1. MỤC ĐÍCH CHÍNH:
   - Component hiển thị thông tin một truyện với chế độ accordion (mở/đóng)
   - Quản lý việc lựa chọn chương và giọng đọc trong một truyện
   - Container wrapper cho AudioPlayer, cung cấp dữ liệu và xử lý logic chuyển đổi
   - Hiển thị danh sách chapter và voice cho người dùng chọn

2. CHỨC NĂNG CHÍNH:
   a. Accordion Layout:
      - Header: Hiển thị thông tin tổng quan (tên truyện, số chương, số audio)
      - Content: Hiển thị khi mở, chia 2 cột (selector + player)
   
   b. Quản lý State:
      - Theo dõi chương đang chọn (selectedChapterIndex)
      - Theo dõi giọng đọc đang chọn trong chương (selectedVoiceIndex)
      - Trạng thái mở/đóng accordion (isExpanded)
   
   c. Xử lý Logic:
      - Flatten voices: Biến cấu trúc nested (chapters → voices) thành mảng phẳng
      - Tính toán index toàn cục (global index) để AudioPlayer có thể chuyển tiếp liên tục
      - Xử lý chuyển đổi giữa chương và giọng đọc
   
   d. Giao diện Selector:
      - Danh sách chương dạng button grid
      - Danh sách giọng đọc theo chương hiện tại
      - Highlight item đang được chọn

3. INPUT/OUTPUT:
   - NHẬN (Input Props):
     * story: StoryItem - Object chứa toàn bộ thông tin truyện
       - storyTitle: string
       - chapters: ChapterItem[] (mỗi chapter có voices: VoiceItem[])
   
   - XỬ LÝ (Processing):
     * Flatten voices: story.chapters.flatMap(ch => ch.voices)
     * Tính global index: tổng voices của chapters trước + index trong chapter hiện tại
     * Xử lý chuyển chapter: reset voice index về 0
     * Xử lý chuyển voice: tìm chapter chứa voice dựa trên global index
   
   - TRẢ VỀ (Output):
     * JSX: Giao diện accordion với selectors và AudioPlayer
     * Cung cấp dữ liệu cho AudioPlayer qua props
     * Không có callback ra ngoài (chỉ nhận props, không emit events)

4. LIÊN KẾT VỚI COMPONENT KHÁC:
   - SỬ DỤNG: AudioPlayer.tsx (render bên trong)
   - CUNG CẤP DỮ LIỆU CHO: AudioPlayer (qua props)
   - PHỤ THUỘC VÀO:
     * services/chapterPurchaseService.ts (types: StoryItem, VoiceItem)
     * ./AudioPlayer.tsx
     * lucide-react (icons)

5. THUẬT TOÁN QUAN TRỌNG:
   a. Flatten Voices:
      allVoicesFlat = chapters.flatMap(ch => ch.voices)
      Mục đích: Biến cấu trúc 2D thành 1D để AudioPlayer có thể chuyển tiếp liên tục
   
   b. Tính Global Index:
      currentGlobalIndex = sum(voices of chapters before current) + selectedVoiceIndex
      Công thức: chapters.slice(0, selectedChapterIndex).reduce(sum) + selectedVoiceIndex
   
   c. Tìm Chapter từ Global Index (handleVoiceChange):
      Duyệt từng chapter, cộng dồn số voices
      Khi tổng > globalIndex => chapter chứa voice cần tìm
      Cập nhật selectedChapterIndex và selectedVoiceIndex tương ứng

6. ĐIỀU KIỆN HIỂN THỊ:
   - Accordion mở: Hiển thị đầy đủ selectors và AudioPlayer
   - Accordion đóng: Chỉ hiển thị header
   - Khi không có voice nào: Hiển thị placeholder "Chọn giọng đọc để bắt đầu nghe"
   - Khi chapter không có voices: Hiển thị "Không có audio nào trong chương này"

7. RESPONSIVE DESIGN:
   - Desktop (lg:): Grid 12 cột (5 cột selector + 7 cột player)
   - Mobile: Stack vertical

================================================================================
*/
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, Headphones } from "lucide-react";
import { StoryItem, VoiceItem } from "@/services/chapterPurchaseService";
import { AudioPlayer } from "./AudioPlayer";
/**
 * Interface định nghĩa props cho StorySection
 * - story: Thông tin truyện bao gồm các chương và giọng đọc
 */
interface StorySectionProps {
  story: StoryItem;
}
/**
 * Component StorySection chính
 * - Hiển thị thông tin một truyện với accordion
 * - Cho phép chọn chương và giọng đọc
 * - Chứa AudioPlayer để phát audio
 */
export function StorySection({ story }: StorySectionProps) {
  // State quản lý trạng thái mở/đóng accordion
  const [isExpanded, setIsExpanded] = useState(false);
  // State quản lý chương được chọn (index trong mảng chapters)
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  // State quản lý giọng đọc được chọn trong chương hiện tại
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  // Lấy chương hiện tại dựa trên selectedChapterIndex
  const currentChapter = story.chapters[selectedChapterIndex];
  /**
   * Làm phẳng (flatten) tất cả giọng đọc của tất cả chương
   * - Biến đổi mảng 2D (chapters → voices) thành mảng 1D
   * - Giúp AudioPlayer có thể chuyển tiếp liên tục qua các chương
   */
  const allVoicesFlat: VoiceItem[] = story.chapters.flatMap((ch) => ch.voices);

  /**
   * Tính index toàn cục của giọng đọc hiện tại
   * - Dùng để AudioPlayer biết vị trí hiện tại trong danh sách tất cả giọng đọc
   * - Công thức: tổng giọng đọc của các chương trước + index trong chương hiện tại
   */
  const currentGlobalIndex =
    story.chapters
      .slice(0, selectedChapterIndex)
      .reduce((sum, ch) => sum + ch.voices.length, 0) + selectedVoiceIndex;
  /**
   * Xử lý khi AudioPlayer thay đổi giọng đọc (qua next/prev hoặc khi kết thúc audio)
   * @param newGlobalIndex Index toàn cục mới
   */
  const handleVoiceChange = (newGlobalIndex: number) => {
    let count = 0;
    // Duyệt qua từng chương để tìm chương chứa giọng đọc có index toàn cục này
    for (let i = 0; i < story.chapters.length; i++) {
      const chapterVoiceCount = story.chapters[i].voices.length;
      // Nếu index toàn cục nằm trong khoảng giọng đọc của chương này
      if (count + chapterVoiceCount > newGlobalIndex) {
        setSelectedChapterIndex(i); // Cập nhật chương được chọn
        setSelectedVoiceIndex(newGlobalIndex - count); // Tính index trong chương
        return;
      }
      count += chapterVoiceCount;
    }
  };
  /**
   * Xử lý khi người dùng chuyển chương
   * @param newChapterIndex Index của chương mới
   */
  const handleChapterChange = (newChapterIndex: number) => {
    setSelectedChapterIndex(newChapterIndex);
    setSelectedVoiceIndex(0); // Reset về giọng đọc đầu tiên của chương mới
  };
  // Tính tổng số giọng đọc của toàn bộ truyện
  const totalVoices = allVoicesFlat.length;
  {
    /* Header Accordion - Phần có thể click để mở/đóng */
  }
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header Accordion */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-card p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Icon truyện */}
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          {/* Thông tin truyện */}
          <div className="text-left">
            <h2 className="font-bold text-lg text-foreground">
              {story.storyTitle}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {/* Badge hiển thị số chương */}
              <span className="bg-muted px-2 py-0.5 rounded text-xs">
                {story.chapters.length} chương
              </span>
              <span>•</span>
              {/* Badge hiển thị tổng số audio */}
              <span className="bg-muted px-2 py-0.5 rounded text-xs">
                {totalVoices} audio
              </span>
            </p>
          </div>
        </div>
        {/* Icon mũi tên chỉ hướng mở/đóng */}
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Nội dung chi tiết (hiển thị khi accordion mở) */}
      {isExpanded && (
        <div className="p-5 border-t border-border bg-muted/10">
          {/* Layout grid 2 cột trên desktop */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Cột trái: Selector chương và giọng đọc */}
            <div className="lg:col-span-5 space-y-6">
              {/* Chọn Chương */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Danh sách chương
                </h4>
                {/* Danh sách chương dạng button */}
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

              {/* Selector giọng đọc (chỉ hiện nếu chương có giọng đọc) */}
              {currentChapter && currentChapter.voices.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Giọng đọc (Chương {currentChapter.chapterNo})
                  </h4>
                  {/* Grid 2 cột hiển thị giọng đọc */}
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
                // Thông báo nếu chương không có giọng đọc
                <div className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded-lg text-center">
                  Không có audio nào trong chương này.
                </div>
              )}
            </div>

            {/* Cột phải: Player */}
            <div className="lg:col-span-7">
              {/* Hiển thị AudioPlayer nếu có giọng đọc được chọn */}
              {currentChapter && currentChapter.voices[selectedVoiceIndex] ? (
                <AudioPlayer
                  // Truyền giọng đọc hiện tại
                  voice={currentChapter.voices[selectedVoiceIndex]}
                  // Truyền chương hiện tại
                  chapter={currentChapter}
                  // Truyền tiêu đề truyện
                  storyTitle={story.storyTitle}
                  // Truyền danh sách tất cả giọng đọc (đã flatten)
                  allVoices={allVoicesFlat}
                  // Truyền index toàn cục hiện tại
                  currentIndex={currentGlobalIndex}
                  // Callback khi thay đổi giọng đọc từ AudioPlayer
                  onVoiceChange={handleVoiceChange}
                  // Truyền index chương hiện tại
                  currentChapterIndex={selectedChapterIndex}
                  // Truyền tổng số chương
                  totalChapters={story.chapters.length}
                  // Callback khi thay đổi chương từ AudioPlayer
                  onChapterChange={handleChapterChange}
                />
              ) : (
                // Placeholder khi chưa có giọng đọc nào được chọn
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
