import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, CheckCircle, Loader2, Edit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQueries } from "@tanstack/react-query";

import {
  useGetItineraryDetails,
  getEvaluation,
  evaluationKeys,
  EvaluationResponse,
} from "@/services/api/evaluationService";
import { EvaluationDialog } from "@/components/layout/EvaluationDialog";

type AtividadeParaAvaliar = {
  id: number;
  name: string;
  location: string | null;
  time: string;
  avaliacao?: EvaluationResponse | null;
};

const AvaliarItinerario = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [atividades, setAtividades] = useState<AtividadeParaAvaliar[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedActivityForDialog, setSelectedActivityForDialog] = useState<AtividadeParaAvaliar | null>(null);

  const itineraryId = id ? Number(id) : undefined;

  const { data: itinerario, isLoading: loadingItinerary } = useGetItineraryDetails(itineraryId);

  const itineraryActivityIds = itinerario?.activities
    ?.map((a) => a.id)
    .filter((id): id is number => typeof id === 'number' && id > 0)
    || [];

  const evaluationQueries = useQueries({
    queries: itineraryActivityIds.map((activityId) => ({
      queryKey: evaluationKeys.detail(activityId),
      queryFn: () => getEvaluation(activityId),
      retry: (failureCount: number, error: any) => {
        if (error?.response?.status === 404) return false;
        return failureCount < 2;
      },
    })),
  });

  const isFetchingEvaluations = evaluationQueries.some((q) => q.isFetching);
  const isLoadingEvaluations = evaluationQueries.some((q) => q.isLoading);
  const isInitialLoad = !itineraryId || loadingItinerary || (itineraryActivityIds.length > 0 && isLoadingEvaluations);

  useEffect(() => {
    if (itinerario && !isFetchingEvaluations) {
      const evaluationsMap = new Map<number, EvaluationResponse | null>();
      evaluationQueries.forEach((q, index) => {
        const activityId = itinerario.activities[index].id;
        evaluationsMap.set(activityId, q.data || null);
      });

      const formatted = itinerario.activities.map((ia) => ({
        id: ia.id,
        name: ia.activity.name,
        location: ia.activity.location || null,
        time: ia.time,
        avaliacao: evaluationsMap.get(ia.id) || null,
      }));
      setAtividades(formatted);
    }
  }, [itinerario, isFetchingEvaluations]);

  const handleOpenDialog = (atividade: AtividadeParaAvaliar) => {
    setSelectedActivityForDialog(atividade);
    setDialogOpen(true);
  };

  const atividadesAvaliadas = useMemo(() => atividades.filter((a) => a.avaliacao).length, [atividades]);
  const totalAtividades = atividades.length;
  const progresso = totalAtividades > 0 ? (atividadesAvaliadas / totalAtividades) * 100 : 0;

  if (isInitialLoad) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return { date: "-", time: "-" };

    return {
      date: date.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' }),
      time: date.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/itinerarios")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Avaliar Itinerário</h1>
          <p className="text-muted-foreground">{itinerario?.roadmap?.title || "Itinerário"}</p>
        </div>
      </div>

      {/* Progresso */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Progresso da Avaliação</h3>
            <p className="text-sm text-muted-foreground">
              {atividadesAvaliadas} de {totalAtividades} atividades avaliadas
            </p>
          </div>
          <div className="text-2xl font-bold text-primary">
            {Math.round(progresso)}%
          </div>
        </div>
        <Progress value={progresso} />
      </Card>

      {/* Lista de Atividades */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Atividades</h2>
        {atividades.map((atividade) => {
          const { date, time } = formatDateTime(atividade.time);

          return (
            <Card
              key={atividade.id}
              className={`p-4 cursor-pointer transition-smooth hover:shadow-medium`}
              onClick={() => handleOpenDialog(atividade)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
                      {date}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {time}
                    </span>
                  </div>
                  <h3 className="font-semibold">{atividade.name}</h3>
                  <p className="text-sm text-muted-foreground">{atividade.location}</p>
                  {atividade.avaliacao && (
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= atividade.avaliacao!.rating
                              ? "fill-accent text-accent"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({atividade.avaliacao.rating})
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {atividade.avaliacao && (
                        <CheckCircle className="w-5 h-5 text-secondary" />
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(atividade);
                        }}
                    >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de Avaliação */}
      {selectedActivityForDialog && (
        <EvaluationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          itineraryActivityId={selectedActivityForDialog.id}
          activityName={selectedActivityForDialog.name}
          initialEvaluation={selectedActivityForDialog.avaliacao || null}
        />
      )}
    </div>
  );
};

export default AvaliarItinerario;
