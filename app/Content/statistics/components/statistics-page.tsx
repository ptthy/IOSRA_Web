/**
 * @page StatisticsPage
 * @description Trang báo cáo số liệu bằng biểu đồ.
 * Sử dụng thư viện Recharts để hiển thị xu hướng kiểm duyệt và phân loại vi phạm.
 */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";
import { 
    getContentModStats, 
    getViolationBreakdown, 
    exportContentModStats, // Hàm xuất file
    StatSeriesResponse, 
    ViolationStatsResponse 
} from "@/services/moderationApi";
import { Roboto } from "next/font/google";

type Period = "day" | "week" | "month" | "year";
type Endpoint = "stories" | "chapters" | "story-decisions" | "reports" | "reports/handled";

const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700"],
});

const ENDPOINTS: { label: string; value: Endpoint }[] = [
  { label: "Truyện (Đã đăng)", value: "stories" },
  { label: "Chương (Đã đăng)", value: "chapters" },
  { label: "Quyết định (duyệt/từ chối)", value: "story-decisions" },
  { label: "Báo cáo mới", value: "reports" },
  { label: "Báo cáo đã xử lý", value: "reports/handled" },
];

const PERIODS: { label: string; value: Period }[] = [
  { label: "Theo ngày", value: "day" },
  { label: "Theo tuần", value: "week" },
  { label: "Theo tháng", value: "month" },
  { label: "Theo năm", value: "year" },
];

const PIE_COLORS = ["#8B5FBF", "#5D3FD3", "#A97FE3", "#E0D4EE", "#B6A77B", "#FF7F50", "#4682B4", "#3CB371"];

export default function StatisticsPage(): JSX.Element {
  // Lấy dữ liệu Breakdown (Biểu đồ tròn) để xem lý do vi phạm nào chiếm đa số
  const [endpoint, setEndpoint] = useState<Endpoint>("stories");
  const [period, setPeriod] = useState<Period>("day");
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);

  const [series, setSeries] = useState<StatSeriesResponse | null>(null);
  const [seriesLoading, setSeriesLoading] = useState<boolean>(false);
  const [seriesError, setSeriesError] = useState<string | null>(null);

  const [violation, setViolation] = useState<ViolationStatsResponse | null>(null);
  const [violationLoading, setViolationLoading] = useState<boolean>(false);

  // State hiển thị loading khi xuất file
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Fetch series (Bar Chart)
  const fetchSeries = useCallback(async () => {
    setSeriesLoading(true);
    setSeriesError(null);
    try {
      const q: { period?: Period; from?: string; to?: string } = { period };
      if (from) q.from = from;
      if (to) q.to = to;
      const res = await getContentModStats(endpoint, q);
      setSeries(res);
    } catch (err: unknown) {
      console.error(err);
      setSeries(null);
      setSeriesError("Không lấy được dữ liệu biểu đồ. Thử lại sau.");
    } finally {
      setSeriesLoading(false);
    }
  }, [endpoint, period, from, to]);

  // Fetch violation breakdown (Pie Chart - Aggregated from Real Data)
  const fetchViolation = useCallback(async () => {
    setViolationLoading(true);
    try {
      const res = await getViolationBreakdown();
      setViolation(res);
    } catch (err) {
      console.error("Lỗi violation", err);
      setViolation(null);
    } finally {
      setViolationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
    fetchViolation();
  }, [fetchSeries, fetchViolation]);

  /**
   * Hàm xuất file báo cáo (Excel/CSV).
   * Dữ liệu nhận về là một Blob (nhị phân), sau đó tạo link ảo để trình duyệt tải về.
   */
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Gọi API xuất file với các filter hiện tại
      const blob = await exportContentModStats(endpoint, { 
        period, 
        from, 
        to 
      });

      // Tạo link download ảo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Tạo tên file: stats-{loại}-{ngày}.xlsx
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `stats-${endpoint}-${timestamp}.xlsx`; 
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error("Export failed", error);
      alert("Xuất file thất bại. Có thể backend chưa hỗ trợ định dạng này.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className={`${roboto.className} p-8 min-h-screen bg-[var(--background)]`}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--primary)]">Thống Kê Kiểm Duyệt</h1>
          <p className="text-[var(--muted-foreground)]">Phân tích theo khoảng thời gian</p>
        </div>
        
        {/* Nút Xuất Excel */}
        <Button 
            className="bg-[var(--primary)] text-[var(--primary-foreground)]" 
            onClick={handleExport}
            disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {isExporting ? "Đang xuất..." : "Xuất Excel"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Left: Bar Chart */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={endpoint} onValueChange={(v) => setEndpoint(v as Endpoint)}>
              <SelectTrigger className="w-64 bg-[var(--card)] border border-[var(--border)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card)] border border-[var(--border)]">
                {ENDPOINTS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-40 bg-[var(--card)] border border-[var(--border)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card)] border border-[var(--border)]">
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--muted-foreground)]">Từ</label>
              <input
                type="date"
                className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--card)] text-sm"
                onChange={(e) => setFrom(e.target.value || undefined)}
                value={from ?? ""}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--muted-foreground)]">Đến</label>
              <input
                type="date"
                className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--card)] text-sm"
                onChange={(e) => setTo(e.target.value || undefined)}
                value={to ?? ""}
              />
            </div>

            <Button onClick={fetchSeries}>Áp dụng</Button>
          </div>

          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">
                {ENDPOINTS.find((e) => e.value === endpoint)?.label} — Tổng: {series?.total?.toLocaleString() ?? "..."}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {seriesLoading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                </div>
              )}

              {seriesError && <div className="text-red-600 py-6 text-center">{seriesError}</div>}

              {!seriesLoading && !seriesError && series && series.points.length > 0 && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series.points} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="periodLabel" stroke="var(--foreground)" />
                      <YAxis stroke="var(--foreground)" tickFormatter={(v) => v.toLocaleString()} />
                      <Tooltip formatter={(v: number) => v.toLocaleString()} />
                      <Bar dataKey="value" name="Số lượng" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {!seriesLoading && !seriesError && (!series || series.points.length === 0) && (
                <div className="py-12 text-center text-[var(--muted-foreground)]">Không có dữ liệu để hiển thị.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Pie Chart */}
        <div className="h-full flex flex-col">
          <Card className="border border-[var(--border)] bg-[var(--card)] flex flex-col h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-[var(--primary)] text-lg">
                Phân loại vi phạm
                <span className="block mt-1 text-xs font-normal text-[var(--muted-foreground)]">
                  (Dựa trên 100 báo cáo gần nhất)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {violationLoading && (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}

              {!violationLoading && violation && violation.breakdown.length > 0 && (
                <>
                  <div className="min-h-80 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <Pie
                          data={violation.breakdown}
                          dataKey="count"
                          nameKey="violationType"
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          innerRadius="45%"
                          paddingAngle={3}
                          cornerRadius={8}
                        >
                          {violation.breakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                              stroke="var(--card)"
                              strokeWidth={4}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => value.toLocaleString()}
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "14px",
                          }}
                        />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          height={60}
                          iconType="circle"
                          formatter={(value) => <span className="text-sm">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Tổng số mẫu:{" "}
                      <span className="font-semibold text-foreground">
                        {violation.totalReports.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </>
              )}

              {!violationLoading && (!violation || violation.breakdown.length === 0) && (
                <div className="flex-1 flex items-center justify-center text-[var(--muted-foreground)]">
                  Không có dữ liệu phân loại vi phạm.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}