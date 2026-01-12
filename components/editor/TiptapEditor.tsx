//components/editor/TiptapEditor.tsx

"use client";

/**
 * MỤC ĐÍCH: Component React chính cho rich text editor sử dụng Tiptap
 * CHỨC NĂNG CỐT LÕI:
 * 1. Khởi tạo và quản lý Tiptap editor instance với đầy đủ extensions
 * 2. Cung cấp toolbar với các công cụ định dạng văn bản (bold, italic, headings, lists, etc.)
 * 3. Tích hợp character counting với giới hạn tùy chỉnh
 * 4. Hỗ trợ placeholder, typography improvements và link insertion
 * 5. Quản lý state đồng bộ giữa editor và parent component
 * 6. Hỗ trợ disabled mode và undo/redo operations
 *
 * KIẾN TRÚC COMPONENT:
 * - Editor Core: useEditor hook với các extensions (StarterKit, Placeholder, CharacterCount, etc.)
 * - Toolbar: Các button điều khiển định dạng được nhóm theo chức năng
 * - Editor Content: Khu vực hiển thị và chỉnh sửa nội dung
 * - Footer: Hiển thị thông tin đếm ký tự và số từ
 *
 * DATA FLOW:
 * - Nhận content từ props (HTML string)
 * - Cập nhật content qua callback onChange khi có thay đổi
 * - Đồng bộ content từ props vào editor khi cần thiết
 * - Quản lý editable state dựa trên disabled prop
 *
 * EXTENSIONS TÍCH HỢP:
 * 1. StarterKit - Bộ extension cơ bản
 * 2. Placeholder - Hiển thị gợi ý khi editor trống
 * 3. CharacterCount - Đếm ký tự/từ và giới hạn
 * 4. Typography - Cải thiện typography (smart quotes, etc.)
 * 5. Link - Hỗ trợ chèn và quản lý liên kết
 */

/**
 * Component TiptapEditor - Rich text editor sử dụng Tiptap
 * Cho phép người dùng nhập và định dạng văn bản với nhiều tính năng
 */

import "./tiptap-editor.css";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import { useEffect } from "react";

/**
 * Props interface cho TiptapEditor component
 * Định nghĩa các thuộc tính mà component nhận từ parent
 */
interface TiptapEditorProps {
  content: string; // Nội dung HTML hiện tại
  onChange: (html: string) => void; // Callback khi nội dung thay đổi
  placeholder?: string; // Văn bản placeholder (mặc định: "Nhập nội dung...")
  maxLength?: number; // Giới hạn số ký tự (mặc định: 10000)
  disabled?: boolean; // Trạng thái vô hiệu hóa editor
}

/**
 * Component chính TiptapEditor
 * Quản lý editor state, toolbar và các chức năng định dạng
 */
