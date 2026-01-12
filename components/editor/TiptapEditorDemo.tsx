//components/editor/TiptapEditorDemo.tsx

"use client";
/**
 * MỤC ĐÍCH: Demo component để test và trình diễn tính năng của TiptapEditor
 * CHỨC NĂNG CỐT LÕI:
 * 1. Cung cấp giao diện demo đầy đủ với các section riêng biệt
 * 2. Quản lý state cho nội dung editor và nội dung đã lưu
 * 3. Hiển thị đồng thời: Editor, HTML output và Preview
 * 4. Cung cấp controls để test các chức năng (Save, Clear)
 * 5. Log kết quả ra console để debug và kiểm tra
 *
 * CẤU TRÚC DEMO:
 * 1. Editor Section: Hiển thị TiptapEditor component
 * 2. Action Controls: Nút Save và Clear để thao tác với nội dung
 * 3. HTML Output: Hiển thị raw HTML được tạo bởi editor
 * 4. Content Preview: Render HTML để xem trước kết quả thực tế
 *
 * WORKFLOW TESTING:
 * - Người dùng chỉnh sửa nội dung trong editor
 * - Nhấn Save để lưu và hiển thị kết quả
 * - Xem HTML output và preview song song
 * - Có thể Clear để bắt đầu lại
 *
 * MỤC ĐÍCH SỬ DỤNG:
 * - Testing: Kiểm tra tất cả tính năng editor trong môi trường cô lập
 * - Documentation: Cung cấp ví dụ trực quan về cách sử dụng component
 * - Development: Hỗ trợ phát triển và debug component TiptapEditor
 */
/**
 * Component demo để test Tiptap Editor
 * Cung cấp giao diện đơn giản để thử nghiệm các tính năng của editor
 */
import { useState } from "react";
import TiptapEditor from "./TiptapEditor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Demo component để test Tiptap Editor
 * Sử dụng: Import component này vào trang demo
 */
export default function TiptapEditorDemo() {
  /**
   * State quản lý nội dung editor hiện tại
   * Khởi tạo với một đoạn văn bản mẫu
   */
  const [content, setContent] = useState("<p>Bắt đầu nhập nội dung...</p>");

  /**
   * State lưu trữ nội dung đã save
   * Dùng để hiển thị HTML output và preview
   */
  const [savedContent, setSavedContent] = useState("");

  /**
   * Hàm xử lý sự kiện lưu nội dung
   * Lưu content hiện tại vào savedContent và log ra console
   */
  const handleSave = () => {
    setSavedContent(content);
    console.log("Saved content:", content);
  };
  /**
   * Hàm xử lý sự kiện xóa toàn bộ nội dung
   * Reset content về chuỗi rỗng
   */
  const handleClear = () => {
    setContent("");
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tiptap Editor Demo</h1>
        <p className="text-muted-foreground">
          Test rich text editor với đầy đủ tính năng
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>
            Thử nghiệm các tính năng định dạng văn bản
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Component TiptapEditor chính */}
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Nhập nội dung tại đây..."
            maxLength={10000}
          />
          {/* Nút hành động: Lưu và Xóa */}
          <div className="flex gap-2">
            <Button onClick={handleSave}>Lưu nội dung</Button>
            <Button onClick={handleClear} variant="outline">
              Xóa tất cả
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Card hiển thị HTML output nếu có nội dung đã lưu */}
      {savedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Nội dung đã lưu (HTML)</CardTitle>
            <CardDescription>Đây là HTML output từ editor</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>{savedContent}</code>
            </pre>
          </CardContent>
        </Card>
      )}
      {/* Card hiển thị preview nếu có nội dung đã lưu */}
      {savedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Xem trước nội dung đã render</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Render HTML để xem trước nội dung thực tế */}
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: savedContent }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
