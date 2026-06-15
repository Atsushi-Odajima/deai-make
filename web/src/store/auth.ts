import { create } from 'zustand';
import { api, getToken, setToken } from '../api/client';
import type { AuthResponse, MeUser } from '../api/types';

interface AuthState {
  user: MeUser | null;
  status: 'loading' | 'authed' | 'guest';
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  setUser: (user: MeUser) => void;
  logout: () => void;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  birthdate: string;
  gender: string;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  bootstrap: async () => {
    if (!getToken()) {
      set({ status: 'guest' });
      return;
    }
    try {
      const { user } = await api.get<{ user: MeUser }>('/auth/me');
      set({ user, status: 'authed' });
    } catch {
      setToken(null);
      set({ user: null, status: 'guest' });
    }
  },

  login: async (email, password) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    setToken(res.token);
    set({ user: res.user, status: 'authed' });
  },

  register: async (input) => {
    const res = await api.post<AuthResponse>('/auth/register', input);
    setToken(res.token);
    set({ user: res.user, status: 'authed' });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    setToken(null);
    set({ user: null, status: 'guest' });
  },
}));
