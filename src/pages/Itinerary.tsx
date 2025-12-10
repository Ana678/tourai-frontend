import { useMemo, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteItinerary,
  useGetItinerary,
  useUpdateItinerary,
} from "@/services/api/itinerariesService";
import { useCreateInvite } from "@/services/api/invitesService";
import InviteParticipants from "@/components/InviteParticipants";
import { useAuth } from "@/hooks/useAuth";

const Itinerary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: itinerary, isLoading, isError } = useGetItinerary(Number(id));
  const { mutate: updateItinerary } = useUpdateItinerary();
  const { mutate: deleteItinerary } = useDeleteItinerary();
  const { mutate: createInvite } = useCreateInvite();

  const [inviteOpen, setInviteOpen] = useState(false);

  const handleToggleActivity = (activityId: number, completed: boolean) => {
    updateItinerary(
      {
        id: Number(id),
        data: {
          activities: [
            {
              activityId,
              completed,
            },
          ],
        },
      },
      {
        onError: () => {
          toast({
            title: "Erro ao atualizar atividade",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDeleteItinerary = () => {
    if (window.confirm("Tem certeza que deseja excluir este itinerário?")) {
      deleteItinerary(Number(id), {
        onSuccess: () => {
          toast({
            title: "Itinerário excluído com sucesso",
          });
          navigate("/itinerarios");
        },
        onError: () => {
          toast({
            title: "Erro ao excluir itinerário",
            variant: "destructive",
          });
        },
      });
    }
  };

  const sortedActivities = useMemo(() => {
    if (!itinerary) return [];
    return [...itinerary.activities].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [itinerary]);

  if (isError || isNaN(Number(id))) {
    return <Navigate to="/itinerarios" replace />;
  }

  if (isLoading) {
    return <div className="min-h-screen p-6">Carregando...</div>;
  }

  const completedCount = itinerary?.activities.filter(
    (a) => a.completed
  ).length;
  const progress = (completedCount / itinerary?.activities.length) * 100;

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/itinerarios")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {itinerary?.roadmap.title}
          </h1>
        </div>

        <div className="flex gap-4 items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setInviteOpen(true)}
          >
            <Users className="w-4 h-4" />
          </Button>

          {itinerary?.user?.id === user?.id && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteItinerary}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Itinerário
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progresso</span>
            <span className="text-muted-foreground">
              {completedCount} de {itinerary.activities.length} concluídas
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </Card>

      <div className="space-y-3">
        {sortedActivities.map((itineraryActivity) => (
          <Card
            key={itineraryActivity.id}
            className={`p-4 transition-all ${
              itineraryActivity.completed ? "opacity-60 bg-muted/50" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={itineraryActivity.completed}
                onCheckedChange={(checked) =>
                  handleToggleActivity(
                    itineraryActivity.activity.id,
                    checked as boolean
                  )
                }
                className="mt-1"
              />
              <div className="flex-1">
                <h4
                  className={`font-semibold ${
                    itineraryActivity.completed ? "line-through" : ""
                  }`}
                >
                  {itineraryActivity.activity.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {itineraryActivity.activity.location}
                </p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(itineraryActivity.time).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {itinerary && (
        <InviteParticipants
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          itinerary={itinerary}
        />
      )}
    </div>
  );
};

export default Itinerary;
