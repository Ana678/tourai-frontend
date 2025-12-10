import { useState, useEffect } from "react";
import { Plus, Loader2, MapPin, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchAtividades, Page, Atividade } from "@/services/api/roteirosService";
import { PaginationControl } from "@/components/common/PaginationControl";

// Hook simples de debounce para evitar muitas requisições
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Atividades = () => {
  const { user } = useAuth();
  const userId = user?.id;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 9; 

  // Aplica o debounce no termo de busca (espera 500ms)
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Reseta para a página 0 quando a busca muda
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  // 1. BUSCAR ATIVIDADES (No Backend)
  const {
    data: atividadesPage,
    isLoading,
    isError,
    isPlaceholderData
  } = useQuery<Page<Atividade>>({
    // Adicionamos debouncedSearch na chave para recarregar quando mudar
    queryKey: ["atividades", userId, page, debouncedSearch],
    // Passamos o termo de busca para o serviço
    queryFn: () => fetchAtividades(userId!, page, pageSize, debouncedSearch),
    enabled: !!userId,
    placeholderData: keepPreviousData, 
  });

  const atividades = atividadesPage?.content || [];
  const totalPages = atividadesPage?.totalPages || 0;

  // Loading inicial (sem dados na tela e não é uma troca de página)
  if (isLoading && !isPlaceholderData && !atividades.length) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Minhas Atividades</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas atividades de viagem
          </p>
        </div>
        <Link to="/atividades/nova">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Atividade</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </Link>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar atividades por nome"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-white dark:bg-card"
        />
      </div>

      {/* Lista de atividades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {atividades.map((atividade) => (
          <Card key={atividade.id} className="p-5 hover:shadow-medium transition-smooth flex flex-col">
            <div className="space-y-4 flex-1">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 truncate" title={atividade.name}>
                    {atividade.name}
                  </h3>
                  {atividade.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {atividade.description}
                    </p>
                  )}
                  {atividade.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{atividade.location}</span>
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

      {/* Paginação */}
      {atividades.length > 0 && (
        <PaginationControl 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}

      {/* Empty State */}
      {atividades.length === 0 && !isLoading && (
        <Card className="p-8 text-center space-y-4 border-dashed bg-muted/20">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            {searchTerm ? <Search className="w-8 h-8 text-muted-foreground" /> : <Plus className="w-8 h-8 text-muted-foreground" />}
          </div>
          <div>
            <h3 className="font-semibold mb-2">
              {searchTerm ? "Nenhuma atividade encontrada" : "Nenhuma atividade criada"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchTerm 
                ? `Não encontramos nada para "${searchTerm}". Tente outro termo.` 
                : "Crie sua primeira atividade para incluir nos seus roteiros personalizados."}
            </p>
          </div>
          {!searchTerm && (
            <Link to="/atividades/nova">
              <Button className="mt-2 gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeira Atividade
              </Button>
            </Link>
          )}
        </Card>
      )}
    </div>
  );
};

export default Atividades;