// app/api/chapter-content/route.ts
import { NextRequest, NextResponse } from "next/server";

const R2_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contentPath = searchParams.get("path");

  if (!contentPath) {
    return NextResponse.json(
      { error: "Missing content path" },
      { status: 400 }
    );
  }

  try {
    // Đảm bảo path không có slash dư thừa
    const cleanPath = contentPath.startsWith("/")
      ? contentPath.slice(1)
      : contentPath;
    const contentUrl = `${R2_BASE_URL}/${cleanPath}`;

    console.log("🔍 [API Proxy] Fetching content from:", contentUrl);

    const response = await fetch(contentUrl, {
      headers: {
        Accept: "text/plain, */*",
      },
    });

    if (!response.ok) {
      console.error("❌ [API Proxy] R2 response not OK:", response.status);
      return NextResponse.json(
        { error: `Failed to fetch content: ${response.status}` },
        { status: response.status }
      );
    }

    const text = await response.text();
    console.log(
      "✅ [API Proxy] Successfully fetched content, length:",
      text.length
    );

    return NextResponse.json({
      content: text,
      source: "proxy",
    });
  } catch (error) {
    console.error("❌ [API Proxy] Error fetching chapter content:", error);
    // Xử lý lỗi TypeScript
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
