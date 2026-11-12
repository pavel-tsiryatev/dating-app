/** Типы ответов API CAMPUS (см. backend/openapi.json). */
export type Goal = 'DATING' | 'FRIENDS' | 'ACTIVITIES';
export type Role = 'STUDENT' | 'MODERATOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'HIDDEN' | 'BLOCKED';

export interface Photo {
  id: string;
  storageKey: string;
  position?: number;
}

export interface Profile {
  userId?: string;
  name: string;
  university: string;
  institute: string;
  goal: Goal;
  about: string | null;
  interests: string[];
  photos: Photo[];
  hideFromInstitute?: boolean;
  isVisible?: boolean;
  notifications?: boolean;
  theme?: string;
}

export interface Me {
  id: string;
  universityEmail: string;
  isVerified: boolean;
  birthDate: string;
  role: Role;
  status: UserStatus;
  profile: Profile | null;
}

export interface Person {
  userId: string;
  name: string;
  age?: number;
  university: string;
  institute: string;
  goal: Goal;
  about: string | null;
  common?: number;
  photos: Photo[];
  interests: string[];
  quote?: string;
  likedAt?: string;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  clientId: string;
  text: string;
  sentAt: string;
}

export interface Match {
  id: string;
  createdAt: string;
  user: { id: string; name: string | null; status: UserStatus; photo?: string | null };
  lastMessage: Message | null;
}

export interface Meeting {
  id: string;
  matchId: string;
  proposerId: string;
  place: string;
  meetAt: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'DECLINED';
}

export interface Partner {
  id?: string;
  name: string;
  address: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  startsAt: string;
  price: number;
  capacity: number;
  freeSeats: number;
  category?: string | null;
  description?: string | null;
  posterUrl?: string | null;
  published?: boolean;
  partnerId?: string;
  partner?: Partner | null;
}

export interface Ticket {
  eventId: string;
  userId: string;
  status: 'RESERVED' | 'PAID' | 'RELEASED';
  reservedUntil: string | null;
  checkedInAt?: string | null;
  event?: CampusEvent;
}

export interface Payment {
  id: string;
  kind: 'TICKET' | 'PREMIUM';
  amount: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  confirmationUrl?: string | null;
  createdAt?: string;
  paidAt?: string | null;
  requiresRefund?: boolean;
  ticket?: { status: Ticket['status']; eventId: string } | null;
}

export interface Subscription {
  active: boolean;
  endsAt: string | null;
  priceKopecks: number;
}

export interface Report {
  id: string;
  authorId?: string;
  targetId: string;
  reason: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  decision?: string | null;
  target?: { id?: string; status: UserStatus; profile: { name: string } | null };
  messages?: Message[];
}

export interface Stats {
  from: string;
  to: string;
  newUsers: number;
  matches: number;
  meetingsAccepted: number;
  ticketsPaid: number;
  premiumBought: number;
  revenueKopecks: number;
}

export interface DailyStat {
  day: string;
  registrations: number;
}

export interface Pass {
  token: string;
  checkedInAt: string | null;
}

export interface Block {
  blockedId: string;
  blocked: { id: string; profile: { name: string } | null };
}
