import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";

export enum NotificationType {
  FOLLOW = "FOLLOW",
  ROADMAP_INVITATION = "ROADMAP_INVITATION",
  LIKE = "LIKE",
  COMMENT = "COMMENT"
}

export interface NotificationUser {
  id: number;
  name: string;
  avatar_url: string | null;
}

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  source: NotificationUser;
  destination: { id: number };
  received: boolean;
  createdAt: string;
  payload: string;
  entityId: number;
}

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (userId: number, type?: string) =>
    [...notificationKeys.lists(), userId, type] as const,
};


export const getRecentNotifications = async (
  userId: number,
  quantity: number,
  type?: NotificationType | null
): Promise<NotificationResponse[]> => {
  const params: any = { userId, quantity };

  if (type) {
    params.type = type;
  }

  const response = await api.get<NotificationResponse[]>("/notifications/recent", {
    params,
  });
  return response.data;
};

export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await api.patch(`/notifications/${notificationId}/read`);
};

export const respondInvite = async ({
  entityId,
  action,
}: {
  entityId: number;
  action: "accept" | "reject";
}): Promise<void> => {
  
  console.log(`Action: ${action} on entity: ${entityId}`);
  return new Promise((resolve) => setTimeout(resolve, 500));
};

export const useGetNotifications = (
  userId: number | undefined,
  type: NotificationType | null = null,
  quantity: number = 5
) => {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(userId || 0, type || "all"),
    queryFn: ({ pageParam = quantity }) => {
      if (!userId) return Promise.resolve([]);
      return getRecentNotifications(userId, pageParam, type);
    },
    initialPageParam: quantity,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      return lastPage.length >= lastPageParam ? lastPageParam + 5 : undefined;
    },
    enabled: !!userId,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};

export const useRespondInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: respondInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};