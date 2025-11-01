"use client"; // ✅ SỬA 1: Bắt buộc phải có

import { User, Mail, Shield, LogOut, Moon, Sun } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
// import { useState } from 'react'; // ❌ SỬA 2: Xóa useState
import { useTheme } from "next-themes"; // ✅ SỬA 2: Thêm useTheme

export function SettingsPage() {
  // ✅ SỬA 3: Dùng useTheme thay vì useState
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const toggleDarkMode = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    // ✅ SỬA 4: Đồng bộ style var()
    <div 
      className="min-h-screen p-8"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">Cài đặt & Hồ sơ</h1>
        <p className="text-[var(--muted-foreground)]">Quản lý thông tin cá nhân và tùy chỉnh hệ thống</p>
      </motion.div>

      <div className="max-w-4xl space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 border border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white text-2xl">
                  MU
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-1">Moderator User</h2>
                <p className="text-[var(--muted-foreground)] mb-4">Kiểm duyệt viên nội dung</p>
                <Button variant="outline" className="border-[var(--border)]">
                  Cập nhật ảnh đại diện
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 border border-[var(--border)] bg-[var(--card)]">
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-6">Thông tin tài khoản</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--muted-foreground)]">Tên đầy đủ</p>
                  <p className="text-[var(--foreground)]">Nguyễn Văn Moderator</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--muted-foreground)]">Email</p>
                  <p className="text-[var(--foreground)]">moderator@iosra.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--muted-foreground)]">Quyền hạn</p>
                  <p className="text-[var(--foreground)]">Content Moderator</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 border border-[var(--border)] bg-[var(--card)]">
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-6">Tùy chỉnh giao diện</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    {isDark ? ( // ✅ SỬA 5: Dùng isDark
                      <Moon className="w-6 h-6 text-primary" />
                    ) : (
                      <Sun className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-[var(--foreground)]">Chế độ tối</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Bật/tắt giao diện tối
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={isDark} // ✅ SỬA 6: Dùng isDark
                  onCheckedChange={toggleDarkMode} 
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 border border-[var(--border)] bg-[var(--card)]">
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-6">Thống kê hoạt động</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <p className="text-3xl font-semibold text-[var(--primary)] mb-1">156</p>
                <p className="text-sm text-[var(--muted-foreground)]">Đã duyệt</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <p className="text-3xl font-semibold text-[var(--primary)] mb-1">12</p>
                <p className="text-sm text-[var(--muted-foreground)]">Từ chối</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <p className="text-3xl font-semibold text-[var(--primary)] mb-1">8</p>
                <p className="text-sm text-[var(--muted-foreground)]">Đang xử lý</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 border-destructive/50 bg-[var(--card)]">
            <h3 className="text-destructive text-lg font-medium mb-4">Vùng nguy hiểm</h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              Đăng xuất khỏi tài khoản hiện tại
            </p>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}