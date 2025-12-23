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
  CalendarDays,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  getSystemRevenue,
  getRequestStats,
  exportSystemRevenue,
} from "@/services/operationModStatService";

export default function DashboardAnalytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("day"); 
  const [isExporting, setIsExporting] = useState(false);

  // Thêm state activeTab để chuyển đổi xem chi tiết giữa các chỉ số
  const [activeTab, setActiveTab] = useState<"revenue" | "author" | "rank" | "withdraw">("revenue");

  const [stats, setStats] = useState({
    currentRevenue: 0,
    becomeAuthorRequests: 0,
    rankUpRequests: 0,
    withdrawRequests: 0,
    
    // Lưu trend cho từng loại riêng biệt
    revenueTrend: [] as any[],
    authorTrend: [] as any[],    // Mới
    rankUpTrend: [] as any[],    // Mới
    withdrawTrend: [] as any[],  // Mới
  });

  const getPeriodLabel = () => {
    switch (period) {
      case "day": return "Hôm nay";
      case "week": return "Tuần này";
      case "month": return "Tháng này";
      case "year": return "Năm nay";
      default: return "";
    }
  };

  const getRevenueSuffix = () => {
    switch (period) {
      case "day": return "hôm nay";
      case "week": return "tuần này";
      case "month": return "tháng này";
      case "year": return "năm nay";
      default: return "kỳ này";
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
      alert("Xuất file thất bại.");
    } finally {
      setIsExporting(false);
    }
  };

  // Hàm helper để xử lý mảng points từ API (dùng chung cho cả Revenue và Requests)
  const processTrendData = (data: any) => {
    if (!data?.points || !Array.isArray(data.points)) return [];
    
    // Đảo ngược để ngày mới nhất lên đầu, map về format chung
    return [...data.points].reverse().map((p: any) => ({
      name: p.periodLabel,     // VD: "2025-12-02"
      value: p.value,          // Giá trị tại thời điểm đó (số tiền hoặc số request)
      fullDate: p.periodStart  
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const results = await Promise.allSettled([
          getSystemRevenue(period),                 // Index 0
          getRequestStats("become_author", period), // Index 1
          getRequestStats("rank_up", period),       // Index 2
          getRequestStats("withdraw", period)       // Index 3
        ]);

        const getData = (result: PromiseSettledResult<any>) => 
          result.status === 'fulfilled' ? result.value : null;

        const revenueRes = getData(results[0]);
        const becomeAuthorRes = getData(results[1]);
        const rankUpRes = getData(results[2]);
        const withdrawRes = getData(results[3]);

        // 1. Tính tổng Doanh thu
        const totalRevenue = revenueRes ? (
          (revenueRes.diaTopup || 0) +
          (revenueRes.subscription || 0) +
          (revenueRes.voiceTopup || 0)
        ) : 0;

        // 2. Cập nhật State (Áp dụng hàm processTrendData cho cả 4 loại)
        setStats({
          currentRevenue: totalRevenue,
          becomeAuthorRequests: becomeAuthorRes?.total || 0,
          rankUpRequests: rankUpRes?.total || 0,
          withdrawRequests: withdrawRes?.total || 0,
          
          // Xử lý points cho từng loại
          revenueTrend: processTrendData(revenueRes),
          authorTrend: processTrendData(becomeAuthorRes),
          rankUpTrend: processTrendData(rankUpRes),
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

  // Lấy data và đơn vị hiển thị dựa trên tab đang chọn
  const getActiveTrendData = () => {
    switch (activeTab) {
      case "author": return { data: stats.authorTrend, unit: "User", label: "Yêu cầu Author", color: "text-blue-600", bg: "bg-blue-100" };
      case "rank": return { data: stats.rankUpTrend, unit: "Request", label: "Yêu cầu Nâng hạng", color: "text-yellow-600", bg: "bg-yellow-100" };
      case "withdraw": return { data: stats.withdrawTrend, unit: "Đơn", label: "Yêu cầu Rút tiền", color: "text-purple-600", bg: "bg-purple-100" };
      default: return { data: stats.revenueTrend, unit: "VNĐ", label: "Doanh thu", color: "text-green-600", bg: "bg-green-100" };
    }
  };

  const activeData = getActiveTrendData();

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

       {/* 1. Stats Cards (Click vào để chuyển tab detail) */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  
  {/* Card Doanh thu */}
  <div onClick={() => setActiveTab("revenue")} className="cursor-pointer">
    {/* SỬA: Thêm bg-white, xóa bg-green-50/10, tăng độ đậm của ring nếu cần */}
    <Card className={`bg-white shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-all ${
      activeTab === 'revenue' ? 'ring-2 ring-green-500' : ''
    }`}>
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
        <p className="text-xs text-muted-foreground mt-1">Tổng thu nhập {getRevenueSuffix()}</p>
      </CardContent>
    </Card>
  </div>
  
  {/* Card Author */}
  <div onClick={() => setActiveTab("author")} className="cursor-pointer">
    <Card className={`bg-white shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-all ${
      activeTab === 'author' ? 'ring-2 ring-blue-500' : ''
    }`}>
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
  </div>

  {/* Card Rank Up */}
  <div onClick={() => setActiveTab("rank")} className="cursor-pointer">
    <Card className={`bg-white shadow-sm border-l-4 border-l-yellow-500 hover:shadow-md transition-all ${
      activeTab === 'rank' ? 'ring-2 ring-yellow-500' : ''
    }`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Yêu cầu Nâng hạng</CardTitle>
        <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
          <Star className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "..." : stats.rankUpRequests}</div>
        <p className="text-xs text-muted-foreground mt-1">Xin lên Sponsored</p>
      </CardContent>
    </Card>
  </div>

  {/* Card Withdraw */}
  <div onClick={() => setActiveTab("withdraw")} className="cursor-pointer">
    <Card className={`bg-white shadow-sm border-l-4 border-l-purple-500 hover:shadow-md transition-all ${
      activeTab === 'withdraw' ? 'ring-2 ring-purple-500' : ''
    }`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Yêu cầu Rút tiền</CardTitle>
        <div className="p-2 bg-purple-100 rounded-full text-purple-600">
          <Wallet className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "..." : stats.withdrawRequests}</div>
        <p className="text-xs text-muted-foreground mt-1">Đơn tạo mới</p>
      </CardContent>
    </Card>
  </div>
</div>

        {/* 2. Detailed Data Grid (Dynamic based on Selection) */}
        <Card className="shadow-sm border border-[var(--border)]">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                            Chi tiết: {activeData.label}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Biến động số liệu theo thời gian (Click vào các thẻ ở trên để đổi dữ liệu)
                        </CardDescription>
                    </div>
                    
                    {/* Các nút Tab thủ công */}
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                        <Button variant={activeTab === 'revenue' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab("revenue")}>Doanh thu</Button>
                        <Button variant={activeTab === 'author' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab("author")}>Author</Button>
                        <Button variant={activeTab === 'rank' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab("rank")}>Nâng hạng</Button>
                        <Button variant={activeTab === 'withdraw' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab("withdraw")}>Rút tiền</Button>
                    </div>
                </div>
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
                                    <div className={`p-1 rounded ${activeData.color.replace('text', 'bg').replace('600', '100')} ${activeData.color}`}>
                                        <ArrowUpRight className="w-3 h-3" />
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