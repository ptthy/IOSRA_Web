"use client";

import React, { useState, useEffect } from "react";
import OpLayout from "@/components/OpLayout";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Import API
import {
  getSystemRevenue,
  getWithdrawRequests,
  exportSystemRevenue,
} from "@/services/operationModStatService";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface Transaction {
  requestId: string;
  amount: number;
  status: string;
  bankName: string;
  bankAccountNumber: string;
  accountHolderName: string;
  moderatorNote?: string;
  transactionCode?: string;
  reviewedAt: string;
}

export default function ManageRevenuePage() {
  const [period, setPeriod] = useState("daily");

  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  // State loading cho button export
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Map period của Select ("daily", "monthly", "yearly") sang period của API ("day", "month", "year")
        let apiPeriod = "month";
        if (period === "daily") apiPeriod = "day";
        if (period === "yearly") apiPeriod = "year";

        const [resRevenue, resConfirmed, resRejected] = await Promise.all([
          getSystemRevenue(apiPeriod),
          getWithdrawRequests("confirmed"),
          getWithdrawRequests("rejected"),
        ]);

        setRevenueData(resRevenue);

        const listConfirmed = Array.isArray(resConfirmed) ? resConfirmed : [];
        const listRejected = Array.isArray(resRejected) ? resRejected : [];

        const merged = [...listConfirmed, ...listRejected].sort(
          (a: Transaction, b: Transaction) =>
            new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
        );

        setTransactions(merged);
      } catch (error) {
        console.error(error);
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

// --- EXPORT EXCEL HANDLER ---
// Tạo yêu cầu xuất báo cáo, nhận dữ liệu dưới dạng Blob và kích hoạt trình duyệt tải xuống.
  const handleExport = async () => {
    try {
      setIsExporting(true);
      let apiPeriod = "month";
      if (period === "daily") apiPeriod = "day";
      if (period === "yearly") apiPeriod = "year";
// Gọi service lấy file stream (Blob)
      const blob = await exportSystemRevenue(apiPeriod);
// Tạo URL tạm thời để trình duyệt có thể thực hiện hành động 'Save As'
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Revenue_Report_${apiPeriod}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
     
// 1. URL.createObjectURL tạo ra một 'đường dẫn ảo' trỏ thẳng vào vùng RAM chứa dữ liệu file (Blob).
// 2. Trình duyệt sẽ KHÔNG THỂ giải phóng vùng RAM này (Garbage Collection bị chặn) chừng nào URL còn tồn tại.
// 3. Sau khi a.click() thực thi, trình duyệt đã bắt đầu tiến trình copy dữ liệu xuống ổ cứng.
// 4. revokeObjectURL sẽ hủy 'đường dẫn ảo' này, cho phép trình duyệt dọn dẹp vùng RAM đó ngay lập tức.
// => Tránh lỗi tràn bộ nhớ (Memory Leak) nếu người dùng xuất báo cáo nhiều lần.
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Xuất file thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xuất file Excel");
    } finally {
      setIsExporting(false);
    }
  };
// PieData: Chỉ lấy các nguồn thu có giá trị > 0 để tránh hiển thị nhãn trống trên biểu đồ tròn
  const pieData = revenueData
    ? [
        { name: "Nạp Kim Cương", value: revenueData.diaTopup },
        { name: "Gói Hội Viên", value: revenueData.subscription },
        { name: "Voice Topup", value: revenueData.voiceTopup },
      ].filter((i) => i.value > 0)
    : [];
// BarData: Ánh xạ các điểm dữ liệu (points) theo nhãn thời gian (ngày/tháng/năm)
  const barData =
    revenueData?.points?.map((p: any) => ({
      name: p.periodLabel,
      value: p.value,
    })) || [];

  const totalRevenue = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Thành công
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            Từ chối
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <OpLayout>
      <main className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Doanh thu</h1>
            <p className="text-sm text-muted-foreground">
              Báo cáo tài chính & lịch sử giao dịch
            </p>
          </div>

          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Chọn thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Theo ngày</SelectItem>
                <SelectItem value="monthly">Theo tháng</SelectItem>
                <SelectItem value="yearly">Theo năm</SelectItem>
              </SelectContent>
            </Select>

            {/* BUTTON DOWNLOAD */}
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isExporting ? "Đang tạo..." : "Xuất Excel"}
            </Button>
          </div>
        </div>

        {/* Charts Section */}
        {loading ? (
          <div className="h-96 flex justify-center items-center">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* BAR CHART */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Biến động Doanh thu</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  Tổng thu: {totalRevenue.toLocaleString()}
                  <span className="font-medium text-muted-foreground">VNĐ</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                      <Legend />
                      <Bar dataKey="value" name="Doanh thu" fill="#3A506B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* PIE CHART VỚI CUSTOM LIST CHI TIẾT */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Cơ cấu Nguồn thu</CardTitle>
                <CardDescription>Tỉ lệ đóng góp theo nguồn</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                {/* Chart Area */}
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {pieData.map((_, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={COLORS[i % COLORS.length]}
                            strokeWidth={0}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => value.toLocaleString()}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom List Chi Tiết (Legend) */}
                <div className="mt-4 space-y-3">
                  {pieData.map((item, index) => {
                    const percent =
                      totalRevenue > 0
                        ? ((item.value / totalRevenue) * 100).toFixed(1)
                        : "0";

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {/* Dot màu */}
                          <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {item.name}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold flex items-center justify-end gap-1">
                            {item.value.toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground">
                              VNĐ
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {percent}%
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {pieData.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Chưa có dữ liệu
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử đối soát doanh thu tác giả</CardTitle>
            <CardDescription>Các yêu cầu đã xử lý</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 italic text-muted-foreground">
                Không có dữ liệu
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã GD</TableHead>
                    <TableHead>Ngân hàng</TableHead>
                    <TableHead>
                      <div className="relative inline-flex items-center">
                        <Gem className="h-4 w-4 text-blue-500 fill-blue-500 opacity-80" />
                        <span className="absolute -bottom-2 -right-2 text-yellow-500 text-lg font-bold leading-none">
                          *
                        </span>
                      </div>
                    </TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày xử lý</TableHead>
                    <TableHead>Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.requestId}>
                      <TableCell className="text-xs">
                        {tx.transactionCode ||
                          `#${tx.requestId.slice(0, 8)}...`}
                      </TableCell>
                      <TableCell>{tx.bankName}</TableCell>
                      <TableCell className="font-bold">
                        {tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{renderStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(tx.reviewedAt), "dd/MM/yyyy HH:mm", {
                          locale: vi,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTx(tx);
                            setOpenDetail(true);
                          }}
                        >
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* MODAL DETAIL */}
        {selectedTx && (
          <Dialog open={openDetail} onOpenChange={setOpenDetail}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Chi tiết giao dịch</DialogTitle>
                <DialogDescription>
                  Thông tin đầy đủ của giao dịch
                </DialogDescription>
              </DialogHeader>

              {/* SỬA LỖI HYDRATION Ở ĐÂY: Thay các thẻ p thành div */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <b>Mã GD:</b>{" "}
                  {selectedTx.transactionCode || selectedTx.requestId}
                </div>
                
                <div className="flex items-center gap-1">
                  <b>Số tiền:</b> {selectedTx.amount.toLocaleString()}
                  <div className="relative inline-flex items-center">
                    <Gem className="h-4 w-4 text-blue-500 fill-blue-500 opacity-80" />
                    <span className="absolute -bottom-2 -right-2 text-yellow-500 text-lg font-bold leading-none">
                      *
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <b>Trạng thái:</b> {renderStatusBadge(selectedTx.status)}
                </div>

                <div className="border-t pt-2 space-y-2">
                  <div>
                    <b>Ngân hàng:</b> {selectedTx.bankName}
                  </div>
                  <div>
                    <b>Số TK:</b> {selectedTx.bankAccountNumber}
                  </div>
                  <div>
                    <b>Chủ TK:</b> {selectedTx.accountHolderName}
                  </div>
                </div>

                <div className="border-t pt-2">
                  <b>Ghi chú:</b>
                  <div className="italic mt-1">
                    {selectedTx.moderatorNote || "Không có"}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDetail(false)}>
                  Đóng
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </OpLayout>
  );
}