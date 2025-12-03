"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, BookOpen, FileText, AlertCircle, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { getRealtimeStats, RealtimeStats } from "@/services/moderationApi";

export default function DashboardPage(): JSX.Element {
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRealtimeStats();
      setStats(data);
    } catch (err: unknown) {
      console.error(err);
      setError("Không tải được dữ liệu thời gian thực");
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // optional: poll every 60s for realtime feel
    const t = setInterval(fetch, 60000);
    return () => clearInterval(t);
  }, []);

  const CardStat = (props: { title: string; value: string | number; subtitle?: string; icon: React.ReactNode; link?: string }) => {
    return (
      <Card className="shadow-md border border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm text-[var(--muted-foreground)]">{props.title}</CardTitle>
          <div>{props.icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{props.value}</div>
          {props.subtitle && <div className="text-xs text-[var(--muted-foreground)] mt-1">{props.subtitle}</div>}
          {props.link && (
            <div className="mt-3">
              <Link href={props.link}>
                <Button variant="link" className="p-0 text-[var(--primary)]">Xem chi tiết</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <main className="p-8 min-h-screen bg-[var(--background)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--primary)]">Dashboard Kiểm Duyệt</h1>
        <p className="text-[var(--muted-foreground)]">Số liệu tức thời — snapshot nhanh để xử lý</p>
      </div>

      {loading && (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        </div>
      )}

      {error && (
        <div className="py-8 text-center text-red-600">
          <p>{error}</p>
          <div className="mt-3">
            <Button onClick={fetch}>Thử lại</Button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <CardStat
              title="Truyện chờ duyệt"
              value={stats?.pendingStories ?? 0}
              subtitle="Số truyện đang chờ"
              icon={<BookOpen className="w-5 h-5 text-orange-500" />}
              link="/Content/review" // ✅ Updated Link
            />
            <CardStat
              title="Chương chờ duyệt"
              value={stats?.pendingChapters ?? 0}
              subtitle="Số chương đang chờ"
              icon={<FileText className="w-5 h-5 text-indigo-500" />}
              link="/Content/chapters" // ✅ Updated Link
            />
            <CardStat
              title="Báo cáo mới (hôm nay)"
              value={stats?.newReportsToday ?? 0}
              subtitle="Cần xử lý"
              icon={<AlertCircle className="w-5 h-5 text-red-500" />}
              link="/Content/moderation?tab=reports" // ✅ Updated Link
            />
            <CardStat
              title="Đã duyệt hôm nay"
              value={stats?.approvedToday ?? 0}
              subtitle="Số quyết định hôm nay"
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border border-[var(--border)] bg-[var(--card)]">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-[var(--primary)] flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Hoạt động gần đây
                </h2>
                {/* <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  (Hiện ẩn vì backend chưa cung cấp activity stream)
                </p> */}
                {/* nếu sau này có API activity: render list ở đây */}
              </div>
            </Card>

            <Card className="border border-[var(--border)] bg-[var(--card)]">
              <div className="p-6">
                <h3 className="text-lg font-medium text-[var(--primary)]">Hành động nhanh</h3>
                <div className="mt-4 flex flex-col gap-3">
                  {/* ✅ Updated Links below */}
                  <Link href="/Content/review"><Button className="w-full justify-start bg-blue-500 text-white">Duyệt Truyện</Button></Link>
                  <Link href="/Content/moderation?tab=reports"><Button className="w-full justify-start bg-red-500 text-white">Xử lý Báo Cáo</Button></Link>
                  <Link href="/Content/statistics"><Button variant="outline" className="w-full">Xem Thống kê</Button></Link>
                </div>
              </div>
            </Card>
          </div>

          <Separator className="my-6" />

          {/* <div className="text-sm text-[var(--muted-foreground)]">
            Ghi chú: Dashboard chỉ hiển thị snapshot tức thời. Analytics chi tiết nằm ở trang Thống kê.
          </div> */}
        </>
      )}
    </main>
  );
}