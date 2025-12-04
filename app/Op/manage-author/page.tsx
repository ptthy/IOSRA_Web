"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  CheckCircle,
  XCircle,
  Crown,
  Check,
  X,
  Clock,
  Loader2,
  Users, // Icon cho Follows
  Trophy, // Icon cho Rank
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/apiClient"; 

// API Service
import {
  getUpgradeRequests,
  approveRequest,
  rejectRequest,
  getRankRequests,
  approveRankRequest,
  rejectRankRequest
} from "@/services/operationModService";

import OpLayout from "@/components/OpLayout"; 

// --- Interface cho Author (Tab 1) ---
interface Author {
  id: number | string;
  name: string;
  email: string;
  stories: number;    // Lấy từ PublicProfile
  followers: number;  // ✅ Đổi từ Views sang Followers
  status: "active" | "suspended" | "sponsored";
  revenue: number;
}

// --- Interface cho Rank Request (Tab 2) ---
interface SponsorRequest {
  requestId: string;
  authorId: string;
  authorName: string;
  email: string;
  currentRank: string; 
  followers: number;   
  createdAt: string;
  reason: string;
  status: string;
}

// --- Interface cho Author Upgrade Request (Tab 3) ---
interface AuthorUpgradeRequest {
  requestId: string;
  requesterId: string;
  status: "pending" | "approved" | "rejected";
  content: string;
  createdAt: string;
  assignedOmodId: number | null;
  requesterUsername?: string;
  requesterEmail?: string;
}

