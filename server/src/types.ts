// Shared API types — the REST contract that both the web client and the future
// iOS app implement.

export type Gender = 'female' | 'male' | 'nonbinary' | 'other' | 'unspecified';

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  age: number | null;
  bio: string;
  headline: string;
  location: string;
  link: string;
  occupation: string;
  bodyType: string;
  weightNote: string;
  height: number;
  gender: Gender;
  pronouns: string;
  photos: string[];
  interests: string[];
  verified: boolean;
  lastActiveAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
  followsYou: boolean;
}

export interface MeUser extends PublicUser {
  email: string;
  birthdate: string | null;
  showAge: boolean;
  showOccupation: boolean;
  showBodyType: boolean;
  showWeight: boolean;
  showHeight: boolean;
  discoveryEnabled: boolean;
  createdAt: string;
}

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
}

export interface Post {
  id: string;
  author: PostAuthor;
  imageUrl: string; // cover (images[0]) — kept for grids/thumbnails
  images: string[]; // full carousel
  caption: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
}

export type NotificationType =
  | 'follow'
  | 'like'
  | 'comment'
  | 'board_comment'
  | 'story_reaction'
  | 'footprint';

export interface AppNotification {
  id: string;
  type: NotificationType;
  actor: PostAuthor;
  entityId: string;
  preview: string; // post cover thumbnail when relevant
  createdAt: string;
  read: boolean;
}

export type StoryReaction = 'like' | 'akan' | 'bad' | 'helpful';

export interface StoryItem {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  viewed: boolean;
  myReaction: StoryReaction | null;
  viewerCount: number; // meaningful to the story owner
}

export interface StoryGroup {
  user: PostAuthor;
  items: StoryItem[];
  hasUnseen: boolean;
  isSelf: boolean;
}

export interface StoryViewerEntry {
  user: PostAuthor;
  reaction: StoryReaction | null;
  viewedAt: string;
}

export interface Comment {
  id: string;
  author: PostAuthor;
  body: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface ConversationSummary {
  id: string;
  user: PostAuthor;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export interface BoardPost {
  id: string;
  author: PostAuthor;
  category: string;
  title: string;
  body: string;
  imageUrl: string;
  createdAt: string;
  commentCount: number;
}

export interface BoardComment {
  id: string;
  author: PostAuthor;
  body: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: MeUser;
}
