"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { getContentModStats } from "@/services/moderationApi";

type Period = "day" | "week" | "month" | "year";
type Status = "green" | "yellow" | "red";

// --- CẤU HÌNH NGƯỠNG (THRESHOLDS) ---
const RULES = {
  stories: { warning: 20, danger: 50 },
  chapters: { warning: 100, danger: 200 },
  reports: { warning: 20, danger: 50 },
  efficiency: { warning: 80, danger: 50 }, // % Cao là tốt
  handling: { warning: 80, danger: 50 },   // % Cao là tốt
};

// Thấp là tốt
const getLoadStatus = (value: number, rule: { warning: number; danger: number }): Status => {
  if (value > rule.danger) return "red";
  if (value > rule.warning) return "yellow";
  return "green";
};

// Cao là tốt
const getPerformanceStatus = (value: number, rule: { warning: number; danger: number }): Status => {
  if (value < rule.danger) return "red";
  if (value < rule.warning) return "yellow";
  return "green";
};

const STATUS_STYLES: Record<Status, string> = {
  green: "bg-green-100 text-green-700 border-green-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  red: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<Status, JSX.Element> = {
  green: <CheckCircle2 className="w-3 h-3" />,
  yellow: <AlertTriangle className="w-3 h-3" />,
  red: <AlertCircle className="w-3 h-3" />,
};

const StatusIndicator = ({ status, label }: { status: Status; label: string }) => {
  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border ${STATUS_STYLES[status]}`}
    >
      {STATUS_ICONS[status]} {label}
    </Badge>
  );
};

export function ModerationHealthDashboard({ period }: { period: Period }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    stories: 0,
    chapters: 0,
    decisions: 0,
    reports: 0,
    handled: 0,
  });

  const fetchHealth = async () => {
    try {
      setLoading(true);

      const [s, c, d, r, h] = await Promise.all([
        getContentModStats("stories", { period }),
        getContentModStats("chapters", { period }),
        getContentModStats("story-decisions", { period }),
        getContentModStats("reports", { period }),
        getContentModStats("reports/handled", { period }),
      ]);

      setStats({
        stories: s.total,
        chapters: c.total,
        decisions: d.total,
        reports: r.total,
        handled: h.total,
      });
    } catch (e) {
      console.error("Failed to load health stats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [period]);

  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  const efficiencyRate =
    stats.stories + stats.chapters > 0
      ? (stats.decisions / (stats.stories + stats.chapters)) * 100
      : 100;

  const handlingRate =
    stats.reports > 0 ? (stats.handled / stats.reports) * 100 : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Stories */}
      <Card className="shadow-sm border-l-4 border-l-blue-500">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs text-gray-500 uppercase">Truyện chờ duyệt</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xl font-bold">{stats.stories}</div>
          <div className="mt-2">
            <StatusIndicator
              status={getLoadStatus(stats.stories, RULES.stories)}
              label={stats.stories > 50 ? "Quá tải" : "Ổn định"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Chapters */}
      <Card className="shadow-sm border-l-4 border-l-indigo-500">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs text-gray-500 uppercase">Chương chờ duyệt</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xl font-bold">{stats.chapters}</div>
          <div className="mt-2">
            <StatusIndicator
              status={getLoadStatus(stats.chapters, RULES.chapters)}
              label={stats.chapters > 200 ? "Ùn tắc" : "Bình thường"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <Card className="shadow-sm border-l-4 border-l-orange-500">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs text-gray-500 uppercase">Báo cáo mới</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xl font-bold">{stats.reports}</div>
          <div className="mt-2">
            <StatusIndicator
              status={getLoadStatus(stats.reports, RULES.reports)}
              label={stats.reports > 50 ? "Cao bất thường" : "Ít vi phạm"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Efficiency */}
      <Card className="shadow-sm border-l-4 border-l-purple-500">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs text-gray-500 uppercase">Năng suất duyệt</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xl font-bold">{efficiencyRate.toFixed(0)}%</div>
          <div className="mt-2">
            <StatusIndicator
              status={getPerformanceStatus(efficiencyRate, RULES.efficiency)}
              label={efficiencyRate < 50 ? "Cần đẩy nhanh" : "Tốt"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Handling */}
      <Card className="shadow-sm border-l-4 border-l-teal-500">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs text-gray-500 uppercase">Tỷ lệ xử lý Report</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xl font-bold">{handlingRate.toFixed(0)}%</div>
          <div className="mt-2">
            <StatusIndicator
              status={getPerformanceStatus(handlingRate, RULES.handling)}
              label="Đã xử lý"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
