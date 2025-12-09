import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  fetchAtividades,
  createRoteiro,
  Atividade,
  CreateRoteiroDTO,
  Page,
} from "@/services/api/roteirosService";

// Tags do ROTEIRO (categorias gerais)
export const TAGS_ROTEIRO = [
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

// Tags da ATIVIDADE (filtro específico para lista de atividades)
const TAGS_ATIVIDADES = [
  "história",
  "cultura",
  "museu",
  "grátis",
  "compras",
  "artesanato",
  "monumento",
  "arquitetura",
  "vista",
  "pôr-do-sol",
  "aquário",
  "família",
  "animais",
  "praia",
  "relaxo",
  "esportes",
  "natureza",
  "trilha",
  "cachoeira",
  "parque",
  "piquenique",
  "restaurante",
  "café",
  "bar",
  "comida típica",
  "frutos do mar",
  "vegetariano",
  "noturno",
  "balada",
  "música ao vivo"
];

const NovoRoteiro = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados do formulário
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tagsSelecionadas, setTagsSelecionadas] = useState<Set<string>>(new Set());
  const [atividadesSelecionadas, setAtividadesSelecionadas] = useState<Set<string>>(new Set());
  const [tagsAtividadesFiltro, setTagsAtividadesFiltro] = useState<Set<string>>(new Set());

  // Buscar atividades (TanStack Query)
  // Ajuste: Tipagem correta para Page<Atividade> e extração do content
  const {
    data: atividadesPage,
    isLoading: loadingAtividades,
    isError,
  } = useQuery<Page<Atividade>>({
    queryKey: ["atividades", userId],
    // Solicita 50 atividades para exibir uma lista maior na criação
    queryFn: () => fetchAtividades(userId!, 0, 50),
    enabled: !!userId,
  });

  // Extrai o array de atividades do objeto de página
  const atividades = atividadesPage?.content || [];

  // Criar roteiro (mutação)
  const createRoteiroMutation = useMutation({
    mutationFn: (dto: CreateRoteiroDTO) => createRoteiro(dto, userId!),
    onSuccess: () => {
      toast({
        title: "Roteiro criado!",
        description: "Seu roteiro foi criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["roteiros", userId] });
      navigate("/roteiros");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar roteiro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loading = createRoteiroMutation.isPending;

  // Alternar seleção de tags do roteiro
  const toggleTag = (tag: string) => {
    if (loading) return;
    const newSet = new Set(tagsSelecionadas);
    if (newSet.has(tag)) {
      newSet.delete(tag);
    } else {
      newSet.add(tag);
    }
    setTagsSelecionadas(newSet);
  };

  // Alternar tags do filtro de atividades
  const toggleTagAtividade = (tag: string) => {
    const newSet = new Set(tagsAtividadesFiltro);
    if (newSet.has(tag)) newSet.delete(tag);
    else newSet.add(tag);
    setTagsAtividadesFiltro(newSet);
  };

  // Alternar seleção de atividades
  const toggleAtividade = (id: string) => {
    if (loading) return;
    const newSet = new Set(atividadesSelecionadas);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setAtividadesSelecionadas(newSet);
  };

  // Enviar formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não encontrado, tente relogar.",
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

    createRoteiroMutation.mutate({
      title: titulo.trim(),
      description: descricao.trim(),
      atividades: Array.from(atividadesSelecionadas),
      tags: Array.from(tagsSelecionadas), // Tags do ROTEIRO
      visibility: "PUBLIC",
      user_id: userId,
    });
  };

  // Filtragem das atividades com base nas tagsAtividadesFiltro
  const atividadesFiltradas =
    tagsAtividadesFiltro.size === 0
      ? atividades
      : atividades.filter((atividade) =>
          atividade.tags?.some((t) => tagsAtividadesFiltro.has(t))
        );

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/roteiros")}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Criar Novo Roteiro</h1>
          <p className="text-muted-foreground">
            Preencha os detalhes do seu roteiro de viagem
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Informações Básicas</h3>
            <p className="text-sm text-muted-foreground">
              Dados principais do seu roteiro
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Ex: Roteiro de 3 dias em São Paulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o objetivo deste roteiro..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={loading}
                className="mt-1 resize-none"
                rows={4}
              />
            </div>
          </div>
        </Card>

        {/* Categorias/Tags do Roteiro */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Categorias</h3>
            <p className="text-sm text-muted-foreground">
              Selecione as categorias que melhor descrevem seu roteiro
            </p>
          </div>

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
        </Card>

        {/* Atividades */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Atividades *</h3>
            <p className="text-sm text-muted-foreground">
              Selecione as atividades que farão parte do roteiro
            </p>
          </div>

          {/* UI: Filtro por tags (apenas se houver atividades carregadas) */}
          {!loadingAtividades && !isError && atividades.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <Label>Filtrar por tags</Label>
              </div>
              <p className="text-sm text-muted-foreground">Filtre as atividades exibidas</p>
              <div className="flex flex-wrap gap-2">
                {TAGS_ATIVIDADES.map((tag) => (
                  <Badge
                    key={tag}
                    variant={tagsAtividadesFiltro.has(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      loading ? "cursor-not-allowed opacity-60" : "hover:scale-105"
                    }`}
                    onClick={() => !loading && toggleTagAtividade(tag)}
                  >
                    {tagsAtividadesFiltro.has(tag) && "✓ "}
                    {tag}
                  </Badge>
                ))}
              </div>
              {tagsAtividadesFiltro.size > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {tagsAtividadesFiltro.size} {tagsAtividadesFiltro.size === 1 ? "tag ativa" : "tags ativas"}
                </p>
              )}
            </div>
          )}

          {loadingAtividades ? (
            <div className="text-muted-foreground text-center py-8 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando atividades...
            </div>
          ) : isError ? (
            <p className="text-destructive text-center py-8">
              Erro ao carregar atividades.
            </p>
          ) : atividades.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma atividade disponível. Crie uma atividade primeiro!
            </p>
          ) : (
            <div className="space-y-3">
              {atividadesFiltradas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-3">Nenhuma atividade corresponde ao filtro selecionado.</p>
                  <div className="flex items-center justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setTagsAtividadesFiltro(new Set())}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                </div>
              ) : (
                atividadesFiltradas.map((atividade) => (
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
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
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

        {/* Ações */}
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
            {loading ? "Salvando..." : "Salvar Roteiro"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NovoRoteiro;