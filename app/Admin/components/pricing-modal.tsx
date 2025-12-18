"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, History, DollarSign, Gem } from "lucide-react";

import { 
  pricingApi, 
  ChapterRule, 
  VoiceRule, 
  TopupPricing, 
  SubscriptionPlan 
} from "@/services/adminApi";

export default function PricingModal() {
  // 1. Quản lý tab hiện tại bằng state
  const [activeTab, setActiveTab] = useState("chapters");
  
  // 2. Tách biệt loading lần đầu và loading khi refresh
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [chapterRules, setChapterRules] = useState<ChapterRule[]>([]);
  const [voiceRules, setVoiceRules] = useState<VoiceRule[]>([]);
  const [topups, setTopups] = useState<TopupPricing[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    fetchData(true); // Tải lần đầu
  }, []);

  const fetchData = async (firstTime = false) => {
    if (firstTime) setIsInitialLoading(true);
    try {
      const [cRes, vRes, tRes, sRes] = await Promise.all([
        pricingApi.getChapterRules(),
        pricingApi.getVoiceRules(),
        pricingApi.getTopupPricing(),
        pricingApi.getSubscriptionPlans(),
      ]);
      setChapterRules(cRes.data);
      setVoiceRules(vRes.data);
      setTopups(tRes.data);
      setPlans(sRes.data);
    } catch (error: any) {
      toast.error("Không thể tải cấu hình giá: " + error.message);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleUpdate = async (type: 'chapter' | 'voice' | 'topup' | 'plan', data: any) => {
    const id = data.ruleId || data.pricingId || data.planCode;
    setUpdating(id);
    try {
      if (type === 'chapter') await pricingApi.updateChapterRule(data);
      if (type === 'voice') await pricingApi.updateVoiceRule(data);
      if (type === 'topup') await pricingApi.updateTopupPricing(data);
      if (type === 'plan') await pricingApi.updateSubscriptionPlan(data);
      
      toast.success("Cập nhật thành công!");
      // Gọi fetchData() nhưng không làm mất giao diện (không set loading chính)
      await fetchData(false); 
    } catch (error: any) {
      toast.error("Cập nhật thất bại: " + error.message);
    } finally {
      setUpdating(null);
    }
  };

  // Chỉ hiện loader toàn màn hình khi vào trang lần đầu
  if (isInitialLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const GemIcon = () => (
    <Gem className="h-5 w-5 text-blue-500 fill-blue-500 inline-block" />
  );

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Biểu phí</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            Điều chỉnh biểu phí <GemIcon /> cho toàn bộ hệ thống.
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchData(false)}>
          <History className="w-4 h-4 mr-2" /> Làm mới dữ liệu
        </Button>
      </div>

      {/* ✅ Thêm value và onValueChange để kiểm soát Tab */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="chapters" className="rounded-lg">Giá đọc chương</TabsTrigger>
          <TabsTrigger value="voice" className="rounded-lg">Giá tạo Audio AI</TabsTrigger>
          <TabsTrigger value="topup" className="rounded-lg flex items-center gap-2">
            Gói nạp <GemIcon />
          </TabsTrigger>
          <TabsTrigger value="subscription" className="rounded-lg">Gói Hội viên</TabsTrigger>
        </TabsList>

        {/* 1. Chapter Pricing */}
        <TabsContent value="chapters">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Bảng giá đọc chương</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số ký tự</TableHead>
                    <TableHead>Giá (<GemIcon />)</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chapterRules.map((rule) => (
                    <TableRow key={rule.rule_id}>
                      <TableCell className="font-medium">
                        Từ {rule.min_char_count.toLocaleString()} {rule.max_char_count ? `- ${rule.max_char_count.toLocaleString()}` : "+"} ký tự
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            className="w-24 h-9" 
                            defaultValue={rule.dias_price}
                            id={`chapter-${rule.rule_id}`}
                          />
                          <GemIcon />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          disabled={updating === rule.rule_id}
                          onClick={() => {
                            const val = (document.getElementById(`chapter-${rule.rule_id}`) as HTMLInputElement).value;
                            handleUpdate('chapter', { ruleId: rule.rule_id, diasPrice: parseInt(val) });
                          }}
                        >
                          {updating === rule.rule_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Lưu
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Voice Pricing */}
        <TabsContent value="voice">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Bảng giá Audio AI (Tác giả)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số ký tự</TableHead>
                    <TableHead>Giá mua Voice</TableHead>
                    <TableHead>Giá tạo Audio</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voiceRules.map((rule) => (
                    <TableRow key={rule.rule_id}>
                      <TableCell className="font-medium">
                        {rule.min_char_count} {rule.max_char_count ? `- ${rule.max_char_count}` : "+"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input type="number" className="w-24 h-9" defaultValue={rule.dias_price} id={`vprice-${rule.rule_id}`} />
                          <GemIcon />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input type="number" className="w-24 h-9" defaultValue={rule.generation_dias} id={`vgen-${rule.rule_id}`} />
                          <GemIcon />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm"
                          disabled={updating === rule.rule_id}
                          onClick={() => {
                            const p = (document.getElementById(`vprice-${rule.rule_id}`) as HTMLInputElement).value;
                            const g = (document.getElementById(`vgen-${rule.rule_id}`) as HTMLInputElement).value;
                            handleUpdate('voice', { ruleId: rule.rule_id, diasPrice: parseInt(p), generationDias: parseInt(g) });
                          }}
                        >
                          {updating === rule.rule_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Lưu
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Topup Pricing */}
        <TabsContent value="topup">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Cấu hình gói nạp <GemIcon /></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topups.map((tp) => (
                  <div key={tp.pricing_id} className="p-4 border rounded-xl space-y-3 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">{tp.amount_vnd.toLocaleString()} VNĐ</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                        <GemIcon /> nhận được
                      </label>
                      <Input type="number" defaultValue={tp.diamond_granted} id={`tp-${tp.pricing_id}`} />
                    </div>
                    <Button 
                      className="w-full" 
                      variant="secondary"
                      disabled={updating === tp.pricing_id}
                      onClick={() => {
                        const val = (document.getElementById(`tp-${tp.pricing_id}`) as HTMLInputElement).value;
                        handleUpdate('topup', { pricingId: tp.pricing_id, diamondGranted: parseInt(val) });
                      }}
                    >
                      {updating === tp.pricing_id ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Cập nhật gói
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Subscriptions */}
        <TabsContent value="subscription">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Gói Hội viên (Premium)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map((plan) => (
                  <div key={plan.plan_code} className="p-6 border rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-100 text-amber-600 rounded-full"><DollarSign /></div>
                      <h3 className="font-bold text-xl">{plan.plan_name}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs">Giá tiền (VNĐ)</label>
                        <Input type="number" defaultValue={plan.price_vnd} id={`p-vnd-${plan.plan_code}`} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs flex items-center gap-1">
                          <GemIcon /> hàng ngày
                        </label>
                        <Input type="number" defaultValue={plan.daily_dias} id={`p-dias-${plan.plan_code}`} />
                      </div>
                    </div>
                    <Button 
                      className="w-full"
                      disabled={updating === plan.plan_code}
                      onClick={() => {
                        const v = (document.getElementById(`p-vnd-${plan.plan_code}`) as HTMLInputElement).value;
                        const d = (document.getElementById(`p-dias-${plan.plan_code}`) as HTMLInputElement).value;
                        handleUpdate('plan', { planCode: plan.plan_code, priceVnd: parseInt(v), dailyDias: parseInt(d) });
                      }}
                    >
                      {updating === plan.plan_code ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Cập nhật gói
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}