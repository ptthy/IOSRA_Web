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

// 1. API Doanh thu (JSON)
export const getSystemRevenue = async (period: string, from?: string, to?: string) => {
  const params: any = { Period: period }; 
  if (from) params.From = from;
  if (to) params.To = to;

  const res = await apiClient.get("/api/OperationModStat/revenue", { params });
  return res.data;
};

// 👉 1.1 API Xuất Excel Doanh thu (Blob)
export const exportSystemRevenue = async (period: string, from?: string, to?: string) => {
  const params: any = { 
    Period: period, 
    GenerateReport: true // Kích hoạt mode xuất file
  }; 
  if (from) params.From = from;
  if (to) params.To = to;

  // Quan trọng: responseType 'blob' để nhận file binary
  const res = await apiClient.get("/api/OperationModStat/revenue", { 
    params,
    responseType: 'blob' 
  });
  return res.data; // Trả về Blob
};
// 2. API Số lượng Requests 
export const getRequestStats = async (type: string, period: string, from?: string, to?: string) => {
  const params: any = { Period: period };
  // Thêm logic kiểm tra from/to giống hệt getSystemRevenue
  if (from) params.From = from;
  if (to) params.To = to;

  const res = await apiClient.get(`/api/OperationModStat/requests/${type}`, { 
    params // Truyền object params đã build ở trên
  });
  return res.data;
};

// 2.1 API Xuất Excel Requests 
export const exportRequestStats = async (type: string, period: string, from?: string, to?: string) => {
  const params: any = { 
    Period: period, 
    GenerateReport: true 
  };
  // Thêm logic kiểm tra from/to
  if (from) params.From = from;
  if (to) params.To = to;

  const res = await apiClient.get(`/api/OperationModStat/requests/${type}`, { 
    params,
    responseType: 'blob'
  });
  return res.data;
};

// 3. API Doanh thu Author
export const getAuthorRevenueStats = async (metric: string, period: string = 'month') => {
  const res = await apiClient.get(`/api/OperationModStat/author-revenue/${metric}`, { 
    params: { Period: period } 
  });
  return res.data;
};

// 👉 3.1 API Xuất Excel Author Revenue
export const exportAuthorRevenueStats = async (metric: string, period: string = 'month') => {
  const res = await apiClient.get(`/api/OperationModStat/author-revenue/${metric}`, { 
    params: { Period: period, GenerateReport: true },
    responseType: 'blob'
  });
  return res.data;
};

// --- API Rút tiền (Withdraw) ---
export const getWithdrawRequests = async (status?: string) => {
  const res = await apiClient.get("/api/OperationMod/withdraw-requests", {
    params: { status },
  });
  return res.data;
};

export const approveWithdrawRequest = async (requestId: string, transactionCode: string, note?: string) => {
  const res = await apiClient.post(`/api/OperationMod/withdraw-requests/${requestId}/approve`, {
    transactionCode,
    note 
  });
  return res.data;
};

export const rejectWithdrawRequest = async (requestId: string, note: string) => {
  const res = await apiClient.post(`/api/OperationMod/withdraw-requests/${requestId}/reject`, {
    note 
  });
  return res.data;
};

// 1. Lấy dữ liệu Traffic (User Growth)
export const getTrafficUsers = async (period: string) => {
  // period: 'day', 'week', 'month'
  const res = await apiClient.get("/api/OperationModStat/traffic/users", {
    params: { Period: period }
  });
  return res.data;
};

// 2. Lấy dữ liệu Tương tác (Engagement Behavior)
export const getTrafficEngagement = async (period: string) => {
  const res = await apiClient.get("/api/OperationModStat/traffic/engagement", {
    params: { Period: period }
  });
  return res.data;
};

// 3. Lấy Top Truyện (Content Behavior)
export const getTrendingStories = async (period: string, limit: number = 5) => {
  const res = await apiClient.get("/api/OperationModStat/traffic/stories/trending", {
    params: { Period: period, limit }
  });
  return res.data;
};

// 4. Lấy Top Thể loại (User Preference Behavior)
export const getTopTags = async (period: string, limit: number = 5) => {
  const res = await apiClient.get("/api/OperationModStat/traffic/tags/top", {
    params: { Period: period, limit }
  });
  return res.data;
};