// app/author/story/[id]/ai-result/page.tsx
/*
MỤC ĐÍCH: Trang kết quả đánh giá kiểm duyệt AI cho truyện cụ thể
CHỨC NĂNG CHÍNH:
1. Hiển thị báo cáo chi tiết kết quả đánh giá tự động của AI cho một truyện cụ thể
2. Hiển thị điểm số AI (0-10), kết quả (Đạt/Không đạt) và phản hồi chi tiết
3. Phân loại trạng thái truyện: 
   - approved (đã duyệt): published hoặc completed
   - rejected (bị từ chối): status = rejected hoặc điểm AI < 5
   - pending (chờ xét duyệt thủ công): không thuộc 2 nhóm trên
4. Hiển thị thông tin phê duyệt thủ công từ Content Moderator (nếu có)
5. Hiển thị chi tiết các vi phạm nếu có (sử dụng component AiModerationReport)
6. Cung cấp nút điều hướng quản lý chương nếu truyện đã được phê duyệt
ĐỐI TƯỢNG SỬ DỤNG: Tác giả (Author) muốn xem kết quả kiểm duyệt AI cho truyện của mình
FLOW XỬ LÝ CHÍNH:
1. Lấy storyId từ URL params
2. Gọi API để lấy chi tiết truyện với đầy đủ thông tin AI
3. Xác định trạng thái hiển thị (approved/rejected/pending) dựa trên status và aiScore
4. Hiển thị báo cáo chi tiết với giao diện tương ứng
5. Hiển thị violations nếu có
*/
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCheck,
  Clock,
  XCircle,
  ArrowRight,
  Quote,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { storyService } from "@/services/storyService";
import type { Story } from "@/services/apiTypes";
import { AiModerationReport } from "@/components/AiModerationReport";

/**
 * HÀM TRÍCH XUẤT PHẦN FEEDBACK TIẾNG VIỆT TỪ CHUỖI FEEDBACK AI:
 * @param feedback - Chuỗi feedback từ AI (có thể chứa cả tiếng Anh và tiếng Việt)
 * @returns Chuỗi feedback chỉ chứa phần tiếng Việt, hoặc null nếu không tìm thấy
 *
 * LOGIC XỬ LÝ:
 * - Feedback từ AI có thể chứa cả tiếng Anh và tiếng Việt, phân cách bằng marker
 * - Hàm tìm marker "Tiếng việt:" hoặc "Tiếng Việt:" để lấy phần tiếng Việt
 * - Nếu không tìm thấy marker tiếng Việt nhưng có marker "English:" thì trả về null (chỉ có tiếng Anh)
 * - Nếu không có marker nào thì giả sử toàn bộ feedback là tiếng Việt
 *
 * VÍ DỤ INPUT/OUTPUT:
 * - Input: "English: Good story. Tiếng Việt: Truyện rất hay."
 * - Output: "Truyện rất hay."
 * - Input: "This story needs improvement." (không có marker)
 * - Output: null (không hiển thị)
 */
const extractVietnameseFeedback = (
  feedback: string | null | undefined
): string | null => {
  if (!feedback) return null;
  // Các marker có thể có trong feedback để đánh dấu phần tiếng Việt
  const vietnameseMarkers = ["Tiếng việt:", "Tiếng Việt:"];
  let foundIndex = -1;
  let markerLength = 0;

  // Duyệt qua các marker để tìm vị trí bắt đầu của phần tiếng Việt
  for (const marker of vietnameseMarkers) {
    const index = feedback.indexOf(marker);
    if (index !== -1) {
      foundIndex = index;
      markerLength = marker.length;
      break;
    }
  }
  // Nếu tìm thấy marker tiếng Việt, cắt từ vị trí đó đến hết
  if (foundIndex !== -1)
    return feedback.substring(foundIndex + markerLength).trim();
  // Nếu có marker tiếng Anh nhưng không có tiếng Việt → không hiển thị
  if (feedback.includes("English:")) return null;
  // Mặc định: coi toàn bộ là tiếng Việt
  return feedback;
};

