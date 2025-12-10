import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Map, Calendar, MessageSquare, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/api";
import { followService } from "@/services/api/followService";

// ... (Tipos Profile, Post, GeneralStats mantidos) ...
type Profile = {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  bio?: string;
  interests?: string[];
};

type Post = {
  id: number;
  content: string;
  imageUrl?: string;
  createdAt: string;
};

type GeneralStats = {
  roteiros: number;
  itinerarios: number;
  postagens: number;
}

const PerfilPublico = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const targetUserId = Number(id);
  const isOwnProfile = user?.id === targetUserId;

  useEffect(() => {
    if (isOwnProfile) {
      navigate("/perfil");
    }
  }, [isOwnProfile, navigate]);

  // ... (Queries e Mutations mantidas iguais) ...
  const { data: profile, isLoading: loadingProfile } = useQuery<Profile>({
    queryKey: ["public-profile", targetUserId],
    queryFn: async () => {
      const res = await api.get(`/users/${targetUserId}`);
      return res.data;
    },
    enabled: !!targetUserId && !isOwnProfile,
  });

  const { data: followStats, isLoading: loadingFollow } = useQuery({
    queryKey: ["follow-stats", targetUserId, user?.id],
    queryFn: () => followService.getStats(targetUserId, user?.id),
    enabled: !!targetUserId && !isOwnProfile,
  });

  const { data: generalStats } = useQuery<GeneralStats>({
    queryKey: ["user-general-stats", targetUserId],
    queryFn: async () => {
      const res = await api.get(`/users/${targetUserId}/stats`);
      return res.data;
    },
    enabled: !!targetUserId && !isOwnProfile,
  });

  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ["user-posts", targetUserId],
    queryFn: async () => {
      try {
        const res = await api.get(`/posts`, { params: { userId: targetUserId } });
        return res.data.content || res.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!targetUserId && !isOwnProfile,
  });

  const followMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("Login necessário");
      if (followStats?.isFollowing) {
        return followService.unfollowUser(targetUserId, user.id);
      }
      return followService.followUser(targetUserId, user.id);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["follow-stats", targetUserId, user?.id] });
      const previousStats = queryClient.getQueryData(["follow-stats", targetUserId, user?.id]);

      queryClient.setQueryData(["follow-stats", targetUserId, user?.id], (old: any) => ({
        ...old,
        isFollowing: !old.isFollowing,
        followersCount: old.isFollowing ? old.followersCount - 1 : old.followersCount + 1
      }));

      return { previousStats };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["follow-stats", targetUserId, user?.id], context?.previousStats);
      toast({ title: "Erro", description: "Não foi possível realizar a ação.", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-stats", targetUserId, user?.id] });
    },
    onSuccess: () => {
        toast({ 
            title: followStats?.isFollowing ? "Deixou de seguir" : "Agora você segue este usuário" 
        });
    }
  });

  if (loadingProfile || loadingFollow) {
    return <div className="min-h-screen p-6 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <p>Perfil não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* CORREÇÃO: Header com Gradiente e Botão Voltar Posicionado */}
      <div className="relative h-48 gradient-primary">
        <div className="absolute top-4 left-4 z-10">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate(-1)} 
            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>

      <div className="px-4 sm:px-6 -mt-16 relative z-20">
        <Card className="p-6 shadow-medium bg-background">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <Avatar className="w-32 h-32 border-4 border-background shadow-sm">
              <AvatarImage src={profile.profilePhotoUrl || undefined} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-4xl font-semibold">
                {profile.name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
            </div>

            {/* Stats de Seguidores */}
            <div className="flex items-center gap-8 text-sm py-2">
              <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="font-bold text-lg">{followStats?.followersCount || 0}</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Seguidores</div>
              </div>
              <div className="w-px h-8 bg-border/50"></div>
              <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="font-bold text-lg">{followStats?.followingCount || 0}</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Seguindo</div>
              </div>
            </div>

            {/* Botão de Ação */}
            {user && !isOwnProfile && (
              <Button 
                onClick={() => followMutation.mutate()} 
                variant={followStats?.isFollowing ? "outline" : "default"}
                className={`gap-2 transition-all min-w-[140px] ${followStats?.isFollowing ? 'border-primary/20 hover:bg-primary/5' : 'shadow-md hover:shadow-lg'}`}
                disabled={followMutation.isPending}
              >
                {followMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : followStats?.isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Seguindo
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Seguir
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Grid de Stats Gerais (Roteiros/Itinerários/Posts) */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center hover:shadow-md transition-all border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                <Map className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-foreground">{generalStats?.roteiros || 0}</div>
              <div className="text-xs text-muted-foreground font-medium">Roteiros</div>
            </div>
          </Card>
          <Card className="p-4 text-center hover:shadow-md transition-all border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-foreground">{generalStats?.itinerarios || 0}</div>
              <div className="text-xs text-muted-foreground font-medium">Itinerários</div>
            </div>
          </Card>
          <Card className="p-4 text-center hover:shadow-md transition-all border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-foreground">{generalStats?.postagens || 0}</div>
              <div className="text-xs text-muted-foreground font-medium">Postagens</div>
            </div>
          </Card>
        </div>

        {/* Bio */}
        {profile.bio && (
          <Card className="p-6 border-border/50 shadow-sm">
            <h2 className="font-semibold mb-3 text-lg flex items-center gap-2">
                Sobre
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          </Card>
        )}

        {/* Interesses */}
        {profile.interests && profile.interests.length > 0 && (
          <Card className="p-6 border-border/50 shadow-sm">
            <h2 className="font-semibold mb-4 text-lg">Interesses de Viagem</h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interesse: string, index: number) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="px-3 py-1.5 font-normal text-sm bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  {interesse}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Postagens Recentes */}
        {posts.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg px-1">Postagens Recentes</h2>
            {posts.map((post) => (
              <Card key={post.id} className="p-4 overflow-hidden hover:shadow-md transition-shadow border-border/50">
                <p className="text-sm mb-3 leading-relaxed">{post.content}</p>
                {post.imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-border/50 mb-3">
                    <img 
                      src={post.imageUrl} 
                      alt="Post" 
                      className="w-full max-h-80 object-cover hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
                  <span>{new Date(post.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilPublico;