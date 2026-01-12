// components/AiModerationReport.tsx
/*
 * MỤC ĐÍCH CHÍNH:
 * Hiển thị báo cáo kiểm duyệt nội dung từ hệ thống AI với giao diện trực quan và phân loại chi tiết
 *
 * TÁC VỤ THỰC HIỆN:
 * 1. XỬ LÝ DỮ LIỆU AI:
 *    - Nhận kết quả kiểm duyệt từ AI backend (phản hồi tổng quan + danh sách vi phạm)
 *    - Ánh xạ tag vi phạm tiếng Anh → tên tiếng Việt + icon + màu sắc tương ứng
 *    - Trích xuất phần tiếng Việt từ phản hồi đa ngôn ngữ của AI
 *
 * 2. HIỂN THỊ THÔNG TIN:
 *    a) PHẢN HỒI TỔNG QUAN:
 *       - Hiển thị đánh giá tổng thể từ AI
 *       - Có thể ẩn/hiện tuỳ config (hideFeedback prop)
 *       - Xử lý đa ngôn ngữ, ưu tiên tiếng Việt
 *
 *    b) CHI TIẾT VI PHẠM:
 *       - Card-based UI cho từng loại vi phạm
 *       - Visual hierarchy với màu sắc phân loại
 *       - Hiển thị số lần vi phạm (count) và điểm phạt (penalty)
 *       - Trích dẫn bằng chứng (samples) từ nội dung
 *
 *    c) TRẠNG THÁI AN TOÀN:
 *       - Hiển thị thông báo "Nội dung an toàn" khi không có vi phạm
 *       - UI tích cực với màu xanh và icon check
 *
 * 3. PHÂN LOẠI VI PHẠM (8 nhóm chính):
 *    - Ngôn ngữ không hợp lệ (wrong_language)
 *    - Nội dung người lớn (sexual_*)
 *    - Bạo lực & cực đoan (violent_*, extremist_*)
 *    - Spam & rác (spam_*, url_redirect)
 *    - Chất lượng văn bản (grammar_*, weak_prose, poor_formatting)
 *    - Dữ liệu cá nhân & phạm pháp (personal_data, illegal_instruction)
 *    - Thù ghét & quấy rối (hate_speech, harassment_*, self_harm_*)
 *    - Đồng nhất nội dung (inconsistent_content)
 *
 * FLOW XỬ LÝ:
 * 1. INPUT: Nhận props từ parent component
 *    - aiFeedback: String phản hồi từ AI (có thể null)
 *    - aiViolations: Array các vi phạm chi tiết (có thể null/empty)
 *    - contentType: "truyện" | "chương" (cho thông báo contextual)
 *    - hideFeedback: Boolean ẩn phần phản hồi tổng quan
 *
 * 2. PROCESSING:
 *    a) extractVietnameseFeedback(): Lọc phần tiếng Việt từ AI feedback
 *    b) getViolationStyle(): Map tag → UI config (label, icon, color)
 *    c) Conditional rendering: Hiển thị vi phạm hoặc "an toàn"
 *
 * 3. OUTPUT: Render UI với 2 sections chính
 *    - Section 1: Phản hồi tổng quan (conditional)
 *    - Section 2: Danh sách vi phạm chi tiết
 *
 * LIÊN THÔNG VỚI CÁC FILE KHÁC:
 * 1. DEPENDENCIES:
 *    - "@/services/apiTypes": Import type AiViolation cho type safety
 *    - "@/components/ui/badge": Component hiển thị badge
 *    - "lucide-react": Icon library cho visual indicators
 *
 * 2. DATA STRUCTURE (AiViolation interface):
 *    interface AiViolation {
 *      word: string;        // Tag vi phạm (ví dụ: "sexual_explicit")
 *      count: number;       // Số lần vi phạm
 *      penalty: number;     // Điểm phạt (có thể âm/dương)
 *      samples: string[];   // Đoạn trích bằng chứng
 *    }
 *
 * 3. INTEGRATION POINTS:
 *    - Parent component: Truyền dữ liệu kiểm duyệt từ API
 *    - API service: Nhận data từ backend AI moderation
 *    - UI system: Sử dụng design system components (Badge)
 *
 * THIẾT KẾ UI/UX:
 * - Color coding: Màu sắc theo mức độ nghiêm trọng (đỏ: cao, cam: trung, xanh: thấp)
 * - Visual hierarchy: Icon → Label → Count → Samples
 * - Responsive: Grid layout với spacing hợp lý
 * - Dark mode support: Tất cả màu có dark variant
 * - Accessibility: Semantic HTML, contrast đạt chuẩn
 *
 * BUSINESS LOGIC:
 * - Penalty display: Hiển thị điểm phạt với dấu âm (-X.X ĐIỂM)
 * - Count tracking: "X lần" cho tần suất vi phạm
 * - Sample limiting: Hiển thị tất cả samples trong array
 * - Fallback handling: Style mặc định cho tag không xác định
 *
 * USE CASES:
 * 1. Admin Moderation Panel: Hiển thị chi tiết cho moderator review
 * 2. Author Dashboard: Cho tác giả xem feedback từ AI
 * 3. Content Quality Check: Đánh giá trước khi publish
 * 4. Automated Moderation: Kết quả từ hệ thống AI tự động
 */

