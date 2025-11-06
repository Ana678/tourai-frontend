import { Fragment } from "react";
import { Heart, MessageCircle, Send, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import {
  useGetPosts,
  useAddLike,
  useRemoveLike,
} from "@/services/api/postsService";


const LOGGED_IN_USER_ID = 1; // TODO: mudar para o id do usuário logado

const Posts = () => {
  const { toast } = useToast();

  const {
    data, 
    isLoading, 
    isError,
    error,
    fetchNextPage, 
    hasNextPage,
    isFetchingNextPage,
  } = useGetPosts(); 


  const { mutate: addLike } = useAddLike();
  const { mutate: removeLike } = useRemoveLike();


  const handleLikeClick = (postId: number) => {
    addLike(
      { postId, userId: LOGGED_IN_USER_ID },
      {
        onError: (err: any) => {
          if (err?.response?.status === 409) {
            handleUnlikeClick(postId);
          } else {
            toast({ title: "Erro ao curtir", variant: "destructive" });
          }
        },
      }
    );
  };

  const handleUnlikeClick = (postId: number) => {
    removeLike({ postId, userId: LOGGED_IN_USER_ID });
  };

  if (isLoading) {
    return <div className="min-h-screen p-6">Carregando...</div>;
  }

  if (isError) {
    return (
      <div className="min-h-screen p-6">
        Erro ao carregar publicações: {error.message}
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Postagens</h1>
            <p className="text-muted-foreground mt-1">
              Compartilhe suas experiências de viagem
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/posts/new">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Postagem</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="p-4 sm:px-6 max-w-2xl mx-auto space-y-6">
        {posts.length === 0 && !isLoading ? ( 
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma publicação ainda</p>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="overflow-hidden shadow-soft">
              <div className="p-4 flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={post.user?.avatar_url || undefined} />
                  <AvatarFallback>{post.user?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {post.user?.name || "Usuário"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.postDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-3">
                <p className="text-sm">{post.content}</p>
              </div>

              {post.mediaUrl && (
                <img
                  src={post.mediaUrl}
                  alt="Post"
                  className="w-full object-cover max-h-96"
                />
              )}

              <div className="px-4 py-3 flex items-center gap-4 border-b border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleLikeClick(post.id)} 
                >
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">{post.postLikes || 0}</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post.commentsCount || 0}</span>
                </Button>
              </div>

              <div className="p-4 flex items-center gap-2">
                <Input
                  placeholder="Adicionar um comentário..."
                  className="flex-1"
                />
                <Button size="sm" variant="ghost">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
        <div className="flex justify-center py-4">
          {hasNextPage && (
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="outline"
            >
              {isFetchingNextPage ? "Carregando..." : "Carregar Mais"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Posts;