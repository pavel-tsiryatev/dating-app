import {
  Book, Brush, Camera, Clapperboard, Coffee, Cpu, Dice5, Dumbbell, Gamepad2, Heart, type LucideIcon, MessageCircle,
  Mountain, Music, Palette, PartyPopper, Plane, Sparkles, Ticket, Zap,
} from 'lucide-react-native';

const interestIcons: Record<string, LucideIcon> = {
  кино: Clapperboard,
  концерты: Music,
  кофе: Coffee,
  путешествия: Plane,
  музыка: Music,
  спорт: Dumbbell,
  настолки: Dice5,
  искусство: Palette,
  технологии: Cpu,
  книги: Book,
  походы: Mountain,
  игры: Gamepad2,
  фотография: Camera,
  танцы: PartyPopper,
  дизайн: Brush,
};

export const interestIcon = (name: string): LucideIcon => interestIcons[name.trim().toLowerCase()] ?? Sparkles;

/** Иконка категории события для фильтров. */
export const categoryIcon = (name: string): LucideIcon =>
  ({ концерты: Music, встречи: Coffee, вечеринки: PartyPopper, спорт: Dumbbell, кино: Clapperboard } as Record<string, LucideIcon>)[name.toLowerCase()] ?? Ticket;

export const goalIcon = { DATING: Heart, FRIENDS: MessageCircle, ACTIVITIES: Zap } as const;

/** Интересы с сервера приходят в нижнем регистре — показываем с заглавной. */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
