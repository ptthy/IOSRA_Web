// services/storyRatingService.ts
import apiClient from "./apiClient";

export interface ViewerRating {
  readerId: string;
  username: string;
  avatarUrl: string;
  score: number;
  ratedAt: string;
  updatedAt: string;
}

export interface StoryRating {
  storyId: string;
  averageScore: number | null;
  totalRatings: number;
  distribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  viewerRating: ViewerRating | null; // Sửa thành ViewerRating | null
  ratings: {
    items: RatingItem[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface RatingItem {
  readerId: string;
  username: string;
  avatarUrl: string;
  score: number;
  ratedAt: string;
  updatedAt: string;
}

export interface SubmitRatingRequest {
  score: number;
}

export interface SubmitRatingResponse {
  readerId: string;
  username: string;
  avatarUrl: string;
  score: number;
  ratedAt: string;
  updatedAt: string;
}

export const storyRatingApi = {
  getStoryRating: (storyId: string): Promise<StoryRating> => {
    console.log("Fetching story rating for:", storyId);
    return apiClient
      .get(`/api/StoryRating/${storyId}`)
      .then((response) => {
        console.log("Story rating response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error(`Error fetching rating for story ${storyId}:`, error);
        return {
          storyId,
          averageScore: null,
          totalRatings: 0,
          distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
          viewerRating: null,
          ratings: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
          },
        };
      });
  },

  submitRating: (
    storyId: string,
    data: SubmitRatingRequest
  ): Promise<SubmitRatingResponse> => {
    console.log("Submitting rating for story:", storyId, "data:", data);
    return apiClient
      .post(`/api/StoryRating/${storyId}`, data)
      .then((response) => {
        console.log("Submit rating response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error(`Error submitting rating for story ${storyId}:`, error);
        throw error;
      });
  },

  deleteRating: (storyId: string): Promise<void> => {
    console.log("Deleting rating for story:", storyId);
    return apiClient
      .delete(`/api/StoryRating/${storyId}`)
      .then((response) => {
        console.log("Delete rating response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error(`Error deleting rating for story ${storyId}:`, error);
        throw error;
      });
  },
};
