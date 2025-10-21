"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const cards = [
    {
      title: "Doanh thu hôm nay",
      value: "10.500.000₫",
      trend: "+12.5%",
      desc: "Doanh thu tăng so với hôm qua",
      icon: <IconTrendingUp className="size-4 text-green-600" />,
      trendColor: "text-green-600 border-green-600/30",
      direction: "up",
    },
    {
      title: "User mới",
      value: "276",
      trend: "-20%",
      desc: "Giảm so với hôm qua",
      icon: <IconTrendingDown className="size-4 text-red-600" />,
      trendColor: "text-red-600 border-red-600/30",
      direction: "down",
    },
    {
      title: "Active Users",
      value: "8.432",
      trend: "+7.8%",
      desc: "Tăng trưởng ổn định",
      icon: <IconTrendingUp className="size-4 text-green-600" />,
      trendColor: "text-green-600 border-green-600/30",
      direction: "up",
    },
    {
      title: "Sponsored Authors",
      value: "89",
      trend: "+4.5%",
      desc: "Hiệu suất tài trợ tăng nhẹ",
      icon: <IconTrendingUp className="size-4 text-green-600" />,
      trendColor: "text-green-600 border-green-600/30",
      direction: "up",
    },
  ]

  return (
    <div
      className="
        grid grid-cols-1 gap-6 px-4 lg:px-6
        @xl/main:grid-cols-2 @5xl/main:grid-cols-4
        *:data-[slot=card]:rounded-xl 
        *:data-[slot=card]:shadow-sm
        *:data-[slot=card]:transition-all
        *:data-[slot=card]:duration-300
        *:data-[slot=card]:hover:shadow-md
        *:data-[slot=card]:hover:-translate-y-1
        *:data-[slot=card]:bg-card 
        dark:*:data-[slot=card]:bg-card/90
        *:data-[slot=card]:border
        *:data-[slot=card]:border-border
      "
    >
      {cards.map((card, i) => (
        <Card key={i} className="@container/card">
          <CardHeader>
            <CardDescription className="text-muted-foreground">
              {card.title}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-card-foreground">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge
                variant="outline"
                className={`flex items-center gap-1 px-2 py-1 text-sm rounded-md ${card.trendColor}`}
              >
                {card.icon}
                {card.trend}
              </Badge>
            </CardAction>
          </CardHeader>

          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex items-center gap-2 font-medium text-card-foreground">
              {card.desc}{" "}
              {card.direction === "up" ? (
                <IconTrendingUp className="size-4 text-green-600" />
              ) : (
                <IconTrendingDown className="size-4 text-red-600" />
              )}
            </div>
            <div className="text-muted-foreground">
              Cập nhật theo kỳ báo cáo mới nhất
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
