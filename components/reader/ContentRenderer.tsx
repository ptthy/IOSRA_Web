//components/reader/ContentRenderer.tsx
/*
MỤC ĐÍCH & CHỨC NĂNG:
────────────────────────────────────────────────────────────────────────────
Component ContentRenderer xử lý hiển thị nội dung chương truyện với nhiều định dạng.
Nó tự động phát hiện và render đúng định dạng: HTML, Markdown, hoặc Plain text.

CHỨC NĂNG CHÍNH:
1. Tự động phát hiện định dạng nội dung (HTML/Markdown/Plain text)
2. Render HTML với sanitization cơ bản (loại bỏ script và event handlers)
3. Render Markdown sử dụng ReactMarkdown với plugin rehype-raw
4. Format plain text thành paragraphs với <p> tags
5. Cung cấp className tùy chỉnh cho styling

CÁCH HOẠT ĐỘNG:
- Dùng regex để phân biệt HTML tags và Markdown syntax
- HTML: dùng dangerouslySetInnerHTML với sanitization
- Markdown: dùng ReactMarkdown component
- Plain text: split bằng \n\n và wrap trong <p> tags

LIÊN KẾT VỚI CÁC COMPONENT KHÁC:
- Được sử dụng bởi ChapterReader để hiển thị nội dung chương
- Tích hợp với hệ thống highlight để hiển thị các đoạn được đánh dấu
- Là nơi user chọn text để tạo highlight
*/

"use client";

import React from "react";
/**
 * REACT-MARKDOWN - Thư viện render Markdown trong React
 * └─ Chuyển đổi markdown text thành React components
 * └─ Hỗ trợ các tính năng markdown cơ bản: headers, lists, links, code blocks, etc.
 * └─ Example: "# Tiêu đề" → <h1>Tiêu đề</h1>
 *
 * TẠI SAO CẦN:
 * - Nội dung chương truyện có thể được lưu dưới dạng markdown
 * - Markdown dễ viết và đọc hơn HTML thô
 * - ReactMarkdown xử lý bảo mật tốt hơn dangerouslySetInnerHTML
 */
import ReactMarkdown from "react-markdown";
/**
 * REHYPE-RAW - Plugin cho ReactMarkdown
 * └─ Cho phép parse và render HTML trong markdown
 * └─ "rehype" là hệ sinh thái xử lý HTML
 * └─ "raw" nghĩa là xử lý HTML thô (raw HTML)
 *
 * TẠI SAO CẦN:
 * - Markdown có thể chứa HTML tags bên trong
 * - Ví dụ: "Chữ <b>đậm</b> trong markdown"
 * - Mặc định ReactMarkdown không parse HTML trong markdown
 * - rehypeRaw cho phép nó parse HTML một cách an toàn
 */
import rehypeRaw from "rehype-raw";

/**
 * Props interface cho ContentRenderer
 * @param {string} content - Nội dung cần hiển thị (có thể là HTML, Markdown, hoặc plain text)
 * @param {string} className - CSS class tùy chọn để tùy chỉnh style
 */
interface ContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Component ContentRenderer: Xử lý hiển thị nội dung với nhiều định dạng
 * - Tự động phát hiện định dạng: HTML, Markdown, hoặc Plain text
 * - Render định dạng phù hợp với từng loại
 * - Xử lý plain text bằng cách thêm paragraph breaks
 * - Xử lý HTML với sanitization cơ bản (loại bỏ script và event handlers)
 * - Sử dụng ReactMarkdown cho nội dung Markdown
 */
