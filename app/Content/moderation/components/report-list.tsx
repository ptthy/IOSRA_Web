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
import { Loader2, AlertCircle, Eye, EyeOff, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, Variants } from "framer-motion";

// Import ReportItem từ API Service
import { getHandlingReports, ReportItem } from "@/services/moderationApi";
import { ReportActionModal } from "./report-action-modal";
import { cn } from "@/lib/utils";

// ========================= MAP LÝ DO VI PHẠM =========================
const REASON_MAP: { [key: string]: string } = {
  spam: "Spam/Quảng cáo",
  negative_content: "Nội dung tiêu cực",
  misinformation: "Thông tin sai lệch",
  ip_infringement: "Vi phạm bản quyền",
  harassment: "Quấy rối",
  hate_speech: "Ngôn từ thù ghét",
  other: "Khác",
};

const getTranslatedReason = (rawReason: string) => {
  const key = rawReason ? rawReason.trim().toLowerCase() : "other";
  return REASON_MAP[key] || rawReason || "Khác";
};

// ========================= HELPER LẤY TRẠNG THÁI TARGET =========================
const getTargetStatusInfo = (report: ReportItem) => {
  let status = "";

  // Fix lỗi TS: Ép kiểu as any vì type gốc có thể thiếu field status
  if (report.targetType === "story" && report.story) {
    status = (report.story as any).status || "published";
  } else if (report.targetType === "chapter" && report.chapter) {
    status = (report.chapter as any).status || "published";
  } else if (report.targetType === "comment" && report.comment) {
    status = (report.comment as any).status || "visible";
  }

  // Map status sang UI
  switch (status) {
    case "hidden":
    case "deleted":
    case "removed":
      return {
        label: "Đã ẩn",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: <EyeOff className="w-3 h-3 mr-1" />,
      };
    case "published":
    case "visible":
      return {
        label: "Đang hiện",
        color: "bg-green-100 text-green-700 border-green-200",
        icon: <Globe className="w-3 h-3 mr-1" />,
      };
    default:
      return {
        label: status || "N/A",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: null,
      };
  }
};

const tabContentVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.42, 0, 0.58, 1] },
  },
};

export function ReportsList() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("pending");

  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ================= FETCH REPORTS =================

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiStatus = activeTab === "approved" ? "resolved" : activeTab;
      const response = await getHandlingReports(apiStatus, null, 1, 50);
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
    const isPendingTab = activeTab === "pending";
    const isApprovedTab = activeTab === "approved";
    // const isRejectedTab = activeTab === "rejected"; // Không cần biến này nữa vì logic gom vào else

    if (!data || data.length === 0) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <p className="text-lg text-gray-500">
            Không có báo cáo nào trong mục này.
          </p>
        </div>
      );
    }

    return (
      <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm transition-colors duration-300">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--card)] border-b">
              <TableHead className="py-4 px-6 w-[100px]">Loại</TableHead>
              <TableHead className="py-4 px-6 w-[200px]">Lý do</TableHead>
              <TableHead className="py-4 px-6">Chi tiết</TableHead>
              <TableHead className="py-4 px-6 w-[150px]">
                Trạng thái xử lý
              </TableHead>

              {/* Cột cuối cùng luôn hiện, nhưng tiêu đề thay đổi */}
              <TableHead className="py-4 px-6 text-center w-[180px]">
                {isPendingTab ? "Hành động" : "Chi tiết"}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((report) => {
              const targetStatus = getTargetStatusInfo(report);

              return (
                <TableRow
                  key={report.reportId}
                  className="border-b hover:bg-[var(--muted)]/20 transition-colors"
                >
                  {/* Cột Loại */}
                  <TableCell className="py-4 px-6">
                    <Badge className="uppercase bg-blue-50 text-blue-700 border-blue-200">
                      {report.targetType}
                    </Badge>
                  </TableCell>

                  {/* Cột Lý do */}
                  <TableCell className="py-4 px-6 font-medium text-red-600">
                    {getTranslatedReason(report.reason)}
                  </TableCell>

                  {/* Cột Chi tiết (Mô tả) */}
                  <TableCell
                    className="py-4 px-6 max-w-md truncate text-[var(--muted-foreground)]"
                    title={report.details}
                  >
                    {report.details || "Không có mô tả"}
                  </TableCell>

                  {/* Cột Trạng thái xử lý */}
                  <TableCell className="py-4 px-6">
                    <Badge
                      className={cn(
                        "whitespace-nowrap",
                        report.status === "pending" &&
                          "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                        (report.status === "approved" ||
                          report.status === "resolved") &&
                          "bg-green-100 text-green-800 hover:bg-green-200",
                        report.status === "rejected" &&
                          "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      )}
                    >
                      {report.status === "resolved" ||
                      report.status === "approved"
                        ? "Đã xử phạt"
                        : report.status === "rejected"
                        ? "Đã từ chối"
                        : "Chờ xử lý"}
                    </Badge>
                  </TableCell>

                  {/* Cột Hành động / Chi tiết (LOGIC MỚI) */}
                  <TableCell className="py-4 px-6 text-center">
                    {isPendingTab ? (
                      // === Tab Chờ xử lý: Chỉ hiện nút Xử lý ===
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          size="sm"
                          onClick={() => handleOpenProcess(report)}
                          className="bg-[var(--primary)] hover:bg-[color-mix(in srgb, var(--primary) 75%, black)] text-white px-4 rounded-lg shadow-sm"
                        >
                          Xử lý
                        </Button>
                      </motion.div>
                    ) : (
                      // === Tab Đã xử phạt & Đã từ chối: Hiện nút Xem chi tiết ===
                      <div className="flex flex-col items-center gap-2">
                        {/* Nếu là tab Approved thì hiện thêm trạng thái nội dung (Đã ẩn/Hiện) */}
                        {isApprovedTab && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "flex items-center w-fit px-2 py-0.5 text-[10px]",
                              targetStatus.color
                            )}
                          >
                            {targetStatus.icon} {targetStatus.label}
                          </Badge>
                        )}

                        {/* Cả Approved và Rejected đều có nút này */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-primary hover:bg-blue-50"
                          onClick={() => handleOpenProcess(report)}
                        >
                          <Eye className="w-3 h-3 mr-1" /> Xem chi tiết
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
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
        </div>

        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
        >
          <TabsContent value={activeTab} forceMount>
            <ReportsTable data={reports} />
          </TabsContent>
        </motion.div>
      </Tabs>

      <ReportActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        report={selectedReport as any}
        onSuccess={() => fetchReports()}
      />
    </div>
  );
}
