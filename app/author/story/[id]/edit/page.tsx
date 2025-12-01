// // app/author/story/[id]/edit/page.tsx
// "use client";

// import React, { useState, useEffect } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { storyService } from "@/services/storyService";
// import { toast } from "sonner";
// import CreateStoryForm from "@/app/author/create-story/CreateStoryForm";

// export default function EditStoryPage() {
//   const router = useRouter();
//   const params = useParams();
//   const storyId = params.id as string;

//   const [initialData, setInitialData] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const loadStory = async () => {
//       try {
//         const story = await storyService.getStoryDetails(storyId);
//         if (story.status !== "draft") {
//           toast.error(
//             "Chỉ có thể chỉnh sửa khi truyện đang ở trạng thái bản nháp"
//           );
//           router.replace(`/author/story/${storyId}`);
//           return;
//         }

//         setInitialData({
//           title: story.title,
//           description: story.description,
//           outline: story.outline || "",
//           lengthPlan: story.lengthPlan || "short",
//           selectedTagIds: story.tags?.map((t) => t.tagId) || [],
//           coverMode: story.coverUrl?.includes("ai-generated")
//             ? "generate"
//             : "upload",
//           hasUsedAICover: true, // không cho tạo lại AI
//           createdStoryId: storyId,
//           currentCoverUrl: story.coverUrl,
//         });
//       } catch (error) {
//         toast.error("Không tải được thông tin truyện");
//         router.replace(`/author/story/${storyId}`);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadStory();
//   }, [storyId, router]);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center py-16">
//         <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
//       </div>
//     );
//   }

//   if (!initialData) return null;

//   return (
//     <div className="max-w-7xl mx-auto p-6">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold">Chỉnh sửa truyện</h1>
//         <p className="text-muted-foreground mt-2">
//           Bạn có thể chỉnh sửa thông tin truyện khi còn ở trạng thái bản nháp
//         </p>
//       </div>

//       <CreateStoryForm
//         initialData={initialData}
//         isEditMode={true}
//         storyId={storyId}
//         onSuccess={() => {
//           toast.success("Cập nhật truyện thành công!");
//           router.push(`/author/story/${storyId}`);
//         }}
//       />
//     </div>
//   );
// }
// app/author/story/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { storyService } from "@/services/storyService";
import { toast } from "sonner";
import CreateStoryForm from "@/app/author/create-story/CreateStoryForm";

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStory = async () => {
      try {
        const story = await storyService.getStoryDetails(storyId);
        if (story.status !== "draft") {
          toast.error(
            "Chỉ có thể chỉnh sửa khi truyện đang ở trạng thái bản nháp"
          );
          router.replace(`/author/story/${storyId}`);
          return;
        }

        setInitialData({
          title: story.title,
          description: story.description,
          outline: story.outline || "",
          lengthPlan: story.lengthPlan || "short",
          selectedTagIds: story.tags?.map((t) => t.tagId) || [],
          coverMode: "upload", // Luôn là upload trong edit mode
          hasUsedAICover: true, // không cho tạo lại AI
          createdStoryId: storyId,
          currentCoverUrl: story.coverUrl, // 🔥 QUAN TRỌNG: Lấy URL ảnh từ API
        });
      } catch (error) {
        console.error("Error loading story:", error);
        toast.error("Không tải được thông tin truyện");
        router.replace(`/author/story/${storyId}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!initialData) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Chỉnh sửa truyện</h1>
        <p className="text-muted-foreground mt-2">
          Bạn có thể chỉnh sửa thông tin truyện khi còn ở trạng thái bản nháp
        </p>
      </div>

      <CreateStoryForm
        initialData={initialData}
        isEditMode={true}
        storyId={storyId}
        onSuccess={() => {
          toast.success("Cập nhật truyện thành công!");
          router.push(`/author/story/${storyId}`);
        }}
      />
    </div>
  );
}