export const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  className = "",
}) => {
  /**
   * Phát hiện định dạng nội dung dựa trên regex patterns
   * Logic phát hiện:
   * 1. Kiểm tra HTML tags trước (regex tìm tags HTML)
   * 2. Kiểm tra Markdown syntax (headers, bold, italic, lists, links)
   * 3. Mặc định là plain text
   *
   * @param {string} text - Nội dung cần kiểm tra
   * @returns {"html" | "markdown" | "plain"} - Loại định dạng
   */
  /**
   * HÀM DETECTCONTENTTYPE - Phát hiện định dạng nội dung
   *
   * Logic phát hiện theo thứ tự ưu tiên:
   * 1. HTML → 2. Markdown → 3. Plain text
   *
   * Regex patterns sử dụng:
   * - HTML: /<(?!!--)[^>]*>/ (tìm tags HTML, trừ comments)
   * - Markdown: kiểm tra headers, bold, italic, lists, links
   *
   * @param {string} text - Nội dung cần kiểm tra
   * @returns {"html" | "markdown" | "plain"} - Loại định dạng
   */
  const detectContentType = (text: string): "html" | "markdown" | "plain" => {
    if (!text) return "plain";

    // Kiểm tra HTML tags: tìm các tags như <div>, <p>, <span>, etc.
    // Regex: /<(?!!--)[^>]*>/ - tìm <...> nhưng không phải comment <!-- -->

    const htmlRegex = /<(?!!--)[^>]*>/;
    if (htmlRegex.test(text)) {
      return "html";
    }

    // Kiểm tra Markdown syntax:
    // - Headers: ^#{1,6}\s (từ # đến ######)
    // - Bold: \*\*.*\*\*
    // - Italic: \*.*\*
    // - Strikethrough: ~~.*~~
    // - Blockquote: >
    // - Lists: \- hoặc \d\.
    // - Links: \[.*\]\(.*\)
    const markdownRegex =
      /(^#{1,6}\s|\*\*.*\*\*|\*.*\*|~~.*~~|> |\- |\d\. |\[.*\]\(.*\))/;
    if (markdownRegex.test(text)) {
      return "markdown";
    }

    return "plain";
  };

  /**
   * DÒNG CODE QUAN TRỌNG:
   * const contentType = detectContentType(content);
   *
   * Ý NGHĨA:
   * - Gọi hàm detectContentType với tham số là 'content' (prop nhận vào)
   * - Lưu kết quả trả về vào biến 'contentType'
   * - Biến này sẽ quyết định cách render content ở phần sau
   *
   * VÍ DỤ:
   * 1. Nếu content = "<p>Hello World</p>" → contentType = "html"
   * 2. Nếu content = "# Title\n\nHello World" → contentType = "markdown"
   * 3. Nếu content = "Hello World" → contentType = "plain"
   *
   * TẠI SAO CẦN BIẾN NÀY:
   * - Để không phải gọi detectContentType nhiều lần (tối ưu performance)
   * - Làm code dễ đọc và debug hơn
   * - Tách biệt logic detection và rendering
   */
  const contentType = detectContentType(content);

  /**
   * CÁCH HOẠT ĐỘNG CỦA HÀM DETECTCONTENTTYPE:
   *
   * 1. Kiểm tra HTML trước:
   *    - Regex: /<(?!!--)[^>]*>/
   *    - Giải thích regex:
   *      • /.../ - Bắt đầu và kết thúc regex
   *      • < - Tìm ký tự '<'
   *      • (?!!--) - Negative lookahead: KHÔNG phải là '!--' (comment)
   *      • [^>]* - Bất kỳ ký tự nào không phải '>', 0 hoặc nhiều lần
   *      • > - Kết thúc với '>'
   *    → Tìm tất cả HTML tags trừ <!-- comments -->
   *
   * 2. Nếu không phải HTML, kiểm tra Markdown:
   *    - Regex kiểm tra nhiều patterns:
   *      • ^#{1,6}\s - Headers (#, ##, ###, etc.)
   *      • \*\*.*\*\* - Bold text (**text**)
   *      • \*.*\* - Italic text (*text*)
   *      • ~~.*~~ - Strikethrough (~~text~~)
   *      • >  - Blockquote
   *      • \-  hoặc \d\.  - Lists (- hoặc 1.)
   *      • \[.*\]\(.*\) - Links [text](url)
   *
   * 3. Nếu không phải cả hai → Plain text
   */

  /**
   * Format plain text: Chia thành các paragraph dựa trên \n\n
   * Mỗi paragraph được wrap trong <p> tag với margin-bottom
   *
   * @param {string} text - Plain text cần format
   * @returns {JSX.Element[]} - Mảng các paragraph JSX elements
   */

  /**
   * FORMATPLAINTEXT - Chỉ được dùng khi contentType = "plain"
   * Chia text thành các paragraph dựa trên \n\n
   */
  /**
   * Format plain text: Chia thành các paragraph dựa trên \n\n
   * Mỗi paragraph được wrap trong <p> tag với margin-bottom
   *
   * @param {string} text - Plain text cần format
   * @returns {JSX.Element[]} - Mảng các paragraph JSX elements
   */
  const formatPlainText = (text: string) => {
    return text.split("\n\n").map((paragraph, index) => (
      <p key={index} className="mb-4 leading-relaxed">
        {paragraph}
      </p>
    ));
  };

  /**
   * RENDERHTML - Chỉ được dùng khi contentType = "html"
   * Sanitize và render HTML
   */
  /**
   * Render HTML content với sanitization cơ bản
   * QUAN TRỌNG: Chỉ sử dụng sanitization cơ bản, trong production nên dùng DOMPurify
   * Sanitization bao gồm:
   * 1. Loại bỏ tất cả <script> tags
   * 2. Loại bỏ tất cả event handlers (onclick, onload, etc.)
   *
   * @param {string} html - HTML string cần render
   * @returns {JSX.Element} - Div với dangerouslySetInnerHTML
   */
  const renderHTML = (html: string) => {
    // Basic sanitization - bạn có thể dùng thư viện DOMPurify cho production
    const sanitizedHTML = html
      // Loại bỏ script tags (cả inline và external)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Loại bỏ event handlers dạng onxxx="..."
      .replace(/on\w+="[^"]*"/g, "")
      // Loại bỏ event handlers dạng onxxx='...'
      .replace(/on\w+='[^']*'/g, "");

    return (
      <div
        className="html-content"
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
    );
  };

  // Switch-case xử lý render theo từng loại content
  /**
   * SWITCH-CASE: Quyết định cách render dựa trên contentType
   *
   * Đây là điểm quan trọng nhất của component:
   * - Dùng switch-case thay vì if-else để code rõ ràng hơn
   * - Mỗi case xử lý một định dạng khác nhau
   * - default case xử lý plain text (fallback)
   */
  switch (contentType) {
    case "html":
      // Gọi renderHTML và wrap trong div với className
      return (
        <div className={`html-content ${className}`}>{renderHTML(content)}</div>
      );

    case "markdown":
      // Dùng ReactMarkdown với rehypeRaw plugin
      return (
        <div className={`markdown-content ${className}`}>
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
        </div>
      );

    case "plain":
    default:
      // Gọi formatPlainText và wrap trong div
      return (
        <div className={`plain-content ${className}`}>
          {formatPlainText(content)}
        </div>
      );
  }
};

/**
 * FLOW XỬ LÝ TỪ ĐẦU ĐẾN CUỐI:
 *
 * 1. Component nhận prop 'content' từ cha
 *    → Ví dụ: content = "<p>Hello</p>"
 *
 * 2. Gọi detectContentType(content)
 *    → Hàm chạy regex, phát hiện có HTML tags
 *    → Trả về "html"
 *
 * 3. Lưu kết quả vào biến contentType
 *    → contentType = "html"
 *
 * 4. Switch-case dựa trên contentType
 *    → case "html": thực thi
 *
 * 5. Trong case "html":
 *    → Gọi renderHTML(content)
 *    → Hàm này sanitize HTML và trả về JSX
 *
 * 6. Return JSX cuối cùng
 *    → Hiển thị trên màn hình
 *
 * THỜI ĐIỂM THỰC THI:
 * - detectContentType chỉ chạy khi component render
 * - Chạy lại nếu prop 'content' thay đổi
 * - Không chạy lại nếu chỉ có state khác thay đổi
 */
