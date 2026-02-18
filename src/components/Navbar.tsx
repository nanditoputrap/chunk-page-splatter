import { ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAmaliyah } from '@/context/AmaliyahContext';
import GlassCard from './GlassCard';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, handleLogout } = useAmaliyah();

  if (location.pathname === '/') return null;

  const handleBack = () => {
    const path = location.pathname;
    if (path === '/form') navigate('/students');
    else if (path === '/students') navigate('/classes');
    else if (path === '/dashboard') navigate('/classes');
    else {
      handleLogout();
      navigate('/');
    }
  };

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <div className="sticky top-4 z-50 px-4 mb-4">
      <GlassCard className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between rounded-2xl">
        <button onClick={handleBack} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="font-bold text-xs md:text-sm tracking-wide text-foreground uppercase">
          {userRole === 'kesiswaan' ? 'Admin Kesiswaan' : 'Amaliyah Ramadhan'}
        </div>
        <button onClick={handleLogoutClick} className="p-2 hover:bg-destructive/10 rounded-full transition-colors text-muted-foreground hover:text-destructive">
          <LogOut size={20} />
        </button>
      </GlassCard>
    </div>
  );
};

export default Navbar;
