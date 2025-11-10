// src/pages/AvaliarItinerario.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import {
  useGetItineraryDetails,
  useCreateEvaluation,
  useUpdateEvaluation,
  getEvaluation,
  evaluationKeys,
  EvaluationResponse,
} from "@/services/api/evaluationService.mock";

// Interface customizada para a tela, combinando dados
type AtividadeParaAvaliar = {
  id: number; // Este é o ID da ItineraryActivity
  nome: string;
  local: string | null;
  time: string; // O LocalDateTime do backend
  avaliacao?: EvaluationResponse | null;
};

const AvaliarItinerario = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [atividades, setAtividades] = useState<AtividadeParaAvaliar[]>([]);
  const [selectedAtividade, setSelectedAtividade] = useState<number | null>(null);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

  // 1. Busca o itinerário e sua lista de atividades
  const { data: itinerario, isLoading: loadingItinerary } = useGetItineraryDetails(id!);

  // 2. Pega os IDs das atividades do itinerário
  const activityIds = itinerario?.activities?.map((a) => a.id) || [];

  // 3. Busca as avaliações para cada atividade (N+1 queries, gerenciadas pelo useQueries)
  const evaluationQueries = useQueries({
    queries: activityIds.map((activityId) => ({
      queryKey: evaluationKeys.detail(activityId),
      queryFn: () => getEvaluation(activityId),
      retry: (failureCount: number, error: any) => {
        // Não tentar novamente em caso de 404 (avaliação não existe)
        if (error?.response?.status === 404) return false;
        return failureCount < 2; // Tentar novamente 2x para outros erros
      },
    })),
  });

  const isLoadingEvaluations = evaluationQueries.some((q) => q.isLoading);

  // 4. Mutações para criar e atualizar
  const { mutate: createEvaluationMutate, isPending: isCreating } = useCreateEvaluation();
  const { mutate: updateEvaluationMutate, isPending: isUpdating } = useUpdateEvaluation();
  const saving = isCreating || isUpdating;

  // 5. Efeito para mesclar os dados do itinerário e das avaliações
  useEffect(() => {
    if (itinerario && !isLoadingEvaluations) {
      const evaluationsMap = new Map<number, EvaluationResponse | null>();
      evaluationQueries.forEach((q, index) => {
        const activityId = itinerario.activities[index].id;
        if (q.isSuccess) {
          evaluationsMap.set(activityId, q.data);
        } else {
          evaluationsMap.set(activityId, null); // Marca como nulo se falhar (ex: 404)
        }
      });

      const formatted = itinerario.activities.map((ia) => ({
        id: ia.id, // ID da ItineraryActivity
        nome: ia.activity.nome,
        local: ia.activity.local || null,
        time: ia.time,
        avaliacao: evaluationsMap.get(ia.id) || null,
      }));
      setAtividades(formatted);
    }
  }, [itinerario, evaluationQueries, isLoadingEvaluations]);

  const handleSelectAtividade = (atividadeId: number) => {
    const atividade = atividades.find((a) => a.id === atividadeId);
    setSelectedAtividade(atividadeId);
    setNota(atividade?.avaliacao?.rating || 0);
    setComentario(atividade?.avaliacao?.comment || "");
  };

  const handleSaveAvaliacao = async () => {
    if (!selectedAtividade || nota === 0) {
      toast({
        title: "Avaliação incompleta",
        description: "Por favor, selecione uma nota de 1 a 5",
        variant: "destructive",
      });
      return;
    }

    const atividade = atividades.find((a) => a.id === selectedAtividade);
    const evaluationData = { rating: nota, comment: comentario || undefined };

    const mutationOptions = {
      onSuccess: () => {
        toast({
          title: "Avaliação salva!",
          description: "Sua avaliação foi registrada com sucesso",
        });
        // Invalida a query da avaliação para buscar dados frescos
        queryClient.invalidateQueries({ queryKey: evaluationKeys.detail(selectedAtividade) });
        setSelectedAtividade(null);
        setNota(0);
        setComentario("");
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao salvar avaliação",
          description: error.message || "Não foi possível salvar sua avaliação.",
          variant: "destructive",
        });
      },
    };

    if (atividade?.avaliacao) {
      // Atualizar avaliação existente
      updateEvaluationMutate({
        itineraryActivityId: selectedAtividade,
        data: evaluationData,
      }, mutationOptions);
    } else {
      // Criar nova avaliação
      createEvaluationMutate({
        itineraryActivityId: selectedAtividade,
        data: evaluationData,
      }, mutationOptions);
    }
  };

  const atividadesAvaliadas = atividades.filter((a) => a.avaliacao).length;
  const totalAtividades = atividades.length;
  const progresso = totalAtividades > 0 ? (atividadesAvaliadas / totalAtividades) * 100 : 0;

  const isLoading = loadingItinerary || (activityIds.length > 0 && isLoadingEvaluations);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Helper para formatar data/hora do backend (LocalDateTime)
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
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
          onClick={() => navigate(-1)} // Voltar para a página anterior
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Avaliar Itinerário</h1>
          <p className="text-muted-foreground">{itinerario?.roadmap?.titulo || "Itinerário"}</p>
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
              className={`p-4 cursor-pointer transition-smooth hover:shadow-medium ${
                selectedAtividade === atividade.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelectAtividade(atividade.id)}
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
                  <h3 className="font-semibold">{atividade.nome}</h3>
                  <p className="text-sm text-muted-foreground">{atividade.local}</p>
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
                    </div>
                  )}
                </div>
                {atividade.avaliacao && (
                  <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Formulário de Avaliação (Fixo no mobile) */}
      {selectedAtividade && (
        <Card className="p-6 space-y-4 sticky bottom-4 left-0 right-0 rounded-xl shadow-strong sm:static sm:shadow-soft sm:bottom-auto">
          <h3 className="font-semibold">
            Avaliar: {atividades.find(a => a.id === selectedAtividade)?.nome}
          </h3>

          <div>
            <label className="text-sm font-medium mb-2 block">Nota</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setNota(star)}
                  className="focus:outline-none"
                  disabled={saving}
                >
                  <Star
                    className={`w-8 h-8 transition-smooth ${
                      star <= nota
                        ? "fill-accent text-accent"
                        : "text-muted-foreground hover:text-accent"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Comentário (opcional)
            </label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Compartilhe sua experiência..."
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAtividade(null);
                setNota(0);
                setComentario("");
              }}
              className="flex-1"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAvaliacao}
              disabled={saving || nota === 0}
              className="flex-1"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saving ? "Salvando..." : "Salvar Avaliação"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AvaliarItinerario;
