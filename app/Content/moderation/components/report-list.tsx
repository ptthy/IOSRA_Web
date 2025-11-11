
"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  X,
  Check,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";
import moment from "moment";
import "moment/locale/vi";

// Import các hàm API
import {
  getModerationComments,
  approveComment,
  removeComment,
} from "@/services/moderationApi";

// Interface dựa trên API bạn gửi
interface CommentItem {
  commentId: string;
  storyId: string;
  storyTitle: string;
  chapterId: string;
  chapterNo: number;
  chapterTitle: string;
  readerId: string;
  username: string;
  avatarUrl: string | null;
  content: string;
  status: "pending" | "approved" | "removed";
  isLocked: boolean;
  createdAt: string;
}

interface ApiResponse {
  items: CommentItem[];
  total: number;
  page: number;
  pageSize: number;
}

type CommentStatus = "pending" | "approved" | "removed";

export function ReportsList() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CommentStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Load dữ liệu khi 'activeTab' thay đổi
  useEffect(() => {
    const loadComments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response: ApiResponse = await getModerationComments(activeTab, 1, 20);
        setComments(response.items);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadComments();
  }, [activeTab]);

  // Lọc bình luận theo từ khóa tìm kiếm
  const filteredComments = comments.filter(comment =>
    comment.storyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Xử lý hành động (Duyệt / Gỡ)
  const handleAction = async (commentId: string, action: "approve" | "remove") => {
    const originalComments = comments;
    setComments(prev => prev.filter(c => c.commentId !== commentId));

    try {
      if (action === "approve") {
        await approveComment(commentId);
        toast.success("Đã duyệt bình luận.");
      } else if (action === "remove") {
        await removeComment(commentId);
        toast.success("Đã gỡ bình luận.");
      }
    } catch (err: any) {
      toast.error(err.message);
      setComments(originalComments); // Hoàn tác nếu lỗi
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F0EAD6' }}>
      {/* Header */}
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Báo Cáo Vi Phạm
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-700"
        >
          Xử lý các báo cáo vi phạm từ người dùng
        </motion.p>
      </div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          placeholder="Tìm kiếm theo tên truyện hoặc người dùng..."
          className="pl-12 h-12 bg-white border-amber-200 text-gray-900 focus:border-amber-300 focus:ring-amber-300"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ backgroundColor: 'white' }}
        />
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs 
          defaultValue="pending" 
          onValueChange={(value) => setActiveTab(value as CommentStatus)}
          className="space-y-6"
        >
          <TabsList className="bg-white border border-amber-200 p-1 rounded-lg shadow-sm">
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800 data-[state=active]:border data-[state=active]:border-amber-300 rounded-md transition-colors"
            >
              Mới (Chờ duyệt)
            </TabsTrigger>
            <TabsTrigger 
              value="approved"
              className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:border data-[state=active]:border-green-300 rounded-md transition-colors"
            >
              Đã duyệt
            </TabsTrigger>
            <TabsTrigger 
              value="removed"
              className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800 data-[state=active]:border data-[state=active]:border-red-300 rounded-md transition-colors"
            >
              Đã gỡ
            </TabsTrigger>
          </TabsList>
          
          {/* Content cho các tab */}
          <TabsContent value="pending" className="m-0">
            <CommentTable
              comments={filteredComments}
              isLoading={isLoading}
              error={error}
              onAction={handleAction}
              showActions={true}
            />
          </TabsContent>
          <TabsContent value="approved" className="m-0">
            <CommentTable
              comments={filteredComments}
              isLoading={isLoading}
              error={error}
              onAction={handleAction}
              showActions={false}
            />
          </TabsContent>
          <TabsContent value="removed" className="m-0">
            <CommentTable
              comments={filteredComments}
              isLoading={isLoading}
              error={error}
              onAction={handleAction}
              showActions={false}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

// Component Bảng - Cập nhật với palette #F0EAD6
function CommentTable({
  comments,
  isLoading,
  error,
  onAction,
  showActions = true,
}: {
  comments: CommentItem[];
  isLoading: boolean;
  error: string | null;
  onAction: (commentId: string, action: "approve" | "remove") => void;
  showActions?: boolean;
}) {

  const getStatusBadge = (status: CommentStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge 
            variant="outline" 
            className="bg-amber-50 text-amber-700 border-amber-200 font-medium"
          >
            Chờ duyệt
          </Badge>
        );
      case "approved":
        return (
          <Badge 
            variant="outline" 
            className="bg-green-50 text-green-700 border-green-200 font-medium"
          >
            Đã duyệt
          </Badge>
        );
      case "removed":
        return (
          <Badge 
            variant="outline" 
            className="bg-red-50 text-red-700 border-red-200 font-medium"
          >
            Đã gỡ
          </Badge>
        );
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-amber-200">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-700 bg-red-50 rounded-xl border border-red-200">
        <AlertCircle className="w-8 h-8 mr-2" /> Lỗi: {error}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600 bg-white rounded-xl border border-amber-200">
        Không có bình luận nào trong mục này.
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border border-amber-200 bg-white rounded-xl shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-amber-50/70 border-b border-amber-200 hover:bg-amber-50">
            <TableHead className="py-4 px-6 text-xs font-medium text-amber-800 uppercase tracking-wider">Người dùng</TableHead>
            <TableHead className="py-4 px-6 text-xs font-medium text-amber-800 uppercase tracking-wider">Nội dung bình luận</TableHead>
            <TableHead className="py-4 px-6 text-xs font-medium text-amber-800 uppercase tracking-wider">Vị trí</TableHead>
            <TableHead className="py-4 px-6 text-xs font-medium text-amber-800 uppercase tracking-wider">Thời gian</TableHead>
            <TableHead className="py-4 px-6 text-xs font-medium text-amber-800 uppercase tracking-wider text-right">Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.map((comment) => (
            <TableRow 
              key={comment.commentId} 
              className="border-b border-amber-100 hover:bg-amber-50/30 transition-colors"
            >
              
              {/* CỘT: NGƯỜI DÙNG */}
              <TableCell className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 border border-amber-200 shadow-sm">
                    <AvatarImage src={comment.avatarUrl || undefined} />
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-medium">
                      {comment.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-medium text-gray-900 text-sm block">{comment.username}</span>
                    <span className="text-amber-600 text-xs">@{comment.readerId}</span>
                  </div>
                </div>
              </TableCell>
              
              {/* CỘT: NỘI DUNG BÌNH LUẬN */}
              <TableCell className="py-4 px-6 max-w-md">
                <p className="text-gray-900 text-sm leading-relaxed">{comment.content}</p>
              </TableCell>

              {/* CỘT: VỊ TRÍ */}
              <TableCell className="py-4 px-6">
                <div className="text-sm">
                  <p className="text-gray-900 font-medium">{comment.storyTitle}</p>
                  <p className="text-amber-700 text-xs mt-1">Chương {comment.chapterNo}: {comment.chapterTitle}</p>
                </div>
              </TableCell>

              {/* CỘT: THỜI GIAN */}
              <TableCell className="py-4 px-6">
                <div className="text-sm text-amber-700 font-medium">
                  {moment(comment.createdAt).fromNow()}
                </div>
              </TableCell>

              {/* CỘT: TRẠNG THÁI & HÀNH ĐỘNG */}
              <TableCell className="py-4 px-6 text-right">
                <div className="flex items-center justify-end gap-3">
                  {/* Hiển thị badge trạng thái */}
                  {getStatusBadge(comment.status)}
                  
                  {/* Chỉ hiển thị nút hành động nếu là tab "pending" và showActions = true */}
                  {showActions && comment.status === "pending" && (
                    <div className="flex gap-2 ml-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0 border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 shadow-sm"
                        onClick={() => onAction(comment.commentId, 'approve')}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0 border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 shadow-sm"
                        onClick={() => onAction(comment.commentId, 'remove')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}