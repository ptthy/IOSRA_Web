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
    const contentUrl = `${R2_BASE_URL}/${contentPath}`;
    console.log("🔍 [API] Fetching content from:", contentUrl);

    const response = await fetch(contentUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: response.status }
      );
    }

    const text = await response.text();
    return NextResponse.json({ content: text });
  } catch (error) {
    console.error("❌ [API] Error fetching chapter content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
