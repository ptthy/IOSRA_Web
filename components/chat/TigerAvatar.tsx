//components/chat/TigerAvatar.tsx
import React from "react";
import Image from "next/image";

const TIGER_IMAGE_SRC = "/images/Torabot.png";

export function TigerAvatar({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className} shrink-0`}>
      <div className="w-full h-full rounded-full overflow-hidden">
        <Image
          src={TIGER_IMAGE_SRC}
          alt="ToraNovel Tiger Bot"
          width={100}
          height={100}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Status indicator - Chấm xanh */}
      <div className="absolute bottom-0 right-0 w-[25%] h-[25%] bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
    </div>
  );
}
