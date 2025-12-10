// File: app/Content/moderation/components/report-list.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { motion, Variants } from "framer-motion";

// ✅ QUAN TRỌNG: Import ReportItem từ API Service để đồng bộ Type
import { getHandlingReports, ReportItem } from "@/services/moderationApi";
import { ReportActionModal } from "./report-action-modal";
import { cn } from "@/lib/utils";

// ========================= MOTION VARIANTS =========================

const tabContentVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.42, 0, 0.58, 1] },
  },
};

// ========================= MAIN COMPONENT =========================

export function ReportsList() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab mặc định
  const [activeTab, setActiveTab] = useState<string>("pending");

  // Modal
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ================= FETCH REPORTS =================

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // ✅ Logic: Tab UI là "approved" nhưng API cần gọi "resolved"
      const apiStatus = activeTab === "approved" ? "resolved" : activeTab;

      // Gọi API (getHandlingReports giờ đã chấp nhận string | null)
      const response = await getHandlingReports(apiStatus, null, 1, 50);

      // ✅ Fix lỗi setReports: Lấy mảng items từ response object
      const dataItems = response.items || [];
      setReports(dataItems);
      
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const handleOpenProcess = (report: ReportItem) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  // ================= REUSABLE TABLE =================

  const ReportsTable = ({ data }: { data: ReportItem[] }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <p className="text-lg text-gray-500">Không có báo cáo nào trong mục này.</p>
        </div>
      );
    }

    return (
      <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm transition-colors duration-300">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--card)] border-b">
              <TableHead className="py-4 px-6">Loại</TableHead>
              <TableHead className="py-4 px-6">Lý do</TableHead>
              <TableHead className="py-4 px-6">Chi tiết</TableHead>
              <TableHead className="py-4 px-6">Trạng thái</TableHead>
              <TableHead className="py-4 px-6 text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((report) => (
              <TableRow
                // ✅ Sử dụng reportId làm key (khớp với API)
                key={report.reportId}
                className="border-b hover:bg-[var(--muted)]/20 transition-colors"
              >
                <TableCell className="py-4 px-6">
                  <Badge className="uppercase bg-blue-50 text-blue-700 border-blue-200">
                    {report.targetType}
                  </Badge>
                </TableCell>

                <TableCell className="py-4 px-6 font-medium text-red-600">
                  {report.reason}
                </TableCell>

                <TableCell
                  className="py-4 px-6 max-w-md truncate text-[var(--muted-foreground)]"
                  title={report.details}
                >
                  {report.details || "Không có mô tả"}
                </TableCell>

                <TableCell className="py-4 px-6">
                  <Badge
                    className={cn(
                      report.status === "pending" &&
                        "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                      // ✅ Check cả approved (UI) và resolved (API)
                      (report.status === "approved" || report.status === "resolved") &&
                        "bg-green-100 text-green-800 hover:bg-green-200",
                      report.status === "rejected" &&
                        "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    )}
                  >
                    {/* ✅ Hiển thị text tiếng Việt phù hợp */}
                    {report.status === "resolved" || report.status === "approved" 
                      ? "Đã xử phạt" 
                      : report.status === "rejected" 
                        ? "Đã từ chối" 
                        : "Chờ xử lý"}
                  </Badge>
                </TableCell>

                <TableCell className="py-4 px-6 text-center">
                  {report.status === "pending" && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        onClick={() => handleOpenProcess(report)}
                        className="bg-[var(--primary)] hover:bg-[color-mix(in srgb, var(--primary) 75%, black)] text-white px-4 rounded-lg"
                      >
                        Xử lý
                      </Button>
                    </motion.div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  };

  // ================= UI STATES =================

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
        <p className="ml-3 text-lg">Đang tải danh sách báo cáo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px] bg-red-50 text-red-700 p-4 rounded-lg m-8">
        <AlertCircle className="w-6 h-6 mr-2" />
        <p className="text-lg">Lỗi khi tải dữ liệu: {error}</p>
      </div>
    );
  }

  // ================= MAIN RENDER =================

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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">
          Xử Lý Báo Cáo Vi Phạm
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Xem xét báo cáo từ người dùng và quyết định xử phạt.
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <TabsList className="bg-[var(--card)] border border-[var(--border)] h-12 p-1 flex items-center gap-1 rounded-lg">

            {/* Pending */}
            <TabsTrigger
              value="pending"
              className={cn(
                "h-10 px-5 rounded-md font-medium transition-all",
                "data-[state=active]:bg-yellow-500 data-[state=active]:text-white"
              )}
            >
              Chờ xử lý
            </TabsTrigger>

            {/* Approved (UI) -> Resolved (API) */}
            <TabsTrigger
              value="approved"
              className={cn(
                "h-10 px-5 rounded-md font-medium transition-all",
                "data-[state=active]:bg-green-600 data-[state=active]:text-white"
              )}
            >
              Đã xử phạt
            </TabsTrigger>

            {/* Rejected */}
            <TabsTrigger
              value="rejected"
              className={cn(
                "h-10 px-5 rounded-md font-medium transition-all",
                "data-[state=active]:bg-red-600 data-[state=active]:text-white"
              )}
            >
              Đã từ chối
            </TabsTrigger>

          </TabsList>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Tìm ID hoặc lý do..."
              className="pl-10 h-12 bg-[var(--card)] border border-[var(--border)]"
            />
          </div>
        </div>

        <motion.div key={activeTab} variants={tabContentVariants} initial="hidden" animate="visible">
          {/* Vì logic fetch đã theo activeTab, ta render trực tiếp table */}
          <TabsContent value={activeTab} forceMount>
            <ReportsTable data={reports} />
          </TabsContent>
        </motion.div>
      </Tabs>

      <ReportActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        report={selectedReport}
        onSuccess={() => fetchReports()}
      />
    </div>
  );
}