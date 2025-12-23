"use client";

import React, { useState, useEffect } from "react";
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
import {
  DollarSign,
  Users,
  Star,
  Wallet,
  Calendar,
  Download,
  Loader2,
  TrendingUp,
  CalendarDays,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  getSystemRevenue,
  getRequestStats,
  exportSystemRevenue,
} from "@/services/operationModStatService";

type ActiveTab = "revenue" | "author" | "rank" | "withdraw";

export default function DashboardAnalytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("day");
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("revenue");

  const [stats, setStats] = useState({
    currentRevenue: 0,
    becomeAuthorRequests: 0,
    rankUpRequests: 0,
    withdrawRequests: 0,
    revenueTrend: [] as any[],
    authorTrend: [] as any[],
    rankUpTrend: [] as any[],
    withdrawTrend: [] as any[],
  });

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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportSystemRevenue(period);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Revenue_Report_${period}_${new Date()
        .toISOString()
        .split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Xuất file thất bại.");
    } finally {
      setIsExporting(false);
    }
  };

  /** 👉 LẤY VALUE CỦA PERIOD HIỆN TẠI (CHO CARD) */
  const getCurrentValue = (data: any) => {
    if (!Array.isArray(data?.points) || data.points.length === 0) return 0;
    return data.points[data.points.length - 1]?.value || 0;
  };

  /** 👉 DATA CHO BẢNG BIẾN ĐỘNG */
  const processTrendData = (data: any) => {
    if (!Array.isArray(data?.points)) return [];
    return [...data.points].reverse().map((p: any) => ({
      name: p.periodLabel,
      value: p.value,
      fullDate: p.periodStart,
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const results = await Promise.allSettled([
          getSystemRevenue(period),
          getRequestStats("become_author", period),
          getRequestStats("rank_up", period),
          getRequestStats("withdraw", period),
        ]);

        const unwrap = (r: PromiseSettledResult<any>) =>
          r.status === "fulfilled" ? r.value : null;

        const revenueRes = unwrap(results[0]);
        const authorRes = unwrap(results[1]);
        const rankRes = unwrap(results[2]);
        const withdrawRes = unwrap(results[3]);

        setStats({
          /** ✅ CARD = VALUE CỦA PERIOD */
          currentRevenue: getCurrentValue(revenueRes),
          becomeAuthorRequests: getCurrentValue(authorRes),
          rankUpRequests: getCurrentValue(rankRes),
          withdrawRequests: getCurrentValue(withdrawRes),

          /** ✅ BẢNG DƯỚI = BIẾN ĐỘNG */
          revenueTrend: processTrendData(revenueRes),
          authorTrend: processTrendData(authorRes),
          rankUpTrend: processTrendData(rankRes),
          withdrawTrend: processTrendData(withdrawRes),
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

const getActiveTrendData = () => {
  switch (activeTab) {
    case "author":
      return {
        data: stats.authorTrend,
        unit: "người",
        label: "Yêu cầu lên Author",
        icon: Users,
        iconBg: "bg-blue-100",
        iconText: "text-blue-600",
      };

    case "rank":
      return {
        data: stats.rankUpTrend,
        unit: "yêu cầu",
        label: "Yêu cầu nâng hạng",
        icon: Star,
        iconBg: "bg-yellow-100",
        iconText: "text-yellow-600",
      };

    case "withdraw":
      return {
        data: stats.withdrawTrend,
        unit: "đơn",
        label: "Yêu cầu rút tiền",
        icon: Wallet,
        iconBg: "bg-purple-100",
        iconText: "text-purple-600",
      };

    default:
      return {
        data: stats.revenueTrend,
        unit: "VNĐ",
        label: "Doanh thu",
        icon: DollarSign,
        iconBg: "bg-green-100",
        iconText: "text-green-600",
      };
  }
};

  const activeData = getActiveTrendData();
const TrendIcon = activeData.icon;
  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--primary)]">
            Tổng quan hệ thống
          </h1>
          <p className="text-sm text-muted-foreground">
            Dữ liệu báo cáo:{" "}
            <span className="font-semibold">{getPeriodLabel()}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
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
            )}
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div onClick={() => setActiveTab("revenue")} className="cursor-pointer">
          <Card className="bg-white border-l-4 border-l-green-500">
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Doanh thu</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.currentRevenue.toLocaleString()} VNĐ
              </div>
              <p className="text-xs text-muted-foreground">
                Tổng doanh thu theo {getPeriodLabel()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Author */}
        <div onClick={() => setActiveTab("author")} className="cursor-pointer">
          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Yêu cầu lên Author</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.becomeAuthorRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                Tổng yêu cầu theo {getPeriodLabel()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rank */}
        <div onClick={() => setActiveTab("rank")} className="cursor-pointer">
          <Card className="bg-white border-l-4 border-l-yellow-500">
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Yêu cầu nâng hạng</CardTitle>
              <Star className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.rankUpRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                Tổng yêu cầu theo {getPeriodLabel()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw */}
        <div onClick={() => setActiveTab("withdraw")} className="cursor-pointer">
          <Card className="bg-white border-l-4 border-l-purple-500">
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Yêu cầu đối soát</CardTitle>
              <Wallet className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.withdrawRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                Tổng đơn theo {getPeriodLabel()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

  {/* 2. Detailed Data Grid (Dynamic based on Selection) */}
        <Card className="shadow-sm border border-[var(--border)]">
          <CardHeader>
  <CardTitle className="flex items-center gap-2">
 <TrendingUp className={`w-5 h-5 ${activeData.iconText}`} />
    Chi tiết: {activeData.label}
  </CardTitle>
  <CardDescription>
    Biến động số liệu theo thời gian
  </CardDescription>
</CardHeader>

            <CardContent>
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : activeData.data.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {activeData.data.map((item, index) => (
                            <div 
                                key={index} 
                                className="flex flex-col p-4 rounded-lg border bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CalendarDays className="w-4 h-4" />
                                        <span>{period === 'day' || period === 'week' ? item.name.split('T')[0] : item.name}</span>
                                    </div>
                                   <div className={`p-1 rounded ${activeData.iconBg}`}>
                                         <TrendIcon className={`w-3 h-3 ${activeData.iconText}`} />
                                    </div>
                                </div>
                                <div className="mt-1">
                                    <span className="text-lg font-bold text-[var(--foreground)]">
                                        {item.value.toLocaleString()} 
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-1">{activeData.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                        <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                        Không có dữ liệu {activeData.label} trong khoảng thời gian này.
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
  );
}
