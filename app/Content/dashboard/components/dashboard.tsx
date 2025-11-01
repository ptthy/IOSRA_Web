"use client";
import { FileText, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Dashboard() {
  const stats = [
    {
      icon: FileText,
      value: '24',
      label: 'Chờ kiểm duyệt',
      colorVar: 'var(--primary)',
    },
    {
      icon: CheckCircle2,
      value: '18',
      label: 'Đã duyệt hôm nay',
      colorVar: 'var(--secondary)',
    },
    {
      icon: RotateCcw,
      value: '7',
      label: 'Truyện gửi lại',
      colorVar: 'var(--accent)',
    },
    {
      icon: AlertTriangle,
      value: '12',
      label: 'Báo cáo chờ xử lý',
      colorVar: 'var(--chart-2)',
    },
  ];

  const activities = [
    {
      id: 1,
      title: 'Truyện mới: hành trình vào thế giới isekai',
      author: 'NguyenVanA',
      time: '3 giờ trước',
      status: 'Chờ xử lý',
      statusColor: 'bg-yellow-100 text-yellow-800',
    },
    {
      id: 2,
      title: 'Báo cáo: Bạn lụp spam tiêu chương 15',
      author: 'Reader123',
      time: '5 giờ trước',
      status: 'Chờ xử lý',
      statusColor: 'bg-yellow-100 text-yellow-800',
    },
    {
      id: 3,
      title: 'Truyện gửi lại: Cuộc phiêu lưu của...',
      author: 'TranThiB',
      time: '1 giờ trước',
      status: 'Gửi lại',
      statusColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 4,
      title: 'Chương mới: Chương 24 - Sự chiến',
      author: 'LeVanC',
      time: '2 giờ trước',
      status: 'Đã duyệt',
      statusColor: 'bg-green-100 text-green-800',
    },
  ];

  return (
    <div 
      className="p-8" 
      style={{ 
        fontFamily: "'Poppins', sans-serif" 
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 
          className="text-3xl font-bold text-[var(--primary)]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Dashboard Kiểm Duyệt
        </h1>
        <p 
          className="text-[var(--muted-foreground)]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Tổng quan hoạt động và công việc cần xử lý
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div 
                    className="text-3xl font-semibold mb-2 text-[var(--card-foreground)]"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {stat.value}
                  </div>
                  <div 
                    className="text-[var(--muted-foreground)]"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {stat.label}
                  </div>
                </div>
                <div 
                  className="p-3 rounded-lg"
                  style={{ 
                    backgroundColor: `${stat.colorVar}15`,
                    color: stat.colorVar,
                    fontFamily: "'Poppins', sans-serif"
                  }}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card 
        className="border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <CardHeader className="pb-4">
          <CardTitle 
            className="text-[var(--primary)]"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className={activity.statusColor}
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                  <div 
                    className="mb-1 text-[var(--foreground)] font-medium"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {activity.title}
                  </div>
                  <div 
                    className="text-sm text-[var(--muted-foreground)]"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {activity.author} • {activity.time}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className="bg-yellow-100 text-yellow-800 border-yellow-200"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Chờ xử lý
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}