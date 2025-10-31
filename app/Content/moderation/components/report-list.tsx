"use client"; // Đảm bảo "use client" ở đầu nếu chưa có

import {
  Search,
  AlertTriangle,
  Flag,
  CheckCircle2,
  Trash2,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface ReportsListProps {
  onHandle: (report: any) => void;
}

export function ReportsList({ onHandle }: ReportsListProps) {
  const reports = [
    {
      id: 1,
      priority: "high",
      reportCount: 5,
      storyTitle: "Hành trình isekai",
      chapter: "Chương 5",
      reporter: "Reader123",
      reportDate: "2025-10-12 11:20",
      reportType: "Spam",
      reason: "Bình luận spam quảng cáo",
      content: "Mua hàng giá rẻ tại website xxx.com - Click ngay!",
      status: "new",
    },
    {
      id: 2,
      priority: "high",
      reportCount: 3,
      storyTitle: "Tình yêu mùa thu",
      chapter: "Chương 12",
      reporter: "UserABC",
      violator: "BadUser123",
      reportDate: "2025-10-12 10:45",
      reportType: "Nội dung không phù hợp",
      reason: "Ngôn từ không phù hợp với tiêu chuẩn cộng đồng",
      content: "Bình luận chứa từ ngữ xúc phạm...",
      status: "processing",
    },
    {
      id: 3,
      priority: "medium",
      reportCount: 2,
      storyTitle: "Chiến tranh ngân hà",
      chapter: "Chương 8",
      reporter: "ModFan",
      reportDate: "2025-10-11 15:30",
      reportType: "Vi phạm bản quyền",
      reason: "Nội dung sao chép từ nguồn khác",
      content: "Phát hiện đoạn văn giống hệt truyện gốc...",
      status: "resolved",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const filterReports = (status: string) => {
    if (status === "all") return reports;
    return reports.filter((r) => r.status === status);
  };

  const ReportCard = ({ report }: { report: any }) => (
    <motion.div variants={item}>
      <Card className="p-6 border border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-start gap-4">
          {/* Priority Badge */}
          <div className="flex-shrink-0">
            {report.priority === "high" ? (
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <Flag className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <h4 className="text-xl font-semibold text-[var(--foreground)]">
                    {report.storyTitle}
                  </h4>
                  <Badge
                    className={`${
                      report.priority === "high"
                        ? "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                        : "bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                    }`}
                  >
                    {report.reportCount} báo cáo
                  </Badge>
                  {report.status === "resolved" && (
                    <Badge className="bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                      Đã xử lý
                    </Badge>
                  )}
                  {report.status === "processing" && (
                    <Badge className="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Đang xử lý
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-1">
                  {report.chapter}
                  {report.violator && ` • Người bị báo cáo: `}
                  {report.violator && (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {report.violator}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Báo cáo bởi:{" "}
                  <span className="text-[var(--primary)] font-medium">
                    {report.reporter}
                  </span>{" "}
                  • {report.reportDate}
                </p>
              </div>
              {report.status !== "resolved" && (
                <Button
                  className="bg-[var(--primary)] hover:bg-[color-mix(in_srgb,_var(--primary)_75%,_black)] text-[var(--primary-foreground)] shadow-md font-medium px-4 py-2 rounded-lg transition-all"
                  onClick={() => onHandle(report)}
                >
                  Xử lý
                </Button>
              )}
            </div>

            {/* Report Details */}
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-4 space-y-3 border border-blue-200 dark:border-blue-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className="border-[var(--primary)] text-[var(--primary)]"
                  >
                    {report.reportType}
                  </Badge>
                </div>
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <span className="font-medium">Lý do:</span> {report.reason}
                </p>
              </div>
              <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-1">
                  Nội dung bị báo cáo:
                </p>
                <p className="text-sm text-[var(--foreground)] italic bg-[var(--background)] p-3 rounded-lg">
                  &ldquo;{report.content}&rdquo;
                </p>
              </div>
              {report.status !== "resolved" && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-[var(--border)]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Xem chi tiết
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Đánh dấu đã xử lý
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div
      className="min-h-screen p-8 transition-colors duration-300"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
        fontFamily:
          "'Poppins', 'Poppins Vietnamese', 'Noto Sans Vietnamese', 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">
          Báo Cáo Vi Phạm
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Xử lý các báo cáo vi phạm từ người dùng
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Tìm kiếm theo tên truyện hoặc người bị báo cáo..."
          className="pl-12 h-12 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]"
        />
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-[var(--card)] border border-[var(--border)]">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="new">Mới</TabsTrigger>
          <TabsTrigger value="processing">Đang xử lý</TabsTrigger>
          <TabsTrigger value="resolved">Đã xử lý</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {filterReports("all").map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="new">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {filterReports("new").map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="processing">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {filterReports("processing").map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="resolved">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {filterReports("resolved").map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
