"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { getContentModStats } from "@/services/moderationApi";

type Period = "day" | "week" | "month" | "year";
type Status = "green" | "yellow" | "red";

/* 
WHY: RULES được định nghĩa theo "tháng".
Nếu dùng cho week mà không scale → mọi thứ luôn xanh.
*/
const RULES = {
  stories: { warning: 20, danger: 50 },
  chapters: { warning: 100, danger: 200 },
  reports: { warning: 20, danger: 50 },
  efficiency: { warning: 80, danger: 50 },
  handling: { warning: 80, danger: 50 },
};

/**
 * Giả sử quy định là: "1 tháng không được quá 100 đơn khiếu nại".
 * Vậy nếu đang xem báo cáo theo TUẦN, con số 100 là quá lớn (sai lệch).
 * Hàm này giúp tự động chia nhỏ hoặc nhân lớn con số "100" đó tùy theo đang xem theo Tuần hay Năm.
 */
const scaleRuleByPeriod = (
  rule: { warning: number; danger: number }, // Ngưỡng gốc (thường tính theo Tháng)
  period: Period // Khoảng thời gian người dùng chọn xem (Ngày/Tuần/Tháng/Năm)
) => {
  switch (period) {
    case "week":
      // Nếu xem theo tuần, ta chia ngưỡng cảnh báo cho 4 để có con số chính xác cho 7 ngày.
      return { warning: rule.warning / 4, danger: rule.danger / 4 };
      
    case "year":
      // Nếu xem theo năm, ta nhân ngưỡng lên 12 lần.
      return { warning: rule.warning * 12, danger: rule.danger * 12 };
      
    default:
      // Nếu xem theo 'day' hoặc 'month', tạm thời giữ nguyên ngưỡng gốc 
      // (Hoặc logic backend đã tính toán khớp với 'day' và 'month').
      return rule; 
  }
};

/**
 * (Load)
 */
const getLoadStatus = (value: number, rule: { warning: number; danger: number }): Status => {
  // Nếu số lượng vượt quá mức NGUY HIỂM -> Trả về Đỏ
  if (value > rule.danger) return "red";
  // Nếu số lượng vượt quá mức CẢNH BÁO -> Trả về Vàng
  if (value > rule.warning) return "yellow";
  // Nếu vẫn nằm dưới mức cảnh báo -> Trả về Xanh (An toàn)
  return "green";
};

/**
 * HIỆU SUẤT (Performance)
 */
const getPerformanceStatus = (value: number, rule: { warning: number; danger: number }): Status => {
  // Nếu tỷ lệ xử lý thấp hơn mức NGUY HIỂM -> Trả về Đỏ (Làm việc quá chậm)
  if (value < rule.danger) return "red";
  // Nếu tỷ lệ thấp hơn mức CẢNH BÁO -> Trả về Vàng
  if (value < rule.warning) return "yellow";
  // Nếu tỷ lệ cao trên mức cảnh báo -> Trả về Xanh (Làm việc tốt)
  return "green";
};

/*
Với week/month/year backend trả nhiều point,
dashboard chỉ cần kỳ mới nhất.
*/
const getCurrentPeriodValue = (data: any) => {
  if (!data?.points || data.points.length === 0) return 0;
  return data.points[data.points.length - 1].value;
};

