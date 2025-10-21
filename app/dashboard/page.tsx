"use client"

import React, { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Download, DollarSign, Users, Activity, TrendingUp } from "lucide-react"

/**
 * DashboardAnalytics.tsx
 * - Uses theme CSS variables from global.css (Retro Academic).
 * - Toggles dark mode by adding/removing `.dark` on document.documentElement.
 * - Charts use CSS variables (var(--primary), var(--card), var(--border), etc.)
 */

/* ---------------- sample data ---------------- */
const revenueData = [
  { date: "1/10", revenue: 4500000, users: 120 },
  { date: "2/10", revenue: 5200000, users: 145 },
  { date: "3/10", revenue: 4800000, users: 132 },
  { date: "4/10", revenue: 6100000, users: 168 },
  { date: "5/10", revenue: 5500000, users: 155 },
  { date: "6/10", revenue: 7200000, users: 192 },
  { date: "7/10", revenue: 6800000, users: 178 },
  { date: "8/10", revenue: 8100000, users: 215 },
  { date: "9/10", revenue: 7500000, users: 198 },
  { date: "10/10", revenue: 8900000, users: 234 },
  { date: "11/10", revenue: 9200000, users: 248 },
  { date: "12/10", revenue: 10500000, users: 276 },
]

const trafficData = [
  { hour: "00:00", visits: 120 },
  { hour: "03:00", visits: 80 },
  { hour: "06:00", visits: 150 },
  { hour: "09:00", visits: 420 },
  { hour: "12:00", visits: 680 },
  { hour: "15:00", visits: 520 },
  { hour: "18:00", visits: 750 },
  { hour: "21:00", visits: 580 },
]

const conversionData = [
  { month: "T6", normal: 245, sponsored: 32 },
  { month: "T7", normal: 312, sponsored: 45 },
  { month: "T8", normal: 298, sponsored: 52 },
  { month: "T9", normal: 356, sponsored: 68 },
  { month: "T10", normal: 423, sponsored: 89 },
]

/* ---------------- component ---------------- */
export default function DashboardAnalytics() {
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">(
    "monthly"
  )
  const [darkMode, setDarkMode] = useState(false)

  // sync initial dark mode from document (if user set previously)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark")
      setDarkMode(isDark)
    }
  }, [])

  // toggle `.dark` class on <html>
  useEffect(() => {
    if (typeof window === "undefined") return
    const html = document.documentElement
    if (darkMode) html.classList.add("dark")
    else html.classList.remove("dark")
  }, [darkMode])

  const handleExportReport = () => {
    alert(
      `Đang xuất báo cáo ${
        reportPeriod === "daily" ? "hàng ngày" : reportPeriod === "weekly" ? "hàng tuần" : "hàng tháng"
      }...`
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar darkMode={darkMode} toggleDarkMode={() => setDarkMode((s) => !s)} />
      <SidebarInset>
        <SiteHeader />

        <main className="p-6 min-h-[calc(100vh-4rem)] bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
          {/* header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--primary)]">Dashboard Analytics</h1>
              <p className="text-sm text-[var(--muted-foreground)]">Thống kê thời gian thực</p>
            </div>

           <div className="flex items-center gap-3">
  <Select value={reportPeriod} onValueChange={(v) => setReportPeriod(v as any)}>
    <SelectTrigger
      className="w-40 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
      <SelectItem value="daily">Theo ngày</SelectItem>
      <SelectItem value="monthly">Theo tháng</SelectItem>
      <SelectItem value="yearly">Theo năm</SelectItem>
    </SelectContent>
  </Select>

              <Button
                onClick={handleExportReport}
                className="bg-[var(--primary)] hover:bg-[color-mix(in srgb, var(--primary) 75%, black)] text-[var(--primary-foreground)]"
              >
                <Download className="w-4 h-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>
        </div>

          {/* stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[
              { title: "Doanh thu hôm nay", value: "10.500.000₫", icon: <DollarSign />, colorVar: "var(--primary)" },
              { title: "User mới", value: "276", icon: <Users />, colorVar: "var(--secondary)" },
              { title: "Active Users", value: "8.432", icon: <Activity />, colorVar: "var(--accent)" },
              { title: "Sponsored Authors", value: "89", icon: <TrendingUp />, colorVar: "var(--chart-2)" },
            ].map((c, idx) => (
              <Card key={idx} className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm">
                <CardHeader className="flex items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-sm">{c.title}</CardTitle>
                  </div>
                  <div style={{ color: c.colorVar }} className="flex items-center">
                    {React.cloneElement(c.icon as any, { className: "w-5 h-5" })}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{c.value}</div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                 <span className="text-green-600 font-medium">
  +14%
</span> so với kỳ trước
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line chart */}
            <Card className="border border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <CardTitle className="text-[var(--primary)]">Doanh thu & User mới</CardTitle>
                <CardDescription className="text-[var(--muted-foreground)]">12 ngày gần nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" stroke="var(--foreground)" />
                      <YAxis stroke="var(--foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} name="Doanh thu (VNĐ)" dot={{ fill: "var(--primary)" }} />
                      <Line type="monotone" dataKey="users" stroke="var(--secondary)" strokeWidth={3} name="User mới" dot={{ fill: "var(--secondary)" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Area chart */}
            <Card className="border border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <CardTitle className="text-[var(--primary)]">Traffic Realtime</CardTitle>
                <CardDescription className="text-[var(--muted-foreground)]">Lượt truy cập theo giờ</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficData}>
                      <defs>
                        <linearGradient id="fillVar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="hour" stroke="var(--foreground)" />
                      <YAxis stroke="var(--foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Area type="monotone" dataKey="visits" stroke="var(--primary)" fill="url(#fillVar)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* conversion */}
          <Card className="border border-[var(--border)] bg-[var(--card)] mt-6">
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">Tỉ lệ chuyển đổi Sponsored Author</CardTitle>
              <CardDescription className="text-[var(--muted-foreground)]">So sánh tác giả thường và Sponsored</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--foreground)" />
                    <YAxis stroke="var(--foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        color: "var(--popover-foreground)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="normal" fill="var(--secondary)" radius={[8, 8, 0, 0]} name="Author thường" />
                    <Bar dataKey="sponsored" fill="var(--primary)" radius={[8, 8, 0, 0]} name="Sponsored Author" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
