"use client";

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
  const [content, setContent] = useState("<p>Bắt đầu nhập nội dung...</p>");
  const [savedContent, setSavedContent] = useState("");

  const handleSave = () => {
    setSavedContent(content);
    console.log("Saved content:", content);
  };

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
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Nhập nội dung tại đây..."
            maxLength={10000}
          />

          <div className="flex gap-2">
            <Button onClick={handleSave}>Lưu nội dung</Button>
            <Button onClick={handleClear} variant="outline">
              Xóa tất cả
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {savedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Xem trước nội dung đã render</CardDescription>
          </CardHeader>
          <CardContent>
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
