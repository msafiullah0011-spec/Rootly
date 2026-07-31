import type { ComponentType } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  Archive,
  ArrowRight,
  Bell,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Folder,
  Home,
  Layers,
  LayoutGrid,
  Link2,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  MoreHorizontal,
  MoreVertical,
  Move,
  Pencil,
  Plus,
  Send,
  Server,
  Settings,
  Share2,
  Sparkles,
  Star,
  Store,
  Upload,
  User,
  UserPlus,
  Volume2,
  X,
} from 'lucide-react-native';

import type { IconKey } from '@/api/schemas';
import { colors } from '@/theme';

/**
 * The app's icon vocabulary.
 *
 * The handoff specifies Lucide line icons at 1.6–1.8 stroke width with round
 * caps, so everything is re-exported from one place. Import icons from here,
 * never from `lucide-react-native` directly — that keeps stroke weights
 * consistent and makes the set swappable.
 */

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}

export type IconComponent = ComponentType<IconProps>;

/** The handoff's default line weight. */
export const STROKE = 1.6;
/** Heavier weight used on small glyphs and chevrons in fields. */
export const STROKE_BOLD = 1.8;
/** Heaviest, used on the FAB plus and check marks. */
export const STROKE_HEAVY = 2;

/**
 * Lucide's bar-chart glyphs include axes; the handoff draws three bare bars,
 * so this one is hand-rolled from the reference path.
 */
function ChartBars({ size = 24, color = colors.ink, strokeWidth = STROKE }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 20v-6M12 20V8M18 20v-9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const Icons: Record<string, IconComponent> = {
  home: Home,
  clock: Clock,
  grid: LayoutGrid,
  settings: Settings,
  plus: Plus,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  close: X,
  check: Check,
  sparkles: Sparkles,
  bell: Bell,
  link: Link2,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  card: CreditCard,
  logOut: LogOut,
  externalLink: ExternalLink,
  moreVertical: MoreVertical,
  moreHorizontal: MoreHorizontal,
  share: Share2,
  upload: Upload,
  filter: Filter,
  send: Send,
  arrowRight: ArrowRight,
  copy: Copy,
  archive: Archive,
  move: Move,
  pencil: Pencil,
  userPlus: UserPlus,
  user: User,
  checklist: CheckSquare,
  comment: MessageSquare,
  layers: Layers,
  star: Star,
  // Shelf / root glyphs, keyed to `IconKey` in the API schema.
  megaphone: Volume2,
  chart: ChartBars,
  server: Server,
  file: FileText,
  folder: Folder,
  store: Store,
  house: Home,
  person: User,
};

export type IconName = keyof typeof Icons;

/**
 * Resolves the shelf/root `icon` field from the API onto a component.
 * Falls back to a folder so an unknown key never renders nothing.
 */
export function iconForKey(key: IconKey | string | undefined): IconComponent {
  if (key && Icons[key]) return Icons[key];
  return Icons.folder;
}

/**
 * The Rootly logomark — a sprouting root (stem, node, branching legs).
 * This is the brand mark, kept custom rather than substituted for a stock icon.
 */
export function RootMark({ size = 48, color = colors.white, strokeWidth = 1.7 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={3.4} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M9 15.5 5.5 20M15 15.5 18.5 20M12 16.4V21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Filled sparkle used on AI cards — Lucide's is stroked, the design's is solid. */
export function SparkleFilled({ size = 18, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3l1.7 5L19 9.7l-5.3 1.6L12 17l-1.7-5.7L5 9.7l5.3-1.7z" fill={color} />
    </Svg>
  );
}

/** Google's four-colour G, for the social sign-in button. */
export function GoogleMark({ size = 19 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <Path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <Path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <Path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </Svg>
  );
}

/** Apple's glyph, for the social sign-in button. */
export function AppleMark({ size = 18, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M17.05 12.54c-.02-2.4 1.96-3.55 2.05-3.61-1.12-1.63-2.86-1.86-3.48-1.88-1.48-.15-2.89.87-3.64.87-.75 0-1.91-.85-3.14-.83-1.61.02-3.1.94-3.93 2.38-1.68 2.91-.43 7.22 1.2 9.58.8 1.15 1.75 2.45 3 2.4 1.2-.05 1.66-.78 3.11-.78 1.45 0 1.86.78 3.13.75 1.29-.02 2.11-1.17 2.9-2.33.91-1.34 1.29-2.63 1.31-2.7-.03-.01-2.51-.96-2.53-3.83zM14.7 5.6c.66-.8 1.11-1.92.99-3.03-.95.04-2.11.63-2.79 1.43-.61.71-1.15 1.85-1.01 2.94 1.06.08 2.15-.54 2.81-1.34z"
      />
    </Svg>
  );
}