import React from "react";
import {
  ShieldAlert,
  Languages,
  AlertTriangle,
  Fingerprint,
  Link,
  PenTool,
  BookOpen,
  FileWarning,
  Skull,
  FileText,
  SearchCode,
  CheckCircle2,
  AlertOctagon,
  HeartCrack,
  ShieldX,
  Target,
  HandMetal,
  Hammer,
  UserX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AiViolation } from "@/services/apiTypes";

/**
 * Props interface cho AiModerationReport component
 * Định nghĩa các thuộc tính đầu vào của component, giúp TypeScript kiểm tra kiểu dữ liệu
 * @property aiFeedback - Phản hồi tổng quan từ AI, có thể là string hoặc null/undefined
 * @property aiViolations - Mảng các đối tượng vi phạm chi tiết từ AI, mỗi object chứa thông tin về loại vi phạm, số lần vi phạm, và đoạn mẫu
 * @property contentType - Loại nội dung được kiểm duyệt (truyện/chương), dùng để hiển thị thông báo phù hợp
 * @property hideFeedback - Cờ ẩn/hiện phần phản hồi tổng quan, mặc định là false (hiển thị)
 */
interface AiModerationReportProps {
  aiFeedback?: string | null; // Phản hồi tổng quan từ AI
  aiViolations?: AiViolation[] | null; // Danh sách vi phạm chi tiết
  contentType?: "truyện" | "chương"; // Loại nội dung được kiểm duyệt
  hideFeedback?: boolean; // Ẩn phần phản hồi tổng quan
}

/**
 * Hàm ánh xạ loại vi phạm (label) sang thông tin hiển thị tương ứng
 * Mỗi loại vi phạm có: tên tiếng Việt, icon đại diện, và bộ màu sắc cho badge
 * Hàm này giúp tái sử dụng code và đồng nhất giao diện cho các loại vi phạm khác nhau
 * @param label - Tên tag của vi phạm (ví dụ: 'sexual_explicit', 'wrong_language')
 * @returns Object chứa {labelVn, icon, color} để hiển thị badge vi phạm
 */
