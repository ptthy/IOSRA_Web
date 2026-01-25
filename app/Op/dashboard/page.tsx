"use client";

import React, { useState, useEffect } from "react";
// Import Layout chính
import OpLayout from "@/components/OpLayout";

// Import UI Components
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

// Import Recharts
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

// Import Icons (Đã thêm Eye)
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
  Eye,
} from "lucide-react";

// Import API
import {
  getTrafficUsers,
  getTrafficEngagement,
  getTrendingStories,
  getTopTags,
  getSystemRevenue,
  getRequestStats,
  exportSystemRevenue,
} from "@/services/operationModStatService";

type ActiveSubTab = "revenue" | "author" | "rank" | "withdraw";

export default function DashboardAnalytics() {
  // --- 1. STATE ---
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("day");
  const [activeMainTab, setActiveMainTab] = useState("traffic");

  // State Traffic
  const [trafficData, setTrafficData] = useState<any>(null);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [trendingStories, setTrendingStories] = useState<any[]>([]);
  const [topTags, setTopTags] = useState<any[]>([]);

  // State Operation
  const [isExporting, setIsExporting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>("revenue");
  const [opStats, setOpStats] = useState({
    currentRevenue: 0,
    becomeAuthorRequests: 0,
    rankUpRequests: 0,
    withdrawRequests: 0,
    revenueTrend: [] as any[],
    authorTrend: [] as any[],
    rankUpTrend: [] as any[],
    withdrawTrend: [] as any[],
  });

  // --- 2. HELPERS ---
  const getCurrentValue = (data: any) => {
    if (!Array.isArray(data?.points) || data.points.length === 0) return 0;
    return data.points[data.points.length - 1]?.value || 0;
  };

  const processTrendData = (data: any) => {
    if (!Array.isArray(data?.points)) return [];
    return [...data.points].reverse().map((p: any) => ({
      name: p.periodLabel,
      value: p.value,
      fullDate: p.periodStart,
    }));
  };

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

  /*
    So sánh kỳ đầu và kỳ cuối
    để biết đang:
      - tăng
      - giảm
      - hay đứng yên
      ((Giá trị mới - Giá trị cũ) / Giá trị cũ) * 100%
*/
  const calculateHealth = (dataArray: any[], key: string) => {
    // Nếu không có dữ liệu hoặc chỉ có 1 điểm dữ liệu -> Không thể so sánh xu hướng -> Trung lập
    if (!dataArray || dataArray.length < 2) return "neutral";

    const first = dataArray[0][key] || 0; // Giá trị ở thời điểm bắt đầu chu kỳ
    const last = dataArray[dataArray.length - 1][key] || 0; // Giá trị ở thời điểm mới nhất

    // Từ 0 lên >0 → hệ thống bắt đầu hoạt động → tốt
    if (first === 0 && last > 0) return "good";

    // Không có gì thay đổi
    if (first === 0 && last === 0) return "neutral";

    // Tính tỷ lệ tăng trưởng
    const growth = (last - first) / first;

    // Đây là ngưỡng 5%. Nếu thay đổi dưới 5% thì coi như là "ổn định" (đi ngang).
    if (growth > 0.05) return "good"; // Tăng trưởng hơn 5% -> Tốt
    if (growth < -0.05) return "bad"; // Sụt giảm hơn 5% -> Xấu

    return "neutral"; // Thay đổi rất ít (-5% đến +5%) -> Bình thường
  };

  const renderTrendBadge = (status: string) => {
    if (status === "good")
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
          <TrendingUp className="w-3 h-3 mr-1" /> Tốt
        </Badge>
      );
    if (status === "bad")
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
          <TrendingDown className="w-3 h-3 mr-1" /> Cảnh báo
        </Badge>
      );
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">
        <Minus className="w-3 h-3 mr-1" /> Ổn định
      </Badge>
    );
  };

  // --- 3. API CALLS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          getTrafficUsers(period),
          getTrafficEngagement(period),
          getTrendingStories(period, 5),
          getTopTags(period, 5),
          getSystemRevenue(period),
          getRequestStats("become_author", period),
          getRequestStats("rank_up", period),
          getRequestStats("withdraw", period),
        ]);

        const unwrap = (r: PromiseSettledResult<any>) =>
          r.status === "fulfilled" ? r.value : null;

        setTrafficData(unwrap(results[0]));
        setEngagementData(unwrap(results[1]));
        setTrendingStories(unwrap(results[2]));
        setTopTags(unwrap(results[3]));

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
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  // --- 4. CALCULATIONS (PHẦN BẠN BỊ THIẾU) ---

  // Logic hiển thị chi tiết cho Tab Vận hành
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

  /** * Lấy danh sách dữ liệu biểu đồ từ API.
   * Sử dụng ?. (optional chaining) và || [] (fallback) để đảm bảo
   * nếu API lỗi hoặc chưa có dữ liệu thì biến vẫn là một mảng rỗng,
   * giúp tránh lỗi "undefined" khi thực hiện các hàm map/reduce ở dưới.
   */
  const userChartData = trafficData?.data || [];
  const engageChartData = engagementData?.chartData || [];
  /**
   * TÍNH TỔNG NGƯỜI DÙNG MỚI:
   * Duyệt qua mảng dữ liệu từng ngày (userChartData) và cộng dồn trường 'totalNew'.
   * - acc (accumulator): Biến tích lũy, giữ tổng số điểm sau mỗi vòng lặp.
   * - curr (current): Phần tử của ngày hiện tại đang xét.
   * - 0: Giá trị khởi tạo cho tổng.
   */
  const totalNewUsers = userChartData.reduce(
    (acc: number, curr: any) => acc + (curr.totalNew || 0),
    0
  );
  /**
   * TÍNH TỔNG TƯƠNG TÁC:
   */
  const totalEngagement =
    (engagementData?.totalNewFollows || 0) +
    (engagementData?.totalNewComments || 0);
  /**
   * Đưa mảng dữ liệu vào hàm calculateHealth để so sánh ngày đầu và ngày cuối.
   */
  const userGrowthHealth = calculateHealth(userChartData, "totalNew");

  /**
   * Kiểm tra xem lượng tương tác (Follow/Comment) đang tăng hay giảm
   * so với thời điểm bắt đầu chu kỳ.
   */
  const engagementHealth = calculateHealth(engageChartData, "newFollows");

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportSystemRevenue(period);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bao_Cao_${period}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      alert("Lỗi xuất file");
    } finally {
      setIsExporting(false);
    }
  };

  // --- 5. RENDER ---
  return (
    <main className="p-4 md:p-6 space-y-6 w-full max-w-[1600px] mx-auto pb-10">
      {/* HEADER */}
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
              <SelectValue />
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
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}{" "}
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
        <Tabs
          value={activeMainTab}
          onValueChange={setActiveMainTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 lg:w-[500px] mb-6">
            <TabsTrigger value="traffic">Lưu lượng & Hành vi</TabsTrigger>
            <TabsTrigger value="operation">Vận hành & Doanh thu</TabsTrigger>
          </TabsList>

          {/* TAB 1: TRAFFIC */}
          <TabsContent value="traffic" className="space-y-6">
            {/* Grid 3 cột: User - Views - Engagement */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Người dùng mới */}
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
                    {totalNewUsers.toLocaleString()}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Độc giả & Tác giả
                    </p>
                    {renderTrendBadge(userGrowthHealth)}
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Tổng lượt xem (Mới thêm) */}
              <Card className="shadow-sm border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Lượt đọc truyện
                  </CardTitle>
                  <div className="p-2 bg-orange-50 rounded-full">
                    <Eye className="w-4 h-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-700">
                    {(engagementData?.totalViews || 0).toLocaleString()}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Lượt xem toàn trang
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                    >
                      Mức tiêu thụ
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Tương tác */}
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
                    {totalEngagement.toLocaleString()}
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" /> Tăng trưởng
                    Người dùng
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
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
                          new Date(l).toLocaleDateString("vi-VN")
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="newReaders"
                        name="Độc giả"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[0, 0, 4, 4]}
                      />
                      <Bar
                        dataKey="newAuthors"
                        name="Tác giả"
                        stackId="a"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-orange-500" /> Xu
                    hướng Tương tác
                  </CardTitle>
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
                          new Date(l).toLocaleDateString("vi-VN")
                        }
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="newComments"
                        name="Bình luận"
                        stroke="#f97316"
                        fillOpacity={1}
                        fill="url(#colorCom)"
                      />
                      <Area
                        type="monotone"
                        dataKey="newFollows"
                        name="Theo dõi"
                        stroke="#8b5cf6"
                        fillOpacity={1}
                        fill="url(#colorFol)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm h-[400px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-pink-500" /> Truyện Nổi
                    bật
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto pr-2">
                  <div className="space-y-3">
                    {trendingStories.map((story, i) => (
                      <div
                        key={story.storyId}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="relative w-10 h-14 bg-muted flex-shrink-0">
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
                          {story.totalViewsInPeriod.toLocaleString()} views
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm h-[400px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-500" /> Thể loại Quan
                    tâm
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={topTags}
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="tagName"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12, fill: "var(--foreground)" }}
                      />

                      {/* --- 👇 SỬA Ở ĐÂY (Thay thế <Tooltip /> cũ bằng đoạn này) 👇 --- */}
                      <Tooltip
                        cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border text-popover-foreground shadow-md rounded-lg p-3 text-sm">
                                <p className="font-bold mb-2 text-[var(--primary)]">
                                  {data.tagName}
                                </p>
                                <div className="flex justify-between gap-8 mb-1">
                                  <span className="text-muted-foreground">
                                    Tổng lượt xem:
                                  </span>
                                  <span className="font-semibold">
                                    {data.totalViews.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-8">
                                  <span className="text-muted-foreground">
                                    Số lượng truyện:
                                  </span>
                                  <span className="font-semibold">
                                    {data.storyCount}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
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

          {/* TAB 2: OPERATION */}
          <TabsContent value="operation" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <Card className="shadow-sm border border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className={`w-5 h-5 ${activeData.iconText}`} />{" "}
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
                              {period === "day" || period === "week"
                                ? new Date(item.fullDate).toLocaleDateString(
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
