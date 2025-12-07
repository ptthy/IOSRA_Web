"use client";

import { useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal, ShieldBan, UserCheck, Loader2, Copy, UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { updateAccountStatus, Account } from "@/services/adminApi";

interface Props {
  account: Account;
  onSuccess: () => void;
}

export function UserActionMenu({ account, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const handleToggleBan = async () => {
    const newStatus = account.status === "banned" ? "unbanned" : "banned";
    const actionText = newStatus === "banned" ? "Khóa" : "Mở khóa";

    if (!confirm(`Bạn có chắc muốn ${actionText} tài khoản ${account.username}?`)) return;

    setLoading(true);
    try {
      await updateAccountStatus(account.accountId, newStatus);
      toast.success(`Đã ${actionText} tài khoản thành công`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Thất bại");
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(account.accountId);
    toast.success("Đã sao chép ID");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Hành động</DropdownMenuLabel>

        <DropdownMenuItem onClick={copyId}>
          <Copy className="mr-2 h-4 w-4" />
          Sao chép ID
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => toast.info("Đang phát triển")}>
          <UserCog className="mr-2 h-4 w-4" />
          Xem chi tiết
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {account.status === "unbanned" ? (
          <DropdownMenuItem
            onClick={handleToggleBan}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <ShieldBan className="mr-2 h-4 w-4" />
            Khóa tài khoản
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={handleToggleBan}
            className="text-green-600 focus:text-green-600 focus:bg-green-50"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Mở khóa
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
