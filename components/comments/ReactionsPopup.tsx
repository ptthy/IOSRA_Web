// components/comments/ReactionsPopup.tsx
import React, { useEffect, useState } from "react";
import {
  chapterCommentService,
  CommentReaction,
} from "@/services/chapterCommentService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  User,
  RefreshCw,
  MessageSquare,
  Smile,
  Frown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReactionsPopupProps {
  chapterId: string;
  commentId: string;
  likeCount: number;
  dislikeCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ReactionsPopup({
  chapterId,
  commentId,
  likeCount,
  dislikeCount,
  isOpen,
  onClose,
}: ReactionsPopupProps) {
  const [activeTab, setActiveTab] = useState<"likes" | "dislikes">("likes");
  const [likes, setLikes] = useState<CommentReaction[]>([]);
  const [dislikes, setDislikes] = useState<CommentReaction[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [dislikesLoading, setDislikesLoading] = useState(false);
  const [likesPage, setLikesPage] = useState(1);
  const [dislikesPage, setDislikesPage] = useState(1);
  const [hasMoreLikes, setHasMoreLikes] = useState(true);
  const [hasMoreDislikes, setHasMoreDislikes] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Reset state khi mở popup
      setLikes([]);
      setDislikes([]);
      setLikesPage(1);
      setDislikesPage(1);
      setHasMoreLikes(true);
      setHasMoreDislikes(true);
      loadInitialReactions();
    }
  }, [isOpen, commentId]); // Thêm commentId vào dependency

  const loadInitialReactions = async () => {
    // Tải cả likes và dislikes ban đầu
    await Promise.all([loadLikes(1, true), loadDislikes(1, true)]);
  };

  const loadLikes = async (page: number = 1, isInitial: boolean = false) => {
    if (!chapterId || !commentId) return;

    setLikesLoading(true);
    try {
      const response = await chapterCommentService.getLikes(
        chapterId,
        commentId,
        page,
        20
      );

      if (isInitial) {
        setLikes(response.items);
      } else {
        setLikes((prev) => [...prev, ...response.items]);
      }

      setHasMoreLikes(response.items.length === 20);
      setLikesPage(page);
    } catch (error) {
      console.error("Error loading likes:", error);
    } finally {
      setLikesLoading(false);
    }
  };

  const loadDislikes = async (page: number = 1, isInitial: boolean = false) => {
    if (!chapterId || !commentId) return;

    setDislikesLoading(true);
    try {
      const response = await chapterCommentService.getDislikes(
        chapterId,
        commentId,
        page,
        20
      );

      if (isInitial) {
        setDislikes(response.items);
      } else {
        setDislikes((prev) => [...prev, ...response.items]);
      }

      setHasMoreDislikes(response.items.length === 20);
      setDislikesPage(page);
    } catch (error) {
      console.error("Error loading dislikes:", error);
    } finally {
      setDislikesLoading(false);
    }
  };

  const handleLoadMoreLikes = () => {
    if (!likesLoading && hasMoreLikes) {
      loadLikes(likesPage + 1, false);
    }
  };

  const handleLoadMoreDislikes = () => {
    if (!dislikesLoading && hasMoreDislikes) {
      loadDislikes(dislikesPage + 1, false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === "likes") {
      loadLikes(1, true);
    } else {
      loadDislikes(1, true);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  const getTotalCount = () => {
    return likeCount + dislikeCount;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Phản ứng với bình luận</h3>
              <p className="text-sm text-muted-foreground">
                {getTotalCount()} lượt tương tác
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-8 w-8"
              disabled={activeTab === "likes" ? likesLoading : dislikesLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  (activeTab === "likes" ? likesLoading : dislikesLoading)
                    ? "animate-spin"
                    : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "likes" | "dislikes")}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2 p-2">
            <TabsTrigger
              value="likes"
              className="flex items-center gap-2"
              disabled={likesLoading}
            >
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                <span>Thích</span>
                <Badge
                  variant="secondary"
                  className="ml-1 bg-green-100 text-green-700"
                >
                  {likeCount}
                </Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="dislikes"
              className="flex items-center gap-2"
              disabled={dislikesLoading}
            >
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-red-600" />
                <span>Không thích</span>
                <Badge
                  variant="secondary"
                  className="ml-1 bg-red-100 text-red-700"
                >
                  {dislikeCount}
                </Badge>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Likes Content */}
          <TabsContent value="likes" className="flex-1 m-0 p-0">
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {likesLoading && likes.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : likes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ThumbsUp className="h-16 w-16 mx-auto mb-4 opacity-50 text-green-200" />
                  <p className="font-medium">Chưa có lượt thích nào</p>
                  <p className="text-sm mt-1">
                    Hãy là người đầu tiên thích bình luận này
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {likes.map((reaction, index) => (
                      <div
                        key={`${reaction.readerId}-${reaction.createdAt}-${index}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group border"
                      >
                        <Avatar className="h-12 w-12 border-2 border-green-200">
                          <AvatarImage src={reaction.avatarUrl || ""} />
                          <AvatarFallback className="bg-green-100 text-green-600 font-semibold">
                            {reaction.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            {reaction.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(reaction.createdAt)}
                          </p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-full">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More Button for Likes */}
                  {hasMoreLikes && (
                    <div className="flex justify-center mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadMoreLikes}
                        disabled={likesLoading}
                        className="flex items-center gap-2"
                      >
                        {likesLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Tải thêm lượt thích
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Dislikes Content */}
          <TabsContent value="dislikes" className="flex-1 m-0 p-0">
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {dislikesLoading && dislikes.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : dislikes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ThumbsDown className="h-16 w-16 mx-auto mb-4 opacity-50 text-red-200" />
                  <p className="font-medium">Chưa có lượt không thích nào</p>
                  <p className="text-sm mt-1">
                    Bình luận này chưa nhận được lượt không thích nào
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {dislikes.map((reaction, index) => (
                      <div
                        key={`${reaction.readerId}-${reaction.createdAt}-${index}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group border"
                      >
                        <Avatar className="h-12 w-12 border-2 border-red-200">
                          <AvatarImage src={reaction.avatarUrl || ""} />
                          <AvatarFallback className="bg-red-100 text-red-600 font-semibold">
                            {reaction.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            {reaction.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(reaction.createdAt)}
                          </p>
                        </div>
                        <div className="p-2 bg-red-100 rounded-full">
                          <ThumbsDown className="h-4 w-4 text-red-600" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More Button for Dislikes */}
                  {hasMoreDislikes && (
                    <div className="flex justify-center mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadMoreDislikes}
                        disabled={dislikesLoading}
                        className="flex items-center gap-2"
                      >
                        {dislikesLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Tải thêm lượt không thích
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
