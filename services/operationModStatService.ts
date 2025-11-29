import apiClient from "./apiClient";

// Interface cho response doanh thu
export interface RevenueStatResponse {
  period: string;
  diaTopup: number;
  subscription: number;
  voiceTopup: number;
  points: {
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    value: number;
  }[];
}

// 1. API Doanh thu
export const getSystemRevenue = async (period: string, from?: string, to?: string) => {
  // Swagger yêu cầu tham số viết hoa: Period, From, To
  const params: any = { Period: period }; 
  if (from) params.From = from;
  if (to) params.To = to;

  // ✅ SỬA: Thêm /api vào đầu đường dẫn (vì .env của bạn chưa có)
  const res = await apiClient.get("/api/OperationModStat/revenue", { params });
  return res.data;
};

// 2. API Số lượng Requests
export const getRequestStats = async (type: string, period: string = 'month') => {
  // ✅ SỬA: Thêm /api vào đầu
  const res = await apiClient.get(`/api/OperationModStat/requests/${type}`, { 
    params: { Period: period } 
  });
  return res.data;
};

// 3. API Doanh thu Author
export const getAuthorRevenueStats = async (metric: string, period: string = 'month') => {
  // ✅ SỬA: Thêm /api vào đầu
  const res = await apiClient.get(`/api/OperationModStat/author-revenue/${metric}`, { 
    params: { Period: period } 
  });
  return res.data;
};

// --- API Rút tiền (Withdraw) ---

export const getWithdrawRequests = async (status?: string) => {
  // ✅ SỬA: Thêm /api vào đầu
  const res = await apiClient.get("/api/OperationMod/withdraw-requests", {
    params: { status },
  });
  return res.data;
};

export const approveWithdrawRequest = async (requestId: string, transactionCode: string, note?: string) => {
  // ✅ SỬA: Thêm /api vào đầu
  const res = await apiClient.post(`/api/OperationMod/withdraw-requests/${requestId}/approve`, {
    transactionCode,
    note 
  });
  return res.data;
};

export const rejectWithdrawRequest = async (requestId: string, note: string) => {
  // ✅ SỬA: Thêm /api vào đầu
  const res = await apiClient.post(`/api/OperationMod/withdraw-requests/${requestId}/reject`, {
    note 
  });
  return res.data;
};