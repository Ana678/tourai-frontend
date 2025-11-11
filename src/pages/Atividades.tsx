import { Plus, Trash2, Edit, Loader2, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api/api";

type Atividade = {
  id: string;
  name: string;
  description?: string;
  location: string;
  tags?: string[];
};

const Atividades = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  // Buscar atividades
  const {
    data: atividades = [],
    isLoading,
    isError,
  } = useQuery<Atividade[]>({
    queryKey: ["atividades", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await api.get('/activities', {
        params: { userId }
      });
      return Array.isArray(response.data) ? response.data : response.data.content || [];
    },
    enabled: !!userId,
  });



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
        <p className="text-destructive">Erro ao carregar atividades. Tente atualizar a página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Minhas Atividades</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas atividades de viagem
          </p>
        </div>
        <Link to="/atividades/nova">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Atividade</span>
          </Button>
        </Link>
      </div>

      {/* Lista de atividades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {atividades.map((atividade) => (
          <Card key={atividade.id} className="p-5 hover:shadow-medium transition-smooth">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">{atividade.name}</h3>
                  {atividade.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {atividade.description}
                    </p>
                  )}
                  {atividade.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {atividade.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              {atividade.tags && atividade.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {atividade.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {atividade.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{atividade.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {atividades.length === 0 && !isLoading && (
        <Card className="p-8 text-center space-y-4 border-dashed">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Nenhuma atividade criada</h3>
            <p className="text-sm text-muted-foreground">
              Crie sua primeira atividade para incluir nos seus roteiros
            </p>
          </div>
          <Link to="/atividades/nova">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Primeira Atividade
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
};

export default Atividades;
