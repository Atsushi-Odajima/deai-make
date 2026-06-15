import { NavLink } from 'react-router-dom';
import { useIncomingLikes, useMatches } from '../api/hooks';
import { IconCards, IconChat, IconSparkle, IconUser } from './icons';

export function BottomNav() {
  const matches = useMatches();
  const likes = useIncomingLikes();

  const unread =
    matches.data?.matches.reduce((sum, m) => sum + m.unreadCount, 0) ?? 0;
  const likeCount = likes.data?.likes.length ?? 0;

  const items = [
    { to: '/app/discover', label: '見つける', icon: IconCards, count: 0 },
    { to: '/app/likes', label: 'いいね', icon: IconSparkle, count: likeCount },
    { to: '/app/matches', label: 'トーク', icon: IconChat, count: unread },
    { to: '/app/profile', label: 'プロフィール', icon: IconUser, count: 0 },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(({ to, label, icon: Icon, count }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon width={24} height={24} />
          <span>{label}</span>
          {count > 0 && <span className="nav-count">{count > 99 ? '99+' : count}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
