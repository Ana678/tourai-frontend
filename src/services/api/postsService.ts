import { 
  useMutation, 
  useQuery, 
  useQueryClient, 
  useInfiniteQuery 
} from '@tanstack/react-query';
import { api } from './api';


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
    postLikes?: number; 
    commentsCount?: number;
}

export interface CreatePost {
    userId: number;
    content: string;
    mediaUrl?: string;
}

interface LikeInput {
  postId: number;
  userId: number;
}


export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const, 
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
};



export const createPost = async (data: CreatePost): Promise<PostResponse> => {
    const response = await api.post<PostResponse>('/posts', data);
    return response.data;
};


export const getPostById = async (id: number): Promise<PostResponse> => {
    const response = await api.get<PostResponse>(`/posts/${id}`);
    return response.data;
}

export const deletePost = async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
}

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


export const addLike = async ({ postId, userId }: LikeInput): Promise<void> => {
    await api.post(`/posts/${postId}/likes`, null, {
      params: { userId }
    });
}

export const removeLike = async ({ postId, userId }: LikeInput): Promise<void> => {
    await api.delete(`/posts/${postId}/likes`, {
      params: { userId }
    });
}


export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation<PostResponse, Error, CreatePost>({
        mutationFn: createPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: postKeys.lists() });
        },
    });
};


export const useGetPostById = (id: number) => {
    return useQuery<PostResponse, Error>({
        queryKey: postKeys.detail(id),
        queryFn: () => getPostById(id),
        enabled: !!id, 
    });
}


export const useDeletePost = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, number>({
        mutationFn: deletePost,
        onSuccess: (data, postId) => {
            queryClient.removeQueries({ queryKey: postKeys.detail(postId) });
            queryClient.invalidateQueries({ queryKey: postKeys.lists() });
        }
    });
}

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


export const useAddLike = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, LikeInput>({
        mutationFn: addLike,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: postKeys.detail(variables.postId) });
            queryClient.invalidateQueries({ queryKey: postKeys.lists() });
        }
    });
}


export const useRemoveLike = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, LikeInput>({
        mutationFn: removeLike,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: postKeys.detail(variables.postId) });
            queryClient.invalidateQueries({ queryKey: postKeys.lists() });
        }
    });
}