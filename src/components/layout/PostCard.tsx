import { useState } from "react";
import { Heart, MessageCircle, Send, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import { PostResponse } from "@/services/api/postsService";

import {
  useHasUserLiked,
  useAddLike,
  useRemoveLike,
  useGetComments,
  useCreateComment,
} from "@/services/api/postsService";

interface PostCardProps {
  post: PostResponse;
  currentUserId: number;
}

export const PostCard = ({ post, currentUserId }: PostCardProps) => {
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { data: hasLiked, isLoading: isLoadingLike } = useHasUserLiked(
    post.id,
    currentUserId
  );

  const { mutate: addLike } = useAddLike();
  const { mutate: removeLike } = useRemoveLike();

  const handleLikeClick = () => {
    if (isLoadingLike) return;

    if (hasLiked) {
      removeLike({ postId: post.id, userId: currentUserId });
    } else {
      addLike({ postId: post.id, userId: currentUserId });
    }
  };

  const {
    data: commentsData,
    isLoading: isLoadingComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetComments(post.id);


  const { mutate: createComment, isPending: isCreatingComment } = useCreateComment();

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    createComment({
      postId: post.id,
      userId: currentUserId,
      content: commentText,
    }, {
      onSuccess: () => {
        setCommentText("");
        setShowComments(true);
      },
      onError: () => {
        toast({ title: "Erro ao enviar comentário", variant: "destructive" });
      }
    });
  };

  const comments = commentsData?.pages.flatMap((page) => page) ?? [];

  return (
    <Card key={post.id} className="overflow-hidden shadow-soft flex flex-col mb-4">
      <div className="p-6 flex items-center gap-4">
        <Avatar className="w-12 h-12 border border-border/50">
          <AvatarImage src={post.user?.avatar_url || undefined} />
          <AvatarFallback className="text-lg">{post.user?.name?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-lg">{post.user?.name || "Usuário"}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(post.postDate).toLocaleDateString("pt-BR", {
                day: '2-digit', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="px-6 pb-6">
        <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {post.content}
        </p>
      </div>

      {post.mediaUrl && !imgError && (
        <Dialog>
          <DialogTrigger asChild>
            <div className="w-full bg-muted/20 cursor-pointer overflow-hidden max-h-[600px] flex items-center justify-center border-t border-b border-border/40">
                <img
                src={post.mediaUrl}
                alt="Post"
                className="w-full h-auto object-cover min-h-[300px] transition-transform hover:scale-[1.01] duration-500"
                onError={() => setImgError(true)}
                />
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-5xl p-0 border-0 bg-transparent shadow-none">
            <div className="relative">
                <DialogClose className="absolute right-3 top-3 z-50 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors focus:outline-none">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Fechar</span>
                </DialogClose>

                <img
                  src={post.mediaUrl}
                  alt="Post"
                  className="w-full h-auto object-contain max-h-[95vh] rounded-lg block"
                />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="px-6 py-5 flex items-center gap-6 border-b border-border mt-auto bg-muted/5">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-3 h-10 hover:bg-muted/50"
          onClick={handleLikeClick}
          disabled={isLoadingLike}
        >
          <Heart
            className={`w-6 h-6 transition-colors ${hasLiked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`}
          />
          <span className="text-base font-medium text-muted-foreground">{post.totalLikes || 0}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-3 h-10 hover:bg-muted/50"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-6 h-6 text-muted-foreground" />
          <span className="text-base font-medium text-muted-foreground">{post.totalComments || 0}</span>
        </Button>
      </div>

      {showComments && (
        <div className="p-6 bg-muted/10">
          <form className="flex items-center gap-3 mb-6" onSubmit={handleCommentSubmit}>
            <Input
              placeholder="Adicionar um comentário..."
              className="flex-1 bg-background shadow-sm h-11"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button size="icon" variant="default" className="h-11 w-11" type="submit" disabled={isCreatingComment}>
              <Send className="w-5 h-5" />
            </Button>
          </form>

          <div className="space-y-5">
            {isLoadingComments && <p className="text-sm text-muted-foreground animate-pulse">Carregando comentários...</p>}

            {comments.map(comment => (
              <div key={comment.id} className="flex gap-4 text-sm group">
                <Avatar className="w-9 h-9 mt-1">
                  <AvatarImage src={comment.commentator?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{comment.commentator?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-background p-4 rounded-xl border shadow-sm">
                  <span className="font-semibold block text-sm mb-1 text-primary">{comment.commentator?.name}</span>
                  <span className="text-foreground/90 text-base leading-snug">{comment.content}</span>
                </div>
              </div>
            ))}

            {hasNextPage && (
              <Button
                variant="link"
                size="sm"
                className="text-sm w-full mt-2 h-auto py-2"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Carregando..." : "Ver mais comentários"}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};