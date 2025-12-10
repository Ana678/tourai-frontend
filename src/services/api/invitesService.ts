import { useMutation } from "@tanstack/react-query";
import { api, queryClient } from "./api";
import { ItineraryDTO } from "./itinerariesService";

export interface CreateInviteDTO {
  itineraryId: number;
  userId: number;
}

export interface InviteDTO {
  id: number;
  itinerary: Omit<ItineraryDTO, "invites">;
  user: {
    id: number;
    name: string;
    email: string;
    profilePhotoUrl: string;
  };
}

export const createInvite = (data: CreateInviteDTO) => {
  return api
    .post<InviteDTO>("/invites", data)
    .then((response) => response.data);
};

export const useCreateInvite = () => {
  return useMutation({
    mutationFn: createInvite,
    onSuccess: (data, request) => {
      const itinerary = queryClient.getQueryData([
        "itinerary",
        request.itineraryId,
      ]) as ItineraryDTO;

      queryClient.setQueryData(["itinerary", request.itineraryId], {
        ...itinerary,
        invites: [...itinerary.invites, data],
      });
    },
  });
};
