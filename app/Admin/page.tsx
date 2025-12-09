"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Loader2, 
} from "lucide-react";
import { toast } from "sonner";

// Imports API & Components
import { getAccounts, Account } from "@/services/adminApi";
import { CreateModModal } from "./components/create-mod-modal";
import { UserActionMenu } from "./components/user-action-menu"; // ✅ Đã dùng component mới

export default function AdminDashboard() {
  const [data, setData] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // State modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 20 };
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await getAccounts(params);
      setData(res.items);
      setTotal(res.total);
    } catch (error) {
      toast.error("Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, roleFilter, statusFilter]);

  // --- Helpers ---
  const getRoleBadge = (roles: string[]) => {
    return roles.map(role => {
      let color = "bg-gray-500";
      if (role === "admin") color = "bg-red-600";
      if (role === "cmod") color = "bg-orange-500";
      if (role === "omod") color = "bg-purple-500";
      if (role === "author") color = "bg-blue-500";
      if (role === "reader") color = "bg-green-500";
      
      return <Badge key={role} className={`${color} mr-1 capitalize hover:${color}`}>{role}</Badge>
    });
  };

  return (
    <div className="flex flex-col gap-6 mt-4">
      {/* 1. Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Tài khoản</h1>
          <p className="text-muted-foreground">Xem, lọc và quản lý toàn bộ người dùng trong hệ thống.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-primary text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Tạo Tài Khoản Mới
        </Button>
      </div>

      {/* 2. Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm user" className="pl-8" disabled />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo quyền" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả quyền</SelectItem>
              <SelectItem value="reader">Reader</SelectItem>
              <SelectItem value="author">Author</SelectItem>
              <SelectItem value="cmod">Content Mod</SelectItem>
              <SelectItem value="omod">Operation Mod</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="unbanned">Hoạt động</SelectItem>
              <SelectItem value="banned">Đã khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. Table Data */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Người dùng</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Gậy (Strike)</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Không tìm thấy tài khoản nào.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((acc) => (
                  <TableRow key={acc.accountId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={`https://ui-avatars.com/api/?name=${acc.username}`} />
                          <AvatarFallback>{acc.username.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{acc.username}</span>
                          <span className="text-xs text-muted-foreground">{acc.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(acc.roles)}</TableCell>
                    <TableCell>
                      <Badge variant={acc.status === "banned" ? "destructive" : "outline"} className={acc.status === "unbanned" ? "text-green-600 border-green-600 bg-green-50" : ""}>
                        {acc.status === "banned" ? "Đã khóa" : "Hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {acc.strike > 0 ? <span className="font-bold text-red-500">{acc.strike}</span> : "0"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(acc.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    
                    {/* ✅ Cột hành động sử dụng Component riêng */}
                    <TableCell className="text-right">
                      <UserActionMenu 
                        account={acc} 
                        onSuccess={fetchData} 
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 4. Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Trước
        </Button>
        <span className="text-sm">Trang {page}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={data.length < 20}>
          Sau
        </Button>
      </div>

      {/* Create Modal */}
      <CreateModModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}