export default function TiptapEditor({
  content,
  onChange,
  placeholder = "Nhập nội dung...",
  maxLength = 10000,
  disabled = false,
}: TiptapEditorProps) {
  /**
   * Khởi tạo editor instance với Tiptap
   * Cấu hình extensions, content và event handlers
   */
  const editor = useEditor({
    immediatelyRender: false, // Không render ngay lập tức

    // Các extensions (plugin) của Tiptap
    extensions: [
      // StarterKit: bộ extension cơ bản
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3], // Chỉ hỗ trợ heading 1, 2, 3
        },
        bulletList: {
          keepMarks: true, // Giữ các định dạng khi tạo danh sách
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),

      // Extension placeholder: hiển thị văn bản gợi ý
      Placeholder.configure({
        placeholder,
      }),
      // Extension đếm ký tự: giới hạn và theo dõi số ký tự
      CharacterCount.configure({
        limit: maxLength,
      }),
      // Extension typography: cải thiện typography (dấu ngoặc thông minh, etc.)
      Typography,
      // Extension link: hỗ trợ chèn liên kết
      Link.configure({
        openOnClick: false, // Không mở link khi click
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
    ],
    content, // Nội dung khởi tạo
    editable: !disabled, // Trạng thái có thể chỉnh sửa hay không

    /**
     * Event handler khi nội dung thay đổi
     * Lấy HTML từ editor và gọi callback onChange
     */
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    // Props cho editor
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] max-w-none p-4",
      },
    },
  });

  /**
   * Effect: Cập nhật content khi prop thay đổi từ bên ngoài
   * So sánh content mới với content hiện tại trong editor
   * Chỉ cập nhật khi khác nhau để tránh vòng lặp vô hạn
   */
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  /**
   * Effect: Cập nhật trạng thái editable khi disabled prop thay đổi
   * Cho phép bật/tắt chế độ chỉnh sửa động
   */
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);
  // Hiển thị null nếu editor chưa khởi tạo xong
  if (!editor) {
    return null;
  }
  /**
   * Hàm thêm liên kết
   * Hiển thị prompt để người dùng nhập URL
   * Sử dụng chain() để thực hiện nhiều command liên tiếp
   */
  const addLink = () => {
    const url = window.prompt("Nhập URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border-2 border-primary/30 rounded-md overflow-hidden focus-within:border-primary">
      {/* Toolbar - Thanh công cụ định dạng */}
      <div className="border-b bg-muted/20 p-2">
        <div className="flex flex-wrap gap-1">
          {/* ========== ĐỊNH DẠNG VĂN BẢN ========== */}
          {/* Nút In đậm */}
          <Button
            type="button"
            variant={editor.isActive("bold") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            title="In đậm (Ctrl+B)"
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          {/* Nút In nghiêng */}
          <Button
            type="button"
            variant={editor.isActive("italic") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            title="In nghiêng (Ctrl+I)"
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          {/* Nút Gạch ngang */}
          <Button
            type="button"
            variant={editor.isActive("strike") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={disabled}
            title="Gạch ngang"
            className="h-8 w-8 p-0"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          {/* Phân cách */}
          <div className="w-px h-8 bg-border mx-1" />
          {/* ========== HEADING ========== */}
          {/* Headings */}
          {/* Nút Heading 1 */}
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 1 }) ? "default" : "outline"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            disabled={disabled}
            title="Tiêu đề 1"
            className="h-8 px-2"
          >
            <Heading1 className="h-4 w-4" />
          </Button>

          {/* Nút Heading 2 */}
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 2 }) ? "default" : "outline"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            disabled={disabled}
            title="Tiêu đề 2"
            className="h-8 px-2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          {/* Nút Heading 3 */}
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 3 }) ? "default" : "outline"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            disabled={disabled}
            title="Tiêu đề 3"
            className="h-8 px-2"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          {/* Phân cách */}
          <div className="w-px h-8 bg-border mx-1" />

          {/* ========== DANH SÁCH & TRÍCH DẪN ========== */}
          {/* Lists */}
          {/* Nút danh sách không thứ tự */}
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            title="Danh sách không thứ tự"
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          {/* Nút danh sách có thứ tự */}
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            title="Danh sách có thứ tự"
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          {/* Nút trích dẫn */}
          <Button
            type="button"
            variant={editor.isActive("blockquote") ? "default" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={disabled}
            title="Trích dẫn"
            className="h-8 w-8 p-0"
          >
            <Quote className="h-4 w-4" />
          </Button>
          {/* Phân cách */}
          <div className="w-px h-8 bg-border mx-1" />

          {/* Link */}
          {/* <Button
            type="button"
            variant={editor.isActive("link") ? "default" : "outline"}
            size="sm"
            onClick={addLink}
            disabled={disabled}
            title="Thêm liên kết"
            className="h-8 w-8 p-0"
          >
            <LinkIcon className="h-4 w-4" />
          </Button> */}

          <div className="w-px h-8 bg-border mx-1" />
          {/* ========== UNDO/REDO ========== */}
          {/* Undo/Redo */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="Hoàn tác (Ctrl+Z)"
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="Làm lại (Ctrl+Y)"
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Helper text */}
        <div className="text-xs text-muted-foreground mt-2">
          Sử dụng các nút trên để định dạng văn bản hoặc dùng phím tắt (Ctrl+B,
          Ctrl+I, etc.)
        </div>
      </div>

      {/* Khu vực nội dung editor */}
      <EditorContent editor={editor} className="min-h-[400px]" />

      {/* Thông tin đếm ký tự và số từ */}
      <div className="border-t bg-muted/10 px-4 py-2 flex justify-between items-center text-xs text-muted-foreground">
        <span>
          Số từ: {editor.storage.characterCount.words()} | Ký tự:{" "}
          {editor.storage.characterCount.characters()}
        </span>
        <span
          className={
            editor.storage.characterCount.characters() > maxLength
              ? "text-red-500 font-semibold"
              : ""
          }
        >
          {editor.storage.characterCount.characters()}/{maxLength}
        </span>
      </div>
    </div>
  );
}
