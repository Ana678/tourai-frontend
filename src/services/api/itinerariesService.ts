import { useMutation, useQuery } from "@tanstack/react-query";
import { api, queryClient } from "./api";

export interface CreateItineraryDTO {
  userId: number;
  roadmapId: number;
  activities: {
    activityId: number;
    time: string;
  }[];
}

export interface UpdateItineraryDTO {
  activities: {
    activityId: number;
    time?: string;
    completed?: boolean;
  }[];
}

export interface ItineraryDTO {
  id: number;
  user: {
    id: number;
  };
  roadmap: {
    title: string;
  };
  activities: {
    id: number;
    time: string;
    completed: boolean;
    activity: {
      id: number;
      name: string;
      location: string;
      mediaUrl: string;
    };
  }[];
}

export const createItinerary = (data: CreateItineraryDTO) => {
  return api
    .post<ItineraryDTO>("/itineraries", data)
    .then((response) => response.data);
};

export const updateItinerary = ({
  id,
  data,
}: {
  id: number;
  data: UpdateItineraryDTO;
}) => {
  return api
    .put<ItineraryDTO>(`/itineraries/${id}`, data)
    .then((response) => response.data);
};

export const deleteItinerary = async (id: number) => {
  await api.delete(`/itineraries/${id}`);
};

export const getItineraries = (params: { userId: number }) => {
  return api
    .get<ItineraryDTO[]>("/itineraries", { params })
    .then((response) => response.data);
};

export const getItinerary = (id: number) => {
  return api
    .get<ItineraryDTO>(`/itineraries/${id}`)
    .then((response) => response.data);
};

export const useCreateItinerary = () => {
  return useMutation({
    mutationFn: createItinerary,
    onSuccess: (data, request) => {
      queryClient.invalidateQueries({
        queryKey: ["itineraries", { userId: request.userId }],
      });
    },
  });
};

export const useUpdateItinerary = () => {
  return useMutation({
    mutationFn: updateItinerary,
    onSuccess: (data, request) => {
      queryClient.invalidateQueries({
        queryKey: ["itineraries", { userId: data.user.id }],
      });
      queryClient.setQueryData(["itinerary", request.id], data);
    },
  });
};

export const useDeleteItinerary = () => {
  return useMutation({
    mutationFn: deleteItinerary,
    onSuccess: (data, request) => {
      const itinerary = queryClient.getQueryData<ItineraryDTO>([
        "itinerary",
        request,
      ]);

      if (itinerary) {
        queryClient.invalidateQueries({
          queryKey: ["itineraries", { userId: itinerary.user.id }],
        });
        queryClient.invalidateQueries({
          queryKey: ["itinerary", request],
        });
      }
    },
  });
};

export const useGetItineraries = (params: { userId?: number }) => {
  return useQuery({
    queryKey: ["itineraries", params],
    queryFn: () => getItineraries({ userId: params.userId! }),
    enabled: !!params.userId,
  });
};

export const useGetItinerary = (id?: number) => {
  return useQuery({
    queryKey: ["itinerary", id],
    queryFn: () => getItinerary(id),
    enabled: !!id,
  });
};