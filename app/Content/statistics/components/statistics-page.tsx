/**
 * @page StatisticsPage
 * @description Trang báo cáo số liệu tổng hợp.
 * Kết hợp Traffic Light (Sức khỏe hệ thống) và Biểu đồ chi tiết (Recharts).
 */
"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Activity, Calendar, BarChart3, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { 
    getContentModStats, 
    getViolationBreakdown, 
    exportContentModStats,
    StatSeriesResponse, 
    ViolationStatsResponse,
    ViolationStat
} from "@/services/moderationApi";
import { toast } from "sonner";
import { ModerationHealthDashboard } from "./moderation-health-dashboard";

 

// ==================================================================================
// PHẦN 2: COMPONENT CHÍNH - STATISTICS DASHBOARD (CHỨA CẢ HEALTH VÀ CHARTS)
// ==================================================================================

type Period = "day" | "week" | "month" | "year";
type Endpoint = "stories" | "chapters" | "story-decisions" | "reports" | "reports/handled";

const ENDPOINTS: { label: string; value: Endpoint }[] = [
  { label: "Truyện (published)", value: "stories" },
  { label: "Chương (published)", value: "chapters" },
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

export default function StatisticsDashboard() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>("stories");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("month");
  
  // State dữ liệu
  const [seriesData, setSeriesData] = useState<StatSeriesResponse | null>(null);
  const [violationData, setViolationData] = useState<ViolationStatsResponse | null>(null);
  
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [violationLoading, setViolationLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // --- 1. Fetch Dữ liệu Biểu đồ Cột (Trend) ---
  const fetchSeries = async () => {
    setSeriesLoading(true);
    try {
      const data = await getContentModStats(selectedEndpoint, { period: selectedPeriod });
      setSeriesData(data);
    } catch (err) {
      console.error("Lỗi fetch series:", err);
      setSeriesData(null);
    } finally {
      setSeriesLoading(false);
    }
  };

  // --- 2. Fetch Dữ liệu Biểu đồ Tròn (Violation) ---
  const fetchViolation = async () => {
    setViolationLoading(true);
    try {
      const data = await getViolationBreakdown();
      setViolationData(data);
    } catch (err) {
      console.error("Lỗi fetch violation:", err);
      setViolationData(null);
    } finally {
      setViolationLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, [selectedEndpoint, selectedPeriod]);

  useEffect(() => {
    fetchViolation();
  }, []); // Chỉ load 1 lần khi mount

  // --- 3. Xử lý xuất Excel ---
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportContentModStats(selectedEndpoint, { period: selectedPeriod });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Statistic_${selectedEndpoint}_${selectedPeriod}_${new Date().toISOString()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Đã xuất báo cáo thành công!");
    } catch (error) {
      toast.error("Xuất báo cáo thất bại.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--primary)] mb-1">Thống Kê Kiểm Duyệt</h1>
          <p className="text-[var(--muted-foreground)]">Theo dõi sức khỏe hệ thống và phân tích dữ liệu</p>
        </div>
      </div>

      {/* SECTION 1: HEALTH MONITORING (Traffic Light) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
           <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">
  Sức khỏe hệ thống ({PERIODS.find(p => p.value === selectedPeriod)?.label})
</h2>
        </div>
        <ModerationHealthDashboard period={selectedPeriod} />
      </section>

      {/* SECTION 2: ANALYTICS (Charts) */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-bold text-[var(--foreground)]">Phân tích chi tiết</h2>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select value={selectedEndpoint} onValueChange={(val: Endpoint) => setSelectedEndpoint(val)}>
                <SelectTrigger className="w-[200px] bg-[var(--card)] border-[var(--border)]">
                  <SelectValue placeholder="Chọn loại dữ liệu" />
                </SelectTrigger>
                <SelectContent>
                  {ENDPOINTS.map((ep) => (
                    <SelectItem key={ep.value} value={ep.value}>{ep.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPeriod} onValueChange={(val: Period) => setSelectedPeriod(val)}>
                <SelectTrigger className="w-[150px] bg-[var(--card)] border-[var(--border)]">
                  <SelectValue placeholder="Chọn chu kỳ" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExport} disabled={exporting}>
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  Xuất Excel
              </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cột Trái: Biểu đồ Cột (Trend) */}
            <Card className="lg:col-span-2 border border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Xu hướng: {ENDPOINTS.find(e => e.value === selectedEndpoint)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {seriesLoading ? (
                    <div className="h-[350px] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                    </div>
                  ) : !seriesData || seriesData.points.length === 0 ? (
                    <div className="h-[350px] flex items-center justify-center text-[var(--muted-foreground)]">
                      Không có dữ liệu trong khoảng thời gian này.
                    </div>
                  ) : (
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={seriesData.points} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis 
                            dataKey="periodLabel" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                            dy={10} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--card)', 
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                            formatter={(value: number) => [value.toLocaleString(), 'Số lượng']}
                          />
                          <Bar 
                            dataKey="value" 
                            fill="var(--primary)" 
                            radius={[4, 4, 0, 0]} 
                            maxBarSize={50} 
                            name="Số lượng"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
            </Card>

            {/* Cột Phải: Biểu đồ Tròn (Violation Breakdown) */}
            <Card className="border border-[var(--border)] bg-[var(--card)]">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-[var(--foreground)]">Phân loại lý do vi phạm</CardTitle>
                </CardHeader>
                <CardContent>
                  {violationLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                    </div>
                  ) : !violationData || violationData.breakdown.length === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-[var(--muted-foreground)]">
                      <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                      <p>Chưa có dữ liệu vi phạm</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={violationData.breakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="count"
                              nameKey="violationType"
                            >
                              {violationData.breakdown.map((entry: ViolationStat, index: number) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                               formatter={(value: number) => value.toLocaleString()}
                               contentStyle={{ 
                                  backgroundColor: 'var(--card)', 
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px'
                               }}
                            />
                            <Legend 
                              layout="horizontal" 
                              verticalAlign="bottom" 
                              align="center"
                              iconType="circle"
                              className="text-xs"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center mt-2">
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Tổng mẫu phân tích: <span className="font-bold text-[var(--foreground)]">{violationData.totalReports}</span>
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}