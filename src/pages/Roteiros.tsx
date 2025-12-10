import { useState } from "react";
import { Plus, Map, Trash2, ArrowRight, Search, Loader2, Edit } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { deleteRoteiro, Page } from "@/services/api/roteirosService";
import { PaginationControl } from "@/components/common/PaginationControl";

// Tipagem compatível com o Backend Java
type Roteiro = {
  id: string;
  title: string;
  description: string | null;
  activities: any[]; 
  owner: { id: number; name: string };
};

const Roteiros = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados de Controle
  const [searchTerm, setSearchTerm] = useState("");
  const [showMine, setShowMine] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 9;

  // 1. BUSCAR ROTEIROS (Integrado ao Java)
  const { 
    data: roteirosPage, 
    isLoading,
    isPlaceholderData
  } = useQuery<Page<Roteiro>>({
    queryKey: ["roteiros", showMine, page, user?.id], 
    queryFn: async () => {
      if (!user) return { content: [], totalPages: 0, totalElements: 0 } as any;

      // Define o endpoint baseado no filtro
      const endpoint = showMine ? "/roadmaps/mine" : "/roadmaps/moderation/pending"; 
      // Nota: Ajuste endpoint "Todos" conforme sua API (ex: /roadmaps ou /roadmaps/public)

      const params = { 
        userId: user.id, 
        page, 
        size: pageSize 
      };

      const response = await api.get<Page<Roteiro>>(endpoint, { params });
      return response.data;
    },
    enabled: !!user,
    placeholderData: keepPreviousData,
  });

  const roteiros = roteirosPage?.content || [];
  const totalPages = roteirosPage?.totalPages || 0;

  // 2. FILTRAGEM LOCAL (Visual)
  const filteredRoteiros = roteiros.filter((r) => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. MUTATION DELETAR
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRoteiro(id, user!.id),
    onSuccess: () => {
      toast({ title: "Roteiro excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["roteiros"] });
    },
    onError: () => {
      toast({ title: "Erro ao excluir roteiro", variant: "destructive" });
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este roteiro?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading && !isPlaceholderData) {
    return (
      <div className="min-h-screen p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Roteiros</h1>
          <p className="text-muted-foreground mt-1">
            {showMine ? "Gerencie suas viagens" : "Explore roteiros da comunidade"}
          </p>
        </div>
        <Link to="/roteiros/novo">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Roteiro</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar roteiros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card bg-white dark:bg-card"
          />
        </div>
        
        <div className="flex gap-2 bg-muted p-1 rounded-lg self-start sm:self-auto">
          <Button
            variant={showMine ? "default" : "ghost"}
            size="sm"
            onClick={() => { setShowMine(true); setPage(0); }}
            className={`flex-1 sm:flex-none ${showMine ? 'shadow-sm' : ''}`}
          >
            Meus roteiros
          </Button>
          <Button
            variant={!showMine ? "default" : "ghost"}
            size="sm"
            onClick={() => { setShowMine(false); setPage(0); }}
            className={`flex-1 sm:flex-none ${!showMine ? 'shadow-sm' : ''}`}
          >
            Todos
          </Button>
        </div>
      </div>

      {/* Lista de Roteiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoteiros.map((roteiro) => (
          <Card key={roteiro.id} className="p-5 hover:shadow-medium transition-smooth flex flex-col justify-between h-full border-border/60">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1" title={roteiro.title}>
                    {roteiro.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {roteiro.description || "Sem descrição."}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ml-3 text-primary">
                  <Map className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                  {roteiro.activities?.length || 0} atividades
                </span>
                
                <div className="flex items-center gap-2">
                  {/* Se for dono: Editar/Excluir/Converter */}
                  {roteiro.owner?.id === user?.id ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/roteiros/${roteiro.id}/editar`)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(roteiro.id)}
                        disabled={deleteMutation.isPending}
                        title="Excluir"
                      >
                        {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                      </Button>
                      
                      <Button 
                        variant="default"
                        size="sm" 
                        className="gap-2 h-8 px-3 text-xs ml-1"
                        onClick={() => navigate(`/roteiros/${roteiro.id}/converter`)}
                      >
                        <ArrowRight className="w-3 h-3" />
                        Converter
                      </Button>
                    </>
                  ) : (
                    // Se não for dono: Botão Converter (texto alterado conforme solicitado)
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-2 h-8 text-xs"
                      onClick={() => navigate(`/roteiros/${roteiro.id}/converter`)}
                    >
                      Converter <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Paginação */}
      {filteredRoteiros.length > 0 && (
        <PaginationControl 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}

      {/* Empty State */}
      {filteredRoteiros.length === 0 && !isLoading && (
        <Card className="p-12 text-center space-y-4 border-dashed bg-muted/20">
          <div className="w-16 h-16 rounded-full bg-background border mx-auto flex items-center justify-center">
            {searchTerm ? <Search className="w-8 h-8 text-muted-foreground" /> : <Plus className="w-8 h-8 text-muted-foreground" />}
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              {searchTerm ? "Nenhum resultado encontrado" : "Vamos começar?"}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {searchTerm 
                ? `Não encontramos nada para "${searchTerm}". Tente outro termo.` 
                : "Crie seu primeiro roteiro para organizar os pontos turísticos da sua próxima viagem."}
            </p>
          </div>
          {!searchTerm && (
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