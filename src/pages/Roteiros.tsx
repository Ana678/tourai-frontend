import { Plus, Map, Trash2, ArrowRight, Loader2, Edit } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRoteiro } from "@/services/api/roteirosService";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api/api";

type RoteiroDetalhado = {
  id: string;
  title: string;
  description: string | null;
  tags?: string[];
  activities: Array<{ id: string }>;
};

const Roteiros = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar roteiros com detalhes completos
  const {
    data: roteiros = [],
    isLoading,
    isError,
  } = useQuery<RoteiroDetalhado[]>({
    queryKey: ["roteiros", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await api.get('/roadmaps/mine', {
        params: { userId }
      });
      return response.data;
    },
    enabled: !!userId,
  });

  // Mutação para deletar roteiro
  const deleteRoteiroMutation = useMutation({
    mutationFn: (id: string) => deleteRoteiro(id, userId!),
    onSuccess: () => {
      toast({ title: "Roteiro excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["roteiros", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir roteiro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este roteiro?")) {
      deleteRoteiroMutation.mutate(id);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Meus Roteiros</h1>
          <p className="text-muted-foreground mt-1">
            Crie e organize suas atividades de viagem
          </p>
        </div>
        <Link to="/roteiros/novo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Roteiro</span>
          </Button>
        </Link>
      </div>

      {/* Lista de roteiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roteiros.map((roteiro) => (
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
                  
                  {/* Tags do Roteiro */}
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
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {roteiro.activities?.length || 0} {roteiro.activities?.length === 1 ? 'atividade' : 'atividades'}
                </span>
                
                <div className="flex items-center gap-2">
                  {/* Botão Editar */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/roteiros/${roteiro.id}/editar`)}
                    title="Editar roteiro"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  {/* Botão Converter */}
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

                  {/* Botão Deletar */}
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
        ))}
      </div>

      {/* Empty state */}
      {roteiros.length === 0 && !isLoading && (
        <Card className="p-8 text-center space-y-4 border-dashed">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Nenhum roteiro criado</h3>
            <p className="text-sm text-muted-foreground">
              Crie seu primeiro roteiro com atividades para sua viagem
            </p>
          </div>
          <Link to="/roteiros/novo">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeiro Roteiro
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
};

export default Roteiros;