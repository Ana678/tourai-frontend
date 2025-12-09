import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, CheckSquare, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAtividades,
  createRoteiro,
  CreateRoteiroDTO,
  Atividade
} from "@/services/api/roteirosService";

const TAGS_DISPONIVEIS = [
  "Praia", "Montanha", "Cidade", "Natureza", "Aventura",
  "Cultura", "Gastronomia", "História", "Arte", "Relaxamento",
  "Esportes", "Família", "Romântico", "Econômico", "Luxo"
];

interface ModalCriarRoteiroProps {
  isOpen: boolean;
  onClose: () => void;
  dadosIniciais?: {
    title?: string;
    description?: string;
    tags?: string[];
    activities?: string[];
  } | null;
}

const ModalCriarRoteiro = ({ isOpen, onClose, dadosIniciais }: ModalCriarRoteiroProps) => {
  const { user } = useAuth();
  const userId = user?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
  });

  const [atividadesSelecionadas, setAtividadesSelecionadas] = useState<Set<string>>(new Set());

  const { data: todasAtividades = [], isLoading: loadingAtividades } = useQuery<Atividade[]>({
    queryKey: ["atividades", userId],
    queryFn: () => fetchAtividades(userId!),
    enabled: !!userId && isOpen,
  });

  useEffect(() => {
    if (isOpen && dadosIniciais) {
      setFormData({
        title: dadosIniciais.title || '',
        description: (dadosIniciais.description || '').slice(0, 255),
        tags: dadosIniciais.tags || [],
      });

      if (todasAtividades.length > 0 && dadosIniciais.activities) {
        const idsEncontrados = new Set<string>();
        dadosIniciais.activities.forEach(nomeSugestao => {
          const atividadeReal = todasAtividades.find(
            a => a.name.toLowerCase().trim() === nomeSugestao.toLowerCase().trim()
          );
          if (atividadeReal) {
            idsEncontrados.add(atividadeReal.id);
          }
        });
        setAtividadesSelecionadas(idsEncontrados);
      }
    } else if (!isOpen) {
      setFormData({ title: '', description: '', tags: [] });
      setAtividadesSelecionadas(new Set());
    }
  }, [isOpen, dadosIniciais, todasAtividades]);

  const createRoteiroMutation = useMutation({
    mutationFn: (dto: CreateRoteiroDTO) => createRoteiro(dto, userId!),
    onSuccess: () => {
      toast({
        title: "Roteiro criado com sucesso!",
        description: "A sugestão da IA foi salva nos seus roteiros.",
      });
      queryClient.invalidateQueries({ queryKey: ["roteiros", userId] });
      onClose();
      navigate("/roteiros");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar roteiro",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const isSaving = createRoteiroMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) return;

    if (formData.description.length > 255) {
      toast({
        title: "Descrição muito longa",
        description: "A descrição deve ter no máximo 255 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (atividadesSelecionadas.size === 0) {
      toast({
        title: "Atenção",
        description: "O roteiro precisa ter pelo menos uma atividade válida selecionada.",
        variant: "destructive"
      });
      return;
    }

    createRoteiroMutation.mutate({
      title: formData.title,
      description: formData.description,
      tags: formData.tags,
      atividades: Array.from(atividadesSelecionadas),
      visibility: "PUBLIC",
      user_id: userId
    });
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => {
      if (prev.tags.includes(tag)) {
        return { ...prev, tags: prev.tags.filter(t => t !== tag) };
      }
      return { ...prev, tags: [...prev.tags, tag] };
    });
  };

  const removeAtividade = (id: string) => {
    const newSet = new Set(atividadesSelecionadas);
    newSet.delete(id);
    setAtividadesSelecionadas(newSet);
  };

  const atividadesParaExibir = todasAtividades.filter(a => atividadesSelecionadas.has(a.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background p-6 shadow-xl relative rounded-xl border-border flex flex-col">

        <div className="flex items-center justify-between mb-6 shrink-0">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-primary">✨</span> Sugestão da IA
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1 overflow-y-auto pr-1">

          {/* Grupo Título */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Título do Roteiro</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              disabled={isSaving}
            />
          </div>

          {/* Grupo Descrição */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Descrição</label>
              <span className={`text-xs ${formData.description.length >= 255 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                {formData.description.length}/255
              </span>
            </div>
            <Textarea
              rows={4}
              value={formData.description}
              onChange={(e) => {
                const text = e.target.value;
                if (text.length <= 255) {
                    setFormData({...formData, description: text});
                }
              }}
              className="resize-none"
              disabled={isSaving}
              maxLength={255}
            />
          </div>

          {/* Grupo Categorias */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">Categorias</label>
            <div className="flex flex-wrap gap-2">
              {TAGS_DISPONIVEIS.map(tag => {
                const isSelected = formData.tags.includes(tag);
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1 text-xs transition-all ${
                      isSelected
                        ? "hover:bg-primary/90"
                        : "hover:bg-accent text-muted-foreground"
                    }`}
                    onClick={() => !isSaving && toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Grupo Atividades */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Atividades Selecionadas ({atividadesSelecionadas.size})
              </label>
              {loadingAtividades && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground"/>}
            </div>

            {atividadesParaExibir.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-md text-center border border-dashed">
                {loadingAtividades ? "Carregando atividades..." : "Nenhuma atividade correspondente encontrada no sistema."}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {atividadesParaExibir.map((atividade) => (
                  <div
                    key={atividade.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                  >
                    <CheckSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{atividade.name}</p>
                      {atividade.location && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          📍 {atividade.location}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAtividade(atividade.id)}
                      title="Remover atividade"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 sticky bottom-0 bg-background pb-2">
            <Button type="submit" className="w-full font-bold gap-2" disabled={isSaving || loadingAtividades}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSaving ? "Salvando..." : "Criar Roteiro"}
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
};

export default ModalCriarRoteiro;
