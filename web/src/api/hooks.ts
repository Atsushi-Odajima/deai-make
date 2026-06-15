import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  Candidate,
  ChatMessage,
  IncomingLike,
  MatchSummary,
  MeUser,
  PublicUser,
  SwipeAction,
} from './types';

export function useDiscovery() {
  return useQuery({
    queryKey: ['discovery'],
    queryFn: () => api.get<{ candidates: Candidate[] }>('/discovery'),
    staleTime: 1000 * 30,
  });
}

export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get<{ matches: MatchSummary[] }>('/matches'),
    refetchInterval: 1000 * 20,
  });
}

export function useIncomingLikes() {
  return useQuery({
    queryKey: ['likes'],
    queryFn: () => api.get<{ likes: IncomingLike[] }>('/matches/likes/incoming'),
    refetchInterval: 1000 * 30,
  });
}

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: () => api.get<{ match: MatchSummary }>(`/matches/${matchId}`),
    enabled: !!matchId,
  });
}

export function useMessages(matchId: string) {
  return useQuery({
    queryKey: ['messages', matchId],
    queryFn: () => api.get<{ messages: ChatMessage[] }>(`/messages/${matchId}`),
    enabled: !!matchId,
  });
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.get<{ user: PublicUser }>(`/users/${userId}`),
    enabled: !!userId,
  });
}

export function useSuggestedInterests() {
  return useQuery({
    queryKey: ['interests-meta'],
    queryFn: () => api.get<{ interests: string[] }>('/users/meta/interests'),
    staleTime: Infinity,
  });
}

export function useSwipe() {
  return useMutation({
    mutationFn: (input: { targetId: string; action: SwipeAction }) =>
      api.post<{ matched: boolean; match: MatchSummary | null }>('/swipes', input),
  });
}

export function useSendMessage(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.post<{ message: ChatMessage }>(`/messages/${matchId}`, { body }),
    onSuccess: ({ message }) => {
      qc.setQueryData<{ messages: ChatMessage[] }>(['messages', matchId], (prev) =>
        prev ? { messages: [...prev.messages, message] } : { messages: [message] },
      );
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Record<string, unknown>>) =>
      api.patch<{ user: MeUser }>('/users/me', patch),
    onSuccess: () => qc.invalidateQueries(),
  });
}

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
