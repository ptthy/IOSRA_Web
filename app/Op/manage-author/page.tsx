"use client"
import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/op-sidebar"
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
import { Search, Eye, CheckCircle, XCircle, Crown, UserCheck, Clock, History, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

// API Service (Dùng cho Luồng 2: User -> Author)
import { getUpgradeRequests, approveRequest, rejectRequest } from '@/services/operationModService';

// --- Interface & Data cho Luồng 1: Author (Mock) ---
interface Author {
  id: number;
  name: string;
  email: string;
  stories: number;
  views: number;
  status: 'active' | 'suspended' | 'sponsored';
  revenue: number;
}
const mockAuthors: Author[] = [
  { id: 1, name: 'Nguyễn Văn A', email: 'vana@example.com', stories: 15, views: 125000, status: 'sponsored', revenue: 8500000 },
  { id: 2, name: 'Trần Thị B', email: 'thib@example.com', stories: 8, views: 45000, status: 'active', revenue: 0 },
];
// --------------------------------------------------------

// --- Interface & Data cho Luồng 1: Sponsored (Mock) ---
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
// ✅ SỬA 1: Thêm mock data cho "Sponsored" vì API của nó chưa có
const mockSponsorRequests: SponsorRequest[] = [
  { id: 201, authorId: 1, authorName: 'Nguyễn Văn A (Mock)', email: 'vana@example.com', stories: 15, views: 125000, requestDate: '2025-10-28', reason: 'Tôi muốn trở thành author sponsored (đây là mock data).' },
  { id: 202, authorId: 3, authorName: 'Lê Hoàng C (Mock)', email: 'hoangc@example.com', stories: 22, views: 230000, requestDate: '2025-10-27', reason: 'Đã đủ điều kiện (đây là mock data).' },
];
// --------------------------------------------------------


// --- Interface cho Luồng 2: User -> Author (Khớp với API) ---
interface AuthorUpgradeRequest {
  // Đây là các trường API trả về
  requestId: number;
  requesterId: number;
  status: 'pending' | 'approved' | 'rejected'; // API trả về "pending"
  content: string; // Đây là "lời cam kết"
  createdAt: string;
  assignedOmodId: number | null;
  
  // TODO: Bạn cần backend trả về thêm thông tin user
  userName?: string; // (Tạm thời tự thêm)
  email?: string; // (Tạm thời tự thêm)
}

// === ❌ XÓA: mockUpgradeRequests ===


export default function AuthorManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [authors] = useState<Author[]>(mockAuthors);

  // --- State cho Luồng 1 (Sponsored) ---
  const [sponsorRequests, setSponsorRequests] = useState<SponsorRequest[]>([]); // Bắt đầu rỗng
  const [isLoadingSponsorRequests, setIsLoadingSponsorRequests] = useState(true);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [selectedSponsorRequest, setSelectedSponsorRequest] = useState<SponsorRequest | null>(null);
  const [sponsorRejectReason, setSponsorRejectReason] = useState('');
  const [showSponsorRejectDialog, setShowSponsorRejectDialog] = useState(false);

  // --- State cho Luồng 2 (Author Upgrade) ---
  const [authorUpgradeRequests, setAuthorUpgradeRequests] = useState<AuthorUpgradeRequest[]>([]); // Bắt đầu rỗng
  const [isLoadingAuthorRequests, setIsLoadingAuthorRequests] = useState(true);
  const [selectedAuthorRequest, setSelectedAuthorRequest] = useState<AuthorUpgradeRequest | null>(null);
  const [authorRejectReason, setAuthorRejectReason] = useState("");
  const [showAuthorRejectDialog, setShowAuthorRejectDialog] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  
  // --- Logic cho Luồng 1 (Sponsored) ---
  // ✅ SỬA 2: Chuyển sang dùng MOCK DATA
  useEffect(() => {
    setIsLoadingSponsorRequests(true);
    // Giả lập tải mock data
    const timer = setTimeout(() => {
      setSponsorRequests(mockSponsorRequests);
      setIsLoadingSponsorRequests(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // (Các hàm approve/reject của Sponsored tạm thời chỉ sửa state)
  const handleApproveSponsorRequest = async (request: SponsorRequest) => {
    // TODO: Chờ API cho luồng này
    setSponsorRequests(sponsorRequests.filter(r => r.id !== request.id));
    toast.success(`(Mock) Đã duyệt yêu cầu Sponsored của ${request.authorName}`);
  };
  const handleRejectSponsorRequest = async () => {
    // TODO: Chờ API cho luồng này
    if (selectedSponsorRequest && sponsorRejectReason) {
      setSponsorRequests(sponsorRequests.filter(r => r.id !== selectedSponsorRequest.id));
      toast.error(`(Mock) Đã từ chối yêu cầu Sponsored của ${selectedSponsorRequest.authorName}`);
      setShowSponsorRejectDialog(false);
    }
  };

  const getStatusBadge = (status: string) => {
    // (Giữ nguyên)
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

  
  // --- Logic cho Luồng 2 (Author Upgrade) ---
  // ✅ SỬA 3: Chuyển sang dùng API THẬT
  useEffect(() => {
    async function fetchAuthorUpgradeRequests() {
      try {
        setIsLoadingAuthorRequests(true);
        // Gọi API thật từ service
        const data: AuthorUpgradeRequest[] = await getUpgradeRequests('PENDING'); 
        
        // TODO: Backend nên trả về cả userName và email
        // (Tạm thời gán thủ công vì API không có)
        const dataWithNames = data.map(req => ({
          ...req,
          userName: `User ID: ${req.requesterId}`, // Tạm
          email: `user_${req.requesterId}@example.com` // Tạm
        }));
        
        setAuthorUpgradeRequests(dataWithNames);
      } catch (error) {
        console.error("Failed to fetch author upgrade requests:", error);
        toast.error("Không thể tải danh sách yêu cầu lên Author.");
      } finally {
        setIsLoadingAuthorRequests(false);
      }
    }
    fetchAuthorUpgradeRequests();
  }, []); // Chạy 1 lần khi tải trang

  const handleOpenAuthorRejectModal = (request: AuthorUpgradeRequest) => {
    setSelectedAuthorRequest(request);
    setAuthorRejectReason("");
    setShowAuthorRejectDialog(true);
  };

  // ✅ SỬA 4: Gắn API thật (approveRequest)
  const handleApproveAuthorRequest = async (request: AuthorUpgradeRequest) => {
    toast.promise(
      async () => {
        await approveRequest(request.requestId); // Gọi API thật
        setAuthorUpgradeRequests(prev => 
          prev.filter(r => r.requestId !== request.requestId) // Xóa khỏi danh sách
        );
      },
      {
        loading: `Đang duyệt cho ${request.userName}...`,
        success: `Đã duyệt ${request.userName} thành công!`,
        error: "Duyệt thất bại. Vui lòng thử lại.",
      }
    );
  };

  // ✅ SỬA 5: Gắn API thật (rejectRequest)
  const handleConfirmAuthorReject = async () => {
    if (!selectedAuthorRequest || !authorRejectReason) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    setIsSubmittingReject(true);
    toast.promise(
      async () => {
        await rejectRequest(selectedAuthorRequest.requestId, authorRejectReason); // Gọi API thật
        setAuthorUpgradeRequests(prev => 
          prev.filter(r => r.requestId !== selectedAuthorRequest.requestId) // Xóa khỏi danh sách
        );
      },
      {
        loading: `Đang từ chối ${selectedAuthorRequest.userName}...`,
        success: () => {
          setShowAuthorRejectDialog(false);
          return `Đã từ chối ${selectedAuthorRequest.userName}.`;
        },
        error: "Từ chối thất bại. Vui lòng thử lại.",
        finally: () => {
          setIsSubmittingReject(false);
        }
      }
    );
  };

  const getAuthorUpgradeStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-blue-500 text-blue-500"><Clock className="w-3 h-3 mr-1" />Đang chờ</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-500"><Check className="w-3 h-3 mr-1" />Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-600"><X className="w-3 h-3 mr-1" />Bị từ chối</Badge>;
    }
  };

  // ✅ SỬA 6: Cập nhật hàm render bảng
  function renderAuthorUpgradeTable(requests: AuthorUpgradeRequest[], loading: boolean) {
    // Bỏ filter, vì API đã lọc PENDING rồi
    return (
      <Card className="border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-[var(--primary)]">{'Yêu cầu chờ duyệt (User -> Author)'}</CardTitle>
            <CardDescription>Duyệt các user xin nâng cấp lên quyền Author.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[var(--foreground)]">Tên User (ID)</TableHead>
                <TableHead className="text-[var(--foreground)]">Email (Tạm)</TableHead>
                <TableHead className="text-[var(--foreground)]">Ngày gửi</TableHead>
                <TableHead className="text-[var(--foreground)]">Trạng thái</TableHead>
                <TableHead className="text-[var(--foreground)] text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-[var(--muted-foreground)]">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                  </TableCell>
                </TableRow>
              ) : requests.length > 0 ? (
                requests.map((req) => (
                  <TableRow key={req.requestId}>
                    <TableCell className="text-[var(--foreground)] font-medium">{req.userName}</TableCell>
                    <TableCell className="text-[var(--muted-foreground)]">{req.email}</TableCell>
                    <TableCell className="text-[var(--muted-foreground)]">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{getAuthorUpgradeStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleApproveAuthorRequest(req)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" /> Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAuthorRejectModal(req)}
                          className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <X className="w-4 h-4 mr-1" /> Từ chối
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-[var(--muted-foreground)]">
                   {'Không có yêu cầu (User -> Author) nào'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }
  // === KẾT THÚC: Logic cho Luồng 2 ===


  // --- Giao diện (Render) ---
  
  // ✅ SỬA 7: Tính toán lại số lượng
  const pendingSponsorRequestCount = sponsorRequests.length;
  const pendingAuthorRequestCount = authorUpgradeRequests.length;


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
                Quản lý Author & Yêu cầu
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                Quản lý tác giả và các yêu cầu nâng cấp
              </p>
            </div>
          </div>

          <Tabs defaultValue="authors" className="space-y-6">
            <TabsList className="bg-[var(--muted)]">
              <TabsTrigger value="authors">Danh sách Authors</TabsTrigger>
              
              <TabsTrigger value="sponsor-requests" className="relative">
                Yêu cầu Sponsored
                {/* Dùng biến đã tính */}
                {(!isLoadingSponsorRequests && pendingSponsorRequestCount > 0) && (
                  <span className="ml-2 px-2 py-0.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full text-xs">
                    {pendingSponsorRequestCount}
                  </span>
                )}
              </TabsTrigger>
              
              <TabsTrigger value="author-requests" className="relative">
                Yêu cầu lên Author
                {/* Dùng biến đã tính */}
                {(!isLoadingAuthorRequests && pendingAuthorRequestCount > 0) && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                    {pendingAuthorRequestCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Danh sách Authors (Mock) */}
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
                        <TableHead>Tên tác giả</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Số truyện</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Doanh thu</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuthors.map((author) => (
                        <TableRow key={author.id}>
                          <TableCell>{author.name}</TableCell>
                          <TableCell>{author.email}</TableCell>
                          <TableCell>{author.stories}</TableCell>
                          <TableCell>{author.views.toLocaleString()}</TableCell>
                          <TableCell>{author.revenue > 0 ? `${author.revenue.toLocaleString()}₫` : '-'}</TableCell>
                          <TableCell>{getStatusBadge(author.status)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => setSelectedAuthor(author)}>
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

            {/* Tab 2: Yêu cầu Sponsored (Mock) */}
            <TabsContent value="sponsor-requests" className="space-y-4">
              <div className="grid gap-4">
                {isLoadingSponsorRequests && (
                   <Card className="border border-dashed"><CardContent className="py-12 text-center text-muted-foreground">Đang tải...</CardContent></Card>
                )}
                {!isLoadingSponsorRequests && sponsorRequests.map((request) => (
                  <Card key={request.id} className="border border-[var(--border)] bg-[var(--card)] shadow-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-[var(--primary)]">{request.authorName}</CardTitle>
                          <CardDescription>{request.email}</CardDescription>
                        </div>
                        <Badge variant="outline">{request.requestDate}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-[var(--muted-foreground)]">Số truyện</p>
                          <p>{request.stories}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[var(--muted-foreground)]">Total Views</p>
                          <p>{request.views.toLocaleString()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Lý do xin nâng cấp</p>
                        <p className="text-sm bg-[var(--muted)] p-3 rounded-lg">{request.reason}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproveSponsorRequest(request)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Duyệt
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedSponsorRequest(request);
                            setShowSponsorRejectDialog(true);
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
                {!isLoadingSponsorRequests && sponsorRequests.length === 0 && (
                  <Card className="border border-dashed"><CardContent className="py-12 text-center text-muted-foreground">Không có yêu cầu Sponsored (Mock)</CardContent></Card>
                )}
              </div>
            </TabsContent>

            {/* Tab 3: Yêu cầu lên Author (API Thật) */}
            <TabsContent value="author-requests" className="space-y-4">
              {renderAuthorUpgradeTable(authorUpgradeRequests, isLoadingAuthorRequests)}
            </TabsContent>

          </Tabs>

          {/* Dialog Chi tiết Author (Giữ nguyên) */}
          <Dialog open={!!selectedAuthor} onOpenChange={() => setSelectedAuthor(null)}>
            <DialogContent className="max-w-2xl bg-[var(--card)] border border-[var(--border)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--primary)]">Chi tiết tác giả</DialogTitle>
              </DialogHeader>
              {selectedAuthor && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-[var(--muted-foreground)]">Tên</p><p>{selectedAuthor.name}</p></div>
                    <div><p className="text-sm text-[var(--muted-foreground)]">Email</p><p>{selectedAuthor.email}</p></div>
                    <div><p className="text-sm text-[var(--muted-foreground)]">Số truyện</p><p>{selectedAuthor.stories}</p></div>
                    <div><p className="text-sm text-[var(--muted-foreground)]">Total Views</p><p>{selectedAuthor.views.toLocaleString()}</p></div>
                    <div><p className="text-sm text-[var(--muted-foreground)]">Doanh thu</p><p>{selectedAuthor.revenue > 0 ? `${selectedAuthor.revenue.toLocaleString()}₫` : 'Chưa có'}</p></div>
                    <div><p className="text-sm text-[var(--muted-foreground)] mb-2">Trạng thái</p>{getStatusBadge(selectedAuthor.status)}</div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog Từ chối Sponsored (Luồng 1 - Mock) */}
          <Dialog open={showSponsorRejectDialog} onOpenChange={setShowSponsorRejectDialog}>
            <DialogContent className="bg-[var(--card)] border border-[var(--border)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--primary)]">Từ chối yêu cầu Sponsored</DialogTitle>
                <DialogDescription>
                  Vui lòng ghi rõ lý do từ chối
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Nhập lý do từ chối..."
                value={sponsorRejectReason}
                onChange={(e) => setSponsorRejectReason(e.target.value)}
                className="min-h-[100px] bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSponsorRejectDialog(false)}>Hủy</Button>
                <Button
                  onClick={handleRejectSponsorRequest}
                  disabled={!sponsorRejectReason}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Xác nhận từ chối
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Từ chối Author (Luồng 2 - API Thật) */}
          <Dialog open={showAuthorRejectDialog} onOpenChange={setShowAuthorRejectDialog}>
            <DialogContent className="bg-[var(--card)] border border-[var(--border)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--primary)]">Từ chối yêu cầu lên Author</DialogTitle>
                <DialogDescription>
                  Bạn có chắc chắn muốn từ chối yêu cầu của 
                  <strong className="text-[var(--foreground)]"> {selectedAuthorRequest?.userName}</strong>?
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Nhập lý do từ chối (bắt buộc)..."
                value={authorRejectReason}
                onChange={(e) => setAuthorRejectReason(e.target.value)}
                disabled={isSubmittingReject}
                className="min-h-[120px] bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
              />
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAuthorRejectDialog(false)}
                  disabled={isSubmittingReject}
                  className="border-[var(--border)] text-[var(--foreground)]"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleConfirmAuthorReject}
                  disabled={!authorRejectReason || isSubmittingReject}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmittingReject && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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