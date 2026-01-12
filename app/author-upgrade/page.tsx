//app/author-upgrade/page.tsx

/* 
MỤC ĐÍCH: Trang đăng ký trở thành Tác giả LẦN ĐẦU (cho user chưa là tác giả)
CHỨC NĂNG CHÍNH:
- Form đăng ký với điều khoản và cam kết (copy text)
- Hiển thị 4 trạng thái: default, pending, rejected, approved
- Xử lý tự động refresh token khi được approved
- Handle rate limiting (429) với thông báo thời gian chờ
- Parse lý do từ chối từ backend format đặc biệt

KHÁC BIỆT VỚI author/author-upgrade-rank/page.tsx:
- Trang này: Đăng ký LÀM TÁC GIẢ lần đầu (từ reader → author)
- Trang kia: NÂNG CẤP HẠNG TÁC GIẢ (từ Casual → Bronze → Gold → Diamond)

LOGIC FLOW:
1. User chưa là tác giả → vào trang này
2. Gửi yêu cầu → status: pending
3. Admin duyệt → status: approved → tự động refresh token
4. Nếu bị từ chối → status: rejected → hiện lý do → có thể gửi lại

QUAN HỆ VỚI HỆ THỐNG:
- Service: @/services/authorUpgradeService
- Auth: @/context/AuthContext (lấy user, refresh token)
- API: /author-upgrade/request (POST), /author-upgrade/my-requests (GET)
*/
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Clock,
  XCircle,
  CheckCheck,
  Send,
  BookOpen,
  Sparkles,
  Loader2,
  FileText,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { AxiosError } from "axios";
// THÊM IMPORT profileService
import { profileService } from "@/services/profileService";
import {
  authorUpgradeService,
  ApiUpgradeStatus,
} from "@/services/authorUpgradeService";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
/**
 * ĐỊNH NGHĨA TRẠNG THÁI GIAO DIỆN (UI STATUS)
 * LÝ DO KHÔNG DÙNG TRỰC TIẾP API STATUS:
 * - API dùng uppercase ("PENDING") nhưng UI muốn lowercase ("pending")
 * - Tách biệt concern: API layer và UI layer
 * - Dễ mapping và xử lý hiển thị (có thêm "default" state)
 * - Type safety: TypeScript kiểm tra giá trị hợp lệ
 */
type UpgradeStatus = "default" | "pending" | "rejected" | "approved";

/**
 * INTERFACE CHO STATE LOCAL CỦA REQUEST
 * Bao gồm các thông tin cần thiết cho UI:
 * - status: trạng thái hiển thị (UI Status)
 * - submittedDate: ngày gửi (đã format vi-VN)
 * - rejectionReason: lý do từ chối (nếu có, đã parse từ content)
 */
interface LocalUpgradeRequest {
  status: UpgradeStatus;
  submittedDate?: string;
  rejectionReason?: string;
}
/**
 * ĐỊNH NGHĨA CAM KẾT VÀ ĐIỀU KHOẢN
 * ---------------------------------
 * LÝ DO ĐẶT CONST NGOÀI COMPONENT:
 * - Tái sử dụng: dùng ở nhiều nơi (validation, display)
 * - Dễ chỉnh sửa: thay đổi content ở 1 chỗ
 * - Tách biệt logic và content
 * - Tránh hardcode string trong component
 */

// Text cam kết (để gửi đi) - user phải gõ lại chính xác
const COMMITMENT_TEXT =
  "Tôi đã đọc và đồng ý với điều khoản, quy định của Tora Novel. Tôi cam kết tuân thủ các quy tắc về nội dung, bản quyền và xây dựng cộng đồng lành mạnh.";

