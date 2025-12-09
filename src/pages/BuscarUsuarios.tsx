import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User as UserIcon, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
// Importe a função de busca do serviço correto (ajuste o caminho se necessário)
import { api } from "@/services/api/api"; 
// import { searchUsers } from "@/services/api/userService"; // Se tiver esse serviço criado
import { useDebounce } from "@/hooks/useDebounce";

// Tipagem para o usuário retornado na busca
type Profile = {
  id: number;
  name: string;
  profilePhotoUrl?: string;
  bio?: string;
  interests?: string[];
};

const BuscarUsuarios = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: results = [],
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ["users", "search", debouncedSearch],
    queryFn: async () => {
        // Chamada direta à API Java se não tiver o serviço searchUsers exportado
        const response = await api.get<Profile[]>("/users/search", {
            params: { query: debouncedSearch }
        });
        return response.data;
    },
    enabled: debouncedSearch.length >= 2,
    // Filtra o próprio usuário para não aparecer na busca
    select: (data) => data.filter((u) => u.id !== user?.id),
  });

  const isSearching = (isLoading || isFetching) && debouncedSearch.length >= 2;
  const hasSearched = debouncedSearch.length >= 2;

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Buscar Usuários</h1>
        <p className="text-muted-foreground mt-1">
          Encontre outros viajantes com interesses em comum
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Digite o nome do usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white dark:bg-card"
        />
      </div>

      {isSearching && (
        <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Buscando...
        </div>
      )}

      {!isSearching && hasSearched && results.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <UserIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Nenhum usuário encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Tente buscar por outro nome
          </p>
        </Card>
      )}

      {!isSearching && results.length > 0 && (
        <div className="space-y-3">
          {results.map((profile) => (
            <Card
              key={profile.id}
              className="p-4 cursor-pointer hover:shadow-medium transition-smooth"
              // CORREÇÃO AQUI: Navegar para a rota dinâmica /usuarios/:id
              onClick={() => navigate(`/usuarios/${profile.id}`)}
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12 border border-border">
                  <AvatarImage src={profile.profilePhotoUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate text-base">{profile.name}</h3>

                  {profile.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {profile.bio}
                    </p>
                  )}

                  {profile.interests && profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {profile.interests.slice(0, 3).map((interest, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-[10px] px-2 py-0 h-5 font-normal"
                        >
                          {interest}
                        </Badge>
                      ))}
                      {profile.interests.length > 3 && (
                        <span className="text-[10px] text-muted-foreground flex items-center px-1">
                          +{profile.interests.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!hasSearched && !isSearching && (
        <Card className="p-8 text-center border-dashed bg-muted/30">
          <div className="w-16 h-16 rounded-full bg-background border mx-auto flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Buscar usuários</h3>
          <p className="text-sm text-muted-foreground">
            Digite pelo menos 2 caracteres para iniciar a busca
          </p>
        </Card>
      )}
    </div>
  );
};

export default BuscarUsuarios;