import { 
  useMutation, 
  useQuery, 
  useQueryClient, 
  useInfiniteQuery, 
  InfiniteData
} from '@tanstack/react-query';

import { api } from './api';


export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
}

export interface PostUser {
    name: string;
    email: string;
    avatar_url: string | null;
}

export interface PostResponse {
    id: number; 
    content: string
    mediaUrl?: string;
    postDate: string; 
    user: PostUser;
    totalLikes?: number; 
    totalComments?: number;
}

export interface CommentResponse {
    id: number;
    content: string;
    date: string; 
    commentator: User; 
}

export interface CreatePost {
    userId: number;
    content: string;
    mediaUrl?: string;
}

export interface LikeInput {
  postId: number;
  userId: number;
}

export interface CreateCommentInput {
    postId: number;
    userId: number;
    content: string;
}

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const, 
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
  liked: (postId: number, userId: number) => [...postKeys.all, 'liked', postId, userId] as const,
};

export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (postId: number) => [...commentKeys.lists(), postId] as const,
};


export const getHasUserLiked = async (postId: number, userId: number): Promise<boolean> => {
    const response = await api.get<boolean>(`/posts/${postId}/liked`, {
        params: { userId }
    });
    return response.data;
}


export const addLike = async ({ postId, userId }: LikeInput): Promise<void> => {
    await api.post(`/posts/${postId}/likes`, null, { params: { userId } });
}

export const removeLike = async ({ postId, userId }: LikeInput): Promise<void> => {
    await api.delete(`/posts/${postId}/likes`, { params: { userId } });
}


export const getNewerComments = async (postId: number, quantity: number): Promise<CommentResponse[]> => {
    const response = await api.get<CommentResponse[]>(`/comments/${postId}/new`, {
        params: { quantity }
    });
    return response.data;
}

export const getOlderComments = async (postId: number, lastCommentDate: string, quantity: number): Promise<CommentResponse[]> => {
    const response = await api.get<CommentResponse[]>(`/comments/${postId}/older`, {
        params: { lastCommentDate, quantity }
    });
    return response.data;
}

const fetchComments = async ({ pageParam, postId, quantity }: { pageParam?: string, postId: number, quantity: number }) => {
  if (pageParam) {
    return getOlderComments(postId, pageParam, quantity);
  } else {
    return getNewerComments(postId, quantity);
  }
};


export const createComment = async ({ postId, userId, content }: CreateCommentInput): Promise<CommentResponse> => {
    const response = await api.post<CommentResponse>(`/comments/${postId}`, content, {
        params: { userId },
        headers: { 'Content-Type': 'text/plain' } // Informa ao backend que estamos enviando texto
    });
    return response.data;
}


export const useHasUserLiked = (postId: number, userId: number) => {
    return useQuery<boolean, Error>({
        queryKey: postKeys.liked(postId, userId),
        queryFn: () => getHasUserLiked(postId, userId),
        enabled: !!postId && !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
}

export const useAddLike = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, LikeInput>({
        mutationFn: addLike,
        onSuccess: (data, variables) => {
            const { postId, userId } = variables;
            queryClient.setQueryData(postKeys.liked(postId, userId), true);
            queryClient.invalidateQueries({ queryKey: postKeys.lists() });
        }
    });
}

export const useRemoveLike = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, LikeInput>({
        mutationFn: removeLike,
        onSuccess: (data, variables) => {
            const { postId, userId } = variables;
            queryClient.setQueryData(postKeys.liked(postId, userId), false);
            queryClient.invalidateQueries({ queryKey: postKeys.lists() });
        }
    });
}


export const useGetComments = (postId: number, quantity: number = 3) => {
    return useInfiniteQuery({
        queryKey: commentKeys.list(postId),

        queryFn: ({ pageParam }) => fetchComments({ pageParam, postId, quantity }),
        
        initialPageParam: undefined,
        
        getNextPageParam: (lastPage: CommentResponse[]) => {
            if (!lastPage || lastPage.length === 0) {
              return undefined;
            }
            const lastComment = lastPage[lastPage.length - 1];
            return lastComment?.date;
        },
        enabled: !!postId,
    });
}


export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation<CommentResponse, Error, CreateCommentInput>({
    mutationFn: createComment,
    onSuccess: (newComment, variables) => {
      const { postId } = variables;
      queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });

      queryClient.setQueryData<InfiniteData<PostResponse[]>>(
        postKeys.lists(), // A chave da query infinita de posts
        (oldData) => {
          if (!oldData) {
            return undefined;
          }

          const newPages = oldData.pages.map((page) => {
            return page.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  totalComments: (post.totalComments || 0) + 1,
                };
              }
              return post;
            });
          });
          return {
            ...oldData,
            pages: newPages,
          };
        }
      );
    },
  });
};

export const getNewerPosts = async (quantity: number): Promise<PostResponse[]> => {
    const response = await api.get<PostResponse[]>('/posts/new', {
        params: { quantity }
    });
    return response.data;
}

export const getOlderPosts = async (lastPostDate: string, quantity: number): Promise<PostResponse[]> => {
    const response = await api.get<PostResponse[]>('/posts/older', {
        params: { 
          lastPostDate,
          quantity 
        }
    });
    return response.data;
}

const fetchPosts = async ({ pageParam, quantity }: { pageParam?: string, quantity: number }) => {
  if (pageParam) {
    return getOlderPosts(pageParam, quantity);
  } else {
    return getNewerPosts(quantity);
  }
};


export const useGetPosts = (quantity: number = 3) => {
    return useInfiniteQuery({
        queryKey: postKeys.lists(),

        queryFn: ({ pageParam }) => fetchPosts({ pageParam, quantity }),
        initialPageParam: undefined,

        getNextPageParam: (lastPage: PostResponse[]) => {
            if (!lastPage || lastPage.length === 0) {
              return undefined; 
            }
            
            const lastPost = lastPage[lastPage.length - 1];
            return lastPost?.postDate; 
        },
    });
}

export const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('arquivo', file);

    const response = await api.post<string>('/arquivos/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

export const createPost = async (data: CreatePost): Promise<PostResponse> => {
    const { userId, ...postData } = data; 
    const response = await api.post<PostResponse>('/posts', postData, {
        params: { userId }
    });
    return response.data;
}


export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation<PostResponse, Error, CreatePost>({
        mutationFn: createPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: postKeys.lists() });
        },
    });
}