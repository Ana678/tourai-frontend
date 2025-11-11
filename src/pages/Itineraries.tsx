import { useState } from "react";
import { Calendar, Clock, Check, Play, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ItineraryDTO,
  useGetItineraries,
} from "@/services/api/itinerariesService";
import { useAuth } from "@/hooks/useAuth";

const Itineraries = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: itineraries, isLoading } = useGetItineraries({
    userId: user?.id,
  });
  const { toast } = useToast();

  if (isLoading) {
    return <div className="min-h-screen p-6">Carregando...</div>;
  }

  const getStartDate = (itinerary: ItineraryDTO) => {
    return itinerary.activities.reduce<Date>((acc, curr) => {
      if (
        acc === null ||
        new Date(acc).getTime() > new Date(curr.time).getTime()
      ) {
        return new Date(curr.time);
      }

      return acc;
    }, null);
  };

  const getEndDate = (itinerary: ItineraryDTO) => {
    return itinerary.activities.reduce<Date>((acc, curr) => {
      if (
        acc === null ||
        new Date(acc).getTime() < new Date(curr.time).getTime()
      ) {
        return new Date(curr.time);
      }

      return acc;
    }, null);
  };

  const getTotalDays = (itinerary: ItineraryDTO) => {
    const startDate = getStartDate(itinerary);
    const endDate = getEndDate(itinerary);

    if (!startDate || !endDate) {
      return 0;
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return Math.ceil(diffDays) + 1;
  };

  const getStatus = (
    itinerary: ItineraryDTO
  ): "planned" | "in_progress" | "concluded" => {
    const startDate = getStartDate(itinerary);

    if (!startDate) {
      return null;
    }

    if (
      new Date().getTime() < new Date(startDate).getTime() &&
      itinerary.activities.every((item) => !item.completed)
    ) {
      return "planned";
    } else if (itinerary.activities.some((item) => !item.completed)) {
      return "in_progress";
    } else {
      return "concluded";
    }
  };

  const getStatusBadge = (itinerary: ItineraryDTO) => {
    const status = getStatus(itinerary);

    switch (status) {
      case "planned":
        return <Badge variant="outline">Planejado</Badge>;
      case "in_progress":
        return (
          <Badge className="bg-accent text-accent-foreground">
            Em andamento
          </Badge>
        );
      case "concluded":
        return (
          <Badge className="bg-secondary text-secondary-foreground">
            Concluído
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Meus Itinerários</h1>
        <p className="text-muted-foreground mt-1">
          Organize suas atividades por dias e horários
        </p>
      </div>

      {/* Lista de itinerários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itineraries?.map((itinerary) => (
          <Card
            key={itinerary.id}
            className="overflow-hidden hover:shadow-medium transition-smooth h-full cursor-pointer"
            onClick={() => navigate(`/itinerarios/${itinerary.id}`)}
          >
            <div className="h-32 gradient-primary flex items-center justify-center">
              <Calendar className="w-12 h-12 text-primary-foreground" />
            </div>

            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {itinerary.roadmap.title}
                  </h3>
                  {getStatusBadge(itinerary)}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{getTotalDays(itinerary)} dia(s)</span>
                </div>
                <span>•</span>
                <span>{itinerary.activities.length} atividade(s)</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Início:{" "}
                  {getStartDate(itinerary)?.toLocaleDateString("pt-BR") ?? "-"}
                </span>
              </div>
              {getStatus(itinerary) === "concluded" && (
                <div
                  className="p-0 pt-0 border-t border-border/0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    asChild
                    variant="secondary"
                    className="w-full gap-2 mt-2"
                  >
                    <Link to={`/avaliar-itinerario/${itinerary.id}`}>
                      <Star className="w-4 h-4 fill-secondary-foreground" />
                      Avaliar Itinerário
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {!itineraries?.length && (
        <Card className="p-8 text-center space-y-4 border-dashed">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Nenhum itinerário criado</h3>
            <p className="text-sm text-muted-foreground">
              Transforme seus roteiros em itinerários com dias e horários
            </p>
          </div>
          <Link to="/roteiros">
            <Button className="gap-2">
              <Check className="w-4 h-4" />
              Ver Meus Roteiros
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
};

export default Itineraries;
