import { ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAmaliyah } from '@/context/AmaliyahContext';
import GlassCard from './GlassCard';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, handleLogout } = useAmaliyah();

  if (location.pathname === '/') return null;

  // Hide back button if inside a class route (e.g. /classes/:id/*)
  const segments = location.pathname.split('/').filter(Boolean);
  const isInClass = segments[0] === 'classes' && segments[1] && (!segments[2] || ['students', 'form', 'dashboard'].includes(segments[2]));

  const handleBack = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);

    // /classes/:id/students, /classes/:id/form, /classes/:id/dashboard
    if (segments[0] === 'classes' && segments[1]) {
      if (segments[2] === 'form') {
        navigate(`/classes/${segments[1]}/students`);
        return;
      }
      if (segments[2] === 'students' || segments[2] === 'dashboard') {
        // teacher/kesiswaan back should go to home
        if (userRole === 'teacher' || userRole === 'kesiswaan') {
          navigate('/home');
        } else {
          navigate('/classes');
        }
        return;
      }
    }

    if (path === '/') {
      // nothing to do
      return;
    }

    // fallback for any other path
    handleLogout();
    // send user to home dashboard instead of root after logout
    navigate('/home');
  };

  const handleLogoutClick = () => {
    const role = userRole;
    handleLogout();
    // for teacher or kesiswaan, go to /home; otherwise keep existing behavior
    if (role === 'teacher' || role === 'kesiswaan') navigate('/home');
    else navigate('/');
  };

  return (
    <div className="sticky top-4 z-50 px-4 mb-4">
      <GlassCard className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between rounded-2xl">
        {/* Hide back button if in class route */}
        {isInClass ? <div style={{ width: 40 }} /> : (
          <button onClick={handleBack} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
        )}
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
