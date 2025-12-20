"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  Users,
  Zap,
  Loader2,
  Star,
  Wallet,
  Calendar,
  Download, // Import icon Download
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Import Button

import {
  getSystemRevenue,
  getRequestStats,
  exportSystemRevenue, // 👉 Import hàm export mới
} from "@/services/operationModStatService";

export default function DashboardAnalytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("day");
  
  // State để disable nút khi đang tải file
  const [isExporting, setIsExporting] = useState(false);

  const [stats, setStats] = useState({
    currentRevenue: 0,
    totalRevenueAccumulated: 0,
    becomeAuthorRequests: 0,
    rankUpRequests: 0,
    withdrawRequests: 0,
    revenueTrend: [] as any[],
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

  // 👉 Hàm xử lý Xuất Excel
  const handleExport = async () => {
    try {
      setIsExporting(true);
      // Gọi API lấy Blob
      const blob = await exportSystemRevenue(period);
      
      // Tạo URL ảo từ Blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Đặt tên file (VD: Revenue_Report_month.xlsx)
      a.download = `Revenue_Report_${period}_${new Date().toISOString().split('T')[0]}.xlsx`; 
      document.body.appendChild(a);
      a.click();
      
      // Dọn dẹp
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

        const [
          revenueRes, 
          becomeAuthorRes, 
          rankUpRes, 
          withdrawRes
        ] = await Promise.all([
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

        const chartData = points.map((p: any) => ({
          name: p.periodLabel,
          revenue: p.value,
        }));

        setStats({
          currentRevenue: currentPeriodRev,
          totalRevenueAccumulated: totalAccumulated,
          becomeAuthorRequests: becomeAuthorRes?.total || 0,
          rankUpRequests: rankUpRes?.total || 0,
          withdrawRequests: withdrawRes?.total || 0,
          revenueTrend: chartData,
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
              Dữ liệu đang xem: <span className="font-semibold text-foreground">{getPeriodLabel()}</span>
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

            {/* 👉 BUTTON XUẤT EXCEL */}
            <Button 
                variant="outline" 
                onClick={handleExport} 
                disabled={isExporting}
                className="ml-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isExporting ? "Đang xuất..." : "Xuất Excel"}
            </Button>
          </div>
        </div>

        {/* 1. Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           
           {/* Card 1: Doanh thu */}
           <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
              <div className="p-2 bg-green-100 rounded-full text-green-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {loading ? "..." : stats.currentRevenue.toLocaleString()} 
                {/* Đã đổi Gem thành VNĐ */}
                <span className="text-lg font-medium text-muted-foreground">VNĐ</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tổng thu nhập {getRevenueLabel()}
              </p>
            </CardContent>
          </Card>
           
           {/* Card 2 */}
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Yêu cầu lên Author</CardTitle>
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Users className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.becomeAuthorRequests}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                User đăng ký mới
              </p>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="shadow-sm border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Yêu cầu Nâng hạng</CardTitle>
              <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                <Star className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.rankUpRequests}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Author xin lên Sponsored
              </p>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Yêu cầu chờ duyệt</CardTitle>
              <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                <Wallet className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.withdrawRequests}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Số đơn rút tiền cần xử lý
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 2. Main Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-[var(--primary)] flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" /> Xu hướng Doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueTrend}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      fontSize={12} 
                      tickFormatter={(val) => {
                        if(period === 'day') return val.split('-').slice(1).join('/');
                        return val;
                      }}
                    />
                    <YAxis
                      fontSize={12}
                      tickFormatter={(val) => `${val / 1000}K`} 
                    />
                    <Tooltip
                      formatter={(value: number) => `${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: "8px" }}
                      labelStyle={{ color: "#333" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--primary)"
                      fillOpacity={1}
                      fill="url(#colorRev)"
                      name="Doanh thu"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
  );
}