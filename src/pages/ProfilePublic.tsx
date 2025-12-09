import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Map, Calendar, MessageSquare, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Importante para os interesses
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/api";
import { followService } from "@/services/api/followService";

// Tipos compatíveis com o Java
type Profile = {
  id: number;
  name: string;
  email: string;
  profilePhotoUrl?: string; // Java usa profilePhotoUrl, não avatar_url
  bio?: string;
  interests?: string[]; // Java usa interests
};

type Post = {
  id: number;
  content: string; // Adaptar conforme seu DTO Java (texto/content)
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

  // Redireciona se for o próprio usuário
  useEffect(() => {
    if (isOwnProfile) {
      navigate("/perfil");
    }
  }, [isOwnProfile, navigate]);

  // 1. BUSCAR PERFIL (JAVA)
  const { data: profile, isLoading: loadingProfile } = useQuery<Profile>({
    queryKey: ["public-profile", targetUserId],
    queryFn: async () => {
      const res = await api.get(`/users/${targetUserId}`);
      return res.data;
    },
    enabled: !!targetUserId && !isOwnProfile,
  });

  // 2. BUSCAR STATS DE FOLLOW (Seguidores/Seguindo)
  const { data: followStats, isLoading: loadingFollow } = useQuery({
    queryKey: ["follow-stats", targetUserId, user?.id],
    queryFn: () => followService.getStats(targetUserId, user?.id),
    enabled: !!targetUserId && !isOwnProfile,
  });

  // 3. BUSCAR STATS GERAIS (Roteiros/Posts/Itinerários)
  const { data: generalStats } = useQuery<GeneralStats>({
    queryKey: ["user-general-stats", targetUserId],
    queryFn: async () => {
      const res = await api.get(`/users/${targetUserId}/stats`);
      return res.data;
    },
    enabled: !!targetUserId && !isOwnProfile,
  });

  // 4. BUSCAR POSTS (Opcional - Adicionar endpoint no Java se não existir)
  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ["user-posts", targetUserId],
    queryFn: async () => {
      // Assumindo endpoint padrão. Se não tiver, retorna array vazio para não quebrar a tela.
      try {
        const res = await api.get(`/posts`, { params: { userId: targetUserId } });
        return res.data.content || res.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!targetUserId && !isOwnProfile,
  });

  // MUTATION: SEGUIR / DEIXAR DE SEGUIR
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
        // Feedback visual opcional
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
      {/* Header com Gradiente (Preservado do Lovable) */}
      <div className="gradient-primary p-6 sm:p-8 pb-20">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="gap-2 bg-white/20 hover:bg-white/30 text-white border-none">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      <div className="px-4 sm:px-6 -mt-12">
        <Card className="p-6 shadow-medium">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src={profile.profilePhotoUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {profile.name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              {/* Opcional: Mostrar Bio curta aqui se quiser */}
            </div>

            {/* Stats de Seguidores */}
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-bold">{followStats?.followersCount || 0}</div>
                <div className="text-muted-foreground">Seguidores</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{followStats?.followingCount || 0}</div>
                <div className="text-muted-foreground">Seguindo</div>
              </div>
            </div>

            {/* Botão de Ação */}
            {user && !isOwnProfile && (
              <Button 
                onClick={() => followMutation.mutate()} 
                variant={followStats?.isFollowing ? "outline" : "default"}
                className="gap-2 transition-all"
                disabled={followMutation.isPending}
              >
                {followMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : followStats?.isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Deixar de seguir
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

      <div className="p-4 sm:p-6 space-y-6">
        {/* Grid de Stats Gerais (Roteiros/Itinerários/Posts) */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center hover:shadow-sm transition-shadow">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Map className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{generalStats?.roteiros || 0}</div>
              <div className="text-xs text-muted-foreground">Roteiros</div>
            </div>
          </Card>
          <Card className="p-4 text-center hover:shadow-sm transition-shadow">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{generalStats?.itinerarios || 0}</div>
              <div className="text-xs text-muted-foreground">Itinerários</div>
            </div>
          </Card>
          <Card className="p-4 text-center hover:shadow-sm transition-shadow">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{generalStats?.postagens || 0}</div>
              <div className="text-xs text-muted-foreground">Postagens</div>
            </div>
          </Card>
        </div>

        {/* Bio */}
        {profile.bio && (
          <Card className="p-6">
            <h2 className="font-semibold mb-3">Sobre</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          </Card>
        )}

        {/* Interesses */}
        {profile.interests && profile.interests.length > 0 && (
          <Card className="p-6">
            <h2 className="font-semibold mb-3">Interesses de Viagem</h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interesse: string, index: number) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="px-3 py-1 font-normal"
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
            <h2 className="font-semibold text-lg">Postagens Recentes</h2>
            {posts.map((post) => (
              <Card key={post.id} className="p-4 overflow-hidden">
                <p className="text-sm mb-3">{post.content}</p>
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt="Post" 
                    className="w-full rounded-lg max-h-64 object-cover" 
                  />
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilPublico;