"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Clock,
  Loader2,
  Gem,
  Shield,
  ArrowRight,
  Users,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Cần component Tooltip nếu muốn tooltip xịn, nếu ko dùng title native
import { toast } from "sonner";

import {
  getUpgradeRequests,
  approveRequest,
  rejectRequest,
  getRankRequests,
  approveRankRequest,
  rejectRankRequest,
  getAuthorsList,
} from "@/services/operationModService";

import OpLayout from "@/components/OpLayout";

// --- 1. CONFIG RANK STYLES ---
// Định nghĩa style hiển thị cho từng cấp bậc tác giả. 
// Giúp tách biệt logic hiển thị và logic xử lý dữ liệu
const RANK_STYLES: Record<
  string,
  {
    color: string;
    bg: string;
    shadow: string;
  }
> = {
  Casual: {
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50",
    shadow: "shadow-slate-200 dark:shadow-slate-800",
  },
  Bronze: {
    color: "text-amber-800 dark:text-amber-300",
    bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-amber-800/30",
    shadow: "shadow-amber-200 dark:shadow-amber-900",
  },
  Gold: {
    color: "text-yellow-800 dark:text-yellow-300",
    bg: "bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-900/30 dark:via-amber-900/30 dark:to-yellow-800/30",
    shadow: "shadow-yellow-200 dark:shadow-yellow-900",
  },
  Diamond: {
    color: "text-cyan-800 dark:text-cyan-300",
    bg: "bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-100 dark:from-cyan-900/30 dark:via-blue-900/30 dark:to-cyan-800/30",
    shadow: "shadow-cyan-200 dark:shadow-cyan-900",
  },
};

const DiamondIcon = () => (
  <div className="relative inline-flex items-center ml-1">
    <Gem className="h-3 w-3 text-blue-500 fill-blue-500 opacity-80" />
    <span className="absolute -bottom-2 -right-1 text-yellow-500 text-[10px] font-bold leading-none">
      *
    </span>
  </div>
);

const RankIcon = ({ rank, size = 4 }: { rank: string; size?: number }) => {
  const r = (rank || "").toLowerCase();
  const style = { width: `${size * 0.25}rem`, height: `${size * 0.25}rem` };

  if (r.includes("diamond") || r.includes("kim cương")) {
    return <Gem style={style} className="text-cyan-500 fill-cyan-100" />;
  }
  if (r.includes("gold") || r.includes("vàng")) {
    return <Shield style={style} className="text-yellow-500 fill-yellow-100" />;
  }
  if (r.includes("bronze") || r.includes("đồng")) {
    return <Shield style={style} className="text-orange-600 fill-orange-100" />;
  }
  return <Shield style={style} className="text-slate-400 fill-slate-100" />;
};

// --- Interfaces ---
interface Author {
  id: string;
  name: string;
  email: string;
  rank: string;
  stories: number;
  followers: number;
  revenue: number;
  withdrawn: number;
  restricted: boolean;
  verified: boolean;
}

interface SponsorRequest {
  requestId: string;
  authorId: string;
  authorUsername: string; // Tên username từ API
  authorEmail?: string;
  currentRankName: string;
  targetRankName: string;
  targetRankMinFollowers?: number; // Cần API trả về field này để so sánh
  totalFollowers: number;
  createdAt: string;
  commitment: string;
  status: string;
}

interface AuthorUpgradeRequest {
  requestId: string;
  requesterId: string;
  requesterUsername?: string;
  requesterEmail?: string;
  status: "pending" | "approved" | "rejected";
  content: string;
  createdAt: string;
}

export default function AuthorManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(true);

  const [sponsorRequests, setSponsorRequests] = useState<SponsorRequest[]>([]);
  const [isLoadingSponsor, setIsLoadingSponsor] = useState(true);
  const [sponsorRejectReason, setSponsorRejectReason] = useState("");
  const [selectedSponsorRejectId, setSelectedSponsorRejectId] = useState<
    string | null
  >(null);
  const [isSubmittingSponsor, setIsSubmittingSponsor] = useState(false);

  const [authorRequests, setAuthorRequests] = useState<AuthorUpgradeRequest[]>(
    []
  );
  const [isLoadingUpgrade, setIsLoadingUpgrade] = useState(true);
  const [authorRejectReason, setAuthorRejectReason] = useState("");
  const [selectedAuthorRejectId, setSelectedAuthorRejectId] = useState<
    string | null
  >(null);
  const [isSubmittingUpgrade, setIsSubmittingUpgrade] = useState(false);

  // ================= LOAD DATA =================
// Các hàm useEffect này đảm nhiệm việc đồng bộ dữ liệu từ server khi component mount.
  useEffect(() => {
    // Tải danh sách tác giả và chuyển đổi (map) sang định dạng hiển thị của table
    async function fetchAuthors() {
      try {
        setIsLoadingAuthors(true);
        const data = await getAuthorsList();

        const mappedAuthors: Author[] = data.map((item: any) => ({
          id: item.accountId,
          name: item.username || "Unknown",
          email: item.email || "No Email",
          rank: item.rankName || "Tân thủ",
          stories: item.totalStory || 0,
          followers: item.totalFollower || 0,
          revenue: item.revenueBalance || 0,
          withdrawn: item.revenueWithdrawn || 0,
          restricted: item.restricted || false,
          verified: item.verifiedStatus || false,
        }));

        setAuthors(mappedAuthors);
      } catch (error) {
        console.error("Lỗi tải danh sách tác giả:", error);
        toast.error("Không thể tải danh sách tác giả");
      } finally {
        setIsLoadingAuthors(false);
      }
    }
    fetchAuthors();
  }, []);

  const fetchSponsorRequests = async () => {
    try {
      setIsLoadingSponsor(true);
      const data = await getRankRequests("pending");
      // Map API response to Interface
      const mapped: SponsorRequest[] = data.map((item: any) => ({
        requestId: item.requestId,
        authorId: item.authorId,
        authorUsername: item.authorUsername, // Map trường này
        authorEmail: item.authorEmail,
        currentRankName: item.currentRankName,
        targetRankName: item.targetRankName,
        targetRankMinFollowers: item.targetRankMinFollowers, // Lấy field này
        totalFollowers: item.totalFollowers,
        createdAt: item.createdAt,
        commitment: item.commitment,
        status: item.status,
      }));
      setSponsorRequests(mapped);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingSponsor(false);
    }
  };

  useEffect(() => {
    fetchSponsorRequests();
  }, []);

  const fetchUpgradeRequests = async () => {
    try {
      setIsLoadingUpgrade(true);
      const data = await getUpgradeRequests("pending");
      setAuthorRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingUpgrade(false);
    }
  };

  useEffect(() => {
    fetchUpgradeRequests();
  }, []);
// --- 3. ACTION HANDLERS ---
// Xử lý các tương tác phê duyệt hoặc từ chối.
// Lưu ý: Các hàm này đều yêu cầu xác nhận từ phía Moderator trước khi gọi API.
  const handleApproveSponsor = async (requestId: string) => {
    if (!confirm("Bạn có chắc chắn muốn duyệt yêu cầu này?")) return;
    try {
      setIsSubmittingSponsor(true);
      await approveRankRequest(requestId);
      toast.success("Đã duyệt yêu cầu lên hạng!");
      fetchSponsorRequests();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi duyệt");
    } finally {
      setIsSubmittingSponsor(false);
    }
  };

  const handleRejectSponsor = async () => {
    if (!selectedSponsorRejectId || !sponsorRejectReason) return;
    try {
      setIsSubmittingSponsor(true);
      await rejectRankRequest(selectedSponsorRejectId, sponsorRejectReason);
      toast.success("Đã từ chối yêu cầu.");
      setSponsorRejectReason("");
      setSelectedSponsorRejectId(null);
      fetchSponsorRequests();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi từ chối");
    } finally {
      setIsSubmittingSponsor(false);
    }
  };

  const handleApproveUpgrade = async (requestId: string) => {
    if (!confirm("Xác nhận duyệt người dùng này thành Tác giả?")) return;
    try {
      setIsSubmittingUpgrade(true);
      await approveRequest(requestId);
      toast.success("Đã duyệt lên Tác giả thành công!");
      fetchUpgradeRequests();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi duyệt");
    } finally {
      setIsSubmittingUpgrade(false);
    }
  };

  const handleRejectUpgrade = async () => {
    if (!selectedAuthorRejectId || !authorRejectReason) return;
    try {
      setIsSubmittingUpgrade(true);
      await rejectRequest(selectedAuthorRejectId, authorRejectReason);
      toast.success("Đã từ chối yêu cầu.");
      setAuthorRejectReason("");
      setSelectedAuthorRejectId(null);
      fetchUpgradeRequests();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi từ chối");
    } finally {
      setIsSubmittingUpgrade(false);
    }
  };

  // ================= HELPERS: STYLING & MAPPING =================

  const mapRankToKey = (rank: string) => {
    if (!rank) return "Casual";
    const lower = rank.toLowerCase();
    if (lower.includes("kim cương") || lower.includes("diamond"))
      return "Diamond";
    if (lower.includes("vàng") || lower.includes("gold")) return "Gold";
    if (lower.includes("đồng") || lower.includes("bronze")) return "Bronze";
    return "Casual";
  };

  const getRankBadge = (rank: string) => {
    const key = mapRankToKey(rank);
    const style = RANK_STYLES[key] || RANK_STYLES.Casual;

    return (
      <Badge
        variant="outline"
        className={`${style.bg} ${style.color} ${style.shadow} border-0 font-medium px-3 py-1 flex w-fit items-center gap-1.5`}
      >
        <RankIcon rank={key} size={3.5} />
        {rank}
      </Badge>
    );
  };

  const filteredAuthors = authors.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              {sponsorRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-[var(--primary)] text-white rounded-full text-xs">
                  {sponsorRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="author-requests" className="relative">
              Yêu cầu lên Author
              {authorRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                  {authorRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DANH SÁCH AUTHORS (Đã bỏ Status & Action) */}
          <TabsContent value="authors">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <CardTitle>Danh sách Tác giả</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm tác giả..."
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
                      <TableHead>Tên hiển thị</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Hạng</TableHead>
                      <TableHead className="text-center">Số truyện</TableHead>
                      <TableHead className="text-center">Followers</TableHead>
                      <TableHead className="text-right">Số dư ví</TableHead>
                      <TableHead className="text-right">Đã đối soát</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAuthors ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="animate-spin mx-auto w-8 h-8 text-[var(--primary)]" />
                        </TableCell>
                      </TableRow>
                    ) : filteredAuthors.length > 0 ? (
                      filteredAuthors.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-1">
                              {a.name}
                              {a.verified && (
                                <CheckCircle className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {a.email}
                          </TableCell>
                          <TableCell>{getRankBadge(a.rank)}</TableCell>
                          <TableCell className="text-center">
                            {a.stories}
                          </TableCell>
                          <TableCell className="text-center">
                            {a.followers.toLocaleString()}
                          </TableCell>

                          <TableCell className="text-right font-semibold text-blue-600">
                            {a.revenue.toLocaleString()}
                            <DiamondIcon />
                          </TableCell>

                          <TableCell className="text-right text-gray-500">
                            {a.withdrawn.toLocaleString()}
                            <DiamondIcon />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Không tìm thấy tác giả nào phù hợp.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: YÊU CẦU SPONSORED (Đã update thêm field) */}
          <TabsContent value="sponsor-requests">
            <Card>
              <CardHeader>
                <CardTitle>Yêu cầu xét duyệt nâng hạng</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên người dùng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Yêu cầu nâng hạng</TableHead>
                      <TableHead className="text-center">Followers</TableHead>
                      <TableHead>Nội dung đơn</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSponsor ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="animate-spin mx-auto w-8 h-8 text-[var(--primary)]" />
                        </TableCell>
                      </TableRow>
                    ) : sponsorRequests.length > 0 ? (
                      sponsorRequests.map((req) => (
                        <TableRow key={req.requestId}>
                          <TableCell>
                            <div className="font-medium text-[var(--foreground)]">
                              {req.authorUsername}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {req.authorEmail}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRankBadge(req.currentRankName)}
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              {getRankBadge(req.targetRankName)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`font-semibold cursor-help flex items-center justify-center gap-1 ${
                                      req.targetRankMinFollowers &&
                                      req.totalFollowers <
                                        req.targetRankMinFollowers
                                        ? "text-red-500"
                                        : "text-green-600"
                                    }`}
                                  >
                                    <Users className="w-3 h-3" />
                                    {req.totalFollowers.toLocaleString()}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Yêu cầu tối thiểu:{" "}
                                    {req.targetRankMinFollowers?.toLocaleString() ||
                                      "N/A"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="max-w-[300px] whitespace-pre-wrap text-sm">
                            {req.commitment}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(req.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() =>
                                  handleApproveSponsor(req.requestId)
                                }
                                disabled={isSubmittingSponsor}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() =>
                                  setSelectedSponsorRejectId(req.requestId)
                                }
                                disabled={isSubmittingSponsor}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Từ chối
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Không có yêu cầu nào đang chờ.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: YÊU CẦU AUTHOR */}
          <TabsContent value="author-requests">
            <Card>
              <CardHeader>
                <CardTitle>Đơn đăng ký trở thành Tác giả</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên người dùng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Nội dung đơn</TableHead>
                      <TableHead>Thời gian gửi</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUpgrade ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Loader2 className="animate-spin mx-auto w-8 h-8 text-[var(--primary)]" />
                        </TableCell>
                      </TableRow>
                    ) : authorRequests.length > 0 ? (
                      authorRequests.map((req) => (
                        <TableRow key={req.requestId}>
                          <TableCell className="font-medium">
                            {req.requesterUsername || req.requesterId}
                          </TableCell>
                          <TableCell>{req.requesterEmail || "N/A"}</TableCell>
                          <TableCell className="max-w-[300px] whitespace-pre-wrap text-sm">
                            {req.content}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(req.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() =>
                                  handleApproveUpgrade(req.requestId)
                                }
                                disabled={isSubmittingUpgrade}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() =>
                                  setSelectedAuthorRejectId(req.requestId)
                                }
                                disabled={isSubmittingUpgrade}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Từ chối
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Chưa có đơn đăng ký mới.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* --- DIALOGS --- */}

      {/* Dialog Từ chối Sponsor/Rank */}
      <Dialog
        open={!!selectedSponsorRejectId}
        onOpenChange={(open) => !open && setSelectedSponsorRejectId(null)}
      >
        <DialogContent className="bg-[var(--card)] border border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--primary)] text-lg">
              Từ chối yêu cầu lên hạng
            </DialogTitle>
            <DialogDescription>
              Bạn đang từ chối yêu cầu của tác giả
              <strong className="text-[var(--foreground)] ml-1">
                {
                  sponsorRequests.find(
                    (r) => r.requestId === selectedSponsorRejectId
                  )?.authorUsername
                }
              </strong>
              .
              <br />
              Vui lòng nhập lý do để tác giả được biết.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Nhập lý do từ chối (bắt buộc)..."
            value={sponsorRejectReason}
            onChange={(e) => setSponsorRejectReason(e.target.value)}
            disabled={isSubmittingSponsor}
            className="min-h-[120px] bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)] focus-visible:ring-[var(--primary)]"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSelectedSponsorRejectId(null)}
              disabled={isSubmittingSponsor}
              className="border-[var(--border)] text-[var(--foreground)]"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleRejectSponsor}
              disabled={!sponsorRejectReason || isSubmittingSponsor}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {isSubmittingSponsor && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Từ chối Author Upgrade */}
      <Dialog
        open={!!selectedAuthorRejectId}
        onOpenChange={(open) => !open && setSelectedAuthorRejectId(null)}
      >
        <DialogContent className="bg-[var(--card)] border border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--primary)] text-lg">
              Từ chối yêu cầu lên Author
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn từ chối yêu cầu của
              <strong className="text-[var(--foreground)] ml-1">
                {authorRequests.find(
                  (r) => r.requestId === selectedAuthorRejectId
                )?.requesterUsername ||
                  authorRequests.find(
                    (r) => r.requestId === selectedAuthorRejectId
                  )?.requesterId}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Nhập lý do từ chối (bắt buộc)..."
            value={authorRejectReason}
            onChange={(e) => setAuthorRejectReason(e.target.value)}
            disabled={isSubmittingUpgrade}
            className="min-h-[120px] bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)] focus-visible:ring-[var(--primary)]"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSelectedAuthorRejectId(null)}
              disabled={isSubmittingUpgrade}
              className="border-[var(--border)] text-[var(--foreground)]"
            >
              Hủy
            </Button>
            <Button
              onClick={handleRejectUpgrade}
              disabled={!authorRejectReason || isSubmittingUpgrade}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {isSubmittingUpgrade && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OpLayout>
  );
}
