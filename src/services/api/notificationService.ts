import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { api } from "./api";

export enum NotificationType {
  FOLLOW = "FOLLOW",
  ROADMAP_INVITATION = "ROADMAP_INVITATION",
  LIKE = "LIKE",
  COMMENT = "COMMENT",
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
  actionCompleted: boolean;
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
  page: number,
  size: number,
  type?: NotificationType | null
): Promise<NotificationResponse[]> => {
  const params: any = {
    userId,
    page,
    size,
  };

  if (type) {
    params.type = type;
  }

  const response = await api.get<NotificationResponse[]>(
    "/notifications/recent",
    {
      params,
    }
  );
  return response.data;
};

export const markNotificationAsRead = async (
  notificationId: number
): Promise<void> => {
  await api.patch(`/notifications/${notificationId}/read`);
};

export const markActionAsCompleted = async (
  notificationId: number
): Promise<void> => {
  await api.patch(`/notifications/${notificationId}/completed`);
};

export const respondInvite = async ({
  entityId,
  action,
}: {
  entityId: number;
  action: "accept" | "reject";
}): Promise<void> => {
  const endpointAction = action === "accept" ? "accept" : "decline";

  await api.post(`/invites/${entityId}/${endpointAction}`);
};

export const useGetNotifications = (
  userId: number | undefined,
  type: NotificationType | null = null,
  pageSize: number = 5
) => {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(userId || 0, type || "all"),
    initialPageParam: 0,

    queryFn: ({ pageParam = 0 }) => {
      if (!userId) return Promise.resolve([]);
      return getRecentNotifications(userId, pageParam, pageSize, type);
    },

    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < pageSize) {
        return undefined;
      }

      return allPages.length;
    },
    enabled: !!userId,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,

    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previousNotifications = queryClient.getQueriesData({
        queryKey: notificationKeys.all,
      });

      queryClient.setQueriesData<InfiniteData<NotificationResponse[]>>(
        { queryKey: notificationKeys.all },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.map((notif) =>
                notif.id === notificationId
                  ? { ...notif, received: true }
                  : notif
              )
            ),
          };
        }
      );
      return { previousNotifications };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
};

export const useRespondInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityId,
      notificationId,
      action,
    }: {
      entityId: number;
      notificationId: number;
      action: "accept" | "reject";
    }) => {
      const endpointAction = action === "accept" ? "accept" : "decline";
      await api.post(`/invites/${entityId}/${endpointAction}`);
      await markActionAsCompleted(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      queryClient.invalidateQueries({ queryKey: ["itinerary"] });
    },
  });
};
