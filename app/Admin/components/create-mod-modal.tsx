"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ShieldPlus } from "lucide-react";
import { createContentMod, createOperationMod } from "@/services/adminApi";

interface CreateModModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateModModal({ isOpen, onClose, onSuccess }: CreateModModalProps) {
  const [loading, setLoading] = useState(false);
  const [modType, setModType] = useState<"cmod" | "omod">("cmod");
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleSubmit = async () => {
    // Validate cơ bản
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    setLoading(true);
    try {
      if (modType === "cmod") {
        await createContentMod(formData);
        toast.success("Đã tạo Content Moderator thành công!");
      } else {
        await createOperationMod(formData);
        toast.success("Đã tạo Operation Moderator thành công!");
      }
      onSuccess();
      onClose();
      // Reset form
      setFormData({ username: "", email: "", password: "", phone: "" });
    } catch (error: any) {
      toast.error(error.message || "Tạo thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldPlus className="w-5 h-5 text-blue-600" />
            Tạo tài khoản Moderator mới
          </DialogTitle>
          <DialogDescription>
            Tạo tài khoản cho nhân viên quản trị nội dung hoặc vận hành.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Chọn loại Mod */}
          <div className="grid gap-2">
            <Label>Loại tài khoản</Label>
            <Select value={modType} onValueChange={(val: any) => setModType(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cmod">Content Moderator (Kiểm duyệt nội dung)</SelectItem>
                <SelectItem value="omod">Operation Moderator (Vận hành)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
              <Input 
                id="username" 
                placeholder="vd: mod_one" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input 
                id="phone" 
                placeholder="09..." 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="mod@example.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Mật khẩu <span className="text-red-500">*</span></Label>
            <Input 
              id="password" 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo tài khoản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}