import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { useAuth } from '../store/auth';
import type {
  BoardComment,
  BoardPost,
  ChatMessage,
  Comment,
  ConversationSummary,
  MeUser,
  Post,
  PublicUser,
} from './types';

/* ----------------------------- Posts / feed ----------------------------- */

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get<{ posts: Post[] }>('/posts/feed'),
    refetchOnMount: 'always',
  });
}

export function useExplore() {
  return useQuery({
    queryKey: ['explore'],
    queryFn: () => api.get<{ posts: Post[] }>('/posts/explore'),
  });
}

export function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-posts', userId],
    queryFn: () => api.get<{ posts: Post[] }>(`/posts/user/${userId}`),
    enabled: !!userId,
  });
}

export function usePost(postId: string | undefined) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.get<{ post: Post }>(`/posts/${postId}`),
    enabled: !!postId,
  });
}

export function usePostComments(postId: string | undefined) {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: () => api.get<{ comments: Comment[] }>(`/posts/${postId}/comments`),
    enabled: !!postId,
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked
        ? api.delete<{ post: Post }>(`/posts/${postId}/like`)
        : api.post<{ post: Post }>(`/posts/${postId}/like`),
    onSuccess: ({ post }) => {
      patchPostEverywhere(qc, post);
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { imageUrl: string; caption?: string }) =>
      api.post<{ post: Post }>('/posts', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['explore'] });
      qc.invalidateQueries({ queryKey: ['user-posts'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post<{ comment: Comment }>(`/posts/${postId}/comments`, { body }),
    onSuccess: ({ comment }) => {
      qc.setQueryData<{ comments: Comment[] }>(['post-comments', postId], (p) =>
        p ? { comments: [...p.comments, comment] } : { comments: [comment] },
      );
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

/** Keep a post's like/comment counts consistent across every cached list. */
function patchPostEverywhere(qc: ReturnType<typeof useQueryClient>, post: Post) {
  for (const key of ['feed', 'explore'] as const) {
    qc.setQueryData<{ posts: Post[] }>([key], (prev) =>
      prev ? { posts: prev.posts.map((p) => (p.id === post.id ? post : p)) } : prev,
    );
  }
  qc.setQueriesData<{ posts: Post[] }>({ queryKey: ['user-posts'] }, (prev) =>
    prev ? { posts: prev.posts.map((p) => (p.id === post.id ? post : p)) } : prev,
  );
  qc.setQueryData<{ post: Post }>(['post', post.id], { post });
}

/* ------------------------------- Users ---------------------------------- */

export function useSearchUsers(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => api.get<{ users: PublicUser[] }>(`/users/search?q=${encodeURIComponent(q)}`),
  });
}

export function useSuggestedUsers() {
  return useQuery({
    queryKey: ['suggested'],
    queryFn: () => api.get<{ users: PublicUser[] }>('/users/suggested'),
  });
}

export function useProfile(idOrUsername: string | undefined) {
  return useQuery({
    queryKey: ['profile', idOrUsername],
    queryFn: () => api.get<{ user: PublicUser }>(`/users/${idOrUsername}`),
    enabled: !!idOrUsername,
  });
}

export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, following }: { userId: string; following: boolean }) =>
      following
        ? api.delete<{ user: PublicUser }>(`/users/${userId}/follow`)
        : api.post<{ user: PublicUser }>(`/users/${userId}/follow`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['suggested'] });
    },
  });
}

export function useSuggestedInterests() {
  return useQuery({
    queryKey: ['interests-meta'],
    queryFn: () => api.get<{ interests: string[] }>('/users/meta/interests'),
    staleTime: Infinity,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Record<string, unknown>>) =>
      api.patch<{ user: MeUser }>('/users/me', patch),
    onSuccess: ({ user }) => {
      // Keep the auth store (avatar, username, identity) in sync.
      useAuth.getState().setUser(user);
      qc.invalidateQueries();
    },
  });
}

/* --------------------------- Conversations / DM ------------------------- */

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get<{ conversations: ConversationSummary[] }>('/conversations'),
    refetchInterval: 1000 * 20,
  });
}

export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => api.get<{ conversation: ConversationSummary }>(`/conversations/${conversationId}`),
    enabled: !!conversationId,
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api.get<{ messages: ChatMessage[] }>(`/messages/${conversationId}`),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.post<{ message: ChatMessage }>(`/messages/${conversationId}`, { body }),
    onSuccess: ({ message }) => {
      qc.setQueryData<{ messages: ChatMessage[] }>(['messages', conversationId], (p) =>
        p ? { messages: [...p.messages, message] } : { messages: [message] },
      );
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/* -------------------------------- Board --------------------------------- */

export function useBoard(category: string) {
  return useQuery({
    queryKey: ['board', category],
    queryFn: () =>
      api.get<{ posts: BoardPost[] }>(`/board${category ? `?category=${category}` : ''}`),
  });
}

export function useBoardPost(id: string | undefined) {
  return useQuery({
    queryKey: ['board-post', id],
    queryFn: () => api.get<{ post: BoardPost }>(`/board/${id}`),
    enabled: !!id,
  });
}

export function useBoardComments(id: string | undefined) {
  return useQuery({
    queryKey: ['board-comments', id],
    queryFn: () => api.get<{ comments: BoardComment[] }>(`/board/${id}/comments`),
    enabled: !!id,
  });
}

export function useCreateBoardPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { category: string; title: string; body?: string; imageUrl?: string }) =>
      api.post<{ post: BoardPost }>('/board', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board'] }),
  });
}

export function useAddBoardComment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post<{ comment: BoardComment }>(`/board/${id}/comments`, { body }),
    onSuccess: ({ comment }) => {
      qc.setQueryData<{ comments: BoardComment[] }>(['board-comments', id], (p) =>
        p ? { comments: [...p.comments, comment] } : { comments: [comment] },
      );
      qc.invalidateQueries({ queryKey: ['board-post', id] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

/* ------------------------------- Safety --------------------------------- */

export function useBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.post(`/safety/block/${userId}`),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useReport() {
  return useMutation({
    mutationFn: (input: { userId: string; reason: string; detail?: string }) =>
      api.post(`/safety/report/${input.userId}`, { reason: input.reason, detail: input.detail }),
  });
}

export function useOpenConversation() {
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<{ conversation: ConversationSummary }>('/conversations', { userId }),
  });
}
