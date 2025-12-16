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
import {
  Download,
  Loader2,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// 👉 Dialog (Modal)
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
} from "@/services/operationModStatService";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

// ================= TYPES =================
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

// ================= PAGE =================
export default function ManageRevenuePage() {
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  const [revenueData, setRevenueData] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 👉 State modal chi tiết
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const apiPeriod =
          period === "daily" ? "day" : period === "yearly" ? "year" : "month";

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
            new Date(b.reviewedAt).getTime() -
            new Date(a.reviewedAt).getTime()
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

  const handleExport = () => {
    toast.success("Tính năng xuất báo cáo đang phát triển 😅");
  };

  // ================= DATA =================
  const pieData = revenueData
    ? [
        { name: "Nạp Kim Cương", value: revenueData.diaTopup },
        { name: "Gói Hội Viên", value: revenueData.subscription },
        { name: "Voice Topup", value: revenueData.voiceTopup },
      ].filter((i) => i.value > 0)
    : [];

  const barData =
    revenueData?.points?.map((p: any) => ({
      name: p.periodLabel,
      value: p.value,
    })) || [];

  const totalRevenue = pieData.reduce(
    (acc, curr) => acc + curr.value,
    0
  );

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

  // ================= RENDER =================
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Theo ngày</SelectItem>
                <SelectItem value="monthly">Theo tháng</SelectItem>
                <SelectItem value="yearly">Theo năm</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Charts */}
        {loading ? (
          <div className="h-96 flex justify-center items-center">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Biến động Doanh thu</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  Tổng thu: {totalRevenue.toLocaleString()}
                  <Gem className="w-4 h-4 text-blue-500 fill-blue-500" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#3A506B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cơ cấu Nguồn thu</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={80}
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử giao dịch rút tiền</CardTitle>
            <CardDescription>
              Các yêu cầu rút tiền đã xử lý
            </CardDescription>
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
                    <TableHead>Số tiền</TableHead>
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
                      <TableCell>
                        {tx.bankName}
                      </TableCell>
                      <TableCell className="font-bold flex items-center gap-1">
                        {tx.amount.toLocaleString()}
                        <Gem className="w-3 h-3 text-blue-500" />
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(tx.status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(
                          new Date(tx.reviewedAt),
                          "dd/MM/yyyy HH:mm",
                          { locale: vi }
                        )}
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
                  Thông tin đầy đủ của giao dịch rút tiền
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <p><b>Mã GD:</b> {selectedTx.transactionCode || selectedTx.requestId}</p>
                <p className="flex items-center gap-1">
                  <b>Số tiền:</b> {selectedTx.amount.toLocaleString()}
                  <Gem className="w-4 h-4 text-blue-500" />
                </p>
                <p><b>Trạng thái:</b> {renderStatusBadge(selectedTx.status)}</p>

                <div className="border-t pt-2">
                  <p><b>Ngân hàng:</b> {selectedTx.bankName}</p>
                  <p><b>Số TK:</b> {selectedTx.bankAccountNumber}</p>
                  <p><b>Chủ TK:</b> {selectedTx.accountHolderName}</p>
                </div>

                <div className="border-t pt-2">
                  <b>Ghi chú:</b>
                  <p className="italic">
                    {selectedTx.moderatorNote || "Không có"}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenDetail(false)}
                >
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
