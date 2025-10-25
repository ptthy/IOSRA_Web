#!/bin/bash

# === CREATE NEXT.JS APP ROUTES (for App Router) ===
# Author: ChatGPT Assistant
# Usage: ./CREATE_NEXTJS_ROUTES.sh
# --------------------------------------

# Danh sách các route cần tạo
routes=(
  "page.tsx"
  "login/page.tsx"
  "register/page.tsx"
  "verify-otp/page.tsx"
  "library/page.tsx"
  "author/page.tsx"
  "profile/page.tsx"
)

# Tạo từng route
for route in "${routes[@]}"; do
  dir="app/$(dirname "$route")"
  mkdir -p "$dir"
  
  # Xác định component tương ứng
  name=$(basename "$route" .tsx)
  comp=$(echo "$dir" | sed 's#app/##' | sed 's#/page##' | sed 's#/#-#g')
  [ "$comp" = "" ] && comp="home"

  cat > "$dir/page.tsx" <<EOF
import ${comp^}Page from "@/components/pages/${comp}-page";

export default function Page() {
  return <${comp^}Page />;
}
EOF

  echo "✅ Created: $dir/page.tsx"
done

echo
echo "🎉 All Next.js routes created successfully!"
