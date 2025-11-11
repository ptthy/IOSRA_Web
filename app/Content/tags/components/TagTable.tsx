import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Edit, Trash } from "lucide-react";
import { TagPagedItem } from "@/services/tagService";

interface TagGridProps {
  tags: TagPagedItem[];
  isLoading: boolean;
  error: string | null;
  onEdit: (tag: TagPagedItem) => void;
  onDelete: (tag: TagPagedItem) => void;
}

export function TagGrid({ tags, isLoading, error, onEdit, onDelete }: TagGridProps) {
  if (isLoading)
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );

  if (error)
    return (
      <div className="text-center text-red-600 py-12">
        <AlertCircle className="w-8 h-8 mx-auto" />
        <p className="mt-2">Lỗi: {error}</p>
      </div>
    );

  if (tags.length === 0)
    return (
      <div className="text-center text-[var(--muted-foreground)] py-12">
        Không có tag nào.
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tags.map((tag) => (
        <Card
          key={tag.tagId}
          className="p-4 border border-[var(--border)] rounded-xl hover:shadow-md transition-shadow bg-[var(--card)]"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">{tag.name}</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {tag.usage} truyện
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => onEdit(tag)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onDelete(tag)}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
