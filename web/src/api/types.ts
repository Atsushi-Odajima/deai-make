// Mirrors the server's REST contract. Keeping this in sync is the single
// integration point the future iOS client will also implement.

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

export interface Candidate extends PublicUser {
  sharedInterests: number;
  likedYou: boolean;
  superLikedYou: boolean;
}

export interface IncomingLike extends PublicUser {
  isSuper: boolean;
}

export interface MeUser extends PublicUser {
  email: string;
  birthdate: string | null;
  showAge: boolean;
  discoveryEnabled: boolean;
  createdAt: string;
}

export type SwipeAction = 'like' | 'pass' | 'superlike';

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface MatchSummary {
  id: string;
  user: PublicUser;
  createdAt: string;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  isSuper: boolean;
}

export interface AuthResponse {
  token: string;
  user: MeUser;
}
