"use client"
import { useState } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, CheckCircle, XCircle, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface Author {
  id: number;
  name: string;
  email: string;
  stories: number;
  views: number;
  status: 'active' | 'suspended' | 'sponsored';
  revenue: number;
}

interface SponsorRequest {
  id: number;
  authorId: number;
  authorName: string;
  email: string;
  stories: number;
  views: number;
  requestDate: string;
  reason: string;
}

const mockAuthors: Author[] = [
  { id: 1, name: 'Nguyễn Văn A', email: 'vana@example.com', stories: 15, views: 125000, status: 'sponsored', revenue: 8500000 },
  { id: 2, name: 'Trần Thị B', email: 'thib@example.com', stories: 8, views: 45000, status: 'active', revenue: 0 },
  { id: 3, name: 'Lê Hoàng C', email: 'hoangc@example.com', stories: 22, views: 230000, status: 'sponsored', revenue: 15200000 },
  { id: 4, name: 'Phạm Mai D', email: 'maid@example.com', stories: 5, views: 12000, status: 'active', revenue: 0 },
  { id: 5, name: 'Đỗ Quang E', email: 'quange@example.com', stories: 12, views: 78000, status: 'active', revenue: 0 },
];

const mockRequests: SponsorRequest[] = [
  { id: 1, authorId: 6, authorName: 'Vũ Thị F', email: 'thif@example.com', stories: 10, views: 95000, requestDate: '10/10/2025', reason: 'Đã đạt 100K views, muốn kiếm thêm thu nhập' },
  { id: 2, authorId: 7, authorName: 'Hoàng Văn G', email: 'vang@example.com', stories: 18, views: 145000, requestDate: '09/10/2025', reason: 'Có nhiều truyện hot, muốn phát triển thêm' },
];

export default function AuthorManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [authors] = useState<Author[]>(mockAuthors);
  const [requests, setRequests] = useState<SponsorRequest[]>(mockRequests);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SponsorRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveRequest = (request: SponsorRequest) => {
    setRequests(requests.filter(r => r.id !== request.id));
    toast.success(`Đã duyệt yêu cầu của ${request.authorName}`);
  };

  const handleRejectRequest = () => {
    if (selectedRequest && rejectReason) {
      setRequests(requests.filter(r => r.id !== selectedRequest.id));
      toast.error(`Đã từ chối yêu cầu của ${selectedRequest.authorName}`);
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedRequest(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sponsored':
        return <Badge className="bg-[var(--primary)] text-[var(--primary-foreground)]"><Crown className="w-3 h-3 mr-1" />Sponsored</Badge>;
      case 'active':
        return <Badge variant="outline" className="border-green-500 text-green-500">Active</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="border-red-500 text-red-500">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="p-6 min-h-[calc(100vh-4rem)] bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--primary)]">
                Quản lý Author & Nâng cấp Sponsored
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                Quản lý danh sách tác giả và yêu cầu nâng cấp
              </p>
            </div>
          </div>

          <Tabs defaultValue="authors" className="space-y-6">
            <TabsList className="bg-[var(--muted)]">
              <TabsTrigger value="authors">Danh sách Authors</TabsTrigger>
              <TabsTrigger value="requests" className="relative">
                Yêu cầu nâng cấp
                {requests.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full text-xs">
                    {requests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="authors" className="space-y-4">
              <Card className="border border-[var(--border)] bg-[var(--card)] shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[var(--primary)]">Danh sách Authors</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                      <Input
                        placeholder="Tìm kiếm tác giả..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[var(--foreground)]">Tên tác giả</TableHead>
                        <TableHead className="text-[var(--foreground)]">Email</TableHead>
                        <TableHead className="text-[var(--foreground)]">Số truyện</TableHead>
                        <TableHead className="text-[var(--foreground)]">Views</TableHead>
                        <TableHead className="text-[var(--foreground)]">Doanh thu</TableHead>
                        <TableHead className="text-[var(--foreground)]">Status</TableHead>
                        <TableHead className="text-[var(--foreground)]">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuthors.map((author) => (
                        <TableRow key={author.id}>
                          <TableCell className="text-[var(--foreground)]">{author.name}</TableCell>
                          <TableCell className="text-[var(--muted-foreground)]">{author.email}</TableCell>
                          <TableCell className="text-[var(--foreground)]">{author.stories}</TableCell>
                          <TableCell className="text-[var(--foreground)]">{author.views.toLocaleString()}</TableCell>
                          <TableCell className="text-[var(--foreground)]">{author.revenue > 0 ? `${author.revenue.toLocaleString()}₫` : '-'}</TableCell>
                          <TableCell>{getStatusBadge(author.status)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedAuthor(author)}
                              className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <div className="grid gap-4">
                {requests.map((request) => (
                  <Card key={request.id} className="border border-[var(--border)] bg-[var(--card)] shadow-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-[var(--primary)]">{request.authorName}</CardTitle>
                          <CardDescription className="text-[var(--muted-foreground)]">{request.email}</CardDescription>
                        </div>
                        <Badge variant="outline" className="border-[var(--primary)] text-[var(--primary)]">
                          {request.requestDate}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-[var(--muted-foreground)]">Số truyện</p>
                          <p className="text-[var(--foreground)]">{request.stories}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[var(--muted-foreground)]">Total Views</p>
                          <p className="text-[var(--foreground)]">{request.views.toLocaleString()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Lý do xin nâng cấp</p>
                        <p className="text-sm bg-[var(--muted)] p-3 rounded-lg text-[var(--foreground)]">{request.reason}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproveRequest(request)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Duyệt
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectDialog(true);
                          }}
                          className="flex-1 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Từ chối
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {requests.length === 0 && (
                  <Card className="border border-dashed border-[var(--border)]">
                    <CardContent className="py-12 text-center text-[var(--muted-foreground)]">
                      Không có yêu cầu nào đang chờ xử lý
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Author Detail Dialog */}
          <Dialog open={!!selectedAuthor} onOpenChange={() => setSelectedAuthor(null)}>
            <DialogContent className="max-w-2xl bg-[var(--card)] border border-[var(--border)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--primary)]">Chi tiết tác giả</DialogTitle>
              </DialogHeader>
              {selectedAuthor && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[var(--muted-foreground)]">Tên</p>
                      <p className="text-[var(--foreground)]">{selectedAuthor.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--muted-foreground)]">Email</p>
                      <p className="text-[var(--foreground)]">{selectedAuthor.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--muted-foreground)]">Số truyện</p>
                      <p className="text-[var(--foreground)]">{selectedAuthor.stories}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--muted-foreground)]">Total Views</p>
                      <p className="text-[var(--foreground)]">{selectedAuthor.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--muted-foreground)]">Doanh thu</p>
                      <p className="text-[var(--foreground)]">{selectedAuthor.revenue > 0 ? `${selectedAuthor.revenue.toLocaleString()}₫` : 'Chưa có'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--muted-foreground)] mb-2">Trạng thái</p>
                      {getStatusBadge(selectedAuthor.status)}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Reject Dialog */}
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogContent className="bg-[var(--card)] border border-[var(--border)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--primary)]">Từ chối yêu cầu</DialogTitle>
                <DialogDescription className="text-[var(--muted-foreground)]">
                  Vui lòng ghi rõ lý do từ chối để tác giả biết
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px] bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
              />
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRejectDialog(false)}
                  className="border-[var(--border)] text-[var(--foreground)]"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleRejectRequest}
                  disabled={!rejectReason}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Xác nhận từ chối
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}