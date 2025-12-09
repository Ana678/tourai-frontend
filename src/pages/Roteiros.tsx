import {
  Plus,
  Map,
  Trash2,
  ArrowRight,
  Loader2,
  Edit,
  Heart,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  deleteRoteiro,
  favoriteRoteiro,
  unfavoriteRoteiro,
} from "@/services/api/roteirosService";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api/api";
import { useMemo, useState, useEffect } from "react";
import { PaginationControl } from "@/components/common/PaginationControl";

// Tipagem para a resposta paginada do backend
type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

type RoteiroDetalhado = {
  id: string;
  title: string;
  description: string | null;
  tags?: string[];
  activities: Array<{ id: string }>;
  isFavorited?: boolean;
};

type OptimisticFavoriteContext = {
  previousMine?: PageResponse<RoteiroDetalhado>;
  previousFavorites?: PageResponse<RoteiroDetalhado>;
};

const Roteiros = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [page, setPage] = useState(0); // Estado para a página atual (0-index)
  const pageSize = 6; // Quantidade de itens por página

  // Reseta a página ao trocar de filtro
  useEffect(() => {
    setPage(0);
  }, [showOnlyFavorites]);

  const roteirosQueryKey = ["roteiros", userId];

  // Query para Meus Roteiros (Paginada)
  const {
    data: myRoteirosPage,
    isLoading: isLoadingMine,
    isError: isErrorMine,
  } = useQuery<PageResponse<RoteiroDetalhado>>({
    queryKey: [roteirosQueryKey, "mine", page], // Adicionado page na key
    queryFn: async () => {
      if (!userId) return { content: [], totalPages: 0 } as any;
      const response = await api.get('/roadmaps/mine', {
        params: { 
          userId, 
          page: showOnlyFavorites ? 0 : page, // Só pagina se for a tab ativa
          size: pageSize 
        }
      });
      return response.data;
    },
    enabled: !!userId && !showOnlyFavorites, // Só busca se estiver na aba "Meus Roteiros"
    placeholderData: keepPreviousData, // Mantém dados antigos enquanto carrega novos
  });

  // Query para Favoritos (Paginada)
  const {
    data: favoriteRoteirosPage,
    isLoading: isLoadingFavorites,
    isError: isErrorFavorites,
  } = useQuery<PageResponse<RoteiroDetalhado>>({
    queryKey: [roteirosQueryKey, "favorites", page], // Adicionado page na key
    queryFn: async () => {
      if (!userId) return { content: [], totalPages: 0 } as any;
      const response = await api.get('/roadmaps/favorites', {
        params: { 
          userId, 
          page: showOnlyFavorites ? page : 0, 
          size: pageSize 
        }
      });
      return response.data;
    },
    enabled: !!userId && showOnlyFavorites, // Só busca se estiver na aba "Favoritos"
    placeholderData: keepPreviousData,
  });

  // Query auxiliar para obter IDs dos favoritos (para marcar o coração corretamente na aba "Meus Roteiros")
  // Nota: Isso é necessário porque a lista paginada de favoritos pode não conter todos os IDs
  const { data: allFavoritesIds = new Set() } = useQuery({
    queryKey: [roteirosQueryKey, "all_favorites_ids"],
    queryFn: async () => {
      if (!userId) return new Set();
      // Busca uma lista simplificada ou maior para mapear os corações.
      // Se o backend suportasse retornar apenas IDs seria ideal.
      // Aqui vamos buscar a primeira página com tamanho maior como fallback
      const response = await api.get('/roadmaps/favorites', {
        params: { userId, page: 0, size: 100 } 
      });
      return new Set(response.data.content.map((r: any) => r.id));
    },
    enabled: !!userId && !showOnlyFavorites, // Só precisa disso na aba "Meus Roteiros"
    staleTime: 1000 * 60 * 5 // Cache por 5 minutos
  });

  // Processamento dos dados para exibição
  const displayedData = useMemo(() => {
    if (showOnlyFavorites) {
      if (!favoriteRoteirosPage) return { content: [], totalPages: 0 };
      // Na aba favoritos, todos são favoritados
      const content = favoriteRoteirosPage.content.map(r => ({ ...r, isFavorited: true }));
      return { ...favoriteRoteirosPage, content };
    } else {
      if (!myRoteirosPage) return { content: [], totalPages: 0 };
      // Na aba meus roteiros, verifica se o ID está no set de favoritos
      const content = myRoteirosPage.content.map(r => ({
        ...r,
        isFavorited: allFavoritesIds.has(r.id)
      }));
      return { ...myRoteirosPage, content };
    }
  }, [showOnlyFavorites, myRoteirosPage, favoriteRoteirosPage, allFavoritesIds]);

  const deleteRoteiroMutation = useMutation({
    mutationFn: (id: string) => deleteRoteiro(id, userId!),
    onSuccess: () => {
      toast({ title: "Roteiro excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: roteirosQueryKey });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir roteiro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (roteiro: RoteiroDetalhado) => favoriteRoteiro(roteiro.id, userId!),
    onSuccess: () => {
      toast({ title: "Roteiro favoritado!" });
      queryClient.invalidateQueries({ queryKey: roteirosQueryKey });
    },
    onError: (err) => {
      toast({ title: "Erro ao favoritar", description: (err as Error).message, variant: "destructive" });
    }
  });

  const unfavoriteMutation = useMutation({
    mutationFn: (roteiro: RoteiroDetalhado) => unfavoriteRoteiro(roteiro.id, userId!),
    onSuccess: () => {
      toast({ title: "Roteiro desfavoritado." });
      queryClient.invalidateQueries({ queryKey: roteirosQueryKey });
    },
    onError: (err) => {
      toast({ title: "Erro ao desfavoritar", description: (err as Error).message, variant: "destructive" });
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este roteiro?")) {
      deleteRoteiroMutation.mutate(id);
    }
  };

  const handleFavoriteToggle = (roteiro: RoteiroDetalhado) => {
    if (roteiro.isFavorited) {
      unfavoriteMutation.mutate(roteiro);
    } else {
      favoriteMutation.mutate(roteiro);
    }
  };

  const isLoading = (showOnlyFavorites ? isLoadingFavorites : isLoadingMine);
  const isError = (showOnlyFavorites ? isErrorFavorites : isErrorMine);

  if (isLoading && !displayedData.content.length) {
    return (
      <div className="flex justify-center items-center min-h-screen p-6">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen p-6 text-center">
        <p className="text-destructive">Erro ao carregar roteiros. Tente atualizar a página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {showOnlyFavorites ? "Roteiros Favoritos" : "Meus Roteiros"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {showOnlyFavorites 
              ? "Roteiros que você curtiu para ver depois" 
              : "Crie e organize suas atividades de viagem"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showOnlyFavorites ? "default" : "outline"}
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className="gap-2"
          >
            <Heart 
              className={`w-4 h-4 ${showOnlyFavorites ? 'fill-white' : 'fill-red-500 text-red-500'}`} 
            />
            <span className="hidden sm:inline">Favoritos</span>
          </Button>

          <Link to="/roteiros/novo">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Roteiro</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedData.content.map((roteiro) => {
          
          const isFavoriting = (favoriteMutation.isPending || unfavoriteMutation.isPending) && 
                               (favoriteMutation.variables?.id === roteiro.id || unfavoriteMutation.variables?.id === roteiro.id);

          return (
            <Card key={roteiro.id} className="p-5 hover:shadow-medium transition-smooth flex flex-col">
              <div className="space-y-4 flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Map className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate" title={roteiro.title}>{roteiro.title}</h3>
                    {roteiro.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {roteiro.description}
                      </p>
                    )}
                    {roteiro.tags && roteiro.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {roteiro.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {roteiro.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{roteiro.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mt-1 -mr-2"
                    onClick={() => handleFavoriteToggle(roteiro)}
                    disabled={isFavoriting}
                    title={roteiro.isFavorited ? "Desfavoritar" : "Favoritar"}
                  >
                    {isFavoriting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart 
                        className={`w-4 h-4 transition-colors ${roteiro.isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} 
                      />
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  {roteiro.activities?.length || 0} atividades
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/roteiros/${roteiro.id}/editar`)}
                    title="Editar roteiro"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(roteiro.id)}
                    disabled={deleteRoteiroMutation.isPending && deleteRoteiroMutation.variables === roteiro.id}
                    title="Excluir roteiro"
                  >
                    {deleteRoteiroMutation.isPending && deleteRoteiroMutation.variables === roteiro.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    className="ml-1 h-8 px-3 text-xs gap-1.5"
                    onClick={() => navigate(`/roteiros/${roteiro.id}/criar-itinerario`)}
                  >
                    <ArrowRight className="w-3 h-3" />
                    Itinerário
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {displayedData.content.length > 0 && (
         <PaginationControl 
           currentPage={page} 
           totalPages={displayedData.totalPages} 
           onPageChange={setPage} 
         />
      )}

      {displayedData.content.length === 0 && !isLoading && (
        <Card className="p-12 text-center space-y-4 border-dashed bg-muted/20">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Map className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              {showOnlyFavorites ? "Nenhum favorito encontrado" : "Nenhum roteiro encontrado"}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {showOnlyFavorites 
                ? "Você ainda não favoritou nenhum roteiro. Explore a comunidade para encontrar inspiração!" 
                : "Você ainda não criou nenhum roteiro. Comece agora para planejar sua próxima viagem."}
            </p>
          </div>
          {!showOnlyFavorites && (
            <Link to="/roteiros/novo">
              <Button className="mt-2 gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeiro Roteiro
              </Button>
            </Link>
          )}
        </Card>
      )}
    </div>
  );
};

export default Roteiros;