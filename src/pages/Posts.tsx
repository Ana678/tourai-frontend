import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetPosts } from "@/services/api/postsService";
import { PostCard } from "@/components/layout/PostCard"; 
import { CreatePostDialog } from "@/components/layout/CreatePostDialog"; 
import { useAuth } from "@/hooks/useAuth";

const Posts = () => {

  const { user } = useAuth();

  console.log("Current User in Posts:", user);

  const {
    data, 
    isLoading, 
    isError,
    error,
    fetchNextPage, 
    hasNextPage,
    isFetchingNextPage,
  } = useGetPosts(); 

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
          <CreatePostDialog currentUserId={user?.id}>
            <Button className="gap-2">
                <Plus className="w-4 h-1" />
                <span className="hidden sm:inline">Nova Postagem</span>
            </Button>
          </CreatePostDialog>
        </div>
      </div>

      <div className="p-4 sm:px-6 max-w-5xl mx-auto space-y-6">
        {posts.length === 0 && !isLoading ? ( 
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma publicação ainda</p>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={user?.id} 
            />
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