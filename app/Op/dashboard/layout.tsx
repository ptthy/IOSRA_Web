import OpLayout from "@/components/OpLayout"; // Đảm bảo đường dẫn này đúng

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // File này chỉ có nhiệm vụ bọc nội dung (children)
  // bằng layout chung OpLayout
  return (
    <OpLayout>
      {children}
    </OpLayout>
  );
}