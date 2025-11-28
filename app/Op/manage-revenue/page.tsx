"use client";

import React, { useState, useEffect } from "react";
import OpLayout from "@/components/OpLayout";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Import API
import { getSystemRevenue } from "@/services/operationModStatService";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function ManageRevenuePage() {
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Map period sang đúng format API yêu cầu (day, month, year)
        const apiPeriod = period === 'daily' ? 'day' : period === 'yearly' ? 'year' : 'month';
        const res = await getSystemRevenue(apiPeriod);
        setData(res);
      } catch (error) {
        console.error(error);
        toast.error("Lỗi tải dữ liệu doanh thu");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  const handleExport = () => {
    toast.success("Tính năng xuất báo cáo đang phát triển...");
  };

  // --- Xử lý dữ liệu ---
  // 1. Data cho Pie Chart (Nguồn thu)
  const pieData = data ? [
    { name: "Nạp Kim Cương", value: data.diaTopup },
    { name: "Gói Hội Viên", value: data.subscription },
    { name: "Voice Topup", value: data.voiceTopup },
  ].filter(i => i.value > 0) : [];

  // 2. Data cho Bar Chart (Chi tiết theo mốc thời gian)
  const barData = data?.points?.map((p: any) => ({
    name: p.periodLabel,
    value: p.value
  })) || [];

  const totalRevenue = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <OpLayout>
      <main className="p-6 space-y-6">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--primary)]">
              Quản lý Doanh thu
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Báo cáo tài chính chi tiết theo kỳ
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Theo ngày</SelectItem>
                <SelectItem value="monthly">Theo tháng</SelectItem>
                <SelectItem value="yearly">Theo năm</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" /> Xuất Excel
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-gray-400" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Bar Chart: Chi tiết theo thời gian */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle>Biến động Doanh thu ({period})</CardTitle>
                <CardDescription>Tổng thu: {totalRevenue.toLocaleString()}₫</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(val) => `${val/1000000}M`} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        formatter={(val: number) => val.toLocaleString() + "₫"} 
                      />
                      <Legend />
                      <Bar dataKey="value" name="Doanh thu" fill="#3A506B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 2. Pie Chart: Nguồn thu */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Cơ cấu Nguồn thu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex flex-col items-center">
                  <ResponsiveContainer width="100%" height="60%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => val.toLocaleString() + "₫"} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Custom Legend */}
                  <div className="w-full space-y-3 mt-4">
                    {pieData.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                          <span>{item.name}</span>
                        </div>
                        <span className="font-semibold">{item.value.toLocaleString()}₫</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Placeholder cho bảng Transaction nếu sau này có API */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử giao dịch</CardTitle>
            <CardDescription>Danh sách chi tiết các giao dịch (Đang cập nhật API...)</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-center py-8 text-muted-foreground italic">
                Chưa có API lấy danh sách transaction chi tiết.
             </div>
          </CardContent>
        </Card>

      </main>
    </OpLayout>
  );
}