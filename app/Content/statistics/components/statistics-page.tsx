"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function StatisticsDashboard() {
  const weeklyData = [
    { day: "T2", approved: 45, rejected: 12 },
    { day: "T3", approved: 52, rejected: 15 },
    { day: "T4", approved: 38, rejected: 8 },
    { day: "T5", approved: 62, rejected: 18 },
    { day: "T6", approved: 48, rejected: 10 },
    { day: "T7", approved: 35, rejected: 7 },
    { day: "CN", approved: 28, rejected: 5 },
  ];

  const violationData = [
    { name: "Spam", value: 145, color: "var(--chart-1)" },
    { name: "Nội dung nhạy cảm", value: 89, color: "var(--chart-2)" },
    { name: "Bản quyền", value: 43, color: "var(--chart-3)" },
    { name: "Quấy rối", value: 67, color: "var(--chart-4)" },
    { name: "Khác", value: 34, color: "var(--chart-5)" },
  ];

  const COLORS = [
    "var(--chart-1)",
    "var(--chart-2)", 
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)"
  ];

   return (
    <div className="min-h-screen bg-[var(--background)] p-8 transition-colors duration-300">
      {/* Header - Updated to match ReportsList */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">
          Thống kê kiểm duyệt
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Tổng hợp hoạt động kiểm duyệt và loại vi phạm gần đây
        </p>
      </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ cột */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-6 border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-medium text-[var(--primary)] mb-6">
                Hoạt động 7 ngày qua
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar
                    dataKey="approved"
                    fill="var(--chart-3)"
                    name="Đã duyệt"
                    radius={[8, 8, 0, 0]}
                    barSize={24}
                  />
                  <Bar
                    dataKey="rejected"
                    fill="var(--chart-4)"
                    name="Từ chối"
                    radius={[8, 8, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Biểu đồ tròn */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-6 border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-medium text-[var(--primary)] mb-6">
                Phân loại vi phạm
              </h3>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={violationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {violationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="mt-6 space-y-2">
                {violationData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-[var(--muted-foreground)]">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[var(--foreground)] font-medium">
                      {item.value}
                     </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}