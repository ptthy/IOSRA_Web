"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  LineChart,
  Line,
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
import { DollarSign, TrendingUp, Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/op-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const monthlyRevenue = [
  { month: "T1", revenue: 45000000, expenses: 12000000, profit: 33000000 },
  { month: "T2", revenue: 52000000, expenses: 13500000, profit: 38500000 },
  { month: "T3", revenue: 48000000, expenses: 11800000, profit: 36200000 },
  { month: "T4", revenue: 61000000, expenses: 14200000, profit: 46800000 },
  { month: "T5", revenue: 55000000, expenses: 13000000, profit: 42000000 },
  { month: "T6", revenue: 72000000, expenses: 15500000, profit: 56500000 },
  { month: "T7", revenue: 68000000, expenses: 14800000, profit: 53200000 },
  { month: "T8", revenue: 81000000, expenses: 16200000, profit: 64800000 },
  { month: "T9", revenue: 75000000, expenses: 15000000, profit: 60000000 },
  { month: "T10", revenue: 92000000, expenses: 17500000, profit: 74500000 },
];

const revenueBySource = [
  { name: "Nạp xu", value: 45000000, percentage: 48.9 },
  { name: "Sponsored Author", value: 28000000, percentage: 30.4 },
  { name: "Quảng cáo", value: 12000000, percentage: 13.0 },
  { name: "Premium", value: 7000000, percentage: 7.6 },
];

const COLORS = ["#3A506B", "#9FB4C7", "#B6A77B", "#DAD2BC"];

const dailyRevenue = [
  { date: "01/10", amount: 2800000 },
  { date: "02/10", amount: 3200000 },
  { date: "03/10", amount: 2950000 },
  { date: "04/10", amount: 3800000 },
  { date: "05/10", amount: 3400000 },
  { date: "06/10", amount: 4200000 },
  { date: "07/10", amount: 3900000 },
  { date: "08/10", amount: 4500000 },
  { date: "09/10", amount: 4100000 },
  { date: "10/10", amount: 4800000 },
  { date: "11/10", amount: 4600000 },
  { date: "12/10", amount: 5200000 },
];

export default function RevenueReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [exportFormat, setExportFormat] = useState("excel");

  const handleExport = () => {
    const formatName = exportFormat === "excel" ? "Excel" : "PDF";
    toast.success(`Đang xuất báo cáo dạng ${formatName}...`);
  };

  const totalRevenue = monthlyRevenue.reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  const totalProfit = monthlyRevenue.reduce(
    (sum, item) => sum + item.profit,
    0
  );
  const avgMonthlyRevenue = totalRevenue / monthlyRevenue.length;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="p-6 min-h-[calc(100vh-4rem)] bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
          {/* Header section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--primary)]">
                Quản lý Doanh thu & Báo cáo
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                Thống kê tổng quan về doanh thu hệ thống
              </p>
            </div>
            <div className="flex gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
                  <SelectValue placeholder="Chọn kỳ" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
                  <SelectItem value="daily">Theo ngày</SelectItem>
                  <SelectItem value="monthly">Theo tháng</SelectItem>
                  <SelectItem value="yearly">Theo năm</SelectItem>
                </SelectContent>
              </Select>

              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-32 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
                  <SelectValue placeholder="Định dạng" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleExport}
                className="bg-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_75%,black)] text-[var(--primary-foreground)]"
              >
                <Download className="w-4 h-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Tổng doanh thu</CardTitle>
                <DollarSign className="w-5 h-5 text-[var(--primary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {totalRevenue.toLocaleString()}₫
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  10 tháng
                </p>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Lợi nhuận</CardTitle>
                <TrendingUp className="w-5 h-5 text-[var(--secondary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {totalProfit.toLocaleString()}₫
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  <span className="text-green-500">+15.3%</span> so với kỳ trước
                </p>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">TB tháng</CardTitle>
                <FileText className="w-5 h-5 text-[var(--accent)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {avgMonthlyRevenue.toLocaleString()}₫
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  doanh thu trung bình
                </p>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Tháng này</CardTitle>
                <DollarSign className="w-5 h-5 text-[var(--chart-2)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">92.000.000₫</div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  <span className="text-green-500">+22.7%</span> so với T9
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Card className="border border-[var(--border)] bg-[var(--card)] shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">
                Doanh thu theo tháng
              </CardTitle>
              <CardDescription className="text-[var(--muted-foreground)]">
                So sánh doanh thu, chi phí và lợi nhuận
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--foreground)" />
                  <YAxis stroke="var(--foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      color: "var(--foreground)",
                    }}
                    formatter={(value: number) => `${value.toLocaleString()}₫`}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="#3A506B"
                    radius={[8, 8, 0, 0]}
                    name="Doanh thu"
                  />
                  <Bar
                    dataKey="expenses"
                    fill="#9FB4C7"
                    radius={[8, 8, 0, 0]}
                    name="Chi phí"
                  />
                  <Bar
                    dataKey="profit"
                    fill="#DAD2BC"
                    radius={[8, 8, 0, 0]}
                    name="Lợi nhuận"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Row charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[var(--primary)]">
                  Doanh thu theo ngày
                </CardTitle>
                <CardDescription className="text-[var(--muted-foreground)]">
                  12 ngày gần nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyRevenue}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis dataKey="date" stroke="var(--foreground)" />
                    <YAxis stroke="var(--foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        color: "var(--foreground)",
                      }}
                      formatter={(value: number) =>
                        `${value.toLocaleString()}₫`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      name="Doanh thu"
                      dot={{ fill: "var(--primary)", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[var(--primary)]">
                  Nguồn doanh thu
                </CardTitle>
                <CardDescription className="text-[var(--muted-foreground)]">
                  Phân bổ theo nguồn thu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueBySource}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) =>
                        `${name}: ${percentage}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueBySource.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `${value.toLocaleString()}₫`
                      }
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        color: "var(--foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">
                Chi tiết nguồn doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueBySource.map((source, index) => (
                  <div
                    key={source.name}
                    className="flex items-center justify-between p-4 bg-[var(--muted)] rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <div>
                        <p className="text-[var(--foreground)]">
                          {source.name}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {source.percentage}% tổng doanh thu
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[var(--foreground)]">
                        {source.value.toLocaleString()}₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}