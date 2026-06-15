// Shared API types. These intentionally mirror what the web client (and the
// future iOS app) consume, so the REST contract stays the single source of truth.

export type Gender = 'female' | 'male' | 'nonbinary' | 'other' | 'unspecified';

export interface PublicUser {
  id: string;
  displayName: string;
  age: number | null;
  bio: string;
  headline: string;
  location: string;
  gender: Gender;
  pronouns: string;
  photos: string[];
  interests: string[];
  verified: boolean;
  lastActiveAt: string;
}

export interface MeUser extends PublicUser {
  email: string;
  birthdate: string | null;
  showAge: boolean;
  discoveryEnabled: boolean;
  createdAt: string;
}

export type SwipeAction = 'like' | 'pass' | 'superlike';

export interface MatchSummary {
  id: string;
  user: PublicUser;
  createdAt: string;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  isSuper: boolean;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface AuthResponse {
  token: string;
  user: MeUser;
}
