import { useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react"; 
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
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
    <Card key={post.id} className="overflow-hidden shadow-soft flex flex-col">
      <div className="p-5 flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={post.user?.avatar_url || undefined} />
          <AvatarFallback>{post.user?.name?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-base">{post.user?.name || "Usuário"}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(post.postDate).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="px-5 pb-4">
        <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {post.content}
        </p>
      </div>

      {post.mediaUrl && !imgError && (
        <Dialog>
          <DialogTrigger asChild>
            <div className="w-full bg-muted/20 cursor-pointer overflow-hidden max-h-[500px] flex items-center justify-center">
                <img
                src={post.mediaUrl}
                alt="Post"
                className="w-full h-auto object-cover transition-transform hover:scale-[1.01] duration-300" 
                onError={() => setImgError(true)}
                />
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl p-0 border-0 bg-transparent shadow-none">
            <img
              src={post.mediaUrl}
              alt="Post"
              className="w-full h-auto object-contain max-h-[90vh] rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="px-5 py-4 flex items-center gap-6 border-b border-border mt-auto">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-2 hover:bg-muted/50"
          onClick={handleLikeClick}
          disabled={isLoadingLike}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${hasLiked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`}
          />
          <span className="text-sm font-medium text-muted-foreground">{post.totalLikes || 0}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-2 hover:bg-muted/50"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{post.totalComments || 0}</span>
        </Button>
      </div>

      {showComments && (
        <div className="p-5 bg-muted/5">
          <form className="flex items-center gap-3 mb-5" onSubmit={handleCommentSubmit}>
            <Input
              placeholder="Adicionar um comentário..."
              className="flex-1 bg-background shadow-sm"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button size="icon" variant="secondary" type="submit" disabled={isCreatingComment}>
              <Send className="w-4 h-4" />
            </Button>
          </form>

          <div className="space-y-4">
            {isLoadingComments && <p className="text-xs text-muted-foreground animate-pulse">Carregando comentários...</p>}

            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3 text-sm group">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.commentator?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{comment.commentator?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-background p-3 rounded-lg border shadow-sm">
                  <span className="font-semibold block text-xs mb-1 text-primary">{comment.commentator?.name}</span>
                  <span className="text-foreground/90 leading-snug">{comment.content}</span>
                </div>
              </div>
            ))}

            {hasNextPage && (
              <Button
                variant="link"
                size="sm"
                className="text-xs w-full mt-2"
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