const STATUS_LABELS = {
  stories: {
    green: "Ổn định",
    yellow: "Cảnh báo",
    red: "Quá tải",
  },
  chapters: {
    green: "Bình thường",
    yellow: "Cảnh báo",
    red: "Quá tải",
  },
  reports: {
    green: "Ít vi phạm",
    yellow: "Cao bất thường",
    red: "Báo động",
  },
  efficiency: {
    green: "Tốt",
    yellow: "Cần cải thiện",
    red: "Cần đẩy nhanh",
  },
  handling: {
    green: "Đã xử lý",
    yellow: "Đang xử lý",
    red: "Tồn đọng",
  },
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

const StatusIndicator = ({ status, label }: { status: Status; label: string }) => (
  <Badge
    variant="outline"
    className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border ${STATUS_STYLES[status]}`}
  >
    {STATUS_ICONS[status]} {label}
  </Badge>
);

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
// Dùng Promise.all để gọi 5 API cùng một lúc.
      const [s, c, d, r, h] = await Promise.all([
        getContentModStats("stories", { period }),
        getContentModStats("chapters", { period }),
        getContentModStats("story-decisions", { period }),
        getContentModStats("reports", { period }),
        getContentModStats("reports/handled", { period }),
      ]);

    /**
     * - Nếu xem theo 'ngày': Chúng ta lấy 'total' (tổng cộng của ngày đó).
     * - Nếu xem theo 'tuần/tháng': API trả về một mảng dữ liệu. 
     * Hàm getCurrentPeriodValue(s) giúp lấy ra con số của RIÊNG kỳ hiện tại 
     * để so sánh chính xác với ngưỡng (rule) đã chia ở trên.
     */
      setStats({
        stories: period === "day" ? s.total : getCurrentPeriodValue(s),
        chapters: period === "day" ? c.total : getCurrentPeriodValue(c),
        decisions: period === "day" ? d.total : getCurrentPeriodValue(d),
        reports: period === "day" ? r.total : getCurrentPeriodValue(r),
        handled: period === "day" ? h.total : getCurrentPeriodValue(h),
      });
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

  // scale RULES theo period hiện tại
  const storyRule = scaleRuleByPeriod(RULES.stories, period);
  const chapterRule = scaleRuleByPeriod(RULES.chapters, period);
  const reportRule = scaleRuleByPeriod(RULES.reports, period);
  const efficiencyRule = scaleRuleByPeriod(RULES.efficiency, period);
  const handlingRule = scaleRuleByPeriod(RULES.handling, period);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* STORIES */}
      <Card className="shadow-sm border-l-4 border-l-blue-500">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs text-gray-500 uppercase">
            Truyện chờ duyệt
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xl font-bold">{stats.stories}</div>
          <div className="mt-2">
            {(() => {
              const status = getLoadStatus(stats.stories, storyRule);
              return (
                <StatusIndicator
                  status={status}
                  label={STATUS_LABELS.stories[status]}
                />
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* CHAPTERS */}
      <Card className="shadow-sm border-l-4 border-l-indigo-500">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs text-gray-500 uppercase">
            Chương chờ duyệt
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xl font-bold">{stats.chapters}</div>
          <div className="mt-2">
            {(() => {
              const status = getLoadStatus(stats.chapters, chapterRule);
              return (
                <StatusIndicator
                  status={status}
                  label={STATUS_LABELS.chapters[status]}
                />
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* REPORTS */}
      <Card className="shadow-sm border-l-4 border-l-orange-500">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs text-gray-500 uppercase">
            Báo cáo mới
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xl font-bold">{stats.reports}</div>
          <div className="mt-2">
            {(() => {
              const status = getLoadStatus(stats.reports, reportRule);
              return (
                <StatusIndicator
                  status={status}
                  label={STATUS_LABELS.reports[status]}
                />
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* EFFICIENCY */}
      <Card className="shadow-sm border-l-4 border-l-purple-500">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs text-gray-500 uppercase">
            Năng suất duyệt
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xl font-bold">
            {efficiencyRate.toFixed(0)}%
          </div>
          <div className="mt-2">
            {(() => {
              const status = getPerformanceStatus(
                efficiencyRate,
                efficiencyRule
              );
              return (
                <StatusIndicator
                  status={status}
                  label={STATUS_LABELS.efficiency[status]}
                />
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* HANDLING */}
      <Card className="shadow-sm border-l-4 border-l-teal-500">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs text-gray-500 uppercase">
            Xử lý Report
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xl font-bold">
            {handlingRate.toFixed(0)}%
          </div>
          <div className="mt-2">
            {(() => {
              const status = getPerformanceStatus(handlingRate, handlingRule);
              return (
                <StatusIndicator
                  status={status}
                  label={STATUS_LABELS.handling[status]}
                />
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
