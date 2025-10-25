// "use client";

// import { GoogleCompleteRegistrationPage } from "@/components/pages/google-complete-registration-page";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Suspense } from "react";

// function GoogleCompleteContent() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   // Get data from URL params or session storage
//   const googleEmail = searchParams.get("email") || "";
//   const idToken =
//     searchParams.get("token") || sessionStorage.getItem("googleIdToken") || "";

//   const handleCompleteRegistration = async (
//     username: string,
//     password: string,
//     confirmPassword: string
//   ) => {
//     try {
//       // API Call
//       const response = await fetch("/api/Auth/google/complete", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           idToken,
//           username,
//           password,
//           confirmPassword,
//         }),
//       });

//       if (response.ok) {
//         // Success! Navigate to home
//         const data = await response.json();
//         // Store token if needed
//         sessionStorage.setItem("authToken", data.token);
//         router.push("/");
//       } else {
//         // Handle error
//         console.error("Failed to complete registration");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//     }
//   };

//   return (
//     <GoogleCompleteRegistrationPage
//       googleEmail={googleEmail}
//       idToken={idToken}
//       onCompleteRegistration={handleCompleteRegistration}
//     />
//   );
// }

// export default function GoogleCompleteRoute() {
//   return (
//     <Suspense fallback={<div>Loading...</div>}>
//       <GoogleCompleteContent />
//     </Suspense>
//   );
// }

"use client";

import { GoogleCompleteRegistrationPage } from "@/components/pages/google-complete-registration-page"; // Component UI của bạn
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react"; // Import useState, useEffect
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { authService } from "@/services/authService"; // Import authService
import { toast } from "sonner"; // Import toast để phản hồi

function GoogleCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth(); // Lấy hàm login từ context

  // --- SỬA LẠI CÁCH LẤY TOKEN/EMAIL ---
  const idToken = searchParams.get("idToken") || ""; // Dùng "idToken"
  const googleEmail = searchParams.get("email") || "";
  // ------------------------------------

  // --- THÊM STATE ĐỂ PHẢN HỒI LOADING/LỖI ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // --------------------------------------

  // --- KIỂM TRA TOKEN/EMAIL KHI COMPONENT MOUNT ---
  useEffect(() => {
    // Nếu thiếu token hoặc email trên URL, chuyển về trang login
    if (!idToken || !googleEmail) {
      toast.error("Thiếu thông tin Google. Đang chuyển về trang đăng nhập...");
      router.push("/login");
    }
  }, [idToken, googleEmail, router]); // Dependency array
  // ---------------------------------------------

  // --- HÀM HANDLER ĐÃ CẬP NHẬT (DÙNG AUTHSERVICE VÀ LOGIN) ---
  const handleCompleteRegistration = async (
    username: string,
    password: string,
    confirmPassword: string
  ) => {
    setError(""); // Xóa lỗi cũ

    // Kiểm tra dữ liệu nhập (có thể thêm nếu cần)
    if (username.length < 3) {
      setError("Username phải có ít nhất 3 ký tự");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true); // Bắt đầu loading
    try {
      // 1. Gọi API hoàn tất đăng ký bằng authService
      await authService.completeGoogleLogin({
        idToken,
        username,
        password,
        confirmPassword,
      });

      toast.success("Hoàn tất đăng ký! Đang tự động đăng nhập...");

      // 2. Gọi hàm login từ AuthContext để đăng nhập người dùng
      await login({ identifier: googleEmail, password: password });
      // AuthContext sẽ tự xử lý cập nhật state và chuyển hướng về "/"
    } catch (err: any) {
      // Xử lý lỗi từ API
      const errMsg =
        err.response?.data?.message || // Lỗi cụ thể từ backend (ví dụ: username tồn tại)
        "Hoàn tất đăng ký thất bại. Username có thể đã tồn tại hoặc có lỗi xảy ra.";
      setError(errMsg); // Cập nhật state lỗi để component UI hiển thị
      toast.error(errMsg);
      setIsLoading(false); // Dừng loading khi có lỗi
    }
    // Không cần setIsLoading(false) nếu thành công vì hàm login() sẽ chuyển trang
  };
  // ----------------------------------------------------

  // Truyền các props cần thiết, bao gồm error và isLoading để UI phản hồi
  return (
    <GoogleCompleteRegistrationPage
      googleEmail={googleEmail} // Truyền email để hiển thị
      // idToken={idToken} // Component UI có thể không cần idToken trực tiếp
      onCompleteRegistration={handleCompleteRegistration} // Truyền hàm xử lý submit
      isLoading={isLoading} // Truyền trạng thái loading
      error={error} // Truyền trạng thái lỗi
    />
  );
}

// Export mặc định giữ nguyên
export default function GoogleCompleteRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Đang tải...
        </div>
      }
    >
      <GoogleCompleteContent />
    </Suspense>
  );
}
