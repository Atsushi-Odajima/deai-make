import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

export function AppLayout() {
  return (
    <div className="screen">
      <div className="tab-content">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
