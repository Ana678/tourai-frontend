import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Map, Calendar, MessageSquare, UserPlus, UserMinus, Loader2, Link as LinkIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/api";
import { followService } from "@/services/api/followService";
import { ItineraryCard } from "@/components/cards/ItineraryCard";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  bio?: string;
  interests?: string[];
  createdAt?: string;
}

const PerfilPublico = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const targetUserId = Number(id);
  const isOwnProfile = currentUser?.id === targetUserId;

  // Redirecionar se for o próprio perfil
  useEffect(() => {
    if (isOwnProfile) {
      navigate("/perfil");
    }
  }, [isOwnProfile, navigate]);

  // 1. Buscar Perfil do Usuário
  const { data: profile, isLoading: loadingProfile } = useQuery<UserProfile>({
    queryKey: ["public-profile", targetUserId],
    queryFn: async () => {
      const res = await api.get(`/users/${targetUserId}`);
      return res.data;
    },
    enabled: !!targetUserId && !isOwnProfile
  });

  // 2. Buscar Estatísticas de Follow
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["follow-stats", targetUserId],
    queryFn: () => followService.getStats(targetUserId, currentUser?.id),
    enabled: !!targetUserId && !isOwnProfile
  });

  // 3. Buscar Roteiros do Usuário
  const { data: roteiros = [], isLoading: loadingRoteiros } = useQuery({
    queryKey: ["user-roadmaps", targetUserId],
    queryFn: async () => {
      // Ajuste para usar o endpoint correto de listar roteiros de um usuário
      const res = await api.get(`/roadmaps/mine`, { params: { userId: targetUserId } });
      // Se a resposta for paginada, pegamos .content, senão .data
      return res.data.content || res.data; 
    },
    enabled: !!targetUserId && !isOwnProfile
  });

  // 4. Buscar Estatísticas Gerais (opcional, pode vir do backend num endpoint de dashboard)
  const { data: userStats } = useQuery({
    queryKey: ["user-general-stats", targetUserId],
    queryFn: async () => {
      const res = await api.get(`/users/${targetUserId}/stats`);
      return res.data; // Espera { roteiros: 0, itinerarios: 0, postagens: 0 }
    },
    enabled: !!targetUserId && !isOwnProfile
  });

  // Mutação para Seguir/Deixar de Seguir
  const followMutation = useMutation({
    mutationFn: () => {
      if (stats?.isFollowing) {
        return followService.unfollow(targetUserId, currentUser!.id);
      }
      return followService.follow(targetUserId, currentUser!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-stats", targetUserId] });
      toast({
        title: stats?.isFollowing ? "Deixou de seguir" : "Seguindo!",
        description: stats?.isFollowing 
          ? `Você deixou de seguir ${profile?.name}` 
          : `Você agora segue ${profile?.name}`
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível realizar a ação.",
        variant: "destructive"
      });
    }
  });

  if (loadingProfile || loadingStats) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!profile) {
    return <div className="p-8 text-center">Usuário não encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header/Capa */}
      <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/5">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-4 top-4 bg-background/50 hover:bg-background/80"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="container px-4 -mt-20">
        <Card className="border-none shadow-lg">
          <CardContent className="pt-0 relative">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center -mt-16 mb-4">
              <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                <AvatarImage src={profile.profilePhotoUrl} />
                <AvatarFallback className="text-4xl">{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <h1 className="text-2xl font-bold mt-2">{profile.name}</h1>
              {profile.bio && <p className="text-muted-foreground text-center max-w-md mt-1">{profile.bio}</p>}
              
              {/* Botão de Seguir */}
              {currentUser && (
                <Button 
                  className="mt-4 gap-2 min-w-[140px]"
                  variant={stats?.isFollowing ? "outline" : "default"}
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                >
                  {stats?.isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Seguindo
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Seguir
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4 border-y py-4 mb-6">
              <div className="text-center">
                <div className="font-bold text-lg">{stats?.followersCount || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Seguidores</div>
              </div>
              <div className="text-center border-x">
                <div className="font-bold text-lg">{stats?.followingCount || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Seguindo</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{userStats?.roteiros || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Roteiros</div>
              </div>
            </div>

            {/* Interesses */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="mb-8 text-center">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Interesses</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {profile.interests.map(interest => (
                    <Badge key={interest} variant="secondary" className="px-3 py-1">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Roteiros */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Map className="h-5 w-5" />
                Roteiros Públicos
              </h2>
              
              {loadingRoteiros ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
              ) : roteiros.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {roteiros.map((roteiro: any) => (
                    <ItineraryCard 
                      key={roteiro.id}
                      id={Number(roteiro.id)}
                      title={roteiro.title}
                      author={profile.name}
                      authorImage={profile.profilePhotoUrl}
                      image="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1" // Placeholder
                      likes={0}
                      comments={0}
                      days={3}
                      location={roteiro.tags?.[0] || "Destino"}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Nenhum roteiro público encontrado.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerfilPublico;