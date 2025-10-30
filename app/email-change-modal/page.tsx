

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";

import { profileService } from "@/services/profileService"; 


export default function EmailChangePage() {
  const router = useRouter();

  const { user, updateUser, isLoading: authIsLoading } = useAuth(); // 2. Lấy `isLoading`


  const [step, setStep] = useState<"email" | "otp">("email");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );

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

      // GỌI API POST /api/Profile/email/otp
      // console.log("Sending OTP to:", newEmail);
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      await profileService.requestEmailChange(newEmail);


      toast.success("Mã OTP đã được gửi đến email mới");
      setStep("otp");
      setCountdown(60);

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
    } catch (err: any) {
      // 5. Sửa kiểu lỗi
      console.error("Error sending OTP:", err);
      // Hiển thị lỗi từ server
      toast.error(err.response?.data?.message || "Không thể gửi mã OTP.");
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
      
      // GỌI API POST /api/Profile/email/verify
      // console.log("Verifying OTP:", otp, "for email:", newEmail);
      // await new Promise((resolve) => setTimeout(resolve, 1000));

      // API chỉ cần OTP, email mới đã được lưu ở server
      await profileService.verifyEmailChange(otp);


      toast.success("Email đã được cập nhật thành công");
      updateUser({ email: newEmail }); // Cập nhật context
      router.push("/profile"); // Điều hướng về profile
    } catch (err: any) {
      // Sửa kiểu lỗi
      console.error("Error verifying OTP:", err);
      // Hiển thị lỗi từ server
      toast.error(err.response?.data?.message || "Mã OTP không đúng.");
    } finally {
      setIsLoading(false);
    }
  };


  // Cải thiện màn hình loading
  if (authIsLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải thông tin người dùng...
      </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {" "}
      <div className="w-full max-w-md space-y-6 bg-card p-6 rounded-lg border shadow-sm">
        {/* Thêm nút Back */}{" "}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground mb-4"
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Hồ sơ{" "}
        </button>{" "}
        <div className="text-center">
          {" "}
          <h2 className="text-2xl font-semibold text-foreground">
            Thay đổi Email
          </h2>{" "}
          <p className="text-sm text-muted-foreground">
            {" "}
            {step === "email"
              ? "Nhập địa chỉ email mới bạn muốn sử dụng."
              : `Nhập mã OTP gồm 6 chữ số đã được gửi đến ${newEmail}`}{" "}
          </p>{" "}
        </div>{" "}
        <div className="space-y-4">
          {" "}
          {step === "email" ? (
            <>
              {" "}
              <div className="space-y-2">
                {" "}
                <Label htmlFor="current-email" className="text-foreground">
                  Email hiện tại
                </Label>{" "}
                <Input
                  id="current-email"
                  value={user.email}
                  disabled
                  className="bg-muted border-input"
                />{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <Label htmlFor="new-email" className="text-foreground">
                  Email mới
                </Label>{" "}
                <Input
                  id="new-email"
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isLoading}
                  className="border-input text-foreground"
                />{" "}
              </div>{" "}
              <Button
                onClick={handleSendOTP}
                disabled={isLoading || !newEmail || newEmail === user.email}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10"
              >
                {isLoading ? "Đang gửi..." : "Gửi mã xác nhận"}{" "}
              </Button>{" "}
            </>
          ) : (
            <>
              {" "}
              <div className="space-y-2">
                {" "}
                <Label htmlFor="otp" className="text-foreground">
                  Mã OTP
                </Label>{" "}
                <Input
                  id="otp"
                  placeholder="••••••••"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  disabled={isLoading}
                  className="border-input text-foreground text-center tracking-[0.5em]"
                />{" "}
              </div>{" "}
              <div className="flex flex-col sm:flex-row gap-2">
                {" "}
                <Button
                  onClick={handleSendOTP}
                  disabled={isLoading || countdown > 0}
                  variant="outline"
                  className="flex-1 h-10 border-border text-foreground"
                >
                  {" "}
                  {countdown > 0
                    ? `Gửi lại (${countdown}s)`
                    : "Gửi lại mã"}{" "}
                </Button>{" "}
                <Button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10"
                >
                  {" "}
                  {isLoading ? "Đang xác nhận..." : "Xác nhận Email"}{" "}
                </Button>{" "}
              </div>{" "}
            </>
          )}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
