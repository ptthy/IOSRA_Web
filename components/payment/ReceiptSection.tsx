//components/payment/ReceiptSection.tsx
import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface ReceiptSectionProps {
  status: "success" | "cancel";
  orderCode?: string | null;
  amount?: string | number | null;
  transactionId?: string | null;
  date?: string;
}

export function ReceiptSection({
  status,
  orderCode = "---",
  amount,
  transactionId,
  date,
}: ReceiptSectionProps) {
  const isSuccess = status === "success";
  const colorClass = isSuccess ? "text-green-600" : "text-red-600";
  const bgClass = isSuccess ? "bg-green-50" : "bg-red-50";
  const borderClass = isSuccess ? "border-green-200" : "border-red-200";
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <div className="relative bg-white p-8 border-r-4 border-dashed border-gray-200 flex flex-col justify-between h-full">
      {/* Stamp */}
      <div className="absolute top-6 right-6 rotate-12 opacity-80">
        <div className="relative">
          <div
            className={`w-24 h-24 rounded-full ${
              isSuccess
                ? "bg-green-100 border-green-500"
                : "bg-red-100 border-red-500"
            } border-4 flex items-center justify-center`}
          >
            <Icon className={`w-12 h-12 ${colorClass}`} strokeWidth={2.5} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`${colorClass} font-black text-3xl tracking-widest mt-28 uppercase drop-shadow-md border-4 border-current px-4 py-1 -rotate-6 opacity-90`}
            >
              {isSuccess ? "SUCCESS" : "CANCEL"}
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">TORA NOVEL</h1>
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          Biên lai thanh toán
        </p>
      </div>

      {/* Details */}
      <div className="space-y-4 text-sm">
        <div className="border-b border-gray-100 pb-2">
          <p className="text-xs text-gray-500 uppercase">Mã đơn hàng</p>
          <p className="font-mono font-bold text-gray-900 truncate">
            #{orderCode}
          </p>
        </div>

        {transactionId && (
          <div className="border-b border-gray-100 pb-2">
            <p className="text-xs text-gray-500 uppercase">Mã giao dịch</p>
            <p className="font-mono text-gray-600 truncate text-xs">
              {transactionId}
            </p>
          </div>
        )}

        <div className="border-b border-gray-100 pb-2">
          <p className="text-xs text-gray-500 uppercase">Thời gian</p>
          <p className="text-gray-700">
            {date ||
              new Date().toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
          </p>
        </div>

        {/* Amount Box */}
        <div className={`${bgClass} p-4 rounded-lg border ${borderClass} mt-4`}>
          <div
            className={`text-xl font-bold flex items-center gap-1 ${
              isSuccess ? "text-green-600" : "text-red-600"
            }`}
          >
            <span>{isSuccess ? "✓ Đã thanh toán" : "✕ Giao dịch bị hủy"}</span>
          </div>
        </div>

        {!isSuccess && (
          <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200 mt-2">
            ⚠️ Bạn sẽ không bị trừ tiền cho giao dịch này
          </div>
        )}
      </div>

      {/* Barcode Decoration */}
      <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-300">
        <div className="flex gap-0.5 justify-center opacity-40 h-8 overflow-hidden">
          {/* Giả lập barcode bằng css đơn giản */}
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-800 w-1"
              style={{ height: `${Math.random() * 100}%` }}
            ></div>
          ))}
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-1 font-mono tracking-widest">
          {orderCode}
        </p>
      </div>
    </div>
  );
}
