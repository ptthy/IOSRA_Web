"use client";

import { SettingsPage } from "./components/setting-page";

export default function SettingsMainPage() {
  const handleNavigate = (page: string) => {
    console.log("Navigating to:", page);
  };

  return (
    <div className="flex min-h-screen">
     
      <main className="flex-1 p-6 space-y-6 bg-background">
        <SettingsPage />
      </main>
    </div>
  );
}
