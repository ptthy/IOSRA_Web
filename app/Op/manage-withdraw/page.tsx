"use client";

import { useState, useEffect } from "react";
import OpLayout from "@/components/OpLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Clock, XCircle, Search, Loader2, Gem } from "lucide-react";
import { toast } from "sonner";

// Import API Service
import { 
  getWithdrawRequests, 
  approveWithdrawRequest, 
  rejectWithdrawRequest 
} from "@/services/operationModStatService";

interface WithdrawRequest {
  requestId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  bankName: string;
  bankAccountNumber: string;
  accountHolderName: string;
  moderatorNote?: string;
  transactionCode?: string;
  createdAt: string;
  reviewedAt?: string;
  authorName?: string; 
}

// Component nhỏ để hiển thị Gem có dấu sao (Tái sử dụng code bạn cung cấp)
const GemWithStar = ({ size = "h-4 w-4" }: { size?: string }) => (
  <div className="relative inline-flex items-center">
    <Gem className={`${size} text-blue-500 fill-blue-500 opacity-80`} />
    <span className="absolute -bottom-2 -right-2 text-yellow-500 text-lg font-bold leading-none">
      *
    </span>
  </div>
);

export default function WithdrawManagement() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null);
  
  // State Approve
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [transactionCode, setTransactionCode] = useState("");
  const [approveNote, setApproveNote] = useState("");
  
  // State Reject
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Data
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getWithdrawRequests(); 
      setRequests(data);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải danh sách rút tiền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 2. Handle Approve
  const handleApproveClick = (req: WithdrawRequest) => {
    setSelectedRequest(req);
    setTransactionCode("");
    setApproveNote("");
    setShowApproveDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      await approveWithdrawRequest(selectedRequest.requestId, transactionCode, approveNote);
      toast.success("Đã duyệt yêu cầu thành công!");
      setShowApproveDialog(false);
      fetchRequests(); // Refresh data
    } catch (error) {
      toast.error("Duyệt thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Reject
  const handleRejectClick = (req: WithdrawRequest) => {
    setSelectedRequest(req);
    setRejectReason("");
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!selectedRequest) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    setIsSubmitting(true);
    try {
      await rejectWithdrawRequest(selectedRequest.requestId, rejectReason);
      toast.success("Đã từ chối yêu cầu.");
      setShowRejectDialog(false);
      fetchRequests(); // Refresh data
    } catch (error) {
      toast.error("Từ chối thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Filtering Logic
  const filteredRequests = requests.filter((r) => {
    const statusMatch = filterStatus === "all" ? true : r.status.toLowerCase() === filterStatus.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = 
      (r.accountHolderName && r.accountHolderName.toLowerCase().includes(searchLower)) ||
      (r.bankAccountNumber && r.bankAccountNumber.includes(searchLower));
    
    return statusMatch && searchMatch;
  });

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50"><Clock className="w-3 h-3 mr-1"/>Chờ xử lý</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50"><CheckCircle className="w-3 h-3 mr-1"/>Đã duyệt</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/>Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <OpLayout>
      <main className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--primary)]">Quản lý Đối soát</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Xử lý yêu cầu đối soát từ Author</p>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <CardTitle>Danh sách yêu cầu</CardTitle>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Tìm tên chủ TK, số TK..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="approved">Đã duyệt</SelectItem>
                    <SelectItem value="rejected">Đã từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Ngân hàng</TableHead>
                  <TableHead>Chủ TK</TableHead>
                  <TableHead>Số TK</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center h-32"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <TableRow key={req.requestId}>
                      <TableCell>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                      
                      {/* --- CẬP NHẬT: Thay thế icon tại đây --- */}
                      <TableCell className="font-bold text-green-600">
                        <div className="flex items-center gap-1">
                          {req.amount.toLocaleString()} 
                          <GemWithStar size="h-4 w-4" />
                        </div>
                      </TableCell>
                      {/* -------------------------------------- */}

                      <TableCell>{req.bankName}</TableCell>
                      <TableCell>{req.accountHolderName}</TableCell>
                      <TableCell>{req.bankAccountNumber}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {req.status.toLowerCase() === 'pending' ? (
                          <>
                            <Button size="sm" onClick={() => handleApproveClick(req)} className="bg-green-600 hover:bg-green-700 text-white">Duyệt</Button>
                            <Button size="sm" variant="outline" onClick={() => handleRejectClick(req)} className="text-red-500 border-red-500 hover:bg-red-50">Từ chối</Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Đã xử lý</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Không tìm thấy yêu cầu nào.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Approve Modal */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận Duyệt</DialogTitle>
              <DialogDescription>Vui lòng chuyển khoản trước khi xác nhận.</DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 py-2">
                <div className="bg-muted p-3 rounded text-sm">
                  <p><strong>Người nhận:</strong> {selectedRequest.accountHolderName}</p>
                  <p><strong>Ngân hàng:</strong> {selectedRequest.bankName} - {selectedRequest.bankAccountNumber}</p>
                  
                  {/* --- CẬP NHẬT: Thay thế icon tại đây (Modal) --- */}
                  <div className="text-lg font-bold text-green-600 mt-1 flex items-center gap-1">
                    Số tiền: {selectedRequest.amount.toLocaleString()} 
                    <GemWithStar size="h-5 w-5" />
                  </div>
                  {/* ---------------------------------------------- */}

                </div>
                <div className="space-y-2">
                  <Label>Mã giao dịch (Optional)</Label>
                  <Input placeholder="VD: FT123456..." value={transactionCode} onChange={e => setTransactionCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú (Optional)</Label>
                  <Textarea placeholder="Ghi chú..." value={approveNote} onChange={e => setApproveNote(e.target.value)} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Hủy</Button>
              <Button onClick={confirmApprove} disabled={isSubmitting} className="bg-green-600 text-white hover:bg-green-700">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Xác nhận
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Từ chối Yêu cầu</DialogTitle>
              <DialogDescription>Hành động này không thể hoàn tác.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label className="text-red-500 font-semibold">Lý do từ chối (Bắt buộc) *</Label>
              <Textarea 
                className="mt-2 h-32"
                placeholder="VD: Sai thông tin ngân hàng..." 
                value={rejectReason} 
                onChange={(e) => setRejectReason(e.target.value)} 
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Hủy</Button>
              <Button onClick={confirmReject} disabled={isSubmitting || !rejectReason.trim()} variant="destructive">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Xác nhận Từ chối
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </OpLayout>
  );
}