// Điều khoản Tora Novel
const TERMS_AND_CONDITIONS = [
  {
    title: "1. Quy định về Nội dung",
    items: [
      "Tác phẩm phải là sáng tác gốc hoặc có đầy đủ bản quyền hợp pháp",
      "Không xuất bản nội dung vi phạm pháp luật, bạo lực, khiêu dâm",
      "Tôn trọng bản quyền tác giả và không đạo văn",
    ],
  },
  {
    title: "2. Cam kết Chất lượng",
    items: [
      "Duy trì chất lượng nội dung và cập nhật đều đặn",
      "Sử dụng ngôn ngữ phù hợp, không chứa từ ngữ thô tục quá mức",
      "Tuân thủ hướng dẫn định dạng và biên tập của nền tảng",
    ],
  },
  {
    title: "3. Quyền và Trách nhiệm",
    items: [
      "Tác giả giữ bản quyền tác phẩm của mình",
      "Nền tảng có quyền hiển thị, quảng bá tác phẩm",
      "Chịu trách nhiệm về toàn bộ nội dung đã xuất bản",
    ],
  },
];

/**
 * CONFIG OBJECT CHO STATUS BADGE HIỂN THỊ
 * LÝ DO DÙNG CONFIG OBJECT:
 * - Tập trung hóa config: màu sắc, icon, className
 * - Tránh code điều kiện rải rác (if-else trong JSX)
 * - Dễ thêm status mới: chỉ cần thêm vào object
 * - Dễ chỉnh sửa style: thay đổi ở 1 chỗ
 */
const STATUS_DISPLAY_CONFIG: {
  [key in UpgradeStatus]: {
    text: string; // Text hiển thị
    icon: React.ElementType; // Icon component
    className: string; // CSS classes cho badge
  };
} = {
  default: {
    text: "Chưa gửi yêu cầu",
    icon: FileText,
    className: "bg-muted text-muted-foreground border-border",
  },
  pending: {
    text: "Đang chờ duyệt",
    icon: Clock,
    className:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
  },
  rejected: {
    text: "Bị từ chối",
    icon: XCircle,
    className:
      "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30",
  },
  approved: {
    text: "Đã duyệt",
    icon: CheckCheck,
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700",
  },
};

