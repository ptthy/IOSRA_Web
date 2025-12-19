"use client";

import PricingModal from "../components/pricing-modal";

export default function PricingPage() {
  return (
    <div className="flex-1 w-full">
      {/* Gọi component bạn vừa di chuyển vào đây */}
      <PricingModal />
    </div>
  );
}