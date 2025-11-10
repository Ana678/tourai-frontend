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
    <Card key={post.id} className="overflow-hidden shadow-soft">
      <div className="p-4 flex items-center gap-3">
        <Avatar>
          <AvatarImage src={post.user?.avatar_url || undefined} />
          <AvatarFallback>{post.user?.name?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-sm">{post.user?.name || "Usuário"}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(post.postDate).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-sm">{post.content}</p>
      </div>

      {post.mediaUrl && (
        <Dialog>
          <DialogTrigger asChild>
            <img
              src={post.mediaUrl}
              alt="Post"
              className="w-full object-cover max-h-96 cursor-pointer" 
            />
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl p-0 border-0">
            <img
              src={post.mediaUrl}
              alt="Post"
              className="w-full h-auto object-contain max-h-[90vh] rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
      <div className="px-4 py-3 flex items-center gap-4 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleLikeClick}
          disabled={isLoadingLike}
        >
          <Heart
            className={`w-5 h-5 ${hasLiked ? 'text-red-500 fill-red-500' : ''}`}
          />
          <span className="text-sm">{post.totalLikes || 0}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.totalComments || 0}</span>
        </Button>
      </div>

      {showComments && (
        <div className="p-4">
          <form className="flex items-center gap-2 mb-4" onSubmit={handleCommentSubmit}>
            <Input
              placeholder="Adicionar um comentário..."
              className="flex-1 bg-background"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button size="sm" variant="ghost" type="submit" disabled={isCreatingComment}>
              <Send className="w-4 h-4" />
            </Button>
          </form>

          <div className="space-y-3">
            {isLoadingComments && <p className="text-xs text-muted-foreground">Carregando comentários...</p>}

            {comments.map(comment => (
              <div key={comment.id} className="flex gap-2 text-sm">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={comment.commentator?.avatar_url || undefined} />
                  <AvatarFallback>{comment.commentator?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <span className="font-semibold mr-2">{comment.commentator?.name}</span>
                  <span>{comment.content}</span>
                </div>
              </div>
            ))}

            {hasNextPage && (
              <Button
                variant="link"
                size="sm"
                className="text-xs"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Carregando..." : "Carregar mais comentários"}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};