export default function AuthorUpgradePage() {
  const searchParams = useSearchParams();
  /**
   * XỬ LÝ ERROR MESSAGE TỪ URL PARAM (redirect từ trang khác)
   * LÝ DO:
   * - Khi redirect từ trang khác (ví dụ: middleware) có thể truyền error message qua URL
   * - Dùng searchParams.get() để lấy message
   * - Hiển thị toast và xóa khỏi URL để tránh hiển thị lại khi refresh
   */
  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      toast.error(message);
      // Xóa message khỏi URL sau khi hiển thị (clean URL)
      window.history.replaceState({}, "", "/author-upgrade");
    }
  }, [searchParams]);

  // ================ STATE DECLARATIONS ================

  /**
   * STATE CHÍNH QUẢN LÝ TRẠNG THÁI UI
   */
  const { user, isLoading: isAuthLoading, refreshAndUpdateUser } = useAuth();
  const router = useRouter(); // Mặc định chưa gửi yêu cầu

  // ---------------------
  // State chính quản lý trạng thái UI
  const [upgradeRequest, setUpgradeRequest] = useState<LocalUpgradeRequest>({
    status: "default",
  });

  // State loading cho lần tải trang ĐẦU TIÊN
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  /**
   * Thêm flag để tránh fetch lại khi đã fetch xong
   * LÝ DO QUAN TRỌNG:
   * - Tránh infinite loop trong useEffect
   * - Chỉ fetch khi thực sự cần (chưa fetch hoặc force fetch)
   * - Tối ưu performance
   */
  const [hasFetched, setHasFetched] = useState(false);

  const [typedCommitment, setTypedCommitment] = useState("");

  // State khi đang nhấn nút "Gửi"
  const [isSubmitting, setIsSubmitting] = useState(false);
  /**
   * Hàm xử lý lỗi từ API một cách thống nhất
   * Tương tự như file trước nhưng đặt trong component này để độc lập
   */
  const handleApiError = (error: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic từ Backend
    if (error.response && error.response.data && error.response.data.error) {
      const { message, details } = error.response.data.error;

      // Ưu tiên Validation (details)
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          // Nối các lỗi lại thành 1 câu
          const msg = details[firstKey].join(" ");
          toast.error(msg);
          return;
        }
      }

      // Message từ Backend
      if (message) {
        toast.error(message);
        return;
      }
    }

    // 2. Fallback
    const fallbackMsg = error.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // -------------------
  // BIẾN SO SÁNH CAM KẾT
  const isCommitmentMatched = typedCommitment === COMMITMENT_TEXT;
  const { updateUser } = useAuth();

  // ================ EFFECTS ================

  /**
   * EFFECT QUAN TRỌNG: TỰ ĐỘNG REFRESH TOKEN KHI REQUEST ĐƯỢC APPROVED
   * LÝ DO CẦN REFRESH TOKEN:
   * - Khi user được approve làm tác giả, backend sẽ cấp token mới có role "author"
   * - Token cũ chỉ có role "user" → không vào được trang /author/*
   * - Cần refresh token ngay lập tức để user có quyền tác giả
   *
   * FLOW:
   * 1. Khi status = "approved" và user chưa có role author
   * 2. Gọi refreshAndUpdateUser() → fetch token mới từ backend
   * 3. Update AuthContext với token mới (có role author)
   * 4. Redirect về trang author overview
   */
  useEffect(() => {
    if (upgradeRequest.status === "approved") {
      // Kiểm tra xem token hiện tại đã có role author chưa
      const hasAuthorRole =
        user?.roles?.includes("author") || user?.isAuthorApproved;

      // Nếu chưa có, gọi API lấy token mới ngay lập tức
      // Nếu chưa có role author → refresh token
      if (!hasAuthorRole) {
        console.log("Đã duyệt -> Refresh token để lấy quyền Tác giả...");
        refreshAndUpdateUser().then(() => {
          toast.success("Chúc mừng! Bạn đã là Tác giả.");
          // Chuyển hướng ngay sau khi có token mới
          router.push("/author/overview");
        });
      }
    }
  }, [upgradeRequest.status, user, refreshAndUpdateUser, router]);

  // ================ HELPER FUNCTIONS ================

  /**
   * HÀM PARSE LÝ DO TỪ CHỐI TỪ TRƯỜNG 'content' CỦA BACKEND
   * LÝ DO CẦN PARSE:
   * - Backend lưu lý do từ chối trong field 'content' với format đặc biệt: "[REJECT_REASON]: lý do"
   * - Cần tách riêng lý do để hiển thị đẹp trên UI
   * - Nếu không có marker → return undefined
   *
   * @param content - String từ backend (có thể chứa marker)
   * @returns string | undefined - Lý do đã được tách (hoặc undefined)
   */
  const parseRejectionReason = (content: string): string | undefined => {
    const reasonMarker = "[REJECT_REASON]:";
    const index = content.indexOf(reasonMarker);

    if (index === -1) {
      return undefined; // Không tìm thấy marker
    }

    // Lấy phần text ĐẰNG SAU marker và xóa khoảng trắng
    const reason = content.substring(index + reasonMarker.length).trim();

    // Trả về reason nếu nó có nội dung
    return reason.length > 0 ? reason : undefined;
  };
  /**
   * HÀM MAP STATUS TỪ API (UPPERCASE) SANG STATE LOCAL (lowercase)
   * LOGIC MAPPING:
   * - "PENDING" → "pending"
   * - "REJECTED" → "rejected"
   * - "APPROVED" → "approved"
   * - Khác → "default"
   *
   * @param apiStatus - Status từ API (string, có thể là ApiUpgradeStatus)
   * @returns UpgradeStatus - Status đã được map cho UI
   */
  const mapApiStatusToLocal = (
    apiStatus: ApiUpgradeStatus | string // Chấp nhận cả string
  ): UpgradeStatus => {
    const upperStatus = String(apiStatus).toUpperCase(); // Đảm bảo uppercase

    switch (upperStatus) {
      case "PENDING":
        return "pending";
      case "REJECTED":
        return "rejected";
      case "APPROVED":
        return "approved";
      default:
        return "default";
    }
  };
  /**
   * HÀM FORMAT DATE THEO ĐỊNH DẠNG VIỆT NAM
   * @param dateString - String date từ API (ISO format)
   * @returns string - Date đã format "dd/MM/yyyy"
   */
  const formatDate = (dateString: string) => {
    try {
      // Dùng ngày cập nhật (updatedAt) để có ngày mới nhất
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch (e) {
      return "không rõ"; // Fallback nếu parse lỗi
    }
  };

  /**
   * HÀM FETCH TRẠNG THÁI TỪ API
   * @param force - Nếu true, fetch lại ngay cả khi đã fetch rồi
   *
   * FLOW:
   * 1. Check flag hasFetched để tránh fetch nhiều lần
   * 2. Gọi API getMyRequests() → trả về array các request
   * 3. Lấy request mới nhất (index 0 sau khi sort)
   * 4. Parse rejectionReason từ content field
   * 5. Map API status → UI status
   * 6. Update state
   *
   * LÝ DO DÙNG useCallback:
   * - Tránh tạo hàm mới mỗi lần render
   * - Tránh infinite loop trong useEffect (dependency thay đổi)
   */
  const fetchUpgradeStatus = useCallback(
    async (force: boolean = false) => {
      // Optimization: Nếu đã fetch và không force → không fetch lại
      if (hasFetched && !force) return;

      setIsLoadingPage(true);
      try {
        // 1. Gọi API - trả về array các request
        const response = await authorUpgradeService.getMyRequests();
        // 2. Lấy request mới nhất (giả sử API trả về theo thứ tự mới nhất đầu tiên)
        const latestRequest = response.data[0];
        if (!latestRequest) {
          // 3. Không có request nào → set default
          setUpgradeRequest({ status: "default" });
        } else {
          // 4. Parse lý do từ chối từ content field
          const reason = parseRejectionReason(latestRequest.content);
          // 5. Map API status sang UI status
          const mappedStatus = mapApiStatusToLocal(latestRequest.status);
          // 6. Update state với thông tin đầy đủ
          setUpgradeRequest({
            status: mappedStatus,
            submittedDate: formatDate(latestRequest.createdAt),
            rejectionReason: reason || undefined,
          });
        }

        setHasFetched(true); // Đánh dấu đã fetch
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          // 404 nghĩa là chưa có request nào -> default state
          setUpgradeRequest({ status: "default" });
          setHasFetched(true); // Vẫn đánh dấu đã fetch
        } else {
          handleApiError(error, "Không thể tải trạng thái yêu cầu.");
        }
      } finally {
        setIsLoadingPage(false);
      }
    },
    [hasFetched, handleApiError]
  ); // Dependency: chỉ chạy lại khi hasFetched thay đổi

  /**
   * useEffect: CHẠY KHI COMPONENT MOUNT VÀ AUTH ĐÃ SẴN SÀNG
   * LOGIC:
   * 1. Chờ auth loading xong (isAuthLoading = false)
   * 2. Nếu có user và chưa fetch → fetch data
   * 3. Nếu không có user (chưa login) → chỉ set loading false
   *
   * Optimization: Chỉ fetch khi user.id thay đổi (tránh fetch nhiều lần)
   */
  useEffect(() => {
    if (!isAuthLoading && user && !hasFetched) {
      fetchUpgradeStatus();
    } else if (!isAuthLoading && !user) {
      setIsLoadingPage(false); // Không có user, không cần fetch
    }
  }, [isAuthLoading, user?.id, hasFetched, fetchUpgradeStatus]); // Chỉ phụ thuộc vào user.id

  // ================ EVENT HANDLERS ================

  /**
   * XỬ LÝ GỬI YÊU CẦU (Khi bấm nút ở form 'default')
   * FLOW CHI TIẾT:
   * 1. Validate: user đã login? đã gõ đúng cam kết?
   * 2. Set loading state (isSubmitting = true)
   * 3. Gọi API submitRequest với commitment text
   * 4. Xử lý thành công: toast, force fetch lại data
   * 5. Xử lý lỗi đặc biệt: rate limit (429) với thông báo thời gian
   * 6. Xử lý lỗi khác: dùng helper handleApiError
   */
  const handleSubmitRequest = async () => {
    // 1. VALIDATION
    if (!user) {
      toast.error("Bạn cần đăng nhập để thực hiện đăng ký.");
      return;
    }
    if (!isCommitmentMatched) {
      toast.error("Vui lòng nhập chính xác câu cam kết để tiếp tục.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. GỬI API
      await authorUpgradeService.submitRequest({
        commitment: COMMITMENT_TEXT,
      });
      // 3. THÀNH CÔNG
      toast.success("Yêu cầu của bạn đã được gửi thành công!");
      // 4. FORCE FETCH LẠI để lấy trạng thái mới (pending)
      await fetchUpgradeStatus(true);
    } catch (error) {
      const axiosError = error as AxiosError;
      // 5. XỬ LÝ LỖI RATE LIMIT (429) ĐẶC BIỆT
      if (axiosError.response?.status === 429) {
        // Backend trả về message: "Too many requests. Try again in X hours/days"
        const errorData = axiosError.response?.data as any;
        const errorMessage = errorData?.error?.message || "";
        // Regex extract số giờ/ngày từ message
        const hoursMatch = errorMessage.match(/(\d+)\s*hour/);
        const daysMatch = errorMessage.match(/(\d+)\s*day/);

        if (hoursMatch) {
          const hours = hoursMatch[1];
          toast.error(
            `Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng chờ ${hours} giờ nữa trước khi thử lại.`
          );
        } else if (daysMatch) {
          const days = daysMatch[1];
          toast.error(
            `Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng chờ ${days} ngày nữa trước khi thử lại.`
          );
        } else {
          toast.error(
            "Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng chờ một thời gian trước khi thử lại."
          );
        }
      } else {
        // 6. CÁC LỖI KHÁC DÙNG HELPER CHUẨN
        handleApiError(
          error,
          "Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * XỬ LÝ GỬI LẠI YÊU CẦU (Khi bấm nút ở form 'rejected')
   * LOGIC ĐƠN GIẢN:
   * 1. Reset state về "default" (hiện lại form ban đầu)
   * 2. Reset typedCommitment về rỗng
   * 3. User có thể gửi lại yêu cầu mới
   */
  const handleResubmit = () => {
    if (!user) {
      toast.error("Bạn cần đăng nhập để thực hiện thao tác này.");

      return;
    }
    // Reset về trạng thái ban đầu
    // Đơn giản là reset về trạng thái "default" để user thấy lại form
    // Và reset luôn text đã gõ
    setTypedCommitment("");
    setUpgradeRequest({ status: "default" });
  };

  // ================ UI RENDERING ================

  /**
   * LẤY CONFIG CHO STATUS HIỆN TẠI ĐỂ HIỂN THỊ BADGE
   */
  const currentStatusConfig =
    STATUS_DISPLAY_CONFIG[upgradeRequest.status] ||
    STATUS_DISPLAY_CONFIG["default"];
  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-background">
        <div className="w-full max-w-7xl space-y-4">
          {/* BỔ SUNG "CỤC" HIỂN THỊ TRẠNG THÁI HIỆN TẠI */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Trạng thái:
            </span>
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border ${currentStatusConfig.className}`}
            >
              <currentStatusConfig.icon className="h-4 w-4" />
              <span>{currentStatusConfig.text}</span>
            </div>
          </div>

          {/* =================================================== */}
          {/* Trạng thái 1: Chưa gửi yêu cầu (Default)            */}
          {/* =================================================== */}
          {upgradeRequest.status === "default" && (
            <Card className="shadow-xl">
              <CardHeader className="space-y-4 text-center pb-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle>Đăng ký trở thành Tác giả</CardTitle>
                  <CardDescription>
                    Chia sẻ câu chuyện của bạn với hàng triệu độc giả trên nền
                    tảng Tora Novel
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Lợi ích */}
                <div className="bg-muted rounded-lg p-5 space-y-3">
                  <p className="text-sm">
                    <strong>Quyền lợi khi trở thành Tác giả:</strong>
                  </p>
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>
                        Xuất bản truyện và tiếp cận hàng triệu độc giả
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Kiếm thu nhập từ tác phẩm của bạn</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Công cụ quản lý và thống kê chuyên nghiệp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Hỗ trợ từ đội ngũ biên tập viên</span>
                    </li>
                  </ul>
                </div>

                {/* Điều khoản */}
                <div className="space-y-4">
                  <Label>Điều khoản và Quy định</Label>
                  <div className="bg-card rounded-lg p-5 border border-border max-h-[300px] overflow-y-auto space-y-4">
                    {TERMS_AND_CONDITIONS.map((section, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className="text-sm">
                          <strong>{section.title}</strong>
                        </p>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                          {section.items.map((item, itemIdx) => (
                            <li
                              key={itemIdx}
                              className="flex items-start gap-2"
                            >
                              <span className="text-primary mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Yêu cầu gõ cam kết (THAY THẾ BẰNG) */}
                <div className="space-y-4">
                  <Label
                    htmlFor="commitment-input"
                    className="text-base font-semibold"
                  >
                    Xác nhận Cam kết
                  </Label>
                  {/* Hướng dẫn: Hiển thị câu mẫu */}
                  <div className="bg-muted border border-border rounded-lg p-4 text-sm font-medium">
                    <p className="text-muted-foreground">
                      Để xác nhận, vui lòng gõ lại chính xác câu sau vào ô bên
                      dưới:
                    </p>
                    <p className="mt-2 text-primary">{COMMITMENT_TEXT}</p>
                  </div>

                  {/* Ô nhập liệu với validation realtime */}
                  <Textarea
                    id="commitment-input"
                    placeholder="Gõ lại câu cam kết tại đây..."
                    value={typedCommitment}
                    onChange={(e) => setTypedCommitment(e.target.value)}
                    disabled={isSubmitting}
                    rows={4}
                    className={`
                    text-sm leading-relaxed
                    ${
                      isCommitmentMatched
                        ? "border-green-500 focus-visible:ring-green-500 dark:border-green-400 dark:focus-visible:ring-green-400"
                        : typedCommitment.length > 0
                        ? "border-destructive focus-visible:ring-destructive dark:border-destructive/70 dark:focus-visible:ring-destructive/70"
                        : ""
                    }
                  `}
                  />
                  {/* Thông báo lỗi/thành công nhỏ */}
                  {typedCommitment.length > 0 && (
                    <p
                      className={`text-xs ${
                        isCommitmentMatched
                          ? "text-green-600 dark:text-green-400"
                          : "text-destructive dark:text-destructive/70"
                      }`}
                    >
                      {isCommitmentMatched
                        ? "✓ Đã trùng khớp!"
                        : "Câu cam kết chưa trùng khớp."}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  onClick={handleSubmitRequest} // Gắn hàm thật
                  // CẬP NHẬT ĐIỀU KIỆN DISABLED: chỉ enable khi gõ đúng cam kết
                  disabled={isSubmitting || !isCommitmentMatched}
                  className="w-full h-11"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi yêu cầu...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Gửi Yêu Cầu
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* =================================================== */}
          {/* Trạng thái 2: Đang chờ duyệt (Pending)             */}
          {/* =================================================== */}
          {upgradeRequest.status === "pending" && (
            <Card className="shadow-xl">
              <CardHeader className="space-y-6 text-center pb-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <CardTitle>Yêu cầu đang được xét duyệt</CardTitle>
                  <CardDescription>
                    {/* Lấy ngày từ state */}
                    Bạn đã gửi yêu cầu vào ngày {upgradeRequest.submittedDate}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Thông tin thời gian */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 text-center space-y-2">
                  <p className="text-sm">
                    Thời gian xét duyệt thường từ{" "}
                    <strong>2-5 ngày làm việc</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chúng tôi sẽ thông báo qua email khi có kết quả
                  </p>
                </div>

                {/* Trạng thái hiện tại với timeline */}
                <div className="bg-muted rounded-lg p-5 space-y-3">
                  <p className="text-sm">
                    <strong>Trạng thái hiện tại:</strong>
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      <span className="text-muted-foreground">
                        Yêu cầu đã được tiếp nhận
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      <span className="text-muted-foreground">
                        Đội ngũ OperationMod đang xem xét hồ sơ
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      <span className="text-muted-foreground">
                        Chờ phê duyệt cuối cùng
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lưu ý (giữ nguyên) */}
                <div className="bg-card rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Lưu ý:</strong> Bạn có
                    thể tiếp tục sử dụng nền tảng như bình thường trong thời
                    gian chờ duyệt. Khi được phê duyệt, bạn sẽ nhận được email
                    thông báo và có thể bắt đầu xuất bản truyện ngay lập tức.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* =================================================== */}
          {/* Trạng thái 3: Đã bị từ chối (Rejected)              */}
          {/* =================================================== */}
          {upgradeRequest.status === "rejected" && (
            <Card className="shadow-xl">
              <CardHeader className="space-y-6 text-center pb-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-destructive">
                    Yêu cầu đã bị từ chối
                  </CardTitle>
                  <CardDescription>
                    {/* Lấy ngày từ state */}
                    Đội ngũ OperationMod đã xem xét vào ngày{" "}
                    {upgradeRequest.submittedDate}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Lý do từ chối */}
                <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-5 space-y-3">
                  <p className="text-sm text-destructive">
                    <strong>Lý do từ chối:</strong>
                  </p>
                  <p className="text-sm text-destructive/90 leading-relaxed">
                    {/* Lấy lý do từ state */}
                    {upgradeRequest.rejectionReason || "Không có lý do cụ thể."}
                  </p>
                </div>

                {/* Gợi ý cải thiện (giữ nguyên) */}
                <div className="bg-muted rounded-lg p-5 space-y-3">
                  <p className="text-sm">
                    <strong>💡 Hướng dẫn để được phê duyệt:</strong>
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">1.</span>
                      <span>Đọc kỹ lý do từ chối và khắc phục vấn đề</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">2.</span>
                      <span>
                        Tham gia đọc và tương tác với cộng đồng tích cực hơn
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">3.</span>
                      <span>
                        Đảm bảo tài khoản tuân thủ đầy đủ điều khoản của nền
                        tảng
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">4.</span>
                      <span>Gửi lại yêu cầu khi đã đáp ứng đủ điều kiện</span>
                    </li>
                  </ul>
                </div>

                {/* Thông tin hỗ trợ (giữ nguyên) */}
                <div className="bg-card rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Cần hỗ trợ?</strong> Nếu
                    bạn có thắc mắc về lý do từ chối, vui lòng liên hệ đội ngũ
                    hỗ trợ qua email:{" "}
                    <strong className="text-foreground">
                      support@toranovel.com
                    </strong>
                  </p>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button onClick={handleResubmit} className="w-full h-11">
                  <Send className="mr-2 h-4 w-4" />
                  Gửi lại Yêu Cầu Mới
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* =================================================== */}
          {/* Trạng thái 4: Đã được duyệt (Approved)              */}
          {/* =================================================== */}
          {upgradeRequest.status === "approved" && (
            <Card className="shadow-xl relative overflow-hidden">
              {/* Hiệu ứng (giữ nguyên) */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              <div className="absolute top-8 right-8 text-primary/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="absolute bottom-8 left-8 text-primary/20">
                <Sparkles className="w-5 h-5" />
              </div>

              <CardHeader className="space-y-6 text-center pb-6 relative z-10">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCheck className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle>Chúc mừng! Bạn đã chính thức là Tác giả</CardTitle>
                  <CardDescription>
                    Tài khoản của bạn đã được nâng cấp thành công
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 relative z-10">
                {/* Thông báo thành công */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center space-y-2">
                  <p className="text-sm">
                    {/* Lấy ngày từ state */}🎉 Được phê duyệt vào ngày{" "}
                    {upgradeRequest.submittedDate}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bây giờ bạn có thể tạo và xuất bản truyện của riêng mình
                  </p>
                </div>

                {/* Các bước tiếp theo (giữ nguyên) */}
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <p className="text-sm">
                    <strong>Các bước tiếp theo:</strong>
                  </p>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">1.</span>
                      <span>Tạo truyện mới và thiết lập thông tin cơ bản</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">2.</span>
                      <span>Viết và xuất bản chương đầu tiên</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">3.</span>
                      <span>Quảng bá tác phẩm đến độc giả</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">4.</span>
                      <span>Theo dõi thống kê và tương tác với độc giả</span>
                    </li>
                  </ol>
                </div>
              </CardContent>

              <CardFooter className="pt-2 relative z-10">
                <Button
                  onClick={() => router.push("/author/overview")}
                  className="w-full h-11"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Vào trang quản lý ngay
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
