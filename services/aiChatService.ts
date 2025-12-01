import apiClient from "./apiClient";

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AIChatResponse {
  messages: AIChatMessage[];
}

export const aiChatService = {
  // Lấy lịch sử chat cũ
  // GET /api/AIChat/history
  getHistory: async () => {
    const response = await apiClient.get<AIChatResponse>("/api/AIChat/history");
    return response.data;
  },

  // Gửi tin nhắn mới cho AI
  // POST /api/AIChat/message
  sendMessage: async (message: string) => {
    const response = await apiClient.post<AIChatResponse>(
      "/api/AIChat/message",
      {
        message,
      }
    );
    return response.data;
  },
};
