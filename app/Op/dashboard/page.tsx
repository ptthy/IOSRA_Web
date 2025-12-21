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
  ArrowUpRight,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"; // Nếu bạn có component này, nếu không dùng div thường

import {
  getSystemRevenue,
  getRequestStats,
  exportSystemRevenue,
} from "@/services/operationModStatService";

export default function DashboardAnalytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("day");
  const [isExporting, setIsExporting] = useState(false);

  const [stats, setStats] = useState({
    currentRevenue: 0,
    totalRevenueAccumulated: 0,
    becomeAuthorRequests: 0,
    rankUpRequests: 0,
    withdrawRequests: 0,
    revenueTrend: [] as any[], // Dữ liệu chi tiết từng mốc
  });

  const getRevenueLabel = () => {
    switch (period) {
      case "day": return "hôm nay";
      case "week": return "tuần này";
      case "month": return "tháng này";
      case "year": return "năm nay";
      default: return "kỳ này";
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "day": return "Hôm nay";
      case "week": return "Tuần này";
      case "month": return "Tháng này";
      case "year": return "Năm nay";
      default: return "";
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportSystemRevenue(period);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Revenue_Report_${period}_${new Date().toISOString().split('T')[0]}.xlsx`; 
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Xuất file thất bại, vui lòng thử lại sau.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [revenueRes, becomeAuthorRes, rankUpRes, withdrawRes] = await Promise.all([
          getSystemRevenue(period),                 
          getRequestStats("become_author", period), 
          getRequestStats("rank_up", period),       
          getRequestStats("withdraw", period)       
        ]);

        const points = revenueRes.points || [];
        const totalAccumulated = 
          (revenueRes.diaTopup || 0) +
          (revenueRes.subscription || 0) +
          (revenueRes.voiceTopup || 0);

        let currentPeriodRev = 0;
        if (points.length > 0) {
            currentPeriodRev = points[points.length - 1].value;
        } else {
            currentPeriodRev = totalAccumulated; 
        }

        // Đảo ngược mảng để ngày mới nhất lên đầu cho dễ theo dõi
        const reversedPoints = [...points].reverse().map((p: any) => ({
            name: p.periodLabel,
            revenue: p.value,
            // Giả lập tính tăng trưởng so với mốc trước (logic demo)
            growth: Math.random() > 0.5 // Thực tế bạn nên tính toán dựa trên value của index trước
        }));

        setStats({
          currentRevenue: currentPeriodRev,
          totalRevenueAccumulated: totalAccumulated,
          becomeAuthorRequests: becomeAuthorRes?.total || 0,
          rankUpRequests: rankUpRes?.total || 0,
          withdrawRequests: withdrawRes?.total || 0,
          revenueTrend: reversedPoints,
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]); 

  return (
      <main className="p-6 space-y-6">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--primary)]">
              Tổng quan hệ thống
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Dữ liệu báo cáo: <span className="font-semibold text-foreground">{getPeriodLabel()}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px] bg-background">
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
                onClick={handleExport} 
                disabled={isExporting}
                className="ml-2"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {isExporting ? "Đang xuất..." : "Xuất Excel"}
            </Button>
          </div>
        </div>

        {/* 1. Stats Cards (4 thẻ trên cùng) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <Card className="shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
              <div className="p-2 bg-green-100 rounded-full text-green-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {loading ? "..." : stats.currentRevenue.toLocaleString()} 
                <span className="text-lg font-medium text-muted-foreground">VNĐ</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tổng thu nhập {getRevenueLabel()}</p>
            </CardContent>
          </Card>
            
          <Card className="shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Yêu cầu lên Author</CardTitle>
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Users className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.becomeAuthorRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">User đăng ký mới</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Yêu cầu Nâng hạng</CardTitle>
              <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                <Star className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.rankUpRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Author xin lên Sponsored</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Yêu cầu chờ duyệt</CardTitle>
              <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                <Wallet className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.withdrawRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Số đơn rút tiền cần xử lý</p>
            </CardContent>
          </Card>
        </div>

        {/* 2. REPLACEMENT FOR CHART: Detailed Data Grid */}
        {/* Phần này thay thế biểu đồ, lấp đầy không gian bằng dữ liệu chi tiết */}
        <Card className="shadow-sm border border-[var(--border)]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                    Chi tiết biến động doanh thu
                </CardTitle>
                <CardDescription>
                    Số liệu cụ thể cho từng mốc thời gian trong {getRevenueLabel()}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : stats.revenueTrend.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {stats.revenueTrend.map((item, index) => (
                            <div 
                                key={index} 
                                className="flex flex-col p-4 rounded-lg border bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CalendarDays className="w-4 h-4" />
                                        {/* Format lại ngày tháng cho đẹp nếu cần */}
                                        <span>{period === 'day' ? item.name.split('-').slice(1).join('/') : item.name}</span>
                                    </div>
                                    {/* Icon trang trí */}
                                    <div className="p-1 bg-green-100 rounded text-green-700">
                                        <ArrowUpRight className="w-3 h-3" />
                                    </div>
                                </div>
                                
                                <div className="mt-1">
                                    <span className="text-lg font-bold text-[var(--foreground)]">
                                        {item.revenue.toLocaleString()} 
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-1">VNĐ</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground">
                        Không có dữ liệu doanh thu trong khoảng thời gian này.
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
  );
}