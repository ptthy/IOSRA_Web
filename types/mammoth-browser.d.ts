//types/mammoth-browser.d.ts

/**
 * Đây là file khai báo TypeScript cho thư viện mammoth trong môi trường browser
 * File này giúp TypeScript hiểu và hỗ trợ types cho module mammoth/mammoth.browser
 * Khi sử dụng thư viện mammoth để đọc file .docx trong trình duyệt
 */
declare module "mammoth/mammoth.browser" {
  // Khai báo một module với tên "mammoth/mammoth.browser"
  const mammoth: any; // Tạm thời sử dụng type 'any' vì không có types chính thức
  export default mammoth; // Xuất default để import dễ dàng
}
