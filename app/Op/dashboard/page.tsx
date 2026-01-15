"use client";

import React, { useState, useEffect } from "react";
// Import Layout chính của hệ thống Admin/Mod
import OpLayout from "@/components/OpLayout";

// Import các thành phần UI (Card, Select, Tabs, Button...)
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Import thư viện biểu đồ Recharts
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

// Import Icon
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Tag,
  Loader2,
  Calendar,
  MessageSquare,
  Star,
  Wallet,
  CalendarDays,
  BarChart3,
  Download,
} from "lucide-react";

// Import API Service (Bao gồm cả API cũ và mới)
import {
  getTrafficUsers,
  getTrafficEngagement,
  getTrendingStories,
  getTopTags,
  getSystemRevenue, // API Cũ
  getRequestStats, // API Cũ
  exportSystemRevenue, // API Cũ
} from "@/services/operationModStatService";

// Định nghĩa kiểu dữ liệu cho Tab con bên phần Vận hành
type ActiveSubTab = "revenue" | "author" | "rank" | "withdraw";

export default function DashboardAnalytics() {
  // --- 1. QUẢN LÝ TRẠNG THÁI (STATE) ---
  const [loading, setLoading] = useState(true); // Trạng thái đang tải
  const [period, setPeriod] = useState("day"); // Bộ lọc thời gian: day, week, month, year
  // Controlled main tab để tránh Tabs bị reset khi period thay đổi.
// Nếu dùng defaultValue thì mỗi lần re-render do setPeriod() sẽ quay về tab "traffic".
  const [mainTab, setMainTab] = useState<"traffic" | "operation">("traffic");
  

  // State cho Tab 1: Traffic & Hành vi
  const [trafficData, setTrafficData] = useState<any>(null);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [trendingStories, setTrendingStories] = useState<any[]>([]);
  const [topTags, setTopTags] = useState<any[]>([]);

  // State cho Tab 2: Vận hành & Doanh thu
  const [isExporting, setIsExporting] = useState(false);
  // Tab con của Vận hành được giữ nguyên khi đổi period
// để UX không bị nhảy về "Doanh thu" mỗi lần đổi thời gian
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>("revenue"); // Tab con đang chọn
  const [opStats, setOpStats] = useState({
    currentRevenue: 0,
    becomeAuthorRequests: 0,
    rankUpRequests: 0,
    withdrawRequests: 0,
    revenueTrend: [] as any[], // Dữ liệu biểu đồ doanh thu
    authorTrend: [] as any[], // Dữ liệu biểu đồ tác giả
    rankUpTrend: [] as any[], // Dữ liệu biểu đồ nâng hạng
    withdrawTrend: [] as any[], // Dữ liệu biểu đồ rút tiền
  });

  // --- 2. CÁC HÀM XỬ LÝ LOGIC (HELPER) ---

  /** Lấy giá trị hiện tại từ API (cho phần Card số liệu cũ) */
  const getCurrentValue = (data: any) => {
    if (!Array.isArray(data?.points) || data.points.length === 0) return 0;
    return data.points[data.points.length - 1]?.value || 0;
  };

  /** Xử lý dữ liệu biểu đồ xu hướng (cho phần Grid chi tiết cũ) */
  const processTrendData = (data: any) => {
    if (!Array.isArray(data?.points)) return [];
 // API trả về dữ liệu theo thứ tự thời gian cũ → mới
// Reverse lại để hiển thị từ gần nhất → xa hơn cho UI dashboard
    return [...data.points].reverse().map((p: any) => ({
      name: p.periodLabel,
      value: p.value,
      fullDate: p.periodStart,
    }));
  };

  /** Chuyển đổi key thời gian sang Tiếng Việt hiển thị */
  const getPeriodLabel = () => {
    switch (period) {
      case "day":
        return "Hôm nay";
      case "week":
        return "Tuần này";
      case "month":
        return "Tháng này";
      case "year":
        return "Năm nay";
      default:
        return "";
    }
  };

  /** Tính toán "Sức khỏe" chỉ số (Tăng/Giảm/Ổn định) - Dùng cho Tab Traffic */
  const calculateHealth = (dataArray: any[], key: string) => {
    if (!dataArray || dataArray.length < 2) return "neutral";
    const first = dataArray[0][key] || 0;
    const last = dataArray[dataArray.length - 1][key] || 0;
    if (first === 0 && last > 0) return "good";
    if (first === 0 && last === 0) return "neutral";
// So sánh điểm đầu và cuối để đánh giá xu hướng (tăng/giảm/ổn định)
// Không dùng trung bình để tránh nhiễu do spike
    const growth = (last - first) / first;
    if (growth > 0.05) return "good"; // Tăng > 5%
    if (growth < -0.05) return "bad"; // Giảm > 5%
    return "neutral";
  };

  /** Render Badge trạng thái (Tốt/Cảnh báo/Ổn định) bằng Tiếng Việt */
  const renderTrendBadge = (status: string) => {
    if (status === "good")
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
          <TrendingUp className="w-3 h-3 mr-1" /> Tốt
        </Badge>
      );
    if (status === "bad")
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          <TrendingDown className="w-3 h-3 mr-1" /> Cảnh báo
        </Badge>
      );
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
        <Minus className="w-3 h-3 mr-1" /> Ổn định
      </Badge>
    );
  };

  // --- 3. FETCH DỮ LIỆU TỪ API ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi song song 8 API để lấy toàn bộ dữ liệu cho cả 2 Tab
        const results = await Promise.allSettled([
          // -- Nhóm Traffic (Tab 1) --
          getTrafficUsers(period),
          getTrafficEngagement(period),
          getTrendingStories(period, 5),
          getTopTags(period, 5),
          // -- Nhóm Vận hành (Tab 2) --
          getSystemRevenue(period),
          getRequestStats("become_author", period),
          getRequestStats("rank_up", period),
          getRequestStats("withdraw", period),
        ]);

        // Hàm giải nén kết quả
        const unwrap = (r: PromiseSettledResult<any>) =>
          r.status === "fulfilled" ? r.value : null;

        // Gán dữ liệu vào State Traffic
        setTrafficData(unwrap(results[0]));
        setEngagementData(unwrap(results[1]));
        setTrendingStories(unwrap(results[2]));
        setTopTags(unwrap(results[3]));

        // Gán dữ liệu vào State Vận hành
        const revenueRes = unwrap(results[4]);
        const authorRes = unwrap(results[5]);
        const rankRes = unwrap(results[6]);
        const withdrawRes = unwrap(results[7]);

        setOpStats({
          currentRevenue: getCurrentValue(revenueRes),
          becomeAuthorRequests: getCurrentValue(authorRes),
          rankUpRequests: getCurrentValue(rankRes),
          withdrawRequests: getCurrentValue(withdrawRes),
          revenueTrend: processTrendData(revenueRes),
          authorTrend: processTrendData(authorRes),
          rankUpTrend: processTrendData(rankRes),
          withdrawTrend: processTrendData(withdrawRes),
        });
      } catch (error) {
        console.error("Lỗi tải Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // --- 4. CHUẨN BỊ DỮ LIỆU HIỂN THỊ ---

  // Logic hiển thị chi tiết cho Tab Vận hành (khi click vào Card)
  const getActiveTrendData = () => {
    switch (activeSubTab) {
      case "author":
        return {
          data: opStats.authorTrend,
          unit: "người",
          label: "Yêu cầu lên Tác giả",
          icon: Users,
          iconBg: "bg-blue-100",
          iconText: "text-blue-600",
        };
      case "rank":
        return {
          data: opStats.rankUpTrend,
          unit: "yêu cầu",
          label: "Yêu cầu Nâng hạng",
          icon: Star,
          iconBg: "bg-yellow-100",
          iconText: "text-yellow-600",
        };
      case "withdraw":
        return {
          data: opStats.withdrawTrend,
          unit: "đơn",
          label: "Yêu cầu Rút tiền",
          icon: Wallet,
          iconBg: "bg-purple-100",
          iconText: "text-purple-600",
        };
      default:
        return {
          data: opStats.revenueTrend,
          unit: "VNĐ",
          label: "Doanh thu hệ thống",
          icon: DollarSign,
          iconBg: "bg-green-100",
          iconText: "text-green-600",
        };
    }
  };
  const activeData = getActiveTrendData();
  const TrendIcon = activeData.icon;

  // Logic dữ liệu biểu đồ Traffic
  const userChartData = trafficData?.data || [];
  const engageChartData = engagementData?.chartData || [];
  const userGrowthHealth = calculateHealth(userChartData, "totalNew");
  const engagementHealth = calculateHealth(engageChartData, "newFollows");

  // Hàm xử lý xuất Excel
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportSystemRevenue(period);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bao_Cao_Doanh_Thu_${period}.xlsx`; // Tên file tiếng Việt
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      alert("Xuất file thất bại. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- 5. GIAO DIỆN CHÍNH (RENDER) ---
  return (
    <main className="p-4 md:p-6 space-y-6 w-full max-w-[1600px] mx-auto pb-10">
      {/* --- HEADER & BỘ LỌC --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-1 rounded-lg">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--primary)]">
            Tổng quan hệ thống
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dữ liệu báo cáo:{" "}
            <span className="font-semibold text-foreground">
              {getPeriodLabel()}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md border text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Thời gian:</span>
          </div>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Theo Ngày</SelectItem>
              <SelectItem value="week">Theo Tuần</SelectItem>
              <SelectItem value="month">Theo Tháng</SelectItem>
              <SelectItem value="year">Theo Năm</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="default"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Xuất Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin w-12 h-12 text-[var(--primary)]" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      ) : (
        /* SỬ DỤNG TABS ĐỂ CHIA GIAO DIỆN LÀM 2 PHẦN RÕ RÀNG */
        <Tabs
          value={mainTab}
          onValueChange={(v) => setMainTab(v as "traffic" | "operation")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 lg:w-[500px] mb-6">
            <TabsTrigger value="traffic">Lưu lượng & Hành vi</TabsTrigger>
            <TabsTrigger value="operation">Vận hành & Doanh thu</TabsTrigger>
          </TabsList>

          {/* --- TAB 1: TRAFFIC & HÀNH VI (CODE MỚI) --- */}
          <TabsContent value="traffic" className="space-y-6">
            {/* Cards KPI Traffic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card: Người dùng mới */}
              <Card className="shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Người dùng mới
                  </CardTitle>
                  <div className="p-2 bg-blue-50 rounded-full">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700">
                    {userChartData
                      .reduce(
                        (acc: number, curr: any) => acc + curr.totalNew,
                        0
                      )
                      .toLocaleString()}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Độc giả & Tác giả
                    </p>
                    {renderTrendBadge(userGrowthHealth)}
                  </div>
                </CardContent>
              </Card>

              {/* Card: Tương tác */}
              <Card className="shadow-sm border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tổng tương tác
                  </CardTitle>
                  <div className="p-2 bg-purple-50 rounded-full">
                    <Activity className="w-4 h-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-700">
                    {(
                      (engagementData?.totalNewFollows || 0) +
                      (engagementData?.totalNewComments || 0)
                    ).toLocaleString()}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Bình luận & Theo dõi
                    </p>
                    {renderTrendBadge(engagementHealth)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Traffic - Fix chiều cao cố định để không vỡ layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Tăng trưởng User */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" /> Tăng trưởng
                    Người dùng
                  </CardTitle>
                  <CardDescription>
                    So sánh lượng Độc giả mới và Tác giả mới
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  {/* Recharts cần container có height cố định,
      nếu không biểu đồ sẽ không render hoặc vỡ layout */}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        opacity={0.2}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        fontSize={12}
                        tickFormatter={(val) =>
                          new Date(val).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                          })
                        }
                      />
                      <YAxis fontSize={12} />
                      <Tooltip
                        labelFormatter={(l) =>
                          `Ngày: ${new Date(l).toLocaleDateString("vi-VN")}`
                        }
                        formatter={(value: number, name: string) => [
                          value,
                          name === "newReaders" ? "Độc giả mới" : "Tác giả mới",
                        ]}
                      />
                      <Legend
                        formatter={(value) =>
                          value === "newReaders" ? "Độc giả mới" : "Tác giả mới"
                        }
                      />
                      <Bar
                        dataKey="newReaders"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[0, 0, 4, 4]}
                      />
                      <Bar
                        dataKey="newAuthors"
                        stackId="a"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 2: Xu hướng Tương tác */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-orange-500" /> Xu
                    hướng Tương tác
                  </CardTitle>
                  <CardDescription>
                    Biến động bình luận và lượt theo dõi
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={engageChartData}>
                      <defs>
                        <linearGradient
                          id="colorCom"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f97316"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f97316"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorFol"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#8b5cf6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        opacity={0.2}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        fontSize={12}
                        tickFormatter={(val) =>
                          new Date(val).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                          })
                        }
                      />
                      <YAxis fontSize={12} />
                      <Tooltip
                        labelFormatter={(l) =>
                          `Ngày: ${new Date(l).toLocaleDateString("vi-VN")}`
                        }
                        formatter={(value: number, name: string) => [
                          value,
                          name === "newComments" ? "Bình luận" : "Theo dõi",
                        ]}
                      />
                      <Legend
                        formatter={(value) =>
                          value === "newComments"
                            ? "Bình luận mới"
                            : "Theo dõi mới"
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="newComments"
                        stroke="#f97316"
                        fillOpacity={1}
                        fill="url(#colorCom)"
                      />
                      <Area
                        type="monotone"
                        dataKey="newFollows"
                        stroke="#8b5cf6"
                        fillOpacity={1}
                        fill="url(#colorFol)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Lists (Top Stories & Tags) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Danh sách truyện Hot */}
              <Card className="shadow-sm h-[400px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-pink-500" /> Truyện Nổi
                    bật
                  </CardTitle>
                  <CardDescription>
                    Top tác phẩm có lượt xem cao nhất
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto pr-2">
                  <div className="space-y-3">
                    {trendingStories.map((story, i) => (
                      <div
                        key={story.storyId}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="relative w-10 h-14 bg-muted flex-shrink-0">
                          {/* Dùng img thay vì Image để tránh lỗi config domain */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={story.coverUrl}
                            alt="Cover"
                            className="w-full h-full object-cover rounded shadow-sm"
                          />
                          <div className="absolute top-0 left-0 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-br font-bold">
                            #{i + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className="text-sm font-medium truncate"
                            title={story.title}
                          >
                            {story.title}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {story.authorName}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="whitespace-nowrap ml-2"
                        >
                          {story.totalViewsInPeriod.toLocaleString()} lượt xem
                        </Badge>
                      </div>
                    ))}
                    {trendingStories.length === 0 && (
                      <p className="text-center text-muted-foreground pt-10">
                        Chưa có dữ liệu
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Biểu đồ Tags */}
              <Card className="shadow-sm h-[400px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-500" /> Thể loại Quan
                    tâm
                  </CardTitle>
                  <CardDescription>
                    Top thể loại được đọc nhiều nhất
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={topTags}
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        opacity={0.2}
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="tagName"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12, fill: "var(--foreground)" }}
                      />
                      <Tooltip
                        formatter={(value: number) => [value, "Lượt xem"]}
                        cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                      />
                      <Bar
                        dataKey="totalViews"
                        fill="#6366f1"
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                        name="Lượt xem"
                      >
                        {topTags.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index < 3 ? "#ef4444" : "#6366f1"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- TAB 2: VẬN HÀNH & DOANH THU (CODE CŨ GIỮ NGUYÊN) --- */}
          <TabsContent value="operation" className="space-y-6">
            {/* 4 Cards click được để xem chi tiết */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 1. Doanh thu */}
              <div
                onClick={() => setActiveSubTab("revenue")}
                className="cursor-pointer group"
              >
                <Card
                  className={`border-l-4 border-l-green-500 transition-all ${
                    activeSubTab === "revenue"
                      ? "ring-2 ring-green-500 shadow-lg scale-[1.02]"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Doanh thu hệ thống
                    </CardTitle>
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700">
                      {opStats.currentRevenue.toLocaleString()} đ
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 2. Yêu cầu lên Tác giả */}
              <div
                onClick={() => setActiveSubTab("author")}
                className="cursor-pointer group"
              >
                <Card
                  className={`border-l-4 border-l-blue-500 transition-all ${
                    activeSubTab === "author"
                      ? "ring-2 ring-blue-500 shadow-lg scale-[1.02]"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Yêu cầu lên Tác giả
                    </CardTitle>
                    <Users className="w-4 h-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-700">
                      {opStats.becomeAuthorRequests}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 3. Yêu cầu Nâng hạng */}
              <div
                onClick={() => setActiveSubTab("rank")}
                className="cursor-pointer group"
              >
                <Card
                  className={`border-l-4 border-l-yellow-500 transition-all ${
                    activeSubTab === "rank"
                      ? "ring-2 ring-yellow-500 shadow-lg scale-[1.02]"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Yêu cầu Nâng hạng
                    </CardTitle>
                    <Star className="w-4 h-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-700">
                      {opStats.rankUpRequests}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 4. Yêu cầu Rút tiền */}
              <div
                onClick={() => setActiveSubTab("withdraw")}
                className="cursor-pointer group"
              >
                <Card
                  className={`border-l-4 border-l-purple-500 transition-all ${
                    activeSubTab === "withdraw"
                      ? "ring-2 ring-purple-500 shadow-lg scale-[1.02]"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Đơn rút tiền
                    </CardTitle>
                    <Wallet className="w-4 h-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-700">
                      {opStats.withdrawRequests}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Grid chi tiết bên dưới (Dữ liệu thay đổi theo Card được chọn) */}
            <Card className="shadow-sm border border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className={`w-5 h-5 ${activeData.iconText}`} />
                  Chi tiết:{" "}
                  <span className={activeData.iconText}>
                    {activeData.label}
                  </span>
                </CardTitle>
                <CardDescription>
                  Biến động số liệu chi tiết theo thời gian
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeData.data.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {activeData.data.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDays className="w-4 h-4" />
                            <span>
                              {/* Format ngày tháng hiển thị */}
                              {period === "day" || period === "week"
                                ? new Date(item.name).toLocaleDateString(
                                    "vi-VN"
                                  )
                                : item.name}
                            </span>
                          </div>
                          <div
                            className={`p-1.5 rounded-md ${activeData.iconBg}`}
                          >
                            <TrendIcon
                              className={`w-3.5 h-3.5 ${activeData.iconText}`}
                            />
                          </div>
                        </div>
                        <div className="mt-1">
                          <span className="text-xl font-bold text-foreground">
                            {item.value.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {activeData.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-muted-foreground flex flex-col items-center bg-muted/20 rounded-lg border border-dashed">
                    <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                    <p>
                      Không có dữ liệu{" "}
                      <span className="font-medium">{activeData.label}</span>{" "}
                      trong khoảng thời gian này.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
