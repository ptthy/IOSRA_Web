"use client";


import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/op-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
  Eye,
  CheckCircle,
  XCircle,
  Crown,
  Check,
  X,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// API Service (Luồng 2: User → Author)
import {
  getUpgradeRequests,
  approveRequest,
  rejectRequest,
} from "@/services/operationModService";
import OpLayout from "@/components/OpLayout";

// --- Interface cho Author ---
interface Author {
  id: number | string;
  name: string;
  email: string;
  stories: number;
  views: number;
  status: "active" | "suspended" | "sponsored";
  revenue: number;
}

// --- Interface cho Sponsored Request ---
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

const mockSponsorRequests: SponsorRequest[] = [
  {
    id: 201,
    authorId: 1,
    authorName: "Nguyễn Văn A (Mock)",
    email: "vana@example.com",
    stories: 15,
    views: 125000,
    requestDate: "2025-10-28",
    reason: "Tôi muốn trở thành author sponsored (đây là mock data).",
  },
  {
    id: 202,
    authorId: 3,
    authorName: "Lê Hoàng C (Mock)",
    email: "hoangc@example.com",
    stories: 22,
    views: 230000,
    requestDate: "2025-10-27",
    reason: "Đã đủ điều kiện (đây là mock data).",
  },
];

// --- Interface cho Author Upgrade Request ---
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

  const [sponsorRequests, setSponsorRequests] =
    useState<SponsorRequest[]>(mockSponsorRequests);
  const [isLoadingSponsorRequests, setIsLoadingSponsorRequests] =
    useState(false);

  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [selectedSponsorRequest, setSelectedSponsorRequest] =
    useState<SponsorRequest | null>(null);
  const [sponsorRejectReason, setSponsorRejectReason] = useState("");
  const [showSponsorRejectDialog, setShowSponsorRejectDialog] =
    useState(false);

  const [authorUpgradeRequests, setAuthorUpgradeRequests] = useState<
    AuthorUpgradeRequest[]
  >([]);
  const [isLoadingAuthorRequests, setIsLoadingAuthorRequests] =
    useState(true);
  const [selectedAuthorRequest, setSelectedAuthorRequest] =
    useState<AuthorUpgradeRequest | null>(null);
  const [authorRejectReason, setAuthorRejectReason] = useState("");
  const [showAuthorRejectDialog, setShowAuthorRejectDialog] =
    useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // --- Load danh sách Authors ---
  useEffect(() => {
    async function fetchApprovedAuthors() {
      try {
        setIsLoadingAuthors(true);
        const data: AuthorUpgradeRequest[] = await getUpgradeRequests("APPROVED");
        const approvedAuthors: Author[] = data.map((req) => ({
          id: req.requesterId,
          name: req.requesterUsername || `User ID: ${req.requesterId}`,
          email: req.requesterEmail || "(Chưa có email)",
          stories: 0,
          views: 0,
          status: "active",
          revenue: 0,
        }));
        setAuthors(approvedAuthors);
      } catch (error) {
        toast.error("Không thể tải danh sách Authors đã duyệt.");
      } finally {
        setIsLoadingAuthors(false);
      }
    }
    fetchApprovedAuthors();
  }, []);

  // --- Polling yêu cầu lên Author ---
  useEffect(() => {
    async function fetchAuthorUpgradeRequests() {
      try {
        const data: AuthorUpgradeRequest[] = await getUpgradeRequests("PENDING");
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

  // --- Badge Status ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sponsored":
        return (
          <Badge className="bg-[var(--primary)] text-[var(--primary-foreground)]">
            <Crown className="w-3 h-3 mr-1" /> Sponsored
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            Active
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAuthorUpgradeStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            <Clock className="w-3 h-3 mr-1" /> Đang chờ
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <Check className="w-3 h-3 mr-1" /> Đã duyệt
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-600">
            <X className="w-3 h-3 mr-1" /> Bị từ chối
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // --- Approve / Reject Logic ---
  const handleApproveAuthorRequest = async (request: AuthorUpgradeRequest) => {
    const name = request.requesterUsername || `User ID: ${request.requesterId}`;
    toast.promise(
      async () => {
        await approveRequest(request.requestId);
        setAuthorUpgradeRequests((prev) =>
          prev.filter((r) => r.requestId !== request.requestId)
        );
        const newAuthor: Author = {
          id: request.requesterId,
          name: name,
          email: request.requesterEmail || "(Chưa có email)",
          stories: 0,
          views: 0,
          status: "active",
          revenue: 0,
        };
        setAuthors((prev) => [newAuthor, ...prev]);
      },
      {
        loading: `Đang duyệt cho ${name}...`,
        success: `Đã duyệt ${name} thành công!`,
        error: "Duyệt thất bại.",
      }
    );
  };

  const handleConfirmAuthorReject = async () => {
    if (!selectedAuthorRequest || !authorRejectReason) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    const name =
      selectedAuthorRequest.requesterUsername ||
      `User ID: ${selectedAuthorRequest.requesterId}`;
    setIsSubmittingReject(true);
    toast.promise(
      async () => {
        await rejectRequest(selectedAuthorRequest.requestId, authorRejectReason);
        setAuthorUpgradeRequests((prev) =>
          prev.filter((r) => r.requestId !== selectedAuthorRequest.requestId)
        );
      },
      {
        loading: `Đang từ chối ${name}...`,
        success: `Đã từ chối ${name}.`,
        error: "Từ chối thất bại.",
      }
    );
    setShowAuthorRejectDialog(false);
    setIsSubmittingReject(false);
  };

  // --- Filter ---
  const filteredAuthors = authors.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <TabsTrigger value="sponsor-requests">
              Yêu cầu Sponsored
            </TabsTrigger>
            <TabsTrigger value="author-requests">
              Yêu cầu lên Author
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
                    <Input
                      placeholder="Tìm kiếm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
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
                      <TableHead>Views</TableHead>
                      <TableHead>Doanh thu</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAuthors ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          <Loader2 className="animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredAuthors.length > 0 ? (
                      filteredAuthors.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.name}</TableCell>
                          <TableCell>{a.email}</TableCell>
                          <TableCell>{a.stories}</TableCell>
                          <TableCell>{a.views}</TableCell>
                          <TableCell>
                            {a.revenue > 0
                              ? `${a.revenue.toLocaleString()}₫`
                              : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(a.status)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Không có Author nào.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2 & Tab 3 giữ nguyên từ file bạn gửi */}
        </Tabs>
      </main>
    </OpLayout>
  );
}
