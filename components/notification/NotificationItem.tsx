//components/notifiction/NotificationItem.tsx
"use client";

import React from "react";
import {
  BookOpen,
  Bell,
  UserPlus,
  MessageSquare,
  Star,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationItem as INotificationItem } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";

const getIcon = (type: string) => {
  switch (type) {
    case "new_chapter":
      return <BookOpen className="h-4 w-4 text-blue-500" />;
    case "subscription_reminder":
      return <Bell className="h-4 w-4 text-yellow-500" />;
    case "new_follower":
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case "chapter_comment":
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case "story_rating":
      return <Star className="h-4 w-4 text-orange-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
};

interface Props {
  item: INotificationItem;
  onClick?: (item: INotificationItem) => void;
}

export const NotificationItem = ({ item, onClick }: Props) => {
  return (
    <div
      onClick={() => onClick?.(item)}
      className={cn(
        "flex gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-0",
        !item.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
      )}
    >
      <div className="mt-1 shrink-0">{getIcon(item.type)}</div>
      <div className="flex flex-col gap-1 overflow-hidden">
        <span
          className={cn(
            "font-medium text-sm",
            !item.isRead && "text-primary font-bold"
          )}
        >
          {item.title}
        </span>
        <span className="text-muted-foreground text-xs line-clamp-2">
          {item.message}
        </span>
        <span className="text-[10px] text-muted-foreground/70">
          {format(new Date(item.createdAt), "HH:mm - dd/MM/yyyy")}
        </span>
      </div>
    </div>
  );
};
