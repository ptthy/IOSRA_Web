"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface ContentRendererProps {
  content: string;
  className?: string;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  className = "",
}) => {
  // Hàm phát hiện định dạng nội dung
  const detectContentType = (text: string): "html" | "markdown" | "plain" => {
    if (!text) return "plain";

    // Kiểm tra HTML tags
    const htmlRegex = /<(?!!--)[^>]*>/;
    if (htmlRegex.test(text)) {
      return "html";
    }

    // Kiểm tra Markdown syntax
    const markdownRegex =
      /(^#{1,6}\s|\*\*.*\*\*|\*.*\*|~~.*~~|> |\- |\d\. |\[.*\]\(.*\))/;
    if (markdownRegex.test(text)) {
      return "markdown";
    }

    return "plain";
  };

  const contentType = detectContentType(content);

  // Xử lý plain text - thêm paragraph breaks
  const formatPlainText = (text: string) => {
    return text.split("\n\n").map((paragraph, index) => (
      <p key={index} className="mb-4 leading-relaxed">
        {paragraph}
      </p>
    ));
  };

  // Xử lý HTML - sử dụng dangerouslySetInnerHTML với sanitization cơ bản
  const renderHTML = (html: string) => {
    // Basic sanitization - bạn có thể dùng thư viện DOMPurify cho production
    const sanitizedHTML = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/g, "")
      .replace(/on\w+='[^']*'/g, "");

    return (
      <div
        className="html-content"
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
    );
  };

  switch (contentType) {
    case "html":
      return (
        <div className={`html-content ${className}`}>{renderHTML(content)}</div>
      );

    case "markdown":
      return (
        <div className={`markdown-content ${className}`}>
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
        </div>
      );

    case "plain":
    default:
      return (
        <div className={`plain-content ${className}`}>
          {formatPlainText(content)}
        </div>
      );
  }
};
