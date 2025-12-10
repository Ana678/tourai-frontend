import { api } from "./api";

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export const followService = {
  followUser: async (targetUserId: number, currentUserId: number) => {
    await api.post(`/users/${targetUserId}/follow`, null, {
      params: { followerId: currentUserId }
    });
  },

  unfollowUser: async (targetUserId: number, currentUserId: number) => {
    await api.delete(`/users/${targetUserId}/unfollow`, {
      params: { followerId: currentUserId }
    });
  },

  getStats: async (targetUserId: number, currentUserId?: number): Promise<FollowStats> => {
    const response = await api.get(`/users/${targetUserId}/follow-stats`, {
      params: { currentUserId }
    });
    return response.data;
  }
};