const getViolationStyle = (label: string) => {
  /**
   * Dictionary ánh xạ từ tag vi phạm sang thông tin hiển thị
   * Cấu trúc: {
   *   'tag_name': {
   *     labelVn: 'Tên tiếng Việt',
   *     icon: ComponentIcon,
   *     color: 'chuỗi class Tailwind CSS'
   *   }
   * }
   * Màu sắc được chia theo nhóm vi phạm để dễ nhận biết:
   * - Đỏ: vi phạm nghiêm trọng (ngôn ngữ, cực đoan, thù ghét)
   * - Hồng: nội dung nhạy cảm, tình dục
   * - Cam: bạo lực, spam
   * - Xanh: chất lượng văn bản
   * - Tím: định dạng, đồng nhất nội dung
   * - Xám: các vi phạm khác
   */
  const styles: Record<string, { labelVn: string; icon: any; color: string }> =
    {
      // Nhóm 1: VI PHẠM NGÔN NGỮ
      wrong_language: {
        labelVn: "Ngôn ngữ không hợp lệ",
        icon: Languages,
        color:
          "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50",
      },
      // Nhóm 2: NỘI DUNG NGƯỜI LỚN & TÌNH DỤC
      sexual_explicit: {
        labelVn: "Nội dung nhạy cảm/18+",
        icon: AlertTriangle,
        color:
          "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/50",
      },
      sexual_minor: {
        labelVn: "Vi phạm an toàn trẻ em",
        icon: ShieldX,
        color:
          "bg-red-200 text-red-900 border-red-400 dark:bg-red-600/30 dark:text-red-300 dark:border-red-500",
      },
      sexual_transaction: {
        labelVn: "Giao dịch tình dục",
        icon: HeartCrack,
        color:
          "bg-rose-200 text-rose-900 border-rose-400 dark:bg-rose-600/30 dark:text-rose-300 dark:border-rose-500",
      },

      // Nhóm 3: BẠO LỰC & CỰC ĐOAN
      violent_gore: {
        labelVn: "Bạo lực & Máu me",
        icon: Skull,
        color:
          "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50",
      },
      extremist_rhetoric: {
        labelVn: "Ngôn từ cực đoan",
        icon: ShieldAlert,
        color:
          "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50",
      },

      // Nhóm 4: SPAM & NỘI DUNG RÁC
      spam_repetition: {
        labelVn: "Spam & Lặp từ ngữ",
        icon: AlertOctagon,
        color:
          "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/50",
      },
      url_redirect: {
        labelVn: "Liên kết ngoài trái phép",
        icon: Link,
        color:
          "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50",
      },

      // Nhóm 5: CHẤT LƯỢNG VĂN BẢN & TRÌNH BÀY
      grammar_spelling: {
        labelVn: "Lỗi chính tả/Trình bày",
        icon: PenTool,
        color:
          "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/50",
      },
      weak_prose: {
        labelVn: "Văn phong yếu/Lặp ý",
        icon: BookOpen,
        color:
          "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/50",
      },
      poor_formatting: {
        labelVn: "Trình bày kém (Wall of text)",
        icon: FileWarning,
        color:
          "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/50",
      },

      // Nhóm 6: DỮ LIỆU CÁ NHÂN & HÀNH VI PHẠM PHÁP
      personal_data: {
        labelVn: "Lộ thông tin cá nhân",
        icon: UserX,
        color:
          "bg-red-100 text-red-800 border-red-300 dark:bg-red-600/20 dark:text-red-400 dark:border-red-500/50",
      },
      illegal_instruction: {
        labelVn: "Hướng dẫn phi pháp",
        icon: Hammer,
        color:
          "bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-500/20 dark:text-stone-400 dark:border-stone-500/50",
      },

      // Nhóm 7: THÙ GHÉT & QUẤY RỐI
      hate_speech: {
        labelVn: "Ngôn từ thù ghét",
        icon: AlertOctagon,
        color:
          "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50",
      },
      harassment_targeted: {
        labelVn: "Quấy rối mục tiêu",
        icon: Target,
        color:
          "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/50",
      },
      self_harm_promotion: {
        labelVn: "Tự hại/Tự sát",
        icon: HeartCrack,
        color:
          "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50",
      },

      // Nhóm 8: ĐỒNG NHẤT NỘI DUNG
      inconsistent_content: {
        labelVn: "Nội dung không đồng nhất",
        icon: FileWarning,
        color:
          "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/50",
      },
    };
  /**
   * Xử lý trường hợp tag vi phạm không có trong dictionary
   * Trả về style mặc định để tránh lỗi runtime và vẫn hiển thị được thông tin
   */
  return (
    styles[label] || {
      labelVn: "Vi phạm chính sách",
      icon: ShieldAlert,
      color:
        "bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
    }
  );
};
/**
 * Hàm xử lý và trích xuất phần phản hồi bằng tiếng Việt từ chuỗi feedback
 * AI có thể trả về feedback đa ngôn ngữ, hàm này tách phần tiếng Việt để hiển thị
 * @param feedback - Chuỗi phản hồi từ AI, có thể chứa nhiều ngôn ngữ
 * @returns Chuỗi phản hồi đã được làm sạch, ưu tiên phần tiếng Việt nếu có
 */
