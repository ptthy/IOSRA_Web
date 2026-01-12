//lib/firebase.ts
/**
 * FIREBASE CONFIGURATION - CẤU HÌNH FIREBASE CHO ỨNG DỤNG
 * MỤC ĐÍCH: Khởi tạo Firebase để sử dụng các dịch vụ (Authentication, Storage)
 * CHỨC NĂNG:
 * 1. Khởi tạo Firebase app với config từ Firebase Console
 * 2. Export auth instance để dùng cho Firebase Authentication
 * 3. Singleton pattern: chỉ khởi tạo một lần duy nhất
 * LƯU Ý: Config chứa các key nhạy cảm, phải được bảo vệ trong .env.local
 */
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * Cấu hình Firebase cho ứng dụng
 * Các thông tin này được lấy từ Firebase Console khi tạo project
 * - apiKey: Khóa API để xác thực với Firebase services
 * - authDomain: Domain cho Firebase Authentication
 * - projectId: ID của project trong Firebase
 * - storageBucket: URL cho Firebase Storage
 * - messagingSenderId: ID cho Firebase Cloud Messaging
 * - appId: ID của ứng dụng Firebase
 * - measurementId: ID cho Google Analytics (nếu có)
 */
const firebaseConfig = {
  apiKey: "AIzaSyAJc53fIiOh0BFAq8_mQPhdVZvlBg5Oc6I",
  authDomain: "iosra-e1982.firebaseapp.com",
  projectId: "iosra-e1982",
  storageBucket: "iosra-e1982.firebasestorage.app",
  messagingSenderId: "273678798179",
  appId: "1:273678798179:web:ab0d0833f27be6c7b15756",
  measurementId: "G-4N143P4ZGW",
};

/**
 * Khởi tạo Firebase App với Singleton Pattern
 * LOGIC:
 * 1. Kiểm tra nếu chưa có app nào được khởi tạo thì tạo mới
 * 2. Ngược lại sử dụng app đã tồn tại để tránh khởi tạo nhiều lần
 * TẠI SAO CẦN SINGLETON: Firebase chỉ cho phép một instance duy nhất
 */
let app;
if (!getApps().length) {
  // Khởi tạo app mới nếu chưa có app nào
  app = initializeApp(firebaseConfig);
} else {
  // Sử dụng app đã tồn tại
  app = getApps()[0];
}
/**
 * Export auth instance để sử dụng trong toàn bộ ứng dụng
 * getAuth(app): Tạo authentication instance từ Firebase app
 * CÁCH DÙNG: import { auth } from '@/lib/firebase'
 * DÙNG CHO: Firebase Authentication (đăng nhập bằng Google, Facebook,...)
 */
export const auth = getAuth(app);
