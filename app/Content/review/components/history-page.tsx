import { Search, Download, Filter, Clock, CheckCircle2, XCircle, AlertCircle, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function HistoryPage() {
  const stats = [
    { label: 'Tổng số', value: '8', color: 'text-[var(--foreground)]' },
    { label: 'Đã duyệt', value: '3', color: 'text-[var(--secondary)]' },
    { label: 'Từ chối', value: '1', color: 'text-[var(--destructive)]' },
    { label: 'Cờ đã gắn', value: '3', color: 'text-[var(--accent)]' },
    { label: 'Thời gian TB', value: '9 phút', color: 'text-[var(--foreground)]' },
  ];

  const historyData = [
    {
      id: 1,
      time: '2025-10-12 14:30',
      type: 'Truyện',
      typeColor: 'bg-[var(--primary)]/10 text-[var(--primary)]',
      title: 'Hành trình isekai',
      author: 'NguyenVanA',
      action: 'Đã duyệt',
      actionColor: 'bg-[var(--secondary)]/20 text-[var(--secondary)]',
      details: 'AI Voice: VI, EN',
      detailsBadges: ['VI', 'EN'],
      processingTime: '7 phút',
    },
    {
      id: 2,
      time: '2025-10-12 13:45',
      type: 'Chương',
      typeColor: 'bg-[var(--secondary)]/20 text-[var(--secondary)]',
      title: 'Chương 15 - Bí mật',
      author: 'TranThiB',
      action: 'Từ chối',
      actionColor: 'bg-[var(--destructive)]/10 text-[var(--destructive)]',
      details: 'Lý do: Nội dung vi phạm tiêu chuẩn',
      detailsText: 'Lý do: Nội dung vi phạm tiêu chuẩn',
      detailsBadge: 'Đã thông báo tác giả',
      processingTime: '12 phút',
    },
    {
      id: 3,
      time: '2025-10-12 11:20',
      type: 'Bình luận',
      typeColor: 'bg-[var(--primary)]/10 text-[var(--primary)]',
      title: 'Bình luận spam',
      author: 'Spammer001',
      action: 'Gỡ nội dung',
      actionColor: 'bg-[var(--accent)]/10 text-[var(--accent)]',
      details: '+1 cảnh báo',
      detailsText: '+1 cảnh báo',
      processingTime: '3 phút',
    },
    {
      id: 4,
      time: '2025-10-12 10:15',
      type: 'Truyện',
      typeColor: 'bg-[var(--primary)]/10 text-[var(--primary)]',
      title: 'Vô thuật đỉnh cao',
      author: 'LeVanC',
      action: 'Đã duyệt',
      actionColor: 'bg-[var(--secondary)]/20 text-[var(--secondary)]',
      details: 'AI Voice: VI, EN, JA',
      detailsBadges: ['VI', 'EN', 'JA'],
      processingTime: '9 phút',
    },
    {
      id: 5,
      time: '2025-10-12 09:30',
      type: 'Báo cáo',
      typeColor: 'bg-[var(--destructive)]/10 text-[var(--destructive)]',
      title: 'Báo cáo quấy rối',
      author: 'BadUser123',
      action: 'Cảnh báo',
      actionColor: 'bg-[var(--accent)]/10 text-[var(--accent)]',
      details: '+1 cảnh báo',
      detailsText: '+1 cảnh báo',
      processingTime: '15 phút',
    },
    {
      id: 6,
      time: '2025-10-11 16:45',
      type: 'Chương',
      typeColor: 'bg-[var(--secondary)]/20 text-[var(--secondary)]',
      title: 'Cuộc phiêu lưu (resubmit)',
      author: 'PhamTanD',
      action: 'Đã duyệt',
      actionColor: 'bg-[var(--secondary)]/20 text-[var(--secondary)]',
      details: 'AI Voice: VI',
      detailsBadges: ['VI'],
      processingTime: '6 phút',
    },
    {
      id: 7,
      time: '2025-10-11 15:20',
      type: 'Báo cáo',
      typeColor: 'bg-[var(--destructive)]/10 text-[var(--destructive)]',
      title: 'Báo cáo không hợp lệ',
      author: 'N/A',
      action: 'Bỏ qua',
      actionColor: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
      details: '',
      processingTime: '2 phút',
    },
    {
      id: 8,
      time: '2025-10-11 14:10',
      type: 'Truyện',
      typeColor: 'bg-[var(--primary)]/10 text-[var(--primary)]',
      title: 'Truyện vi phạm bản quyền',
      author: 'CopyUser',
      action: 'Gỡ nội dung',
      actionColor: 'bg-[var(--destructive)]/10 text-[var(--destructive)]',
      details: '+1 cảnh báo',
      detailsText: '+1 cảnh báo',
      detailsBadge: 'Đã thông báo tác giả',
      processingTime: '20 phút',
    },
  ];

   return (
    <div className="min-h-screen bg-[var(--background)] p-8 transition-colors duration-300">
      {/* Header - Updated to match other pages */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">
          Lịch Sử Kiểm Duyệt
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Theo dõi và xem lại các quyết định kiểm duyệt đã thực hiện
        </p>
      </motion.div>

    {/* Search and Filters */}
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
  className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch"
>
  {/* Search Input */}
  <div className="relative flex-1 min-w-[300px]">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
    <Input
      placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
      className="pl-12 bg-[var(--card)] border-[var(--border)] h-12 w-full"
    />
  </div>

  {/* Filter Selects */}
  <div className="flex flex-col sm:flex-row gap-4 flex-1">
    <Select defaultValue="all">
      <SelectTrigger className="flex-1 min-w-[200px] bg-[var(--card)] border-[var(--border)] h-12">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <SelectValue placeholder="Tất cả hành động" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-[var(--card)] border-[var(--border)]">
        <SelectItem value="all">Tất cả hành động</SelectItem>
        <SelectItem value="approved">Đã duyệt</SelectItem>
        <SelectItem value="rejected">Từ chối</SelectItem>
        <SelectItem value="warning">Cảnh báo</SelectItem>
        <SelectItem value="removed">Gỡ nội dung</SelectItem>
        <SelectItem value="ignored">Bỏ qua</SelectItem>
      </SelectContent>
    </Select>

    <Select defaultValue="7days">
      <SelectTrigger className="flex-1 min-w-[180px] bg-[var(--card)] border-[var(--border)] h-12">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <SelectValue placeholder="7 ngày qua" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-[var(--card)] border-[var(--border)]">
        <SelectItem value="today">Hôm nay</SelectItem>
        <SelectItem value="7days">7 ngày qua</SelectItem>
        <SelectItem value="30days">30 ngày qua</SelectItem>
        <SelectItem value="all">Tất cả</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Export Button */}
  <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] h-12 min-w-[140px]">
    <Download className="w-4 h-4 mr-2" />
    Xuất báo cáo
  </Button>
</motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
      >
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 border-[var(--border)] bg-[var(--card)] text-center">
            <p className={`text-2xl mb-1 ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{stat.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* History Table */}
    {/* History Table */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
>
  <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm transition-colors duration-300">
    <Table className="bg-[var(--card)] transition-colors duration-300">
      <TableHeader>
        <TableRow className="bg-[var(--card)] border-b border-[var(--border)] hover:bg-[var(--muted)]/10 transition-colors">
          <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
            Thời gian
          </TableHead>
          <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
            Loại
          </TableHead>
          <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
            Tiêu đề
          </TableHead>
          <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
            Tác giả
          </TableHead>
          <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
            Hành động
          </TableHead>
          <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
            Chi tiết
          </TableHead>
          <TableHead className="text-[var(--foreground)] font-semibold py-4 px-6">
            Thời gian xử lý
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {historyData.map((item) => (
          <TableRow
            key={item.id}
            className="border-b border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/20 transition-colors"
          >
            <TableCell className="py-4 px-6 text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {item.time}
              </div>
            </TableCell>

            <TableCell className="py-4 px-6">
              <Badge variant="outline" className={item.typeColor}>
                {item.type}
              </Badge>
            </TableCell>

            <TableCell className="py-4 px-6">
              <div className="text-[var(--foreground)] font-medium">
                {item.title}
              </div>
            </TableCell>

            <TableCell className="py-4 px-6">
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <User className="w-4 h-4" />
                {item.author}
              </div>
            </TableCell>

            <TableCell className="py-4 px-6">
              <Badge className={`${item.actionColor} border-0`}>
                {item.action}
              </Badge>
            </TableCell>

            <TableCell className="py-4 px-6">
              {item.detailsBadges ? (
                <div className="flex gap-1">
                  <span className="text-sm text-[var(--muted-foreground)] mr-2">AI Voice:</span>
                  {item.detailsBadges.map((badge, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="border-[var(--primary)] text-[var(--primary)] text-xs"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              ) : item.detailsText ? (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-[var(--muted-foreground)]">{item.detailsText}</span>
                  {item.detailsBadge && (
                    <Badge className="bg-[var(--destructive)]/10 text-[var(--destructive)] border-0 text-xs w-fit">
                      {item.detailsBadge}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-[var(--muted-foreground)] text-sm">-</span>
              )}
            </TableCell>

            <TableCell className="py-4 px-6 text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {item.processingTime}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
</motion.div>
    </div>
  );
}