const extractVietnameseFeedback = (feedback: string) => {
  // Kiểm tra đầu vào: nếu feedback rỗng thì trả về chuỗi rỗng
  if (!feedback) return "";

  /**
   * Logic xử lý: Tách chuỗi bằng regex tìm cụm "Tiếng việt:" hoặc "Tiếng Việt:"
   * - /i flag: không phân biệt hoa thường
   * - split(): tách thành mảng, phần tử thứ 2 (index 1) là nội dung sau từ khóa tiếng Việt
   * - trim(): loại bỏ khoảng trắng thừa ở đầu và cuối
   */
  const parts = feedback.split(/Tiếng việt:|Tiếng Việt:/i);
  // Nếu tìm thấy phần tiếng Việt, trả về phần đó, ngược lại trả về toàn bộ feedback
  return parts.length > 1 ? parts[1].trim() : feedback.trim();
};

/**
 * COMPONENT CHÍNH: AiModerationReport
 *
 * Mục đích: Hiển thị báo cáo kiểm duyệt từ AI cho nội dung (truyện/chương)
 * Cấu trúc:
 * 1. Phần phản hồi tổng quan từ AI (có thể ẩn/hiện tùy thuộc hideFeedback)
 * 2. Phần chi tiết các vi phạm với badge, số lần vi phạm, điểm phạt và đoạn mẫu
 *
 * Component nhận dữ liệu từ backend thông qua props và trình bày dưới dạng visual
 * Được sử dụng trong trang quản lý nội dung để moderator xem xét vi phạm
 */
