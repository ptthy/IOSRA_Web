//app/email-change-modal/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Mail, ShieldCheck, Clock, RefreshCw } from "lucide-react";

import { profileService } from "@/services/profileService";

export default function EmailChangePage() {
  const router = useRouter();
  const { user, updateUser, isLoading: authIsLoading } = useAuth();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [imageError, setImageError] = useState(false);
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
  const ERROR_IMG_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

  useEffect(() => {
    if (!authIsLoading && !user) {
      router.push("/login");
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [user, authIsLoading, router, timerInterval]);

  const handleSendOTP = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Vui lòng nhập email hợp lệ");
      return;
    }

    setIsLoading(true);
    if (timerInterval) clearInterval(timerInterval);

    try {
      await profileService.requestEmailChange(newEmail);

      toast.success("Mã OTP đã được gửi đến email mới");
      setStep("otp");
      setCountdown(300);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimerInterval(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerInterval(timer);
      // } catch (err: any) {
      //   console.error("Error sending OTP:", err);
      //   toast.error(err.response?.data?.message || "Không thể gửi mã OTP.");
      // } finally {
      //   setIsLoading(false);
      // }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      // --- SỬ DỤNG HELPER ---
      handleApiError(error, "Không thể gửi mã OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Vui lòng nhập mã OTP gồm 6 chữ số");
      return;
    }

    setIsLoading(true);
    try {
      await profileService.verifyEmailChange(otp);

      toast.success("Email đã được cập nhật thành công");
      updateUser({ email: newEmail });
      router.push("/profile");
      // } catch (err: any) {
      //   console.error("Error verifying OTP:", err);
      //   toast.error(err.response?.data?.message || "Mã OTP không đúng.");
      // } finally {
      //   setIsLoading(false);
      // }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      // --- SỬ DỤNG HELPER ---
      handleApiError(error, "Mã OTP không đúng hoặc đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authIsLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải thông tin người dùng...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div
        className="hidden md:flex md:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: "#00416A" }}
      >
        {/* Background Image with Fallback */}
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 opacity-20">
            <img
              src={ERROR_IMG_SRC}
              alt="Error loading image"
              className="w-20 h-20"
            />
          </div>
        ) : (
          <img
            src="https://images.unsplash.com/photo-1563986768609-322da13575f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            alt="Email verification"
            className="w-full h-full object-cover opacity-20"
            onError={() => setImageError(true)}
          />
        )}

        {/* Overlay Content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
          style={{ color: "#F0EAD6" }}
        >
          <div className="max-w-md space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div
                className="rounded-full p-6"
                style={{ backgroundColor: "rgba(240, 234, 214, 0.1)" }}
              >
                <Mail className="w-16 h-16" style={{ color: "#F0EAD6" }} />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-4xl">
                {step === "email" ? "Cập nhật Email" : "Xác thực Email"}
              </h1>
              <p className="text-lg opacity-90">
                {step === "email"
                  ? "Bảo vệ tài khoản bằng cách cập nhật email mới"
                  : "Nhập mã OTP để xác thực email mới của bạn"}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Bảo mật tài khoản</h3>
                  <p className="text-sm opacity-80">
                    Xác thực 2 lớp để bảo vệ tài khoản của bạn
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Hiệu lực 5 phút</h3>
                  <p className="text-sm opacity-80">
                    Mã OTP có hiệu lực trong vòng 5 phút
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Gửi đến email mới</h3>
                  <p className="text-sm opacity-80">
                    Mã OTP sẽ được gửi đến địa chỉ email mới của bạn
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#F0EAD6" }}
        ></div>
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#F0EAD6" }}
        ></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại Hồ sơ
          </button>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl text-primary">Thay đổi Email</h2>
            <p className="text-sm text-muted-foreground">
              {step === "email"
                ? "Nhập địa chỉ email mới bạn muốn sử dụng."
                : `Nhập mã OTP gồm 6 chữ số đã được gửi đến ${newEmail}`}
            </p>
          </div>

          <div className="space-y-6">
            {step === "email" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="current-email">Email hiện tại</Label>
                  <Input
                    id="current-email"
                    value={user.email}
                    disabled
                    className="h-11 bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email mới</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                <Button
                  onClick={handleSendOTP}
                  disabled={isLoading || !newEmail || newEmail === user.email}
                  className="w-full h-12 hover:opacity-90 gap-2"
                  style={{ backgroundColor: "#F0EAD6", color: "#00416A" }}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi mã xác nhận"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Mã OTP (6 chữ số)</Label>
                  <Input
                    id="otp"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    disabled={isLoading}
                    className="h-11 text-center text-2xl tracking-widest"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleSendOTP}
                    disabled={isLoading || countdown > 0}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    {countdown > 0 ? `Gửi lại (${countdown}s)` : "Gửi lại mã"}
                  </Button>
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otp.length !== 6}
                    className="flex-1 h-12 hover:opacity-90 gap-2"
                    style={{ backgroundColor: "#F0EAD6", color: "#00416A" }}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang xác nhận...
                      </>
                    ) : (
                      "Xác nhận Email"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Info Box */}
          <div className="rounded-lg p-4 space-y-2 bg-muted border">
            <p className="text-sm font-medium text-primary">Lưu ý:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Email mới phải chưa được sử dụng bởi tài khoản khác</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Mã OTP gửi qua email có hiệu lực trong 5 phút</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Bạn cần xác thực email mới để tiếp tục sử dụng</span>
              </li>
            </ul>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center pt-8 border-t">
            <h3 className="text-2xl mb-2 text-primary">Tora Novel</h3>
            <p className="text-sm text-muted-foreground">
              Nền tảng đọc truyện tương tác với AI Voice
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
