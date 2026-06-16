import { NavLink } from 'react-router-dom';
import { Avatar } from './Avatar';
import { IconBoard, IconHome, IconPlus, IconSearch } from './icons';
import { useAuth } from '../store/auth';

export function BottomNav() {
  const me = useAuth((s) => s.user);

  return (
    <nav className="bottom-nav ig">
      <NavLink to="/app/home" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        {({ isActive }) => <IconHome width={26} height={26} strokeWidth={isActive ? 2.6 : 2} />}
      </NavLink>
      <NavLink to="/app/search" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        {({ isActive }) => <IconSearch width={26} height={26} strokeWidth={isActive ? 2.6 : 2} />}
      </NavLink>
      <NavLink to="/app/create" className="nav-item nav-create" aria-label="投稿する">
        <span className="nav-create-btn">
          <IconPlus width={24} height={24} strokeWidth={2.4} />
        </span>
      </NavLink>
      <NavLink to="/app/board" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        {({ isActive }) => <IconBoard width={26} height={26} strokeWidth={isActive ? 2.6 : 2} />}
      </NavLink>
      <NavLink to="/app/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        {({ isActive }) => (
          <span className={`nav-avatar${isActive ? ' active' : ''}`}>
            <Avatar src={me?.photos[0]} name={me?.displayName ?? ''} size={26} />
          </span>
        )}
      </NavLink>
    </nav>
  );
}