export const AiModerationReport: React.FC<AiModerationReportProps> = ({
  aiFeedback,
  aiViolations,
  contentType = "nội dung", // Giá trị mặc định nếu không truyền
  hideFeedback = false, // Mặc định là false để các trang khác không bị ảnh hưởng
  // Mặc định hiển thị phần phản hồi
}) => {
  /**
   * PHẦN RENDER JSX
   * Component trả về cấu trúc HTML với 2 phần chính:
   * - Phản hồi tổng quan (conditional rendering)
   * - Chi tiết vi phạm (luôn hiển thị nếu có dữ liệu)
   */
  return (
    <div className="pt-6 border-t border-border mt-6 space-y-8">
      {/* ========== PHẦN 1: PHẢN HỒI TỔNG QUAN TỪ AI ========== */}
      {/* Bao bọc phần PHẢN HỒI TỔNG QUÁT bằng điều kiện hideFeedback */}
      {/* Chỉ hiển thị khi hideFeedback = false */}
      {!hideFeedback && (
        <div className="space-y-3">
          {/* Header của phần feedback với icon và tiêu đề */}
          <div className="flex items-center gap-2 text-primary dark:text-primary-foreground">
            <FileText className="h-5 w-5" />
            <h3 className="text-sm font-bold uppercase tracking-widest">
              Phản hồi tổng quát từ AI
            </h3>
          </div>
          {/* Container chứa nội dung feedback với styling nổi bật */}
          <div className="p-5 bg-blue-100/50 dark:bg-blue-900/40 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-sm">
            <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-gray-100 font-medium">
              {aiFeedback ? (
                // Gọi hàm extractVietnameseFeedback để lấy phần tiếng Việt
                extractVietnameseFeedback(aiFeedback)
              ) : (
                // Thông báo mặc định khi không có feedback
                <span className="text-muted-foreground italic">
                  Không có nhận xét chi tiết cho {contentType} này.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ========== PHẦN 2: CHI TIẾT CÁC VI PHẠM ========== */}
      <div className="space-y-4">
        {/* Header của phần vi phạm với icon cảnh báo */}
        <div className="flex items-center gap-2 text-destructive dark:text-red-400">
          <ShieldAlert className="h-5 w-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">
            Chi tiết các vi phạm
          </h3>
        </div>
        {/* 
            Logic hiển thị danh sách vi phạm:
          - Nếu có vi phạm (aiViolations tồn tại và có phần tử): hiển thị grid các card vi phạm
          - Ngược lại: hiển thị thông báo "nội dung an toàn"
        */}
        {aiViolations && aiViolations.length > 0 ? (
          <div className="grid gap-5">
            {/**
             * Duyệt qua mảng aiViolations và render card cho từng vi phạm
             * Sử dụng index làm key vì dữ liệu có thể thay đổi và không có id duy nhất
             */}
            {aiViolations.map((v, idx) => {
              // Lấy thông tin style (màu sắc, icon, tên tiếng Việt) cho loại vi phạm
              const style = getViolationStyle(v.word);
              const Icon = style.icon; // Lấy component icon từ style object
              return (
                /**
                 * Card hiển thị thông tin một vi phạm
                 * Áp dụng dynamic class từ style.color để thay đổi màu sắc theo loại vi phạm
                 */
                <div
                  key={idx}
                  className={`rounded-2xl border-2 p-5 shadow-md transition-all ${style.color}`}
                >
                  {/* HEADER CARD: Icon, tên vi phạm và thông tin số lần/điểm phạt */}
                  <div className="flex items-center justify-between mb-4">
                    {/* Phần bên trái: Icon và thông tin vi phạm */}
                    <div className="flex items-center gap-4">
                      {/* Container icon với background tương phản */}
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/40 shadow-sm">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        {/* Tên vi phạm bằng tiếng Việt */}
                        <p className="font-bold text-base uppercase tracking-tight">
                          {style.labelVn}
                        </p>
                        {/* Tag vi phạm (tên gốc) */}
                        <p className="text-[10px] font-mono opacity-80 font-bold uppercase">
                          TAG: {v.word}
                        </p>
                      </div>
                    </div>

                    {/* PHẦN BÊN PHẢI: Hiển thị số lần vi phạm và điểm phạt */}
                    <div className="flex flex-col items-end gap-1.5">
                      {/* Badge hiển thị số lần vi phạm (count) */}
                      <Badge
                        variant="outline"
                        className="border-current px-3 py-1 font-bold text-sm bg-white/20"
                      >
                        {v.count} lần
                        {/* 
                        Hiển thị điểm phạt nếu có (penalty khác 0 và không null/undefined)
                        Điểm phạt hiển thị dạng số âm (-X.X ĐIỂM)
                      */}
                      </Badge>
                      {v.penalty !== undefined &&
                        v.penalty !== null &&
                        v.penalty !== 0 && (
                          <Badge className="bg-red-600 dark:bg-red-700 text-white border-none px-4 py-1.5 text-[12px] font-bold tracking-tight shadow-md uppercase">
                            {v.penalty > 0
                              ? `-${v.penalty.toFixed(1)}`
                              : v.penalty.toFixed(1)}
                            <span className="ml-1.5">ĐIỂM</span>{" "}
                          </Badge>
                        )}
                    </div>
                  </div>
                  {/* PHẦN HIỂN THỊ BẰNG CHỨNG VI PHẠM (SAMPLES) */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase opacity-70 flex items-center gap-1.5">
                      <SearchCode className="h-4 w-4" /> BẰNG CHỨNG VI PHẠM:
                    </p>
                    {/* Grid chứa các đoạn mẫu vi phạm */}
                    <div className="grid gap-2">
                      {/**
                       * Duyệt qua mảng samples (các đoạn text vi phạm)
                       * Mỗi snippet được đặt trong quotes và có styling riêng
                       */}
                      {v.samples.map((snippet, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-white/40 dark:bg-black/40 p-3.5 rounded-xl border border-black/5 dark:border-white/10 text-[13px] font-medium italic break-words leading-relaxed shadow-inner"
                        >
                          "{snippet}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /**
           * TRƯỜNG HỢP KHÔNG CÓ VI PHẠM
           * Hiển thị thông báo tích cực với icon check và màu xanh
           */
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-3xl">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
            <p className="text-base text-emerald-700 dark:text-emerald-400 font-bold">
              Nội dung an toàn - Không phát hiện vi phạm
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
