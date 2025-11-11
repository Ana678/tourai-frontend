import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateEvaluation, useUpdateEvaluation, EvaluationResponse } from "@/services/api/evaluationService";
import { useQueryClient } from "@tanstack/react-query";

interface EvaluationDialogProps {
  itineraryActivityId: number | null;
  activityName: string;
  initialEvaluation: EvaluationResponse | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function EvaluationDialog({
  itineraryActivityId,
  activityName,
  initialEvaluation,
  onOpenChange,
  open,
}: EvaluationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

  const { mutate: createEvaluationMutate, isPending: isCreating } = useCreateEvaluation();
  const { mutate: updateEvaluationMutate, isPending: isUpdating } = useUpdateEvaluation();
  const saving = isCreating || isUpdating;

  // Sincroniza o estado local com a avaliação inicial sempre que a modal for aberta
  useEffect(() => {
    if (open) {
      setNota(initialEvaluation?.rating || 0);
      setComentario(initialEvaluation?.comment || "");
    } else {
      // Limpa os dados ao fechar
      setNota(0);
      setComentario("");
    }
  }, [open, initialEvaluation]);

  const handleSaveAvaliacao = () => {
    if (itineraryActivityId === null || itineraryActivityId === undefined || itineraryActivityId <= 0) {
      toast({
        title: "Avaliação incompleta",
        description: "Erro: O ID da atividade não é válido. Tente selecionar novamente.",
        variant: "destructive",
      });
      return;
    }else if (nota === 0) {
      toast({
        title: "Avaliação incompleta",
        description: "Por favor, selecione uma nota de 1 a 5",
        variant: "destructive",
      });
    }

    const evaluationData = { rating: nota, comment: comentario || undefined };

    const mutationItineraryActivityId = itineraryActivityId;

    const mutationOptions = {
      onSuccess: () => {
        toast({
          title: "Avaliação salva!",
          description: `Sua avaliação para \"${activityName}\" foi registrada.`,
        });

        // Invalida a query específica da avaliação para buscar dados frescos na tela principal
        queryClient.invalidateQueries({ queryKey: ["evaluations", "detail", mutationItineraryActivityId] });

        onOpenChange(false); // Fecha a modal
      },
      onError: (error: any) => {
        const message = error?.response?.data || "Não foi possível salvar sua avaliação.";
        toast({
          title: "Erro ao salvar avaliação",
          description: String(message),
          variant: "destructive",
        });
      },
    };

    if (initialEvaluation) {
      // Atualizar avaliação existente
      updateEvaluationMutate({
        itineraryActivityId: mutationItineraryActivityId,
        data: evaluationData,
      }, mutationOptions);
    } else {
      // Criar nova avaliação
      createEvaluationMutate({
        itineraryActivityId: mutationItineraryActivityId,
        data: evaluationData,
      }, mutationOptions);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialEvaluation ? "Editar Avaliação" : "Avaliar Atividade"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground line-clamp-1">
           {activityName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nota (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => !saving && setNota(star)}
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

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAvaliacao}
              disabled={saving || nota === 0}
              className="flex-1 gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialEvaluation ? (saving ? "Atualizando..." : "Salvar Alterações") : (saving ? "Salvando..." : "Salvar Avaliação")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
