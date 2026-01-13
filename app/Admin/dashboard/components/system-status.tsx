"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, Clock, CheckCircle2, XCircle } from "lucide-react";
import { systemApi, UptimeResponse, HealthResponse } from "@/services/adminApi";

export default function SystemStatus() {
  const [uptime, setUptime] = useState<UptimeResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uptimeRes, healthRes] = await Promise.all([
          systemApi.getUptime(),
          systemApi.getHealth(),
        ]);
        setUptime(uptimeRes.data);
        setHealth(healthRes.data);
      } catch (error) {
        console.error("Lỗi fetch status:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h} giờ ${m} phút`;
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Card 1: Uptime */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Trạng thái hoạt động</CardTitle>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Online <Badge className="bg-green-500 ml-2">✓</Badge></div>
          <p className="text-xs text-muted-foreground mt-1">
            Khởi động lúc: {uptime ? new Date(uptime.startedAtUtc).toLocaleString("vi-VN") : "---"}
          </p>
          <p className="text-sm font-medium mt-2">Thời gian chạy: {uptime ? formatUptime(uptime.uptimeSeconds) : "---"}</p>
        </CardContent>
      </Card>

      {/* Card 2: Health */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Sức khỏe hệ thống</CardTitle>
          <Activity className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="mb-4">
             <Badge variant={health?.status === "Healthy" ? "default" : "destructive"} className="text-lg px-3">
                {health?.status === "Healthy" ? "Hoạt động tốt" : "Gặp sự cố"}
             </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {health && Object.entries(health.components).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                {value ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}