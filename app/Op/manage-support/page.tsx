"use client"
import { useState } from "react"
import OpLayout from "@/components/OpLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Ticket {
  id: number;
  userId: number;
  userName: string;
  userType: 'reader' | 'author';
  issueType: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

const mockTickets: Ticket[] = [
  {
    id: 1,
    userId: 101,
    userName: 'Nguyễn Văn A',
    userType: 'reader',
    issueType: 'Lỗi thanh toán',
    description: 'Không thể nạp xu qua VNPay, luôn báo lỗi timeout',
    status: 'pending',
    createdAt: '12/10/2025 15:30',
    priority: 'high'
  },
  {
    id: 2,
    userId: 45,
    userName: 'Trần Thị B',
    userType: 'author',
    issueType: 'Vấn đề tài khoản',
    description: 'Không thể đăng nhập vào dashboard author',
    status: 'in-progress',
    createdAt: '12/10/2025 10:15',
    priority: 'high'
  },
  {
    id: 3,
    userId: 203,
    userName: 'Lê Hoàng C',
    userType: 'reader',
    issueType: 'Lỗi hiển thị',
    description: 'Truyện không load được hình ảnh',
    status: 'pending',
    createdAt: '11/10/2025 18:45',
    priority: 'medium'
  },
  {
    id: 4,
    userId: 78,
    userName: 'Phạm Mai D',
    userType: 'author',
    issueType: 'Câu hỏi về xu',
    description: 'Muốn biết cách tính doanh thu từ xu',
    status: 'resolved',
    createdAt: '10/10/2025 14:20',
    priority: 'low'
  },
];

