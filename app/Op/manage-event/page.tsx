"use client";
import Image from "next/image";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Edit, Trash2, Gift } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/op-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface Event {
  id: number;
  title: string;
  description: string;
  type: "contest" | "promotion" | "discount";
  startDate: string;
  endDate: string;
  status: "upcoming" | "ongoing" | "ended";
  imageUrl: string;
}

const mockEvents: Event[] = [
  {
    id: 1,
    title: "Cuộc thi viết truyện mùa thu",
    description:
      "Tham gia cuộc thi viết truyện với chủ đề mùa thu. Giải thưởng hấp dẫn lên đến 50 triệu đồng!",
    type: "contest",
    startDate: "2025-10-01",
    endDate: "2025-10-31",
    status: "ongoing",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoLtZgIgp563k5YvPFsGFx8mS6b55qzqv4Rw&s",
  },
  {
    id: 2,
    title: "Giảm giá 30% xu nạp",
    description: "Ưu đãi đặc biệt: Giảm 30% khi nạp xu. Thời gian có hạn!",
    type: "discount",
    startDate: "2025-10-15",
    endDate: "2025-10-20",
    status: "ongoing",
    imageUrl:
      "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1200&q=80&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Khuyến mãi Sponsored Author",
    description: "Miễn phí nâng cấp Sponsored Author cho 100 tác giả đầu tiên",
    type: "promotion",
    startDate: "2025-10-25",
    endDate: "2025-10-30",
    status: "upcoming",
    imageUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80&auto=format&fit=crop",
  },
];

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    type: "contest" as "contest" | "promotion" | "discount",
    startDate: "",
    endDate: "",
    imageUrl: "",
  });

  const handleCreateEvent = () => {
    if (
      newEvent.title &&
      newEvent.description &&
      newEvent.startDate &&
      newEvent.endDate
    ) {
      const event: Event = {
        id: events.length + 1,
        ...newEvent,
        status: "upcoming",
      };
      setEvents([...events, event]);
      setShowCreateDialog(false);
      setNewEvent({
        title: "",
        description: "",
        type: "contest",
        startDate: "",
        endDate: "",
        imageUrl: "",
      });
      toast.success("Đã tạo sự kiện mới thành công!");
    } else {
      toast.error("Vui lòng điền đủ thông tin của sự kiện.");
    }
  };

  const handleDeleteEvent = (id: number) => {
    setEvents(events.filter((e) => e.id !== id));
    toast.success("Đã xóa sự kiện");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            Sắp diễn ra
          </Badge>
        );
      case "ongoing":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            Đang diễn ra
          </Badge>
        );
      case "ended":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-500">
            Kết thúc
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "contest":
        return (
          <Badge className="bg-[var(--primary)] text-[var(--primary-foreground)]">
            Cuộc thi
          </Badge>
        );
      case "promotion":
        return (
          <Badge className="bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]">
            Khuyến mãi
          </Badge>
        );
      case "discount":
        return (
          <Badge className="bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]">
            Giảm giá
          </Badge>
        );
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
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--primary)]">
                Quản lý Sự kiện & Khuyến mãi
              </h1>
              <p className="text-[var(--muted-foreground)] mt-2">
                Tạo và quản lý các sự kiện, cuộc thi, khuyến mãi
              </p>
            </div>

            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo Event mới
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card
                key={event.id}
                className="border border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 overflow-hidden bg-[var(--muted)]">
                <Image
  src={event.imageUrl || "/fallback.png"}
  alt={event.title}
  fill
  className="object-cover"
  onError={(e) => {
    const img = e.target as HTMLImageElement
    img.src = "/fallback.png"
}}
/>

                  <div className="absolute top-3 right-3 flex gap-2">
                    {getTypeBadge(event.type)}
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-2 text-[var(--foreground)]">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="text-[var(--muted-foreground)] mt-1 line-clamp-2">
                        {event.description}
                      </CardDescription>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {event.startDate} - {event.endDate}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card
              className="border-2 border-dashed border-[var(--border)] bg-[var(--muted)] hover:border-[var(--primary)] flex items-center justify-center cursor-pointer transition-colors"
              onClick={() => setShowCreateDialog(true)}
            >
              <CardContent className="py-24 text-center">
                <Gift className="w-12 h-12 mx-auto mb-4 text-[var(--primary)]" />
                <p className="text-[var(--muted-foreground)]">
                  Tạo sự kiện mới
                </p>
              </CardContent>
            </Card>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-2xl bg-[var(--card)] border border-[var(--border)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--primary)]">
                  Tạo Event mới
                </DialogTitle>
                <DialogDescription className="text-[var(--muted-foreground)]">
                  Điền thông tin để tạo sự kiện, cuộc thi hoặc khuyến mãi mới
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tên sự kiện</Label>
                  <Input
                    id="title"
                    placeholder="Nhập tên sự kiện..."
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                    className="bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về sự kiện..."
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    className="bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Loại sự kiện</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(
                      value: "contest" | "promotion" | "discount"
                    ) => setNewEvent({ ...newEvent, type: value })}
                  >
                    <SelectTrigger className="bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]">
                      <SelectValue placeholder="Chọn loại sự kiện" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]">
                      <SelectItem value="contest">Cuộc thi</SelectItem>
                      <SelectItem value="promotion">Khuyến mãi</SelectItem>
                      <SelectItem value="discount">Giảm giá xu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Ngày bắt đầu</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startDate: e.target.value })
                      }
                      className="bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Ngày kết thúc</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newEvent.endDate}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endDate: e.target.value })
                      }
                      className="bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL ảnh banner</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={newEvent.imageUrl}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, imageUrl: e.target.value })
                    }
                    className="bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="border-[var(--border)] text-[var(--foreground)]"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateEvent}
                  className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                >
                  Tạo sự kiện
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
