import { useState } from "react";
import { Calendar, Clock, Check, Play } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Itinerario = {
  id: string;
  titulo: string;
  local: string | null;
  data_inicio: string;
  dias: number;
  activities: number;
  status: string;
};

const Itineraries = () => {
  const navigate = useNavigate();
  const [Itineraries, setItineraries] = useState<Itinerario[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  if (loading) {
    return <div className="min-h-screen p-6">Carregando...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluido":
        return (
          <Badge className="bg-secondary text-secondary-foreground">
            Concluído
          </Badge>
        );
      case "em_andamento":
        return (
          <Badge className="bg-accent text-accent-foreground">
            Em andamento
          </Badge>
        );
      case "planejado":
        return <Badge variant="outline">Planejado</Badge>;
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
        {Itineraries.map((itinerario) => (
          <Card
            key={itinerario.id}
            className="overflow-hidden hover:shadow-medium transition-smooth h-full"
          >
            <div className="h-32 gradient-primary flex items-center justify-center">
              <Calendar className="w-12 h-12 text-primary-foreground" />
            </div>

            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {itinerario.titulo}
                  </h3>
                  {getStatusBadge(itinerario.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {itinerario.local || "Local não definido"}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{itinerario.dias} dias</span>
                </div>
                <span>•</span>
                <span>{itinerario.activities} atividades</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Início: {itinerario.data_inicio}
                </span>
                {(itinerario.status === "planejado" ||
                  itinerario.status === "em_andamento") && (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      navigate(`/Itineraries/${itinerario.id}/executar`)
                    }
                  >
                    <Play className="w-4 h-4" />
                    {itinerario.status === "planejado"
                      ? "Começar"
                      : "Continuar"}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {Itineraries.length === 0 && (
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