/**
 * Component chính: Trang hiển thị kết quả đánh giá AI cho truyện
 * Logic chính:
 * 1. Lấy storyId từ URL params
 * 2. Gọi API để lấy chi tiết truyện
 * 3. Phân loại trạng thái truyện (approved/rejected/pending)
 * 4. Hiển thị báo cáo chi tiết với giao diện tương ứng
 */
export default function AIResultPage() {
  /**
   * HOOKS VÀ STATE:
   * - useParams: Lấy storyId từ URL dynamic route [id]
   * - useRouter: Để điều hướng về dashboard hoặc chapters
   * - story: State lưu thông tin chi tiết của truyện (với AI data)
   * - isLoading: State quản lý loading khi fetch data
   */
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * useEffect ĐỂ TẢI THÔNG TIN TRUYỆN KHI storyId THAY ĐỔI:
   * Chạy mỗi khi storyId thay đổi (khi user vào trang khác nhau)
   * Dependency array [storyId] -> chạy lại khi storyId thay đổi
   */
  useEffect(() => {
    loadStory();
  }, [storyId]);

  /**
   * HÀM TẢI THÔNG TIN TRUYỆN TỪ API:
   * 1. Bật trạng thái loading
   * 2. Gọi API getStoryDetails với storyId (lấy đầy đủ thông tin bao gồm AI data)
   * 3. Lưu dữ liệu vào state story
   * 4. Xử lý lỗi nếu có (console.error)
   * 5. Tắt loading dù thành công hay thất bại (finally)
   */
  const loadStory = async () => {
    setIsLoading(true);
    try {
      const data = await storyService.getStoryDetails(storyId);
      setStory(data);
    } catch (error) {
      console.error("Error loading story:", error);
      // Có thể thêm toast error nếu cần
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Hiển thị loading spinner khi đang tải dữ liệu
   */
  if (isLoading)
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  /**
   * HIỂN THỊ THÔNG BÁO LỖI NẾU KHÔNG TÌM THẤY TRUYỆN
   * Có thể xảy ra khi: storyId không hợp lệ, truyện đã bị xóa, hoặc user không có quyền truy cập
   */
  if (!story)
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">
          Không tìm thấy thông tin kết quả đánh giá.
        </p>
        <Button onClick={() => router.push("/author/overview")}>
          Quay lại Dashboard
        </Button>
      </div>
    );

  /**
   * TÍNH TOÁN CÁC BIẾN ĐỂ XÁC ĐỊNH TRẠNG THÁI HIỂN THỊ:
   * - aiScore: Điểm AI (0-10), mặc định 0 nếu không có
   * - isApproved: Truyện đã published hoặc completed (được phê duyệt)
   * - isRejected: Bị từ chối (status = rejected) HOẶC điểm AI < 5 và không published
   * - isPending: Không thuộc 2 trạng thái trên (chờ xét duyệt thủ công)
   *
   * LOGIC PHÂN LOẠI QUAN TRỌNG:
   * 1. Ưu tiên status trước: nếu published/completed -> approved
   * 2. Nếu rejected -> rejected
   * 3. Nếu điểm AI < 5 -> rejected (trừ khi đã published)
   * 4. Còn lại -> pending (cần moderator review thủ công)
   */
  const aiScore = story.aiScore ?? 0; // Fallback 0 nếu undefined/null
  const isApproved =
    story.status === "published" || story.status === "completed";
  const isRejected =
    story.status === "rejected" ||
    (aiScore < 5 && story.status !== "published"); // Điểm <5 và chưa published
  const isPending = !isApproved && !isRejected;

  // Kết quả ngắn gọn: "Đạt" nếu điểm >= 5, ngược lại "Không đạt"
  const shortResult = story.aiResult || (aiScore >= 5 ? "Đạt" : "Không đạt");

  // Trích xuất feedback tiếng Việt để hiển thị (nếu có)
  const displayFeedback = extractVietnameseFeedback(
    story.aiFeedback || story.aiMessage // Có thể từ aiFeedback hoặc aiMessage
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 px-4 md:px-0">
      {/* Header trang với tiêu đề và tên truyện */}
      <div className="border-b pb-4">
        <h1 className="text-3xl mb-2 font-bold tracking-tight">
          BÁO CÁO KIỂM DUYỆT CHI TIẾT
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Tác phẩm:{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {story.title}
          </span>
        </p>
      </div>

      {/* 
        HIỂN THỊ CARD TRẠNG THÁI TƯƠNG ỨNG:
        - isApproved: Card màu xanh lá (emerald)
        - isRejected: Card màu đỏ (red)
        - isPending: Card màu vàng cam (amber)
        Sử dụng component StatusCard tách biệt để tái sử dụng logic UI
      */}
      {isApproved && (
        <StatusCard
          type="emerald"
          icon={
            <CheckCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          }
          title="Tác phẩm đã được phê duyệt"
          description="Truyện của bạn đã vượt qua hệ thống kiểm duyệt AI và được xuất bản."
          story={story}
          aiScore={aiScore}
          shortResult={shortResult}
          displayFeedback={displayFeedback}
        />
      )}

      {isRejected && (
        <StatusCard
          type="red"
          icon={
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          }
          title="Tác phẩm bị từ chối"
          description="Nội dung vi phạm tiêu chuẩn cộng đồng hoặc không đạt điểm chất lượng tối thiểu."
          story={story}
          aiScore={aiScore}
          shortResult={shortResult}
          displayFeedback={displayFeedback}
        />
      )}

      {isPending && (
        <StatusCard
          type="amber"
          icon={
            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          }
          title="Đang chờ xét duyệt thủ công"
          description="Hệ thống cần thêm sự xem xét từ đội ngũ kiểm duyệt viên."
          story={story}
          aiScore={aiScore}
          shortResult={shortResult}
          displayFeedback={displayFeedback}
        />
      )}
      {/* 
         HIỂN THỊ BÁO CÁO VI PHẠM AI NẾU CÓ:
        - Chỉ hiển thị khi story.aiViolations có dữ liệu (array không rỗng)
        - Sử dụng component AiModerationReport tách biệt để hiển thị chi tiết violations
        - hideFeedback={true}: Ẩn phần feedback vì đã hiển thị ở trên trong StatusCard
      */}
      {story.aiViolations && story.aiViolations.length > 0 && (
        <div className="mt-8">
          <AiModerationReport
            aiViolations={story.aiViolations}
            contentType="truyện"
            hideFeedback={true} // Ẩn phần feedback vì đã hiển thị ở trên
          />
        </div>
      )}
      {/* Footer với các nút điều hướng */}
      <div className="flex justify-between items-center pt-6">
        {/* Nút quay lại Dashboard */}
        <Button
          onClick={() => router.push("/author/overview")}
          variant="ghost"
          className="dark:text-slate-300"
        >
          Quay lại Dashboard
        </Button>

        {/* 
          Nút quản lý chương - CHỈ HIỆN KHI TRUYỆN ĐÃ APPROVED
          Điều hướng đến trang quản lý chapters của truyện này
        */}
        {isApproved && (
          <Button
            onClick={() => router.push(`/author/story/${storyId}/chapters`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
          >
            Quản lý Chương <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * LOCAL COMPONENT: StatusCard
 * Hiển thị card thông tin trạng thái với UI tương ứng (approved/rejected/pending)
 *
 * PROPS:
 * - type: Loại card (emerald/red/amber) → quyết định màu sắc theme
 * - icon: Icon hiển thị (CheckCheck, XCircle, Clock)
 * - title: Tiêu đề card
 * - description: Mô tả ngắn
 * - story: Thông tin truyện (để lấy moderatorStatus, moderatorNote)
 * - aiScore: Điểm AI (0-10)
 * - shortResult: Kết quả ngắn gọn (Đạt/Không đạt)
 * - displayFeedback: Feedback đã được xử lý (chỉ tiếng Việt)
 */
function StatusCard({
  type,
  icon,
  title,
  description,
  story,
  aiScore,
  shortResult,
  displayFeedback,
}: any) {
  /**
   * CONFIG MÀU SẮC THEO TYPE:
   * Mỗi type có border, background và accent color riêng
   * Tạo object config để dễ quản lý và tái sử dụng
   */
  const configs = {
    emerald: {
      border: "border-emerald-500/40 dark:border-emerald-500/20",
      bgHeader: "bg-emerald-50/50 dark:bg-emerald-950/30",
      bgContent: "bg-white dark:bg-slate-900/50",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    red: {
      border: "border-red-500/40 dark:border-red-500/20",
      bgHeader: "bg-red-50/50 dark:bg-red-950/30",
      bgContent: "bg-white dark:bg-slate-900/50",
      accent: "text-red-600 dark:text-red-400",
    },
    amber: {
      border: "border-amber-500/40 dark:border-amber-500/20",
      bgHeader: "bg-amber-50/50 dark:bg-amber-950/30",
      bgContent: "bg-white dark:bg-slate-900/50",
      accent: "text-amber-600 dark:text-amber-400",
    },
  }[type as "emerald" | "red" | "amber"];

  return (
    <Card
      className={`border-2 shadow-lg overflow-hidden ${configs.border} dark:bg-slate-900`}
    >
      {/* Header card với icon và mô tả */}

      <CardHeader
        className={`flex flex-row items-center gap-6 py-8 border-b ${configs.bgHeader}`}
      >
        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-inner">
          {icon}
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold dark:text-slate-100">
            {title}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
            {description}
          </CardDescription>
        </div>
      </CardHeader>

      {/* Nội dung card với 2 cột: AI và Moderator */}
      <CardContent className={`p-8 ${configs.bgContent}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          {/* CỘT TRÁI: THÔNG TIN TỪ HỆ THỐNG AI */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">
              <Quote className="w-4 h-4" /> Đánh giá từ hệ thống AI
            </div>
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* CỘT TRÁI: THÔNG TIN TỪ HỆ THỐNG AI */}
              <div className="p-6 h-[130px] flex flex-col justify-center border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-black ${configs.accent}`}>
                    {aiScore.toFixed(2)}
                    {/* Hiển thị 2 chữ số thập phân */}
                  </span>
                  <span className="text-slate-400 font-medium text-xl">
                    / 10.00
                  </span>
                </div>
                {/* Có thể bật lại phần trạng thái nếu cần */}
                {/* <div className="text-sm font-bold mt-2 text-slate-600 dark:text-slate-400">
                  TRẠNG THÁI:{" "}
                  <span className="text-slate-900 dark:text-slate-100 uppercase tracking-tighter">
                    {shortResult}
                  </span>
                </div> */}
              </div>
              {/* Phần dưới: Feedback chi tiết */}
              <div className="p-6 flex-1 bg-white/50 dark:bg-transparent">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{displayFeedback || "Không có nhận xét chi tiết bổ sung."}"
                </p>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN PHÊ DUYỆT THỦ CÔNG TỪ CONTENT MODERATOR */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">
              <UserCheck className="w-4 h-4" /> Phê duyệt thủ công
            </div>
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Phần trên: Trạng thái duyệt từ moderator */}
              <div className="p-6 h-[130px] flex flex-col justify-center border-b border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                  Trạng thái duyệt
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {story.moderatorStatus || "Không có"}
                </div>
              </div>
              {/* Phần dưới: Ghi chú từ kiểm duyệt viên */}
              <div className="p-6 flex-1 bg-white/50 dark:bg-transparent">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">
                  Ghi chú từ kiểm duyệt viên
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                  {story.moderatorNote ||
                    "Không có ghi chú cụ thể nào từ Content Mod đến bạn."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
