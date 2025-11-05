"use client";
import { useState } from "react"; // Thêm useState
import Link from "next/link";
import { Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, TrendingUp, Star, Eye, Users } from "lucide-react";

// --- DỮ LIỆU MOCK VÀ COMPONENT HỖ TRỢ (TỪ HOME-PAGE) ---

const FEATURED_STORIES = [
  {
    id: 1,
    title: "Hành Trình Về Phương Đông",
    author: "Nguyễn Văn A",
    genre: "Tiên Hiệp",
    views: "1.2M",
    chapters: 245,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1613574841859-cbab4621150f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwYWR2ZW50dXJlJTIwYm9va3xlbnwxfHx8fDE3NjEwODcwMjd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    description:
      "Một câu chuyện kỳ ảo về hành trình tu luyện của một thiếu niên...",
  },
  {
    id: 2,
    title: "Thế Giới Song Song",
    author: "Trần Thị B",
    genre: "Khoa Học Viễn Tưởng",
    views: "890K",
    chapters: 189,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1582203914614-e23623afc345?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMGxpYnJhcnklMjByZWFkaW5nfGVufDF8fHx8MTc2MTA3NTY4MHww&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Khám phá những chiều không gian song song đầy bí ẩn...",
  },
  {
    id: 3,
    title: "Ký Ức Thời Gian",
    author: "Lê Văn C",
    genre: "Lãng Mạn",
    views: "650K",
    chapters: 156,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1560415903-cca53660d61d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cml0aW5nJTIwdmludGFnZSUyMGRlc2t8ZW58MXx8fHwxNzYxMTI4NTEwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    description: "Một câu chuyện tình đẹp vượt qua ranh giới thời gian...",
  },
];

const STATS = [
  { icon: Book, label: "Truyện", value: "10,000+" },
  { icon: Users, label: "Tác giả", value: "2,500+" },
  { icon: Eye, label: "Lượt đọc", value: "50M+" },
  { icon: Star, label: "Đánh giá", value: "4.7/5" },
];

// Component con để handle image với fallback
function StoryImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);

  const ERROR_IMG_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${
          className || ""
        }`}
      >
        <img
          src={ERROR_IMG_SRC}
          alt="Error loading image"
          className="w-20 h-20 opacity-50"
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
    />
  );
}

// --- COMPONENT PAGE CHÍNH ĐÃ GỘP ---

export default function Page() {
  // Logic từ file route gốc
  const handleNavigate = (page: string) => {
    // Điều hướng tạm thời (sau này có thể dùng router.push)
    console.log(`Đi đến trang: ${page}`); // Thay alert bằng console.log hoặc modal
  };
  const isLoggedIn = false;

  // JSX từ component HomePage gốc
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10" />
        <div className="container relative mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-3xl">
            <Badge className="mb-4" variant="secondary">
              <TrendingUp className="mr-1 h-3 w-3" />
              Nền tảng đọc truyện hàng đầu Việt Nam
            </Badge>
            <h1 className="mb-6 text-5xl lg:text-6xl">
              Khám phá thế giới văn học không giới hạn
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Đọc hàng ngàn truyện miễn phí hoặc trở thành tác giả và chia sẻ
              câu chuyện của bạn với hàng triệu độc giả.
            </p>
            <div className="flex flex-wrap gap-4">
              {!isLoggedIn ? (
                <>
                  <Button size="lg" onClick={() => handleNavigate("register")}>
                    Bắt đầu ngay
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleNavigate("login")}
                  >
                    Đăng nhập
                  </Button>
                </>
              ) : (
                <Button size="lg" onClick={() => handleNavigate("library")}>
                  Vào thư viện
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-2xl mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl mb-2">Truyện nổi bật</h2>
            <p className="text-muted-foreground">
              Những tác phẩm được yêu thích nhất
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_STORIES.map((story) => (
              <Card
                key={story.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <StoryImage
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="line-clamp-1">
                      {story.title}
                    </CardTitle>
                    <Badge variant="secondary">{story.genre}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {story.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {story.views}
                    </div>
                    <div className="flex items-center gap-1">
                      <Book className="h-4 w-4" />
                      {story.chapters} chương
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {story.rating}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    Đọc ngay
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-16 bg-card">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl mb-4">Bạn có câu chuyện để kể?</h2>
            <p className="text-muted-foreground mb-8">
              Tham gia cộng đồng tác giả của chúng tôi và chia sẻ câu chuyện của
              bạn với hàng triệu độc giả trên khắp thế giới.
            </p>
            <Button
              size="lg"
              onClick={() => handleNavigate(isLoggedIn ? "author" : "register")}
            >
              Trở thành tác giả
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
