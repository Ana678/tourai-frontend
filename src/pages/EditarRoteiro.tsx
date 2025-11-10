import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, CheckSquare, Square, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/api";

type Atividade = {
  id: string;
  name: string;
  description?: string;
  location?: string;
  media_url?: string;
  tags?: string[];
};

type RoteiroResponse = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  activities: Atividade[];
};

// Tags do ROTEIRO (categorias gerais)
const TAGS_ROTEIRO = [
  "Praia",
  "Montanha",
  "Cidade",
  "Natureza",
  "Aventura",
  "Cultura",
  "Gastronomia",
  "História",
  "Arte",
  "Relaxamento",
  "Esportes",
  "Família",
  "Romântico",
  "Econômico",
  "Luxo"
];

const EditarRoteiro = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tagsSelecionadas, setTagsSelecionadas] = useState<Set<string>>(new Set());
  const [atividadesSelecionadas, setAtividadesSelecionadas] = useState<Set<string>>(new Set());

  // Buscar roteiro específico
  const { data: roteiro, isLoading: loadingRoteiro } = useQuery<RoteiroResponse>({
    queryKey: ["roteiro", id, userId],
    queryFn: async () => {
      const response = await api.get(`/roadmaps/${id}`, {
        params: { userId }
      });
      return response.data;
    },
    enabled: !!id && !!userId,
  });

  // Buscar todas as atividades disponíveis
  const { data: todasAtividades = [], isLoading: loadingAtividades } = useQuery<Atividade[]>({
    queryKey: ["atividades", userId],
    queryFn: async () => {
      const response = await api.get(`/activities`, {
        params: { userId }
      });
      return Array.isArray(response.data) ? response.data : response.data.content || [];
    },
    enabled: !!userId,
  });

  // Preencher formulário quando roteiro carregar
  useEffect(() => {
    if (roteiro) {
      setTitulo(roteiro.title);
      setDescricao(roteiro.description || "");
      setTagsSelecionadas(new Set(roteiro.tags || []));
      const selecionadas = new Set(roteiro.activities.map((a) => a.id));
      setAtividadesSelecionadas(selecionadas);
    }
  }, [roteiro]);

  // Mutação para atualizar roteiro
  const updateRoteiroMutation = useMutation({
    mutationFn: async (payload: any) => {
      // Atualizar informações básicas do roteiro (incluindo tags do roteiro)
      await api.put(`/roadmaps/${id}`, {
        title: payload.title,
        description: payload.description,
        tags: payload.tags, // Tags do ROTEIRO
      }, {
        params: { userId }
      });

      // Sincronizar atividades
      const atividadesAtuais = roteiro?.activities.map(a => a.id) || [];
      const atividadesNovas = Array.from(atividadesSelecionadas);

      // Remover atividades que não estão mais selecionadas
      for (const activityId of atividadesAtuais) {
        if (!atividadesNovas.includes(activityId)) {
          await api.delete(`/roadmaps/${id}/activities/${activityId}`, {
            params: { userId }
          });
        }
      }

      // Adicionar atividades novas
      for (const activityId of atividadesNovas) {
        if (!atividadesAtuais.includes(activityId)) {
          await api.post(`/roadmaps/${id}/activities/${activityId}`, null, {
            params: { userId }
          });
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Roteiro atualizado!",
        description: "Suas alterações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["roteiros", userId] });
      queryClient.invalidateQueries({ queryKey: ["roteiro", id, userId] });
      navigate("/roteiros");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar roteiro",
        description: error.response?.data?.message || "Erro inesperado ao salvar.",
        variant: "destructive",
      });
    },
  });

  const toggleTag = (tag: string) => {
    if (updateRoteiroMutation.isPending) return;
    const newSet = new Set(tagsSelecionadas);
    if (newSet.has(tag)) {
      newSet.delete(tag);
    } else {
      newSet.add(tag);
    }
    setTagsSelecionadas(newSet);
  };

  const toggleAtividade = (atividadeId: string) => {
    if (updateRoteiroMutation.isPending) return;
    const newSet = new Set(atividadesSelecionadas);
    if (newSet.has(atividadeId)) newSet.delete(atividadeId);
    else newSet.add(atividadeId);
    setAtividadesSelecionadas(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, informe um título para o roteiro",
        variant: "destructive",
      });
      return;
    }

    if (atividadesSelecionadas.size === 0) {
      toast({
        title: "Selecione atividades",
        description: "Por favor, selecione pelo menos uma atividade",
        variant: "destructive",
      });
      return;
    }

    updateRoteiroMutation.mutate({
      title: titulo.trim(),
      description: descricao.trim() || null,
      tags: Array.from(tagsSelecionadas),
    });
  };

  const loading = updateRoteiroMutation.isPending;
  const isLoading = loadingRoteiro || loadingAtividades;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>Carregando roteiro...</p>
        </div>
      </div>
    );
  }

  if (!roteiro) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Roteiro não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/roteiros")}
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Editar Roteiro</h1>
          <p className="text-muted-foreground mt-1">Atualize as informações do seu roteiro</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Ex: Roteiro Rio de Janeiro"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva seu roteiro..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Tags do ROTEIRO */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Label>Categorias do Roteiro</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Selecione as características gerais deste roteiro
            </p>
            <div className="flex flex-wrap gap-2">
              {TAGS_ROTEIRO.map((tag) => (
                <Badge
                  key={tag}
                  variant={tagsSelecionadas.has(tag) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    loading ? "cursor-not-allowed opacity-60" : "hover:scale-105"
                  }`}
                  onClick={() => !loading && toggleTag(tag)}
                >
                  {tagsSelecionadas.has(tag) && "✓ "}
                  {tag}
                </Badge>
              ))}
            </div>
            {tagsSelecionadas.size > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {tagsSelecionadas.size} {tagsSelecionadas.size === 1 ? "categoria selecionada" : "categorias selecionadas"}
              </p>
            )}
          </div>
        </Card>

        {/* Atividades */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Atividades *</h3>
            <p className="text-sm text-muted-foreground">
              Selecione as atividades que farão parte do roteiro
            </p>
          </div>

          {todasAtividades.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma atividade disponível
            </p>
          ) : (
            <div className="space-y-3">
              {todasAtividades.map((atividade) => (
                <div
                  key={atividade.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    loading
                      ? "cursor-not-allowed opacity-60"
                      : "hover:bg-muted/50 cursor-pointer"
                  }`}
                  onClick={() => toggleAtividade(atividade.id)}
                >
                  {atividadesSelecionadas.has(atividade.id) ? (
                    <CheckSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{atividade.name}</p>
                    {atividade.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {atividade.description}
                      </p>
                    )}
                    {atividade.location && (
                      <p className="text-sm text-muted-foreground mt-1">
                        📍 {atividade.location}
                      </p>
                    )}
                    {/* Tags da ATIVIDADE (características específicas) */}
                    {atividade.tags && atividade.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {atividade.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {atividadesSelecionadas.size > 0 && (
            <p className="text-sm text-muted-foreground">
              {atividadesSelecionadas.size}{" "}
              {atividadesSelecionadas.size === 1
                ? "atividade selecionada"
                : "atividades selecionadas"}
            </p>
          )}
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/roteiros")}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 gap-2" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditarRoteiro;