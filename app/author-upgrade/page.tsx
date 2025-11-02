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

import {
  authorUpgradeService,
  ApiUpgradeStatus,
} from "@/services/authorUpgradeService";
import { useAuth } from "@/context/AuthContext";

import { Textarea } from "@/components/ui/textarea";

// Định nghĩa các trạng thái của GIAO DIỆN
type UpgradeStatus = "default" | "pending" | "rejected" | "approved";

// Kiểu dữ liệu cho state local
interface LocalUpgradeRequest {
  status: UpgradeStatus;
  submittedDate?: string;
  rejectionReason?: string;
}

// ĐỊNH NGHĨA CAM KẾT VÀ ĐIỀU KHOẢN
// ---------------------------------

// Text cam kết (để gửi đi)
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

// BỔ SUNG ĐỐI TƯỢNG CONFIG CHO STATUS BADGE
const STATUS_DISPLAY_CONFIG: {
  [key in UpgradeStatus]: {
    text: string;
    icon: React.ElementType;
    className: string;
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
  //  KHAI BÁO STATE
  // ---------------------------------
  const { user, isLoading: isAuthLoading } = useAuth(); // Lấy trạng thái auth

  // State chính quản lý trạng thái UI
  const [upgradeRequest, setUpgradeRequest] = useState<LocalUpgradeRequest>({
    status: "default",
  });

  // State loading cho lần tải trang ĐẦU TIÊN
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const [typedCommitment, setTypedCommitment] = useState("");

  // State khi đang nhấn nút "Gửi"
  const [isSubmitting, setIsSubmitting] = useState(false);

  // BIẾN SO SÁNH CAM KẾT
  const isCommitmentMatched = typedCommitment === COMMITMENT_TEXT;

  // CÁC HÀM XỬ LÝ LOGIC
  // ---------------------------------

  /**
   * Hàm map status từ API (PENDING) sang state local (pending)
   */
  const mapApiStatusToLocal = (
    apiStatus: ApiUpgradeStatus | string // Chấp nhận cả string
  ): UpgradeStatus => {
    const upperStatus = String(apiStatus).toUpperCase();

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
   * Hàm format ngày (ví dụ: "10/10/2025")
   */
  const formatDate = (dateString: string) => {
    try {
      // Dùng ngày cập nhật (updatedAt) để có ngày mới nhất
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch (e) {
      return "không rõ";
    }
  };

  /**
   * Hàm fetch trạng thái từ API, được bọc trong useCallback
   */
  const fetchUpgradeStatus = useCallback(async () => {
    setIsLoadingPage(true);
    try {
      const response = await authorUpgradeService.getMyRequests();

      // API trả về mảng, chúng ta lấy request mới nhất (giả sử là vị trí 0)
      const latestRequest = response.data[0];

      if (!latestRequest) {
        // ---- TRƯỜNG HỢP 1: CHƯA GỬI ----
        // API trả về mảng rỗng, nghĩa là chưa gửi bao giờ
        setUpgradeRequest({ status: "default" });
      } else {
        // ---- TRƯỜNG HỢP 2: ĐÃ GỬI (có 1 trong 3 trạng thái) ----
        setUpgradeRequest({
          status: mapApiStatusToLocal(latestRequest.status),
          submittedDate: formatDate(latestRequest.updatedAt), // Lấy ngày cập nhật
          rejectionReason: latestRequest.rejectionReason || undefined,
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      // Nếu lỗi là 404 (Not Found) cũng có nghĩa là chưa gửi
      if (axiosError.response?.status === 404) {
        setUpgradeRequest({ status: "default" });
      } else {
        // Lỗi mạng hoặc lỗi server khác
        console.error("Lỗi fetch trạng thái:", error);
        toast.error("Không thể tải trạng thái yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setIsLoadingPage(false);
    }
  }, []); // Không có dependency, hàm này ổn định

  /**
   * useEffect: Chạy khi component mount VÀ khi auth đã sẵn sàng
   */
  useEffect(() => {
    // Chỉ fetch khi auth đã load xong (không còn loading)
    if (!isAuthLoading) {
      if (user) {
        // Nếu user đã login, fetch trạng thái của họ
        fetchUpgradeStatus();
      } else {
        // Nếu không có user, không cần fetch, nhưng vẫn phải dừng loading
        // (Trang này có thể cho người chưa login xem form)
        setIsLoadingPage(false);
      }
    }
  }, [isAuthLoading, user, fetchUpgradeStatus]); // Chạy lại khi auth thay đổi

  /**
   * Xử lý gửi yêu cầu (khi bấm nút ở form 'default')
   */
  const handleSubmitRequest = async () => {
    // LOGIC VALIDATION
    if (!isCommitmentMatched) {
      toast.error("Vui lòng nhập chính xác câu cam kết để tiếp tục.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authorUpgradeService.submitRequest({
        commitment: COMMITMENT_TEXT,
      });

      toast.success("Yêu cầu của bạn đã được gửi thành công!");

      // Sau khi gửi thành công, fetch lại trạng thái
      // để UI tự động chuyển sang "Đang chờ duyệt"
      await fetchUpgradeStatus();
    } catch (error) {
      //   console.error("Lỗi khi gửi yêu cầu:", error);
      const axiosError = error as AxiosError; // Khai báo rõ ràng

      if (axiosError.response?.status === 429) {
        toast.error(
          "Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng **chờ vài phút** rồi thử lại."
        );
      } else {
        toast.error("Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Xử lý gửi lại yêu cầu (khi bấm nút ở form 'rejected')
   */
  const handleResubmit = () => {
    // Đơn giản là reset về trạng thái "default" để user thấy lại form
    // Và reset luôn text đã gõ
    setTypedCommitment("");
    setUpgradeRequest({ status: "default" });
  };

  /**
   * Xử lý điều hướng đến trang sáng tác (Giữ nguyên)
   */
  const handleStartWriting = () => {
    toast.success("Chào mừng bạn đến với thế giới sáng tác !");
    // router.push("/dashboard/create-story")
  };

  /**
   * Màn hình Loading chính (khi đang fetch trạng thái lần đầu)
   */
  if (isLoadingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải trạng thái...</p>
        </div>
      </div>
    );
  }

  /**
   * Render nội dung chính khi đã có trạng thái
   */

  // LẤY CONFIG CHO STATUS HIỆN TẠI
  const currentStatusConfig = STATUS_DISPLAY_CONFIG[upgradeRequest.status];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-background">
      <div className="w-full max-w-3xl space-y-4">
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
                    <span>Xuất bản truyện và tiếp cận hàng triệu độc giả</span>
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
                          <li key={itemIdx} className="flex items-start gap-2">
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

                {/* Ô nhập liệu */}
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
                // CẬP NHẬT ĐIỀU KIỆN DISABLED
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

              {/* Trạng thái hiện tại (giữ nguyên) */}
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
                  <strong className="text-foreground">Lưu ý:</strong> Bạn có thể
                  tiếp tục sử dụng nền tảng như bình thường trong thời gian chờ
                  duyệt. Khi được phê duyệt, bạn sẽ nhận được email thông báo và
                  có thể bắt đầu xuất bản truyện ngay lập tức.
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
                      Đảm bảo tài khoản tuân thủ đầy đủ điều khoản của nền tảng
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
                  bạn có thắc mắc về lý do từ chối, vui lòng liên hệ đội ngũ hỗ
                  trợ qua email:{" "}
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
              <Button onClick={handleStartWriting} className="w-full h-11">
                <BookOpen className="mr-2 h-4 w-4" />
                Bắt đầu Sáng Tác
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
