import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, CheckSquare, Square, Loader2, Tag, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchAtividades,
  createRoteiro,
  Atividade,
  CreateRoteiroDTO,
  Page,
} from "@/services/api/roteirosService";
import { PaginationControl } from "@/components/common/PaginationControl";

// Tags do ROTEIRO
export const TAGS_ROTEIRO = [
  "Praia", "Montanha", "Cidade", "Natureza", "Aventura", "Cultura", 
  "Gastronomia", "História", "Arte", "Relaxamento", "Esportes", 
  "Família", "Romântico", "Econômico", "Luxo"
];

// Tags da ATIVIDADE (apenas visual, filtro local nas atividades carregadas)
const TAGS_ATIVIDADES = [
  "história", "cultura", "museu", "grátis", "compras", "artesanato", 
  "monumento", "arquitetura", "vista", "pôr-do-sol", "aquário", 
  "família", "animais", "praia", "relaxo", "esportes", "natureza", 
  "trilha", "cachoeira", "parque", "piquenique", "restaurante", 
  "café", "bar", "comida típica", "frutos do mar", "vegetariano", 
  "noturno", "balada", "música ao vivo"
];

// Hook de Debounce para a busca
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

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
  
  // Estados de Busca e Paginação de Atividades
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 5; // Tamanho menor para caber no formulário
  
  // Filtro de tags local (opcional, filtra apenas o que veio do backend)
  const [tagsAtividadesFiltro, setTagsAtividadesFiltro] = useState<Set<string>>(new Set());

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Reseta a página quando a busca muda
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  // Buscar atividades (Com Paginação e Busca)
  const {
    data: atividadesPage,
    isLoading: loadingAtividades,
    isError,
    isPlaceholderData
  } = useQuery<Page<Atividade>>({
    queryKey: ["atividades", userId, page, debouncedSearch],
    // Passamos todos os parâmetros para o serviço
    queryFn: () => fetchAtividades(userId!, page, pageSize, debouncedSearch),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });

  const atividades = atividadesPage?.content || [];
  const totalPages = atividadesPage?.totalPages || 0;

  // Criar roteiro (mutação)
  const createRoteiroMutation = useMutation({
    mutationFn: (dto: CreateRoteiroDTO) => createRoteiro(dto, userId!),
    onSuccess: () => {
      toast({ title: "Roteiro criado!", description: "Seu roteiro foi criado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["roteiros", userId] });
      navigate("/roteiros");
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar roteiro", description: error.message, variant: "destructive" });
    },
  });

  const loading = createRoteiroMutation.isPending;

  // Funções de toggle (Tags e Seleção)
  const toggleTag = (tag: string) => {
    if (loading) return;
    const newSet = new Set(tagsSelecionadas);
    if (newSet.has(tag)) newSet.delete(tag);
    else newSet.add(tag);
    setTagsSelecionadas(newSet);
  };

  const toggleTagAtividade = (tag: string) => {
    const newSet = new Set(tagsAtividadesFiltro);
    if (newSet.has(tag)) newSet.delete(tag);
    else newSet.add(tag);
    setTagsAtividadesFiltro(newSet);
  };

  const toggleAtividade = (id: string) => {
    if (loading) return;
    const newSet = new Set(atividadesSelecionadas);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setAtividadesSelecionadas(newSet);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (atividadesSelecionadas.size === 0) {
      toast({ title: "Selecione atividades", description: "Por favor, selecione pelo menos uma atividade", variant: "destructive" });
      return;
    }

    createRoteiroMutation.mutate({
      title: titulo.trim(),
      description: descricao.trim(),
      atividades: Array.from(atividadesSelecionadas),
      tags: Array.from(tagsSelecionadas),
      visibility: "PUBLIC",
      user_id: userId,
    });
  };

  // Filtragem local visual por tags (aplica-se apenas à página atual retornada pelo backend)
  const atividadesExibidas = tagsAtividadesFiltro.size === 0
    ? atividades
    : atividades.filter((atividade) => atividade.tags?.some((t) => tagsAtividadesFiltro.has(t)));

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/roteiros")} disabled={loading}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Criar Novo Roteiro</h1>
          <p className="text-muted-foreground">Preencha os detalhes do seu roteiro de viagem</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Informações Básicas</h3>
            <p className="text-sm text-muted-foreground">Dados principais do seu roteiro</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input id="titulo" placeholder="Ex: Roteiro de 3 dias em São Paulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required disabled={loading} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" placeholder="Descreva o objetivo deste roteiro..." value={descricao} onChange={(e) => setDescricao(e.target.value)} disabled={loading} className="mt-1 resize-none" rows={4} />
            </div>
          </div>
        </Card>

        {/* Categorias do Roteiro */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Categorias</h3>
            <p className="text-sm text-muted-foreground">Selecione as categorias que melhor descrevem seu roteiro</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TAGS_ROTEIRO.map((tag) => (
              <Badge key={tag} variant={tagsSelecionadas.has(tag) ? "default" : "outline"} className={`cursor-pointer transition-all ${loading ? "cursor-not-allowed opacity-60" : "hover:scale-105"}`} onClick={() => !loading && toggleTag(tag)}>
                {tagsSelecionadas.has(tag) && "✓ "} {tag}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Seleção de Atividades */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Atividades *</h3>
            <p className="text-sm text-muted-foreground">Selecione as atividades que farão parte do roteiro</p>
          </div>

          {/* Campo de Busca de Atividades */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar atividades por nome..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-9"
            />
          </div>

          {/* Filtro visual por Tags (opcional) */}
          <div className="space-y-2">
             <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <Label className="text-xs font-normal text-muted-foreground">Filtrar resultados por tags</Label>
             </div>
             <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {TAGS_ATIVIDADES.map((tag) => (
                  <Badge key={tag} variant={tagsAtividadesFiltro.has(tag) ? "default" : "outline"} className="cursor-pointer text-[10px] px-2 py-0 h-6" onClick={() => !loading && toggleTagAtividade(tag)}>
                    {tag}
                  </Badge>
                ))}
             </div>
          </div>

          {/* Lista de Atividades */}
          {loadingAtividades && !isPlaceholderData && !atividades.length ? (
            <div className="text-muted-foreground text-center py-8 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando atividades...
            </div>
          ) : isError ? (
            <p className="text-destructive text-center py-8">Erro ao carregar atividades.</p>
          ) : atividadesExibidas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? "Nenhuma atividade encontrada para esta busca." : "Nenhuma atividade disponível."}
            </p>
          ) : (
            <div className="space-y-3">
              {atividadesExibidas.map((atividade) => (
                <div
                  key={atividade.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${loading ? "cursor-not-allowed opacity-60" : "hover:bg-muted/50 cursor-pointer"}`}
                  onClick={() => toggleAtividade(atividade.id)}
                >
                  {atividadesSelecionadas.has(atividade.id) ? (
                    <CheckSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{atividade.name}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{atividade.description}</p>
                    {atividade.location && <p className="text-xs text-muted-foreground mt-1">📍 {atividade.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
             <PaginationControl currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}

          {atividadesSelecionadas.size > 0 && (
            <p className="text-sm text-primary font-medium text-right">
              {atividadesSelecionadas.size} atividades selecionadas
            </p>
          )}
        </Card>

        {/* Ações */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/roteiros")} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 gap-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Salvando..." : "Salvar Roteiro"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NovoRoteiro;