export default function SupportManagement() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState('');

  const handleResolve = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowResolveDialog(true);
  };

  const confirmResolve = () => {
    if (selectedTicket && resolution) {
      setTickets(tickets.map(t =>
        t.id === selectedTicket.id ? { ...t, status: 'resolved' as const } : t
      ));
      toast.success(`Đã xử lý ticket #${selectedTicket.id}`);
      setShowResolveDialog(false);
      setResolution('');
      setSelectedTicket(null);
    }
  };

  const handleInProgress = (id: number) => {
    setTickets(tickets.map(t =>
      t.id === id ? { ...t, status: 'in-progress' as const } : t
    ));
    toast.success('Đã cập nhật trạng thái');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><Clock className="w-3 h-3 mr-1" />Chờ xử lý</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="border-blue-500 text-blue-500"><MessageSquare className="w-3 h-3 mr-1" />Đang xử lý</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="border-green-500 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />Đã xử lý</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">Cao</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Trung bình</Badge>;
      case 'low':
        return <Badge className="bg-green-500">Thấp</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const pendingTickets = tickets.filter(t => t.status === 'pending');
  const inProgressTickets = tickets.filter(t => t.status === 'in-progress');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');

  return (
    <OpLayout>
      <main className="p-6 min-h-[calc(100vh-4rem)] bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--primary)]">
              Hỗ trợ & Tối ưu hệ thống
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Quản lý yêu cầu hỗ trợ từ người dùng và tác giả
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Chờ xử lý</CardTitle>
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{pendingTickets.length}</div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">tickets</p>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Đang xử lý</CardTitle>
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{inProgressTickets.length}</div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">tickets</p>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Đã xử lý</CardTitle>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{resolvedTickets.length}</div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">tickets</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-[var(--muted)]">
            <TabsTrigger value="pending" className="relative">
              Chờ xử lý
              {pendingTickets.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white rounded-full text-xs">
                  {pendingTickets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="in-progress">Đang xử lý</TabsTrigger>
            <TabsTrigger value="resolved">Đã xử lý</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[var(--primary)]">Tickets chờ xử lý</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[var(--foreground)]">ID</TableHead>
                      <TableHead className="text-[var(--foreground)]">Người gửi</TableHead>
                      <TableHead className="text-[var(--foreground)]">Loại</TableHead>
                      <TableHead className="text-[var(--foreground)]">Vấn đề</TableHead>
                      <TableHead className="text-[var(--foreground)]">Mô tả</TableHead>
                      <TableHead className="text-[var(--foreground)]">Ưu tiên</TableHead>
                      <TableHead className="text-[var(--foreground)]">Thời gian</TableHead>
                      <TableHead className="text-[var(--foreground)]">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="text-[var(--foreground)]">#{ticket.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-[var(--foreground)]">{ticket.userName}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {ticket.userType === 'author' ? 'Tác giả' : 'Độc giả'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[var(--foreground)]">{ticket.issueType}</TableCell>
                        <TableCell className="max-w-xs truncate text-[var(--foreground)]">{ticket.description}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell className="text-sm text-[var(--muted-foreground)]">{ticket.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleInProgress(ticket.id)}
                              className="border-blue-500 text-blue-500 hover:bg-blue-50"
                            >
                              Xử lý
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleResolve(ticket)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Hoàn thành
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {pendingTickets.length === 0 && (
                  <div className="py-12 text-center text-[var(--muted-foreground)]">
                    Không có ticket nào đang chờ xử lý
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in-progress">
            <Card className="border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[var(--primary)]">Tickets đang xử lý</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[var(--foreground)]">ID</TableHead>
                      <TableHead className="text-[var(--foreground)]">Người gửi</TableHead>
                      <TableHead className="text-[var(--foreground)]">Loại</TableHead>
                      <TableHead className="text-[var(--foreground)]">Vấn đề</TableHead>
                      <TableHead className="text-[var(--foreground)]">Mô tả</TableHead>
                      <TableHead className="text-[var(--foreground)]">Ưu tiên</TableHead>
                      <TableHead className="text-[var(--foreground)]">Thời gian</TableHead>
                      <TableHead className="text-[var(--foreground)]">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inProgressTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="text-[var(--foreground)]">#{ticket.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-[var(--foreground)]">{ticket.userName}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {ticket.userType === 'author' ? 'Tác giả' : 'Độc giả'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[var(--foreground)]">{ticket.issueType}</TableCell>
                        <TableCell className="max-w-xs truncate text-[var(--foreground)]">{ticket.description}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell className="text-sm text-[var(--muted-foreground)]">{ticket.createdAt}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleResolve(ticket)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Hoàn thành
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {inProgressTickets.length === 0 && (
                  <div className="py-12 text-center text-[var(--muted-foreground)]">
                    Không có ticket nào đang xử lý
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resolved">
            <Card className="border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[var(--primary)]">Tickets đã xử lý</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[var(--foreground)]">ID</TableHead>
                      <TableHead className="text-[var(--foreground)]">Người gửi</TableHead>
                      <TableHead className="text-[var(--foreground)]">Loại</TableHead>
                      <TableHead className="text-[var(--foreground)]">Vấn đề</TableHead>
                      <TableHead className="text-[var(--foreground)]">Trạng thái</TableHead>
                      <TableHead className="text-[var(--foreground)]">Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resolvedTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="text-[var(--foreground)]">#{ticket.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-[var(--foreground)]">{ticket.userName}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {ticket.userType === 'author' ? 'Tác giả' : 'Độc giả'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[var(--foreground)]">{ticket.issueType}</TableCell>
                        <TableCell className="max-w-xs truncate text-[var(--foreground)]">{ticket.description}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell className="text-sm text-[var(--muted-foreground)]">{ticket.createdAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resolve Dialog */}
        <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
          <DialogContent className="bg-[var(--card)] border border-[var(--border)]">
            <DialogHeader>
              <DialogTitle className="text-[var(--primary)]">Hoàn thành ticket</DialogTitle>
              <DialogDescription className="text-[var(--muted-foreground)]">
                Ghi chú về cách xử lý vấn đề (tùy chọn)
              </DialogDescription>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-[var(--muted)] rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Ticket:</span>
                    <span className="text-[var(--foreground)]">#{selectedTicket.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Người gửi:</span>
                    <span className="text-[var(--foreground)]">{selectedTicket.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Vấn đề:</span>
                    <span className="text-[var(--foreground)]">{selectedTicket.issueType}</span>
                  </div>
                </div>
                <Textarea
                  placeholder="Ghi chú về cách xử lý (không bắt buộc)..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="min-h-[100px] bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
                />
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowResolveDialog(false)}
                className="border-[var(--border)] text-[var(--foreground)]"
              >
                Hủy
              </Button>
              <Button
                onClick={confirmResolve}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Xác nhận hoàn thành
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </OpLayout>
  );
}