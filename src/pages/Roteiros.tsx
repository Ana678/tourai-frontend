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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteRoteiro,
  favoriteRoteiro,
  unfavoriteRoteiro,
} from "@/services/api/roteirosService";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api/api";
import { useMemo, useState } from "react";

type RoteiroDetalhado = {
  id: string;
  title: string;
  description: string | null;
  tags?: string[];
  activities: Array<{ id: string }>;
  isFavorited?: boolean;
};

type OptimisticFavoriteContext = {
  previousMine?: RoteiroDetalhado[];
  previousFavorites?: RoteiroDetalhado[];
};


const Roteiros = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const roteirosQueryKey = ["roteiros", userId];

  const {
    data: myRoteiros = [],
    isLoading: isLoadingMine,
    isError: isErrorMine,
  } = useQuery<RoteiroDetalhado[]>({
    queryKey: [roteirosQueryKey, "mine"],
    queryFn: async () => {
      if (!userId) return [];
      const response = await api.get('/roadmaps/mine', {
        params: { userId }
      });
      return response.data;
    },
    enabled: !!userId,
  });


  const {
    data: favoriteRoteiros = [],
    isLoading: isLoadingFavorites,
    isError: isErrorFavorites,
  } = useQuery<RoteiroDetalhado[]>({
    queryKey: [roteirosQueryKey, "favorites"],
    queryFn: async () => {
      if (!userId) return [];
      const response = await api.get('/roadmaps/favorites', {
        params: { userId }
      });
      return response.data;
    },
    enabled: !!userId,
  });


  const favoriteIds = useMemo(() => {
    return new Set(favoriteRoteiros.map((r) => r.id));
  }, [favoriteRoteiros]);

  const processedRoteiros = useMemo(() => {
    return myRoteiros.map((roteiro) => ({
      ...roteiro,
      isFavorited: favoriteIds.has(roteiro.id),
    }));
  }, [myRoteiros, favoriteIds]);

  const displayedRoadmaps = useMemo(() => {
    if (showOnlyFavorites) {
      return favoriteRoteiros.map(r => ({ ...r, isFavorited: true }));
    }

    return processedRoteiros;
  }, [processedRoteiros, favoriteRoteiros, showOnlyFavorites]);

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
    onMutate: async (roteiroToFavorite): Promise<OptimisticFavoriteContext> => {

      await queryClient.cancelQueries({ queryKey: roteirosQueryKey });
      const previousMine = queryClient.getQueryData<RoteiroDetalhado[]>([roteirosQueryKey, "mine"]);
      const previousFavorites = queryClient.getQueryData<RoteiroDetalhado[]>([roteirosQueryKey, "favorites"]);
      if (previousMine) {
        queryClient.setQueryData<RoteiroDetalhado[]>(
          [roteirosQueryKey, "mine"],
          (old) => old?.map(r =>
            r.id === roteiroToFavorite.id ? { ...r, isFavorited: true } : r
          ) || []
        );
      }

      if (previousFavorites) {
        queryClient.setQueryData<RoteiroDetalhado[]>(
          [roteirosQueryKey, "favorites"],
          (old) => [...(old || []), { ...roteiroToFavorite, isFavorited: true }]
        );
      }
      
      return { previousMine, previousFavorites };
    },
    onError: (err, variables, context) => {
      if (context?.previousMine) {
        queryClient.setQueryData([roteirosQueryKey, "mine"], context.previousMine);
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData([roteirosQueryKey, "favorites"], context.previousFavorites);
      }
      toast({ title: "Erro ao favoritar", description: (err as Error).message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: roteirosQueryKey });
    },
    onSuccess: () => {
      toast({ title: "Roteiro favoritado!" });
    }
  });

  const unfavoriteMutation = useMutation({
    mutationFn: (roteiro: RoteiroDetalhado) => unfavoriteRoteiro(roteiro.id, userId!),
    onMutate: async (roteiroToUnfavorite): Promise<OptimisticFavoriteContext> => {
      await queryClient.cancelQueries({ queryKey: roteirosQueryKey });

      const previousMine = queryClient.getQueryData<RoteiroDetalhado[]>([roteirosQueryKey, "mine"]);
      const previousFavorites = queryClient.getQueryData<RoteiroDetalhado[]>([roteirosQueryKey, "favorites"]);

      if (previousMine) {
        queryClient.setQueryData<RoteiroDetalhado[]>(
          [roteirosQueryKey, "mine"],
          (old) => old?.map(r =>
            r.id === roteiroToUnfavorite.id ? { ...r, isFavorited: false } : r
          ) || []
        );
      }

      if (previousFavorites) {
        queryClient.setQueryData<RoteiroDetalhado[]>(
          [roteirosQueryKey, "favorites"],
          (old) => old?.filter(r => r.id !== roteiroToUnfavorite.id) || []
        );
      }

      return { previousMine, previousFavorites };
    },
    onError: (err, variables, context) => {
      if (context?.previousMine) {
        queryClient.setQueryData([roteirosQueryKey, "mine"], context.previousMine);
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData([roteirosQueryKey, "favorites"], context.previousFavorites);
      }
      toast({ title: "Erro ao desfavoritar", description: (err as Error).message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: roteirosQueryKey });
    },
    onSuccess: () => {
      toast({ title: "Roteiro desfavoritado." });
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

  const isLoading = isLoadingMine || isLoadingFavorites;
  const isError = isErrorMine || isErrorFavorites;

  if (isLoading) {
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
          <h1 className="text-2xl sm:text-3xl font-bold">Meus Roteiros</h1>
          <p className="text-muted-foreground mt-1">
            Crie e organize suas atividades de viagem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showOnlyFavorites ? "default" : "outline"}
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className="gap-2"
          >
            <Heart 
              className="w-4 h-4 fill-red-500 text-red-500" 
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedRoadmaps.map((roteiro) => {
          
          const isFavoriting = (favoriteMutation.isPending || unfavoriteMutation.isPending) && 
                               (favoriteMutation.variables?.id === roteiro.id || unfavoriteMutation.variables?.id === roteiro.id);

          return (
            <Card key={roteiro.id} className="p-5 hover:shadow-medium transition-smooth">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Map className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">{roteiro.title}</h3>
                    {roteiro.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {roteiro.description}
                      </p>
                    )}
                    {roteiro.tags && roteiro.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {roteiro.tags.slice(0, 4).map((tag, index) => (
                          <Badge key={index} variant="default" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {roteiro.tags.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{roteiro.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFavoriteToggle(roteiro)}
                    disabled={isFavoriting}
                    title={roteiro.isFavorited ? "Desfavoritar" : "Favoritar"}
                    className="flex-shrink-0"
                  >
                    {isFavoriting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart 
                        className={`w-4 h-4 ${roteiro.isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                      />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {roteiro.activities?.length || 0} {roteiro.activities?.length === 1 ? 'atividade' : 'atividades'}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/roteiros/${roteiro.id}/editar`)}
                      title="Editar roteiro"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate(`/roteiros/${roteiro.id}/criar-itinerario`)}
                      title="Converter em itinerário"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Converter
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(roteiro.id)}
                      disabled={deleteRoteiroMutation.isPending && deleteRoteiroMutation.variables === roteiro.id}
                      title="Excluir roteiro"
                    >
                      {deleteRoteiroMutation.isPending && deleteRoteiroMutation.variables === roteiro.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {displayedRoadmaps.length === 0 && !isLoading && (
        <Card className="p-8 text-center space-y-4 border-dashed">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Map className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">
              {showOnlyFavorites ? "Nenhum roteiro favoritado" : "Nenhum roteiro criado"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {showOnlyFavorites 
                ? "Adicione roteiros aos seus favoritos para vê-los aqui." 
                : "Crie seu primeiro roteiro com atividades para sua viagem."}
            </p>
          </div>
          {!showOnlyFavorites && (
            <Link to="/roteiros/novo">
              <Button className="gap-2">
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