export default function AuthorManagement() {
  // --- State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(true);

  // State cho Tab 2 (Rank/Sponsored)
  const [sponsorRequests, setSponsorRequests] = useState<SponsorRequest[]>([]);
  const [isLoadingSponsorRequests, setIsLoadingSponsorRequests] = useState(true);

  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  
  // State xử lý Modal Sponsored (Tab 2)
  const [selectedSponsorRequest, setSelectedSponsorRequest] = useState<SponsorRequest | null>(null);
  const [sponsorRejectReason, setSponsorRejectReason] = useState("");
  const [showSponsorRejectDialog, setShowSponsorRejectDialog] = useState(false);

  // State cho Tab 3 (User -> Author)
  const [authorUpgradeRequests, setAuthorUpgradeRequests] = useState<AuthorUpgradeRequest[]>([]);
  const [isLoadingAuthorRequests, setIsLoadingAuthorRequests] = useState(true);
  const [selectedAuthorRequest, setSelectedAuthorRequest] = useState<AuthorUpgradeRequest | null>(null);
  const [authorRejectReason, setAuthorRejectReason] = useState("");
  const [showAuthorRejectDialog, setShowAuthorRejectDialog] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // --- 1. Load danh sách Authors (Tab 1) ---
  useEffect(() => {
    async function fetchApprovedAuthors() {
      try {
        setIsLoadingAuthors(true);
        // 1. Lấy danh sách request đã approve
        const data: AuthorUpgradeRequest[] = await getUpgradeRequests("approved");
        
        // 2. Deduplicate (Lọc trùng lặp user)
        const uniqueAuthorsMap = new Map();
        data.forEach((req) => {
          if (!uniqueAuthorsMap.has(req.requesterId)) {
            uniqueAuthorsMap.set(req.requesterId, {
              id: req.requesterId,
              name: req.requesterUsername || `User ID: ${req.requesterId}`,
              email: req.requesterEmail || "(Chưa có email)",
              status: "active",
              revenue: 0,
              // Giá trị tạm thời
              stories: 0,
              followers: 0
            });
          }
        });

        const initialAuthors = Array.from(uniqueAuthorsMap.values());

        // 3. ✅ Gọi API PublicProfile để lấy số liệu thực tế (Stories, Followers)
        const authorsWithStats = await Promise.all(
            initialAuthors.map(async (author: any) => {
                try {
                    // Gọi API PublicProfile cho từng tác giả
                    const res = await apiClient.get(`/api/PublicProfile/${author.id}`);
                    const profile = res.data;
                    
                    return {
                        ...author,
                        // Cập nhật số liệu từ profile
                        stories: profile.author?.publishedStoryCount || 0,
                        followers: profile.author?.followerCount || 0,
                        // Có thể cập nhật thêm avatar nếu cần
                    };
                } catch (err) {
                    console.error(`Lỗi tải profile cho ${author.name}`, err);
                    return author; // Trả về data cũ nếu lỗi
                }
            })
        );

        setAuthors(authorsWithStats);
      } catch (error) {
        console.error("Failed to fetch authors:", error);
      } finally {
        setIsLoadingAuthors(false);
      }
    }
    fetchApprovedAuthors();
  }, []);

  // --- 2. Load Sponsored/Rank Requests (Tab 2) ---
  useEffect(() => {
    async function fetchRankRequests() {
      try {
        const data = await getRankRequests("pending");
        
        const mappedData: SponsorRequest[] = data.map((item: any) => ({
          requestId: item.requestId,
          authorId: item.authorId,
          authorName: item.authorUsername || item.requesterUsername || "Unknown",
          email: item.authorEmail || item.requesterEmail || "No Email",
          currentRank: item.currentRankName || "Casual",
          followers: item.totalFollowers || 0,
          createdAt: item.createdAt,
          reason: item.commitment || item.reason || "Không có nội dung cam kết",
          status: item.status
        }));

        setSponsorRequests(mappedData);
      } catch (error) {
        console.error("Failed to fetch rank requests:", error);
      } finally {
        setIsLoadingSponsorRequests(false);
      }
    }

    setIsLoadingSponsorRequests(true);
    fetchRankRequests();
    const interval = setInterval(fetchRankRequests, 30000); 
    return () => clearInterval(interval);
  }, []);

  // --- 3. Load Author Upgrade Requests (Tab 3) ---
  useEffect(() => {
    async function fetchAuthorUpgradeRequests() {
      try {
        const data: AuthorUpgradeRequest[] = await getUpgradeRequests("pending");
        setAuthorUpgradeRequests(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingAuthorRequests(false);
      }
    }

    setIsLoadingAuthorRequests(true);
    fetchAuthorUpgradeRequests();
    const interval = setInterval(fetchAuthorUpgradeRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- Helper: Badges ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sponsored": return <Badge className="bg-[var(--primary)] text-white"><Crown className="w-3 h-3 mr-1" /> Sponsored</Badge>;
      case "active": return <Badge variant="outline" className="border-green-500 text-green-500">Active</Badge>;
      case "suspended": return <Badge variant="outline" className="border-red-500 text-red-500">Suspended</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAuthorUpgradeStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="border-blue-500 text-blue-500"><Clock className="w-3 h-3 mr-1" /> Đang chờ</Badge>;
      case "approved": return <Badge variant="outline" className="border-green-500 text-green-500"><Check className="w-3 h-3 mr-1" /> Đã duyệt</Badge>;
      case "rejected": return <Badge variant="destructive" className="bg-red-100 text-red-600"><X className="w-3 h-3 mr-1" /> Bị từ chối</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // --- Logic: User -> Author (Tab 3) ---
  const handleApproveAuthorRequest = async (request: AuthorUpgradeRequest) => {
    const name = request.requesterUsername || `User ID: ${request.requesterId}`;
    toast.promise(
      async () => {
        await approveRequest(request.requestId);
        setAuthorUpgradeRequests((prev) => prev.filter((r) => r.requestId !== request.requestId));
        
        // Thêm vào danh sách Author (Tab 1)
        setAuthors((prev) => {
            if (prev.some(a => a.id === request.requesterId)) return prev;
            // Lúc mới thêm chưa có số liệu, có thể load lại sau
            const newAuthor: Author = {
                id: request.requesterId,
                name: name,
                email: request.requesterEmail || "(Chưa có email)",
                stories: 0, followers: 0, status: "active", revenue: 0,
            };
            return [newAuthor, ...prev];
        });
      },
      { loading: `Đang duyệt ${name}...`, success: `Đã duyệt ${name}!`, error: "Lỗi khi duyệt." }
    );
  };

  const handleConfirmAuthorReject = async () => {
    if (!selectedAuthorRequest || !authorRejectReason) {
      toast.error("Vui lòng nhập lý do."); return;
    }
    const name = selectedAuthorRequest.requesterUsername || `User ID: ${selectedAuthorRequest.requesterId}`;
    setIsSubmittingReject(true);
    toast.promise(
      async () => {
        await rejectRequest(selectedAuthorRequest.requestId, authorRejectReason);
        setAuthorUpgradeRequests((prev) => prev.filter((r) => r.requestId !== selectedAuthorRequest.requestId));
      },
      { loading: `Đang từ chối ${name}...`, success: `Đã từ chối ${name}.`, error: "Lỗi khi từ chối.", finally: () => { setShowAuthorRejectDialog(false); setIsSubmittingReject(false); } }
    );
  };
  
  // --- Logic: Author -> Sponsored/Rank (Tab 2) ---
  const handleApproveSponsorRequest = async (request: SponsorRequest) => {
    toast.promise(
      async () => {
        await approveRankRequest(request.requestId);
        setSponsorRequests((prev) => prev.filter((r) => r.requestId !== request.requestId));
      },
      {
        loading: `Đang duyệt yêu cầu của ${request.authorName}...`,
        success: `Đã duyệt yêu cầu nâng hạng cho ${request.authorName}!`,
        error: "Duyệt thất bại.",
      }
    );
  };

  const handleRejectSponsorRequest = async () => {
    if (selectedSponsorRequest && sponsorRejectReason) {
      toast.promise(
        async () => {
          await rejectRankRequest(selectedSponsorRequest.requestId, sponsorRejectReason);
          setSponsorRequests((prev) => prev.filter((r) => r.requestId !== selectedSponsorRequest.requestId));
        },
        {
          loading: `Đang từ chối yêu cầu của ${selectedSponsorRequest.authorName}...`,
          success: `Đã từ chối yêu cầu.`,
          error: "Từ chối thất bại.",
          finally: () => {
            setShowSponsorRejectDialog(false);
            setSponsorRejectReason("");
          }
        }
      );
    }
  };

  // --- Filter Tab 1 ---
  const filteredAuthors = authors.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // --- Hàm Render Tab 3 (User -> Author) ---
  function renderAuthorUpgradeTable(requests: AuthorUpgradeRequest[], loading: boolean) {
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
                <TableHead>Tên User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></TableCell>
                </TableRow>
              ) : requests.length > 0 ? (
                requests.map((req) => (
                  <TableRow key={req.requestId}>
                    <TableCell className="font-medium">{req.requesterUsername || `ID: ${req.requesterId}`}</TableCell>
                    <TableCell className="text-muted-foreground">{req.requesterEmail || `(Chưa có)`}</TableCell>
                    <TableCell>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>{getAuthorUpgradeStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => handleApproveAuthorRequest(req)} className="bg-green-600 hover:bg-green-700 text-white"><Check className="w-4 h-4 mr-1" /> Duyệt</Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedAuthorRequest(req); setAuthorRejectReason(""); setShowAuthorRejectDialog(true); }} className="border-red-500 text-red-500 hover:bg-red-50"><X className="w-4 h-4 mr-1" /> Từ chối</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Không có yêu cầu nào</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // --- UI ---
  return (
    <OpLayout>
      <main className="p-6 space-y-6">
        <h1 className="text-3xl font-bold text-[var(--primary)]">
          Quản lý Author & Yêu cầu
        </h1>

        <Tabs defaultValue="authors" className="space-y-6">
          <TabsList className="bg-[var(--muted)]">
            <TabsTrigger value="authors">Danh sách Authors</TabsTrigger>
            <TabsTrigger value="sponsor-requests" className="relative">
              Yêu cầu Sponsored
              {sponsorRequests.length > 0 && <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">{sponsorRequests.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="author-requests" className="relative">
              Yêu cầu lên Author
              {authorUpgradeRequests.length > 0 && <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">{authorUpgradeRequests.length}</span>}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Danh sách Authors */}
          <TabsContent value="authors">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Danh sách Authors</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Số truyện</TableHead>
                      <TableHead>Followers</TableHead> {/* ✅ Đổi header */}
                      <TableHead>Doanh thu</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAuthors ? (
                      <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : filteredAuthors.length > 0 ? (
                      filteredAuthors.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.name}</TableCell>
                          <TableCell>{a.email}</TableCell>
                          <TableCell>{a.stories}</TableCell>
                          <TableCell>{a.followers.toLocaleString()}</TableCell> {/* ✅ Hiển thị Followers */}
                          <TableCell>{a.revenue > 0 ? `${a.revenue.toLocaleString()}₫` : "-"}</TableCell>
                          <TableCell>{getStatusBadge(a.status)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={6} className="text-center">Không có Author nào.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Yêu cầu Sponsored/Rank */}
          <TabsContent value="sponsor-requests" className="space-y-4">
              <div className="grid gap-4">
                {isLoadingSponsorRequests ? (
                   <Card className="border border-dashed"><CardContent className="py-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 mx-auto animate-spin" /> Đang tải...</CardContent></Card>
                ) : sponsorRequests.length > 0 ? (
                  sponsorRequests.map((request) => (
                  <Card key={request.requestId} className="border border-[var(--border)] bg-[var(--card)] shadow-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-[var(--primary)]">{request.authorName}</CardTitle>
                          <CardDescription>{request.email}</CardDescription>
                        </div>
                        <Badge variant="outline">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Rank & Followers */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-yellow-500" /> 
                            Hạng hiện tại
                          </p>
                          <p className="font-medium">{request.currentRank}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-1">
                            <Users className="w-4 h-4 text-blue-500" /> 
                            Total Follows
                          </p>
                          <p className="font-medium">{request.followers.toLocaleString()}</p>
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
                            setSponsorRejectReason(""); 
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
                ))
                ) : (
                  <Card className="border border-dashed"><CardContent className="py-12 text-center text-muted-foreground">Không có yêu cầu Sponsored nào.</CardContent></Card>
                )}
              </div>
            </TabsContent>

          {/* Tab 3: Yêu cầu lên Author */}
          <TabsContent value="author-requests" className="space-y-4">
            {renderAuthorUpgradeTable(authorUpgradeRequests, isLoadingAuthorRequests)}
          </TabsContent>

        </Tabs>
      </main>
      
      {/* --- Dialogs --- */}

      {/* Dialog Chi tiết Author */}
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
                <div><p className="text-sm text-[var(--muted-foreground)]">Followers</p><p>{selectedAuthor.followers.toLocaleString()}</p></div>
                <div><p className="text-sm text-[var(--muted-foreground)]">Doanh thu</p><p>{selectedAuthor.revenue > 0 ? `${selectedAuthor.revenue.toLocaleString()}₫` : 'Chưa có'}</p></div>
                <div><p className="text-sm text-[var(--muted-foreground)] mb-2">Trạng thái</p>{getStatusBadge(selectedAuthor.status)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Từ chối Sponsored/Rank (Tab 2) */}
      <Dialog open={showSponsorRejectDialog} onOpenChange={setShowSponsorRejectDialog}>
        <DialogContent className="bg-[var(--card)] border border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--primary)]">Từ chối yêu cầu Nâng hạng</DialogTitle>
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

      {/* Dialog Từ chối Author Upgrade (Tab 3) */}
      <Dialog open={showAuthorRejectDialog} onOpenChange={setShowAuthorRejectDialog}>
        <DialogContent className="bg-[var(--card)] border border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--primary)]">Từ chối yêu cầu lên Author</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn từ chối yêu cầu của 
              <strong className="text-[var(--foreground)]"> {selectedAuthorRequest?.requesterUsername || selectedAuthorRequest?.requesterId}</strong>?
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

    </OpLayout>
  );
}