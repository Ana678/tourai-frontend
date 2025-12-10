import { useState, useEffect, useMemo } from "react";
import { Search, UserPlus, Check, X, Clock, Crown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCreateInvite } from "@/services/api/invitesService";
import { ItineraryDTO } from "@/services/api/itinerariesService";
import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/services/api/userService";

interface InviteParticipantsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itinerary: ItineraryDTO;
}

const InviteParticipants = ({
  open,
  onOpenChange,
  itinerary,
}: InviteParticipantsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { mutate: createInvite } = useCreateInvite();

  const isOwner = user.id === itinerary.user.id;

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => searchUsers(search),
  });

  const handleInvite = async (userId: number) => {
    if (!user) return;

    createInvite({
      itineraryId: itinerary.id,
      userId,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "owner":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 gap-1">
            <Crown className="w-3 h-3" /> Dono
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-500/10 text-green-600 gap-1">
            <Check className="w-3 h-3" /> Aceito
          </Badge>
        );
      case "waiting":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" /> Pendente
          </Badge>
        );
    }
  };

  const participants = useMemo(() => {
    if (!itinerary) {
      return [];
    }

    return [
      { ...itinerary.user, status: "owner" },
      ...itinerary.participants.map((item) => ({
        ...item,
        status: "accepted",
      })),
      ...itinerary.invites.map((item) => ({ ...item.user, status: "waiting" })),
    ];
  }, [itinerary]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isOwner
              ? "Convidar Participantes"
              : `Participantes (${participants.length})`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isOwner && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {isLoading && (
            <p className="text-sm text-muted-foreground text-center">
              Buscando...
            </p>
          )}

          {users?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Resultados da busca</p>
              {users.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile.profilePhotoUrl || undefined} />
                      <AvatarFallback>{profile.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{profile.name}</span>
                  </div>
                  {!participants.some((item) => item.id === profile.id) && (
                    <Button
                      size="sm"
                      onClick={() => handleInvite(profile.id)}
                      className="gap-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      Convidar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {participants?.length > 0 && (
            <div className="space-y-2">
              {isOwner && (
                <p className="text-sm font-medium">
                  Participantes ({participants.length})
                </p>
              )}
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={p.profilePhotoUrl || undefined} />
                      <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium text-sm block">
                        {p.name}
                      </span>
                      {getStatusBadge(p.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!users?.length && participants.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Busque usuários para convidar para este itinerário
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteParticipants;
