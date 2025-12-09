import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetPosts } from "@/services/api/postsService";
import { PostCard } from "@/components/layout/PostCard";
import { CreatePostDialog } from "@/components/layout/CreatePostDialog";
import { useAuth } from "@/hooks/useAuth";

const Posts = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetPosts(user?.id, 5, searchTerm);

  const posts = data?.pages.flatMap((page) => page) ?? [];

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="max-w-3xl mx-auto pt-8 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Postagens</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Compartilhe suas experiências de viagem
            </p>
          </div>
          
          <CreatePostDialog currentUserId={user?.id}>
            <Button className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              <span className="font-medium">Nova Postagem</span>
            </Button>
          </CreatePostDialog>
        </div>

        <div className="relative mb-8">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por texto ou autor..."
              className="pl-11 w-full bg-white border-input h-11 text-base shadow-sm rounded-xl focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-48 animate-pulse bg-muted/20 border-none shadow-sm" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
              Erro ao carregar publicações: {error.message}
            </div>
          ) : posts.length === 0 ? (
            <Card className="p-12 text-center border-dashed shadow-none bg-muted/10">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-muted rounded-full">
                    <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">Nenhum resultado encontrado</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {searchTerm 
                    ? `Não encontramos postagens contendo "${searchTerm}"` 
                    : "Seja o primeiro a compartilhar uma experiência!"}
                </p>
              </div>
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

          <div className="flex justify-center py-6">
            {hasNextPage && (
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
                className="min-w-[150px] shadow-sm"
              >
                {isFetchingNextPage ? "Carregando..." : "Carregar Mais"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Posts;