"use client"
import { useState } from "react"
import { AppSidebar } from "@/components/op-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coins, CheckCircle, Clock, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface WithdrawRequest {
  id: number;
  authorName: string;
  authorId: number;
  coins: number;
  conversionRate: number;
  amountVND: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  bankAccount: string;
}

const mockRequests: WithdrawRequest[] = [
  {
    id: 1,
    authorName: 'Nguyễn Văn A',
    authorId: 1,
    coins: 85000,
    conversionRate: 100,
    amountVND: 8500000,
    requestDate: '12/10/2025 14:30',
    status: 'pending',
    bankAccount: 'Vietcombank - 1234567890'
  },
  {
    id: 2,
    authorName: 'Lê Hoàng C',
    authorId: 3,
    coins: 152000,
    conversionRate: 100,
    amountVND: 15200000,
    requestDate: '12/10/2025 10:15',
    status: 'pending',
    bankAccount: 'Techcombank - 9876543210'
  },
  {
    id: 3,
    authorName: 'Phạm Thị D',
    authorId: 8,
    coins: 43000,
    conversionRate: 100,
    amountVND: 4300000,
    requestDate: '11/10/2025 16:45',
    status: 'approved',
    bankAccount: 'ACB - 5555666677'
  },
];

export default function WithdrawManagement() {
  const [requests, setRequests] = useState<WithdrawRequest[]>(mockRequests);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleApprove = (request: WithdrawRequest) => {
    setSelectedRequest(request);
    setShowConfirmDialog(true);
  };

  const confirmApproval = () => {
    if (selectedRequest) {
      setRequests(requests.map(r =>
        r.id === selectedRequest.id ? { ...r, status: 'approved' as const } : r
      ));
      toast.success(`Đã xác nhận giao dịch rút tiền cho ${selectedRequest.authorName}`);
      setShowConfirmDialog(false);
      setSelectedRequest(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><Clock className="w-3 h-3 mr-1" />Chờ xử lý</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500 text-red-500">Từ chối</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const completedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="p-6 min-h-[calc(100vh-4rem)] bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--primary)]">Quản lý Rút Tiền</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Xử lý yêu cầu rút tiền từ Sponsored Authors
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Chờ xử lý</CardTitle>
                <Clock className="w-5 h-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{pendingRequests.length}</div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">yêu cầu đang chờ</p>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Tổng xu chờ đổi</CardTitle>
                <Coins className="w-5 h-5 text-[var(--primary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{pendingRequests.reduce((sum, r) => sum + r.coins, 0).toLocaleString()}</div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">xu</p>
              </CardContent>
            </Card>

            <Card className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Tổng tiền chờ</CardTitle>
                <Calculator className="w-5 h-5 text-[var(--secondary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{(pendingRequests.reduce((sum, r) => sum + r.amountVND, 0)).toLocaleString()}₫</div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">VNĐ</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests */}
          <Card className="border border-[var(--border)] bg-[var(--card)] shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">Yêu cầu chờ xử lý</CardTitle>
              <CardDescription className="text-[var(--muted-foreground)]">
                Tỷ lệ quy đổi hiện tại: 100 xu = 100.000 VNĐ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[var(--foreground)]">Tác giả</TableHead>
                    <TableHead className="text-[var(--foreground)]">Số xu</TableHead>
                    <TableHead className="text-[var(--foreground)]">Tỷ lệ</TableHead>
                    <TableHead className="text-[var(--foreground)]">Số tiền (VNĐ)</TableHead>
                    <TableHead className="text-[var(--foreground)]">Tài khoản</TableHead>
                    <TableHead className="text-[var(--foreground)]">Thời gian</TableHead>
                    <TableHead className="text-[var(--foreground)]">Trạng thái</TableHead>
                    <TableHead className="text-[var(--foreground)]">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="text-[var(--foreground)]">{request.authorName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-[var(--primary)]" />
                          {request.coins.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-[var(--foreground)]">100 xu = 100K</TableCell>
                      <TableCell className="text-[var(--foreground)]">{request.amountVND.toLocaleString()}₫</TableCell>
                      <TableCell className="text-sm text-[var(--muted-foreground)]">{request.bankAccount}</TableCell>
                      <TableCell className="text-sm text-[var(--muted-foreground)]">{request.requestDate}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          className="bg-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_75%,black)] text-[var(--primary-foreground)]"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Xác nhận
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pendingRequests.length === 0 && (
                <div className="py-12 text-center text-[var(--muted-foreground)]">
                  Không có yêu cầu nào đang chờ xử lý
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Requests */}
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-[var(--primary)]">Lịch sử giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[var(--foreground)]">Tác giả</TableHead>
                    <TableHead className="text-[var(--foreground)]">Số xu</TableHead>
                    <TableHead className="text-[var(--foreground)]">Số tiền (VNĐ)</TableHead>
                    <TableHead className="text-[var(--foreground)]">Tài khoản</TableHead>
                    <TableHead className="text-[var(--foreground)]">Thời gian</TableHead>
                    <TableHead className="text-[var(--foreground)]">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="text-[var(--foreground)]">{request.authorName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-[var(--primary)]" />
                          {request.coins.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-[var(--foreground)]">{request.amountVND.toLocaleString()}₫</TableCell>
                      <TableCell className="text-sm text-[var(--muted-foreground)]">{request.bankAccount}</TableCell>
                      <TableCell className="text-sm text-[var(--muted-foreground)]">{request.requestDate}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Confirm Dialog */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="bg-[var(--card)] border border-[var(--border)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--primary)]">Xác nhận giao dịch rút tiền</DialogTitle>
                <DialogDescription className="text-[var(--muted-foreground)]">
                  Xác nhận chuyển tiền cho tác giả
                </DialogDescription>
              </DialogHeader>
              {selectedRequest && (
                <div className="space-y-4 py-4">
                  <div className="p-4 bg-[var(--muted)] rounded-xl space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Tác giả:</span>
                      <span className="text-[var(--foreground)]">{selectedRequest.authorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Số xu:</span>
                      <span className="flex items-center gap-1 text-[var(--foreground)]">
                        <Coins className="w-4 h-4 text-[var(--primary)]" />
                        {selectedRequest.coins.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Số tiền:</span>
                      <span className="text-[var(--foreground)]">{selectedRequest.amountVND.toLocaleString()}₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Tài khoản:</span>
                      <span className="text-[var(--foreground)]">{selectedRequest.bankAccount}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Hãy đảm bảo bạn đã chuyển tiền vào tài khoản của tác giả trước khi xác nhận.
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmDialog(false)}
                  className="border-[var(--border)] text-[var(--foreground)]"
                >
                  Hủy
                </Button>
                <Button
                  onClick={confirmApproval}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Xác nhận đã chuyển tiền
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}